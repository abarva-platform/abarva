import type {
  ContextPackMode,
  EntityProfile,
  IntelligenceContextPack,
  ModuleContextRequest,
  ModuleContextResponse,
  RequestedKnowledgeDomain,
} from "../contracts";
import {
  assembleModuleContext,
  classifyContextIntent,
  resolveContextAssemblyInput,
  type ContextSourceCatalogEntry,
  type IntentClassification,
} from "../assembler";

export interface IntelligenceContextPackDryRunInput {
  tenantKey: string;
  question: string;
  audience?: "CIO" | "CFO" | "CDAO" | "COO" | "CISO" | "CEO" | "EVP";
  mode?: ContextPackMode;
  requiredDepth?: "fast" | "deep" | "progressive";
}

export interface FastContextPack {
  targetLatencyMs: number;
  tenantSummary: string;
  executiveIntent: string;
  inferredArchetype: string;
  topEntityProfiles: Array<Pick<EntityProfile, "profileId" | "entityType" | "entityName" | "businessMeaning" | "moduleReadiness">>;
  topRelationshipSummaries: string[];
  topRisks: string[];
  topMetrics: string[];
  knownGaps: string[];
  confidenceSummary: IntelligenceContextPack["confidenceSummary"];
}

export interface DeepContextPack {
  targetLatencyMs: number;
  expandedRelationshipCount: number;
  evidenceRefs: string[];
  sourceLineage: string[];
  spendVendorProgramContext: string[];
  processAndDataContext: string[];
  unsupportedClaims: string[];
  recommendedNextEvidence: string[];
  caveats: string[];
}

export interface StreamingContextAssemblyTrace {
  stages: Array<{
    stage: "classify_intent" | "resolve_entities" | "fast_pack" | "deep_pack" | "audit_payload";
    targetLatencyMs: number;
    blocksFirstToken: boolean;
    status: "planned" | "complete";
    output: string;
  }>;
}

export interface ContextPackCachePlan {
  cacheableArtifacts: string[];
  mustNotRebuildFromRawRowsAtRuntime: true;
  cacheMissFallback: string;
}

export interface ProgressiveClaudePayload {
  initialPayload: {
    audience: string;
    question: string;
    compactContext: string[];
    factsVsInferenceInstruction: string;
    unsupportedClaims: string[];
  };
  enrichmentPayload: {
    evidenceRefs: string[];
    relationshipSummaries: string[];
    gaps: string[];
    nextEvidence: string[];
  };
  auditPayload: {
    excludedUnsupportedClaims: string[];
    truthBoundary: IntelligenceContextPack["truthBoundary"];
    assemblyTrace: IntelligenceContextPack["assemblyTrace"];
  };
}

export interface IntelligenceContextPackDryRunResult {
  request: ModuleContextRequest;
  intent: IntentClassification;
  selectedCatalogKey: string;
  resolutionScore: number;
  matchedTokens: string[];
  response: ModuleContextResponse;
  intelligenceContextPack: IntelligenceContextPack;
  fastContextPack: FastContextPack;
  deepContextPack: DeepContextPack;
  streamingTrace: StreamingContextAssemblyTrace;
  cachePlan: ContextPackCachePlan;
  progressiveClaudePayload: ProgressiveClaudePayload;
}

export const INTELLIGENCE_DOMAINS: RequestedKnowledgeDomain[] = [
  "enterprise_profile",
  "functions",
  "processes",
  "applications_systems",
  "data_domains",
  "infrastructure",
  "vendors_contracts",
  "programs",
  "risks_controls",
  "metrics_outcomes",
  "use_cases",
  "relationships",
  "evidence",
];

