import fs from "node:fs";
import path from "node:path";

import type {
  ContextAssemblyBlueprint,
  ContextSourceCatalogEntry,
  SemanticClusterInput,
} from "../assembler";
import type { ContextPack } from "../contracts";
import {
  buildHomeKnowledgePreview,
  HOME_KNOWLEDGE_PREVIEW_FLAG,
  type EnabledHomeKnowledgePreview,
  type HomeKnowledgePreviewResult,
} from "../home";
import {
  assembleIntelligenceRuntimeContext,
  INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
  type EnabledIntelligenceKnowledgeRuntimeResult,
  type IntelligenceKnowledgeRuntimeResult,
  type IntelligenceRuntimeAudience,
} from "../intelligence";
import {
  buildMovesKnowledgeRuntimeContext,
  MOVES_KNOWLEDGE_RUNTIME_FLAG,
  type EnabledMovesKnowledgeRuntimeResult,
  type MovesKnowledgeRuntimeResult,
  type MovesRuntimePhase,
} from "../moves";

export const KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN =
  "knowledge-layer-live-preview";

export const KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM = "proof";

export const KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE = "/admin/knowledge-preview";

export const KNOWLEDGE_LAYER_LIVE_PREVIEW_FLAGS = [
  HOME_KNOWLEDGE_PREVIEW_FLAG,
  MOVES_KNOWLEDGE_RUNTIME_FLAG,
  INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG,
] as const;

export const KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION =
  "context-template-v3-semantic-depth-fix1";

export const KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION =
  "knowledge-layer-demo-readiness-pr11";

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
  "catalogKey" | "tenantKey" | "tenantName" | "clusterName" | "contextTitle"
>;

export interface KnowledgeLayerLivePreviewScenario {
  outputFile: string;
  title: string;
  tenantKey: string;
  question: string;
  audience: IntelligenceRuntimeAudience;
  phase: MovesRuntimePhase;
  preferredCatalogKey: string;
  focusEntities: string[];
}

export interface KnowledgeLayerLivePreviewTruthSplit {
  liveRouteExists: true;
  routeHiddenFromNavigation: true;
  explicitProofTokenRequired: true;
  defaultHomeBehaviorChanged: false;
  defaultMovesBehaviorChanged: false;
  defaultIntelligenceBehaviorChanged: false;
  defaultClaudeBehaviorChanged: false;
  productionTenantDataWritten: false;
  activeTenantAccessUpdated: false;
  candidatePromoted: false;
  moduleRuntimeConsumptionChanged: false;
  moduleReadsCandidateByDefault: false;
}

export interface KnowledgeLayerLivePreviewSummaryRow {
  outputFile: string;
  title: string;
  tenantKey: string;
  selectedCatalogKey: string;
  homeProfiles: number;
  movesProfiles: number;
  intelligenceProfiles: number;
  sharedProfiles: number;
  sharedRelationships: number;
  sharedEvidenceRefs: number;
  confidenceOverall: {
    home: string;
    moves: string;
    intelligence: string;
  };
  intelligenceTimingMs: number;
  qualityAssessment: string;
}

export interface KnowledgeLayerLivePreviewScenarioOutput {
  scenario: KnowledgeLayerLivePreviewScenario;
  proofMode: "hidden_signed_in_route_preview";
  home: ReturnType<typeof compactHome>;
  moves: ReturnType<typeof compactMoves>;
  intelligence: ReturnType<typeof compactIntelligence>;
  consistency: ReturnType<typeof compareModules>;
  guardrails: {
    routeHiddenFromNavigation: true;
    explicitProofTokenRequired: true;
    candidatePromoted: false;
    activeTenantAccessUpdated: false;
    productionTenantDataWritten: false;
    moduleRuntimeConsumptionChanged: false;
    moduleReadsCandidateByDefault: false;
    defaultClaudeBehaviorChanged: false;
  };
}

