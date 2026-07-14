import type { EntityProfileType, RelationshipVerb } from "../contracts";
import type { EnterpriseKnowledgeCacheBuildResult } from "./enterprise-knowledge-cache-builder";

export interface EnterpriseKnowledgeCacheValidation {
  pass: boolean;
  failures: string[];
  assertions: {
    metadataComplete: boolean;
    entityProfilesCached: boolean;
    relationshipSliceCached: boolean;
    fastContextPackCached: boolean;
    deepContextPackCached: boolean;
    activeCandidateBoundaryHeld: boolean;
    unsupportedClaimsExcludedFromClaudePayload: boolean;
    timingCaptured: boolean;
    requiredEntityTypesObserved: EntityProfileType[];
    relationshipTypesObserved: RelationshipVerb[];
  };
}

const REQUIRED_ENTITY_TYPES: EntityProfileType[] = [
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
];

export function validateEnterpriseKnowledgeCacheResults(
  results: EnterpriseKnowledgeCacheBuildResult[],
): EnterpriseKnowledgeCacheValidation {
  const failures: string[] = [];
  const entityTypesObserved = new Set<EntityProfileType>();
  const relationshipTypesObserved = new Set<RelationshipVerb>();

  for (const result of results) {
    const label = `${result.response.contextPack.tenantKey}/${result.response.contextPack.moduleKey}/${result.response.contextPack.purpose}`;
    for (const cached of result.entityProfileCache) {
      entityTypesObserved.add(cached.profile.entityType);
      if (!metadataComplete(cached.metadata)) {
        failures.push(`${label}: incomplete entity profile cache metadata for ${cached.profile.profileId}`);
      }
    }
    for (const edge of [
      ...result.relationshipSliceCache.relationships,
      ...result.relationshipSliceCache.relationshipCandidates,
    ]) {
      relationshipTypesObserved.add(edge.relationshipType);
    }
    if (result.entityProfileCache.length === 0) failures.push(`${label}: no entity profile cache rows`);
    if (!metadataComplete(result.relationshipSliceCache.metadata)) {
      failures.push(`${label}: incomplete relationship slice cache metadata`);
    }
    if (result.relationshipSliceCache.relationshipCandidates.length === 0) {
      failures.push(`${label}: relationship slice did not preserve candidate edges`);
    }
    if (!metadataComplete(result.fastContextPackCache.metadata)) {
      failures.push(`${label}: incomplete fast context pack cache metadata`);
    }
    if (!metadataComplete(result.deepContextPackCache.metadata)) {
      failures.push(`${label}: incomplete deep context pack cache metadata`);
    }
    if (!result.fastContextPackCache.claudeReadyContextPayload.excludesAuditOnlyDiagnostics) {
      failures.push(`${label}: fast cache Claude-ready payload includes audit diagnostics`);
    }
    if (result.fastContextPackCache.claudeReadyContextPayload.unsupportedClaims.length > 0) {
      failures.push(`${label}: unsupported claims leaked into fast Claude-ready payload`);
    }
    if (!result.deepContextPackCache.claudeReadyContextPayloadReadyContent.unsupportedClaimsExcluded) {
      failures.push(`${label}: unsupported claims leaked into deep Claude-ready payload`);
    }
    if (
      result.response.contextPack.mode === "active" &&
      result.response.contextPack.truthBoundary.candidateContextIncluded
    ) {
      failures.push(`${label}: active cache included candidate context`);
    }
    if (
      result.response.contextPack.truthBoundary.activeTenantAccessUpdated ||
      result.response.contextPack.truthBoundary.productionTenantDataWritten ||
      result.response.contextPack.truthBoundary.candidatePromoted ||
      result.response.contextPack.truthBoundary.moduleRuntimeBehaviorChanged
    ) {
      failures.push(`${label}: destructive truth boundary changed`);
    }
    if (result.timings.totalMs < 0 || result.timings.fastContextPackCacheMs < 0) {
      failures.push(`${label}: invalid timing data`);
    }
  }

  const missingEntityTypes = REQUIRED_ENTITY_TYPES.filter((type) => !entityTypesObserved.has(type));
  if (missingEntityTypes.length > 0) {
    failures.push(`Missing required entity types across cache proof: ${missingEntityTypes.join(", ")}`);
  }
  if (relationshipTypesObserved.size === 0) {
    failures.push("No relationship types observed across cache proof");
  }

  return {
    pass: failures.length === 0,
    failures,
    assertions: {
      metadataComplete: failures.every((failure) => !failure.includes("incomplete")),
      entityProfilesCached: results.every((result) => result.entityProfileCache.length > 0),
      relationshipSliceCached: results.every(
        (result) => result.relationshipSliceCache.relationshipCandidates.length > 0,
      ),
      fastContextPackCached: results.every(
        (result) => result.fastContextPackCache.topEntityProfiles.length > 0,
      ),
      deepContextPackCached: results.every(
        (result) => result.deepContextPackCache.contextPack.relevantEntityProfiles.length > 0,
      ),
      activeCandidateBoundaryHeld: failures.every(
        (failure) => !failure.includes("candidate context") && !failure.includes("destructive"),
      ),
      unsupportedClaimsExcludedFromClaudePayload: failures.every(
        (failure) => !failure.includes("unsupported claims leaked"),
      ),
      timingCaptured: results.every((result) => result.timings.totalMs >= 0),
      requiredEntityTypesObserved: Array.from(entityTypesObserved).sort(),
      relationshipTypesObserved: Array.from(relationshipTypesObserved).sort(),
    },
  };
}

function metadataComplete(metadata: {
  tenantKey: string;
  cacheScope: string;
  cacheKey: string;
  sourceVersion: string;
  contextVersion: string;
  generatedAt: string;
  sourceEvidenceRefs: string[];
  assemblyTraceRef: string;
}): boolean {
  return Boolean(
    metadata.tenantKey &&
      metadata.cacheScope &&
      metadata.cacheKey &&
      metadata.sourceVersion &&
      metadata.contextVersion &&
      metadata.generatedAt &&
      metadata.sourceEvidenceRefs.length > 0 &&
      metadata.assemblyTraceRef,
  );
}
