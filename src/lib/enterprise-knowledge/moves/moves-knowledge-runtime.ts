import type { ContextSourceCatalogEntry } from "../assembler";
import {
  buildEnterpriseKnowledgeContextCaches,
  type EnterpriseKnowledgeCacheBuildResult,
} from "../cache";
import type {
  ClaudeReadyContextPayload,
  EntityProfile,
  ModuleContextRequest,
  ModuleContextScope,
  MovesContextPack,
  RequestedKnowledgeDomain,
} from "../contracts";
import {
  buildMovesPhaseSections,
  type MovesPhasePackSections,
} from "./moves-context-pack-dry-run";

export const MOVES_KNOWLEDGE_RUNTIME_FLAG = "ENABLE_KNOWLEDGE_LAYER_MOVES_RUNTIME";

export const MOVES_RUNTIME_SUPPORTED_PHASES = [
  "P0",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
] as const satisfies NonNullable<ModuleContextScope["phase"]>[];

export type MovesRuntimePhase = (typeof MOVES_RUNTIME_SUPPORTED_PHASES)[number];

export const MOVES_RUNTIME_REQUESTED_DOMAINS = [
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
] as const satisfies RequestedKnowledgeDomain[];

export interface MovesKnowledgeRuntimeInput {
  tenantKey: string;
  moveId: string;
  phase: MovesRuntimePhase;
  question: string;
  moveName?: string;
  useCaseArchetype?: string;
  knownEntities?: string[];
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
  sourceVersion: string;
  contextVersion: string;
  env?: Record<string, string | undefined>;
}

export interface MovesKnowledgeRuntimeGuardrails {
  featureFlagRequired: true;
  defaultEnabled: false;
  defaultMovesBehaviorChanged: false;
  runtimePathChangedOnlyWhenFlagEnabled: true;
  createsReviewablePreviewArtifactOnlyWhenEnabled: true;
  claudeCalled: false;
  tenantDataWritten: false;
  activeTenantAccessUpdated: false;
  candidatePromoted: false;
  productionTenantDataWritten: false;
  moduleReadsCandidateByDefault: false;
  sourceAdapterRowsActive: false;
  realizedValueClaimsBlocked: true;
}

export interface DisabledMovesKnowledgeRuntimeResult {
  resultVersion: "moves-knowledge-runtime/v1";
  status: "disabled";
  requiredFlag: typeof MOVES_KNOWLEDGE_RUNTIME_FLAG;
  generatedAt: string;
  reason: string;
  existingMovesBehaviorUnchanged: true;
  supportedPhases: readonly MovesRuntimePhase[];
  guardrails: MovesKnowledgeRuntimeGuardrails;
}

export interface KnowledgeContextPreviewArtifact {
  artifactType: "knowledge_context_preview";
  artifactFamily: "moves_knowledge_context_preview";
  artifactId: string;
  artifactTitle: string;
  generatedAt: string;
  tenantKey: string;
  moveId: string;
  phase: MovesRuntimePhase;
  phaseLabel: MovesContextPack["phase"];
  overwritePolicy: "append_only_no_silent_overwrite";
  reviewRequiredBeforeAttachment: true;
  normalUserSections: {
    whatAbarvaKnows: string[];
    relevantFunctions: string[];
    relevantSystems: string[];
    relevantDataDomains: string[];
    relevantInfrastructure: string[];
    relevantVendorsContracts: string[];
    relevantMetrics: string[];
    relevantRisksControls: string[];
    evidenceRefs: string[];
    confidenceSummary: string;
    knownGaps: string[];
    unsupportedClaims: string[];
    recommendedNextEvidence: string[];
    candidateAndSourceAdapterBoundary: string[];
  };
  claudeReadyContextPayload: ClaudeReadyContextPayload;
  debugOnlyDiagnostics: {
    cacheIds: {
      fastContextPackCacheId: string;
      deepContextPackCacheId: string;
      relationshipSliceCacheId: string;
    };
    assemblyTrace: MovesContextPack["assemblyTrace"];
    sourceLineage: string[];
  };
}

