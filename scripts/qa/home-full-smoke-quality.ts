import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import {
  explainModuleContext,
  getModuleContext,
} from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import type {
  ModuleContextRecord,
  ModuleContextRelationship,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "@/lib/enterprise-data/contracts/module-context-apis";

type Severity = "P0" | "P1" | "P2";
type Verdict = "pass" | "watch" | "fail";
type AuditMode = "full" | "server" | "ava";

interface Args {
  mode: AuditMode;
  baseUrl: string;
  outDir: string;
  failOn: Severity;
}

interface TenantConfig {
  tenantKey: string;
  displayName: string;
  expectedNames: string[];
  personaSlug?: string;
  browserRequired: boolean;
  serverOnlyReason?: string;
}

interface DimensionConfig {
  label: string;
  domain: ModuleContextRequestedDomain;
  minRowsForStrong?: number;
}

interface Finding {
  id: string;
  severity: Severity;
  tenantKey: string;
  dimension?: string;
  tab?: string;
  category: string;
  message: string;
  evidence?: string;
}

interface TabResult {
  tenantKey: string;
  dimension: string;
  tab: "Summary" | "Data" | "Gaps" | "Sources" | "Relationships";
  verdict: Verdict;
  scores: QualityScores;
  notes: string[];
}

interface QualityScores {
  factualAccuracy: number;
  tenantSpecificity: number;
  executiveClarity: number;
  evidenceSourceGrounding: number;
  relationshipTruthfulness: number;
  decisionReadinessCaveats: number;
  clutterReadability: number;
  duplicateConflictControl: number;
  unsupportedModuleClaims: number;
}

interface DimensionResult {
  tenantKey: string;
  dimension: string;
  domain: ModuleContextRequestedDomain;
  sourceRows: number;
  acceptedRecords: number;
  renderedRecordCount: number;
  evidenceRefs: number;
  gaps: number;
  relationships: number;
  relationshipCandidates: number;
  sourceMode: string;
  activeVersionId: string | null;
  verdict: Verdict;
  scores: QualityScores;
  notes: string[];
}

interface TenantResult {
  tenantKey: string;
  displayName: string;
  sourceMode: string;
  activeVersionId: string | null;
  candidateVersionId: string | null;
  records: number;
  evidenceRefs: number;
  validatedRelationships: number;
  relationshipCandidates: number;
  gaps: number;
  contextCompleteness: ServedModuleContextPacket["contextCompleteness"];
  browser: {
    status: "tested" | "skipped" | "failed";
    personaSlug?: string;
    storageState?: string | null;
    reason?: string;
    url?: string;
  };
  ava: {
    status: "tested" | "skipped" | "failed";
    promptsTested: number;
    pass: number;
    watch: number;
    fail: number;
    reason?: string;
  };
  verdict: Verdict;
  notes: string[];
}

interface AvaResult {
  tenantKey: string;
  question: string;
  status: number | null;
  verdict: Verdict;
  answerPreview: string;
  noCandidateLeakage: boolean;
  noCrossTenantLeakage: boolean;
  noUnsupportedSavingsOrOutcome: boolean;
  executiveReadable: boolean;
  caveated: boolean;
  error?: string;
}

interface BrowserArtifact {
  tenantKey: string;
  kind: "screenshot" | "dom";
  route: string;
  dimension?: string;
  tab?: string;
  path: string;
}

const repoRoot = process.cwd();

const TENANTS: TenantConfig[] = [
  {
    tenantKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    expectedNames: ["Airline Demo", "SkyHarbor"],
    personaSlug: "agent-skyharbor",
    browserRequired: true,
  },
  {
    tenantKey: "meridian-health",
    displayName: "Meridian Health",
    expectedNames: ["Healthcare Demo", "Meridian"],
    personaSlug: "agent-meridian",
    browserRequired: true,
  },
  {
    tenantKey: "apex-retail",
    displayName: "Apex Retail",
    expectedNames: ["Retail Demo", "Apex"],
    personaSlug: "agent-apexretail",
    browserRequired: true,
  },
  {
    tenantKey: "first-capital-financial",
    displayName: "First Capital Financial",
    expectedNames: ["Financial Services Demo", "First Capital"],
    personaSlug: "agent-firstcapital",
    browserRequired: true,
  },
  {
    tenantKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    expectedNames: ["Lakeshore Holdings", "Lakeshore"],
    personaSlug: "agent-lakeshore",
    browserRequired: true,
  },
  {
    tenantKey: "lakeshore-industries",
    displayName: "Lakeshore Industries",
    expectedNames: ["Lakeshore Industries"],
    browserRequired: false,
    serverOnlyReason:
      "No dedicated signed-in automation persona is available yet. Server/module-context proof is still required.",
  },
];

const DIMENSIONS: DimensionConfig[] = [
  { label: "Functions", domain: "functions", minRowsForStrong: 5 },
  {
    label: "Applications & Systems",
    domain: "applications_systems",
    minRowsForStrong: 10,
  },
  {
    label: "Vendors & Contracts",
    domain: "vendors_contracts",
    minRowsForStrong: 5,
  },
  {
    label: "Data Assets & Integrations",
    domain: "data_assets_integrations",
    minRowsForStrong: 8,
  },
  {
    label: "Programs & Priorities",
    domain: "programs_priorities",
    minRowsForStrong: 4,
  },
  { label: "Risks & Controls", domain: "risks_controls", minRowsForStrong: 4 },
  {
    label: "Metrics & Outcomes",
    domain: "metrics_outcomes",
    minRowsForStrong: 4,
  },
];

const ALL_DOMAINS: ModuleContextRequestedDomain[] = [
  "enterprise_profile",
  ...DIMENSIONS.map((dimension) => dimension.domain),
  "relationships",
  "evidence_sources",
];

const AVA_QUESTIONS = [
  "Explain this enterprise in plain English.",
  "What does AbarVa know about this tenant?",
  "What can I safely ask from this Home context?",
  "What is missing before cross-domain reasoning?",
  "Which areas are ready for Intelligence, Moves, Source, or Tower?",
];

const DISALLOWED_PRIMARY_LANGUAGE = /\b(?:V4|V6|V7)\b/i;
const CANDIDATE_LEAK =
  /candidate preview is active|inactive candidate data is active|candidate data shown by default/i;
const UNSUPPORTED_VALUE_CLAIM =
  /\b(?:realized value|verified savings|guaranteed savings|20\s*[-–]\s*30%|20\s*[-–]\s*25%|outcome achieved)\b/i;
const NORTHSTAR = /northstar/i;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await resetOutput(args.outDir);

  const generatedAt = new Date().toISOString();
  const findings: Finding[] = [];
  const tenantResults: TenantResult[] = [];
  const dimensionResults: DimensionResult[] = [];
  const tabResults: TabResult[] = [];
  const avaResults: AvaResult[] = [];
  const screenshots: BrowserArtifact[] = [];
  const domArtifacts: BrowserArtifact[] = [];

  const contexts = new Map<string, ServedModuleContextPacket>();

  for (const tenant of TENANTS) {
    const context = await getModuleContext(
      {
        tenantKey: tenant.tenantKey,
        moduleKey: "home",
        purpose: "context_summary",
        mode: "active",
        requestedDomains: ALL_DOMAINS,
        relationshipPolicy: "validated_and_candidates",
        evidencePolicy: "lineage_required",
      },
      { repoRoot, generatedAt },
    );
    contexts.set(tenant.tenantKey, context);
    await explainModuleContext(
      {
        tenantKey: tenant.tenantKey,
        moduleKey: "home",
        purpose: "context_summary",
        mode: "active",
        requestedDomains: ALL_DOMAINS,
      },
      { repoRoot, generatedAt },
    );

    findings.push(...evaluateTenantGuardrails(tenant, context));

    const dimensionArtifacts = evaluateDimensions(tenant, context);
    dimensionResults.push(...dimensionArtifacts.dimensionResults);
    tabResults.push(...dimensionArtifacts.tabResults);
    findings.push(...dimensionArtifacts.findings);

    const tenantResult: TenantResult = {
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      sourceMode: context.sourceMode,
      activeVersionId: context.activeTenantAccessVersionId,
      candidateVersionId: context.candidateVersionId,
      records: context.records.length,
      evidenceRefs: context.evidenceRefs.length,
      validatedRelationships: context.validatedRelationships.length,
      relationshipCandidates: context.relationshipCandidates.length,
      gaps: context.gaps.length,
      contextCompleteness: context.contextCompleteness,
      browser: tenant.browserRequired
        ? { status: "skipped", personaSlug: tenant.personaSlug }
        : {
            status: "skipped",
            reason: tenant.serverOnlyReason,
          },
      ava: {
        status: "skipped",
        promptsTested: 0,
        pass: 0,
        watch: 0,
        fail: 0,
        reason: "aVa browser/API smoke requires signed-in storageState.",
      },
      verdict: "pass",
      notes: [],
    };
    tenantResults.push(tenantResult);
  }

  if (args.mode !== "server") {
    const browserProof = await runBrowserProof({
      args,
      contexts,
    });
    avaResults.push(...browserProof.avaResults);
    screenshots.push(...browserProof.screenshots);
    domArtifacts.push(...browserProof.domArtifacts);
    for (const browserTenant of browserProof.tenantUpdates) {
      const target = tenantResults.find(
        (tenant) => tenant.tenantKey === browserTenant.tenantKey,
      );
      if (target) {
        target.browser = browserTenant.browser;
        target.ava = browserTenant.ava;
      }
    }
    findings.push(...browserProof.findings);
  }

  for (const result of tenantResults) {
    const tenantFindings = findings.filter(
      (finding) => finding.tenantKey === result.tenantKey,
    );
    result.verdict = verdictForFindings(tenantFindings);
    result.notes = tenantNotes(result, tenantFindings);
  }

  await writeReportBundle({
    args,
    generatedAt,
    tenantResults,
    dimensionResults,
    tabResults,
    avaResults,
    findings,
    screenshots,
    domArtifacts,
  });

  const grouped = groupFindings(findings);
  const status =
    grouped.P0.length > 0
      ? "Home full smoke/content QA failed with findings"
      : grouped.P1.length > 0 || grouped.P2.length > 0
        ? "Home full smoke/content QA passed with watch items"
        : "Home full smoke/content QA passed";

  console.log(
    JSON.stringify(
      {
        status,
        outputDir: path.relative(repoRoot, args.outDir),
        tenantsTested: tenantResults.length,
        dimensionsTested: dimensionResults.length,
        tabsTested: tabResults.length,
        avaPromptsTested: avaResults.length,
        p0: grouped.P0.length,
        p1: grouped.P1.length,
        p2: grouped.P2.length,
      },
      null,
      2,
    ),
  );

  if (shouldFail(args.failOn, grouped)) {
    throw new Error(
      `${status}: P0=${grouped.P0.length} P1=${grouped.P1.length} P2=${grouped.P2.length}`,
    );
  }
}

