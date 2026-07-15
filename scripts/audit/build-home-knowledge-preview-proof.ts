#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import {
  buildHomeKnowledgePreview,
  HOME_KNOWLEDGE_PREVIEW_FLAG,
  HOME_PREVIEW_REQUIRED_PROFILE_TYPES,
  type HomeKnowledgePreviewResult,
  type HomeKnowledgeSurface,
} from "../../src/lib/enterprise-knowledge/home";

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
  previewId: string;
  question: string;
  preferredCatalogKey: string;
  expectedTerms: string[];
};

type ScenarioSummary = {
  outputFile: string;
  title: string;
  tenantKey: string;
  status: HomeKnowledgePreviewResult["status"];
  headline: string;
  profileCards: number;
  relationshipCandidates: number;
  evidenceRefs: number;
  gaps: number;
  qualityAssessment: string;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.HOME_KNOWLEDGE_PREVIEW_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "knowledge-layer-home-preview-pr7";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/home-preview-proof",
);
const enabledEnv = { [HOME_KNOWLEDGE_PREVIEW_FLAG]: "true" };

const catalogHints: Record<string, CatalogHint> = {
  "meridian-health::Enterprise Knowledge Overview": {
    primaryFunction: "Enterprise Data and Experience Strategy",
    outcomeHypothesis:
      "Provider-payer enterprise knowledge layer for member experience, clinical operations, finance analytics, and governed AI/data foundation",
    systems: [
      "Epic Hyperspace",
      "Epic Clarity",
      "Epic Caboodle",
      "Claims administration platform",
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "Oracle ERP Finance",
      "Workday Finance and HR source feeds",
      "Netezza finance analytics appliance",
      "SQL Server Finance Mart",
      "Informatica ETL",
      "Tableau and Power BI dashboards",
      "Databricks on AWS target foundation",
    ],
    dataDomains: [
      "EMR clinical",
      "claims",
      "pharmacy",
      "eligibility",
      "benefits",
      "member service",
      "GL",
      "AP",
      "AR",
      "vendor spend",
    ],
    infrastructure: [
      "on-prem SQL Server reporting estate",
      "Netezza analytics appliance",
      "AWS landing zone required for analytics",
      "Databricks lakehouse target",
    ],
    vendorsContracts: [
      "Epic",
      "Oracle",
      "Workday",
      "Microsoft",
      "Informatica",
      "Databricks",
      "Tableau",
      "Genesys",
      "Salesforce",
    ],
    spendContext: [
      "analytics managed services run cost",
      "manual reporting maintenance effort",
      "contact center operating baseline",
    ],
    programs: [
      "unified clinical and claims data foundation",
      "agent assist for member service",
      "finance analytics modernization",
      "governed AI/LLM automation foundation",
    ],
    risksControls: [
      "PHI handling",
      "human-in-the-loop approval",
      "fragmented data governance",
      "relationship validation required before dependency claims",
    ],
    metrics: [
      "average handle time",
      "first-contact resolution",
      "manual reconciliation hours",
      "certified dashboard adoption",
    ],
    sourceContext: [
      "member service process",
      "finance close process",
      "analytics demand intake",
      "clinical and claims integration planning",
    ],
    moduleGuidance: {
      home:
        "Render this as enterprise orientation and fact-backed profile browsing, not a diagnostic status page.",
      intelligence:
        "Use the context to identify AI/data bets but do not infer board-grade recommendations without evidence.",
      moves:
        "Use this context to frame phase evidence and missing uploads before solutioning.",
      source:
        "Use vendors and contracts as context only; do not claim savings without measured evidence.",
      tower: "Use metrics as baseline candidates only; do not claim realized outcomes.",
    },
  },
  "meridian-health::Finance Analytics": {
    primaryFunction: "Finance Analytics",
    outcomeHypothesis:
      "Finance analytics modernization across close reporting, managed analytics services, and spend insight",
    systems: [
      "Oracle ERP Finance",
      "Workday Finance and HR source feeds",
      "Netezza finance analytics appliance",
      "SQL Server Finance Mart",
      "Informatica Finance ETL",
      "Tableau and Power BI finance dashboards",
      "Databricks Finance Gold target",
    ],
    dataDomains: ["GL", "AP", "AR", "vendor spend", "budget", "cost center", "labor and headcount"],
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
      "certified dashboard adoption",
      "manual reconciliation hours",
      "report inventory reduction candidate",
    ],
    sourceContext: ["analytics managed services", "BI platform contracts", "data platform sourcing"],
    moduleGuidance: {
      home:
        "Show finance analytics as a profile with systems, data, relationships, evidence, and gaps.",
      moves:
        "Use finance analytics context to shape scope, baselines, owners, and upload needs. Do not claim realized savings.",
      source:
        "Use vendor and contract context as sourcing inputs; do not assert savings without measured evidence.",
      tower: "Use budget and value facts only as context; do not claim realized savings.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis:
      "AI-enabled agent assist for member service and contact-center workflows",
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
    metrics: ["average handle time", "first-contact resolution", "member satisfaction", "transfer rate"],
    sourceContext: ["member service process", "contact-center platform contracts", "CRM licenses"],
    movesPhase: "P2",
    moduleGuidance: {
      home:
        "Show member service readiness with process, systems, data, risks, and recommended evidence.",
      intelligence:
        "Assess readiness from source-backed workflow and data context, not generic AI enthusiasm.",
      moves:
        "Return phase evidence and gaps only; Moves decides later what becomes attached evidence.",
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
      "Device-risk intelligence",
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
      "model-risk controls",
    ],
    metrics: [
      "false-positive rate",
      "analyst throughput",
      "analyst queue aging",
      "confirmed fraud loss",
      "loss recovery candidate metric",
    ],
    sourceContext: ["fraud case workflow", "KYC vendor context", "device intelligence contract context"],
    movesPhase: "P2",
    moduleGuidance: {
      home:
        "Show the fraud copilot as an enterprise knowledge profile with data, controls, caveats, and evidence.",
      intelligence:
        "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      source: "Return vendor dependencies as context only; do not initiate sourcing work.",
    },
  },
};