export interface EnabledMovesKnowledgeRuntimeResult {
  resultVersion: "moves-knowledge-runtime/v1";
  status: "enabled";
  requiredFlag: typeof MOVES_KNOWLEDGE_RUNTIME_FLAG;
  generatedAt: string;
  request: ModuleContextRequest;
  cacheBuild: EnterpriseKnowledgeCacheBuildResult;
  movesContextPack: MovesContextPack;
  phaseSections: MovesPhasePackSections;
  knowledgeContextPreviewArtifact: KnowledgeContextPreviewArtifact;
  generationInputPatchWhenEnabled: {
    includeClaudeReadyContextPayload: true;
    claudeReadyContextPayloadPreparedButNotSentByAudit: true;
    contextPreviewArtifactId: string;
  };
  supportedPhases: readonly MovesRuntimePhase[];
  guardrails: MovesKnowledgeRuntimeGuardrails;
}

export type MovesKnowledgeRuntimeResult =
  | DisabledMovesKnowledgeRuntimeResult
  | EnabledMovesKnowledgeRuntimeResult;

export function isMovesKnowledgeRuntimeEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[MOVES_KNOWLEDGE_RUNTIME_FLAG] === "true";
}

export function buildMovesKnowledgeRuntimeContext(
  input: MovesKnowledgeRuntimeInput,
): MovesKnowledgeRuntimeResult {
  if (!MOVES_RUNTIME_SUPPORTED_PHASES.includes(input.phase)) {
    throw new Error(`Unsupported Moves phase for knowledge runtime: ${input.phase}`);
  }

  if (!isMovesKnowledgeRuntimeEnabled(input.env)) {
    return {
      resultVersion: "moves-knowledge-runtime/v1",
      status: "disabled",
      requiredFlag: MOVES_KNOWLEDGE_RUNTIME_FLAG,
      generatedAt: input.generatedAt,
      reason: `${MOVES_KNOWLEDGE_RUNTIME_FLAG} is not explicitly true.`,
      existingMovesBehaviorUnchanged: true,
      supportedPhases: MOVES_RUNTIME_SUPPORTED_PHASES,
      guardrails: movesRuntimeGuardrails(),
    };
  }

  const request = buildMovesRuntimeRequest(input);
  const cacheBuild = buildEnterpriseKnowledgeContextCaches({
    request,
    catalog: input.catalog,
    generatedAt: input.generatedAt,
    sourceVersion: input.sourceVersion,
    contextVersion: input.contextVersion,
    cacheScope: `moves-runtime:${input.tenantKey}:${input.moveId}:${input.phase}`,
    cacheTtlPolicy: "fixture_static",
  });
  const movesContextPack = cacheBuild.response.contextPack as MovesContextPack;
  const phaseSections = buildMovesPhaseSections(movesContextPack, input.phase);
  const knowledgeContextPreviewArtifact = buildKnowledgeContextPreviewArtifact({
    input,
    cacheBuild,
    pack: movesContextPack,
    phaseSections,
  });

  return {
    resultVersion: "moves-knowledge-runtime/v1",
    status: "enabled",
    requiredFlag: MOVES_KNOWLEDGE_RUNTIME_FLAG,
    generatedAt: input.generatedAt,
    request: cacheBuild.request,
    cacheBuild,
    movesContextPack,
    phaseSections,
    knowledgeContextPreviewArtifact,
    generationInputPatchWhenEnabled: {
      includeClaudeReadyContextPayload: true,
      claudeReadyContextPayloadPreparedButNotSentByAudit: true,
      contextPreviewArtifactId: knowledgeContextPreviewArtifact.artifactId,
    },
    supportedPhases: MOVES_RUNTIME_SUPPORTED_PHASES,
    guardrails: movesRuntimeGuardrails(),
  };
}