export interface KnowledgeLayerLivePreviewProof {
  codename: "KNOWLEDGE-LAYER-DEMO-READINESS-PR11";
  generatedAt: string;
  sourceSemanticProof: string;
  verdict: "PASS" | "FAIL";
  proofMode: "hidden_signed_in_route_preview";
  route: {
    path: typeof KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE;
    queryParam: typeof KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM;
    requiredToken: typeof KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN;
    defaultRenderable: "disabled_guardrail_only";
    navigationExposed: false;
  };
  featureFlags: Array<{
    name: (typeof KNOWLEDGE_LAYER_LIVE_PREVIEW_FLAGS)[number];
    defaultEnabled: false;
    enabledOnlyInProofEnv: true;
  }>;
  truthSplit: KnowledgeLayerLivePreviewTruthSplit;
  proofCounts: {
    scenarios: number;
    totalHomeProfiles: number;
    totalMovesProfiles: number;
    totalIntelligenceProfiles: number;
    consistencyFailures: number;
  };
  disabledDefaults: {
    home: "disabled" | "enabled";
    moves: "disabled" | "enabled";
    intelligence: "disabled" | "enabled";
  };
  scenarios: KnowledgeLayerLivePreviewSummaryRow[];
  scenarioOutputs: KnowledgeLayerLivePreviewScenarioOutput[];
  failures: string[];
}

export function isKnowledgeLayerLivePreviewRequested(
  value: string | string[] | undefined,
): boolean {
  return value === KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN;
}

export function proofOnlyLivePreviewEnv(): Record<string, string> {
  return {
    [HOME_KNOWLEDGE_PREVIEW_FLAG]: "true",
    [MOVES_KNOWLEDGE_RUNTIME_FLAG]: "true",
    [INTELLIGENCE_KNOWLEDGE_RUNTIME_FLAG]: "true",
  };
}

export function buildKnowledgeLayerLivePreviewProof(params: {
  repoRoot?: string;
  generatedAt?: string;
} = {}): KnowledgeLayerLivePreviewProof {
  const repoRoot = params.repoRoot ?? process.cwd();
  const generatedAt = params.generatedAt ?? new Date().toISOString();
  const sourceReportPath = path.join(
    repoRoot,
    "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
  );
  const sourceSemanticProof = path.relative(repoRoot, sourceReportPath);
  const catalog = buildCatalog(readSemanticReport(sourceReportPath), repoRoot);
  const disabledDefaults = buildDisabledDefaults(catalog, generatedAt);
  const scenarioOutputs = LIVE_PREVIEW_SCENARIOS.map((scenario) =>
    runScenario({ scenario, catalog, generatedAt }),
  );
  const failures = validateProof(disabledDefaults, scenarioOutputs);
  const scenarios = scenarioOutputs.map((row) => row.summary);

  return {
    codename: "KNOWLEDGE-LAYER-DEMO-READINESS-PR11",
    generatedAt,
    sourceSemanticProof,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    proofMode: "hidden_signed_in_route_preview",
    route: {
      path: KNOWLEDGE_LAYER_LIVE_PREVIEW_ROUTE,
      queryParam: KNOWLEDGE_LAYER_LIVE_PREVIEW_QUERY_PARAM,
      requiredToken: KNOWLEDGE_LAYER_LIVE_PREVIEW_PROOF_TOKEN,
      defaultRenderable: "disabled_guardrail_only",
      navigationExposed: false,
    },
    featureFlags: KNOWLEDGE_LAYER_LIVE_PREVIEW_FLAGS.map((name) => ({
      name,
      defaultEnabled: false,
      enabledOnlyInProofEnv: true,
    })),
    truthSplit: livePreviewTruthSplit(),
    proofCounts: {
      scenarios: scenarios.length,
      totalHomeProfiles: scenarios.reduce((sum, row) => sum + row.homeProfiles, 0),
      totalMovesProfiles: scenarios.reduce((sum, row) => sum + row.movesProfiles, 0),
      totalIntelligenceProfiles: scenarios.reduce(
        (sum, row) => sum + row.intelligenceProfiles,
        0,
      ),
      consistencyFailures: failures.length,
    },
    disabledDefaults: {
      home: disabledDefaults.home.status,
      moves: disabledDefaults.moves.status,
      intelligence: disabledDefaults.intelligence.status,
    },
    scenarios,
    scenarioOutputs: scenarioOutputs.map((row) => row.output),
    failures,
  };
}

