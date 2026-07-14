#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import {
  buildIntelligenceContextPackDryRun,
  type IntelligenceContextPackDryRunInput,
  type IntelligenceContextPackDryRunResult,
} from "../../src/lib/enterprise-knowledge/intelligence";

type SemanticReport = {
  tenants: Array<{
    tenant_key: string;
    tenant_name: string;
    cluster_assessments: Array<{
      cluster: string;
      rowsMatched: number;
      painPoints: string[];
      evidenceItems: string[];
      metrics: string[];
      issues: string[];
      modernizationDependencies: string[];
      relationshipsPresent: number;
    }>;
  }>;
};

type CatalogHint = Omit<
  ContextAssemblyBlueprint,
  | "catalogKey"
  | "tenantKey"
  | "tenantName"
  | "clusterName"
  | "contextTitle"
>;

type Scenario = {
  outputKey: string;
  title: string;
  input: IntelligenceContextPackDryRunInput;
};

type ScenarioSummary = {
  outputKey: string;
  tenantKey: string;
  question: string;
  audience: string;
  inferredArchetype: string;
  selectedCatalogKey: string;
  profiles: number;
  fastProfiles: number;
  relationships: number;
  evidenceRefs: number;
  gaps: number;
  unsupportedClaims: number;
  initialPayloadUnsupportedClaims: number;
  firstResponseBudgetMs: number;
  completeAnswerBudgetMs: number;
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.INTELLIGENCE_CONTEXT_PACK_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/intelligence-pack-proof",
);

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis: "Finance close, managed analytics services, and spend analytics modernization",
    systems: [
      "Oracle ERP Finance",
      "SQL Server Finance Mart",
      "Informatica Finance ETL",
      "Tableau and Power BI finance dashboards",
      "Databricks Finance Gold",
    ],
    dataDomains: ["GL", "AP", "AR", "vendor spend", "budget", "cost center"],
    infrastructure: ["SQL Server reporting estate", "Databricks on AWS target foundation"],
    vendorsContracts: ["Oracle", "Microsoft", "Informatica", "Databricks", "Tableau"],
    spendContext: [
      "analytics managed services spend",
      "finance dashboard run cost",
      "manual close reconciliation effort",
    ],
    programs: ["Databricks Finance Gold certification", "vendor master harmonization"],
    risksControls: ["inconsistent vendor spend definitions", "slow close-window dashboards"],
    metrics: [
      "close report refresh completion",
      "certified dashboard adoption",
      "manual reconciliation hours",
    ],
    sourceContext: ["analytics managed services", "BI platform contracts", "data platform sourcing"],
    moduleGuidance: {
      intelligence: "Frame modernization readiness, sourcing implications, and measurement gaps without claiming realized savings.",
      moves: "Use finance analytics context to shape scope, baselines, owners, and upload needs.",
      source: "Use vendor and contract context as sourcing inputs; do not assert savings without measured evidence.",
      tower: "Use budget and value facts only as context; do not claim realized savings.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis: "AI-enabled agent assist for member service and contact-center workflows",
    systems: [
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "Claims administration platform",
      "Eligibility and benefits platform",
      "Knowledge base and call transcript store",
    ],
    dataDomains: ["call transcript", "case disposition", "claims status", "eligibility", "benefits"],
    infrastructure: ["contact center integration layer", "audited answer packet"],
    vendorsContracts: ["Genesys", "Salesforce", "claims platform managed services"],
    spendContext: ["agent handle-time baseline", "call deflection hypothesis"],
    programs: ["member-service AI assist", "knowledge article cleanup"],
    risksControls: ["PHI handling", "human-in-the-loop approval", "stale knowledge article duplicates"],
    metrics: ["average handle time", "first-contact resolution", "member satisfaction"],
    sourceContext: ["contact-center platform contracts", "CRM licenses"],
    movesPhase: "P2",
    moduleGuidance: {
      intelligence: "Assess readiness from source-backed workflow, systems, data, metrics, and controls rather than generic AI enthusiasm.",
      moves: "Return phase evidence and gaps only; Moves decides later what becomes attached evidence.",
      home: "Orient the user to loaded service context and evidence limitations.",
    },
  },
  "harbortrust-bank::Fraud Analyst Copilot": {
    primaryFunction: "Fraud Operations",
    outcomeHypothesis: "AI copilot support for fraud analyst triage and case investigation",
    systems: [
      "Fraud alert platform",
      "Fraud case management",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "Fraud feature store",
    ],
    dataDomains: ["fraud alerts", "case outcomes", "AML transactions", "device risk", "model score"],
    infrastructure: ["real-time fraud decisioning", "model governance evaluation set"],
    vendorsContracts: ["KYC vendor", "device intelligence vendor", "core banking provider"],
    spendContext: ["fraud ops queue cost", "loss avoidance measurement baseline"],
    programs: ["fraud analyst copilot", "feature-store feedback loop"],
    risksControls: [
      "model version lineage gaps",
      "case outcome feedback gaps",
      "queue aging mixed with model quality signals",
    ],
    metrics: ["false-positive rate", "analyst queue aging", "confirmed fraud loss"],
    sourceContext: ["KYC vendor context", "device intelligence contract context"],
    movesPhase: "P2",
    moduleGuidance: {
      intelligence: "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      moves: "Return phase evidence and blockers; do not create Move evidence in this PR.",
      source: "Return vendor dependencies as context only; do not initiate sourcing work.",
    },
  },
};

