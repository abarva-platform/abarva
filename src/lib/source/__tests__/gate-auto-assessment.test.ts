import {
  mappedEvidenceCriterionIds,
  validateEvidenceGateMap,
} from '@/lib/source/canonical-specs';
import type {
  SourceEventEvidence,
  SourceEventGateCriterion,
} from '@/lib/source/canvas-substrate';
import {
  AUTO_EVIDENCE_REVIEWER_ID,
  assessStageGate,
  buildStageRecommendation,
} from '@/lib/source/gate-auto-assessment';

function criterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: 'criterion-1',
    sourceEventId: 'event-1',
    tenantKey: 'skyharbor-air',
    criterionId: 'GATE-SCOPE-01',
    fromStage: 'scope',
    toStage: 'rfp',
    state: 'pending',
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

function evidence(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: 'evidence-1',
    sourceEventId: 'event-1',
    tenantKey: 'skyharbor-air',
    requirementId: 'EVID-SRC-SCOPE-APP-INV',
    stage: 'scope',
    currentState: 'Usable Evidence',
    sourceArtifactId: 'artifact-1',
    notes: null,
    lastSyncedAt: '2026-06-15T00:00:00.000Z',
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('Source gate auto assessment', () => {
  it('marks a pending criterion met when required evidence is at threshold', () => {
    const assessment = assessStageGate({
      fromStage: 'scope',
      criteria: [criterion()],
      evidence: [evidence()],
    });

    expect(assessment.criteria[0]).toMatchObject({
      criterionId: 'GATE-SCOPE-01',
      displayState: 'met_auto_evidence',
      provenance: 'auto-evidence',
      reason: 'Auto-assessed from evidence',
    });
    expect(assessment.criteria[0]?.evidence[0]).toMatchObject({
      requirementId: 'EVID-SRC-SCOPE-APP-INV',
      currentState: 'Usable Evidence',
      satisfied: true,
    });
  });

  it('blocks a criterion when required evidence is below threshold', () => {
    const assessment = assessStageGate({
      fromStage: 'scope',
      criteria: [criterion()],
      evidence: [evidence({ currentState: 'Parsed' })],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: 'blocked_evidence',
      provenance: 'auto-evidence',
    });
    expect(assessment.criteria[0]?.reason).toContain('must be at least');
  });

  it('does not satisfy stale or low-confidence evidence', () => {
    for (const currentState of ['Stale', 'Low Confidence'] as const) {
      const assessment = assessStageGate({
        fromStage: 'scope',
        criteria: [criterion()],
        evidence: [evidence({ currentState })],
      });

      expect(assessment.criteria[0]).toMatchObject({
        displayState: 'blocked_evidence',
      });
      expect(assessment.criteria[0]?.reason).toContain(currentState);
    }
  });

  it('keeps a human not-met decision even when evidence is ready', () => {
    const assessment = assessStageGate({
      fromStage: 'scope',
      criteria: [criterion({ state: 'not_met' })],
      evidence: [evidence()],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: 'not_met_manual',
      provenance: 'manual',
      reason: 'Manual override',
    });
  });

  it('renders a persisted system evidence assessment as auto-assessed after reload', () => {
    const assessment = assessStageGate({
      fromStage: 'scope',
      criteria: [
        criterion({
          state: 'met',
          reviewerUserId: AUTO_EVIDENCE_REVIEWER_ID,
          notes: 'Auto-met from evidence: EVID-SRC-SCOPE-APP-INV',
          evidenceArtifactIds: ['artifact-1'],
        }),
      ],
      evidence: [evidence()],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: 'met_auto_evidence',
      provenance: 'auto-evidence',
      reason: 'Auto-met from evidence: EVID-SRC-SCOPE-APP-INV',
    });
    expect(assessment.criteria[0]?.evidence[0]).toMatchObject({
      requirementId: 'EVID-SRC-SCOPE-APP-INV',
      sourceArtifactId: 'artifact-1',
    });
  });

  it('keeps unmapped criteria in human review instead of auto-meeting them', () => {
    const assessment = assessStageGate({
      fromStage: 'scope',
      criteria: [criterion({ criterionId: 'GATE-SCOPE-03' })],
      evidence: [evidence()],
    });

    expect(assessment.criteria[0]).toMatchObject({
      displayState: 'pending_review',
      provenance: 'none',
      reason: 'Needs human review',
    });
  });

  it('builds blocked, ready, and ready-with-warnings recommendations', () => {
    const blocked = buildStageRecommendation(
      assessStageGate({
        fromStage: 'scope',
        criteria: [criterion()],
        evidence: [evidence({ currentState: 'Parsed' })],
      }),
    );
    expect(blocked.status).toBe('blocked');
    expect(blocked.blockers[0]?.criterionId).toBe('GATE-SCOPE-01');

    const ready = buildStageRecommendation(
      assessStageGate({
        fromStage: 'scope',
        criteria: [criterion({ state: 'met' })],
        evidence: [],
      }),
    );
    expect(ready.status).toBe('ready');

    const warnings = buildStageRecommendation(
      assessStageGate({
        fromStage: 'evaluation',
        criteria: [
          criterion({
            criterionId: 'GATE-EVAL-01',
            fromStage: 'evaluation',
            toStage: 'pricing',
            state: 'met',
          }),
          criterion({
            criterionId: 'GATE-EVAL-03',
            fromStage: 'evaluation',
            toStage: 'pricing',
          }),
        ],
        evidence: [],
      }),
    );
    expect(warnings.status).toBe('ready_with_warnings');
    expect(warnings.reasonCodes).toContain('SOFT_CRITERIA_OPEN');
  });

  it('keeps the evidence-gate map pointed at real catalog IDs', () => {
    expect(mappedEvidenceCriterionIds().length).toBeGreaterThanOrEqual(2);
    expect(validateEvidenceGateMap()).toEqual({
      danglingCriterionIds: [],
      danglingRequirementIds: [],
    });
  });
});
