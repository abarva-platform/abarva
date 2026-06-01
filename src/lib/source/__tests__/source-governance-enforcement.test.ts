import {
  evaluateCriterionMetReadiness,
  evaluateStagePromotionReadiness,
  validateApprovalReason,
} from '../source-governance-enforcement';
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from '../canvas-substrate';

const REVIEW_REASON = 'Sponsor reviewed the evidence bundle and approves this gate.';

describe('Source governance enforcement', () => {
  it('requires a meaningful human approval reason', () => {
    expect(validateApprovalReason('').ok).toBe(false);
    expect(validateApprovalReason('ok').ok).toBe(false);
    expect(validateApprovalReason(REVIEW_REASON).ok).toBe(true);
  });

  it('blocks marking a gate met when linked artifacts are empty stubs', () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: 'GATE-STRATEGY-01' }),
      artifacts: [
        artifact({
          artifactCode: 'd01_strategy_memo',
          status: 'not_started',
          body: null,
        }),
      ],
      evidence: strategyEvidenceReady(),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((b) => b.code)).toContain('linked_artifact_not_committed');
  });

  it('blocks marking a gate met when required evidence is not ready', () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: 'GATE-STRATEGY-01' }),
      artifacts: [
        artifact({
          artifactCode: 'd01_strategy_memo',
          status: 'approved',
          body: 'Approved strategy memo body.',
        }),
      ],
      evidence: [
        evidence({
          requirementId: 'EVID-SRC-STR-INCUMBENT',
          currentState: 'Not Requested',
        }),
        evidence({
          requirementId: 'EVID-SRC-STR-SPONSOR-COMMIT',
          currentState: 'Loaded',
        }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((b) => b.code)).toContain('required_evidence_not_ready');
  });

  it('allows marking a gate met when reason, artifact, and evidence are ready', () => {
    const verdict = evaluateCriterionMetReadiness({
      criterion: criterion({ criterionId: 'GATE-STRATEGY-01' }),
      artifacts: [
        artifact({
          artifactCode: 'd01_strategy_memo',
          status: 'approved',
          body: 'Approved strategy memo body.',
        }),
      ],
      evidence: strategyEvidenceReady(),
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });

  it('blocks non-adjacent stage promotion even when criteria are met', () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: 'strategy',
      targetStage: 'evaluation',
      criteria: [
        criterion({ criterionId: 'GATE-STRATEGY-01', state: 'met' }),
        criterion({ criterionId: 'GATE-STRATEGY-02', state: 'met' }),
        criterion({ criterionId: 'GATE-STRATEGY-03', state: 'met' }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((b) => b.code)).toContain('non_adjacent_stage_promotion');
  });

  it('blocks adjacent promotion while required criteria are still open', () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: 'strategy',
      targetStage: 'scope',
      criteria: [
        criterion({ criterionId: 'GATE-STRATEGY-01', state: 'met' }),
        criterion({ criterionId: 'GATE-STRATEGY-02', state: 'pending' }),
        criterion({ criterionId: 'GATE-STRATEGY-03', state: 'met' }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.blockers.map((b) => b.code)).toContain('gate_criterion_open');
  });

  it('allows adjacent promotion when all required criteria are met', () => {
    const verdict = evaluateStagePromotionReadiness({
      currentStage: 'strategy',
      targetStage: 'scope',
      criteria: [
        criterion({ criterionId: 'GATE-STRATEGY-01', state: 'met' }),
        criterion({ criterionId: 'GATE-STRATEGY-02', state: 'met' }),
        criterion({ criterionId: 'GATE-STRATEGY-03', state: 'met' }),
      ],
      reason: REVIEW_REASON,
    });

    expect(verdict.ok).toBe(true);
  });
});

function criterion(
  overrides: Partial<SourceEventGateCriterion> & Pick<SourceEventGateCriterion, 'criterionId'>,
): SourceEventGateCriterion {
  const { criterionId, ...rest } = overrides;
  return {
    id: `state-${criterionId}`,
    sourceEventId: 'event-1',
    tenantKey: 'apex-retail',
    criterionId,
    fromStage: 'strategy',
    toStage: 'scope',
    state: 'pending',
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...rest,
  };
}

function artifact(
  overrides: Partial<SourceEventArtifactState> & Pick<SourceEventArtifactState, 'artifactCode'>,
): SourceEventArtifactState {
  const { artifactCode, ...rest } = overrides;
  return {
    id: `artifact-${artifactCode}`,
    sourceEventId: 'event-1',
    tenantKey: 'apex-retail',
    artifactCode,
    stage: 'strategy',
    family: 'sourcing_strategy',
    tier: 'stub',
    status: 'not_started',
    requirementLevel: 'required',
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: null,
    bodyFormat: 'markdown',
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...rest,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> & Pick<SourceEventEvidence, 'requirementId'>,
): SourceEventEvidence {
  const { requirementId, ...rest } = overrides;
  return {
    id: `evidence-${requirementId}`,
    sourceEventId: 'event-1',
    tenantKey: 'apex-retail',
    requirementId,
    stage: 'strategy',
    currentState: 'Not Requested',
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...rest,
  };
}

function strategyEvidenceReady(): SourceEventEvidence[] {
  return [
    evidence({
      requirementId: 'EVID-SRC-STR-INCUMBENT',
      currentState: 'Available',
    }),
    evidence({
      requirementId: 'EVID-SRC-STR-SPONSOR-COMMIT',
      currentState: 'Loaded',
    }),
  ];
}