const scenarios: Scenario[] = [
  {
    outputKey: "meridian-agent-assist-readiness",
    title: "Meridian Agent Assist Readiness",
    input: {
      tenantKey: "meridian-health",
      question: "How ready is Meridian for Agent Assist in member service?",
      audience: "CIO",
      mode: "synthetic_fixture",
      requiredDepth: "progressive",
    },
  },
  {
    outputKey: "meridian-finance-analytics-strategy",
    title: "Meridian Finance Analytics Strategy",
    input: {
      tenantKey: "meridian-health",
      question: "How should Meridian improve Finance Analytics and reduce reporting pain?",
      audience: "CDAO",
      mode: "synthetic_fixture",
      requiredDepth: "progressive",
    },
  },
  {
    outputKey: "harbortrust-fraud-copilot-readiness",
    title: "HarborTrust Fraud Copilot Readiness",
    input: {
      tenantKey: "harbortrust-bank",
      question: "Can HarborTrust use AI to help fraud analysts triage alerts?",
      audience: "COO",
      mode: "synthetic_fixture",
      requiredDepth: "progressive",
    },
  },
  {
    outputKey: "generic-enterprise-fallback",
    title: "Generic Enterprise Fallback",
    input: {
      tenantKey: "meridian-health",
      question: "What should this enterprise focus on next to improve AI value?",
      audience: "EVP",
      mode: "synthetic_fixture",
      requiredDepth: "progressive",
    },
  },
];

