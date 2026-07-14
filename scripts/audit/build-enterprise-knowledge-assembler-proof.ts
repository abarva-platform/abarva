#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  KnowledgeModuleKey,
  ModuleContextRequest,
  ModuleContextResponse,
  RequestedKnowledgeDomain,
} from "../../src/lib/enterprise-knowledge/contracts";
import {
  assembleModuleContext,
  classifyContextIntent,
  resolveContextAssemblyInput,
  type ContextAssemblyBlueprint,
  type ContextSourceCatalogEntry,
  type SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";

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
  | "catalogKey"
  | "tenantKey"
  | "tenantName"
  | "clusterName"
  | "contextTitle"
>;

type DryRunDefinition = {
  outputKey: string;
  request: ModuleContextRequest;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.KNOWLEDGE_ASSEMBLER_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/assembler-proof",
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
    risksControls: ["model version lineage gaps", "case outcome feedback gaps", "queue aging mixed with model quality signals"],
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

const dryRuns: DryRunDefinition[] = [
  {
    outputKey: "home-meridian-finance-analytics",
    request: request("meridian-health", "home", "executive_orientation", [
      "functions",
      "applications_systems",
      "data_domains",
      "vendors_contracts",
      "metrics_outcomes",
      "relationships",
      "evidence",
    ], "Explain Finance Analytics context and gaps"),
  },
  {
    outputKey: "moves-meridian-agent-assist-p2",
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
  {
    outputKey: "intelligence-harbortrust-fraud-copilot",
    request: request("harbortrust-bank", "intelligence", "strategy_context", [
      "functions",
      "applications_systems",
      "data_domains",
      "risks_controls",
      "metrics_outcomes",
      "relationships",
      "evidence",
    ], "Assess Fraud Analyst Copilot readiness"),
  },
  {
    outputKey: "tower-meridian-finance-analytics",
    request: request("meridian-health", "tower", "measurement_context", [
      "functions",
      "applications_systems",
      "data_domains",
      "vendors_contracts",
      "metrics_outcomes",
      "relationships",
      "evidence",
    ], "What budget and value context exists for Finance Analytics?"),
  },
  {
    outputKey: "source-meridian-analytics-vendor-context",
    request: request("meridian-health", "source", "sourcing_context", [
      "functions",
      "applications_systems",
      "vendors_contracts",
      "metrics_outcomes",
      "risks_controls",
      "relationships",
      "evidence",
    ], "What vendor and contract context exists for analytics managed services?"),
  },
];

function main(): void {
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  ensureDir(outDir);

  const responses = dryRuns.map((dryRun) => {
    const intent = classifyContextIntent(dryRun.request);
    const resolved = resolveContextAssemblyInput({
      request: dryRun.request,
      intent,
      catalog,
      generatedAt,
    });
    const response = assembleModuleContext(resolved);
    return {
      dryRun,
      response,
      resolution: resolved.resolution,
      intent,
    };
  });

  const validation = validateProof(responses);
  const summary = {
    codename: "KNOWLEDGE-LAYER-DESIGN-PR2",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    truthSplit: {
      dryRunOnly: true,
      runtimeBehaviorChanged: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      deployRequired: false,
    },
    proofCounts: {
      catalogEntries: catalog.length,
      dryRunRequests: responses.length,
      contextPacks: responses.length,
      evidenceRefs: responses.reduce((count, item) => count + item.response.contextPack.evidence.length, 0),
      entityProfiles: responses.reduce((count, item) => count + item.response.contextPack.relevantEntityProfiles.length, 0),
      relationshipCandidates: responses.reduce((count, item) => count + item.response.contextPack.relationshipCandidates.length, 0),
    },
    antiHardcoding: validation.antiHardcoding,
    dryRuns: responses.map(({ dryRun, response, resolution, intent }) => ({
      outputKey: dryRun.outputKey,
      tenantKey: response.contextPack.tenantKey,
      moduleKey: response.contextPack.moduleKey,
      selectedCatalogKey: resolution.selectedCatalogKey,
      archetypeKey: intent.archetypeKey,
      intentConfidence: intent.confidence,
      profileCount: response.contextPack.relevantEntityProfiles.length,
      relationshipCandidateCount: response.contextPack.relationshipCandidates.length,
      evidenceRefCount: response.contextPack.evidence.length,
      unsupportedClaimCount: response.contextPack.unsupportedClaims.length,
      claudePayloadUnsupportedClaimCount: response.claudeReadyPayload.unsupportedClaims.length,
      truthBoundary: response.contextPack.truthBoundary,
      confidence: response.contextPack.confidenceSummary,
    })),
    failures: validation.failures,
  };

  for (const item of responses) {
    writeJson(`${item.dryRun.outputKey}.json`, compactResponse(item.response, item.resolution, item.intent));
  }
  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary);

  if (validation.failures.length > 0) {
    throw new Error(`Enterprise knowledge assembler proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`enterprise knowledge assembler proof PASS: ${path.relative(repoRoot, outDir)}`);
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
    mode: "synthetic_fixture",
    requestedDomains,
    scope: {
      question,
      phase,
      useCase: question,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "enterprise-knowledge-assembler-audit",
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

function validateProof(
  responses: Array<{
    dryRun: DryRunDefinition;
    response: ModuleContextResponse;
    resolution: { selectedCatalogKey: string; score: number; matchedTokens: string[] };
    intent: { archetypeKey: string; confidence: number; requiredDomains: RequestedKnowledgeDomain[] };
  }>,
): {
  failures: string[];
  antiHardcoding: {
    pass: boolean;
    scannedFiles: string[];
    forbiddenPatterns: string[];
  };
} {
  const failures: string[] = [];
  if (responses.length !== 5) failures.push(`Expected 5 dry-run responses, found ${responses.length}`);
  for (const { dryRun, response, resolution, intent } of responses) {
    const pack = response.contextPack;
    if (!resolution.selectedCatalogKey) failures.push(`${dryRun.outputKey}: no resolved catalog key`);
    if (!intent.archetypeKey) failures.push(`${dryRun.outputKey}: no archetype classification`);
    if (pack.relevantEntityProfiles.length === 0) failures.push(`${dryRun.outputKey}: no entity profiles`);
    if (pack.evidence.length === 0) failures.push(`${dryRun.outputKey}: no evidence refs`);
    if (pack.relationshipCandidates.length === 0) failures.push(`${dryRun.outputKey}: no relationship candidates`);
    if (pack.gaps.length === 0) failures.push(`${dryRun.outputKey}: no gaps`);
    if (pack.claudeReadyContextPayload.unsupportedClaims.length !== 0) {
      failures.push(`${dryRun.outputKey}: unsupported claims leaked into Claude-ready payload`);
    }
    if (pack.unsupportedClaims.length === 0) {
      failures.push(`${dryRun.outputKey}: unsupported claims were not recorded for audit`);
    }
    const boundary = pack.truthBoundary;
    if (
      boundary.activeTenantAccessUpdated ||
      boundary.productionTenantDataWritten ||
      boundary.candidatePromoted ||
      boundary.moduleRuntimeBehaviorChanged ||
      boundary.sourceAdapterRowsActive
    ) {
      failures.push(`${dryRun.outputKey}: non-destructive truth boundary failed`);
    }
  }
  const antiHardcoding = scanAssemblerForForbiddenUseCaseBranches();
  if (!antiHardcoding.pass) {
    failures.push(`Forbidden use-case-specific branch pattern found: ${antiHardcoding.forbiddenPatterns.join(", ")}`);
  }
  return { failures, antiHardcoding };
}

function scanAssemblerForForbiddenUseCaseBranches(): {
  pass: boolean;
  scannedFiles: string[];
  forbiddenPatterns: string[];
} {
  const assemblerDir = path.join(repoRoot, "src/lib/enterprise-knowledge/assembler");
  const scannedFiles = fs
    .readdirSync(assemblerDir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => path.join(assemblerDir, file));
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

function compactResponse(
  response: ModuleContextResponse,
  resolution: { selectedCatalogKey: string; score: number; matchedTokens: string[] },
  intent: { archetypeKey: string; confidence: number; requiredDomains: RequestedKnowledgeDomain[]; matchedSignals: string[] },
): unknown {
  const pack = response.contextPack;
  return {
    requestId: response.requestId,
    generatedAt: response.generatedAt,
    selectedCatalogKey: resolution.selectedCatalogKey,
    resolutionScore: resolution.score,
    matchedTokens: resolution.matchedTokens,
    intent,
    explanation: response.explanation,
    contextPack: {
      contextPackId: pack.contextPackId,
      tenantKey: pack.tenantKey,
      moduleKey: pack.moduleKey,
      purpose: pack.purpose,
      mode: pack.mode,
      truthStatus: pack.truthStatus,
      executiveSummary: pack.executiveSummary,
      profileCount: pack.relevantEntityProfiles.length,
      profiles: pack.relevantEntityProfiles.map((profile) => ({
        profileId: profile.profileId,
        entityType: profile.entityType,
        entityName: profile.entityName,
        businessMeaning: profile.businessMeaning,
        moduleReadiness: profile.moduleReadiness,
        evidenceRefCount: profile.evidenceRefs.length,
      })),
      factCount: pack.facts.length,
      relationshipCandidateCount: pack.relationshipCandidates.length,
      relationships: pack.relationshipCandidates.slice(0, 12).map((edge) => ({
        relationshipId: edge.relationshipId,
        relationshipType: edge.relationshipType,
        sourceEntityType: edge.sourceEntityType,
        targetEntityType: edge.targetEntityType,
        businessMeaning: edge.businessMeaning,
        readiness: edge.readiness,
      })),
      evidence: pack.evidence.map((evidence) => ({
        evidenceId: evidence.evidenceId,
        sourceLabel: evidence.sourceLabel,
        truthStatus: evidence.truthStatus,
        citationStatus: evidence.citationStatus,
      })),
      gaps: pack.gaps.map((gap) => ({
        gapId: gap.gapId,
        title: gap.title,
        severity: gap.severity,
        category: gap.category,
        blocksActivePromotion: gap.blocksActivePromotion,
      })),
      unsupportedClaims: pack.unsupportedClaims,
      confidenceSummary: pack.confidenceSummary,
      truthBoundary: pack.truthBoundary,
      assemblyTrace: pack.assemblyTrace,
      claudeReadyPayload: pack.claudeReadyContextPayload,
    },
  };
}

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  sourceSemanticProof: string;
  verdict: string;
  truthSplit: Record<string, boolean>;
  proofCounts: Record<string, number>;
  antiHardcoding: { pass: boolean; forbiddenPatterns: string[] };
  dryRuns: Array<{
    outputKey: string;
    tenantKey: string;
    moduleKey: string;
    selectedCatalogKey: string;
    archetypeKey: string;
    profileCount: number;
    relationshipCandidateCount: number;
    evidenceRefCount: number;
    unsupportedClaimCount: number;
    claudePayloadUnsupportedClaimCount: number;
  }>;
  failures: string[];
}): void {
  const lines = [
    "# Context Pack Assembler Dry-Run Proof",
    "",
    `Status: ${summary.verdict}`,
    `Generated: ${summary.generatedAt}`,
    `Source semantic proof: ${summary.sourceSemanticProof}`,
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Anti-Hardcoding Gate",
    "",
    `- pass: ${summary.antiHardcoding.pass}`,
    `- forbidden patterns: ${summary.antiHardcoding.forbiddenPatterns.length ? summary.antiHardcoding.forbiddenPatterns.join(", ") : "none"}`,
    "",
    "## Dry-Run Requests",
    "",
    "| Output | Tenant | Module | Resolved catalog | Archetype | Profiles | Edges | Evidence | Audit claims | Claude leaked claims |",
    "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...summary.dryRuns.map(
      (item) =>
        `| ${item.outputKey} | ${item.tenantKey} | ${item.moduleKey} | ${item.selectedCatalogKey} | ${item.archetypeKey} | ${item.profileCount} | ${item.relationshipCandidateCount} | ${item.evidenceRefCount} | ${item.unsupportedClaimCount} | ${item.claudePayloadUnsupportedClaimCount} |`,
    ),
    "",
    "## Quality Assessment",
    "",
    "The assembler interprets the module request, classifies it to a reusable archetype, resolves the best tenant context cluster, builds entity profiles, creates relationship candidates, records gaps and unsupported claims, and emits a Claude-ready payload that excludes unsupported claims as facts.",
    "",
    "This is a dry-run proof only. It does not call Claude, mutate tenant data, promote candidates, or change module runtime behavior.",
  ];
  if (summary.failures.length) {
    lines.push("", "## Failures", "", ...summary.failures.map((failure) => `- ${failure}`));
  }
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(summary: {
  verdict: string;
  generatedAt: string;
  dryRuns: Array<{
    outputKey: string;
    tenantKey: string;
    moduleKey: string;
    selectedCatalogKey: string;
    archetypeKey: string;
    profileCount: number;
    relationshipCandidateCount: number;
    evidenceRefCount: number;
    unsupportedClaimCount: number;
    claudePayloadUnsupportedClaimCount: number;
  }>;
}): void {
  const rows = summary.dryRuns
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.outputKey)}</td>
        <td>${escapeHtml(item.tenantKey)}</td>
        <td>${escapeHtml(item.moduleKey)}</td>
        <td>${escapeHtml(item.selectedCatalogKey)}</td>
        <td>${escapeHtml(item.archetypeKey)}</td>
        <td>${item.profileCount}</td>
        <td>${item.relationshipCandidateCount}</td>
        <td>${item.evidenceRefCount}</td>
        <td>${item.unsupportedClaimCount}</td>
        <td>${item.claudePayloadUnsupportedClaimCount}</td>
      </tr>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Context Pack Assembler Proof</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #071832; background: #f7f8fb; }
    main { max-width: 1180px; margin: 0 auto; padding: 48px 28px; }
    h1 { margin: 0; font-size: 42px; letter-spacing: -0.02em; }
    .eyebrow { color: #007a68; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .card { background: white; border: 1px solid #dfe5ef; border-radius: 12px; box-shadow: 0 18px 45px rgba(7, 24, 50, .08); padding: 24px; margin-top: 24px; }
    .status { display: inline-flex; border-radius: 999px; padding: 6px 12px; font-weight: 800; background: #dff8ef; color: #00664f; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; background: white; }
    th, td { text-align: left; border-bottom: 1px solid #e6ebf3; padding: 12px 10px; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #657391; }
    td { font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Enterprise Knowledge Layer</div>
    <h1>Context Pack Assembler Dry-Run Proof</h1>
    <p>Generated ${escapeHtml(summary.generatedAt)}. <span class="status">${escapeHtml(summary.verdict)}</span></p>
    <div class="card">
      <h2>What this proves</h2>
      <p>The same generic assembler interprets arbitrary module requests, resolves tenant context, builds entity profiles, creates relationship candidates, records gaps, and emits governed Claude-ready payloads. The named use cases are validation fixtures only.</p>
    </div>
    <div class="card">
      <h2>Dry-run outputs</h2>
      <table>
        <thead>
          <tr>
            <th>Output</th><th>Tenant</th><th>Module</th><th>Resolved catalog</th><th>Archetype</th><th>Profiles</th><th>Edges</th><th>Evidence</th><th>Audit claims</th><th>Claude leaked claims</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "context-pack-assembler-proof.html"), html);
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
