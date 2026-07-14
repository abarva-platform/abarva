import fs from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

import {
  explainModuleContext,
  getModuleContext,
} from "@/lib/enterprise-data/module-context-serving/module-context-serving";
import type { ModuleContextRequestedDomain } from "@/lib/enterprise-data/contracts/module-context-apis";
import {
  buildHomeSummarySnapshotFromModuleContext,
  type HomeContextAreaSummary,
  type HomeSummarySnapshot,
} from "@/lib/home/home-summary-snapshot";
import {
  runHomeSummaryClaudeRenderAudit,
  type HomeSummaryClaudeRenderAudit,
} from "@/lib/home/home-summary-claude-render";

type Verdict = "pass" | "watch" | "fail";

interface TenantConfig {
  tenantKey: string;
  displayName: string;
  industry: string;
}

interface PageAssessment {
  page: string;
  verdict: Verdict;
  qualityScore: number;
  renderedSummary: string;
  claudeSource: string;
  findings: string[];
}

interface TenantReport {
  tenant: TenantConfig;
  audit: HomeSummaryClaudeRenderAudit;
  deterministicSnapshot: HomeSummarySnapshot;
  renderedSnapshot: HomeSummarySnapshot;
  assessments: PageAssessment[];
  overallVerdict: Verdict;
  opinion: string;
}

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();

const TENANTS: TenantConfig[] = [
  {
    tenantKey: "skyharbor-air",
    displayName: "SkyHarbor Air",
    industry: "Mission-critical airline operations",
  },
  {
    tenantKey: "meridian-health",
    displayName: "Meridian Health",
    industry: "Integrated healthcare and health plan operations",
  },
  {
    tenantKey: "apex-retail",
    displayName: "Apex Retail",
    industry: "Retail and consumer operations",
  },
  {
    tenantKey: "first-capital-financial",
    displayName: "First Capital Financial",
    industry: "Financial services",
  },
  {
    tenantKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    industry: "Legal and shared services operations",
  },
  {
    tenantKey: "lakeshore-industries",
    displayName: "Lakeshore Industries",
    industry: "Industrial operations",
  },
];

const HOME_MODULE_DOMAINS: ModuleContextRequestedDomain[] = [
  "enterprise_profile",
  "functions",
  "applications_systems",
  "vendors_contracts",
  "data_assets_integrations",
  "programs_priorities",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence_sources",
];

const DIMENSION_PURPOSES: Record<
  string,
  { purpose: string; modules: string[]; notYet: string }
> = {
  "Functions": {
    purpose: "Shows how the enterprise is organized and where work happens.",
    modules: ["Intelligence", "Moves", "Tower"],
    notYet: "Do not infer enterprise-wide operating redesign without validated ownership and relationship evidence.",
  },
  "Applications & Systems": {
    purpose: "Shows the technology estate that enables or constrains the business.",
    modules: ["Intelligence", "Moves", "Source", "Tower"],
    notYet: "Do not infer full rationalization, cloud target state, or platform savings from inventory alone.",
  },
  "Vendors & Contracts": {
    purpose: "Shows who provides technology, services, platforms, and commercial commitments.",
    modules: ["Source", "Intelligence", "Tower"],
    notYet: "Do not infer sourcing savings or renegotiation outcomes until contract economics are validated.",
  },
  "Data Assets & Integrations": {
    purpose: "Shows whether the enterprise has the data foundation required for analytics, AI, automation, and reporting.",
    modules: ["Intelligence", "Moves", "Tower"],
    notYet: "Do not infer AI readiness or lakehouse maturity until data quality, lineage, and platform state are validated.",
  },
  "Programs & Priorities": {
    purpose: "Shows what the enterprise is trying to change or improve.",
    modules: ["Moves", "Intelligence", "Tower"],
    notYet: "Do not infer funding approval, delivery status, or realized benefits from priority lists alone.",
  },
  "Risks & Controls": {
    purpose: "Shows what can go wrong and what must be governed before decisions are made.",
    modules: ["Intelligence", "Moves", "Source", "Tower"],
    notYet: "Do not infer control effectiveness until evidence, owners, and testing posture are validated.",
  },
  "Metrics & Outcomes": {
    purpose: "Shows how success will be measured.",
    modules: ["Tower", "Moves", "Intelligence"],
    notYet: "Do not infer realized value or Tower outcomes unless measured baselines and actuals are present.",
  },
};