function main(): void {
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  ensureDir(outDir);

  const results = scenarios.map((scenario) => ({
    scenario,
    result: buildIntelligenceContextPackDryRun({
      input: scenario.input,
      catalog,
      generatedAt,
    }),
  }));

  const validation = validateProof(results);
  const scenarioSummaries = results.map(({ scenario, result }) =>
    summarizeScenario(scenario, result),
  );
  const summary = {
    codename: "INTELLIGENCE-KNOWLEDGE-PR1",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      dryRunOnly: true,
      runtimeAnswerPathChanged: false,
      claudeCalled: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
      deployRequired: false,
    },
    latencyTargets: {
      intentClassificationMs: 500,
      entityResolutionMs: 1000,
      fastContextPackMs: 2000,
      firstClaudeTokenMs: 8000,
      deepContextEnrichmentMs: 15000,
    },
    proofCounts: {
      catalogEntries: catalog.length,
      scenarios: results.length,
      totalProfiles: scenarioSummaries.reduce((sum, item) => sum + item.profiles, 0),
      totalFastProfiles: scenarioSummaries.reduce((sum, item) => sum + item.fastProfiles, 0),
      totalRelationships: scenarioSummaries.reduce((sum, item) => sum + item.relationships, 0),
      totalEvidenceRefs: scenarioSummaries.reduce((sum, item) => sum + item.evidenceRefs, 0),
      totalGaps: scenarioSummaries.reduce((sum, item) => sum + item.gaps, 0),
      totalUnsupportedClaims: scenarioSummaries.reduce(
        (sum, item) => sum + item.unsupportedClaims,
        0,
      ),
    },
    scenarios: scenarioSummaries,
    antiHardcoding: validation.antiHardcoding,
    failures: validation.failures,
  };

  for (const { scenario, result } of results) {
    writeJson(`${scenario.outputKey}.json`, compactResult(scenario, result));
  }
  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary, results);

  if (validation.failures.length > 0) {
    throw new Error(`Intelligence context pack dry-run proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`intelligence context pack dry-run proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function buildCatalog(report: SemanticReport): ContextSourceCatalogEntry[] {
  return report.tenants.flatMap((tenant) =>
    tenant.cluster_assessments.map((cluster) => {
      const hint = catalogHints[`${tenant.tenant_key}::${cluster.cluster}`];
      if (!hint) {
        throw new Error(`Missing catalog hint for ${tenant.tenant_key} / ${cluster.cluster}`);
      }
      const semanticCluster: SemanticClusterInput = {
        tenantKey: tenant.tenant_key,
        tenantName: tenant.tenant_name,
        clusterName: cluster.cluster,
        rowsMatched: cluster.rowsMatched,
        painPoints: cluster.painPoints,
        evidenceItems: cluster.evidenceItems,
        metrics: cluster.metrics,
        issues: cluster.issues,
        modernizationDependencies: cluster.modernizationDependencies,
        relationshipsPresent: cluster.relationshipsPresent,
      };
      const catalogKey = slug(`${tenant.tenant_key}-${cluster.cluster}`);
      return {
        blueprint: {
          catalogKey,
          tenantKey: tenant.tenant_key,
          tenantName: tenant.tenant_name,
          clusterName: cluster.cluster,
          contextTitle: cluster.cluster,
          ...hint,
        },
        semanticCluster,
        inputSources: [
          path.relative(repoRoot, sourceReportPath),
          `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/evidence_summary.csv`,
          `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/relationship_summary.csv`,
        ],
      };
    }),
  );
}

function validateProof(
  items: Array<{ scenario: Scenario; result: IntelligenceContextPackDryRunResult }>,
): {
  failures: string[];
  antiHardcoding: {
    pass: boolean;
    scannedFiles: string[];
    forbiddenPatterns: string[];
  };
} {
  const failures: string[] = [];
  if (items.length !== 4) failures.push(`Expected 4 scenarios, found ${items.length}`);
  for (const { scenario, result } of items) {
    const prefix = scenario.outputKey;
    const pack = result.intelligenceContextPack;
    if (pack.moduleKey !== "intelligence") failures.push(`${prefix}: context pack is not moduleKey=intelligence`);
    if (!result.selectedCatalogKey) failures.push(`${prefix}: no selected catalog`);
    if (!result.intent.archetypeKey) failures.push(`${prefix}: no inferred archetype`);
    if (pack.relevantEntityProfiles.length === 0) failures.push(`${prefix}: no profiles`);
    if (result.fastContextPack.topEntityProfiles.length === 0) failures.push(`${prefix}: no fast profiles`);
    if (result.fastContextPack.topEntityProfiles.length > 10) failures.push(`${prefix}: fast pack is too large`);
    if (pack.relationshipCandidates.length === 0) failures.push(`${prefix}: no relationships`);
    if (result.deepContextPack.expandedRelationshipCount < result.fastContextPack.topRelationshipSummaries.length) {
      failures.push(`${prefix}: deep pack has fewer relationships than fast pack`);
    }
    if (pack.evidence.length === 0) failures.push(`${prefix}: no evidence refs`);
    if (pack.gaps.length === 0) failures.push(`${prefix}: no gaps`);
    if (pack.unsupportedClaims.length === 0) failures.push(`${prefix}: no unsupported claims for audit`);
    if (result.progressiveClaudePayload.initialPayload.unsupportedClaims.length !== 0) {
      failures.push(`${prefix}: unsupported claims leaked into initial Claude payload`);
    }
    if (result.progressiveClaudePayload.auditPayload.excludedUnsupportedClaims.length === 0) {
      failures.push(`${prefix}: unsupported claims missing from audit payload`);
    }
    if (result.streamingTrace.stages.filter((stage) => stage.blocksFirstToken).length === 0) {
      failures.push(`${prefix}: streaming trace has no first-token blocking stages`);
    }
    if (!result.cachePlan.mustNotRebuildFromRawRowsAtRuntime) {
      failures.push(`${prefix}: cache plan does not prohibit raw-row runtime rebuild`);
    }
    const boundary = pack.truthBoundary;
    if (
      boundary.activeTenantAccessUpdated ||
      boundary.productionTenantDataWritten ||
      boundary.candidatePromoted ||
      boundary.moduleRuntimeBehaviorChanged ||
      boundary.sourceAdapterRowsActive
    ) {
      failures.push(`${prefix}: non-destructive truth boundary failed`);
    }
  }
  const antiHardcoding = scanForForbiddenUseCaseBranches();
  if (!antiHardcoding.pass) {
    failures.push(`Forbidden use-case-specific branch pattern found: ${antiHardcoding.forbiddenPatterns.join(", ")}`);
  }
  return { failures, antiHardcoding };
}

function scanForForbiddenUseCaseBranches(): {
  pass: boolean;
  scannedFiles: string[];
  forbiddenPatterns: string[];
} {
  const srcDirs = [
    path.join(repoRoot, "src/lib/enterprise-knowledge/intelligence"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler"),
  ];
  const scannedFiles = srcDirs.flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => path.join(dir, file)),
  );
  const forbiddenRegexes = [
    /useCase\s*={2,3}/,
    /focus\s*={2,3}/,
    /fixtureKey\s*={2,3}/,
    /question\s*={2,3}\s*["'`]/,
    /agent_assist|fraud_copilot|finance_analytics/,
  ];
  const forbiddenPatterns: string[] = [];
  for (const file of scannedFiles) {
    const text = fs.readFileSync(file, "utf8");
    forbiddenRegexes.forEach((regex) => {
      if (regex.test(text)) {
        forbiddenPatterns.push(`${path.relative(repoRoot, file)}:${regex.source}`);
      }
    });
  }
  return {
    pass: forbiddenPatterns.length === 0,
    scannedFiles: scannedFiles.map((file) => path.relative(repoRoot, file)),
    forbiddenPatterns,
  };
}

function summarizeScenario(
  scenario: Scenario,
  result: IntelligenceContextPackDryRunResult,
): ScenarioSummary {
  const pack = result.intelligenceContextPack;
  return {
    outputKey: scenario.outputKey,
    tenantKey: scenario.input.tenantKey,
    question: scenario.input.question,
    audience: scenario.input.audience ?? "executive",
    inferredArchetype: result.intent.archetypeKey,
    selectedCatalogKey: result.selectedCatalogKey,
    profiles: pack.relevantEntityProfiles.length,
    fastProfiles: result.fastContextPack.topEntityProfiles.length,
    relationships: pack.relationshipCandidates.length,
    evidenceRefs: pack.evidence.length,
    gaps: pack.gaps.length,
    unsupportedClaims: pack.unsupportedClaims.length,
    initialPayloadUnsupportedClaims:
      result.progressiveClaudePayload.initialPayload.unsupportedClaims.length,
    firstResponseBudgetMs: result.fastContextPack.targetLatencyMs,
    completeAnswerBudgetMs: result.deepContextPack.targetLatencyMs,
    qualityAssessment: qualityAssessment(result),
  };
}

function qualityAssessment(result: IntelligenceContextPackDryRunResult): string {
  if (result.fastContextPack.topEntityProfiles.length < 5) {
    return "Too thin for executive Intelligence; the fast pack needs more profile coverage before this should drive an answer.";
  }
  if (result.deepContextPack.unsupportedClaims.length > 0 && result.deepContextPack.recommendedNextEvidence.length > 0) {
    return "Hits the mark for design proof: it can start with a compact executive answer and enrich with evidence, caveats, and next evidence without leaking unsupported claims.";
  }
  return "Usable as a progressive dry-run context pack, with caveats preserved for answer rendering.";
}

function compactResult(
  scenario: Scenario,
  result: IntelligenceContextPackDryRunResult,
): unknown {
  const pack = result.intelligenceContextPack;
  return {
    scenario: {
      outputKey: scenario.outputKey,
      title: scenario.title,
      inputPrompt: scenario.input.question,
      tenantKey: scenario.input.tenantKey,
      audience: scenario.input.audience,
    },
    request: result.request,
    response: {
      selectedCatalogKey: result.selectedCatalogKey,
      resolutionScore: result.resolutionScore,
      matchedTokens: result.matchedTokens,
      inferredArchetype: result.intent.archetypeKey,
      intentConfidence: result.intent.confidence,
      explanation: result.response.explanation,
      fastContextPack: result.fastContextPack,
      deepContextPack: result.deepContextPack,
      streamingTrace: result.streamingTrace,
      cachePlan: result.cachePlan,
      progressiveClaudePayload: result.progressiveClaudePayload,
      intelligenceContextPack: {
        contextPackId: pack.contextPackId,
        tenantKey: pack.tenantKey,
        moduleKey: pack.moduleKey,
        purpose: pack.purpose,
        mode: pack.mode,
        truthStatus: pack.truthStatus,
        executiveSummary: pack.executiveSummary,
        profileCount: pack.relevantEntityProfiles.length,
        relationshipCandidateCount: pack.relationshipCandidates.length,
        evidenceRefCount: pack.evidence.length,
        gapCount: pack.gaps.length,
        unsupportedClaims: pack.unsupportedClaims,
        confidenceSummary: pack.confidenceSummary,
        truthBoundary: pack.truthBoundary,
        assemblyTrace: pack.assemblyTrace,
        claudeReadyContextPayload: pack.claudeReadyContextPayload,
      },
    },
    qualityAssessment: qualityAssessment(result),
  };
}

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  sourceSemanticProof: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  latencyTargets: Record<string, number>;
  antiHardcoding: { pass: boolean; forbiddenPatterns: string[] };
  scenarios: ScenarioSummary[];
  failures: string[];
}): void {
  const lines = [
    "# Intelligence Progressive Context Pack Dry-Run Proof",
    "",
    `Status: ${summary.verdict}`,
    `Generated: ${summary.generatedAt}`,
    `Source semantic proof: ${summary.sourceSemanticProof}`,
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Latency Design Targets",
    "",
    ...Object.entries(summary.latencyTargets).map(([key, value]) => `- ${key}: ${value}ms`),
    "",
    "## What This Proves",
    "",
    "Intelligence can become progressive context assembly instead of chat over retrieved rows. The dry run builds a fast context pack for first response, a deep context pack for evidence enrichment, a streaming trace, a cache plan, and a progressive Claude payload. It does not call Claude or change the runtime answer path.",
    "",
    "## Scenario Results",
    "",
    "| Scenario | Tenant | Prompt | Audience | Archetype | Catalog | Fast profiles | Edges | Evidence | Gaps | Audit claims | Initial leaked claims |",
    "| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...summary.scenarios.map(
      (item) =>
        `| ${item.outputKey} | ${item.tenantKey} | ${item.question} | ${item.audience} | ${item.inferredArchetype} | ${item.selectedCatalogKey} | ${item.fastProfiles} | ${item.relationships} | ${item.evidenceRefs} | ${item.gaps} | ${item.unsupportedClaims} | ${item.initialPayloadUnsupportedClaims} |`,
    ),
    "",
    "## Quality Assessment",
    "",
    ...summary.scenarios.flatMap((item) => [
      `### ${item.outputKey}`,
      "",
      item.qualityAssessment,
      "",
    ]),
    "## Anti-Hardcoding Gate",
    "",
    `- pass: ${summary.antiHardcoding.pass}`,
    `- forbidden patterns: ${summary.antiHardcoding.forbiddenPatterns.length ? summary.antiHardcoding.forbiddenPatterns.join(", ") : "none"}`,
  ];
  if (summary.failures.length) {
    lines.push("", "## Failures", "", ...summary.failures.map((failure) => `- ${failure}`));
  }
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(
  summary: { verdict: string; generatedAt: string; truthSplit: Record<string, boolean> },
  items: Array<{ scenario: Scenario; result: IntelligenceContextPackDryRunResult }>,
): void {
  const cards = items
    .map(({ scenario, result }) => `<section class="card">
      <div class="scenario-head">
        <div>
          <p class="eyebrow">${escapeHtml(scenario.outputKey)}</p>
          <h2>${escapeHtml(scenario.title)}</h2>
          <p>${escapeHtml(scenario.input.question)}</p>
        </div>
        <span class="pill">${escapeHtml(result.intent.archetypeKey)}</span>
      </div>
      <div class="metrics">
        <div><span>${result.fastContextPack.topEntityProfiles.length}</span><label>fast profiles</label></div>
        <div><span>${result.intelligenceContextPack.relationshipCandidates.length}</span><label>relationships</label></div>
        <div><span>${result.intelligenceContextPack.evidence.length}</span><label>evidence refs</label></div>
        <div><span>${result.intelligenceContextPack.gaps.length}</span><label>gaps</label></div>
      </div>
      <div class="grid">
        <div>
          <h3>Input prompt to assembler</h3>
          <pre>${escapeHtml(JSON.stringify(result.request, null, 2))}</pre>
        </div>
        <div>
          <h3>Initial Claude payload</h3>
          <pre>${escapeHtml(JSON.stringify(result.progressiveClaudePayload.initialPayload, null, 2))}</pre>
        </div>
      </div>
      <h3>Full dry-run response vs rendered proof</h3>
      <pre>${escapeHtml(JSON.stringify(compactResult(scenario, result), null, 2))}</pre>
      <h3>Quality assessment</h3>
      <p>${escapeHtml(qualityAssessment(result))}</p>
    </section>`)
    .join("\n");
  const truthRows = Object.entries(summary.truthSplit)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${String(value)}</td></tr>`)
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Intelligence Progressive Context Pack Proof</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #071832; background: #f7f8fb; }
    main { max-width: 1280px; margin: 0 auto; padding: 48px 28px; }
    h1 { margin: 0; font-size: 44px; letter-spacing: -0.02em; }
    h2 { margin: 4px 0 8px; font-size: 28px; }
    h3 { margin: 22px 0 10px; font-size: 16px; }
    p { line-height: 1.55; color: #41506b; }
    pre { max-height: 420px; overflow: auto; padding: 14px; background: #0a1630; color: #e8f1ff; border-radius: 10px; font-size: 12px; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dfe5ef; border-radius: 10px; overflow: hidden; }
    th, td { text-align: left; border-bottom: 1px solid #e6ebf3; padding: 12px 14px; }
    .eyebrow { color: #007a68; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .status { display: inline-flex; border-radius: 999px; padding: 7px 13px; font-weight: 800; background: #dff8ef; color: #00664f; }
    .card { background: white; border: 1px solid #dfe5ef; border-radius: 12px; box-shadow: 0 18px 45px rgba(7, 24, 50, .08); padding: 24px; margin-top: 24px; }
    .scenario-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .pill { white-space: nowrap; background: #eef8ff; border: 1px solid #c6e6fb; color: #063a61; border-radius: 999px; padding: 8px 12px; font-weight: 800; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
    .metrics div { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
    .metrics span { display: block; font-size: 28px; font-weight: 900; }
    .metrics label { color: #657391; font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Enterprise Knowledge Layer</p>
    <h1>Intelligence Progressive Context Pack Proof <span class="status">${escapeHtml(summary.verdict)}</span></h1>
    <p>Generated ${escapeHtml(summary.generatedAt)}. This dry run proves fast/deep context assembly, progressive Claude payloads, and audit separation without changing Intelligence runtime behavior.</p>
    <section class="card"><h2>Truth split</h2><table><tbody>${truthRows}</tbody></table></section>
    ${cards}
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "intelligence-context-pack-proof.html"), html);
}

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main();
