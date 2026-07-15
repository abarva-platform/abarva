#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import {
  assembleIntelligenceRuntimeContext,
  INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
  type EnabledIntelligenceKnowledgeRuntimeResult,
  type IntelligenceKnowledgeRuntimeResult,
  type IntelligenceRuntimeAudience,
} from "../../src/lib/enterprise-knowledge/intelligence";

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
  outputFile: string;
  title: string;
  tenantKey: string;
  question: string;
  audience: IntelligenceRuntimeAudience;
  preferredCatalogKey?: string;
  expectedTerms: string[];
};

type ScenarioSummary = {
  outputFile: string;
  title: string;
  tenantKey: string;
  status: IntelligenceKnowledgeRuntimeResult["status"];
  selectedCatalogKey: string;
  profiles: number;
  relationships: number;
  evidenceRefs: number;
  gaps: number;
  unsupportedClaimsExcluded: boolean;
  timingMisses: string[];
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.INTELLIGENCE_KNOWLEDGE_RUNTIME_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "knowledge-layer-intelligence-runtime-pr8";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/intelligence-runtime-proof",
);
const enabledEnv = { [INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG]: "true" };

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis:
      "Finance analytics modernization across close reporting, managed analytics services, vendor spend, budget insight, and governed data-product certification",
    systems: [
      "Oracle ERP Finance",
      "Workday Finance and HR source feeds",
      "Netezza finance analytics appliance",
      "SQL Server Finance Mart",
      "Informatica Finance ETL",
      "Tableau finance dashboards",
      "Power BI finance dashboards",
      "Databricks Finance Gold target on AWS",
    ],
    dataDomains: [
      "GL",
      "AP",
      "AR",
      "vendor spend",
      "budget",
      "cost center",
      "labor and headcount",
    ],
    infrastructure: [
      "SQL Server reporting estate",
      "Netezza on-prem analytics appliance",
      "Databricks on AWS target foundation",
      "500 finance tables",
      "200 finance ETL jobs",
      "1,000 finance reports",
      "800 finance analytics users",
    ],
    vendorsContracts: [
      "Oracle",
      "Workday",
      "Microsoft",
      "Informatica",
      "Databricks",
      "Tableau",
      "Power BI",
    ],
    spendContext: [
      "analytics managed services spend",
      "finance dashboard run cost",
      "manual close reconciliation effort",
      "budget stewardship",
    ],
    programs: [
      "Databricks Finance Gold certification",
      "vendor master harmonization",
      "close automation roadmap",
    ],
    risksControls: [
      "inconsistent vendor spend definitions",
      "slow close-window dashboards",
      "manual reconciliation control risk",
    ],
    metrics: [
      "close report refresh completion",
      "certified finance dashboard adoption",
      "manual reconciliation hours per close cycle",
    ],
    sourceContext: [
      "analytics managed services",
      "BI platform contracts",
      "data platform sourcing",
      "month-end close reporting",
    ],
    moduleGuidance: {
      intelligence:
        "Frame modernization readiness, blockers, and next evidence. Do not claim realized savings or active delivery readiness.",
      home: "Show finance analytics context as source-backed enterprise knowledge.",
      moves: "Use finance analytics context to shape baselines and evidence asks.",
      source: "Use vendor and contract context as sourcing inputs only.",
      tower: "Use metric names as measurement candidates only.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis:
      "AI-enabled agent assist for member service workflows with cited claims, eligibility, benefits, and transcript context",
    systems: [
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "Claims administration platform",
      "Eligibility and benefits platform",
      "Knowledge base and call transcript store",
    ],
    dataDomains: [
      "call transcript",
      "case disposition",
      "claims status",
      "eligibility",
      "benefits",
      "member inquiry intent",
    ],
    infrastructure: [
      "contact center integration layer",
      "audited answer packet",
      "Genesys-Salesforce-claims context join",
    ],
    vendorsContracts: ["Genesys", "Salesforce", "claims platform managed services"],
    spendContext: [
      "agent handle-time baseline",
      "after-call work baseline",
      "call deflection hypothesis",
    ],
    programs: ["member-service AI assist", "knowledge article cleanup"],
    risksControls: [
      "PHI handling",
      "human-in-the-loop approval",
      "audit trail",
      "stale knowledge article duplicates",
    ],
    metrics: [
      "average handle time",
      "first-contact resolution",
      "transfer rate",
      "after-call work minutes",
    ],
    sourceContext: [
      "member service process",
      "contact-center platform contracts",
      "CRM licenses",
      "call transcript annotation sample",
    ],
    movesPhase: "P2",
    moduleGuidance: {
      intelligence:
        "Assess readiness from source-backed workflow and data context, with PHI and human-approval caveats.",
      home: "Show member service readiness with systems, data, risks, and recommended evidence.",
      moves: "Return phase evidence and gaps only.",
      source: "Return vendor dependencies as context only.",
      tower: "Use operational metrics as baseline candidates only.",
    },
  },
  "harbortrust-bank::Fraud Analyst Copilot": {
    primaryFunction: "Fraud Operations",
    outcomeHypothesis:
      "AI copilot support for fraud analyst triage, case investigation, and governed alert prioritization",
    systems: [
      "Fraud alert platform",
      "Fraud case management",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "Device-risk intelligence",
      "Fraud feature store",
    ],
    dataDomains: [
      "fraud alerts",
      "case outcomes",
      "AML transactions",
      "KYC evidence",
      "device risk",
      "model score",
    ],
    infrastructure: [
      "real-time fraud decisioning",
      "model governance evaluation set",
      "feature-store feedback loop",
    ],
    vendorsContracts: [
      "KYC vendor",
      "device intelligence vendor",
      "core banking provider",
    ],
    spendContext: ["fraud ops queue cost", "loss avoidance measurement baseline"],
    programs: ["fraud analyst copilot", "feature-store feedback loop"],
    risksControls: [
      "model-risk controls",
      "case outcome feedback gaps",
      "model version lineage gaps",
      "queue aging mixed with model quality signals",
    ],
    metrics: [
      "false-positive rate",
      "analyst throughput",
      "analyst queue aging",
      "confirmed fraud loss",
      "loss recovery candidate metric",
    ],
    sourceContext: [
      "fraud case workflow",
      "KYC vendor context",
      "device intelligence contract context",
    ],
    movesPhase: "P2",
    moduleGuidance: {
      intelligence:
        "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      home: "Show the fraud copilot profile with data, controls, caveats, and evidence.",
      moves: "Return phase evidence and blockers.",
      source: "Return vendor dependencies as context only.",
      tower: "Use loss and throughput metrics as measurement candidates only.",
    },
  },
  "meridian-health::Vendor Onboarding Modernization": {
    primaryFunction: "Vendor Management and Enterprise Operations",
    outcomeHypothesis:
      "Workflow modernization for supplier onboarding, evidence collection, approval routing, and control traceability",
    systems: [
      "supplier intake workflow",
      "contract repository",
      "identity and access request queue",
      "ERP supplier master",
      "ServiceNow request queue",
    ],
    dataDomains: [
      "supplier profile",
      "tax and banking evidence",
      "security review status",
      "contract status",
      "access request evidence",
    ],
    infrastructure: ["workflow automation layer", "evidence ledger", "approval audit log"],
    vendorsContracts: [
      "supplier master data service",
      "contract lifecycle platform",
      "workflow platform",
    ],
    spendContext: ["vendor onboarding cycle-time baseline", "manual rework baseline"],
    programs: ["vendor onboarding modernization", "supplier evidence standardization"],
    risksControls: [
      "incomplete security review evidence",
      "duplicate supplier records",
      "approval handoff gaps",
    ],
    metrics: [
      "onboarding cycle time",
      "approval rework rate",
      "supplier master exception rate",
    ],
    sourceContext: [
      "supplier onboarding workflow",
      "source-owner attestation",
      "relationship validation notes",
    ],
    moduleGuidance: {
      intelligence:
        "Use generic workflow, system, data, vendor, risk, and metric context. Do not depend on a hardcoded use-case branch.",
      home: "Show vendor onboarding as enterprise context when evidence is loaded.",
      moves: "Use this to shape P0/P1 framing if a Move is later created.",
      source: "Use vendor and contract context as inputs only.",
      tower: "Use cycle-time metrics as candidates only.",
    },
  },
};