const scenarios: Scenario[] = [
  {
    outputFile: "meridian-enterprise-overview.json",
    title: "Meridian Health — Enterprise Knowledge Overview",
    tenantKey: "meridian-health",
    previewId: "meridian-enterprise-overview",
    preferredCatalogKey: "meridian-health-enterprise-knowledge-overview",
    question:
      "Show Meridian enterprise overview across provider payer context, member experience, clinical and payer priorities, AI data foundation, and key gaps.",
    expectedTerms: [
      "provider-payer",
      "member experience",
      "clinical",
      "AI/data foundation",
      "fragmented data governance",
    ],
  },
  {
    outputFile: "meridian-finance-profile.json",
    title: "Meridian Health — Finance Analytics Profile",
    tenantKey: "meridian-health",
    previewId: "meridian-finance-profile",
    preferredCatalogKey: "meridian-health-finance-analytics",
    question:
      "Show the Finance Analytics profile with systems, data, pain points, relationships, evidence, and gaps.",
    expectedTerms: [
      "Oracle ERP Finance",
      "Workday",
      "SQL Server Finance Mart",
      "Netezza",
      "500 finance tables",
      "200 finance ETL jobs",
      "1,000 finance reports",
      "800 finance analytics users",
    ],
  },
  {
    outputFile: "meridian-agent-assist-profile.json",
    title: "Meridian Health — Agent Assist Readiness Profile",
    tenantKey: "meridian-health",
    previewId: "meridian-agent-assist-profile",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    question:
      "Show Agent Assist readiness for member service with process, Genesys, Salesforce, claims, eligibility, benefits, transcript gaps, AHT, FCR, transfer metrics, PHI, HITL, and audit risks.",
    expectedTerms: [
      "member service process",
      "Genesys",
      "Salesforce",
      "claims",
      "eligibility",
      "benefits",
      "call transcript",
      "average handle time",
      "first-contact resolution",
      "transfer rate",
      "PHI handling",
      "human-in-the-loop",
    ],
  },
  {
    outputFile: "harbortrust-fraud-profile.json",
    title: "HarborTrust Bank — Fraud Analyst Copilot Profile",
    tenantKey: "harbortrust-bank",
    previewId: "harbortrust-fraud-profile",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    question:
      "Show Fraud Analyst Copilot profile with fraud systems, transaction data, alerts, case workflow, AML, KYC, device risk, model controls, analyst throughput, false positives, loss and recovery metrics, and caveats.",
    expectedTerms: [
      "Fraud alert platform",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "Device-risk intelligence",
      "model-risk controls",
      "analyst throughput",
      "false-positive rate",
      "loss recovery",
    ],
  },
];

