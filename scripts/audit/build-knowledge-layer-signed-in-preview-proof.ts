#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../../src/lib/enterprise-knowledge/assembler";
import type { ContextPack } from "../../src/lib/enterprise-knowledge/contracts";
import {
  buildHomeKnowledgePreview,
  HOME_KNOWLEDGE_PREVIEW_FLAG,
  type EnabledHomeKnowledgePreview,
  type HomeKnowledgePreviewResult,
} from "../../src/lib/enterprise-knowledge/home";
import {
  assembleIntelligenceRuntimeContext,
  INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
  type EnabledIntelligenceKnowledgeRuntimeResult,
  type IntelligenceKnowledgeRuntimeResult,
  type IntelligenceRuntimeAudience,
} from "../../src/lib/enterprise-knowledge/intelligence";
import {
  buildMovesKnowledgeRuntimeContext,
  MOVES_KNOWLEDGE_RUNTIME_FLAG,
  type EnabledMovesKnowledgeRuntimeResult,
  type MovesKnowledgeRuntimeResult,
  type MovesRuntimePhase,
} from "../../src/lib/enterprise-knowledge/moves";

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
  outputFile: string;
  title: string;
  tenantKey: string;
  question: string;
  audience: IntelligenceRuntimeAudience;
  phase: MovesRuntimePhase;
  preferredCatalogKey: string;
  focusEntities: string[];
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.KNOWLEDGE_LAYER_SIGNED_IN_PREVIEW_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";
const sourceVersion = "context-template-v3-semantic-depth-fix1";
const contextVersion = "knowledge-layer-signed-in-preview-pr9";
const sourceReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/signed-in-preview-proof",
);

const proofEnv = {
  [HOME_KNOWLEDGE_PREVIEW_FLAG]: "true",
  [MOVES_KNOWLEDGE_RUNTIME_FLAG]: "true",
  [INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG]: "true",
};