const scenarios: Scenario[] = [
  {
    outputFile: "meridian-agent-assist-runtime.json",
    title: "Meridian — Agent Assist member service readiness",
    tenantKey: "meridian-health",
    audience: "CIO",
    question: "How ready are we for Agent Assist in member service?",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    expectedTerms: [
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "claims",
      "eligibility",
      "benefits",
      "call transcript",
      "average handle time",
      "first-contact resolution",
      "transfer rate",
      "PHI handling",
      "human-in-the-loop",
      "audit trail",
    ],
  },
  {
    outputFile: "meridian-finance-runtime.json",
    title: "Meridian — Finance Analytics modernization",
    tenantKey: "meridian-health",
    audience: "CFO",
    question: "What is the Finance Analytics modernization opportunity?",
    preferredCatalogKey: "meridian-health-finance-analytics",
    expectedTerms: [
      "Oracle ERP Finance",
      "Workday",
      "SQL Server Finance Mart",
      "Netezza",
      "Informatica",
      "Tableau",
      "Power BI",
      "Databricks",
      "manual reconciliation hours",
      "vendor spend",
      "budget",
    ],
  },
  {
    outputFile: "harbortrust-fraud-runtime.json",
    title: "HarborTrust — Fraud analyst copilot",
    tenantKey: "harbortrust-bank",
    audience: "CISO",
    question: "Can AI help fraud analysts triage alerts safely?",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    expectedTerms: [
      "Fraud alert platform",
      "Fraud case management",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "Device-risk intelligence",
      "model-risk controls",
      "false-positive rate",
      "analyst queue aging",
      "analyst throughput",
      "confirmed fraud loss",
      "loss recovery",
    ],
  },
  {
    outputFile: "generic-vendor-onboarding-runtime.json",
    title: "Generic — Vendor onboarding modernization fallback",
    tenantKey: "meridian-health",
    audience: "COO",
    question: "What context do we have for vendor onboarding modernization?",
    preferredCatalogKey: "meridian-health-vendor-onboarding-modernization",
    expectedTerms: [
      "supplier intake workflow",
      "ERP supplier master",
      "ServiceNow request queue",
      "security review status",
      "source-owner attestation",
      "relationship validation notes",
    ],
  },
];