function evaluateTenantGuardrails(
  tenant: TenantConfig,
  context: ServedModuleContextPacket,
): Finding[] {
  const findings: Finding[] = [];
  const guardrails = context.guardrails;
  const checks: Array<[boolean, string]> = [
    [guardrails.candidateDataConsumed, "candidateDataConsumed"],
    [guardrails.homeReadsCandidateByDefault, "homeReadsCandidateByDefault"],
    [
      guardrails.defaultModuleReadsCandidateData,
      "defaultModuleReadsCandidateData",
    ],
    [
      guardrails.activeTenantAccessLayerUpdated,
      "activeTenantAccessLayerUpdated",
    ],
    [guardrails.productionTenantDataWritten, "productionTenantDataWritten"],
    [guardrails.candidatePromoted, "candidatePromoted"],
    [
      guardrails.moduleRuntimeConsumptionChanged,
      "moduleRuntimeConsumptionChanged",
    ],
  ];
  for (const [failed, key] of checks) {
    if (failed) {
      findings.push({
        id: `${tenant.tenantKey}:guardrail:${key}`,
        severity: "P0",
        tenantKey: tenant.tenantKey,
        category: "active/candidate separation",
        message: `Home module-context guardrail failed: ${key}.`,
      });
    }
  }
  if (context.mode !== "active") {
    findings.push({
      id: `${tenant.tenantKey}:mode:not-active`,
      severity: "P0",
      tenantKey: tenant.tenantKey,
      category: "active/candidate separation",
      message: `Default Home context resolved to ${context.mode}, not active.`,
    });
  }
  if (context.sourceMode !== "active_tenant_access") {
    findings.push({
      id: `${tenant.tenantKey}:source-mode:${context.sourceMode}`,
      severity: "P1",
      tenantKey: tenant.tenantKey,
      category: "active module-context",
      message: `Home context source mode is ${context.sourceMode}; expected active_tenant_access for active tenants.`,
    });
  }
  if (!context.activeTenantAccessVersionId) {
    findings.push({
      id: `${tenant.tenantKey}:active-version-missing`,
      severity: "P1",
      tenantKey: tenant.tenantKey,
      category: "active module-context",
      message:
        "No activeTenantAccessVersionId was present in the Home module-context packet.",
    });
  }
  if (NORTHSTAR.test(JSON.stringify(context.records))) {
    findings.push({
      id: `${tenant.tenantKey}:northstar-leak`,
      severity: "P0",
      tenantKey: tenant.tenantKey,
      category: "tenant isolation",
      message:
        "Retired Northstar content appeared in active Home module-context records.",
    });
  }
  const otherTenants = TENANTS.filter(
    (other) => other.tenantKey !== tenant.tenantKey,
  )
    .flatMap((other) => other.expectedNames)
    .filter((name) => {
      if (name.length <= 4 || tenant.expectedNames.includes(name)) return false;
      const sameLakeshoreFamily =
        tenant.tenantKey.startsWith("lakeshore-") && /^lakeshore\b/i.test(name);
      return !sameLakeshoreFamily;
    });
  const serialized = JSON.stringify(context.records).toLowerCase();
  const leaked = otherTenants.find((name) =>
    serialized.includes(name.toLowerCase()),
  );
  if (leaked) {
    findings.push({
      id: `${tenant.tenantKey}:cross-tenant:${slug(leaked)}`,
      severity: "P0",
      tenantKey: tenant.tenantKey,
      category: "tenant isolation",
      message: `Possible cross-tenant fact detected in active Home context: ${leaked}.`,
    });
  }
  return findings;
}