const featureFlags = [
  "ENABLE_KNOWLEDGE_LAYER_MOVES_PREVIEW",
  "ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_PREVIEW",
  MOVES_KNOWLEDGE_RUNTIME_FLAG,
  HOME_KNOWLEDGE_PREVIEW_FLAG,
  INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
] as const;

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
    vendorsContracts: ["Oracle", "Workday", "Microsoft", "Informatica", "Databricks", "Tableau", "Power BI"],
    spendContext: ["analytics managed services spend", "finance dashboard run cost", "manual close reconciliation effort", "budget stewardship"],
    programs: ["Databricks Finance Gold certification", "vendor master harmonization", "close automation roadmap"],
    risksControls: ["inconsistent vendor spend definitions", "slow close-window dashboards", "manual reconciliation control risk"],
    metrics: ["close report refresh completion", "certified finance dashboard adoption", "manual reconciliation hours per close cycle"],
    sourceContext: ["analytics managed services", "BI platform contracts", "data platform sourcing", "month-end close reporting"],
    moduleGuidance: {
      home: "Show finance analytics as source-backed enterprise context, not a diagnostic-first page.",
      moves: "Use finance analytics context to shape baselines and evidence asks.",
      intelligence: "Frame modernization readiness, blockers, and next evidence. Do not claim realized savings.",
      source: "Use vendor and contract context as sourcing inputs only.",
      tower: "Use metric names as measurement candidates only.",
    },
  },
  "meridian-health::Agent Assist / Member Service": {
    primaryFunction: "Member Service and Contact Center",
    outcomeHypothesis:
      "AI-enabled agent assist for member service workflows with cited claims, eligibility, benefits, and transcript context",
    systems: ["Genesys Cloud", "Salesforce Health Cloud", "Claims administration platform", "Eligibility and benefits platform", "Knowledge base and call transcript store"],
    dataDomains: ["call transcript", "case disposition", "claims status", "eligibility", "benefits", "member inquiry intent"],
    infrastructure: ["contact center integration layer", "audited answer packet", "Genesys-Salesforce-claims context join"],
    vendorsContracts: ["Genesys", "Salesforce", "claims platform managed services"],
    spendContext: ["agent handle-time baseline", "after-call work baseline", "call deflection hypothesis"],
    programs: ["member-service AI assist", "knowledge article cleanup"],
    risksControls: ["PHI handling", "human-in-the-loop approval", "audit trail", "stale knowledge article duplicates"],
    metrics: ["average handle time", "first-contact resolution", "transfer rate", "after-call work minutes"],
    sourceContext: ["member service process", "contact-center platform contracts", "CRM licenses", "call transcript annotation sample"],
    movesPhase: "P2",
    moduleGuidance: {
      home: "Show member service readiness with systems, data, risks, and recommended evidence.",
      moves: "Return phase evidence and gaps only.",
      intelligence: "Assess readiness from source-backed workflow and data context, with PHI and human-approval caveats.",
      source: "Return vendor dependencies as context only.",
      tower: "Use operational metrics as baseline candidates only.",
    },
  },
  "harbortrust-bank::Fraud Analyst Copilot": {
    primaryFunction: "Fraud Operations",
    outcomeHypothesis:
      "AI copilot support for fraud analyst triage, case investigation, and governed alert prioritization",
    systems: ["Fraud alert platform", "Fraud case management", "AML transaction monitoring", "Digital onboarding KYC", "Device-risk intelligence", "Fraud feature store"],
    dataDomains: ["fraud alerts", "case outcomes", "AML transactions", "KYC evidence", "device risk", "model score"],
    infrastructure: ["real-time fraud decisioning", "model governance evaluation set", "feature-store feedback loop"],
    vendorsContracts: ["KYC vendor", "device intelligence vendor", "core banking provider"],
    spendContext: ["fraud ops queue cost", "loss avoidance measurement baseline"],
    programs: ["fraud analyst copilot", "feature-store feedback loop"],
    risksControls: ["model-risk controls", "case outcome feedback gaps", "model version lineage gaps", "queue aging mixed with model quality signals"],
    metrics: ["false-positive rate", "analyst throughput", "analyst queue aging", "confirmed fraud loss", "loss recovery candidate metric"],
    sourceContext: ["fraud case workflow", "KYC vendor context", "device intelligence contract context"],
    movesPhase: "P2",
    moduleGuidance: {
      home: "Show the fraud copilot profile with data, controls, caveats, and evidence.",
      moves: "Return phase evidence and blockers.",
      intelligence: "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
      source: "Return vendor dependencies as context only.",
      tower: "Use loss and throughput metrics as measurement candidates only.",
    },
  },
  "meridian-health::Vendor Onboarding Modernization": {
    primaryFunction: "Vendor Management and Enterprise Operations",
    outcomeHypothesis:
      "Workflow modernization for supplier onboarding, evidence collection, approval routing, and control traceability",
    systems: ["supplier intake workflow", "contract repository", "identity and access request queue", "ERP supplier master", "ServiceNow request queue"],
    dataDomains: ["supplier profile", "tax and banking evidence", "security review status", "contract status", "access request evidence"],
    infrastructure: ["workflow automation layer", "evidence ledger", "approval audit log"],
    vendorsContracts: ["supplier master data service", "contract lifecycle platform", "workflow platform"],
    spendContext: ["vendor onboarding cycle-time baseline", "manual rework baseline"],
    programs: ["vendor onboarding modernization", "supplier evidence standardization"],
    risksControls: ["incomplete security review evidence", "duplicate supplier records", "approval handoff gaps"],
    metrics: ["onboarding cycle time", "approval rework rate", "supplier master exception rate"],
    sourceContext: ["supplier onboarding workflow", "source-owner attestation", "relationship validation notes"],
    moduleGuidance: {
      home: "Show vendor onboarding as enterprise context when evidence is loaded.",
      moves: "Use this to shape P0/P1 framing if a Move is later created.",
      intelligence: "Use generic workflow, system, data, vendor, risk, and metric context.",
      source: "Use vendor and contract context as inputs only.",
      tower: "Use cycle-time metrics as candidates only.",
    },
  },
};

