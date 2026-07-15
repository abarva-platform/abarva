import type { ContextSourceCatalogEntry } from "../assembler";
import {
  buildEnterpriseKnowledgeContextCaches,
  type EnterpriseKnowledgeCacheBuildResult,
} from "../cache";
import type {
  EntityProfile,
  EntityProfileType,
  HomeKnowledgePack,
  ModuleContextRequest,
  RequestedKnowledgeDomain,
} from "../contracts";

export const HOME_KNOWLEDGE_PREVIEW_FLAG = "ENABLE_KNOWLEDGE_LAYER_HOME_PREVIEW";

export const HOME_PREVIEW_REQUESTED_DOMAINS = [
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

export const HOME_PREVIEW_REQUIRED_PROFILE_TYPES = [
  "enterprise",
  "function",
  "system",
  "data_domain",
  "infrastructure",
  "vendor",
  "contract",
  "program",
  "risk",
  "metric",
  "use_case",
  "process",
] as const satisfies EntityProfileType[];

export interface HomeKnowledgePreviewInput {
  tenantKey: string;
  previewId: string;
  question: string;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
  sourceVersion: string;
  contextVersion: string;
  focusEntities?: string[];
  env?: Record<string, string | undefined>;
}

export interface HomeKnowledgePreviewGuardrails {
  featureFlagRequired: true;
  defaultEnabled: false;
  defaultHomeBehaviorChanged: false;
  previewOnly: true;
  routeOrNavigationChanged: false;
  claudeCalled: false;
  tenantDataWritten: false;
  activeTenantAccessUpdated: false;
  candidatePromoted: false;
  productionTenantDataWritten: false;
  moduleRuntimeBehaviorChanged: false;
  diagnosticsSecondary: true;
}

export interface HomeKnowledgeProfileCard {
  profileId: string;
  profileType: EntityProfileType;
  title: string;
  businessMeaning: string;
  currentStateSummary: string;
  targetStateDirection: string;
  relatedFunctions: string[];
  relatedSystems: string[];
  relatedDataDomains: string[];
  relatedInfrastructure: string[];
  relatedVendorsContracts: string[];
  relatedSpend: string[];
  relatedPrograms: string[];
  relatedRisksControls: string[];
  relatedMetricsOutcomes: string[];
  relatedUseCases: string[];
  evidenceRefs: string[];
  confidence: number;
  knownGaps: string[];
  caveats: string[];
  activeVsCandidateStatus: string;
  sourceLineage: string[];
  asOfDate: string;
  moduleReadiness: string;
}

export interface HomeKnowledgeSurface {
  surfaceVersion: "home-knowledge-surface/v1";
  previewId: string;
  tenantKey: string;
  generatedAt: string;
  sections: {
    enterpriseBrief: {
      headline: string;
      narrative: string;
      whyItMatters: string;
    };
    contextConfidence: {
      summary: string;
      evidencePosture: string;
      relationshipDepth: string;
      safeToAnswer: string[];
      doNotInferYet: string[];
    };
    whatAbarvaKnows: string[];
    keyRelationships: string[];
    readyAreas: string[];
    importantGaps: string[];
    evidenceCoverage: {
      summary: string;
      sourceLabels: string[];
      citableEvidenceRefs: string[];
    };
    doubleClickProfiles: HomeKnowledgeProfileCard[];
    recommendedNextEvidence: string[];
  };
  collapsedTechnicalDiagnostics: {
    cacheIds: {
      fastContextPackCacheId: string;
      deepContextPackCacheId: string;
      relationshipSliceCacheId: string;
    };
    counts: {
      profiles: number;
      relationshipCandidates: number;
      evidenceRefs: number;
      gaps: number;
    };
    assemblyInputSources: string[];
  };
  guardrails: HomeKnowledgePreviewGuardrails;
}

export interface DisabledHomeKnowledgePreview {
  resultVersion: "home-knowledge-preview/v1";
  status: "disabled";
  requiredFlag: typeof HOME_KNOWLEDGE_PREVIEW_FLAG;
  generatedAt: string;
  reason: string;
  existingHomeBehaviorUnchanged: true;
  guardrails: HomeKnowledgePreviewGuardrails;
}

export interface EnabledHomeKnowledgePreview {
  resultVersion: "home-knowledge-preview/v1";
  status: "enabled";
  requiredFlag: typeof HOME_KNOWLEDGE_PREVIEW_FLAG;
  generatedAt: string;
  request: ModuleContextRequest;
  cacheBuild: EnterpriseKnowledgeCacheBuildResult;
  homeKnowledgePack: HomeKnowledgePack;
  surface: HomeKnowledgeSurface;
  guardrails: HomeKnowledgePreviewGuardrails;
}

export type HomeKnowledgePreviewResult =
  | DisabledHomeKnowledgePreview
  | EnabledHomeKnowledgePreview;

export function isHomeKnowledgePreviewEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[HOME_KNOWLEDGE_PREVIEW_FLAG] === "true";
}