function evaluateDimensions(
  tenant: TenantConfig,
  context: ServedModuleContextPacket,
): {
  dimensionResults: DimensionResult[];
  tabResults: TabResult[];
  findings: Finding[];
} {
  const dimensionResults: DimensionResult[] = [];
  const tabResults: TabResult[] = [];
  const findings: Finding[] = [];

  for (const dimension of DIMENSIONS) {
    const domainSummary = context.domains.find(
      (domain) => domain.domain === dimension.domain,
    );
    const records = context.records.filter(
      (record) => record.domain === dimension.domain,
    );
    const evidenceIds = new Set(
      records.flatMap((record) => record.sourceEvidenceIds),
    );
    const evidenceRefs = context.evidenceRefs.filter(
      (evidence) =>
        evidence.domain === dimension.domain ||
        evidenceIds.has(evidence.evidenceId),
    );
    const gaps = context.gaps.filter((gap) => gap.domain === dimension.domain);
    const relationships = relationshipsFor(
      records,
      context.validatedRelationships,
    );
    const relationshipCandidates = relationshipsFor(
      records,
      context.relationshipCandidates,
    );
    const notes: string[] = [];

    if (!domainSummary) {
      findings.push({
        id: `${tenant.tenantKey}:${dimension.domain}:missing-domain`,
        severity: "P1",
        tenantKey: tenant.tenantKey,
        dimension: dimension.label,
        category: "missing dimension",
        message: `${dimension.label} was requested but missing from the module-context packet.`,
      });
    }

    const acceptedRecords = domainSummary?.acceptedRecords ?? 0;
    const sourceRows = domainSummary?.sourceRows ?? 0;
    if (records.length > acceptedRecords) {
      findings.push({
        id: `${tenant.tenantKey}:${dimension.domain}:count-mismatch`,
        severity: "P0",
        tenantKey: tenant.tenantKey,
        dimension: dimension.label,
        category: "dimension row count",
        message: `${dimension.label} served record sample (${records.length}) exceeds acceptedRecords (${acceptedRecords}).`,
      });
    }

    if (records.length > 0 && evidenceIds.size === 0) {
      findings.push({
        id: `${tenant.tenantKey}:${dimension.domain}:missing-source-lineage`,
        severity: "P1",
        tenantKey: tenant.tenantKey,
        dimension: dimension.label,
        tab: "Sources",
        category: "source lineage",
        message: `${dimension.label} served sample has records but no sourceEvidenceIds.`,
      });
    }

    if (
      (dimension.minRowsForStrong ?? 0) > 0 &&
      acceptedRecords < (dimension.minRowsForStrong ?? 0)
    ) {
      findings.push({
        id: `${tenant.tenantKey}:${dimension.domain}:thin-context`,
        severity: "P1",
        tenantKey: tenant.tenantKey,
        dimension: dimension.label,
        category: "stale/thin context",
        message: `${dimension.label} has only ${acceptedRecords} accepted records; verify this is not a thin projected subset.`,
      });
    }

    const text = records.map(recordText).join("\n");
    if (DISALLOWED_PRIMARY_LANGUAGE.test(text)) {
      findings.push({
        id: `${tenant.tenantKey}:${dimension.domain}:version-language`,
        severity: "P2",
        tenantKey: tenant.tenantKey,
        dimension: dimension.label,
        category: "primary UI language",
        message: `${dimension.label} contains old V-language in served records.`,
      });
    }
    if (UNSUPPORTED_VALUE_CLAIM.test(text)) {
      findings.push({
        id: `${tenant.tenantKey}:${dimension.domain}:unsupported-value-claim`,
        severity: "P0",
        tenantKey: tenant.tenantKey,
        dimension: dimension.label,
        category: "unsupported module claim",
        message: `${dimension.label} contains a realized-value or savings claim that must be source-proven before Home can show it.`,
      });
    }

    if (relationshipCandidates.length > 0 && relationships.length === 0) {
      notes.push(
        "Relationship evidence exists as candidates; validated relationship reasoning must remain caveated.",
      );
    }
    if (gaps.length === 0) {
      notes.push(
        "No domain-specific gaps are present; this must not be presented as full enterprise completeness.",
      );
    }

    const scores = scoreDimension({
      acceptedRecords,
      evidenceRefs: evidenceRefs.length,
      gaps: gaps.length,
      relationships: relationships.length,
      relationshipCandidates: relationshipCandidates.length,
      sourceMode: context.sourceMode,
      thin: acceptedRecords < (dimension.minRowsForStrong ?? 0),
    });

    dimensionResults.push({
      tenantKey: tenant.tenantKey,
      dimension: dimension.label,
      domain: dimension.domain,
      sourceRows,
      acceptedRecords,
      renderedRecordCount: records.length,
      evidenceRefs: evidenceRefs.length,
      gaps: gaps.length,
      relationships: relationships.length,
      relationshipCandidates: relationshipCandidates.length,
      sourceMode: context.sourceMode,
      activeVersionId: context.activeTenantAccessVersionId,
      verdict: verdictForScores(scores),
      scores,
      notes,
    });

    tabResults.push(
      buildTabResult(tenant, dimension, "Summary", scores, [
        `${dimension.label} has ${acceptedRecords} active module-context records and ${evidenceRefs.length} evidence references.`,
      ]),
      buildTabResult(tenant, dimension, "Data", scores, [
        `${records.length} records are served for the Data tab comparison.`,
      ]),
      buildTabResult(tenant, dimension, "Gaps", scores, [
        gaps.length
          ? `${gaps.length} module-context gaps are present.`
          : "No domain-specific module-context gaps are present.",
      ]),
      buildTabResult(tenant, dimension, "Sources", scores, [
        `${evidenceRefs.length} source/evidence references are available for this domain.`,
      ]),
      buildTabResult(tenant, dimension, "Relationships", scores, [
        `${relationships.length} validated relationships and ${relationshipCandidates.length} relationship candidates are present for this domain.`,
      ]),
    );
  }

  return { dimensionResults, tabResults, findings };
}

