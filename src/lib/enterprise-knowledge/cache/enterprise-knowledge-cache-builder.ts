import { performance } from "node:perf_hooks";

import {
  assembleModuleContext,
  classifyContextIntent,
  resolveContextAssemblyInput,
  type ContextSourceCatalogEntry,
  type IntentClassification,
  type ResolvedContextAssemblyInput,
} from "../assembler";
import type {
  ContextPack,
  ModuleContextRequest,
  ModuleContextResponse,
} from "../contracts";
import { buildContextCacheKey, type ContextCacheKey } from "./context-cache-key";
import {
  buildContextCacheMetadata,
  type CacheTtlPolicy,
  type ContextCacheMetadata,
  type KnownGapSummary,
} from "./context-cache-metadata";
import {
  buildDeepContextPackCache,
  type DeepContextPackCache,
} from "./deep-context-pack-cache";
import {
  buildCachedEntityProfile,
  type CachedEntityProfile,
} from "./entity-profile-cache";
import {
  buildFastContextPackCache,
  type FastContextPackCache,
} from "./fast-context-pack-cache";
import {
  buildRelationshipSliceCache,
  type RelationshipSliceCache,
} from "./relationship-slice-cache";

export interface EnterpriseKnowledgeCacheBuildParams {
  request: ModuleContextRequest;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
  sourceVersion: string;
  contextVersion: string;
  cacheScope?: string;
  cacheTtlPolicy?: CacheTtlPolicy;
}

export interface EnterpriseKnowledgeCacheTimings {
  intentClassificationMs: number;
  contextResolutionMs: number;
  assemblyMs: number;
  entityProfileCacheMs: number;
  relationshipSliceCacheMs: number;
  fastContextPackCacheMs: number;
  deepContextPackCacheMs: number;
  totalMs: number;
}

export interface EnterpriseKnowledgeCacheBuildResult {
  request: ModuleContextRequest;
  intent: IntentClassification;
  resolution: ResolvedContextAssemblyInput["resolution"];
  response: ModuleContextResponse;
  entityProfileCache: CachedEntityProfile[];
  relationshipSliceCache: RelationshipSliceCache;
  fastContextPackCache: FastContextPackCache;
  deepContextPackCache: DeepContextPackCache;
  timings: EnterpriseKnowledgeCacheTimings;
  truthSplit: {
    cacheOnly: true;
    defaultActiveMode: boolean;
    candidatePreviewExplicitOnly: boolean;
    activeTenantAccessUpdated: false;
    productionTenantDataWritten: false;
    candidatePromoted: false;
    moduleRuntimeBehaviorChanged: false;
    claudeCalled: false;
  };
}