const DIAGNOSTIC_LEAK =
  /\b(V4|V6|V7|debug|route|table name|canonical table|answer material|source rows across 0 domains|0 mapped links|not available yet)\b/i;

async function main() {
  loadEnvConfig(repoRoot);
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(repoRoot, args.outDir);
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const reports: TenantReport[] = [];
  for (const tenant of TENANTS) {
    const deterministicSnapshot = await buildSnapshot(tenant);
    const audit = await runHomeSummaryClaudeRenderAudit({
      snapshot: deterministicSnapshot,
      userId: "home-story-qa",
      transport: "direct",
    });
    const renderedSnapshot = audit.enrichedSnapshot ?? deterministicSnapshot;
    const assessments = assessRenderedStory(renderedSnapshot, audit);
    reports.push({
      tenant,
      audit,
      deterministicSnapshot,
      renderedSnapshot,
      assessments,
      overallVerdict: rollupVerdict(assessments),
      opinion: opinionFor(tenant, audit, assessments),
    });
  }

  const summary = {
    generatedAt,
    outDir,
    tenants: reports.length,
    claudeApplied: reports.filter((report) => report.audit.status === "applied")
      .length,
    pass: reports.filter((report) => report.overallVerdict === "pass").length,
    watch: reports.filter((report) => report.overallVerdict === "watch").length,
    fail: reports.filter((report) => report.overallVerdict === "fail").length,
  };

  await fs.writeFile(
    path.join(outDir, "home-claude-story-report.json"),
    JSON.stringify({ summary, reports: compactReports(reports) }, null, 2),
    "utf8",
  );
  await fs.writeFile(
    path.join(outDir, "home-claude-story-report.html"),
    renderHtml(summary, reports),
    "utf8",
  );

  console.log(JSON.stringify(summary, null, 2));
}

async function buildSnapshot(tenant: TenantConfig): Promise<HomeSummarySnapshot> {
  const request = {
    tenantKey: tenant.tenantKey,
    moduleKey: "home" as const,
    purpose: "context_summary" as const,
    requestedDomains: HOME_MODULE_DOMAINS,
  };
  const [moduleContext, moduleContextExplanation] = await Promise.all([
    getModuleContext(request, { repoRoot, generatedAt }),
    explainModuleContext(request, { repoRoot, generatedAt }),
  ]);
  return buildHomeSummarySnapshotFromModuleContext({
    repoRoot,
    tenantKey: tenant.tenantKey,
    displayName: tenant.displayName,
    industry: tenant.industry,
    moduleContext,
    moduleContextExplanation,
    generatedAt,
  });
}

function assessRenderedStory(
  snapshot: HomeSummarySnapshot,
  audit: HomeSummaryClaudeRenderAudit,
): PageAssessment[] {
  const assessments: PageAssessment[] = [];
  assessments.push(assessOverview(snapshot, audit));
  assessments.push(assessContextConfidence(snapshot));
  for (const area of snapshot.contextAreas.filter(isClientFacingArea)) {
    assessments.push(assessDimension(snapshot, area, audit));
  }
  return assessments;
}

function assessOverview(
  snapshot: HomeSummarySnapshot,
  audit: HomeSummaryClaudeRenderAudit,
): PageAssessment {
  const renderedSummary =
    snapshot.executiveProfile.claudeExecutiveSummary ||
    snapshot.executiveProfile.companySummaryFacts[0] ||
    snapshot.executiveProfile.whatAbarVaKnows.join(" ");
  const findings = baseCopyFindings(renderedSummary);
  const dimensionCoverage = snapshot.contextAreas.filter(
    (area) => area.loadedCount > 0,
  ).length;
  if (dimensionCoverage < 7) {
    findings.push(
      `Only ${dimensionCoverage} of 7 enterprise dimensions have loaded context.`,
    );
  }
  if (!mentionsEvidenceBoundary(renderedSummary)) {
    findings.push("Overview should say this is source-backed active context.");
  }
  if (!mentionsLimitation(renderedSummary)) {
    findings.push(
      "Overview should caveat relationship depth, measured outcomes, or unsupported inference.",
    );
  }
  return pageAssessment({
    page: "Home overview",
    renderedSummary,
    claudeSource: audit.parsedResponse?.executiveSummary ?? "No Claude response applied.",
    findings,
  });
}