async function runBrowserProof({
  args,
  contexts,
}: {
  args: Args;
  contexts: Map<string, ServedModuleContextPacket>;
}): Promise<{
  tenantUpdates: Array<Pick<TenantResult, "tenantKey" | "browser" | "ava">>;
  avaResults: AvaResult[];
  screenshots: BrowserArtifact[];
  domArtifacts: BrowserArtifact[];
  findings: Finding[];
}> {
  const localFindings: Finding[] = [];
  const tenantUpdates: Array<
    Pick<TenantResult, "tenantKey" | "browser" | "ava">
  > = [];
  const avaResults: AvaResult[] = [];
  const screenshots: BrowserArtifact[] = [];
  const domArtifacts: BrowserArtifact[] = [];
  const tenantsWithBrowser = TENANTS.filter((tenant) => tenant.browserRequired);
  const storageStates = tenantsWithBrowser.map((tenant) => ({
    tenant,
    storageState: resolveStorageState(tenant),
  }));

  if (!storageStates.some((entry) => entry.storageState)) {
    for (const tenant of tenantsWithBrowser) {
      tenantUpdates.push({
        tenantKey: tenant.tenantKey,
        browser: {
          status: "skipped",
          personaSlug: tenant.personaSlug,
          reason: "No signed-in storageState found locally.",
        },
        ava: {
          status: "skipped",
          promptsTested: 0,
          pass: 0,
          watch: 0,
          fail: 0,
          reason: "No signed-in storageState found locally.",
        },
      });
    }
    return {
      tenantUpdates,
      avaResults,
      screenshots,
      domArtifacts,
      findings: localFindings,
    };
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const { tenant, storageState } of storageStates) {
      if (!storageState) {
        tenantUpdates.push({
          tenantKey: tenant.tenantKey,
          browser: {
            status: "skipped",
            personaSlug: tenant.personaSlug,
            reason: "No signed-in storageState found locally.",
          },
          ava: {
            status: "skipped",
            promptsTested: 0,
            pass: 0,
            watch: 0,
            fail: 0,
            reason: "No signed-in storageState found locally.",
          },
        });
        continue;
      }

      const context = await browser.newContext({
        baseURL: args.baseUrl,
        storageState,
        viewport: { width: 1728, height: 1117 },
      });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      const update: Pick<TenantResult, "tenantKey" | "browser" | "ava"> = {
        tenantKey: tenant.tenantKey,
        browser: {
          status: "tested",
          personaSlug: tenant.personaSlug,
          storageState,
        },
        ava: {
          status: "skipped",
          promptsTested: 0,
          pass: 0,
          watch: 0,
          fail: 0,
        },
      };

      try {
        await page.goto("/home", { waitUntil: "networkidle", timeout: 45000 });
        const url = page.url();
        update.browser.url = url;
        const bodyText = normalizeText(
          await page.locator("body").innerText({ timeout: 10000 }),
        );
        if (
          /sign[- ]?in|clerk/i.test(url) ||
          /sign in/i.test(bodyText.slice(0, 500))
        ) {
          localFindings.push({
            id: `${tenant.tenantKey}:auth-break`,
            severity: "P0",
            tenantKey: tenant.tenantKey,
            category: "auth/page load",
            message:
              "Signed-in storageState did not preserve Home route; browser landed on sign-in.",
            evidence: url,
          });
          update.browser.status = "failed";
        }
        if (!tenant.expectedNames.some((name) => bodyText.includes(name))) {
          localFindings.push({
            id: `${tenant.tenantKey}:tenant-name-missing`,
            severity: "P1",
            tenantKey: tenant.tenantKey,
            category: "tenant identity",
            message: `Home did not show expected tenant identity (${tenant.expectedNames.join(" / ")}).`,
          });
        }
        if (statesCandidatePreviewActive(bodyText)) {
          localFindings.push({
            id: `${tenant.tenantKey}:candidate-preview-default-visible`,
            severity: "P0",
            tenantKey: tenant.tenantKey,
            category: "active/candidate separation",
            message:
              "Default Home appeared to show active candidate preview state.",
          });
        }
        if (CANDIDATE_LEAK.test(bodyText)) {
          localFindings.push({
            id: `${tenant.tenantKey}:candidate-leak-body`,
            severity: "P0",
            tenantKey: tenant.tenantKey,
            category: "active/candidate separation",
            message:
              "Default Home body text suggests candidate data may be active.",
          });
        }
        if (consoleErrors.length) {
          localFindings.push({
            id: `${tenant.tenantKey}:console-errors`,
            severity: "P1",
            tenantKey: tenant.tenantKey,
            category: "runtime console",
            message: `${consoleErrors.length} console/runtime errors were emitted on Home.`,
            evidence: consoleErrors.slice(0, 3).join(" | "),
          });
        }
        await capture(
          page,
          args.outDir,
          screenshots,
          domArtifacts,
          tenant.tenantKey,
          "home",
        );

        for (const dimension of DIMENSIONS) {
          await clickIfVisible(page, dimension.label);
          await page.waitForTimeout(250);
          await capture(
            page,
            args.outDir,
            screenshots,
            domArtifacts,
            tenant.tenantKey,
            `dimension-${slug(dimension.label)}-summary`,
            dimension.label,
            "Summary",
          );
          for (const tab of ["Data", "Sources", "Relationships"] as const) {
            await clickIfVisible(page, tab);
            await page.waitForTimeout(200);
            await capture(
              page,
              args.outDir,
              screenshots,
              domArtifacts,
              tenant.tenantKey,
              `dimension-${slug(dimension.label)}-${slug(tab)}`,
              dimension.label,
              tab,
            );
          }
        }

        const qa = await askAvaQuestions(
          page,
          tenant,
          contexts.get(tenant.tenantKey),
        );
        avaResults.push(...qa.results);
        update.ava = {
          status: "tested",
          promptsTested: qa.results.length,
          pass: qa.results.filter((result) => result.verdict === "pass").length,
          watch: qa.results.filter((result) => result.verdict === "watch")
            .length,
          fail: qa.results.filter((result) => result.verdict === "fail").length,
        };
        localFindings.push(...qa.findings);

        await page.goto("/admin/candidate-preview", {
          waitUntil: "networkidle",
          timeout: 45000,
        });
        const previewText = normalizeText(
          await page.locator("body").innerText({ timeout: 10000 }),
        );
        if (
          !/candidate preview|inactive candidate|promotion disabled/i.test(
            previewText,
          )
        ) {
          localFindings.push({
            id: `${tenant.tenantKey}:candidate-preview-banner-missing`,
            severity: "P1",
            tenantKey: tenant.tenantKey,
            category: "candidate preview negative test",
            message:
              "Candidate preview route did not clearly show inactive/preview guardrail language.",
          });
        }
        await capture(
          page,
          args.outDir,
          screenshots,
          domArtifacts,
          tenant.tenantKey,
          "candidate-preview",
        );
      } catch (error) {
        update.browser.status = "failed";
        update.browser.reason =
          error instanceof Error ? error.message : String(error);
        localFindings.push({
          id: `${tenant.tenantKey}:browser-smoke-error`,
          severity: "P0",
          tenantKey: tenant.tenantKey,
          category: "browser smoke",
          message: "Signed-in Home browser smoke failed.",
          evidence: update.browser.reason,
        });
      } finally {
        await context.close();
      }
      tenantUpdates.push(update);
    }
  } finally {
    await browser.close();
  }

  return {
    tenantUpdates,
    avaResults,
    screenshots,
    domArtifacts,
    findings: localFindings,
  };
}

