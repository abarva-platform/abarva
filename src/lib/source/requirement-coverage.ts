import type {
  SourceEventArtifactState,
  SourceEventArtifactStatus,
  SourceEventEvidence,
} from "./canvas-substrate";
import {
  requiredEvidenceForStage,
  requiredSpecsForStage,
  type SourceArtifactSpec,
  type SourceEvidenceRequirement,
} from "./canonical-specs";
import type { SourceStageKey } from "./types";

const EVIDENCE_READINESS_RANK: Record<
  SourceEventEvidence["currentState"],
  number
> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

const COVERED_ARTIFACT_STATUSES = new Set<SourceEventArtifactStatus>([
  "approved",
  "locked",
]);

export interface RequirementCoverageResult {
  met: number;
  required: number;
  displayValue: string;
}

export function computeRequirementCoverage({
  requiredArtifacts,
  requiredEvidence,
  artifactStates,
  evidenceStates,
}: {
  requiredArtifacts: SourceArtifactSpec[];
  requiredEvidence: SourceEvidenceRequirement[];
  artifactStates: SourceEventArtifactState[];
  evidenceStates: SourceEventEvidence[];
}): RequirementCoverageResult {
  const totalRequired = requiredArtifacts.length + requiredEvidence.length;

  if (totalRequired === 0) {
    return {
      met: 0,
      required: 0,
      displayValue: "no requirements defined",
    };
  }

  const coveredArtifactCodes = new Set(
    artifactStates
      .filter((artifact) => COVERED_ARTIFACT_STATUSES.has(artifact.status))
      .map((artifact) => artifact.artifactCode),
  );
  const bestEvidenceRankByRequirement = new Map<string, number>();

  for (const evidence of evidenceStates) {
    const currentRank = EVIDENCE_READINESS_RANK[evidence.currentState] ?? -1;
    const previousRank =
      bestEvidenceRankByRequirement.get(evidence.requirementId) ?? -1;
    if (currentRank > previousRank) {
      bestEvidenceRankByRequirement.set(evidence.requirementId, currentRank);
    }
  }

  const coveredArtifacts = requiredArtifacts.filter((artifact) =>
    coveredArtifactCodes.has(artifact.code),
  ).length;
  const coveredEvidence = requiredEvidence.filter((requirement) => {
    const currentRank =
      bestEvidenceRankByRequirement.get(requirement.requirementId) ?? -1;
    const minimumRank = EVIDENCE_READINESS_RANK[requirement.minimumState];
    return currentRank >= 0 && currentRank >= minimumRank;
  }).length;

  const met = coveredArtifacts + coveredEvidence;
  return {
    met,
    required: totalRequired,
    displayValue: `${met} / ${totalRequired}`,
  };
}

export function computeStageRequirementCoverage({
  stageKey,
  artifactStates,
  evidenceStates,
}: {
  stageKey: SourceStageKey;
  artifactStates: SourceEventArtifactState[];
  evidenceStates: SourceEventEvidence[];
}): RequirementCoverageResult {
  return computeRequirementCoverage({
    requiredArtifacts: requiredSpecsForStage(stageKey),
    requiredEvidence: requiredEvidenceForStage(stageKey),
    artifactStates,
    evidenceStates,
  });
}
