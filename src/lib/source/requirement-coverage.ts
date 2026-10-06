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
import { sourceEvidenceAppliesToApprovalPolicy } from "./approval-policy";
import { evidenceMeetsRequirement } from "./evidence-authority";

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

  const coveredArtifacts = requiredArtifacts.filter((artifact) =>
    coveredArtifactCodes.has(artifact.code),
  ).length;
  const coveredEvidence = requiredEvidence.filter((requirement) =>
    evidenceStates.some((evidence) => evidence.requirementId === requirement.requirementId &&
      evidenceMeetsRequirement(requirement, evidence)),
  ).length;

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
  approvalPolicyCode,
}: {
  stageKey: SourceStageKey;
  artifactStates: SourceEventArtifactState[];
  evidenceStates: SourceEventEvidence[];
  approvalPolicyCode?: "legacy_signed_scope_v1" | "self_v1" | null;
}): RequirementCoverageResult {
  return computeRequirementCoverage({
    requiredArtifacts: requiredSpecsForStage(stageKey),
    requiredEvidence: requiredEvidenceForStage(stageKey).filter((row) =>
      sourceEvidenceAppliesToApprovalPolicy(row.requirementId, approvalPolicyCode)),
    artifactStates,
    evidenceStates,
  });
}