async function askAvaQuestions(
  page: import("playwright").Page,
  tenant: TenantConfig,
  context?: ServedModuleContextPacket,
): Promise<{ results: AvaResult[]; findings: Finding[] }> {
  const results: AvaResult[] = [];
  const findings: Finding[] = [];
  for (const question of AVA_QUESTIONS) {
    const response = await page.evaluate(async (prompt) => {
      const res = await fetch("/api/home/know/ask", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-abarva-debug-home-know": "1",
        },
        body: JSON.stringify({ question: prompt }),
      });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    }, question);
    const answer = extractAnswerText(response.body);
    const noCandidateLeakage = !CANDIDATE_LEAK.test(answer);
    const noUnsupportedSavingsOrOutcome = !UNSUPPORTED_VALUE_CLAIM.test(answer);
    const noCrossTenantLeakage = !TENANTS.filter(
      (other) => other.tenantKey !== tenant.tenantKey,
    )
      .flatMap((other) => other.expectedNames)
      .some(
        (name) =>
          name.length > 4 && answer.toLowerCase().includes(name.toLowerCase()),
      );
    const executiveReadable = answer.length > 80 && answer.length < 5000;
    const caveated =
      /source|evidence|known|missing|limited|cannot|not yet|active/i.test(
        answer,
      );
    const ok =
      response.status === 200 &&
      noCandidateLeakage &&
      noUnsupportedSavingsOrOutcome &&
      noCrossTenantLeakage &&
      executiveReadable;
    const verdict: Verdict = ok && caveated ? "pass" : ok ? "watch" : "fail";
    const result: AvaResult = {
      tenantKey: tenant.tenantKey,
      question,
      status: response.status,
      verdict,
      answerPreview: answer.slice(0, 900),
      noCandidateLeakage,
      noCrossTenantLeakage,
      noUnsupportedSavingsOrOutcome,
      executiveReadable,
      caveated,
    };
    results.push(result);
    if (verdict === "fail") {
      findings.push({
        id: `${tenant.tenantKey}:ava:${slug(question)}`,
        severity:
          !noCandidateLeakage ||
          !noCrossTenantLeakage ||
          !noUnsupportedSavingsOrOutcome
            ? "P0"
            : "P1",
        tenantKey: tenant.tenantKey,
        category: "aVa Home quality",
        message: `aVa answer failed Home quality gate for: ${question}`,
        evidence: answer.slice(0, 300),
      });
    }
  }
  if (context && context.sourceMode !== "active_tenant_access") {
    findings.push({
      id: `${tenant.tenantKey}:ava-source-mode:${context.sourceMode}`,
      severity: "P1",
      tenantKey: tenant.tenantKey,
      category: "aVa Home quality",
      message: `aVa was smoke-tested while module-context source mode is ${context.sourceMode}.`,
    });
  }
  return { results, findings };
}