function assessContextConfidence(snapshot: HomeSummarySnapshot): PageAssessment {
  const renderedSummary =
    "AbarVa has source-backed context across the major enterprise dimensions. This is strong enough for enterprise orientation and fact-based questions. Relationship depth and measured outcomes still need validation before using this context for cross-domain dependency reasoning, sourcing savings, or Tower value claims.";
  const findings = baseCopyFindings(renderedSummary);
  if (!snapshot.contextAreas.some((area) => area.relationshipCount > 0)) {
    findings.push(
      "Relationship depth is limited; the page should keep dependency reasoning caveated.",
    );
  }
  return pageAssessment({
    page: "Context Confidence",
    renderedSummary,
    claudeSource:
      "Deterministic guardrail copy. This page intentionally explains trust posture instead of asking Claude to score production truth.",
    findings,
  });
}

function assessDimension(
  snapshot: HomeSummarySnapshot,
  area: HomeContextAreaSummary,
  audit: HomeSummaryClaudeRenderAudit,
): PageAssessment {
  const purpose = dimensionPurposeFor(area.displayName);
  const renderedSummary = [
    area.claudeExecutiveSummary || area.executiveSummaryInputs[0],
    ...(area.claudeWhatAbarVaKnows ?? area.examples).slice(0, 3),
    area.claudeWhyItMatters || purpose?.purpose,
    ...(area.claudeSupportedQuestions ?? area.safeQuestions).slice(0, 3),
    ...(area.claudeUnsupportedQuestions ?? area.unsupportedQuestions).slice(0, 3),
    area.claudeNextDataAction || area.nextDataActions[0],
  ]
    .filter(Boolean)
    .join(" ");
  const claudeDimension =
    audit.parsedResponse?.dimensionSummaries[area.displayName];
  const findings = baseCopyFindings(renderedSummary);
  if (!purpose) {
    findings.push("No platform-purpose definition exists for this dimension.");
  } else {
    if (!containsAny(renderedSummary, purpose.modules)) {
      findings.push(
        `Dimension should name module usage: ${purpose.modules.join(", ")}.`,
      );
    }
    if (!containsConcept(renderedSummary, purpose.purpose)) {
      findings.push(`Dimension purpose may be too vague: ${purpose.purpose}`);
    }
  }
  if (area.loadedCount > 0 && !renderedSummary.match(/\b(loaded|known|source-backed|evidence|context)\b/i)) {
    findings.push("Dimension should explain what is known from loaded context.");
  }
  if (!mentionsLimitation(renderedSummary)) {
    findings.push("Dimension needs a clear not-yet-supported boundary.");
  }
  if ((area.claudeSupportedQuestions ?? area.safeQuestions).length < 2) {
    findings.push("Dimension should offer at least two safe question examples.");
  }
  if ((area.claudeUnsupportedQuestions ?? area.unsupportedQuestions).length < 2) {
    findings.push("Dimension should offer at least two unsupported-question boundaries.");
  }
  return pageAssessment({
    page: `Dimension: ${area.displayName}`,
    renderedSummary,
    claudeSource: claudeDimension
      ? JSON.stringify(claudeDimension, null, 2)
      : "No Claude dimension response applied.",
    findings,
  });
}

function pageAssessment(input: {
  page: string;
  renderedSummary: string;
  claudeSource: string;
  findings: string[];
}): PageAssessment {
  const score = Math.max(0, 100 - input.findings.length * 12);
  return {
    page: input.page,
    verdict: score >= 88 ? "pass" : score >= 70 ? "watch" : "fail",
    qualityScore: score,
    renderedSummary: input.renderedSummary,
    claudeSource: input.claudeSource,
    findings: input.findings,
  };
}

function baseCopyFindings(text: string): string[] {
  const findings: string[] = [];
  if (text.trim().length < 120) {
    findings.push("Copy is too thin to tell a client-ready story.");
  }
  if (containsUnsupportedAssertion(text)) {
    findings.push("Copy contains unsupported value, promotion, or production-truth claims.");
  }
  if (DIAGNOSTIC_LEAK.test(text)) {
    findings.push("Copy leaks diagnostic or implementation-first language.");
  }
  return findings;
}

function mentionsEvidenceBoundary(text: string): boolean {
  return /\b(source-backed|evidence|known|loaded context|active context)\b/i.test(
    text,
  );
}

