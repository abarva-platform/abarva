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
import {
  buildEnterpriseKnowledgeContextCaches,
  type EnterpriseKnowledgeCacheBuildResult,
  validateEnterpriseKnowledgeCacheResults,
} from "../../src/lib/enterprise-knowledge/cache";

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

type ScenarioDefinition = {
  scenarioKey: string;
  outputFile: string;
  summary: string;
  requests: Array<{
    role: "fast" | "deep" | "fast_and_deep";
    request: ModuleContextRequest;
  }>;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.KNOWLEDGE_CACHE_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "enterprise-knowledge-cache-pr4";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/cache-proof",
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
      home: "Explain the finance analytics context without treating target-state Databricks as already implemented.",
      tower: "Use budget and value facts only as context; do not claim realized savings.",
      source: "Use vendor and contract context as sourcing inputs; do not assert savings without measured evidence.",
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

const scenarios: ScenarioDefinition[] = [
  {
    scenarioKey: "meridian-finance",
    outputFile: "meridian-finance-cache.json",
    summary: "Home fast cache plus Tower deep cache for finance analytics modernization.",
    requests: [
      {
        role: "fast",
        request: request("meridian-health", "home", "executive_orientation", [
          "functions",
          "applications_systems",
          "data_domains",
          "vendors_contracts",
          "metrics_outcomes",
          "relationships",
          "evidence",
        ], "How should Meridian improve Finance Analytics and reduce reporting pain?"),
      },
      {
        role: "deep",
        request: request("meridian-health", "tower", "measurement_context", [
          "functions",
          "applications_systems",
          "data_domains",
          "vendors_contracts",
          "metrics_outcomes",
          "relationships",
          "evidence",
        ], "How should Meridian improve Finance Analytics and reduce reporting pain?"),
      },
    ],
  },
  {
    scenarioKey: "meridian-agent-assist",
    outputFile: "meridian-agent-assist-cache.json",
    summary: "Moves P2 fast and deep cache for member-service agent assist.",
    requests: [
      {
        role: "fast_and_deep",
        request: request("meridian-health", "moves", "phase_readiness", [
          "functions",
          "processes",
          "applications_systems",
          "data_domains",
          "programs",
          "risks_controls",
          "metrics_outcomes",
          "relationships",
          "evidence",
        ], "We want to explore Agent Assist for member service", "P2"),
      },
    ],
  },
  {
    scenarioKey: "harbortrust-fraud",
    outputFile: "harbortrust-fraud-cache.json",
    summary: "Intelligence fast and deep cache for fraud analyst copilot readiness.",
    requests: [
      {
        role: "fast_and_deep",
        request: request("harbortrust-bank", "intelligence", "strategy_context", [
          "functions",
          "applications_systems",
          "data_domains",
          "vendors_contracts",
          "risks_controls",
          "metrics_outcomes",
          "relationships",
          "evidence",
        ], "Assess Fraud Analyst Copilot readiness"),
      },
    ],
  },
  {
    scenarioKey: "generic-fallback",
    outputFile: "generic-fallback-cache.json",
    summary: "Generic fallback cache for a workflow-modernization request without a hardcoded archetype.",
    requests: [
      {
        role: "fast_and_deep",
        request: request("meridian-health", "moves", "phase_readiness", [
          "functions",
          "processes",
          "applications_systems",
          "vendors_contracts",
          "risks_controls",
          "metrics_outcomes",
          "relationships",
          "evidence",
        ], "How should we modernize the vendor onboarding workflow?", "P0"),
      },
    ],
  },
];

function main(): void {
  ensureDir(outDir);
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  const scenarioResults = scenarios.map((scenario) => buildScenario(scenario, catalog));
  const allBuilds = scenarioResults.flatMap((scenario) => scenario.builds);
  const validation = validateEnterpriseKnowledgeCacheResults(allBuilds);
  const antiHardcoding = scanRuntimeForForbiddenUseCaseBranches();
  const failures = [
    ...validation.failures,
    ...(!antiHardcoding.pass
      ? [`Forbidden runtime use-case branch pattern found: ${antiHardcoding.forbiddenPatterns.join(", ")}`]
      : []),
  ];
  const timing = buildTimingSummary(scenarioResults);

  for (const scenario of scenarioResults) {
    writeJson(scenario.outputFile, compactScenario(scenario));
  }
  writeJson("cache-timing.json", timing);

  const summary = {
    codename: "KNOWLEDGE-LAYER-RUNTIME-FOUNDATION-PR4",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    sourceVersion,
    contextVersion,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      cacheOnly: true,
      noDefaultModuleBehaviorChange: true,
      noHomeUiChange: true,
      noMovesGenerationChange: true,
      noIntelligenceChatPathChange: true,
      noClaudeCall: true,
      noTenantDataWrite: true,
      noActiveTenantPromotion: true,
      noCandidatePromotion: true,
      noAcaDeployRequired: true,
    },
    proofCounts: {
      scenarios: scenarioResults.length,
      cacheBuilds: allBuilds.length,
      entityProfileCacheRows: allBuilds.reduce((sum, build) => sum + build.entityProfileCache.length, 0),
      relationshipSliceCaches: allBuilds.length,
      fastContextPackCaches: allBuilds.length,
      deepContextPackCaches: allBuilds.length,
      evidenceRefs: allBuilds.reduce((sum, build) => sum + build.response.contextPack.evidence.length, 0),
      relationshipCandidates: allBuilds.reduce(
        (sum, build) => sum + build.response.contextPack.relationshipCandidates.length,
        0,
      ),
    },
    validation,
    antiHardcoding,
    timing,
    scenarios: scenarioResults.map((scenario) => ({
      scenarioKey: scenario.scenarioKey,
      outputFile: scenario.outputFile,
      summary: scenario.summary,
      builds: scenario.builds.map((build) => ({
        tenantKey: build.response.contextPack.tenantKey,
        moduleKey: build.response.contextPack.moduleKey,
        purpose: build.response.contextPack.purpose,
        selectedCatalogKey: build.resolution.selectedCatalogKey,
        archetypeKey: build.intent.archetypeKey,
        entityProfileCacheRows: build.entityProfileCache.length,
        relationshipCandidates: build.relationshipSliceCache.relationshipCandidates.length,
        fastCacheId: build.fastContextPackCache.metadata.cacheId,
        deepCacheId: build.deepContextPackCache.metadata.cacheId,
        totalMs: build.timings.totalMs,
        truthBoundary: build.response.contextPack.truthBoundary,
      })),
    })),
    failures,
  };

  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary);

  if (failures.length > 0) {
    throw new Error(`Enterprise knowledge cache proof failed: ${failures.join("; ")}`);
  }
  console.log(`enterprise knowledge cache proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function buildScenario(scenario: ScenarioDefinition, catalog: ContextSourceCatalogEntry[]) {
  const builds = scenario.requests.map(({ request: scenarioRequest }) =>
    buildEnterpriseKnowledgeContextCaches({
      request: scenarioRequest,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      cacheScope: `${scenario.scenarioKey}:${scenarioRequest.moduleKey}`,
      cacheTtlPolicy: "fixture_static",
    }),
  );
  return {
    scenarioKey: scenario.scenarioKey,
    outputFile: scenario.outputFile,
    summary: scenario.summary,
    builds,
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
    actorKey: "enterprise-knowledge-cache-audit",
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

function compactScenario(scenario: ReturnType<typeof buildScenario>): unknown {
  return {
    scenarioKey: scenario.scenarioKey,
    summary: scenario.summary,
    generatedAt,
    sourceVersion,
    contextVersion,
    builds: scenario.builds.map((build) => ({
      request: build.request,
      intent: build.intent,
      resolution: build.resolution,
      timings: build.timings,
      truthSplit: build.truthSplit,
      entityProfileCache: build.entityProfileCache.map((item) => ({
        cacheId: item.metadata.cacheId,
        cacheScope: item.metadata.cacheScope,
        profileId: item.profile.profileId,
        entityType: item.profile.entityType,
        entityName: item.profile.entityName,
        moduleReadiness: item.profile.moduleReadiness,
        evidenceSummary: item.evidenceSummary,
        relationshipSummary: item.relationshipSummary,
        gapSummary: item.gapSummary,
      })),
      relationshipSliceCache: {
        cacheId: build.relationshipSliceCache.metadata.cacheId,
        relationshipTypeCounts: build.relationshipSliceCache.relationshipTypeCounts,
        readinessCounts: build.relationshipSliceCache.readinessCounts,
        relationshipCandidates: build.relationshipSliceCache.relationshipCandidates.map((edge) => ({
          relationshipId: edge.relationshipId,
          relationshipType: edge.relationshipType,
          businessMeaning: edge.businessMeaning,
          readiness: edge.readiness,
          evidenceRefCount: edge.evidenceRefs.length,
        })),
        candidateActiveBoundary: build.relationshipSliceCache.candidateActiveBoundary,
      },
      fastContextPackCache: {
        cacheId: build.fastContextPackCache.metadata.cacheId,
        executiveSummary: build.fastContextPackCache.executiveSummary,
        topEntityProfiles: build.fastContextPackCache.topEntityProfiles,
        topRelationshipSummaries: build.fastContextPackCache.topRelationshipSummaries,
        topMetrics: build.fastContextPackCache.topMetrics,
        topGaps: build.fastContextPackCache.topGaps,
        evidenceSummary: build.fastContextPackCache.evidenceSummary,
        confidenceSummary: build.fastContextPackCache.confidenceSummary,
        unsupportedClaimAuditCount: build.fastContextPackCache.unsupportedClaimAuditCount,
        claudeReadyContextPayload: build.fastContextPackCache.claudeReadyContextPayload,
      },
      deepContextPackCache: {
        cacheId: build.deepContextPackCache.metadata.cacheId,
        profileCount: build.deepContextPackCache.contextPack.relevantEntityProfiles.length,
        factCount: build.deepContextPackCache.contextPack.facts.length,
        expandedGraphSlice: build.deepContextPackCache.expandedGraphSlice,
        evidenceAndLineage: build.deepContextPackCache.evidenceAndLineage,
        riskAndGapSummary: build.deepContextPackCache.riskAndGapSummary,
        claudeReadyContextPayloadReadyContent:
          build.deepContextPackCache.claudeReadyContextPayloadReadyContent,
      },
    })),
  };
}

function buildTimingSummary(scenariosBuilt: Array<ReturnType<typeof buildScenario>>) {
  const allBuilds = scenariosBuilt.flatMap((scenario) => scenario.builds);
  return {
    generatedAt,
    sourceVersion,
    contextVersion,
    target: {
      fastContextPackCacheMs: "<= 25ms fixture dry-run",
      deepContextPackCacheMs: "<= 25ms fixture dry-run",
    },
    builds: allBuilds.map((build) => ({
      tenantKey: build.response.contextPack.tenantKey,
      moduleKey: build.response.contextPack.moduleKey,
      purpose: build.response.contextPack.purpose,
      selectedCatalogKey: build.resolution.selectedCatalogKey,
      timings: build.timings,
    })),
    aggregate: {
      maxFastContextPackCacheMs: Math.max(
        ...allBuilds.map((build) => build.timings.fastContextPackCacheMs),
      ),
      maxDeepContextPackCacheMs: Math.max(
        ...allBuilds.map((build) => build.timings.deepContextPackCacheMs),
      ),
      maxTotalMs: Math.max(...allBuilds.map((build) => build.timings.totalMs)),
      averageTotalMs:
        Math.round(
          (allBuilds.reduce((sum, build) => sum + build.timings.totalMs, 0) /
            allBuilds.length) *
            100,
        ) / 100,
    },
  };
}

function scanRuntimeForForbiddenUseCaseBranches(): {
  pass: boolean;
  scannedFiles: string[];
  forbiddenPatterns: string[];
} {
  const dirs = [
    path.join(repoRoot, "src/lib/enterprise-knowledge/cache"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler"),
  ];
  const scannedFiles = dirs.flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => path.join(dir, file)),
  );
  const forbiddenRegexes = [
    /useCase\s*={2,3}/,
    /focus\s*={2,3}/,
    /fixtureKey\s*={2,3}/,
    /clusterName\s*={2,3}/,
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

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  verdict: string;
  sourceVersion: string;
  contextVersion: string;
  proofCounts: Record<string, number>;
  validation: { pass: boolean; failures: string[] };
  antiHardcoding: { pass: boolean; forbiddenPatterns: string[] };
  timing: ReturnType<typeof buildTimingSummary>;
  truthSplit: Record<string, boolean>;
  scenarios: Array<{ scenarioKey: string; outputFile: string; summary: string }>;
  failures: string[];
}): void {
  const lines = [
    `# Enterprise Knowledge Cache Proof`,
    "",
    `- Codename: ${summary.codename}`,
    `- Generated at: ${summary.generatedAt}`,
    `- Verdict: ${summary.verdict}`,
    `- Source version: ${summary.sourceVersion}`,
    `- Context version: ${summary.contextVersion}`,
    "",
    "## Truth split",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Proof counts",
    ...Object.entries(summary.proofCounts).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Timing",
    `- Max fast cache build: ${summary.timing.aggregate.maxFastContextPackCacheMs}ms`,
    `- Max deep cache build: ${summary.timing.aggregate.maxDeepContextPackCacheMs}ms`,
    `- Max total build: ${summary.timing.aggregate.maxTotalMs}ms`,
    `- Average total build: ${summary.timing.aggregate.averageTotalMs}ms`,
    "",
    "## Scenarios",
    ...summary.scenarios.map((scenario) => `- ${scenario.scenarioKey}: ${scenario.summary} (${scenario.outputFile})`),
    "",
    "## Validation",
    `- Cache validation: ${summary.validation.pass ? "PASS" : "FAIL"}`,
    `- Runtime anti-hardcoding scan: ${summary.antiHardcoding.pass ? "PASS" : "FAIL"}`,
    summary.failures.length ? summary.failures.map((failure) => `- ${failure}`).join("\n") : "- No failures.",
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(summary: {
  codename: string;
  generatedAt: string;
  verdict: string;
  proofCounts: Record<string, number>;
  timing: ReturnType<typeof buildTimingSummary>;
  truthSplit: Record<string, boolean>;
  scenarios: Array<{
    scenarioKey: string;
    outputFile: string;
    summary: string;
    builds: Array<{
      tenantKey: string;
      moduleKey: string;
      purpose: string;
      selectedCatalogKey: string;
      totalMs: number;
    }>;
  }>;
  failures: string[];
}): void {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Enterprise Knowledge Cache Proof</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 1180px; margin: 0 auto; padding: 48px 32px; }
    h1 { font-size: 42px; margin: 0 0 8px; letter-spacing: 0; }
    h2 { margin-top: 36px; font-size: 24px; }
    .lede { color: #475569; font-size: 18px; line-height: 1.5; }
    .pill { display: inline-flex; border-radius: 999px; padding: 8px 12px; background: ${summary.verdict === "PASS" ? "#dcfce7" : "#fee2e2"}; color: ${summary.verdict === "PASS" ? "#166534" : "#991b1b"}; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.04); }
    .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .12em; }
    .value { font-size: 28px; font-weight: 800; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    th, td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
    code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
<main>
  <span class="pill">${summary.verdict}</span>
  <h1>Enterprise Knowledge Cache Proof</h1>
  <p class="lede">${summary.codename} generated ${summary.generatedAt}. This proof builds cache-only entity profiles, relationship slices, fast context packs, and deep context packs without changing module behavior or writing tenant data.</p>
  <section class="grid">
    ${Object.entries(summary.proofCounts)
      .slice(0, 8)
      .map(([key, value]) => `<div class="card"><div class="label">${escapeHtml(key)}</div><div class="value">${value}</div></div>`)
      .join("")}
  </section>
  <h2>Timing</h2>
  <section class="grid">
    <div class="card"><div class="label">Max fast cache</div><div class="value">${summary.timing.aggregate.maxFastContextPackCacheMs}ms</div></div>
    <div class="card"><div class="label">Max deep cache</div><div class="value">${summary.timing.aggregate.maxDeepContextPackCacheMs}ms</div></div>
    <div class="card"><div class="label">Max total</div><div class="value">${summary.timing.aggregate.maxTotalMs}ms</div></div>
    <div class="card"><div class="label">Avg total</div><div class="value">${summary.timing.aggregate.averageTotalMs}ms</div></div>
  </section>
  <h2>Truth Boundary</h2>
  <table>
    <tbody>
      ${Object.entries(summary.truthSplit)
        .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td><code>${String(value)}</code></td></tr>`)
        .join("")}
    </tbody>
  </table>
  <h2>Scenario Builds</h2>
  <table>
    <thead><tr><th>Scenario</th><th>Output</th><th>Summary</th><th>Builds</th></tr></thead>
    <tbody>
      ${summary.scenarios
        .map(
          (scenario) => `<tr>
            <td>${escapeHtml(scenario.scenarioKey)}</td>
            <td><code>${escapeHtml(scenario.outputFile)}</code></td>
            <td>${escapeHtml(scenario.summary)}</td>
            <td>${scenario.builds
              .map(
                (build) =>
                  `${escapeHtml(build.tenantKey)} / ${escapeHtml(build.moduleKey)} / ${escapeHtml(build.purpose)} / ${escapeHtml(build.selectedCatalogKey)} / ${build.totalMs}ms`,
              )
              .join("<br />")}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <h2>Failures</h2>
  <div class="card">${summary.failures.length ? summary.failures.map(escapeHtml).join("<br />") : "No failures."}</div>
</main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "enterprise-knowledge-cache-proof.html"), html);
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
