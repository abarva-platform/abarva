import fs from "node:fs/promises";
import path from "node:path";

import { chromium, type BrowserContext, type Page } from "@playwright/test";

import { CANDIDATE_PREVIEW_BANNER } from "../../src/lib/enterprise-data/candidate-preview-enablement/candidate-preview-enablement";
import {
  SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE,
  type CandidatePreviewModule,
} from "../../src/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";
import {
  createIsolatedPersonaContext,
  resolveCrawlPersonas,
} from "../../src/lib/crawl/persona-switcher";
import type { CrawlFinding, CrawlSeverity } from "../../src/lib/crawl/baseline-compare";

interface Args {
  baseUrl: string;
  outputDir: string;
  module: CandidatePreviewModule;
  persona: string;
}

interface CandidatePreviewProof {
  runId: string;
  baseUrl: string;
  targetPath: string;
  targetUrl: string;
  personaKey: string;
  tenantKey: string;
  candidateVersionId: string;
  module: CandidatePreviewModule;
  createdAt: string;
  routeStatus: {
    unauthenticatedRedirectedToSignIn: boolean;
    signInRedirectPreservedTarget: boolean;
    signedInNavigatedDirectlyToTarget: boolean;
    signedInFinalPathname: string;
  };
  pageStatus: {
    rendered: boolean;
    bannerVisible: boolean;
    explicitRequestAcceptedVisible: boolean;
    selectedModuleVisible: boolean;
    guardrailIndicatorsVisible: boolean;
  };
  guardrails: {
    candidatePromoted: boolean | null;
    activeTenantAccessLayerUpdated: boolean | null;
    productionTenantDataWritten: boolean | null;
    moduleRuntimeConsumptionChanged: boolean | null;
    moduleReadsCandidateByDefault: boolean | null;
  };
  truthSplit: {
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    productionTenantDataWritten: false;
    moduleRuntimeConsumptionChanged: false;
    moduleReadsCandidateByDefault: false;
  };
  artifacts: {
    htmlPath: string;
    screenshotPath: string;
  };
}

interface CandidatePreviewComparison {
  runId: string;
  p0: number;
  p1: number;
  p2: number;
  findings: CrawlFinding[];
}