function main(): void {
  const semanticReport = readJson<SemanticReport>(sourceReportPath);
  const catalog = buildCatalog(semanticReport);
  ensureDir(outDir);

  const disabled = buildHomeKnowledgePreview({
    ...scenarios[0],
    catalog: catalogForScenario(catalog, scenarios[0]),
    generatedAt,
    sourceVersion,
    contextVersion,
    env: {},
  });
  const enabledResults = scenarios.map((scenario) => ({
    scenario,
    result: buildHomeKnowledgePreview({
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
  const summary = {
    codename: "KNOWLEDGE-LAYER-HOME-SURFACE-PR7",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    flag: {
      name: HOME_KNOWLEDGE_PREVIEW_FLAG,
      defaultEnabled: false,
      disabledStatus: disabled.status,
      enabledStatuses: enabledResults.map((item) => item.result.status),
    },
    truthSplit: {
      defaultHomeBehaviorChanged: false,
      routeOrNavigationChanged: false,
      previewOnly: true,
      claudeCalled: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
      deployRequired: false,
    },
    proofCounts: {
      catalogEntries: catalog.length,
      scenarios: enabledResults.length,
      totalProfileCards: scenarioSummaries.reduce((sum, item) => sum + item.profileCards, 0),
      totalRelationshipCandidates: scenarioSummaries.reduce(
        (sum, item) => sum + item.relationshipCandidates,
        0,
      ),
      totalEvidenceRefs: scenarioSummaries.reduce((sum, item) => sum + item.evidenceRefs, 0),
      totalGaps: scenarioSummaries.reduce((sum, item) => sum + item.gaps, 0),
    },
    scenarios: scenarioSummaries,
    qualityAssessment:
      "The Home preview now leads with enterprise meaning, confidence, relationships, evidence, and double-click profiles. Diagnostics are present only as collapsed technical data in the proof JSON/HTML.",
    failures: validation.failures,
  };

  for (const { scenario, result } of enabledResults) {
    writeJson(scenario.outputFile, compactResult(scenario, result));
  }
  writeJson("disabled-default-home-preview.json", disabled);
  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary, enabledResults);

  if (validation.failures.length > 0) {
    throw new Error(`Home knowledge preview proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`home knowledge preview proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function buildCatalog(report: SemanticReport): ContextSourceCatalogEntry[] {
  const entries = report.tenants.flatMap((tenant) =>
    tenant.cluster_assessments.map((cluster) => buildCatalogEntry({
      tenantKey: tenant.tenant_key,
      tenantName: tenant.tenant_name,
      clusterName: cluster.cluster,
      cluster,
      inputSources: [
        path.relative(repoRoot, sourceReportPath),
        `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/evidence_summary.csv`,
        `datasets/tenant-inputs/generated/${tenant.tenant_key}/standard-2026-07-v3/relationship_summary.csv`,
      ],
    })),
  );

  const meridian = report.tenants.find((tenant) => tenant.tenant_key === "meridian-health");
  if (meridian) {
    const merged = mergeClusters(meridian.cluster_assessments);
    entries.push(buildCatalogEntry({
      tenantKey: meridian.tenant_key,
      tenantName: meridian.tenant_name,
      clusterName: "Enterprise Knowledge Overview",
      cluster: merged,
      inputSources: [
        path.relative(repoRoot, sourceReportPath),
        "derived from Meridian Finance Analytics and Agent Assist / Member Service semantic proof clusters",
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
  const catalogKey = slug(`${params.tenantKey}-${params.clusterName}`);
  return {
    blueprint: {
      catalogKey,
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

function mergeClusters(
  clusters: SemanticReport["tenants"][number]["cluster_assessments"],
): SemanticReport["tenants"][number]["cluster_assessments"][number] {
  return {
    cluster: "Enterprise Knowledge Overview",
    rowsMatched: clusters.reduce((sum, cluster) => sum + cluster.rowsMatched, 0),
    painPoints: unique(clusters.flatMap((cluster) => cluster.painPoints)),
    evidenceItems: unique(clusters.flatMap((cluster) => cluster.evidenceItems)),
    metrics: unique(clusters.flatMap((cluster) => cluster.metrics)),
    issues: unique(clusters.flatMap((cluster) => cluster.issues)),
    modernizationDependencies: unique(clusters.flatMap((cluster) => cluster.modernizationDependencies)),
    relationshipsPresent: clusters.reduce((sum, cluster) => sum + cluster.relationshipsPresent, 0),
  };
}

function validateProof(
  disabled: HomeKnowledgePreviewResult,
  enabledItems: Array<{ scenario: Scenario; result: HomeKnowledgePreviewResult }>,
): { failures: string[] } {
  const failures: string[] = [];
  if (disabled.status !== "disabled") failures.push("default flag-off preview did not stay disabled");
  if (disabled.status === "disabled" && !disabled.existingHomeBehaviorUnchanged) {
    failures.push("disabled preview did not preserve Home behavior");
  }
  for (const { scenario, result } of enabledItems) {
    const prefix = scenario.outputFile;
    if (result.status !== "enabled") {
      failures.push(`${prefix}: preview did not enable with explicit flag`);
      continue;
    }
    const surface = result.surface;
    const visibleText = visibleSurfaceText(surface);
    const fullText = JSON.stringify(surface);
    const requiredSections = Object.keys(surface.sections);
    for (const section of [
      "enterpriseBrief",
      "contextConfidence",
      "whatAbarvaKnows",
      "keyRelationships",
      "readyAreas",
      "importantGaps",
      "evidenceCoverage",
      "doubleClickProfiles",
      "recommendedNextEvidence",
    ]) {
      if (!requiredSections.includes(section)) failures.push(`${prefix}: missing section ${section}`);
    }
    for (const term of scenario.expectedTerms) {
      if (!visibleText.toLowerCase().includes(term.toLowerCase())) {
        failures.push(`${prefix}: expected story term missing: ${term}`);
      }
    }
    const profileTypes = new Set(surface.sections.doubleClickProfiles.map((profile) => profile.profileType));
    for (const type of HOME_PREVIEW_REQUIRED_PROFILE_TYPES) {
      if (!profileTypes.has(type)) failures.push(`${prefix}: missing profile type ${type}`);
    }
    for (const profile of surface.sections.doubleClickProfiles) {
      const missing = requiredProfileFields(profile);
      if (missing.length > 0) failures.push(`${prefix}: ${profile.title} missing fields ${missing.join(", ")}`);
    }
    if (surface.sections.keyRelationships.length === 0) failures.push(`${prefix}: no key relationships`);
    if (surface.sections.importantGaps.length === 0) failures.push(`${prefix}: no important gaps`);
    if (surface.sections.evidenceCoverage.sourceLabels.length === 0) {
      failures.push(`${prefix}: no evidence source labels`);
    }
    if (surface.sections.contextConfidence.safeToAnswer.length === 0) {
      failures.push(`${prefix}: safe-to-answer list is empty`);
    }
    if (surface.sections.contextConfidence.doNotInferYet.length === 0) {
      failures.push(`${prefix}: do-not-infer list is empty`);
    }
    if (
      result.homeKnowledgePack.truthBoundary.activeTenantAccessUpdated ||
      result.homeKnowledgePack.truthBoundary.productionTenantDataWritten ||
      result.homeKnowledgePack.truthBoundary.candidatePromoted ||
      result.homeKnowledgePack.truthBoundary.moduleRuntimeBehaviorChanged ||
      result.homeKnowledgePack.truthBoundary.sourceAdapterRowsActive
    ) {
      failures.push(`${prefix}: non-destructive truth boundary failed`);
    }
    if (result.cacheBuild.truthSplit.claudeCalled) failures.push(`${prefix}: cache called Claude`);
    if (result.homeKnowledgePack.claudeReadyContextPayload.unsupportedClaims.length !== 0) {
      failures.push(`${prefix}: unsupported claims leaked into Claude-ready payload`);
    }
    const forbiddenVisible = /(v6|v7|current-state|rich-pack|not available yet|source rows across 0 domains|0 mapped links|home remains a context browser)/i;
    if (forbiddenVisible.test(visibleText)) {
      failures.push(`${prefix}: diagnostic or banned wording is visible`);
    }
    const visibleClaimText = JSON.stringify({
      ...surface.sections,
      contextConfidence: {
        ...surface.sections.contextConfidence,
        doNotInferYet: [],
      },
    });
    const realizedValuePattern = /(realized value|realized savings|guaranteed savings|20%|30%|\$\d)/i;
    if (realizedValuePattern.test(visibleClaimText)) {
      failures.push(`${prefix}: unsupported realized value language is visible`);
    }
    if (fullText.includes("debugOnlyDiagnostics")) {
      failures.push(`${prefix}: unexpected debugOnlyDiagnostics label in Home preview`);
    }
  }
  return { failures };
}

function catalogForScenario(
  catalog: ContextSourceCatalogEntry[],
  scenario: Scenario,
): ContextSourceCatalogEntry[] {
  const preferred = catalog.find(
    (entry) => entry.blueprint.catalogKey === scenario.preferredCatalogKey,
  );
  if (!preferred) {
    throw new Error(`Missing preferred catalog entry ${scenario.preferredCatalogKey}`);
  }
  return [preferred];
}

function summarizeScenario(
  scenario: Scenario,
  result: HomeKnowledgePreviewResult,
): ScenarioSummary {
  if (result.status !== "enabled") {
    return {
      outputFile: scenario.outputFile,
      title: scenario.title,
      tenantKey: scenario.tenantKey,
      status: result.status,
      headline: "disabled",
      profileCards: 0,
      relationshipCandidates: 0,
      evidenceRefs: 0,
      gaps: 0,
      qualityAssessment: "Flag disabled; current Home behavior remains unchanged.",
    };
  }
  const surface = result.surface;
  return {
    outputFile: scenario.outputFile,
    title: scenario.title,
    tenantKey: scenario.tenantKey,
    status: result.status,
    headline: surface.sections.enterpriseBrief.headline,
    profileCards: surface.sections.doubleClickProfiles.length,
    relationshipCandidates: surface.sections.keyRelationships.length,
    evidenceRefs: surface.sections.evidenceCoverage.sourceLabels.length,
    gaps: surface.sections.importantGaps.length,
    qualityAssessment: qualityAssessment(result),
  };
}

function compactResult(scenario: Scenario, result: HomeKnowledgePreviewResult): unknown {
  if (result.status !== "enabled") return { scenario, result };
  return {
    scenario,
    status: result.status,
    request: result.request,
    surface: result.surface,
    homeKnowledgePack: {
      contextPackId: result.homeKnowledgePack.contextPackId,
      tenantKey: result.homeKnowledgePack.tenantKey,
      moduleKey: result.homeKnowledgePack.moduleKey,
      executiveSummary: result.homeKnowledgePack.executiveSummary,
      confidenceSummary: result.homeKnowledgePack.confidenceSummary,
      truthBoundary: result.homeKnowledgePack.truthBoundary,
      claudeReadyContextPayload: result.homeKnowledgePack.claudeReadyContextPayload,
    },
    cacheProof: {
      fastContextPackCacheId: result.cacheBuild.fastContextPackCache.metadata.cacheId,
      deepContextPackCacheId: result.cacheBuild.deepContextPackCache.metadata.cacheId,
      relationshipSliceCacheId: result.cacheBuild.relationshipSliceCache.metadata.cacheId,
      truthSplit: result.cacheBuild.truthSplit,
    },
    qualityAssessment: qualityAssessment(result),
  };
}

function qualityAssessment(result: HomeKnowledgePreviewResult): string {
  if (result.status !== "enabled") return "Flag disabled; no preview is created.";
  const surface = result.surface;
  if (surface.sections.doubleClickProfiles.length < HOME_PREVIEW_REQUIRED_PROFILE_TYPES.length) {
    return "Too thin for Home preview; profile coverage is incomplete.";
  }
  if (surface.sections.keyRelationships.length === 0) {
    return "Needs relationship depth before it can tell a client-ready enterprise context story.";
  }
  return "Hits the mark for a Home knowledge-surface preview: it leads with enterprise meaning, keeps evidence and gaps visible, supports double-click profiles, and keeps diagnostics secondary.";
}

function writeMarkdown(summary: {
  codename: string;
  generatedAt: string;
  verdict: string;
  flag: Record<string, unknown>;
  truthSplit: Record<string, boolean>;
  proofCounts: Record<string, number>;
  scenarios: ScenarioSummary[];
  qualityAssessment: string;
  failures: string[];
}): void {
  const lines = [
    "# Home Knowledge Surface Preview Proof",
    "",
    `Status: ${summary.verdict}`,
    `Generated: ${summary.generatedAt}`,
    "",
    "## Flag",
    "",
    ...Object.entries(summary.flag).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`),
    "",
    "## Truth Split",
    "",
    ...Object.entries(summary.truthSplit).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## What This Proves",
    "",
    "Home can render a client-facing Enterprise Knowledge Surface from HomeKnowledgePack/entity profile outputs behind a non-default flag. The proof shows enterprise brief, confidence, known context, relationships, gaps, evidence coverage, profile drill-downs, and recommended next evidence.",
    "",
    "## What This Does Not Do",
    "",
    "- Does not change the default Home route.",
    "- Does not add a production route or navigation item.",
    "- Does not call Claude.",
    "- Does not write tenant data.",
    "- Does not promote candidate data.",
    "- Does not update Active Tenant Access.",
    "",
    "## Scenario Results",
    "",
    "| Scenario | Tenant | Status | Headline | Profiles | Relationships | Evidence | Gaps | Quality |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...summary.scenarios.map(
      (item) =>
        `| ${item.title} | ${item.tenantKey} | ${item.status} | ${item.headline} | ${item.profileCards} | ${item.relationshipCandidates} | ${item.evidenceRefs} | ${item.gaps} | ${item.qualityAssessment} |`,
    ),
    "",
    "## Overall Quality Assessment",
    "",
    summary.qualityAssessment,
  ];
  if (summary.failures.length) {
    lines.push("", "## Failures", "", ...summary.failures.map((failure) => `- ${failure}`));
  }
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(
  summary: {
    verdict: string;
    generatedAt: string;
    flag: Record<string, unknown>;
    truthSplit: Record<string, boolean>;
  },
  enabledItems: Array<{ scenario: Scenario; result: HomeKnowledgePreviewResult }>,
): void {
  const cards = enabledItems
    .map(({ scenario, result }) => {
      if (result.status !== "enabled") return "";
      const surface = result.surface;
      const sections = surface.sections;
      return `<section class="tenant">
        <div class="tenant-head">
          <div>
            <p class="eyebrow">${escapeHtml(scenario.title)}</p>
            <h2>${escapeHtml(sections.enterpriseBrief.headline)}</h2>
            <p>${escapeHtml(sections.enterpriseBrief.narrative)}</p>
          </div>
          <span class="pill">Preview only</span>
        </div>
        <div class="confidence">
          <h3>Context Confidence</h3>
          <p>${escapeHtml(sections.contextConfidence.summary)}</p>
        </div>
        <div class="grid four">
          ${panel("What AbarVa knows", sections.whatAbarvaKnows.slice(0, 5))}
          ${panel("Key relationships", sections.keyRelationships.slice(0, 5))}
          ${panel("Important gaps", sections.importantGaps.slice(0, 5))}
          ${panel("Recommended next evidence", sections.recommendedNextEvidence.slice(0, 5))}
        </div>
        <h3>Double-click profiles</h3>
        <div class="profiles">
          ${sections.doubleClickProfiles
            .slice(0, 12)
            .map((profile) => `<article>
              <p class="profile-type">${escapeHtml(profile.profileType)}</p>
              <h4>${escapeHtml(profile.title)}</h4>
              <p>${escapeHtml(profile.businessMeaning)}</p>
              <dl>
                <dt>Confidence</dt><dd>${profile.confidence}</dd>
                <dt>Readiness</dt><dd>${escapeHtml(profile.moduleReadiness)}</dd>
                <dt>Evidence</dt><dd>${profile.evidenceRefs.length}</dd>
              </dl>
            </article>`)
            .join("")}
        </div>
        <details>
          <summary>Collapsed technical diagnostics</summary>
          <pre>${escapeHtml(JSON.stringify(surface.collapsedTechnicalDiagnostics, null, 2))}</pre>
        </details>
        <details>
          <summary>Rendered surface JSON</summary>
          <pre>${escapeHtml(JSON.stringify(surface, null, 2))}</pre>
        </details>
      </section>`;
    })
    .join("\n");
  const truthRows = Object.entries(summary.truthSplit)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${String(value)}</td></tr>`)
    .join("\n");
  const flagRows = Object.entries(summary.flag)
    .map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(JSON.stringify(value))}</td></tr>`)
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Home Knowledge Surface Proof</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #071832; background: #f6f8fc; }
    main { max-width: 1360px; margin: 0 auto; padding: 52px 30px; }
    h1 { margin: 0; font-size: 48px; letter-spacing: -0.03em; }
    h2 { margin: 4px 0 10px; font-size: 30px; }
    h3 { margin: 18px 0 10px; font-size: 16px; }
    h4 { margin: 4px 0 8px; font-size: 18px; }
    p { line-height: 1.55; color: #41506b; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dfe5ef; border-radius: 10px; overflow: hidden; }
    td { border-bottom: 1px solid #e6ebf3; padding: 12px 14px; }
    pre { max-height: 420px; overflow: auto; padding: 14px; background: #0a1630; color: #e8f1ff; border-radius: 10px; font-size: 12px; line-height: 1.45; }
    details { margin-top: 18px; border: 1px solid #dfe5ef; border-radius: 10px; padding: 14px; background: #fbfdff; }
    summary { cursor: pointer; font-weight: 800; }
    .eyebrow { color: #007a68; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .status { display: inline-flex; border-radius: 999px; padding: 7px 13px; font-weight: 800; background: #dff8ef; color: #00664f; }
    .tenant { background: white; border: 1px solid #dfe5ef; border-radius: 14px; box-shadow: 0 18px 45px rgba(7, 24, 50, .08); padding: 26px; margin-top: 26px; }
    .tenant-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
    .pill { white-space: nowrap; background: #eef8ff; border: 1px solid #c6e6fb; color: #063a61; border-radius: 999px; padding: 8px 12px; font-weight: 800; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
    .grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .panel { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #fbfdff; }
    .panel ul { margin: 0; padding-left: 18px; }
    .panel li { margin: 7px 0; color: #41506b; }
    .confidence { border: 1px solid #cceede; background: #f1fbf6; border-radius: 12px; padding: 16px; margin-top: 18px; }
    .profiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .profiles article { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #fff; }
    .profile-type { margin: 0; color: #007a68; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 800; }
    dl { display: grid; grid-template-columns: 90px 1fr; gap: 5px 10px; color: #41506b; }
    dt { font-weight: 800; }
    dd { margin: 0; }
    @media (max-width: 1000px) { .grid.four, .profiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Enterprise Knowledge Layer</p>
    <h1>Home Knowledge Surface Proof <span class="status">${escapeHtml(summary.verdict)}</span></h1>
    <p>Generated ${escapeHtml(summary.generatedAt)}. This proof shows Home as a client-facing enterprise knowledge surface powered by entity profiles, relationships, evidence, confidence, and gaps.</p>
    <div class="grid">
      <section class="tenant"><h2>Flag</h2><table><tbody>${flagRows}</tbody></table></section>
      <section class="tenant"><h2>Truth split</h2><table><tbody>${truthRows}</tbody></table></section>
    </div>
    ${cards}
  </main>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "home-knowledge-surface-proof.html"), html);
}

function panel(title: string, items: string[]): string {
  const list = items.length ? items : ["No items surfaced in this proof slice."];
  return `<div class="panel"><h3>${escapeHtml(title)}</h3><ul>${list
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul></div>`;
}

function requiredProfileFields(profile: HomeKnowledgeSurface["sections"]["doubleClickProfiles"][number]): string[] {
  const missing: string[] = [];
  const requiredStrings: Array<keyof typeof profile> = [
    "businessMeaning",
    "currentStateSummary",
    "targetStateDirection",
    "activeVsCandidateStatus",
    "asOfDate",
    "moduleReadiness",
  ];
  for (const key of requiredStrings) {
    if (!profile[key]) missing.push(String(key));
  }
  const requiredArrays: Array<keyof typeof profile> = [
    "relatedFunctions",
    "relatedSystems",
    "relatedDataDomains",
    "relatedInfrastructure",
    "relatedVendorsContracts",
    "relatedSpend",
    "relatedPrograms",
    "relatedRisksControls",
    "relatedMetricsOutcomes",
    "relatedUseCases",
    "evidenceRefs",
    "knownGaps",
    "caveats",
    "sourceLineage",
  ];
  for (const key of requiredArrays) {
    const value = profile[key];
    if (!Array.isArray(value) || value.length === 0) missing.push(String(key));
  }
  return missing;
}

function visibleSurfaceText(surface: HomeKnowledgeSurface): string {
  return JSON.stringify(surface.sections);
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

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
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
