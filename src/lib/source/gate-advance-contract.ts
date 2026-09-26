import {
  evaluateSourceApprovalDecision,
  type SourceStageConfirmations,
} from "./approval-decision";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "./canvas-substrate";
import { confirmationKeysForStage } from "./stage-gate-confirmations";
import {
  evaluateStagePromotionReadiness,
  firstGovernanceBlocker,
  type SourceGovernanceBlocker,
  type SourceGovernanceVerdict,
} from "./source-governance-enforcement";
import type { SourceStageKey } from "./types";

export interface SourceGateAdvanceContractInput {
  currentStage: SourceStageKey;
  /** Null only when a journey-aware caller is closing its terminal stage. */
  targetStage: SourceStageKey | null;
  isTerminalClosure?: boolean;
  stageOrder?: readonly SourceStageKey[];
  confirmations?: SourceStageConfirmations | null;
  criteria: SourceEventGateCriterion[];
  artifacts?: SourceEventArtifactState[];
  evidence?: SourceEventEvidence[];
  reason: unknown;
  allowComputedReadinessBypass?: boolean;
  verifiedDelegatedSponsorAcknowledgement?: boolean;
}

export interface SourceGateAdvanceContractResult {
  ok: boolean;
  status: number;
  error?: string;
  detail?: string;
  missingConfirmations?: string[];
  blocker?: SourceGovernanceBlocker;
  readiness: SourceGovernanceVerdict;
  bypassedGovernanceBlockers: SourceGovernanceBlocker[];
}

/**
 * Canonical Source stage-gate advance contract.
 *
 * A user-initiated stage advance requires BOTH signals:
 * 1. human attestation: the stage's required confirmation keys are explicitly true;
 * 2. computed readiness: the current stage's artifacts/evidence/criteria pass the
 *    governance readiness model.
 *
 * Pilot self-approval may bypass computed-readiness blockers when an authorized
 * route explicitly opts in, but it never bypasses missing human confirmations.
 */
export function evaluateSourceGateAdvanceContract(
  input: SourceGateAdvanceContractInput,
): SourceGateAdvanceContractResult {
  const approval = evaluateSourceApprovalDecision(
    "approve",
    input.confirmations,
    {
      currentStageKey: input.currentStage,
      requiredConfirmationKeys: confirmationKeysForStage(input.currentStage),
      nextStageKey: input.targetStage,
      isTerminalStage: input.isTerminalClosure === true,
    },
  );
  const readiness = evaluateStagePromotionReadiness({
    currentStage: input.currentStage,
    targetStage: input.targetStage ?? input.currentStage,
    stageOrder: input.stageOrder,
    allowTerminalClosure: input.isTerminalClosure === true,
    criteria: input.criteria,
    artifacts: input.artifacts,
    evidence: input.evidence,
    reason: input.reason,
    verifiedDelegatedSponsorAcknowledgement:
      input.verifiedDelegatedSponsorAcknowledgement,
  });

  if (!approval.ok) {
    return {
      ok: false,
      status: approval.error === "confirmations_required" ? 422 : 400,
      error: approval.error ?? "approval_failed",
      detail: approval.detail ?? "Source stage approval failed.",
      missingConfirmations: approval.missingConfirmations,
      readiness,
      bypassedGovernanceBlockers: [],
    };
  }

  const transitionMatches = input.isTerminalClosure === true
    ? approval.advanceStageTo === null && approval.toState === "completed"
    : approval.advanceStageTo === input.targetStage;
  if (!transitionMatches) {
    return {
      ok: false,
      status: 409,
      error: "stage_transition_mismatch",
      detail:
        input.isTerminalClosure === true
          ? `Approval would not close terminal stage ${input.currentStage}.`
          : `Approval would advance ${input.currentStage} to ${approval.advanceStageTo ?? "closed"}, not ${input.targetStage}.`,
      readiness,
      bypassedGovernanceBlockers: [],
    };
  }

  if (!readiness.ok && !input.allowComputedReadinessBypass) {
    const blocker = firstGovernanceBlocker(readiness);
    return {
      ok: false,
      status: 409,
      error: blocker.code,
      detail: blocker.detail,
      blocker,
      readiness,
      bypassedGovernanceBlockers: [],
    };
  }

  return {
    ok: true,
    status: 200,
    readiness,
    bypassedGovernanceBlockers: readiness.ok ? [] : readiness.blockers,
  };
}