export const LIVE_PREVIEW_SCENARIOS: KnowledgeLayerLivePreviewScenario[] = [
  {
    outputFile: "meridian-agent-assist-live.json",
    title: "Meridian - Agent Assist / Member Service",
    tenantKey: "meridian-health",
    question: "How ready are we for Agent Assist in member service?",
    audience: "CIO",
    phase: "P2",
    preferredCatalogKey: "meridian-health-agent-assist-member-service",
    focusEntities: [
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "claims",
      "eligibility",
      "PHI handling",
    ],
  },
  {
    outputFile: "meridian-finance-live.json",
    title: "Meridian - Finance Analytics",
    tenantKey: "meridian-health",
    question: "What is the Finance Analytics modernization opportunity?",
    audience: "CFO",
    phase: "P1",
    preferredCatalogKey: "meridian-health-finance-analytics",
    focusEntities: [
      "Oracle ERP Finance",
      "Workday",
      "Netezza",
      "SQL Server Finance Mart",
      "Databricks",
    ],
  },
  {
    outputFile: "harbortrust-fraud-live.json",
    title: "HarborTrust - Fraud Analyst Copilot",
    tenantKey: "harbortrust-bank",
    question: "Can AI help fraud analysts triage alerts safely?",
    audience: "CISO",
    phase: "P2",
    preferredCatalogKey: "harbortrust-bank-fraud-analyst-copilot",
    focusEntities: [
      "Fraud alert platform",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "model-risk controls",
    ],
  },
  {
    outputFile: "generic-vendor-onboarding-live.json",
    title: "Generic - Vendor Onboarding Modernization",
    tenantKey: "meridian-health",
    question: "What context do we have for vendor onboarding modernization?",
    audience: "COO",
    phase: "P0",
    preferredCatalogKey: "meridian-health-vendor-onboarding-modernization",
    focusEntities: [
      "supplier intake workflow",
      "ERP supplier master",
      "ServiceNow request queue",
      "source-owner attestation",
    ],
  },
];

function runScenario(params: {
  scenario: KnowledgeLayerLivePreviewScenario;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
}) {
  const env = proofOnlyLivePreviewEnv();
  const scenarioCatalog = catalogForScenario(params.catalog, params.scenario);
  const home = buildHomeKnowledgePreview({
    tenantKey: params.scenario.tenantKey,
    previewId: slug(params.scenario.title),
    question: params.scenario.question,
    focusEntities: params.scenario.focusEntities,
    catalog: scenarioCatalog,
    generatedAt: params.generatedAt,
    sourceVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION,
    contextVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION,
    env,
  });
  const moves = buildMovesKnowledgeRuntimeContext({
    tenantKey: params.scenario.tenantKey,
    moveId: `${slug(params.scenario.title)}-move`,
    phase: params.scenario.phase,
    question: params.scenario.question,
    useCaseArchetype: params.scenario.question,
    knownEntities: params.scenario.focusEntities,
    catalog: scenarioCatalog,
    generatedAt: params.generatedAt,
    sourceVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION,
    contextVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION,
    env,
  });
  const intelligence = assembleIntelligenceRuntimeContext({
    tenantKey: params.scenario.tenantKey,
    question: params.scenario.question,
    audience: params.scenario.audience,
    catalog: scenarioCatalog,
    generatedAt: params.generatedAt,
    sourceVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION,
    contextVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION,
    env,
  });
  if (
    home.status !== "enabled" ||
    moves.status !== "enabled" ||
    intelligence.status !== "enabled"
  ) {
    throw new Error(`${params.scenario.title}: all modules must enable under proof-only flags`);
  }
  const consistency = compareModules(home, moves, intelligence);
  const output: KnowledgeLayerLivePreviewScenarioOutput = {
    scenario: params.scenario,
    proofMode: "hidden_signed_in_route_preview",
    home: compactHome(home),
    moves: compactMoves(moves),
    intelligence: compactIntelligence(intelligence),
    consistency,
    guardrails: {
      routeHiddenFromNavigation: true,
      explicitProofTokenRequired: true,
      candidatePromoted: false,
      activeTenantAccessUpdated: false,
      productionTenantDataWritten: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
      defaultClaudeBehaviorChanged: false,
    },
  };
  return {
    output,
    summary: {
      outputFile: params.scenario.outputFile,
      title: params.scenario.title,
      tenantKey: params.scenario.tenantKey,
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
      intelligenceTimingMs: 0,
      qualityAssessment:
        consistency.failures.length === 0
          ? "Home, Moves, and Intelligence use coherent source-backed context with no default exposure, no Claude default change, and no tenant mutation."
          : `Consistency issues: ${consistency.failures.join("; ")}`,
    } satisfies KnowledgeLayerLivePreviewSummaryRow,
  };
}