export function buildHomeKnowledgePreview(
  input: HomeKnowledgePreviewInput,
): HomeKnowledgePreviewResult {
  if (!isHomeKnowledgePreviewEnabled(input.env)) {
    return {
      resultVersion: "home-knowledge-preview/v1",
      status: "disabled",
      requiredFlag: HOME_KNOWLEDGE_PREVIEW_FLAG,
      generatedAt: input.generatedAt,
      reason: `${HOME_KNOWLEDGE_PREVIEW_FLAG} is not explicitly true.`,
      existingHomeBehaviorUnchanged: true,
      guardrails: homePreviewGuardrails(),
    };
  }

  const request = buildHomePreviewRequest(input);
  const cacheBuild = buildEnterpriseKnowledgeContextCaches({
    request,
    catalog: input.catalog,
    generatedAt: input.generatedAt,
    sourceVersion: input.sourceVersion,
    contextVersion: input.contextVersion,
    cacheScope: `home-knowledge-preview:${input.tenantKey}:${input.previewId}`,
    cacheTtlPolicy: "fixture_static",
  });
  const homeKnowledgePack = cacheBuild.response.contextPack as HomeKnowledgePack;
  const surface = buildSurface({
    input,
    cacheBuild,
    pack: homeKnowledgePack,
  });

  return {
    resultVersion: "home-knowledge-preview/v1",
    status: "enabled",
    requiredFlag: HOME_KNOWLEDGE_PREVIEW_FLAG,
    generatedAt: input.generatedAt,
    request: cacheBuild.request,
    cacheBuild,
    homeKnowledgePack,
    surface,
    guardrails: homePreviewGuardrails(),
  };
}

function buildHomePreviewRequest(input: HomeKnowledgePreviewInput): ModuleContextRequest {
  return {
    tenantKey: input.tenantKey,
    moduleKey: "home",
    purpose: "executive_orientation",
    mode: "active",
    requestedDomains: [...HOME_PREVIEW_REQUESTED_DOMAINS],
    scope: {
      question: input.question,
      useCase: input.question,
      requiredEvidenceFamilies: input.focusEntities,
    },
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidate",
    actorKey: "home-knowledge-preview",
  };
}

function buildSurface(params: {
  input: HomeKnowledgePreviewInput;
  cacheBuild: EnterpriseKnowledgeCacheBuildResult;
  pack: HomeKnowledgePack;
}): HomeKnowledgeSurface {
  const pack = params.pack;
  const profiles = orderProfiles(pack.relevantEntityProfiles);
  const profileCards = profiles.map((profile) => profileCard(profile));
  const relationshipExamples = pack.relationshipCandidates
    .slice(0, 8)
    .map((edge) => edge.businessMeaning);
  const citableEvidenceRefs = pack.evidence
    .filter((ref) => ref.citationStatus === "citable")
    .map((ref) => ref.evidenceId);
  const sourceLabels = Array.from(new Set(pack.evidence.map((ref) => ref.sourceLabel)));

  return {
    surfaceVersion: "home-knowledge-surface/v1",
    previewId: params.input.previewId,
    tenantKey: params.input.tenantKey,
    generatedAt: params.input.generatedAt,
    sections: {
      enterpriseBrief: {
        headline: headlineFor(pack),
        narrative: narrativeFor(pack),
        whyItMatters:
          "This gives leaders an orientation layer before they ask Intelligence, Moves, Source, or Tower to make decisions from the enterprise context.",
      },
      contextConfidence: {
        summary:
          "AbarVa has source-backed context across the major enterprise dimensions. This is strong enough for enterprise orientation and fact-based questions. Relationship depth and measured outcomes still need validation before cross-domain dependency reasoning, sourcing savings, or Tower value claims.",
        evidencePosture: `${pack.evidence.length} evidence references support this preview, with source lineage available in profile drill-downs.`,
        relationshipDepth:
          pack.relationshipCandidates.length > 0
            ? "Relationship candidates are visible for review, but should be validated before being treated as dependency truth."
            : "Relationship depth is limited; collect and validate cross-domain links before dependency claims.",
        safeToAnswer: [
          "what context is loaded for this enterprise",
          "which functions, systems, data domains, vendors, programs, risks, and metrics are visible",
          "which evidence supports the visible profile cards",
          "which gaps should be addressed next",
        ],
        doNotInferYet: [
          "realized value or savings",
          "full enterprise dependency map",
          "contract optimization outcomes",
          "Tower outcome performance",
        ],
      },
      whatAbarvaKnows: [
        pack.executiveSummary,
        ...profiles.slice(0, 8).map((profile) => profile.businessMeaning),
      ],
      keyRelationships: relationshipExamples,
      readyAreas: readyAreas(profiles),
      importantGaps: pack.gaps.map((gap) => `${gap.title}: ${gap.description}`),
      evidenceCoverage: {
        summary: `Evidence is available for ${sourceLabels.length} source groups. Profile drill-down keeps source lineage available without making the executive view diagnostic-first.`,
        sourceLabels,
        citableEvidenceRefs,
      },
      doubleClickProfiles: profileCards,
      recommendedNextEvidence: pack.recommendedNextEvidence,
    },
    collapsedTechnicalDiagnostics: {
      cacheIds: {
        fastContextPackCacheId: params.cacheBuild.fastContextPackCache.metadata.cacheId,
        deepContextPackCacheId: params.cacheBuild.deepContextPackCache.metadata.cacheId,
        relationshipSliceCacheId: params.cacheBuild.relationshipSliceCache.metadata.cacheId,
      },
      counts: {
        profiles: profiles.length,
        relationshipCandidates: pack.relationshipCandidates.length,
        evidenceRefs: pack.evidence.length,
        gaps: pack.gaps.length,
      },
      assemblyInputSources: pack.assemblyTrace.inputSources,
    },
    guardrails: homePreviewGuardrails(),
  };
}