function mentionsLimitation(text: string): boolean {
  return /\b(not yet|should not|do not|limited|validate|validation|caveat|unsupported|before relying|before use|before asserting|before claiming|pending|not confirmed|not evidenced|unavailable|cannot|require|not represented)\b/i.test(
    text,
  );
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) =>
    text.toLowerCase().includes(needle.toLowerCase()),
  );
}

function containsConcept(text: string, concept: string): boolean {
  const words = concept
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4);
  const normalized = text.toLowerCase();
  const hits = words.filter((word) => normalized.includes(word)).length;
  return hits >= Math.min(2, words.length);
}

function isClientFacingArea(area: HomeContextAreaSummary): boolean {
  const purpose = dimensionPurposeFor(area.displayName);
  if (!purpose) return false;
  const normalized = area.displayName.toLowerCase();
  return !(
    normalized.includes("evidence source") ||
    normalized === "relationships" ||
    normalized.includes("relationship graph")
  );
}

function dimensionPurposeFor(displayName: string):
  | { purpose: string; modules: string[]; notYet: string }
  | undefined {
  const direct = DIMENSION_PURPOSES[displayName];
  if (direct) return direct;
  const normalized = displayName.toLowerCase();
  if (normalized.includes("function")) return DIMENSION_PURPOSES["Functions"];
  if (normalized.includes("application") || normalized.includes("system")) {
    return DIMENSION_PURPOSES["Applications & Systems"];
  }
  if (normalized.includes("vendor") || normalized.includes("contract")) {
    return DIMENSION_PURPOSES["Vendors & Contracts"];
  }
  if (normalized.includes("data") || normalized.includes("integration")) {
    if (normalized.includes("integration")) {
      return {
        purpose:
          "Shows how systems and data connect, and where automation or reporting depends on movement of information.",
        modules: ["Intelligence", "Moves", "Source", "Tower"],
        notYet:
          "Do not infer cross-system dependency, interface resilience, or data-flow maturity until integrations are loaded and validated.",
      };
    }
    return DIMENSION_PURPOSES["Data Assets & Integrations"];
  }
  if (normalized.includes("program") || normalized.includes("priorit")) {
    return DIMENSION_PURPOSES["Programs & Priorities"];
  }
  if (normalized.includes("risk") || normalized.includes("control")) {
    return DIMENSION_PURPOSES["Risks & Controls"];
  }
  if (
    normalized.includes("metric") ||
    normalized.includes("kpi") ||
    normalized.includes("outcome")
  ) {
    return DIMENSION_PURPOSES["Metrics & Outcomes"];
  }
  return undefined;
}

function containsUnsupportedAssertion(text: string): boolean {
  const matches = text.match(
    /\b(guaranteed savings|realized value|verified savings|achieved ROI|20\s*[-–]\s*30%|20\s*[-–]\s*25%|production write|candidate promoted|active promotion)\b/gi,
  );
  if (!matches) return false;
  return matches.some((match) => {
    const index = text.toLowerCase().indexOf(match.toLowerCase());
    const before = text.slice(Math.max(0, index - 48), index).toLowerCase();
    const after = text.slice(index, Math.min(text.length, index + 96)).toLowerCase();
    const safeBoundary =
      /\b(do not|don't|cannot|not|no|unless|without|before|pending)\b/.test(
        before,
      ) ||
      /\b(not evidenced|not confirmed|are not|is not|unless|before|pending)\b/.test(
        after,
      ) ||
      after.includes("?");
    return !safeBoundary;
  });
}

function rollupVerdict(assessments: PageAssessment[]): Verdict {
  if (assessments.some((assessment) => assessment.verdict === "fail")) {
    return "fail";
  }
  if (assessments.some((assessment) => assessment.verdict === "watch")) {
    return "watch";
  }
  return "pass";
}

function opinionFor(
  tenant: TenantConfig,
  audit: HomeSummaryClaudeRenderAudit,
  assessments: PageAssessment[],
): string {
  const verdict = rollupVerdict(assessments);
  const weakest = [...assessments].sort(
    (left, right) => left.qualityScore - right.qualityScore,
  )[0];
  const claudeStatus =
    audit.status === "applied"
      ? "Claude-generated summaries were applied and rendered from governed Home context."
      : `Claude summaries were not applied (${audit.status}); the report assessed deterministic fallback copy.`;
  if (verdict === "pass") {
    return `${tenant.displayName} is story-ready for Home orientation: the copy explains what AbarVa knows, why the context matters, which modules can use it, and what not to infer yet. ${claudeStatus}`;
  }
  if (verdict === "watch") {
    return `${tenant.displayName} is usable with watch items. The weakest page is "${weakest.page}" at ${weakest.qualityScore}/100. Tighten that block before using it as a flagship client walkthrough. ${claudeStatus}`;
  }
  return `${tenant.displayName} should not be showcased yet. The weakest page is "${weakest.page}" at ${weakest.qualityScore}/100, which means the page does not yet tell a credible client story. ${claudeStatus}`;
}