function buildMovesRuntimeRequest(input: MovesKnowledgeRuntimeInput): ModuleContextRequest {
  return {
    tenantKey: input.tenantKey,
    moduleKey: "moves",
    purpose: "phase_readiness",
    mode: "active",
    requestedDomains: [...MOVES_RUNTIME_REQUESTED_DOMAINS],
    scope: {
      moveId: input.moveId,
      phase: input.phase,
      question: input.question,
      useCase: input.useCaseArchetype ?? input.question,
      requiredEvidenceFamilies: input.knownEntities,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "moves-knowledge-runtime",
  };
}

function buildKnowledgeContextPreviewArtifact(params: {
  input: MovesKnowledgeRuntimeInput;
  cacheBuild: EnterpriseKnowledgeCacheBuildResult;
  pack: MovesContextPack;
  phaseSections: MovesPhasePackSections;
}): KnowledgeContextPreviewArtifact {
  const artifactId = [
    params.input.tenantKey,
    params.input.moveId,
    params.input.phase,
    "knowledge-context-preview",
  ]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const pack = params.pack;
  const phaseSections = params.phaseSections;
  const infrastructure = namesByType(pack.relevantEntityProfiles, "infrastructure");

  return {
    artifactType: "knowledge_context_preview",
    artifactFamily: "moves_knowledge_context_preview",
    artifactId,
    artifactTitle: `Knowledge Context Preview - ${pack.phase}`,
    generatedAt: params.input.generatedAt,
    tenantKey: params.input.tenantKey,
    moveId: params.input.moveId,
    phase: params.input.phase,
    phaseLabel: pack.phase,
    overwritePolicy: "append_only_no_silent_overwrite",
    reviewRequiredBeforeAttachment: true,
    normalUserSections: {
      whatAbarvaKnows: [
        `Move question: ${params.input.question}`,
        pack.executiveSummary,
        ...pack.relevantEntityProfiles.slice(0, 5).map((profile) => profile.businessMeaning),
      ],
      relevantFunctions: phaseSections.impactedFunctions,
      relevantSystems: phaseSections.relevantSystems,
      relevantDataDomains: phaseSections.dataDomains,
      relevantInfrastructure: infrastructure,
      relevantVendorsContracts: phaseSections.vendorAndSpendContext,
      relevantMetrics: phaseSections.baselineCandidates,
      relevantRisksControls: phaseSections.risksAndControls,
      evidenceRefs: phaseSections.evidenceRefs,
      confidenceSummary: `${pack.confidenceSummary.overall}: ${pack.confidenceSummary.rationale}`,
      knownGaps: pack.gaps.map((gap) => `${gap.title}: ${gap.description}`),
      unsupportedClaims: pack.unsupportedClaims.map((claim) => claim.description),
      recommendedNextEvidence: phaseSections.nextEvidence,
      candidateAndSourceAdapterBoundary: [
        `candidatePreviewExplicitlyRequested=${pack.truthBoundary.candidatePreviewExplicitlyRequested}`,
        `candidateContextIncluded=${pack.truthBoundary.candidateContextIncluded}`,
        `sourceAdapterRowsActive=${pack.truthBoundary.sourceAdapterRowsActive}`,
        `activeTenantAccessUpdated=${pack.truthBoundary.activeTenantAccessUpdated}`,
        `productionTenantDataWritten=${pack.truthBoundary.productionTenantDataWritten}`,
        `candidatePromoted=${pack.truthBoundary.candidatePromoted}`,
      ],
    },
    claudeReadyContextPayload: pack.claudeReadyContextPayload,
    debugOnlyDiagnostics: {
      cacheIds: {
        fastContextPackCacheId: params.cacheBuild.fastContextPackCache.metadata.cacheId,
        deepContextPackCacheId: params.cacheBuild.deepContextPackCache.metadata.cacheId,
        relationshipSliceCacheId: params.cacheBuild.relationshipSliceCache.metadata.cacheId,
      },
      assemblyTrace: pack.assemblyTrace,
      sourceLineage: params.cacheBuild.deepContextPackCache.evidenceAndLineage.sourceLineage,
    },
  };
}

function namesByType(
  profiles: EntityProfile[],
  entityType: EntityProfile["entityType"],
): string[] {
  return profiles
    .filter((profile) => profile.entityType === entityType)
    .map((profile) => profile.entityName);
}

function movesRuntimeGuardrails(): MovesKnowledgeRuntimeGuardrails {
  return {
    featureFlagRequired: true,
    defaultEnabled: false,
    defaultMovesBehaviorChanged: false,
    runtimePathChangedOnlyWhenFlagEnabled: true,
    createsReviewablePreviewArtifactOnlyWhenEnabled: true,
    claudeCalled: false,
    tenantDataWritten: false,
    activeTenantAccessUpdated: false,
    candidatePromoted: false,
    productionTenantDataWritten: false,
    moduleReadsCandidateByDefault: false,
    sourceAdapterRowsActive: false,
    realizedValueClaimsBlocked: true,
  };
}