const scenarios: Scenario[] = [
  {
    outputFile: "meridian-agent-assist-cross-module.json",
    title: "Meridian — Agent Assist / Member Service",
    tenantKey: "meridian-health",
    question: "How ready are we for Agent Assist in member service?",
    audience: "CIO",
    phase: "P2",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    focusEntities: ["Genesys Cloud", "Salesforce Health Cloud", "claims", "eligibility", "PHI handling"],
  },
  {
    outputFile: "meridian-finance-cross-module.json",
    title: "Meridian — Finance Analytics",
    tenantKey: "meridian-health",
    question: "What is the Finance Analytics modernization opportunity?",
    audience: "CFO",
    phase: "P1",
    preferredCatalogKey: "meridian-health-finance-analytics",
    focusEntities: ["Oracle ERP Finance", "Workday", "Netezza", "SQL Server Finance Mart", "Databricks"],
  },
  {
    outputFile: "harbortrust-fraud-cross-module.json",
    title: "HarborTrust — Fraud Analyst Copilot",
    tenantKey: "harbortrust-bank",
    question: "Can AI help fraud analysts triage alerts safely?",
    audience: "CISO",
    phase: "P2",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    focusEntities: ["Fraud alert platform", "AML transaction monitoring", "Digital onboarding KYC", "model-risk controls"],
  },
  {
    outputFile: "generic-vendor-onboarding-cross-module.json",
    title: "Generic — Vendor Onboarding Modernization",
    tenantKey: "meridian-health",
    question: "What context do we have for vendor onboarding modernization?",
    audience: "COO",
    phase: "P0",
    preferredCatalogKey: "meridian-health-vendor-onboarding-modernization",
    focusEntities: ["supplier intake workflow", "ERP supplier master", "ServiceNow request queue", "source-owner attestation"],
  },
];

function main(): void {
  ensureDir(outDir);
  const catalog = buildCatalog(readJson<SemanticReport>(sourceReportPath));
  const disabledProof = buildDisabledProof(catalog);
  const rows = scenarios.map((scenario) => runScenario(scenario, catalog));
  const validation = validateProof(disabledProof, rows);
  const summary = {
    codename: "KNOWLEDGE-LAYER-SIGNED-IN-PREVIEW-PROOF-PR9",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, sourceReportPath),
    verdict: validation.failures.length === 0 ? "PASS" : "FAIL",
    proofMode: "simulated_signed_in_operator",
    featureFlags: featureFlags.map((name) => ({
      name,
      defaultEnabled: false,
      enabledOnlyInProofEnv: Object.prototype.hasOwnProperty.call(proofEnv, name),
    })),
    truthSplit: {
      signedInBrowserUsed: false,
      simulatedSignedInProof: true,
      defaultRouteExposureChanged: false,
      defaultNavExposureChanged: false,
      defaultHomeBehaviorChanged: false,
      defaultMovesBehaviorChanged: false,
      defaultIntelligenceBehaviorChanged: false,
      defaultClaudeBehaviorChanged: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      deployRequired: false,
    },
    proofCounts: {
      scenarios: rows.length,
      totalHomeProfiles: rows.reduce((sum, row) => sum + row.summary.homeProfiles, 0),
      totalMovesProfiles: rows.reduce((sum, row) => sum + row.summary.movesProfiles, 0),
      totalIntelligenceProfiles: rows.reduce((sum, row) => sum + row.summary.intelligenceProfiles, 0),
      consistencyFailures: validation.failures.length,
    },
    scenarios: rows.map((row) => row.summary),
    failures: validation.failures,
  };

  for (const row of rows) writeJson(row.scenario.outputFile, row.output);
  writeJson("summary.json", summary);
  writeMarkdown(summary);
  writeHtml(summary, rows);

  if (validation.failures.length > 0) {
    throw new Error(`Signed-in preview proof failed: ${validation.failures.join("; ")}`);
  }
  console.log(`knowledge layer signed-in preview proof PASS: ${path.relative(repoRoot, outDir)}`);
}

