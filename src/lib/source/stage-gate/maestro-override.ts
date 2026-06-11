// Maestro/Admin decision engine — apply a decision to a stage-gate assessment.
//
// Hard rules enforced here:
//  - Maestro/Admin may approve with gaps (override) — but a rationale is REQUIRED when
//    gaps exist (no silent approval).
//  - An artifact is NEVER marked final/issue-ready while gaps exist.
//  - Gaps and risks are always carried forward (defaulted from the assessment if the
//    approver didn't restate them) — never hidden.
//  - Every decision yields an ApprovalRecord to persist in the File Cabinet.

import type {
  ApprovalRecord,
  ArtifactLabel,
  GateStatus,
  MaestroDecisionInput,
  MaestroDecisionResult,
  SourceStageGateAssessment,
} from './types';

const ADVANCING = new Set(['approve', 'approve_with_gaps', 'force_advance']);

export function applyMaestroDecision(
  assessment: SourceStageGateAssessment,
  decision: MaestroDecisionInput,
): MaestroDecisionResult {
  const hasGaps = assessment.gaps.length > 0;
  const advancing = ADVANCING.has(decision.action);

  // Hard rule: advancing past gaps requires a rationale.
  if (advancing && hasGaps && !decision.rationale?.trim()) {
    return { ok: false, error: 'Maestro override requires a rationale when gaps exist.' };
  }

  let gateStatus: GateStatus;
  let artifactLabel: ArtifactLabel;
  let allowIssueReady = false;

  switch (decision.action) {
    case 'approve':
      if (!hasGaps) {
        gateStatus = 'ready';
        artifactLabel = 'final';
        allowIssueReady = true;
      } else {
        // approving with gaps IS an override — label it honestly
        gateStatus = 'maestro_override_approved';
        artifactLabel = 'preliminary';
      }
      break;
    case 'approve_with_gaps':
    case 'force_advance':
      gateStatus = 'maestro_override_approved';
      artifactLabel = 'preliminary';
      break;
    case 'reject':
      gateStatus = 'blocked';
      artifactLabel = 'draft';
      break;
    case 'mark_preliminary':
      gateStatus = 'preliminary_only';
      artifactLabel = 'preliminary';
      break;
    case 'mark_client_to_complete':
      gateStatus = 'client_to_complete';
      artifactLabel = 'client_to_complete';
      break;
    case 'defer':
    case 'assign_follow_up':
      gateStatus = assessment.gateStatus; // non-advancing — status unchanged
      artifactLabel = 'preliminary';
      break;
    default:
      return { ok: false, error: `Unknown Maestro action: ${decision.action}` };
  }

  // never hide gaps/risks — default to the assessment's if the approver didn't restate
  const gapsAcknowledged = decision.gapsAcknowledged?.length ? decision.gapsAcknowledged : assessment.gaps.map((g) => g.label);
  const risksAccepted = decision.risksAccepted?.length ? decision.risksAccepted : assessment.risksOfProceeding;
  const followUpItems = decision.followUpItems ?? [];

  const approvalRecord: ApprovalRecord = {
    archetype: assessment.archetype,
    stageKey: assessment.stageKey,
    stageName: assessment.stageName,
    decision: decision.action,
    approver: decision.approver,
    approvedAt: decision.approvedAt,
    rationale: decision.rationale?.trim() || null,
    gapsAcknowledged,
    risksAccepted,
    downstreamImpacts: assessment.downstreamImpacts,
    followUpItems,
    artifactLabel,
    allowIssueReady,
    readinessSnapshot: {
      currentCompletion: assessment.currentCompletion,
      minimumViableMet: assessment.minimumViableMet,
      gateStatusBeforeDecision: assessment.gateStatus,
      gapCount: assessment.gaps.length,
    },
  };

  return {
    ok: true,
    resolved: {
      gateStatus,
      approver: decision.approver,
      approvedAt: decision.approvedAt,
      rationale: decision.rationale?.trim() || null,
      gapsAcknowledged,
      risksAccepted,
      downstreamImpacts: assessment.downstreamImpacts,
      followUpItems,
      artifactLabel,
      allowIssueReady,
      approvalRecord,
    },
  };
}
