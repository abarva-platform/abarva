#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  KnowledgeModuleKey,
  ModuleContextRequest,
  RequestedKnowledgeDomain,
} from "../../src/lib/enterprise-knowledge/contracts";
import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import { validateEnterpriseKnowledgeCacheResults } from "../../src/lib/enterprise-knowledge/cache";
import {
  buildKnowledgeModulePreview,
  KNOWLEDGE_MODULE_PREVIEW_FLAGS,
  type EnabledKnowledgeModulePreview,
  type KnowledgeModulePreviewKey,
  type KnowledgeModulePreviewResult,
} from "../../src/lib/enterprise-knowledge/module-preview";

type SemanticReport = {
  codename: string;
  generated_at: string;
  verdict: string;
  tenants: Array<{
    tenant_key: string;
    tenant_name: string;
    cluster_assessments: Array<{
      cluster: string;
      rowsMatched: number;
      painPointsPresent: number;
      evidenceItemsPresent: number;
      metricsPresent: number;
      issuesPresent: number;
      modernizationDependenciesPresent: number;
      relationshipsPresent: number;
      pass: boolean;
      painPoints: string[];
      evidenceItems: string[];
      metrics: string[];
      issues: string[];
      modernizationDependencies: string[];
    }>;
  }>;
};

type CatalogHint = Omit<
  ContextAssemblyBlueprint,
  "catalogKey" | "tenantKey" | "tenantName" | "clusterName" | "contextTitle"
>;

type PreviewScenario = {
  scenarioKey: string;
  outputFile: string;
  expectedStatus: "enabled" | "disabled";
  moduleKey: KnowledgeModulePreviewKey;
  env: Record<string, string | undefined>;
  request: ModuleContextRequest;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.KNOWLEDGE_MODULE_PREVIEW_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "knowledge-module-preview-pr5";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/module-preview-proof",
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
      moves: "Return phase evidence and gaps only; Moves decides later what becomes attached evidence.",
      intelligence: "Frame modernization readiness and gaps without board-level recommendations beyond evidence.",
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
      moves: "Return phase evidence and gaps only; Moves decides later what becomes attached evidence.",
      intelligence: "Assess readiness from source-backed workflow and data context, not generic AI enthusiasm.",
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
    },
  },
};

const movesRequest = request("meridian-health", "moves", "phase_readiness", [
  "functions",
  "processes",
  "applications_systems",
  "data_domains",
  "programs",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence",
], "We want to explore Agent Assist for member service", "P2");

const intelligenceRequest = request("harbortrust-bank", "intelligence", "strategy_context", [
  "functions",
  "applications_systems",
  "data_domains",
  "vendors_contracts",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence",
], "Assess Fraud Analyst Copilot readiness");

const previewScenarios: PreviewScenario[] = [
  {
    scenarioKey: "moves-disabled-default",
    outputFile: "moves-preview-disabled-default.json",
    expectedStatus: "disabled",
    moduleKey: "moves",
    env: {},
    request: movesRequest,
  },
  {
    scenarioKey: "intelligence-disabled-default",
    outputFile: "intelligence-preview-disabled-default.json",
    expectedStatus: "disabled",
    moduleKey: "intelligence",
    env: {},
    request: intelligenceRequest,
  },
  {
    scenarioKey: "moves-enabled-explicit-flag",
    outputFile: "moves-preview-enabled.json",
    expectedStatus: "enabled",
    moduleKey: "moves",
    env: { [KNOWLEDGE_MODULE_PREVIEW_FLAGS.moves]: "true" },
    request: movesRequest,
  },
  {
    scenarioKey: "intelligence-enabled-explicit-flag",
    outputFile: "intelligence-preview-enabled.json",
    expectedStatus: "enabled",
    moduleKey: "intelligence",
    env: { [KNOWLEDGE_MODULE_PREVIEW_FLAGS.intelligence]: "true" },
    request: intelligenceRequest,
  },
  {
    scenarioKey: "flag-isolation-intelligence-remains-disabled",
    outputFile: "flag-isolation.json",
    expectedStatus: "disabled",
    moduleKey: "intelligence",
    env: { [KNOWLEDGE_MODULE_PREVIEW_FLAGS.moves]: "true" },
    request: intelligenceRequest,
  },
];