function runScenario(scenario: Scenario, catalog: ContextSourceCatalogEntry[]) {
  const scenarioCatalog = catalogForScenario(catalog, scenario);
  const home = buildHomeKnowledgePreview({
    tenantKey: scenario.tenantKey,
    previewId: slug(scenario.title),
    question: scenario.question,
    focusEntities: scenario.focusEntities,
    catalog: scenarioCatalog,
    generatedAt,
    sourceVersion,
    contextVersion,
    env: proofEnv,
  });
  const moves = buildMovesKnowledgeRuntimeContext({
    tenantKey: scenario.tenantKey,
    moveId: `${slug(scenario.title)}-move`,
    phase: scenario.phase,
    question: scenario.question,
    useCaseArchetype: scenario.question,
    knownEntities: scenario.focusEntities,
    catalog: scenarioCatalog,
    generatedAt,
    sourceVersion,
    contextVersion,
    env: proofEnv,
  });
  const intelligence = assembleIntelligenceRuntimeContext({
    tenantKey: scenario.tenantKey,
    question: scenario.question,
    audience: scenario.audience,
    catalog: scenarioCatalog,
    generatedAt,
    sourceVersion,
    contextVersion,
    env: proofEnv,
  });
  if (home.status !== "enabled" || moves.status !== "enabled" || intelligence.status !== "enabled") {
    throw new Error(`${scenario.title}: all modules must enable under proof-only flags`);
  }
  const consistency = compareModules(home, moves, intelligence);
  const output = {
    scenario,
    proofMode: "simulated_signed_in_operator",
    home: compactHome(home),
    moves: compactMoves(moves),
    intelligence: compactIntelligence(intelligence),
    consistency,
    guardrails: {
      noDefaultRouteExposure: true,
      noDefaultNavExposure: true,
      noTenantWrites: true,
      noActiveTenantUpdate: true,
      noCandidatePromotion: true,
      noDefaultClaudeBehaviorChange: true,
    },
  };
  return {
    scenario,
    output,
    summary: {
      outputFile: scenario.outputFile,
      title: scenario.title,
      tenantKey: scenario.tenantKey,
      selectedCatalogKey: home.cacheBuild.resolution.selectedCatalogKey,
      homeProfiles: home.homeKnowledgePack.relevantEntityProfiles.length,
      movesProfiles: moves.movesContextPack.relevantEntityProfiles.length,
      intelligenceProfiles: intelligence.intelligenceContextPack.relevantEntityProfiles.length,
      sharedProfiles: consistency.sharedProfileIds.length,
      sharedRelationships: consistency.sharedRelationshipIds.length,
      sharedEvidenceRefs: consistency.sharedEvidenceRefs.length,
      confidenceOverall: {
        home: home.homeKnowledgePack.confidenceSummary.overall,
        moves: moves.movesContextPack.confidenceSummary.overall,
        intelligence: intelligence.intelligenceContextPack.confidenceSummary.overall,
      },
      intelligenceTimingMs: intelligence.timing.totalAssemblyMs,
      qualityAssessment:
        consistency.failures.length === 0
          ? "Home, Moves, and Intelligence use coherent source-backed context with no default exposure or tenant mutation."
          : `Consistency issues: ${consistency.failures.join("; ")}`,
    },
  };
}

function buildDisabledProof(catalog: ContextSourceCatalogEntry[]) {
  const scenario = scenarios[0];
  return {
    home: buildHomeKnowledgePreview({
      tenantKey: scenario.tenantKey,
      previewId: "disabled-home-proof",
      question: scenario.question,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      env: {},
    }),
    moves: buildMovesKnowledgeRuntimeContext({
      tenantKey: scenario.tenantKey,
      moveId: "disabled-moves-proof",
      phase: scenario.phase,
      question: scenario.question,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      env: {},
    }),
    intelligence: assembleIntelligenceRuntimeContext({
      tenantKey: scenario.tenantKey,
      question: scenario.question,
      audience: scenario.audience,
      catalog,
      generatedAt,
      sourceVersion,
      contextVersion,
      env: {},
    }),
  };
}

