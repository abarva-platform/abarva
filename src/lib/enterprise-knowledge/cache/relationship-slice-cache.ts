import type { CandidateTruthBoundary, EvidenceRef, RelationshipEdge } from "../contracts";
import type { ContextCacheMetadata } from "./context-cache-metadata";

export interface RelationshipSliceCache {
  metadata: ContextCacheMetadata;
  traversal: {
    rootEntityId?: string;
    rootEntityType?: string;
    depth: number;
    requestedRelationshipPolicy: string;
  };
  relationships: RelationshipEdge[];
  relationshipCandidates: RelationshipEdge[];
  evidenceRefs: EvidenceRef[];
  relationshipTypeCounts: Record<string, number>;
  readinessCounts: Record<string, number>;
  candidateActiveBoundary: CandidateTruthBoundary;
}

export function buildRelationshipSliceCache(params: {
  metadata: ContextCacheMetadata;
  relationships: RelationshipEdge[];
  relationshipCandidates: RelationshipEdge[];
  evidenceRefs: EvidenceRef[];
  depth?: number;
  relationshipPolicy: string;
  candidateActiveBoundary: CandidateTruthBoundary;
}): RelationshipSliceCache {
  const firstEdge = params.relationshipCandidates[0] ?? params.relationships[0];
  const allEdges = [...params.relationships, ...params.relationshipCandidates];
  return {
    metadata: params.metadata,
    traversal: {
      rootEntityId: firstEdge?.sourceEntityId,
      rootEntityType: firstEdge?.sourceEntityType,
      depth: params.depth ?? 1,
      requestedRelationshipPolicy: params.relationshipPolicy,
    },
    relationships: params.relationships,
    relationshipCandidates: params.relationshipCandidates,
    evidenceRefs: params.evidenceRefs,
    relationshipTypeCounts: countBy(allEdges, (edge) => edge.relationshipType),
    readinessCounts: countBy(allEdges, (edge) => edge.readiness),
    candidateActiveBoundary: params.candidateActiveBoundary,
  };
}

function countBy<T>(items: T[], selector: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