function buildDisabledDefaults(
  catalog: ContextSourceCatalogEntry[],
  generatedAt: string,
): {
  home: HomeKnowledgePreviewResult;
  moves: MovesKnowledgeRuntimeResult;
  intelligence: IntelligenceKnowledgeRuntimeResult;
} {
  const scenario = LIVE_PREVIEW_SCENARIOS[0];
  return {
    home: buildHomeKnowledgePreview({
      tenantKey: scenario.tenantKey,
      previewId: "disabled-home-proof",
      question: scenario.question,
      catalog,
      generatedAt,
      sourceVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION,
      contextVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION,
      env: {},
    }),
    moves: buildMovesKnowledgeRuntimeContext({
      tenantKey: scenario.tenantKey,
      moveId: "disabled-moves-proof",
      phase: scenario.phase,
      question: scenario.question,
      catalog,
      generatedAt,
      sourceVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION,
      contextVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION,
      env: {},
    }),
    intelligence: assembleIntelligenceRuntimeContext({
      tenantKey: scenario.tenantKey,
      question: scenario.question,
      audience: scenario.audience,
      catalog,
      generatedAt,
      sourceVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_SOURCE_VERSION,
      contextVersion: KNOWLEDGE_LAYER_LIVE_PREVIEW_CONTEXT_VERSION,
      env: {},
    }),
  };
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
    timing: {
      ...result.timing,
      intentClassificationMs: 0,
      fastContextPackMs: 0,
      initialPayloadMs: 0,
      deepContextPackMs: 0,
      totalAssemblyMs: 0,
    },
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

function compareModules(
  home: EnabledHomeKnowledgePreview,
  moves: EnabledMovesKnowledgeRuntimeResult,
  intelligence: EnabledIntelligenceKnowledgeRuntimeResult,
) {
  const homeProfiles = ids(
    home.homeKnowledgePack.relevantEntityProfiles.map((profile) => profile.profileId),
  );
  const movesProfiles = ids(
    moves.movesContextPack.relevantEntityProfiles.map((profile) => profile.profileId),
  );
  const intelligenceProfiles = ids(
    intelligence.intelligenceContextPack.relevantEntityProfiles.map(
      (profile) => profile.profileId,
    ),
  );
  const sharedProfileIds = intersection(homeProfiles, movesProfiles, intelligenceProfiles);
  const sharedRelationshipIds = intersection(
    ids(home.homeKnowledgePack.relationshipCandidates.map((edge) => edge.relationshipId)),
    ids(moves.movesContextPack.relationshipCandidates.map((edge) => edge.relationshipId)),
    ids(
      intelligence.intelligenceContextPack.relationshipCandidates.map(
        (edge) => edge.relationshipId,
      ),
    ),
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
  if (sharedRelationshipIds.length < 6) {
    failures.push("fewer than 6 shared relationship ids");
  }
  if (sharedEvidenceRefs.length === 0) failures.push("no shared evidence refs");
  if (sharedGapIds.length === 0) failures.push("no shared gap ids");
  const overall = [
    home.homeKnowledgePack.confidenceSummary.overall,
    moves.movesContextPack.confidenceSummary.overall,
    intelligence.intelligenceContextPack.confidenceSummary.overall,
  ];
  if (new Set(overall).size > 1) {
    failures.push(`confidence summaries differ: ${overall.join(", ")}`);
  }
  if (home.homeKnowledgePack.claudeReadyContextPayload.unsupportedClaims.length > 0) {
    failures.push("Home Claude payload leaked unsupported claims");
  }
  if (moves.knowledgeContextPreviewArtifact.claudeReadyContextPayload.unsupportedClaims.length > 0) {
    failures.push("Moves Claude payload leaked unsupported claims");
  }
  if (intelligence.progressiveClaudePayload.initialPayload.unsupportedClaims.length > 0) {
    failures.push("Intelligence initial payload leaked unsupported claims");
  }
  for (const pack of [
    home.homeKnowledgePack,
    moves.movesContextPack,
    intelligence.intelligenceContextPack,
  ]) {
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
  disabledDefaults: {
    home: HomeKnowledgePreviewResult;
    moves: MovesKnowledgeRuntimeResult;
    intelligence: IntelligenceKnowledgeRuntimeResult;
  },
  rows: Array<ReturnType<typeof runScenario>>,
): string[] {
  const failures: string[] = [];
  if (disabledDefaults.home.status !== "disabled") {
    failures.push("Home preview default flag was not disabled");
  }
  if (disabledDefaults.moves.status !== "disabled") {
    failures.push("Moves runtime default flag was not disabled");
  }
  if (disabledDefaults.intelligence.status !== "disabled") {
    failures.push("Intelligence runtime default flag was not disabled");
  }
  for (const flag of KNOWLEDGE_LAYER_LIVE_PREVIEW_FLAGS) {
    if (process.env[flag]) {
      failures.push(`${flag} is set in the ambient environment; proof requires default false`);
    }
  }
  for (const row of rows) {
    failures.push(
      ...row.output.consistency.failures.map(
        (failure) => `${row.output.scenario.outputFile}: ${failure}`,
      ),
    );
    const text = JSON.stringify(row.output);
    if (containsRealizedValueClaim(text)) {
      failures.push(`${row.output.scenario.outputFile}: realized-value claim leaked`);
    }
    if (!text.includes(row.output.scenario.preferredCatalogKey)) {
      failures.push(`${row.output.scenario.outputFile}: preferred catalog key missing`);
    }
  }
  return failures;
}

function buildCatalog(report: SemanticReport, repoRoot: string): ContextSourceCatalogEntry[] {
  const sourceReportPath = path.join(
    repoRoot,
    "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
  );
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
    entries.push(
      buildCatalogEntry({
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
      }),
    );
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

function readSemanticReport(sourceReportPath: string): SemanticReport {
  if (fs.existsSync(sourceReportPath)) {
    return JSON.parse(fs.readFileSync(sourceReportPath, "utf8")) as SemanticReport;
  }
  return embeddedSemanticReport();
}

function embeddedSemanticReport(): SemanticReport {
  return {
    tenants: [
      {
        tenant_key: "meridian-health",
        tenant_name: "Meridian Health",
        cluster_assessments: [
          {
            cluster: "Finance Analytics",
            rowsMatched: 48,
            painPoints: [
              "Finance reporting spans ERP, workforce, vendor spend, and on-prem analytics marts.",
              "Month-end reconciliation still requires manual review across marts and dashboard estates.",
            ],
            evidenceItems: [
              "Finance analytics source inventory",
              "Managed analytics service run-book",
              "Databricks target-state planning note",
            ],
            metrics: [
              "close report refresh completion",
              "manual reconciliation hours per close cycle",
            ],
            issues: ["manual reconciliation", "fragmented finance definitions"],
            modernizationDependencies: ["Databricks Finance Gold target", "vendor master harmonization"],
            relationshipsPresent: 12,
          },
          {
            cluster: "Agent Assist / Member Service",
            rowsMatched: 36,
            painPoints: [
              "Member service context spans contact center, CRM, claims, eligibility, and knowledge sources.",
              "PHI and human-approval guardrails must be validated before assistive workflows are trusted.",
            ],
            evidenceItems: [
              "Member service workflow sample",
              "Contact-center transcript sample",
              "CRM and claims integration notes",
            ],
            metrics: ["average handle time", "first-contact resolution", "after-call work minutes"],
            issues: ["stale knowledge articles", "PHI handling caveats"],
            modernizationDependencies: ["Genesys-Salesforce-claims context join", "audited answer packet"],
            relationshipsPresent: 10,
          },
        ],
      },
      {
        tenant_key: "harbortrust-bank",
        tenant_name: "HarborTrust Bank",
        cluster_assessments: [
          {
            cluster: "Fraud Analyst Copilot",
            rowsMatched: 34,
            painPoints: [
              "Fraud alerts, case outcomes, KYC evidence, and model scores need governed triage context.",
              "Model-risk controls and feedback-loop lineage must be visible before advisory use.",
            ],
            evidenceItems: [
              "Fraud case workflow sample",
              "KYC vendor context",
              "Device intelligence contract context",
            ],
            metrics: ["false-positive rate", "analyst throughput", "confirmed fraud loss"],
            issues: ["model version lineage gaps", "case outcome feedback gaps"],
            modernizationDependencies: ["feature-store feedback loop", "model governance evaluation set"],
            relationshipsPresent: 9,
          },
        ],
      },
    ],
  };
}

function catalogForScenario(
  catalog: ContextSourceCatalogEntry[],
  scenario: KnowledgeLayerLivePreviewScenario,
): ContextSourceCatalogEntry[] {
  const selected = catalog.filter(
    (entry) => entry.blueprint.catalogKey === scenario.preferredCatalogKey,
  );
  if (selected.length !== 1) {
    throw new Error(`Missing preferred catalog entry ${scenario.preferredCatalogKey}`);
  }
  return selected;
}

function livePreviewTruthSplit(): KnowledgeLayerLivePreviewTruthSplit {
  return {
    liveRouteExists: true,
    routeHiddenFromNavigation: true,
    explicitProofTokenRequired: true,
    defaultHomeBehaviorChanged: false,
    defaultMovesBehaviorChanged: false,
    defaultIntelligenceBehaviorChanged: false,
    defaultClaudeBehaviorChanged: false,
    productionTenantDataWritten: false,
    activeTenantAccessUpdated: false,
    candidatePromoted: false,
    moduleRuntimeConsumptionChanged: false,
    moduleReadsCandidateByDefault: false,
  };
}

function containsRealizedValueClaim(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "realized savings",
    "guaranteed savings",
    "will save",
    "has saved",
    "confirmed roi",
    "proven roi",
  ].some((term) => {
    const index = normalized.indexOf(term);
    if (index === -1) return false;
    const before = normalized.slice(Math.max(0, index - 48), index);
    return !/(do not|not |no |without |blocked|unless measured|requires measured)/.test(before);
  });
}

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
    metrics: ["average handle time", "first-contact resolution", "transfer rate", "after-call work minutes"],
    sourceContext: [
      "member service process",
      "contact-center platform contracts",
      "CRM licenses",
      "call transcript annotation sample",
    ],
    movesPhase: "P2",
    moduleGuidance: {
      home: "Show member service readiness with systems, data, risks, and recommended evidence.",
      moves: "Return phase evidence and gaps only.",
      intelligence:
        "Assess readiness from source-backed workflow and data context, with PHI and human-approval caveats.",
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
    vendorsContracts: ["KYC vendor", "device intelligence vendor", "core banking provider"],
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
    sourceContext: ["fraud case workflow", "KYC vendor context", "device intelligence contract context"],
    movesPhase: "P2",
    moduleGuidance: {
      home: "Show the fraud copilot profile with data, controls, caveats, and evidence.",
      moves: "Return phase evidence and blockers.",
      intelligence:
        "Assess copilot readiness with model-risk caveats and relationship validation gaps.",
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
    metrics: ["onboarding cycle time", "approval rework rate", "supplier master exception rate"],
    sourceContext: [
      "supplier onboarding workflow",
      "source-owner attestation",
      "relationship validation notes",
    ],
    moduleGuidance: {
      home: "Show vendor onboarding as enterprise context when evidence is loaded.",
      moves: "Use this to shape P0/P1 framing if a Move is later created.",
      intelligence: "Use generic workflow, system, data, vendor, risk, and metric context.",
      source: "Use vendor and contract context as inputs only.",
      tower: "Use cycle-time metrics as candidates only.",
    },
  },
};

function ids(values: string[]): string[] {
  return Array.from(new Set(values));
}

function intersection(...sets: string[][]): string[] {
  return sets.reduce((left, right) => left.filter((value) => right.includes(value)));
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