function compareModules(
  home: EnabledHomeKnowledgePreview,
  moves: EnabledMovesKnowledgeRuntimeResult,
  intelligence: EnabledIntelligenceKnowledgeRuntimeResult,
) {
  const homeProfiles = ids(home.homeKnowledgePack.relevantEntityProfiles.map((profile) => profile.profileId));
  const movesProfiles = ids(moves.movesContextPack.relevantEntityProfiles.map((profile) => profile.profileId));
  const intelligenceProfiles = ids(intelligence.intelligenceContextPack.relevantEntityProfiles.map((profile) => profile.profileId));
  const sharedProfileIds = intersection(homeProfiles, movesProfiles, intelligenceProfiles);
  const sharedRelationshipIds = intersection(
    ids(home.homeKnowledgePack.relationshipCandidates.map((edge) => edge.relationshipId)),
    ids(moves.movesContextPack.relationshipCandidates.map((edge) => edge.relationshipId)),
    ids(intelligence.intelligenceContextPack.relationshipCandidates.map((edge) => edge.relationshipId)),
  );
  const sharedEvidenceRefs = intersection(
    ids(home.homeKnowledgePack.evidence.map((ref) => ref.evidenceId)),
    ids(moves.movesContextPack.evidence.map((ref) => ref.evidenceId)),
    ids(intelligence.intelligenceContextPack.evidence.map((ref) => ref.evidenceId)),
  );
  const sharedGapIds = intersection(
    ids(home.homeKnowledgePack.gaps.map((gap) => gap.gapId)),
    ids(moves.movesContextPack.gaps.map((gap) => gap.gapId)),
    ids(intelligence.intelligenceContextPack.gaps.map((gap) => gap.gapId)),
  );
  const failures: string[] = [];
  if (sharedProfileIds.length < 8) failures.push("fewer than 8 shared profile ids");
  if (sharedRelationshipIds.length < 6) failures.push("fewer than 6 shared relationship ids");
  if (sharedEvidenceRefs.length === 0) failures.push("no shared evidence refs");
  if (sharedGapIds.length === 0) failures.push("no shared gap ids");
  const overall = [
    home.homeKnowledgePack.confidenceSummary.overall,
    moves.movesContextPack.confidenceSummary.overall,
    intelligence.intelligenceContextPack.confidenceSummary.overall,
  ];
  if (new Set(overall).size > 1) failures.push(`confidence summaries differ: ${overall.join(", ")}`);
  if (home.homeKnowledgePack.claudeReadyContextPayload.unsupportedClaims.length > 0) failures.push("Home Claude payload leaked unsupported claims");
  if (moves.knowledgeContextPreviewArtifact.claudeReadyContextPayload.unsupportedClaims.length > 0) failures.push("Moves Claude payload leaked unsupported claims");
  if (intelligence.progressiveClaudePayload.initialPayload.unsupportedClaims.length > 0) failures.push("Intelligence initial payload leaked unsupported claims");
  for (const pack of [home.homeKnowledgePack, moves.movesContextPack, intelligence.intelligenceContextPack]) {
    if (
      pack.truthBoundary.candidateContextIncluded ||
      pack.truthBoundary.activeTenantAccessUpdated ||
      pack.truthBoundary.productionTenantDataWritten ||
      pack.truthBoundary.candidatePromoted ||
      pack.truthBoundary.moduleRuntimeBehaviorChanged
    ) {
      failures.push(`${pack.moduleKey} failed active/candidate boundary`);
    }
  }
  const homeVisible = JSON.stringify(home.surface.sections);
  if (/v6|v7|rich-pack|current-state/i.test(homeVisible)) {
    failures.push("Home visible proof includes legacy technical layer wording");
  }
  if (JSON.stringify(home.surface.sections).includes("collapsedTechnicalDiagnostics")) {
    failures.push("Home diagnostics leaked into primary surface sections");
  }
  if (moves.knowledgeContextPreviewArtifact.overwritePolicy !== "append_only_no_silent_overwrite") {
    failures.push("Moves preview does not prevent silent overwrite");
  }
  return {
    sharedProfileIds,
    sharedRelationshipIds,
    sharedEvidenceRefs,
    sharedGapIds,
    failures,
  };
}

function validateProof(
  disabledProof: {
    home: HomeKnowledgePreviewResult;
    moves: MovesKnowledgeRuntimeResult;
    intelligence: IntelligenceKnowledgeRuntimeResult;
  },
  rows: Array<ReturnType<typeof runScenario>>,
) {
  const failures: string[] = [];
  if (disabledProof.home.status !== "disabled") failures.push("Home preview default flag was not disabled");
  if (disabledProof.moves.status !== "disabled") failures.push("Moves runtime default flag was not disabled");
  if (disabledProof.intelligence.status !== "disabled") failures.push("Intelligence runtime default flag was not disabled");
  for (const flag of featureFlags) {
    if (process.env[flag]) failures.push(`${flag} is set in the ambient environment; proof requires default false`);
  }
  for (const row of rows) {
    failures.push(...row.output.consistency.failures.map((failure) => `${row.scenario.outputFile}: ${failure}`));
    const text = JSON.stringify(row.output);
    if (containsRealizedValueClaim(text)) failures.push(`${row.scenario.outputFile}: realized-value claim leaked`);
    if (!text.includes(row.scenario.preferredCatalogKey)) {
      failures.push(`${row.scenario.outputFile}: preferred catalog key missing from proof`);
    }
  }
  return { failures };
}