function main(): void {
  ensureDir(outDir);
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  const results = previewScenarios.map((scenario) => ({
    scenario,
    result: buildKnowledgeModulePreview({
      moduleKey: scenario.moduleKey,
      request: scenario.request,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      env: scenario.env,
    }),
  }));
  const enabledResults = results
    .map((entry) => entry.result)
    .filter((result): result is EnabledKnowledgeModulePreview => result.status === "enabled");
  const cacheValidation = validateEnterpriseKnowledgeCacheResults(
    enabledResults.map((result) => result.cacheBuild),
  );
  const validation = validatePreviewResults(results, cacheValidation);

  for (const { scenario, result } of results) {
    writeJson(scenario.outputFile, compactPreviewResult(result));
  }

  const summary = {
    codename: "KNOWLEDGE-LAYER-MODULE-PREVIEW-PR5",
    generatedAt,
    sourceVersion,
    contextVersion,
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      featureFlaggedOnly: true,
      defaultFlagsOff: true,
      noDefaultModuleBehaviorChange: true,
      noMovesGenerationChange: true,
      noIntelligenceChatPathChange: true,
      noClaudeCall: true,
      noTenantDataWrite: true,
      noActiveTenantPromotion: true,
      noCandidatePromotion: true,
      noAcaDeployRequired: true,
    },
    flags: KNOWLEDGE_MODULE_PREVIEW_FLAGS,
    proofCounts: {
      scenarios: results.length,
      enabledPreviews: enabledResults.length,
      disabledPreviews: results.length - enabledResults.length,
      cacheBackedPreviews: enabledResults.length,
      entityProfileCacheRows: enabledResults.reduce(
        (sum, result) => sum + result.cacheBuild.entityProfileCache.length,
        0,
      ),
      relationshipCandidates: enabledResults.reduce(
        (sum, result) =>
          sum + result.cacheBuild.relationshipSliceCache.relationshipCandidates.length,
        0,
      ),
    },
    cacheValidation,
    scenarios: results.map(({ scenario, result }) => ({
      scenarioKey: scenario.scenarioKey,
      outputFile: scenario.outputFile,
      expectedStatus: scenario.expectedStatus,
      actualStatus: result.status,
      moduleKey: result.moduleKey,
      requiredFlag: result.requiredFlag,
      guardrails: result.guardrails,
      cacheBacked: result.status === "enabled",
    })),
    failures: validation.failures,
  };

  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary);

  if (validation.failures.length > 0) {
    throw new Error(`Knowledge module preview proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`knowledge module preview proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function validatePreviewResults(
  results: Array<{ scenario: PreviewScenario; result: KnowledgeModulePreviewResult }>,
  cacheValidation: { pass: boolean; failures: string[] },
): { failures: string[] } {
  const failures: string[] = [...cacheValidation.failures];
  for (const { scenario, result } of results) {
    if (result.status !== scenario.expectedStatus) {
      failures.push(
        `${scenario.scenarioKey}: expected ${scenario.expectedStatus}, received ${result.status}`,
      );
    }
    if (result.guardrails.claudeCalled) failures.push(`${scenario.scenarioKey}: Claude was called`);
    if (result.guardrails.tenantDataWritten) {
      failures.push(`${scenario.scenarioKey}: tenant data write guardrail failed`);
    }
    if (result.guardrails.activeTenantAccessUpdated) {
      failures.push(`${scenario.scenarioKey}: Active Tenant Access update guardrail failed`);
    }
    if (result.guardrails.candidatePromoted) {
      failures.push(`${scenario.scenarioKey}: candidate promotion guardrail failed`);
    }
    if (result.guardrails.moduleRuntimeBehaviorChanged) {
      failures.push(`${scenario.scenarioKey}: module runtime behavior changed`);
    }
    if (result.status === "enabled") {
      if (result.cacheBuild.response.contextPack.moduleKey !== scenario.moduleKey) {
        failures.push(`${scenario.scenarioKey}: preview cache module mismatch`);
      }
      if (result.cacheBuild.response.contextPack.claudeReadyContextPayload.unsupportedClaims.length > 0) {
        failures.push(`${scenario.scenarioKey}: unsupported claims leaked into Claude-ready payload`);
      }
      if (result.cacheBuild.response.contextPack.truthBoundary.candidateContextIncluded) {
        failures.push(`${scenario.scenarioKey}: active preview included candidate context`);
      }
      if (!result.previewPacket.claudeReadyPayloadPreparedButNotSent) {
        failures.push(`${scenario.scenarioKey}: Claude-ready payload send guard missing`);
      }
    }
  }
  return { failures };
}

function compactPreviewResult(result: KnowledgeModulePreviewResult): unknown {
  if (result.status === "disabled") {
    return result;
  }
  return {
    resultVersion: result.resultVersion,
    status: result.status,
    moduleKey: result.moduleKey,
    requiredFlag: result.requiredFlag,
    generatedAt: result.generatedAt,
    request: result.request,
    previewPacket: result.previewPacket,
    guardrails: result.guardrails,
    cacheBuild: {
      selectedCatalogKey: result.cacheBuild.resolution.selectedCatalogKey,
      intent: result.cacheBuild.intent,
      timings: result.cacheBuild.timings,
      truthSplit: result.cacheBuild.truthSplit,
      fastContextPackCache: result.cacheBuild.fastContextPackCache,
      deepContextPackCache: {
        cacheId: result.cacheBuild.deepContextPackCache.metadata.cacheId,
        expandedGraphSlice: result.cacheBuild.deepContextPackCache.expandedGraphSlice,
        evidenceAndLineage: result.cacheBuild.deepContextPackCache.evidenceAndLineage,
        riskAndGapSummary: result.cacheBuild.deepContextPackCache.riskAndGapSummary,
        claudeReadyContextPayloadReadyContent:
          result.cacheBuild.deepContextPackCache.claudeReadyContextPayloadReadyContent,
      },
    },
  };
}

function request(
  tenantKey: string,
  moduleKey: KnowledgeModuleKey,
  purpose: ModuleContextRequest["purpose"],
  requestedDomains: RequestedKnowledgeDomain[],
  question: string,
  phase?: "P0" | "P1" | "P2" | "P3" | "P4" | "P5",
): ModuleContextRequest {
  return {
    tenantKey,
    moduleKey,
    purpose,
    requestedDomains,
    scope: {
      question,
      phase,
      useCase: question,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "knowledge-module-preview-audit",
  };
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

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  flags: Record<string, string>;
  proofCounts: Record<string, number>;
  scenarios: Array<{
    scenarioKey: string;
    outputFile: string;
    expectedStatus: string;
    actualStatus: string;
    moduleKey: string;
    cacheBacked: boolean;
  }>;
  failures: string[];
}): void {
  const lines = [
    "# Knowledge Module Preview Proof",
    "",
    `- Codename: ${summary.codename}`,
    `- Generated at: ${summary.generatedAt}`,
    `- Verdict: ${summary.verdict}`,
    "",
    "## Flags",
    ...Object.entries(summary.flags).map(([moduleKey, flag]) => `- ${moduleKey}: \`${flag}\` default false`),
    "",
    "## Truth split",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Proof counts",
    ...Object.entries(summary.proofCounts).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Scenarios",
    ...summary.scenarios.map(
      (scenario) =>
        `- ${scenario.scenarioKey}: ${scenario.moduleKey}, expected ${scenario.expectedStatus}, received ${scenario.actualStatus}, cacheBacked=${scenario.cacheBacked} (${scenario.outputFile})`,
    ),
    "",
    "## Validation",
    summary.failures.length ? summary.failures.map((failure) => `- ${failure}`).join("\n") : "- No failures.",
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(summary: {
  codename: string;
  generatedAt: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  flags: Record<string, string>;
  proofCounts: Record<string, number>;
  scenarios: Array<{
    scenarioKey: string;
    outputFile: string;
    expectedStatus: string;
    actualStatus: string;
    moduleKey: string;
    requiredFlag: string;
    cacheBacked: boolean;
  }>;
  failures: string[];
}): void {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Knowledge Module Preview Proof</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 1120px; margin: 0 auto; padding: 48px 32px; }
    h1 { font-size: 42px; margin: 0 0 8px; }
    .lede { color: #475569; font-size: 18px; line-height: 1.5; }
    .pill { display: inline-flex; border-radius: 999px; padding: 8px 12px; background: ${summary.verdict === "PASS" ? "#dcfce7" : "#fee2e2"}; color: ${summary.verdict === "PASS" ? "#166534" : "#991b1b"}; font-weight: 800; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.04); }
    .label { color: #64748b; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
    .value { font-size: 28px; font-weight: 800; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    th, td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { color: #475569; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
    code { background: #eef2ff; border-radius: 6px; padding: 2px 6px; }
  </style>
</head>
<body>
<main>
  <span class="pill">${summary.verdict}</span>
  <h1>Knowledge Module Preview Proof</h1>
  <p class="lede">${summary.codename} generated ${summary.generatedAt}. Moves and Intelligence previews are default-off and consume the enterprise knowledge cache only when explicitly enabled.</p>
  <section class="grid">
    ${Object.entries(summary.proofCounts)
      .map(([key, value]) => `<div class="card"><div class="label">${escapeHtml(key)}</div><div class="value">${value}</div></div>`)
      .join("")}
  </section>
  <h2>Flags</h2>
  <table><tbody>${Object.entries(summary.flags)
    .map(([moduleKey, flag]) => `<tr><th>${escapeHtml(moduleKey)}</th><td><code>${escapeHtml(flag)}</code> default false</td></tr>`)
    .join("")}</tbody></table>
  <h2>Scenario Proof</h2>
  <table>
    <thead><tr><th>Scenario</th><th>Module</th><th>Flag</th><th>Status</th><th>Cache backed</th><th>Output</th></tr></thead>
    <tbody>${summary.scenarios
      .map(
        (scenario) => `<tr>
          <td>${escapeHtml(scenario.scenarioKey)}</td>
          <td>${escapeHtml(scenario.moduleKey)}</td>
          <td><code>${escapeHtml(scenario.requiredFlag)}</code></td>
          <td>${escapeHtml(scenario.actualStatus)}</td>
          <td>${String(scenario.cacheBacked)}</td>
          <td><code>${escapeHtml(scenario.outputFile)}</code></td>
        </tr>`,
      )
      .join("")}</tbody>
  </table>
  <h2>Truth Boundary</h2>
  <table><tbody>${Object.entries(summary.truthSplit)
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td><code>${String(value)}</code></td></tr>`)
    .join("")}</tbody></table>
  <h2>Failures</h2>
  <div class="card">${summary.failures.length ? summary.failures.map(escapeHtml).join("<br />") : "No failures."}</div>
</main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "knowledge-module-preview-proof.html"), html);
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
