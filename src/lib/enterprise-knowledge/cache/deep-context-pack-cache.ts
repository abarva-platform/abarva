import type { ContextPack } from "../contracts";
import type { ContextCacheMetadata } from "./context-cache-metadata";

export interface DeepContextPackCache {
  metadata: ContextCacheMetadata;
  contextPack: ContextPack;
  expandedGraphSlice: {
    relationshipCount: number;
    relationshipCandidateCount: number;
    relationshipEvidenceRefCount: number;
    relationshipReadiness: Record<string, number>;
  };
  evidenceAndLineage: {
    evidenceRefCount: number;
    sourceLineage: string[];
    assemblyInputSources: string[];
  };
  riskAndGapSummary: {
    riskCount: number;
    gapCount: number;
    blockerCount: number;
    unsupportedClaimCount: number;
  };
  claudeReadyContextPayloadReadyContent: {
    contextSummary: string;
    evidenceRefs: string[];
    unsupportedClaimsExcluded: boolean;
    inactiveCandidateContextExcludedUnlessRequested: boolean;
  };
}

export function buildDeepContextPackCache(params: {
  metadata: ContextCacheMetadata;
  pack: ContextPack;
}): DeepContextPackCache {
  const pack = params.pack;
  const relationshipEdges = [...pack.relationships, ...pack.relationshipCandidates];
  return {
    metadata: params.metadata,
    contextPack: pack,
    expandedGraphSlice: {
      relationshipCount: pack.relationships.length,
      relationshipCandidateCount: pack.relationshipCandidates.length,
      relationshipEvidenceRefCount: relationshipEdges.reduce(
        (count, edge) => count + edge.evidenceRefs.length,
        0,
      ),
      relationshipReadiness: relationshipEdges.reduce<Record<string, number>>((counts, edge) => {
        counts[edge.readiness] = (counts[edge.readiness] ?? 0) + 1;
        return counts;
      }, {}),
    },
    evidenceAndLineage: {
      evidenceRefCount: pack.evidence.length,
      sourceLineage: Array.from(
        new Set(pack.relevantEntityProfiles.flatMap((profile) => profile.sourceLineage)),
      ),
      assemblyInputSources: pack.assemblyTrace.inputSources,
    },
    riskAndGapSummary: {
      riskCount: pack.risks.length,
      gapCount: pack.gaps.length,
      blockerCount: pack.gaps.filter((gap) => gap.severity === "blocker").length,
      unsupportedClaimCount: pack.unsupportedClaims.length,
    },
    claudeReadyContextPayloadReadyContent: {
      contextSummary: pack.claudeReadyContextPayload.contextSummary,
      evidenceRefs: pack.claudeReadyContextPayload.evidenceRefs,
      unsupportedClaimsExcluded: pack.claudeReadyContextPayload.unsupportedClaims.length === 0,
      inactiveCandidateContextExcludedUnlessRequested:
        pack.claudeReadyContextPayload.excludesInactiveCandidateContextUnlessRequested,
    },
  };
}