function compactHome(result: EnabledHomeKnowledgePreview) {
  return {
    status: result.status,
    request: result.request,
    selectedCatalogKey: result.cacheBuild.resolution.selectedCatalogKey,
    sections: result.surface.sections,
    diagnosticsCollapsed: Boolean(result.surface.collapsedTechnicalDiagnostics),
    contextPack: packSummary(result.homeKnowledgePack),
    guardrails: result.guardrails,
  };
}

function compactMoves(result: EnabledMovesKnowledgeRuntimeResult) {
  return {
    status: result.status,
    request: result.request,
    selectedCatalogKey: result.cacheBuild.resolution.selectedCatalogKey,
    phaseSections: result.phaseSections,
    previewArtifact: result.knowledgeContextPreviewArtifact,
    contextPack: packSummary(result.movesContextPack),
    guardrails: result.guardrails,
  };
}

function compactIntelligence(result: EnabledIntelligenceKnowledgeRuntimeResult) {
  return {
    status: result.status,
    request: result.request,
    selectedCatalogKey: result.cacheBuild.resolution.selectedCatalogKey,
    fastContextPack: result.fastContextPack,
    deepContextPack: result.deepContextPack,
    progressiveClaudePayload: result.progressiveClaudePayload,
    timing: result.timing,
    contextPack: packSummary(result.intelligenceContextPack),
    guardrails: result.guardrails,
  };
}