function scoreDimension(args: {
  acceptedRecords: number;
  evidenceRefs: number;
  gaps: number;
  relationships: number;
  relationshipCandidates: number;
  sourceMode: string;
  thin: boolean;
}): QualityScores {
  const active = args.sourceMode === "active_tenant_access";
  const hasData = args.acceptedRecords > 0;
  const hasEvidence = args.evidenceRefs > 0;
  const relationshipReady =
    args.relationships > 0 || args.relationshipCandidates > 0;
  return {
    factualAccuracy: active && hasData ? 5 : active ? 4 : 2,
    tenantSpecificity: hasData ? 5 : 3,
    executiveClarity: args.thin ? 3 : 4,
    evidenceSourceGrounding: hasEvidence ? 5 : hasData ? 2 : 3,
    relationshipTruthfulness: relationshipReady ? 4 : 3,
    decisionReadinessCaveats:
      args.gaps > 0 || args.relationshipCandidates > 0 ? 5 : 4,
    clutterReadability: 4,
    duplicateConflictControl: 4,
    unsupportedModuleClaims: 5,
  };
}

function buildTabResult(
  tenant: TenantConfig,
  dimension: DimensionConfig,
  tab: TabResult["tab"],
  scores: QualityScores,
  notes: string[],
): TabResult {
  const adjusted =
    tab === "Sources" && scores.evidenceSourceGrounding < 3
      ? { ...scores, factualAccuracy: 3 }
      : tab === "Relationships" && scores.relationshipTruthfulness < 4
        ? {
            ...scores,
            decisionReadinessCaveats: Math.max(
              scores.decisionReadinessCaveats,
              4,
            ),
          }
        : scores;
  return {
    tenantKey: tenant.tenantKey,
    dimension: dimension.label,
    tab,
    verdict: verdictForScores(adjusted),
    scores: adjusted,
    notes,
  };
}

async function writeReportBundle(args: {
  args: Args;
  generatedAt: string;
  tenantResults: TenantResult[];
  dimensionResults: DimensionResult[];
  tabResults: TabResult[];
  avaResults: AvaResult[];
  findings: Finding[];
  screenshots: BrowserArtifact[];
  domArtifacts: BrowserArtifact[];
}) {
  const { outDir } = args.args;
  const grouped = groupFindings(args.findings);
  await writeJson(outDir, "tenant-results.json", args.tenantResults);
  await writeJson(outDir, "page-tab-results.json", args.tabResults);
  await writeJson(
    outDir,
    "dimension-quality-scores.json",
    args.dimensionResults,
  );
  await writeJson(
    outDir,
    "fact-mismatch-findings.json",
    args.findings.filter((finding) =>
      /tenant isolation|dimension row count|unsupported module claim/.test(
        finding.category,
      ),
    ),
  );
  await writeJson(
    outDir,
    "stale-thin-context-findings.json",
    args.findings.filter(
      (finding) => finding.category === "stale/thin context",
    ),
  );
  await writeJson(
    outDir,
    "relationship-truth-findings.json",
    args.findings.filter((finding) => /relationship/i.test(finding.category)),
  );
  await writeJson(
    outDir,
    "source-lineage-findings.json",
    args.findings.filter((finding) => finding.category === "source lineage"),
  );
  await writeJson(outDir, "ava-home-quality-results.json", args.avaResults);
  await writeJson(outDir, "active-candidate-separation-results.json", {
    generatedAt: args.generatedAt,
    tenants: args.tenantResults.map((tenant) => ({
      tenantKey: tenant.tenantKey,
      sourceMode: tenant.sourceMode,
      activeVersionId: tenant.activeVersionId,
      candidateVersionId: tenant.candidateVersionId,
    })),
    p0Findings: grouped.P0.filter((finding) =>
      /active\/candidate|candidate preview/.test(finding.category),
    ),
  });
  await writeJson(outDir, "p0-p1-p2-findings.json", grouped);
  await writeJson(outDir, "screenshots-index.json", args.screenshots);
  await writeJson(outDir, "dom-artifacts-index.json", args.domArtifacts);
  await fs.writeFile(
    path.join(outDir, "summary.md"),
    renderSummary(args),
    "utf8",
  );
  await fs.writeFile(
    path.join(outDir, "home-smoke-quality-control.html"),
    renderHtml(args),
    "utf8",
  );
}