function profileCard(profile: EntityProfile): HomeKnowledgeProfileCard {
  return {
    profileId: profile.profileId,
    profileType: profile.entityType,
    title: profile.entityName,
    businessMeaning: profile.businessMeaning,
    currentStateSummary: `${profile.entityName} is represented in the enterprise context with source-backed evidence and review caveats.`,
    targetStateDirection:
      profile.targetStateDirection ??
      "Validate relationships, owners, and metrics before treating this as board-grade decision context.",
    relatedFunctions: profile.relatedFunctions,
    relatedSystems: profile.relatedSystems,
    relatedDataDomains: profile.relatedDataDomains,
    relatedInfrastructure: profile.relatedInfrastructure,
    relatedVendorsContracts: profile.relatedVendorsContracts,
    relatedSpend: profile.relatedSpend,
    relatedPrograms: profile.relatedPrograms,
    relatedRisksControls: profile.relatedRisksControls,
    relatedMetricsOutcomes: profile.relatedMetricsOutcomes,
    relatedUseCases: profile.relatedUseCases,
    evidenceRefs: profile.evidenceRefs.map((ref) => ref.evidenceId),
    confidence: profile.confidence,
    knownGaps: profile.knownGaps.map((gap) => gap.title),
    caveats: profile.caveats,
    activeVsCandidateStatus: profile.truthStatus,
    sourceLineage: profile.sourceLineage,
    asOfDate: profile.asOfDate ?? "not provided",
    moduleReadiness: profile.moduleReadiness,
  };
}

function headlineFor(pack: HomeKnowledgePack): string {
  const enterprise = pack.relevantEntityProfiles.find((profile) => profile.entityType === "enterprise");
  if (enterprise) return `What AbarVa knows about ${enterprise.entityName}`;
  return "What AbarVa knows about this enterprise";
}

function narrativeFor(pack: HomeKnowledgePack): string {
  const functions = namesByType(pack.relevantEntityProfiles, "function").slice(0, 3);
  const systems = namesByType(pack.relevantEntityProfiles, "system").slice(0, 4);
  const dataDomains = namesByType(pack.relevantEntityProfiles, "data_domain").slice(0, 4);
  const risks = namesByType(pack.relevantEntityProfiles, "risk").slice(0, 3);
  return [
    functions.length ? `Business focus: ${functions.join(", ")}.` : "",
    systems.length ? `Technology context: ${systems.join(", ")}.` : "",
    dataDomains.length ? `Data context: ${dataDomains.join(", ")}.` : "",
    risks.length ? `Control context: ${risks.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function readyAreas(profiles: EntityProfile[]): string[] {
  const byType = HOME_PREVIEW_REQUIRED_PROFILE_TYPES
    .map((type) => ({
      type,
      count: profiles.filter((profile) => profile.entityType === type).length,
    }))
    .filter((item) => item.count > 0);
  return byType.map((item) => `${labelProfileType(item.type)}: ${item.count} profile${item.count === 1 ? "" : "s"}`);
}

function orderProfiles(profiles: EntityProfile[]): EntityProfile[] {
  const typeRank = new Map<EntityProfileType, number>(
    HOME_PREVIEW_REQUIRED_PROFILE_TYPES.map((type, index) => [type, index]),
  );
  return [...profiles].sort((left, right) => {
    const leftRank = typeRank.get(left.entityType) ?? 99;
    const rightRank = typeRank.get(right.entityType) ?? 99;
    return leftRank - rightRank || left.entityName.localeCompare(right.entityName);
  });
}

function namesByType(profiles: EntityProfile[], type: EntityProfileType): string[] {
  return profiles
    .filter((profile) => profile.entityType === type)
    .map((profile) => profile.entityName);
}

function labelProfileType(type: EntityProfileType): string {
  return type
    .replace("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function homePreviewGuardrails(): HomeKnowledgePreviewGuardrails {
  return {
    featureFlagRequired: true,
    defaultEnabled: false,
    defaultHomeBehaviorChanged: false,
    previewOnly: true,
    routeOrNavigationChanged: false,
    claudeCalled: false,
    tenantDataWritten: false,
    activeTenantAccessUpdated: false,
    candidatePromoted: false,
    productionTenantDataWritten: false,
    moduleRuntimeBehaviorChanged: false,
    diagnosticsSecondary: true,
  };
}