function compactReports(reports: TenantReport[]) {
  return reports.map((report) => ({
    tenant: report.tenant,
    claude: {
      status: report.audit.status,
      transport: report.audit.transport,
      model: report.audit.model,
      promptHash: report.audit.promptHash,
      systemPrompt: report.audit.systemPrompt,
      userPrompt: report.audit.userPrompt,
      rawResponse: report.audit.rawResponse,
      parsedResponse: report.audit.parsedResponse,
      error: report.audit.error,
    },
    overallVerdict: report.overallVerdict,
    opinion: report.opinion,
    assessments: report.assessments,
  }));
}

function renderHtml(
  summary: {
    generatedAt: string;
    outDir: string;
    tenants: number;
    claudeApplied: number;
    pass: number;
    watch: number;
    fail: number;
  },
  reports: TenantReport[],
): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AbarVa Home Claude Story QA</title>
  <style>
    :root {
      color-scheme: light;
      --ink:#071734;
      --muted:#61708a;
      --line:#dfe6ef;
      --soft:#f6f8fb;
      --pass:#0f7b5d;
      --watch:#9b6a00;
      --fail:#b42318;
      --blue:#0b4fb3;
      --aqua:#10b7c8;
    }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); background:#fff; }
    header { padding:36px 48px; background:linear-gradient(135deg,#061225,#09213f); color:#fff; }
    header h1 { margin:0 0 10px; font-size:42px; letter-spacing:-.02em; }
    header p { margin:0; max-width:980px; color:#dce8f7; font-size:18px; line-height:1.55; }
    main { padding:32px 48px 64px; }
    h2 { margin:0 0 12px; font-size:30px; letter-spacing:-.02em; }
    h3 { margin:0 0 10px; font-size:22px; }
    h4 { margin:0 0 8px; font-size:15px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); }
    .summary { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; margin:0 0 32px; }
    .metric, .tenant, .page, details { border:1px solid var(--line); border-radius:16px; background:#fff; box-shadow:0 16px 36px rgba(7,23,52,.07); }
    .metric { padding:18px; }
    .metric span { display:block; color:var(--muted); font-weight:700; font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
    .metric strong { display:block; margin-top:8px; font-size:32px; }
    .tenant { margin:0 0 28px; overflow:hidden; }
    .tenantHead { padding:24px; display:grid; grid-template-columns:1fr auto; gap:16px; border-bottom:1px solid var(--line); background:var(--soft); }
    .tenantHead p { margin:6px 0 0; color:var(--muted); line-height:1.45; }
    .pill { display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:999px; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:.06em; }
    .pass { background:#e9f8f2; color:var(--pass); border:1px solid #b7ebd5; }
    .watch { background:#fff7e6; color:var(--watch); border:1px solid #f2d08a; }
    .fail { background:#fff0ee; color:var(--fail); border:1px solid #ffc6be; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; padding:24px; }
    .page { padding:18px; box-shadow:none; }
    .pageTop { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .score { font-weight:900; font-size:20px; }
    .copy { color:#263957; line-height:1.55; font-size:14px; }
    .findings { margin:12px 0 0; padding-left:18px; color:#5d2d00; }
    .findings li { margin:5px 0; }
    details { margin:16px 24px; padding:0; box-shadow:none; }
    summary { cursor:pointer; padding:16px 18px; font-weight:900; }
    pre { white-space:pre-wrap; overflow:auto; max-height:520px; margin:0; padding:18px; border-top:1px solid var(--line); background:#071734; color:#e8f3ff; font-size:12px; line-height:1.45; }
    .compare { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
    .compareBlock { background:#f8fafc; border:1px solid var(--line); border-radius:12px; padding:12px; }
    .compareBlock strong { display:block; margin-bottom:8px; color:var(--blue); }
    .visualNodes { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; padding:0 24px 24px; }
    .node { border:1px solid var(--line); border-radius:14px; padding:14px; background:#fbfdff; }
    .node b { display:block; margin-bottom:6px; }
    @media (max-width: 1000px) { .summary,.grid,.compare,.visualNodes { grid-template-columns:1fr; } header, main { padding-left:22px; padding-right:22px; } }
  </style>
</head>
<body>
  <header>
    <h1>Home Claude Story QA</h1>
    <p>This report checks the exact governed Home snapshot sent to Claude, the raw/validated Claude response, the copy Home renders from that response, and whether each page block tells a credible client story with the right evidence boundaries.</p>
  </header>
  <main>
    <section class="summary">
      ${metric("Generated", new Date(summary.generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" }))}
      ${metric("Tenants", String(summary.tenants))}
      ${metric("Claude Applied", String(summary.claudeApplied))}
      ${metric("Pass", String(summary.pass))}
      ${metric("Watch / Fail", `${summary.watch} / ${summary.fail}`)}
    </section>
    ${reports.map(renderTenant).join("\n")}
  </main>
</body>
</html>`;
}

function renderTenant(report: TenantReport): string {
  const visual = report.renderedSnapshot.executiveProfile.knowledgeLayerVisual;
  return `<section class="tenant">
    <div class="tenantHead">
      <div>
        <h2>${escapeHtml(report.tenant.displayName)}</h2>
        <p>${escapeHtml(report.opinion)}</p>
      </div>
      <div>
        <span class="pill ${report.overallVerdict}">${report.overallVerdict}</span>
        <p>Claude: ${escapeHtml(report.audit.status)} · ${escapeHtml(report.audit.model)}</p>
        <p>Prompt hash: <code>${escapeHtml(report.audit.promptHash.slice(0, 16))}</code></p>
      </div>
    </div>
    <div class="grid">
      ${report.assessments.map(renderPage).join("\n")}
    </div>
    <h3 style="padding:0 24px 12px;">Rendered Enterprise Layer Visual</h3>
    <div class="visualNodes">
      ${(visual?.nodes ?? [])
        .map(
          (node) => `<div class="node"><b>${escapeHtml(node.label)}</b><div>${escapeHtml(node.detail)}</div><small>${escapeHtml(node.moduleUses.join(" / "))}</small></div>`,
        )
        .join("\n")}
    </div>
    <details>
      <summary>Input prompt sent to Claude</summary>
      <pre>${escapeHtml(report.audit.systemPrompt)}\n\n${escapeHtml(report.audit.userPrompt)}</pre>
    </details>
    <details>
      <summary>Raw Claude response</summary>
      <pre>${escapeHtml(report.audit.rawResponse ?? report.audit.error ?? "No Claude response was produced.")}</pre>
    </details>
    <details>
      <summary>Validated Claude JSON used by Home</summary>
      <pre>${escapeHtml(JSON.stringify(report.audit.parsedResponse, null, 2))}</pre>
    </details>
  </section>`;
}

function renderPage(page: PageAssessment): string {
  return `<article class="page">
    <div class="pageTop">
      <h3>${escapeHtml(page.page)}</h3>
      <span class="pill ${page.verdict}">${page.verdict}</span>
    </div>
    <div class="score">${page.qualityScore}/100</div>
    <div class="compare">
      <div class="compareBlock">
        <strong>Claude response/source</strong>
        <div class="copy">${escapeHtml(page.claudeSource)}</div>
      </div>
      <div class="compareBlock">
        <strong>Rendered Home copy</strong>
        <div class="copy">${escapeHtml(page.renderedSummary)}</div>
      </div>
    </div>
    ${
      page.findings.length
        ? `<ul class="findings">${page.findings.map((finding) => `<li>${escapeHtml(finding)}</li>`).join("")}</ul>`
        : `<p class="copy"><strong>Assessment:</strong> This block is client-story-ready: specific enough, evidence-bounded, and clear about what not to infer yet.</p>`
    }
  </article>`;
}

function metric(label: string, value: string): string {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function parseArgs(argv: string[]) {
  const outDirFlag = argv.find((arg) => arg.startsWith("--outDir="));
  return {
    outDir:
      outDirFlag?.split("=")[1] ??
      process.env.HOME_CLAUDE_STORY_REPORT_DIR ??
      "reports/home-claude-story/latest",
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