function renderSummary(args: {
  generatedAt: string;
  tenantResults: TenantResult[];
  dimensionResults: DimensionResult[];
  tabResults: TabResult[];
  avaResults: AvaResult[];
  findings: Finding[];
}): string {
  const grouped = groupFindings(args.findings);
  const status =
    grouped.P0.length > 0
      ? "Home full smoke/content QA failed with findings"
      : grouped.P1.length > 0 || grouped.P2.length > 0
        ? "Home full smoke/content QA passed with watch items"
        : "Home full smoke/content QA passed";
  const tenantRows = args.tenantResults
    .map(
      (tenant) =>
        `| ${tenant.displayName} | ${tenant.tenantKey} | ${tenant.sourceMode} | ${tenant.records.toLocaleString()} | ${tenant.validatedRelationships.toLocaleString()} / ${tenant.relationshipCandidates.toLocaleString()} | ${tenant.browser.status}${tenant.browser.reason ? ` (${tenant.browser.reason})` : ""} | ${tenant.ava.status} | ${tenant.verdict} |`,
    )
    .join("\n");
  const topFindings =
    args.findings
      .slice(0, 20)
      .map(
        (finding) =>
          `- ${finding.severity} ${finding.tenantKey}${finding.dimension ? ` / ${finding.dimension}` : ""}: ${finding.message}`,
      )
      .join("\n") || "- None";
  return `# Home Full Smoke And Content Quality Audit

Generated: \`${args.generatedAt}\`

Status: **${status}**

This audit is read-only. It does not mutate tenant data, promote candidates, update Active Tenant Access, change module runtime behavior, or treat candidate data as default Home truth.

## Coverage

- Tenants audited: ${args.tenantResults.length}
- Dimensions audited: ${args.dimensionResults.length}
- Tabs audited: ${args.tabResults.length}
- aVa prompts tested: ${args.avaResults.length}
- P0/P1/P2: ${grouped.P0.length} / ${grouped.P1.length} / ${grouped.P2.length}

## Tenant Results

| Tenant | Key | Source mode | Records | Relationships validated/candidate | Browser | aVa | Verdict |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
${tenantRows}

## Highest-Risk Findings

${topFindings}

## Truth Split

- Server/module-context proof runs for all registry-active tenants listed here.
- Browser proof runs only where signed-in storageState/personas are available.
- Lakeshore Industries is intentionally server/module-context proof only until a dedicated automation persona exists.
- Home is not CXO-ready if P0 issues are present. P1/P2 items are watch/polish/remediation backlog unless they reflect product-truth risk.
`;
}

