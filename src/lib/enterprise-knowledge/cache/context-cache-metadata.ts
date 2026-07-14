import type {
  ContextAssemblyTrace,
  ContextConfidenceSummary,
  ContextPackMode,
  EvidenceRef,
  KnowledgeModuleKey,
} from "../contracts";
import type { ContextCacheKey } from "./context-cache-key";

export type CacheTtlPolicy = "fixture_static" | "active_short_lived" | "candidate_review" | "manual_invalidation";

export interface KnownGapSummary {
  total: number;
  highSeverity: number;
  blocksActivePromotion: number;
  titles: string[];
}

export interface ContextCacheMetadata {
  cacheId: string;
  cacheKey: string;
  cacheScope: string;
  tenantKey: string;
  moduleKey?: KnowledgeModuleKey;
  activeOrCandidateMode: ContextPackMode;
  sourceVersion: string;
  contextVersion: string;
  generatedAt: string;
  sourceEvidenceRefs: string[];
  confidenceSummary: ContextConfidenceSummary;
  knownGapSummary: KnownGapSummary;
  cacheTtlPolicy: CacheTtlPolicy;
  invalidationReason?: string;
  assemblyTraceRef: string;
  assemblyTrace: ContextAssemblyTrace;
}

export function buildContextCacheMetadata(params: {
  cacheId: string;
  cacheKey: string;
  key: ContextCacheKey;
  generatedAt: string;
  evidence: EvidenceRef[];
  confidenceSummary: ContextConfidenceSummary;
  knownGapSummary: KnownGapSummary;
  cacheTtlPolicy?: CacheTtlPolicy;
  invalidationReason?: string;
  assemblyTrace: ContextAssemblyTrace;
}): ContextCacheMetadata {
  return {
    cacheId: params.cacheId,
    cacheKey: params.cacheKey,
    cacheScope: params.key.cacheScope,
    tenantKey: params.key.tenantKey,
    moduleKey: params.key.moduleKey,
    activeOrCandidateMode: params.key.mode,
    sourceVersion: params.key.sourceVersion,
    contextVersion: params.key.contextVersion,
    generatedAt: params.generatedAt,
    sourceEvidenceRefs: params.evidence.map((item) => item.evidenceId),
    confidenceSummary: params.confidenceSummary,
    knownGapSummary: params.knownGapSummary,
    cacheTtlPolicy: params.cacheTtlPolicy ?? "fixture_static",
    invalidationReason: params.invalidationReason,
    assemblyTraceRef: params.assemblyTrace.assemblerVersion,
    assemblyTrace: params.assemblyTrace,
  };
}