const REQUIRED_FALSE_GUARDRAILS = [
  "candidatePromoted",
  "activeTenantAccessLayerUpdated",
  "productionTenantDataWritten",
  "moduleRuntimeConsumptionChanged",
  "moduleReadsCandidateByDefault",
] as const;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.env.GITHUB_SHA?.slice(0, 8) ?? "local"}`;
  const runDir = path.resolve(args.outputDir, runId);
  await fs.mkdir(runDir, { recursive: true });

  const targetPath = buildTargetPath(args);
  const targetUrl = new URL(targetPath, args.baseUrl).toString();
  const browser = await launchBrowser();
  let signedInContext: BrowserContext | null = null;

  try {
    const redirectStatus = await proveUnauthenticatedRedirect(browser, args.baseUrl, targetUrl);
    const persona = resolveCrawlPersonas(args.persona)[0];
    if (!persona) {
      throw new Error(`No crawl persona matched ${args.persona}`);
    }

    const activeContext = await createIsolatedPersonaContext(browser, persona, {
      baseUrl: args.baseUrl,
    });
    signedInContext = activeContext.context;
    const signedInProof = await proveSignedInPreviewPage(
      activeContext.page,
      targetUrl,
      targetPath,
      args,
      runDir,
    );

    const proof: CandidatePreviewProof = {
      runId,
      baseUrl: args.baseUrl,
      targetPath,
      targetUrl,
      personaKey: persona.key,
      tenantKey: SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.tenantKey,
      candidateVersionId: SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.candidateVersionId,
      module: args.module,
      createdAt: new Date().toISOString(),
      routeStatus: {
        ...redirectStatus,
        signedInNavigatedDirectlyToTarget:
          signedInProof.finalPathname === "/admin/candidate-preview",
        signedInFinalPathname: signedInProof.finalPathname,
      },
      pageStatus: signedInProof.pageStatus,
      guardrails: signedInProof.guardrails,
      truthSplit: {
        activeTenantAccessLayerUpdated: false,
        candidatePromoted: false,
        productionTenantDataWritten: false,
        moduleRuntimeConsumptionChanged: false,
        moduleReadsCandidateByDefault: false,
      },
      artifacts: signedInProof.artifacts,
    };
    const comparison = compareCandidatePreviewProof(proof);

    await writeProofArtifacts(args.outputDir, runDir, proof, comparison);
    console.log(
      `Candidate preview crawl complete: ${comparison.p0} P0, ${comparison.p1} P1, ${comparison.p2} P2`,
    );
    console.log(`candidate_preview_route_status:${JSON.stringify(proof.routeStatus)}`);
    console.log(`Artifacts: ${runDir}`);

    if (comparison.p0 > 0) {
      process.exitCode = 2;
    }
  } finally {
    await signedInContext?.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

function buildTargetPath(args: Args): string {
  const params = new URLSearchParams({
    preview: "enabled",
    tenantKey: SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.tenantKey,
    candidateVersionId: SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.candidateVersionId,
    module: args.module,
    operatorId: "candidate-preview-crawl",
    previewReason: "Focused signed-in candidate preview route proof.",
    ack: "not-active-truth",
  });
  return `/admin/candidate-preview?${params.toString()}`;
}

async function launchBrowser() {
  const browserChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL?.trim();
  return chromium.launch({
    headless: true,
    ...(browserChannel ? { channel: browserChannel } : {}),
  });
}

async function proveUnauthenticatedRedirect(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseUrl: string,
  targetUrl: string,
): Promise<{
  unauthenticatedRedirectedToSignIn: boolean;
  signInRedirectPreservedTarget: boolean;
}> {
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    const currentUrl = new URL(page.url());
    const redirectParam = currentUrl.searchParams.get("redirect") ?? "";
    return {
      unauthenticatedRedirectedToSignIn:
        currentUrl.pathname === "/sign-in" ||
        currentUrl.pathname.startsWith("/sign-in/"),
      signInRedirectPreservedTarget:
        redirectParam.includes("/admin/candidate-preview") &&
        redirectParam.includes("preview=enabled") &&
        redirectParam.includes("ack=not-active-truth"),
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function proveSignedInPreviewPage(
  page: Page,
  targetUrl: string,
  targetPath: string,
  args: Args,
  runDir: string,
): Promise<{
  finalPathname: string;
  pageStatus: CandidatePreviewProof["pageStatus"];
  guardrails: CandidatePreviewProof["guardrails"];
  artifacts: CandidatePreviewProof["artifacts"];
}> {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
  const finalUrl = new URL(page.url());
  const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
  const guardrails = await readGuardrailIndicators(page);

  const htmlPath = path.join(runDir, "candidate-preview.html");
  const screenshotPath = path.join(runDir, "candidate-preview.png");
  await fs.writeFile(htmlPath, await page.content());
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

  return {
    finalPathname: finalUrl.pathname,
    pageStatus: {
      rendered: includesText(bodyText, "Candidate Preview Mode"),
      bannerVisible: includesText(bodyText, CANDIDATE_PREVIEW_BANNER),
      explicitRequestAcceptedVisible: includesText(
        bodyText,
        "Explicit request accepted",
      ),
      selectedModuleVisible: includesText(
        bodyText,
        `${args.module} preview packet`,
      ),
      guardrailIndicatorsVisible: REQUIRED_FALSE_GUARDRAILS.every((label) =>
        includesText(bodyText, label),
      ),
    },
    guardrails,
    artifacts: {
      htmlPath,
      screenshotPath,
    },
  };
}

async function readGuardrailIndicators(
  page: Page,
): Promise<CandidatePreviewProof["guardrails"]> {
  const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
  const values: Record<string, boolean | null> = {};

  for (const label of REQUIRED_FALSE_GUARDRAILS) {
    values[label] = readVisibleBooleanForLabel(bodyText, label);
  }

  return {
    candidatePromoted: values.candidatePromoted ?? null,
    activeTenantAccessLayerUpdated:
      values.activeTenantAccessLayerUpdated ?? null,
    productionTenantDataWritten: values.productionTenantDataWritten ?? null,
    moduleRuntimeConsumptionChanged:
      values.moduleRuntimeConsumptionChanged ?? null,
    moduleReadsCandidateByDefault:
      values.moduleReadsCandidateByDefault ?? null,
  };
}

function includesText(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function readVisibleBooleanForLabel(
  bodyText: string,
  label: string,
): boolean | null {
  const escaped = escapeRegExp(label);
  const match = bodyText.match(new RegExp(`${escaped}\\s+(true|false)`, "i"));
  if (!match?.[1]) return null;
  return match[1].toLowerCase() === "true";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareCandidatePreviewProof(
  proof: CandidatePreviewProof,
): CandidatePreviewComparison {
  const findings: CrawlFinding[] = [];
  const add = (
    severity: CrawlSeverity,
    dimension: string,
    message: string,
    evidence?: Record<string, unknown>,
  ) => {
    findings.push({
      severity,
      tenantKey: proof.tenantKey,
      personaKey: proof.personaKey,
      surfaceId: "admin-candidate-preview",
      dimension,
      message,
      evidence,
    });
  };

  if (!proof.routeStatus.unauthenticatedRedirectedToSignIn) {
    add(
      "P0",
      "auth-route-preservation",
      "Unauthenticated candidate preview request did not redirect to sign-in.",
      proof.routeStatus,
    );
  }
  if (!proof.routeStatus.signInRedirectPreservedTarget) {
    add(
      "P0",
      "auth-route-preservation",
      "Clerk sign-in redirect did not preserve the candidate preview target route.",
      proof.routeStatus,
    );
  }
  if (!proof.routeStatus.signedInNavigatedDirectlyToTarget) {
    add(
      "P0",
      "signed-in-route",
      "Signed-in browser did not land on /admin/candidate-preview.",
      proof.routeStatus,
    );
  }
  for (const [key, value] of Object.entries(proof.pageStatus)) {
    if (!value) {
      add("P0", "candidate-preview-render", `${key} was not proven true.`, {
        pageStatus: proof.pageStatus,
      });
    }
  }
  for (const label of REQUIRED_FALSE_GUARDRAILS) {
    if (proof.guardrails[label] !== false) {
      add(
        "P0",
        "candidate-preview-guardrails",
        `${label} was not visibly false on the candidate preview page.`,
        { guardrails: proof.guardrails },
      );
    }
  }

  return {
    runId: proof.runId,
    p0: findings.filter((finding) => finding.severity === "P0").length,
    p1: findings.filter((finding) => finding.severity === "P1").length,
    p2: findings.filter((finding) => finding.severity === "P2").length,
    findings,
  };
}

async function writeProofArtifacts(
  outputDir: string,
  runDir: string,
  proof: CandidatePreviewProof,
  comparison: CandidatePreviewComparison,
): Promise<void> {
  await fs.writeFile(
    path.join(runDir, "candidate-preview-proof.json"),
    JSON.stringify(proof, null, 2),
  );
  await fs.writeFile(
    path.join(runDir, "comparison.json"),
    JSON.stringify(comparison, null, 2),
  );
  await fs.writeFile(
    path.resolve(outputDir, "latest.json"),
    JSON.stringify({ proof, comparison }, null, 2),
  );
  await fs.writeFile(
    path.join(runDir, "summary.md"),
    renderSummary(proof, comparison),
  );
}

function renderSummary(
  proof: CandidatePreviewProof,
  comparison: CandidatePreviewComparison,
): string {
  return [
    "# Candidate Preview Crawl Proof",
    "",
    `- Run: ${proof.runId}`,
    `- Target: ${proof.targetPath}`,
    `- Persona: ${proof.personaKey}`,
    `- Candidate: ${proof.candidateVersionId}`,
    `- Module: ${proof.module}`,
    `- P0/P1/P2: ${comparison.p0}/${comparison.p1}/${comparison.p2}`,
    `- Signed-in direct route: ${proof.routeStatus.signedInNavigatedDirectlyToTarget}`,
    `- Sign-in preserved target: ${proof.routeStatus.signInRedirectPreservedTarget}`,
    `- Banner visible: ${proof.pageStatus.bannerVisible}`,
    `- candidatePromoted: ${proof.guardrails.candidatePromoted}`,
    `- activeTenantAccessLayerUpdated: ${proof.guardrails.activeTenantAccessLayerUpdated}`,
    `- productionTenantDataWritten: ${proof.guardrails.productionTenantDataWritten}`,
    `- moduleRuntimeConsumptionChanged: ${proof.guardrails.moduleRuntimeConsumptionChanged}`,
    "",
  ].join("\n");
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    baseUrl: process.env.CRAWL_BASE_URL ?? "https://app.abarva.ai",
    outputDir: "audit-artifacts/candidate-preview-crawl",
    module: "home",
    persona: "agent-skyharbor",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--base-url" && next) args.baseUrl = next;
    if (arg === "--output-dir" && next) args.outputDir = next;
    if (arg === "--persona" && next) args.persona = next;
    if (arg === "--module" && isCandidatePreviewModule(next)) {
      args.module = next;
    }
  }

  return args;
}

function isCandidatePreviewModule(
  value: string | undefined,
): value is CandidatePreviewModule {
  return (
    value === "home" ||
    value === "intelligence" ||
    value === "moves" ||
    value === "source" ||
    value === "tower"
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