function packSummary(pack: ContextPack) {
  return {
    contextPackId: pack.contextPackId,
    moduleKey: pack.moduleKey,
    mode: pack.mode,
    profiles: pack.relevantEntityProfiles.map((profile) => ({
      profileId: profile.profileId,
      entityType: profile.entityType,
      entityName: profile.entityName,
      businessMeaning: profile.businessMeaning,
    })),
    relationshipCandidates: pack.relationshipCandidates,
    evidence: pack.evidence,
    gaps: pack.gaps,
    confidenceSummary: pack.confidenceSummary,
    truthBoundary: pack.truthBoundary,
    claudeReadyContextPayload: pack.claudeReadyContextPayload,
  };
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
  const baseCluster = meridian?.cluster_assessments[0];
  if (meridian && baseCluster) {
    entries.push(buildCatalogEntry({
      tenantKey: meridian.tenant_key,
      tenantName: meridian.tenant_name,
      clusterName: "Vendor Onboarding Modernization",
      cluster: {
        ...baseCluster,
        cluster: "Vendor Onboarding Modernization",
        rowsMatched: 24,
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
        metrics: ["onboarding cycle time", "approval rework rate", "supplier master exception rate"],
        issues: ["duplicate supplier records", "incomplete security review evidence", "approval handoff gaps"],
        modernizationDependencies: ["source-owner attestation", "relationship validation notes", "workflow evidence ledger"],
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
  if (!hint) throw new Error(`Missing catalog hint for ${params.tenantKey} / ${params.clusterName}`);
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

function catalogForScenario(catalog: ContextSourceCatalogEntry[], scenario: Scenario) {
  const selected = catalog.filter((entry) => entry.blueprint.catalogKey === scenario.preferredCatalogKey);
  if (selected.length !== 1) throw new Error(`Missing preferred catalog entry ${scenario.preferredCatalogKey}`);
  return selected;
}

function writeMarkdown(summary: Record<string, any>) {
  const lines = [
    "# Knowledge Layer Signed-In Preview Proof",
    "",
    `Generated: ${summary.generatedAt}`,
    `Verdict: ${summary.verdict}`,
    "",
    "## Truth Split",
    "",
    "- Simulated signed-in operator proof, not public route exposure.",
    "- All preview/runtime flags default false.",
    "- No default Home, Moves, or Intelligence behavior changes.",
    "- No tenant writes, Active Tenant Access updates, or candidate promotion.",
    "",
    "## Cross-Module Scenarios",
    "",
    "| Scenario | Catalog | Shared profiles | Shared relationships | Shared evidence | Confidence | Intelligence timing |",
    "| --- | --- | ---: | ---: | ---: | --- | ---: |",
    ...summary.scenarios.map((row: any) =>
      `| ${row.title} | ${row.selectedCatalogKey} | ${row.sharedProfiles} | ${row.sharedRelationships} | ${row.sharedEvidenceRefs} | ${row.confidenceOverall.intelligence} | ${row.intelligenceTimingMs}ms |`,
    ),
  ];
  fs.writeFileSync(path.join(outDir, "summary.md"), `${lines.join("\n")}\n`);
}

function writeHtml(summary: Record<string, any>, rows: Array<ReturnType<typeof runScenario>>) {
  const cards = rows.map((row) => `<section class="card">
    <div class="eyebrow">${escapeHtml(row.summary.tenantKey)} / ${escapeHtml(row.summary.selectedCatalogKey)}</div>
    <h2>${escapeHtml(row.summary.title)}</h2>
    <p>${escapeHtml(row.summary.qualityAssessment)}</p>
    <div class="grid">
      <div><strong>${row.summary.sharedProfiles}</strong><span>shared profiles</span></div>
      <div><strong>${row.summary.sharedRelationships}</strong><span>shared relationships</span></div>
      <div><strong>${row.summary.sharedEvidenceRefs}</strong><span>shared evidence refs</span></div>
      <div><strong>${row.summary.intelligenceTimingMs}</strong><span>ms intelligence assembly</span></div>
    </div>
  </section>`).join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
  <title>Knowledge Layer Signed-In Preview Proof</title>
  <style>
    body{margin:0;background:#f6f8fb;color:#0b1736;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{max-width:1120px;margin:0 auto;padding:48px 28px}
    .hero{background:#081831;color:white;border-radius:8px;padding:28px;margin-bottom:22px}
    .hero p{color:#dbe7ff;max-width:820px}
    .badge{display:inline-flex;border-radius:999px;padding:7px 12px;background:#dff8ee;color:#08654f;font-weight:800}
    .card{background:white;border:1px solid #dfe5ef;border-radius:8px;padding:24px;margin:16px 0;box-shadow:0 12px 34px rgba(9,24,55,.06)}
    .eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#00806a;font-size:12px;font-weight:800}
    h1{font-size:42px;line-height:1.05;margin:10px 0 12px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
    .grid div{border:1px solid #e6ebf3;border-radius:8px;padding:14px;background:#fbfcff}.grid strong{display:block;font-size:28px}.grid span{color:#63708d}
  </style></head><body><main>
  <section class="hero"><span class="badge">${escapeHtml(String(summary.verdict))}</span><h1>Signed-In Knowledge Layer Preview Proof</h1>
  <p>Simulated signed-in proof that Home, Moves, and Intelligence can consume coherent Enterprise Knowledge preview context with all flags default-off and no route, nav, data, or Claude behavior change.</p></section>
  ${cards}</main></body></html>`;
  fs.writeFileSync(path.join(outDir, "signed-in-preview-proof.html"), html);
}

function containsRealizedValueClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  return ["realized savings", "guaranteed savings", "will save", "has saved", "confirmed roi", "proven roi"].some((term) => {
    const index = normalized.indexOf(term);
    if (index === -1) return false;
    const before = normalized.slice(Math.max(0, index - 40), index);
    return !/(do not|not |no |without |blocked|unless measured|requires measured)/.test(before);
  });
}

function ids(values: string[]) { return Array.from(new Set(values)); }
function intersection(...sets: string[][]) {
  return sets.reduce((left, right) => left.filter((value) => right.includes(value)));
}
function readJson<T>(filePath: string): T { return JSON.parse(fs.readFileSync(filePath, "utf8")) as T; }
function writeJson(fileName: string, value: unknown) { fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`); }
function ensureDir(dir: string) { fs.mkdirSync(dir, { recursive: true }); }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

main();
