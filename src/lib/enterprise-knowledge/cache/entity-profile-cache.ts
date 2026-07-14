import type { EntityProfile, EvidenceRef } from "../contracts";
import type { ContextCacheMetadata } from "./context-cache-metadata";

export interface CachedEntityProfile {
  metadata: ContextCacheMetadata;
  profile: EntityProfile;
  evidenceSummary: {
    evidenceRefCount: number;
    citableEvidenceRefCount: number;
    sourceLabels: string[];
  };
  relationshipSummary: {
    relationshipCount: number;
    candidateRelationshipCount: number;
  };
  gapSummary: {
    total: number;
    blockers: number;
    warnings: number;
  };
  claudeReadyExcerpt: string;
}

export function buildCachedEntityProfile(params: {
  metadata: ContextCacheMetadata;
  profile: EntityProfile;
}): CachedEntityProfile {
  const profile = params.profile;
  return {
    metadata: params.metadata,
    profile,
    evidenceSummary: summarizeEvidence(profile.evidenceRefs),
    relationshipSummary: {
      relationshipCount: profile.relationships.length,
      candidateRelationshipCount: profile.relationships.filter(
        (edge) => edge.readiness === "candidate",
      ).length,
    },
    gapSummary: {
      total: profile.knownGaps.length,
      blockers: profile.knownGaps.filter((gap) => gap.severity === "blocker").length,
      warnings: profile.knownGaps.filter((gap) => gap.severity === "warning").length,
    },
    claudeReadyExcerpt: [
      `${profile.entityType}: ${profile.entityName}`,
      profile.businessMeaning,
      profile.currentStateSummary,
      profile.targetStateDirection ? `Target: ${profile.targetStateDirection}` : "",
      `Readiness: ${profile.moduleReadiness}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function summarizeEvidence(evidenceRefs: EvidenceRef[]): CachedEntityProfile["evidenceSummary"] {
  return {
    evidenceRefCount: evidenceRefs.length,
    citableEvidenceRefCount: evidenceRefs.filter((ref) => ref.citationStatus === "citable").length,
    sourceLabels: Array.from(new Set(evidenceRefs.map((ref) => ref.sourceLabel))).slice(0, 8),
  };
}