export function buildEnterpriseKnowledgeContextCaches(
  params: EnterpriseKnowledgeCacheBuildParams,
): EnterpriseKnowledgeCacheBuildResult {
  const totalStart = performance.now();

  const classifyStart = performance.now();
  const requestWithDefaultMode: ModuleContextRequest = {
    ...params.request,
    mode: params.request.mode ?? "active",
  };
  const intent = classifyContextIntent(requestWithDefaultMode);
  const intentClassificationMs = elapsed(classifyStart);

  const resolveStart = performance.now();
  const resolved = resolveContextAssemblyInput({
    request: requestWithDefaultMode,
    intent,
    catalog: params.catalog,
    generatedAt: params.generatedAt,
  });
  const contextResolutionMs = elapsed(resolveStart);

  const assemblyStart = performance.now();
  const response = assembleModuleContext(resolved);
  const assemblyMs = elapsed(assemblyStart);
  const pack = response.contextPack;
  assertTruthBoundary(pack);

  const cacheScope = params.cacheScope ?? `${pack.moduleKey}:${pack.purpose}`;
  const baseKey: ContextCacheKey = {
    tenantKey: pack.tenantKey,
    cacheScope,
    moduleKey: pack.moduleKey,
    mode: pack.mode,
    purpose: pack.purpose,
    requestedDomains: requestWithDefaultMode.requestedDomains,
    sourceVersion: params.sourceVersion,
    contextVersion: params.contextVersion,
  };

  const baseMetadata = metadataFor({
    key: baseKey,
    pack,
    generatedAt: params.generatedAt,
    ttlPolicy: params.cacheTtlPolicy,
  });

  const entityStart = performance.now();
  const entityProfileCache = pack.relevantEntityProfiles.map((profile) => {
    const key: ContextCacheKey = {
      ...baseKey,
      cacheScope: `${cacheScope}:entity-profile`,
      entityType: profile.entityType,
      entityName: profile.entityName,
    };
    return buildCachedEntityProfile({
      metadata: metadataFor({
        key,
        pack,
        generatedAt: params.generatedAt,
        ttlPolicy: params.cacheTtlPolicy,
      }),
      profile,
    });
  });
  const entityProfileCacheMs = elapsed(entityStart);

  const relationshipStart = performance.now();
  const relationshipKey: ContextCacheKey = {
    ...baseKey,
    cacheScope: `${cacheScope}:relationship-slice`,
    depth: 1,
  };
  const relationshipSliceCache = buildRelationshipSliceCache({
    metadata: metadataFor({
      key: relationshipKey,
      pack,
      generatedAt: params.generatedAt,
      ttlPolicy: params.cacheTtlPolicy,
    }),
    relationships: pack.relationships,
    relationshipCandidates: pack.relationshipCandidates,
    evidenceRefs: pack.evidence,
    depth: 1,
    relationshipPolicy: requestWithDefaultMode.relationshipPolicy,
    candidateActiveBoundary: pack.truthBoundary,
  });
  const relationshipSliceCacheMs = elapsed(relationshipStart);

  const fastStart = performance.now();
  const fastKey: ContextCacheKey = {
    ...baseKey,
    cacheScope: `${cacheScope}:fast-context-pack`,
  };
  const fastContextPackCache = buildFastContextPackCache({
    metadata: metadataFor({
      key: fastKey,
      pack,
      generatedAt: params.generatedAt,
      ttlPolicy: params.cacheTtlPolicy,
    }),
    pack,
  });
  const fastContextPackCacheMs = elapsed(fastStart);

  const deepStart = performance.now();
  const deepKey: ContextCacheKey = {
    ...baseKey,
    cacheScope: `${cacheScope}:deep-context-pack`,
    depth: 2,
  };
  const deepContextPackCache = buildDeepContextPackCache({
    metadata: metadataFor({
      key: deepKey,
      pack,
      generatedAt: params.generatedAt,
      ttlPolicy: params.cacheTtlPolicy,
    }),
    pack,
  });
  const deepContextPackCacheMs = elapsed(deepStart);

  return {
    request: requestWithDefaultMode,
    intent,
    resolution: resolved.resolution,
    response,
    entityProfileCache,
    relationshipSliceCache,
    fastContextPackCache,
    deepContextPackCache,
    timings: {
      intentClassificationMs,
      contextResolutionMs,
      assemblyMs,
      entityProfileCacheMs,
      relationshipSliceCacheMs,
      fastContextPackCacheMs,
      deepContextPackCacheMs,
      totalMs: elapsed(totalStart),
    },
    truthSplit: {
      cacheOnly: true,
      defaultActiveMode: requestWithDefaultMode.mode === "active",
      candidatePreviewExplicitOnly: requestWithDefaultMode.mode !== "candidate_preview",
      activeTenantAccessUpdated: false,
      productionTenantDataWritten: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
      claudeCalled: false,
    },
  };
}

function metadataFor(params: {
  key: ContextCacheKey;
  pack: ContextPack;
  generatedAt: string;
  ttlPolicy?: CacheTtlPolicy;
}): ContextCacheMetadata {
  const cacheKey = buildContextCacheKey(params.key);
  return buildContextCacheMetadata({
    cacheId: cacheId(cacheKey),
    cacheKey,
    key: params.key,
    generatedAt: params.generatedAt,
    evidence: params.pack.evidence,
    confidenceSummary: params.pack.confidenceSummary,
    knownGapSummary: summarizeGaps(params.pack),
    cacheTtlPolicy: params.ttlPolicy,
    assemblyTrace: params.pack.assemblyTrace,
  });
}

function summarizeGaps(pack: ContextPack): KnownGapSummary {
  return {
    total: pack.gaps.length,
    highSeverity: pack.gaps.filter((gap) => gap.severity === "blocker").length,
    blocksActivePromotion: pack.gaps.filter((gap) => gap.blocksActivePromotion).length,
    titles: pack.gaps.map((gap) => gap.title).slice(0, 10),
  };
}

function assertTruthBoundary(pack: ContextPack): void {
  if (pack.mode === "active" && pack.truthBoundary.candidateContextIncluded) {
    throw new Error(`${pack.contextPackId}: active cache build included candidate context`);
  }
  if (pack.claudeReadyContextPayload.unsupportedClaims.length > 0) {
    throw new Error(`${pack.contextPackId}: unsupported claims leaked into Claude-ready payload`);
  }
  if (
    pack.truthBoundary.activeTenantAccessUpdated ||
    pack.truthBoundary.productionTenantDataWritten ||
    pack.truthBoundary.candidatePromoted ||
    pack.truthBoundary.moduleRuntimeBehaviorChanged ||
    pack.truthBoundary.sourceAdapterRowsActive
  ) {
    throw new Error(`${pack.contextPackId}: destructive truth boundary flag changed`);
  }
}

function elapsed(start: number): number {
  return Math.round((performance.now() - start) * 100) / 100;
}

function cacheId(cacheKey: string): string {
  return `ek-cache-${cacheKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
