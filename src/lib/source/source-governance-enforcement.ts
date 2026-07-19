import { criterionById, requiredEvidenceForStage } from "./canonical-specs";
import { SOURCE_STAGE_ORDER } from "./constants";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "./canvas-substrate";
import { isFactBackedEvidence } from "./canvas-substrate/fact-derived-evidence";
import type { SourceStageKey } from "./types";

export const SOURCE_APPROVAL_REASON_MIN_LENGTH = 12;
export const SOURCE_HUMAN_EDIT_METADATA_KEYS = [
  "humanEditedAt",
  "humanReviewedAt",
] as const;

export interface SourceGovernanceBlocker {
  code: string;
  detail: string;
}

export interface SourceGovernanceVerdict {
  ok: boolean;
  blockers: SourceGovernanceBlocker[];
}

const PASSING_ARTIFACT_STATUSES = new Set(["approved", "locked"]);

const EVIDENCE_RANK: Record<SourceEventEvidence["currentState"], number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

export function normalizeApprovalReason(reason: unknown): string {
  return typeof reason === "string" ? reason.trim() : "";
}

export function validateApprovalReason(
  reason: unknown,
): SourceGovernanceVerdict {
  const normalized = normalizeApprovalReason(reason);
  if (normalized.length >= SOURCE_APPROVAL_REASON_MIN_LENGTH) {
    return pass();
  }

  return fail({
    code: "approval_reason_required",
    detail: `A human approval reason of at least ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters is required.`,
  });
}

export function isArtifactHumanReviewed(
  artifact: SourceEventArtifactState | undefined,
): boolean {
  if (!artifact) return false;
  if (artifact.linkedArtifactId) return true;
  if (!artifact.body?.trim()) return false;
  const metadata = artifact.bodyGenerationMetadata;
  if (!metadata) return true;
  return SOURCE_HUMAN_EDIT_METADATA_KEYS.some(
    (key) => typeof metadata[key] === "string",
  );
}

export function isArtifactGateReady(
  artifact: SourceEventArtifactState | undefined,
): boolean {
  if (!artifact) return false;
  if (!PASSING_ARTIFACT_STATUSES.has(artifact.status)) return false;
  return isArtifactHumanReviewed(artifact);
}

export function evaluateCriterionMetReadiness(input: {
  criterion: SourceEventGateCriterion;
  artifacts: SourceEventArtifactState[];
  evidence: SourceEventEvidence[];
  reason: unknown;
  skipApprovalReasonCheck?: boolean;
}): SourceGovernanceVerdict {
  const blockers: SourceGovernanceBlocker[] = input.skipApprovalReasonCheck
    ? []
    : [...validateApprovalReason(input.reason).blockers];
  const definition = criterionById(input.criterion.criterionId);

  if (!definition) {
    blockers.push({
      code: "criterion_definition_missing",
      detail: `No canonical definition exists for ${input.criterion.criterionId}.`,
    });
  }

  for (const artifactCode of definition?.linkedArtifactCodes ?? []) {
    const artifact = input.artifacts.find(
      (row) => row.artifactCode === artifactCode,
    );
    if (!isArtifactGateReady(artifact)) {
      blockers.push({
        code: "linked_artifact_not_committed",
        detail: `${artifactCode} must be authored and approved or locked before this gate can be marked met.`,
      });
    }
  }

  const requiredEvidence = requiredEvidenceForStage(input.criterion.fromStage);
  const isHardCriterion = definition?.severity === "hard";
  for (const requirement of requiredEvidence) {
    const state = input.evidence.find(
      (row) => row.requirementId === requirement.requirementId,
    );
    const rankOk =
      !!state &&
      EVIDENCE_RANK[state.currentState] >=
        EVIDENCE_RANK[requirement.minimumState];
    const isClientStatedPlaceholder =
      !!state &&
      state.sourceArtifactId === null &&
      !isFactBackedEvidence(state) &&
      state.currentState !== "Usable Evidence";
    if (!rankOk || (isHardCriterion && isClientStatedPlaceholder)) {
      blockers.push({
        code: !rankOk
          ? "required_evidence_not_ready"
          : "required_evidence_unverified",
        detail: !rankOk
          ? `${requirement.label} must be at least ${requirement.minimumState}; current state is ${state?.currentState ?? "missing"}.`
          : `${requirement.label} is a client-stated answer, not verified evidence. A hard gate requires uploaded/processed evidence or explicit review before it can clear.`,
      });
    }
  }

  return { ok: blockers.length === 0, blockers };
}