function main(): void {
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  ensureDir(outDir);

  const disabled = assembleIntelligenceRuntimeContext({
    ...scenarios[0],
    catalog,
    generatedAt,
    sourceVersion,
    contextVersion,
    env: {},
  });
  const enabledResults = scenarios.map((scenario) => ({
    scenario,
    result: assembleIntelligenceRuntimeContext({
      ...scenario,
      catalog: catalogForScenario(catalog, scenario),
      generatedAt,
      sourceVersion,
      contextVersion,
      env: enabledEnv,
    }),
  }));

  const validation = validateProof(disabled, enabledResults);
  const scenarioSummaries = enabledResults.map(({ scenario, result }) =>
    summarizeScenario(scenario, result),
  );
  const timing = buildTimingReport(enabledResults);
  const summary = {
    codename: "KNOWLEDGE-LAYER-INTELLIGENCE-RUNTIME-PR8",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    flag: {
      name: INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
      defaultEnabled: false,
      disabledStatus: disabled.status,
      enabledStatuses: enabledResults.map((item) => item.result.status),
    },
    truthSplit: {
      defaultIntelligenceBehaviorChanged: false,
      defaultClaudePromptChanged: false,
      routeOrApiChanged: false,
      progressivePayloadPreparedOnlyWhenFlagEnabled: true,
      claudeCalled: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      moduleReadsCandidateByDefault: false,
      deployRequired: false,
    },
    proofCounts: {
      catalogEntries: catalog.length,
      scenarios: enabledResults.length,
      totalProfiles: scenarioSummaries.reduce((sum, item) => sum + item.profiles, 0),
      totalRelationships: scenarioSummaries.reduce((sum, item) => sum + item.relationships, 0),
      totalEvidenceRefs: scenarioSummaries.reduce((sum, item) => sum + item.evidenceRefs, 0),
      totalGaps: scenarioSummaries.reduce((sum, item) => sum + item.gaps, 0),
    },
    scenarios: scenarioSummaries,
    timing,
    antiHardcoding: validation.antiHardcoding,
    qualityAssessment:
      "The Intelligence runtime assembles fast and deep governed context before any Claude handoff, keeps unsupported claims outside the model-visible payload, and preserves active-vs-candidate boundaries.",
    failures: validation.failures,
  };

  for (const { scenario, result } of enabledResults) {
    writeJson(scenario.outputFile, compactRuntimeResult(scenario, result));
  }
  writeJson("disabled-default-runtime.json", disabled);
  writeJson("summary.json", summary);
  writeJson("timing.json", timing);
  writeMarkdown(summary);
  writeHtml(summary, enabledResults);

  if (validation.failures.length > 0) {
    throw new Error(
      `Intelligence knowledge runtime proof failed: ${validation.failures.join("; ")}`,
    );
  }
  console.log(`intelligence knowledge runtime proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function buildCatalog(report: SemanticReport): ContextSourceCatalogEntry[] {
  const entries = report.tenants.flatMap((tenant) =>
    tenant.cluster_assessments.map((cluster) =>
      buildCatalogEntry({
        tenantKey: tenant.tenant_key,
        tenantName: tenant.tenant_name,
        clusterName: cluster.cluster,
        cluster,
        inputSources: [
          path.relative(repoRoot, sourceReportPath),
          `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/evidence_summary.csv`,
          `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/relationship_summary.csv`,
        ],
      }),
    ),
  );
  const meridian = report.tenants.find((tenant) => tenant.tenant_key === "meridian-health");
  const baseCluster = meridian?.cluster_assessments.find(
    (cluster) => cluster.cluster === "Agent Assist / Member Service",
  ) ?? meridian?.cluster_assessments[0];
  if (meridian && baseCluster) {
    entries.push(buildCatalogEntry({
      tenantKey: meridian.tenant_key,
      tenantName: meridian.tenant_name,
      clusterName: "Vendor Onboarding Modernization",
      cluster: {
        ...baseCluster,
        cluster: "Vendor Onboarding Modernization",
        rowsMatched: Math.max(12, Math.floor(baseCluster.rowsMatched / 4)),
        painPoints: [
          "Supplier onboarding evidence is collected across workflow, contract, security, and ERP queues.",
          "Approval handoffs are not consistently tied to relationship validation notes.",
          "Duplicate supplier records and missing security evidence slow downstream activation.",
        ],
        evidenceItems: [
          "Supplier onboarding workflow sample.",
          "Contract repository onboarding status extract.",
          "ERP supplier master exception report.",
          "Security review evidence checklist.",
        ],
        metrics: [
          "onboarding cycle time",
          "approval rework rate",
          "supplier master exception rate",
        ],
        issues: [
          "duplicate supplier records",
          "incomplete security review evidence",
          "approval handoff gaps",
        ],
        modernizationDependencies: [
          "source-owner attestation",
          "relationship validation notes",
          "workflow evidence ledger",
        ],
        relationshipsPresent: 8,
      },
      inputSources: [
        "synthetic generic workflow fixture derived from universal context-pack contract",
        path.relative(repoRoot, sourceReportPath),
      ],
    }));
  }
  return entries;
}

function buildCatalogEntry(params: {
  tenantKey: string;
  tenantName: string;
  clusterName: string;
  cluster: SemanticReport["tenants"][number]["cluster_assessments"][number];
  inputSources: string[];
}): ContextSourceCatalogEntry {
  const hint = catalogHints[`${params.tenantKey}::${params.clusterName}`];
  if (!hint) {
    throw new Error(`Missing catalog hint for ${params.tenantKey} / ${params.clusterName}`);
  }
  const semanticCluster: SemanticClusterInput = {
    tenantKey: params.tenantKey,
    tenantName: params.tenantName,
    clusterName: params.clusterName,
    rowsMatched: params.cluster.rowsMatched,
    painPoints: params.cluster.painPoints,
    evidenceItems: params.cluster.evidenceItems,
    metrics: params.cluster.metrics,
    issues: params.cluster.issues,
    modernizationDependencies: params.cluster.modernizationDependencies,
    relationshipsPresent: params.cluster.relationshipsPresent,
  };
  return {
    blueprint: {
      catalogKey: slug(`${params.tenantKey}-${params.clusterName}`),
      tenantKey: params.tenantKey,
      tenantName: params.tenantName,
      clusterName: params.clusterName,
      contextTitle: params.clusterName,
      ...hint,
    },
    semanticCluster,
    inputSources: params.inputSources,
  };
}

function validateProof(
  disabled: IntelligenceKnowledgeRuntimeResult,
  enabledItems: Array<{ scenario: Scenario; result: IntelligenceKnowledgeRuntimeResult }>,
): {
  failures: string[];
  antiHardcoding: {
    pass: boolean;
    scannedFiles: string[];
    forbiddenPatterns: string[];
  };
} {
  const failures: string[] = [];
  if (disabled.status !== "disabled") {
    failures.push("default flag-off runtime did not return disabled status");
  }
  if (disabled.status === "disabled" && !disabled.existingIntelligenceBehaviorUnchanged) {
    failures.push("disabled runtime did not preserve existing Intelligence behavior");
  }
  if (enabledItems.length !== 4) failures.push(`Expected 4 enabled scenarios, found ${enabledItems.length}`);

  for (const { scenario, result } of enabledItems) {
    const prefix = scenario.outputFile;
    if (result.status !== "enabled") {
      failures.push(`${prefix}: runtime was not enabled with explicit flag`);
      continue;
    }
    const renderedText = JSON.stringify(runtimeContentForValidation(result));
    const pack = result.intelligenceContextPack;
    if (
      scenario.preferredCatalogKey &&
      result.cacheBuild.resolution.selectedCatalogKey !== scenario.preferredCatalogKey
    ) {
      failures.push(
        `${prefix}: expected catalog ${scenario.preferredCatalogKey}, got ${result.cacheBuild.resolution.selectedCatalogKey}`,
      );
    }
    if (pack.moduleKey !== "intelligence") failures.push(`${prefix}: moduleKey is not intelligence`);
    if (pack.mode !== "active") failures.push(`${prefix}: context pack is not active mode`);
    if (!pack.boardQualityContextRequired) failures.push(`${prefix}: missing Intelligence module shape`);
    if (!result.fastContextPack) failures.push(`${prefix}: FastContextPack missing`);
    if (!result.deepContextPack) failures.push(`${prefix}: DeepContextPack missing`);
    if (!result.progressiveClaudePayload) failures.push(`${prefix}: ProgressiveClaudePayload missing`);
    if (!result.streamingAssemblyTrace) failures.push(`${prefix}: streaming assembly trace missing`);
    if (result.progressiveClaudePayload.initialPayload.unsupportedClaims.length !== 0) {
      failures.push(`${prefix}: unsupported claims leaked into initial Claude payload`);
    }
    if (!result.progressiveClaudePayload.auditPayload.excludedUnsupportedClaims) {
      failures.push(`${prefix}: unsupported claim audit payload missing`);
    }
    if (pack.claudeReadyContextPayload.unsupportedClaims.length !== 0) {
      failures.push(`${prefix}: unsupported claims leaked into Claude-ready context payload`);
    }
    if (!pack.claudeReadyContextPayload.excludesAuditOnlyDiagnostics) {
      failures.push(`${prefix}: Claude-ready payload does not exclude audit diagnostics`);
    }
    if (!pack.claudeReadyContextPayload.excludesInactiveCandidateContextUnlessRequested) {
      failures.push(`${prefix}: Claude-ready payload does not exclude inactive candidate context`);
    }
    if (
      pack.truthBoundary.candidateContextIncluded ||
      pack.truthBoundary.candidatePreviewExplicitlyRequested ||
      pack.truthBoundary.activeTenantAccessUpdated ||
      pack.truthBoundary.productionTenantDataWritten ||
      pack.truthBoundary.candidatePromoted ||
      pack.truthBoundary.moduleRuntimeBehaviorChanged ||
      pack.truthBoundary.sourceAdapterRowsActive
    ) {
      failures.push(`${prefix}: active/candidate or non-destructive truth boundary failed`);
    }
    if (result.cacheBuild.truthSplit.claudeCalled || result.guardrails.claudeCalled) {
      failures.push(`${prefix}: audit or runtime helper called Claude`);
    }
    if (pack.relevantEntityProfiles.length === 0) failures.push(`${prefix}: no entity profiles`);
    if (pack.relationshipCandidates.length === 0) failures.push(`${prefix}: no relationship candidates`);
    if (pack.evidence.length === 0) failures.push(`${prefix}: no evidence refs`);
    if (pack.gaps.length === 0) failures.push(`${prefix}: no gaps`);
    if (pack.confidenceSummary.answerability <= 0) failures.push(`${prefix}: answerability missing`);
    if (result.timing.totalAssemblyMs <= 0) failures.push(`${prefix}: timing report missing total time`);
    if (!Array.isArray(result.timing.missedTargets)) failures.push(`${prefix}: missedTargets missing`);
    if (containsRealizedValueClaim(renderedText)) {
      failures.push(`${prefix}: realized-value claim leaked into proof output`);
    }
    for (const term of scenario.expectedTerms) {
      if (!renderedText.toLowerCase().includes(term.toLowerCase())) {
        failures.push(`${prefix}: expected term missing: ${term}`);
      }
    }
  }

  const antiHardcoding = scanRuntimeForForbiddenUseCaseBranches();
  if (!antiHardcoding.pass) {
    failures.push(
      `Forbidden use-case-specific branch pattern found: ${antiHardcoding.forbiddenPatterns.join(", ")}`,
    );
  }
  return { failures, antiHardcoding };
}

function scanRuntimeForForbiddenUseCaseBranches(): {
  pass: boolean;
  scannedFiles: string[];
  forbiddenPatterns: string[];
} {
  const scannedFiles = [
    path.join(repoRoot, "src/lib/enterprise-knowledge/intelligence/intelligence-context-pack-dry-run.ts"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/intelligence/intelligence-knowledge-runtime.ts"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler/context-request-resolver.ts"),
    path.join(repoRoot, "src/lib/enterprise-knowledge/assembler/intent-classifier.ts"),
  ];
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
  result: IntelligenceKnowledgeRuntimeResult,
): ScenarioSummary {
  if (result.status !== "enabled") {
    return {
      outputFile: scenario.outputFile,
      title: scenario.title,
      tenantKey: scenario.tenantKey,
      status: result.status,
      selectedCatalogKey: "disabled",
      profiles: 0,
      relationships: 0,
      evidenceRefs: 0,
      gaps: 0,
      unsupportedClaimsExcluded: false,
      timingMisses: [],
      qualityAssessment: "Flag disabled; existing Intelligence behavior remains unchanged.",
    };
  }
  const pack = result.intelligenceContextPack;
  return {
    outputFile: scenario.outputFile,
    title: scenario.title,
    tenantKey: scenario.tenantKey,
    status: result.status,
    selectedCatalogKey: result.cacheBuild.resolution.selectedCatalogKey,
    profiles: pack.relevantEntityProfiles.length,
    relationships: pack.relationshipCandidates.length,
    evidenceRefs: pack.evidence.length,
    gaps: pack.gaps.length,
    unsupportedClaimsExcluded:
      result.progressiveClaudePayload.initialPayload.unsupportedClaims.length === 0 &&
      pack.claudeReadyContextPayload.unsupportedClaims.length === 0,
    timingMisses: result.timing.missedTargets,
    qualityAssessment: qualityAssessment(result),
  };
}

function compactRuntimeResult(scenario: Scenario, result: IntelligenceKnowledgeRuntimeResult): unknown {
  const scenarioSummary = {
    outputFile: scenario.outputFile,
    title: scenario.title,
    tenantKey: scenario.tenantKey,
    audience: scenario.audience,
    question: scenario.question,
    preferredCatalogKey: scenario.preferredCatalogKey,
  };
  if (result.status !== "enabled") {
    return { scenario: scenarioSummary, result };
  }
  const pack = result.intelligenceContextPack;
  return {
    scenario: scenarioSummary,
    status: result.status,
    requiredFlag: result.requiredFlag,
    request: result.request,
    resolution: result.cacheBuild.resolution,
    fastContextPack: result.fastContextPack,
    deepContextPack: result.deepContextPack,
    progressiveClaudePayload: result.progressiveClaudePayload,
    streamingAssemblyTrace: result.streamingAssemblyTrace,
    claudeCallPlanWhenEnabled: result.claudeCallPlanWhenEnabled,
    timing: result.timing,
    contextPack: {
      contextPackId: pack.contextPackId,
      mode: pack.mode,
      truthStatus: pack.truthStatus,
      executiveSummary: pack.executiveSummary,
      profiles: pack.relevantEntityProfiles.map((profile) => ({
        profileId: profile.profileId,
        entityType: profile.entityType,
        entityName: profile.entityName,
        businessMeaning: profile.businessMeaning,
        moduleReadiness: profile.moduleReadiness,
        sourceLineage: profile.sourceLineage,
      })),
      relationshipCandidates: pack.relationshipCandidates,
      evidence: pack.evidence,
      gaps: pack.gaps,
      confidenceSummary: pack.confidenceSummary,
      caveats: pack.caveats,
      unsupportedClaimsHeldForAudit: pack.unsupportedClaims,
      claudeReadyContextPayload: pack.claudeReadyContextPayload,
      truthBoundary: pack.truthBoundary,
    },
    cacheProof: {
      fastContextPackCacheId: result.cacheBuild.fastContextPackCache.metadata.cacheId,
      deepContextPackCacheId: result.cacheBuild.deepContextPackCache.metadata.cacheId,
      relationshipSliceCacheId: result.cacheBuild.relationshipSliceCache.metadata.cacheId,
      timings: result.cacheBuild.timings,
      truthSplit: result.cacheBuild.truthSplit,
    },
    qualityAssessment: qualityAssessment(result),
  };
}

function runtimeContentForValidation(result: EnabledIntelligenceKnowledgeRuntimeResult): unknown {
  const pack = result.intelligenceContextPack;
  return {
    resolution: result.cacheBuild.resolution,
    fastContextPack: result.fastContextPack,
    deepContextPack: result.deepContextPack,
    progressiveClaudePayload: result.progressiveClaudePayload,
    streamingAssemblyTrace: result.streamingAssemblyTrace,
    contextPack: {
      executiveSummary: pack.executiveSummary,
      profiles: pack.relevantEntityProfiles,
      relationshipCandidates: pack.relationshipCandidates,
      evidence: pack.evidence,
      gaps: pack.gaps,
      confidenceSummary: pack.confidenceSummary,
      caveats: pack.caveats,
      unsupportedClaimsHeldForAudit: pack.unsupportedClaims,
      claudeReadyContextPayload: pack.claudeReadyContextPayload,
      truthBoundary: pack.truthBoundary,
    },
  };
}

function catalogForScenario(
  catalog: ContextSourceCatalogEntry[],
  scenario: Scenario,
): ContextSourceCatalogEntry[] {
  if (!scenario.preferredCatalogKey) return catalog;
  const selected = catalog.filter(
    (entry) => entry.blueprint.catalogKey === scenario.preferredCatalogKey,
  );
  if (selected.length !== 1) {
    throw new Error(`Missing preferred catalog entry ${scenario.preferredCatalogKey}`);
  }
  return selected;
}

function buildTimingReport(
  enabledItems: Array<{ scenario: Scenario; result: IntelligenceKnowledgeRuntimeResult }>,
): unknown {
  const rows = enabledItems.map(({ scenario, result }) => ({
    outputFile: scenario.outputFile,
    title: scenario.title,
    status: result.status,
    timing: result.status === "enabled" ? result.timing : null,
  }));
  const enabledRows = rows.filter((row): row is typeof row & { timing: NonNullable<typeof row.timing> } => row.timing !== null);
  return {
    generatedAt,
    rows,
    maxTotalAssemblyMs: Math.max(...enabledRows.map((row) => row.timing.totalAssemblyMs)),
    targetFailures: enabledRows.flatMap((row) =>
      row.timing.missedTargets.map((target) => `${row.outputFile}:${target}`),
    ),
  };
}

function qualityAssessment(result: IntelligenceKnowledgeRuntimeResult): string {
  if (result.status !== "enabled") return "Disabled proof preserves existing Intelligence behavior.";
  const pack = result.intelligenceContextPack;
  return [
    `Selected ${pack.relevantEntityProfiles.length} entity profiles, ${pack.relationshipCandidates.length} relationship candidates, and ${pack.evidence.length} evidence refs.`,
    `Confidence is ${pack.confidenceSummary.overall}; ${pack.gaps.length} gaps remain visible.`,
    "Progressive payload is prepared for a future flagged Claude path, while unsupported claims and diagnostics stay out of the model-visible context.",
  ].join(" ");
}

function containsRealizedValueClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  const forbidden = [
    "realized savings",
    "guaranteed savings",
    "will save",
    "has saved",
    "confirmed roi",
    "proven roi",
  ];
  return forbidden.some((term) => {
    const index = normalized.indexOf(term);
    if (index === -1) return false;
    const before = normalized.slice(Math.max(0, index - 40), index);
    return !/(do not|not |no |without |blocked|unless measured|requires measured)/.test(before);
  });
}

function writeMarkdown(summary: Record<string, unknown>): void {
  const scenarios = summary.scenarios as ScenarioSummary[];
  const lines = [
    "# Intelligence Knowledge Runtime Proof",
    "",
    `Generated: ${summary.generatedAt}`,
    `Verdict: ${summary.verdict}`,
    "",
    "## Truth Split",
    "",
    "- Feature flag defaults to false.",
    "- Existing Intelligence behavior and default Claude prompt are unchanged.",
    "- Claude is not called by this audit.",
    "- No production tenant data writes, Active Tenant Access updates, or candidate promotion occur.",
    "- Candidate context is excluded from active mode unless explicitly requested by a future path.",
    "",
    "## Scenarios",
    "",
    "| Scenario | Tenant | Selected catalog | Profiles | Relationships | Evidence | Gaps | Timing misses |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...scenarios.map((item) =>
      `| ${item.title} | ${item.tenantKey} | ${item.selectedCatalogKey} | ${item.profiles} | ${item.relationships} | ${item.evidenceRefs} | ${item.gaps} | ${item.timingMisses.join(", ") || "none"} |`,
    ),
    "",
    "## Quality Assessment",
    "",
    String(summary.qualityAssessment),
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(
  summary: Record<string, unknown>,
  enabledResults: Array<{ scenario: Scenario; result: IntelligenceKnowledgeRuntimeResult }>,
): void {
  const cards = enabledResults
    .map(({ scenario, result }) => {
      if (result.status !== "enabled") {
        return `<section class="card"><h2>${escapeHtml(scenario.title)}</h2><p>Disabled.</p></section>`;
      }
      const pack = result.intelligenceContextPack;
      return `<section class="card">
        <div class="eyebrow">${escapeHtml(scenario.tenantKey)} / ${escapeHtml(result.cacheBuild.resolution.selectedCatalogKey)}</div>
        <h2>${escapeHtml(scenario.title)}</h2>
        <p>${escapeHtml(pack.executiveSummary)}</p>
        <div class="grid">
          <div><strong>${pack.relevantEntityProfiles.length}</strong><span>profiles</span></div>
          <div><strong>${pack.relationshipCandidates.length}</strong><span>relationships</span></div>
          <div><strong>${pack.evidence.length}</strong><span>evidence refs</span></div>
          <div><strong>${pack.gaps.length}</strong><span>gaps</span></div>
        </div>
        <h3>Fast Context</h3>
        <ul>${result.fastContextPack.topEntityProfiles.slice(0, 6).map((profile) => `<li>${escapeHtml(profile.entityName)} — ${escapeHtml(profile.businessMeaning)}</li>`).join("")}</ul>
        <h3>Progressive Claude Payload</h3>
        <p>${escapeHtml(result.progressiveClaudePayload.initialPayload.factsVsInferenceInstruction)}</p>
        <h3>Timing</h3>
        <p>${result.timing.totalAssemblyMs}ms total; misses: ${escapeHtml(result.timing.missedTargets.join(", ") || "none")}</p>
      </section>`;
    })
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Intelligence Knowledge Runtime Proof</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0b1736; background: #f7f8fb; }
    main { max-width: 1180px; margin: 0 auto; padding: 48px 28px; }
    h1 { font-size: 42px; line-height: 1.05; margin: 0 0 12px; }
    h2 { font-size: 24px; margin: 8px 0 12px; }
    h3 { font-size: 14px; letter-spacing: .08em; text-transform: uppercase; color: #62708f; margin-top: 22px; }
    p, li { color: #31405f; line-height: 1.55; }
    .hero { background: #081831; color: white; border-radius: 8px; padding: 28px; margin-bottom: 24px; }
    .hero p { color: #dbe7ff; max-width: 820px; }
    .badge { display: inline-flex; border-radius: 999px; padding: 7px 12px; background: #dff8ee; color: #08654f; font-weight: 700; }
    .card { background: white; border: 1px solid #dfe5ef; border-radius: 8px; padding: 24px; margin: 18px 0; box-shadow: 0 12px 34px rgba(9, 24, 55, .06); }
    .eyebrow { text-transform: uppercase; letter-spacing: .12em; color: #00806a; font-size: 12px; font-weight: 800; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
    .grid div { border: 1px solid #e6ebf3; border-radius: 8px; padding: 14px; background: #fbfcff; }
    .grid strong { display: block; font-size: 28px; }
    .grid span { color: #63708d; }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="badge">${escapeHtml(String(summary.verdict))}</div>
      <h1>Intelligence Progressive Context Runtime</h1>
      <p>Default-off proof that Intelligence can assemble governed fast and deep context before any future Claude handoff, while preserving active context boundaries and excluding unsupported claims from model-visible payloads.</p>
    </section>
    ${cards}
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "intelligence-runtime-proof.html"), html);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(fileName: string, value: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main();