export function buildIntelligenceContextPackDryRun(params: {
  input: IntelligenceContextPackDryRunInput;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
}): IntelligenceContextPackDryRunResult {
  const request = buildIntelligenceRequest(params.input);
  const intent = classifyContextIntent(request);
  const resolved = resolveContextAssemblyInput({
    request,
    intent,
    catalog: params.catalog,
    generatedAt: params.generatedAt,
  });
  const response = assembleModuleContext(resolved);
  const intelligenceContextPack = response.contextPack as IntelligenceContextPack;
  const fastContextPack = buildIntelligenceFastContextPack(intelligenceContextPack, intent);
  const deepContextPack = buildIntelligenceDeepContextPack(intelligenceContextPack);
  const streamingTrace = buildIntelligenceStreamingTrace(fastContextPack, deepContextPack);
  const cachePlan = buildCachePlan();
  const progressiveClaudePayload = buildIntelligenceProgressiveClaudePayload({
    input: params.input,
    pack: intelligenceContextPack,
    fastContextPack,
    deepContextPack,
  });

  return {
    request,
    intent,
    selectedCatalogKey: resolved.resolution.selectedCatalogKey,
    resolutionScore: resolved.resolution.score,
    matchedTokens: resolved.resolution.matchedTokens,
    response,
    intelligenceContextPack,
    fastContextPack,
    deepContextPack,
    streamingTrace,
    cachePlan,
    progressiveClaudePayload,
  };
}