export function evaluateStagePromotionReadiness(input: {
  currentStage: SourceStageKey;
  targetStage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
  artifacts?: SourceEventArtifactState[];
  evidence?: SourceEventEvidence[];
  reason: unknown;
}): SourceGovernanceVerdict {
  const blockers: SourceGovernanceBlocker[] = [
    ...validateApprovalReason(input.reason).blockers,
  ];
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(input.currentStage);
  const targetIndex = SOURCE_STAGE_ORDER.indexOf(input.targetStage);

  if (currentIndex < 0 || targetIndex < 0) {
    blockers.push({
      code: "invalid_stage",
      detail: "Current and target stages must both be canonical Source stages.",
    });
  } else if (targetIndex !== currentIndex + 1) {
    blockers.push({
      code: "non_adjacent_stage_promotion",
      detail: `Stage promotion must move exactly one step from ${input.currentStage}; requested ${input.targetStage}.`,
    });
  }

  const stageCriteria = input.criteria.filter(
    (row) => row.fromStage === input.currentStage,
  );
  for (const criterion of stageCriteria) {
    const definition = criterionById(criterion.criterionId);
    const blocksPromotion =
      definition?.required !== false &&
      (definition?.severity === "hard" || definition?.severity === "soft");
    if (
      blocksPromotion &&
      criterion.state !== "met" &&
      criterion.state !== "waived"
    ) {
      blockers.push({
        code: "gate_criterion_open",
        detail: `${definition?.title ?? criterion.criterionId} is ${criterion.state}.`,
      });
      continue;
    }
    if (
      blocksPromotion &&
      criterion.state === "met" &&
      input.artifacts &&
      input.evidence
    ) {
      const criterionReadiness = evaluateCriterionMetReadiness({
        criterion,
        artifacts: input.artifacts,
        evidence: input.evidence,
        reason: criterion.notes,
      });
      if (!criterionReadiness.ok) {
        blockers.push({
          code: "gate_criterion_unverified",
          detail: `${definition?.title ?? criterion.criterionId} was previously marked met, but no longer satisfies artifact, evidence, and reason controls.`,
        });
        blockers.push(...criterionReadiness.blockers);
      }
    }
  }

  if (stageCriteria.length === 0 && input.targetStage !== "strategy") {
    blockers.push({
      code: "stage_gate_not_scaffolded",
      detail: `No gate criteria are scaffolded for ${input.currentStage}.`,
    });
  }

  return { ok: blockers.length === 0, blockers };
}

export function verifiedGateCriterionForDisplay(input: {
  criterion: SourceEventGateCriterion;
  artifacts: SourceEventArtifactState[];
  evidence: SourceEventEvidence[];
}): SourceEventGateCriterion {
  if (input.criterion.state !== "met") return input.criterion;
  const readiness = evaluateCriterionMetReadiness({
    criterion: input.criterion,
    artifacts: input.artifacts,
    evidence: input.evidence,
    reason: input.criterion.notes,
  });
  if (readiness.ok) return input.criterion;
  return {
    ...input.criterion,
    state: "pending",
    reviewedAt: null,
    reviewerUserId: null,
    notes: `Previously marked met, but blocked by current governance controls: ${readiness.blockers
      .map((blocker) => blocker.detail)
      .join(" ")}`,
  };
}

export function firstGovernanceBlocker(
  verdict: SourceGovernanceVerdict,
): SourceGovernanceBlocker {
  return (
    verdict.blockers[0] ?? {
      code: "governance_blocked",
      detail: "Source governance prerequisites are not satisfied.",
    }
  );
}

function pass(): SourceGovernanceVerdict {
  return { ok: true, blockers: [] };
}

function fail(blocker: SourceGovernanceBlocker): SourceGovernanceVerdict {
  return { ok: false, blockers: [blocker] };
}