function renderHtml(args: {
  generatedAt: string;
  tenantResults: TenantResult[];
  dimensionResults: DimensionResult[];
  tabResults: TabResult[];
  findings: Finding[];
}): string {
  const grouped = groupFindings(args.findings);
  const tenantCards = args.tenantResults
    .map(
      (tenant) => `<article>
        <p>${escapeHtml(tenant.tenantKey)}</p>
        <h2>${escapeHtml(tenant.displayName)}</h2>
        <dl>
          <div><dt>Source mode</dt><dd>${escapeHtml(tenant.sourceMode)}</dd></div>
          <div><dt>Records</dt><dd>${tenant.records.toLocaleString()}</dd></div>
          <div><dt>Relationships</dt><dd>${(tenant.validatedRelationships + tenant.relationshipCandidates).toLocaleString()}</dd></div>
          <div><dt>Browser</dt><dd>${escapeHtml(tenant.browser.status)}</dd></div>
          <div><dt>aVa</dt><dd>${escapeHtml(tenant.ava.status)}</dd></div>
          <div><dt>Verdict</dt><dd class="${tenant.verdict}">${tenant.verdict}</dd></div>
        </dl>
      </article>`,
    )
    .join("");
  const findings = args.findings
    .slice(0, 80)
    .map(
      (finding) =>
        `<tr><td>${escapeHtml(finding.severity)}</td><td>${escapeHtml(finding.tenantKey)}</td><td>${escapeHtml(finding.dimension ?? "")}</td><td>${escapeHtml(finding.category)}</td><td>${escapeHtml(finding.message)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Smoke Quality Control</title><style>
    body{margin:0;background:#f6f8fb;color:#0b1736;font-family:Inter,Arial,sans-serif}main{max-width:1360px;margin:auto;padding:32px}h1{font-size:38px;margin:0 0 8px}h2{margin:4px 0 16px}.lede{color:#54627a;margin:0 0 24px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}.summary div,article{background:white;border:1px solid #dfe5ef;border-radius:14px;padding:18px;box-shadow:0 12px 32px rgba(15,23,42,.06)}.summary span,article p,dt{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#61708a;font-weight:800}.summary strong{font-size:28px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}dl{display:grid;grid-template-columns:1fr 1fr;gap:10px}dd{margin:4px 0 0;font-weight:800}.pass{color:#067647}.watch{color:#b45309}.fail{color:#b42318}table{width:100%;border-collapse:collapse;background:white;border:1px solid #dfe5ef;border-radius:14px;overflow:hidden;margin-top:24px}th,td{text-align:left;border-top:1px solid #edf1f7;padding:10px;vertical-align:top}th{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#61708a}@media(max-width:900px){.summary,.grid{grid-template-columns:1fr}}
  </style></head><body><main>
    <p class="lede">Generated ${escapeHtml(args.generatedAt)}</p>
    <h1>Home Smoke Quality Control</h1>
    <section class="summary">
      <div><span>P0</span><strong>${grouped.P0.length}</strong></div>
      <div><span>P1</span><strong>${grouped.P1.length}</strong></div>
      <div><span>P2</span><strong>${grouped.P2.length}</strong></div>
      <div><span>Tabs</span><strong>${args.tabResults.length}</strong></div>
    </section>
    <section class="grid">${tenantCards}</section>
    <table><thead><tr><th>Severity</th><th>Tenant</th><th>Dimension</th><th>Category</th><th>Message</th></tr></thead><tbody>${findings}</tbody></table>
  </main></body></html>`;
}

async function capture(
  page: import("playwright").Page,
  outDir: string,
  screenshots: BrowserArtifact[],
  domArtifacts: BrowserArtifact[],
  tenantKey: string,
  route: string,
  dimension?: string,
  tab?: string,
) {
  const safe = `${tenantKey}-${slug(route)}`;
  const screenshotPath = path.join(outDir, "screenshots", `${safe}.png`);
  const domPath = path.join(outDir, "dom", `${safe}.html`);
  await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
  await fs.mkdir(path.dirname(domPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await fs.writeFile(domPath, await page.content(), "utf8");
  screenshots.push({
    tenantKey,
    kind: "screenshot",
    route,
    dimension,
    tab,
    path: path.relative(repoRoot, screenshotPath),
  });
  domArtifacts.push({
    tenantKey,
    kind: "dom",
    route,
    dimension,
    tab,
    path: path.relative(repoRoot, domPath),
  });
}

async function clickIfVisible(page: import("playwright").Page, label: string) {
  const target = page.getByText(label, { exact: true }).first();
  if ((await target.count()) > 0) {
    await target.click({ timeout: 5000 }).catch(() => undefined);
  }
}

function relationshipsFor(
  records: ModuleContextRecord[],
  relationships: ModuleContextRelationship[],
): ModuleContextRelationship[] {
  const ids = new Set(records.map((record) => record.recordId));
  return relationships.filter(
    (relationship) =>
      (relationship.sourceRecordId && ids.has(relationship.sourceRecordId)) ||
      (relationship.targetRecordId && ids.has(relationship.targetRecordId)),
  );
}

function recordText(record: ModuleContextRecord): string {
  return `${record.title}\n${record.summary}\n${JSON.stringify(record.fields)}`;
}

function verdictForScores(scores: QualityScores): Verdict {
  const average =
    Object.values(scores).reduce((sum, score) => sum + score, 0) /
    Object.values(scores).length;
  if (average >= 4) return "pass";
  if (average >= 3) return "watch";
  return "fail";
}

function verdictForFindings(findings: Finding[]): Verdict {
  if (findings.some((finding) => finding.severity === "P0")) return "fail";
  if (findings.length > 0) return "watch";
  return "pass";
}

function tenantNotes(result: TenantResult, findings: Finding[]): string[] {
  const notes = findings.slice(0, 5).map((finding) => finding.message);
  if (result.browser.status === "skipped") {
    notes.push(result.browser.reason ?? "Browser proof skipped.");
  }
  return notes;
}

function groupFindings(findings: Finding[]): Record<Severity, Finding[]> {
  return {
    P0: findings.filter((finding) => finding.severity === "P0"),
    P1: findings.filter((finding) => finding.severity === "P1"),
    P2: findings.filter((finding) => finding.severity === "P2"),
  };
}

function shouldFail(
  failOn: Severity,
  grouped: Record<Severity, Finding[]>,
): boolean {
  if (failOn === "P0") return grouped.P0.length > 0;
  if (failOn === "P1") return grouped.P0.length > 0 || grouped.P1.length > 0;
  return (
    grouped.P0.length > 0 || grouped.P1.length > 0 || grouped.P2.length > 0
  );
}

function extractAnswerText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const candidates = [
    record.answer,
    record.prose,
    record.markdown,
    record.response,
    record.text,
    record.content,
    record.message,
    record.result,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string") return normalizeText(candidate);
  }
  return normalizeText(JSON.stringify(value));
}

function statesCandidatePreviewActive(text: string): boolean {
  const normalized = normalizeText(text);
  if (/candidate preview\s*(?:[:\-]|status)?\s*not active/i.test(normalized)) {
    return false;
  }
  return /candidate preview\s*(?:[:\-]|status)?\s*active\b/i.test(normalized);
}

function resolveStorageState(tenant: TenantConfig): string | null {
  const envKey = `HOME_SMOKE_STORAGE_STATE_${tenant.tenantKey
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;
  const candidates = [
    process.env[envKey],
    tenant.personaSlug
      ? path.join(repoRoot, ".auth", `${tenant.personaSlug}.json`)
      : null,
    tenant.personaSlug
      ? path.join(
          "/Users/anand/Projects/nexus/.auth",
          `${tenant.personaSlug}.json`,
        )
      : null,
  ].filter(Boolean) as string[];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

async function resetOutput(outDir: string) {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
}

async function writeJson(outDir: string, fileName: string, value: unknown) {
  await fs.writeFile(
    path.join(outDir, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

function parseArgs(argv: string[]): Args {
  const get = (name: string, fallback: string) => {
    const prefix = `--${name}=`;
    return (
      argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ??
      fallback
    );
  };
  const mode = get("mode", "full") as AuditMode;
  if (!["full", "server", "ava"].includes(mode)) {
    throw new Error(`Invalid --mode=${mode}`);
  }
  const failOn = get(
    "fail-on",
    process.env.HOME_SMOKE_FAIL_ON ?? "P0",
  ) as Severity;
  if (!["P0", "P1", "P2"].includes(failOn)) {
    throw new Error(`Invalid --fail-on=${failOn}`);
  }
  return {
    mode,
    baseUrl: get(
      "base-url",
      process.env.HOME_SMOKE_BASE_URL ?? "https://app.abarva.ai",
    ),
    outDir: path.resolve(
      get(
        "out-dir",
        process.env.HOME_SMOKE_OUT_DIR ?? "reports/home-smoke-quality/latest",
      ),
    ),
    failOn,
  };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