function buildIntelligenceRequest(
  input: IntelligenceContextPackDryRunInput,
): ModuleContextRequest {
  return {
    tenantKey: input.tenantKey,
    moduleKey: "intelligence",
    purpose: input.requiredDepth === "fast" ? "answer_context" : "strategy_context",
    mode: input.mode ?? "active",
    requestedDomains: INTELLIGENCE_DOMAINS,
    scope: {
      question: input.question,
      useCase: input.question,
      portfolioScope: input.audience,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "intelligence-context-pack-dry-run",
  };
}

export function buildIntelligenceFastContextPack(
  pack: IntelligenceContextPack,
  intent: IntentClassification,
): FastContextPack {
  const topProfiles = rankProfiles(pack.relevantEntityProfiles).slice(0, 10);
  return {
    targetLatencyMs: 2000,
    tenantSummary: pack.executiveSummary,
    executiveIntent: intent.moduleIntent,
    inferredArchetype: intent.archetypeKey,
    topEntityProfiles: topProfiles.map((profile) => ({
      profileId: profile.profileId,
      entityType: profile.entityType,
      entityName: profile.entityName,
      businessMeaning: profile.businessMeaning,
      moduleReadiness: profile.moduleReadiness,
    })),
    topRelationshipSummaries: pack.relationshipCandidates
      .slice(0, 8)
      .map((edge) => edge.businessMeaning),
    topRisks: namesByType(pack.relevantEntityProfiles, "risk").slice(0, 5),
    topMetrics: namesByType(pack.relevantEntityProfiles, "metric").slice(0, 5),
    knownGaps: pack.gaps.slice(0, 5).map((gap) => gap.title),
    confidenceSummary: pack.confidenceSummary,
  };
}

export function buildIntelligenceDeepContextPack(pack: IntelligenceContextPack): DeepContextPack {
  return {
    targetLatencyMs: 15000,
    expandedRelationshipCount: pack.relationshipCandidates.length,
    evidenceRefs: pack.evidence.map((evidence) => evidence.evidenceId),
    sourceLineage: Array.from(
      new Set(pack.relevantEntityProfiles.flatMap((profile) => profile.sourceLineage)),
    ),
    spendVendorProgramContext: [
      ...namesByType(pack.relevantEntityProfiles, "vendor"),
      ...namesByType(pack.relevantEntityProfiles, "contract"),
      ...namesByType(pack.relevantEntityProfiles, "program"),
    ],
    processAndDataContext: [
      ...namesByType(pack.relevantEntityProfiles, "process"),
      ...namesByType(pack.relevantEntityProfiles, "data_domain"),
      ...namesByType(pack.relevantEntityProfiles, "infrastructure"),
    ],
    unsupportedClaims: pack.unsupportedClaims.map((claim) => claim.description),
    recommendedNextEvidence: pack.recommendedNextEvidence,
    caveats: pack.caveats,
  };
}

export function buildIntelligenceStreamingTrace(
  fastContextPack: FastContextPack,
  deepContextPack: DeepContextPack,
): StreamingContextAssemblyTrace {
  return {
    stages: [
      {
        stage: "classify_intent",
        targetLatencyMs: 500,
        blocksFirstToken: true,
        status: "complete",
        output: fastContextPack.inferredArchetype,
      },
      {
        stage: "resolve_entities",
        targetLatencyMs: 1000,
        blocksFirstToken: true,
        status: "complete",
        output: `${fastContextPack.topEntityProfiles.length} top profiles resolved`,
      },
      {
        stage: "fast_pack",
        targetLatencyMs: fastContextPack.targetLatencyMs,
        blocksFirstToken: true,
        status: "complete",
        output: "Initial governed payload ready for first streamed answer.",
      },
      {
        stage: "deep_pack",
        targetLatencyMs: deepContextPack.targetLatencyMs,
        blocksFirstToken: false,
        status: "complete",
        output: `${deepContextPack.expandedRelationshipCount} relationship candidates and ${deepContextPack.evidenceRefs.length} evidence refs available for enrichment.`,
      },
      {
        stage: "audit_payload",
        targetLatencyMs: 15000,
        blocksFirstToken: false,
        status: "complete",
        output: "Unsupported claims, caveats, and truth boundary available for audit rendering.",
      },
    ],
  };
}

function buildCachePlan(): ContextPackCachePlan {
  return {
    cacheableArtifacts: [
      "tenant knowledge summary",
      "domain summaries",
      "entity profiles",
      "relationship graph slices",
      "evidence confidence summaries",
      "archetype-to-domain maps",
      "common question packs",
    ],
    mustNotRebuildFromRawRowsAtRuntime: true,
    cacheMissFallback:
      "Return a fast context-limited response with missing-cache caveat, then request asynchronous deep-pack assembly.",
  };
}

export function buildIntelligenceProgressiveClaudePayload(params: {
  input: IntelligenceContextPackDryRunInput;
  pack: IntelligenceContextPack;
  fastContextPack: FastContextPack;
  deepContextPack: DeepContextPack;
}): ProgressiveClaudePayload {
  return {
    initialPayload: {
      audience: params.input.audience ?? "executive",
      question: params.input.question,
      compactContext: [
        params.fastContextPack.tenantSummary,
        `Intent: ${params.fastContextPack.executiveIntent}`,
        `Archetype: ${params.fastContextPack.inferredArchetype}`,
        `Top profiles: ${params.fastContextPack.topEntityProfiles.map((profile) => profile.entityName).join(", ")}`,
        `Top risks: ${params.fastContextPack.topRisks.join(", ") || "none surfaced"}`,
        `Top metrics: ${params.fastContextPack.topMetrics.join(", ") || "none surfaced"}`,
        `Known gaps: ${params.fastContextPack.knownGaps.join(", ") || "none surfaced"}`,
      ],
      factsVsInferenceInstruction:
        "Answer only from governed context. Separate facts from inference. Do not claim realized value or production readiness unless evidence supports it.",
      unsupportedClaims: [],
    },
    enrichmentPayload: {
      evidenceRefs: params.deepContextPack.evidenceRefs,
      relationshipSummaries: params.pack.relationshipCandidates.map((edge) => edge.businessMeaning),
      gaps: params.pack.gaps.map((gap) => gap.title),
      nextEvidence: params.deepContextPack.recommendedNextEvidence,
    },
    auditPayload: {
      excludedUnsupportedClaims: params.deepContextPack.unsupportedClaims,
      truthBoundary: params.pack.truthBoundary,
      assemblyTrace: params.pack.assemblyTrace,
    },
  };
}

function rankProfiles(profiles: EntityProfile[]): EntityProfile[] {
  const priority: Record<EntityProfile["entityType"], number> = {
    enterprise: 0,
    use_case: 1,
    function: 2,
    process: 3,
    system: 4,
    data_domain: 5,
    infrastructure: 6,
    metric: 7,
    risk: 8,
    vendor: 9,
    contract: 10,
    program: 11,
  };
  return [...profiles].sort(
    (left, right) =>
      priority[left.entityType] - priority[right.entityType] ||
      right.confidence - left.confidence,
  );
}

function namesByType(
  profiles: EntityProfile[],
  entityType: EntityProfile["entityType"],
): string[] {
  return profiles
    .filter((profile) => profile.entityType === entityType)
    .map((profile) => profile.entityName);
}
