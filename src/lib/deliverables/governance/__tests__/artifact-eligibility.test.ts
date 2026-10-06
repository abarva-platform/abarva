import {
  resolveArtifactEligibility,
  allowedArtifactKeys,
  P3_PRECONDITIONS,
  P2_PRECONDITIONS,
  type MoveGovernedState,
} from '../artifact-eligibility';
import { resolveClaimConstraints, blockedSubjects, constraintFromProse, type ClaimConstraint } from '../claim-constraints';

/** The state of the Move that produced a P3 nothing refused. */
const contactCentre: MoveGovernedState = {
  moveId: 'MOVE-CC',
  initiativeStatus: 'context_only',
  valueClaimStatus: 'baseline_only',
  metricBoundary: 'baseline_required_before_value_claim',
  baselineLoaded: false,
  openDiscoveryGaps: ['transcript governance', 'real-time integration', 'intent taxonomy', 'member identity linkage'],
  towerClaimAllowed: 'no',
};

describe('artifact eligibility', () => {
  it('blocks every P3 artifact for a Move that has not cleared discovery', () => {
    const e = resolveArtifactEligibility(contactCentre, P3_PRECONDITIONS);
    expect(e.every((a) => a.state === 'blocked')).toBe(true);
    expect(allowedArtifactKeys(e)).toEqual([]);
  });

  it('names the governed fields that blocked it, not just that it is blocked', () => {
    // A block nobody can explain becomes a block someone overrides.
    const [tsa] = resolveArtifactEligibility(contactCentre, P3_PRECONDITIONS);
    expect(tsa.reasons.map((r) => r.field).sort()).toEqual([
      'baselineLoaded',
      'initiativeStatus',
      'openDiscoveryGaps',
      'valueClaimStatus',
    ]);
  });

  it('allows the P2 assessment, which exists to establish what is not yet known', () => {
    const e = resolveArtifactEligibility(contactCentre, P2_PRECONDITIONS);
    expect(allowedArtifactKeys(e)).toEqual(['discovery_report', 'root_cause_worksheet']);
  });

  it('gives the client surface a count, and no governed vocabulary', () => {
    const [tsa] = resolveArtifactEligibility(contactCentre, P3_PRECONDITIONS);
    expect(tsa.surfaceLabel).toBe('Not ready — 4 Discovery conditions remain.');
    expect(tsa.surfaceLabel).not.toMatch(/context_only|baseline_only|valueClaimStatus/);
  });

  it('allows a P3 once every condition clears — the gate must open, not only close', () => {
    // A resolver that blocks everything passes an "is it blocking?" test and is
    // useless. Both directions are asserted.
    const cleared: MoveGovernedState = {
      ...contactCentre,
      initiativeStatus: 'approved',
      valueClaimStatus: 'measured_partial',
      baselineLoaded: true,
      openDiscoveryGaps: [],
    };
    expect(allowedArtifactKeys(resolveArtifactEligibility(cleared, P3_PRECONDITIONS))).toEqual([
      'target_state_architecture',
      'solution_approach_options',
      'solution_design',
    ]);
  });

  it('blocks again when any single condition is removed', () => {
    const cleared: MoveGovernedState = {
      ...contactCentre,
      initiativeStatus: 'approved',
      valueClaimStatus: 'measured_partial',
      baselineLoaded: true,
      openDiscoveryGaps: [],
    };
    for (const mutate of [
      { baselineLoaded: false },
      { initiativeStatus: 'context_only' },
      { valueClaimStatus: 'baseline_only' },
      { openDiscoveryGaps: ['one gap'] },
    ]) {
      const e = resolveArtifactEligibility({ ...cleared, ...mutate }, P3_PRECONDITIONS);
      expect(allowedArtifactKeys(e)).not.toContain('target_state_architecture');
    }
  });

  it('blocks an artifact whose own claim subject is prohibited', () => {
    const cleared: MoveGovernedState = {
      ...contactCentre,
      initiativeStatus: 'approved',
      valueClaimStatus: 'measured',
      baselineLoaded: true,
      openDiscoveryGaps: [],
    };
    const constraints: ClaimConstraint[] = [
      { id: 'c1', subject: 'target_state', assertion: 'a target state may be designed', state: 'prohibited', requiredEvidenceIds: [], sourceRefs: [], reason: 'the estate has no declared target state to design against' },
    ];
    const [tsa] = resolveArtifactEligibility(cleared, P3_PRECONDITIONS, constraints);
    expect(tsa.state).toBe('blocked');
    expect(tsa.reasons[0].unblockedBy).toContain('no declared target state');
  });
});

describe('claim constraints', () => {
  const constraints: ClaimConstraint[] = [
    { id: 'k1', subject: 'automation_savings', assertion: 'automation has produced savings', state: 'conditional', requiredEvidenceIds: ['baseline:cycle_time', 'adoption:evidence', 'finance:validation'], sourceRefs: ['tab10'], reason: 'savings require a baseline and adoption evidence' },
    { id: 'k2', subject: 'scale_decision', assertion: 'the capability is ready to scale', state: 'prohibited', requiredEvidenceIds: [], sourceRefs: ['tab10'], reason: 'four discovery gaps remain open' },
  ];

  it('keeps a conditional claim blocked while any required evidence is absent', () => {
    const [savings] = resolveClaimConstraints(constraints, ['baseline:cycle_time']);
    expect(savings.effectiveState).toBe('conditional');
    expect(savings.missingEvidenceIds).toEqual(['adoption:evidence', 'finance:validation']);
  });

  it('permits it once every required item has arrived', () => {
    const [savings] = resolveClaimConstraints(constraints, ['baseline:cycle_time', 'adoption:evidence', 'finance:validation']);
    expect(savings.effectiveState).toBe('permitted');
    expect(savings.missingEvidenceIds).toEqual([]);
  });

  it('never lets evidence unblock an outright prohibition', () => {
    const resolved = resolveClaimConstraints(constraints, ['baseline:cycle_time', 'adoption:evidence', 'finance:validation']);
    expect(blockedSubjects(resolved)).toEqual(['scale_decision']);
  });

  it('normalises prose, and the result can never self-clear', () => {
    // Nothing in the sentence says what would clear it, so the fallback cannot
    // resolve to permitted. The discomfort is the point.
    const c = constraintFromProse('Do not claim automation savings without baseline and adoption evidence.', 'tab10', 3);
    expect(c.state).toBe('prohibited');
    expect(c.requiredEvidenceIds).toEqual([]);
    expect(resolveClaimConstraints([c], ['anything']).every((r) => r.effectiveState === 'prohibited')).toBe(true);
    expect(c.subject).toContain('automation_savings');
  });
});
