// PDEL10 · Deliverable Approval / Lock / Supersede Flow tests.
//
// Pure deterministic coverage of the approval-state machine projection.
// No React rendering, no DOM, no model calls, no live runtime.

import {
  buildDeliverableApprovalFlowManifest,
  getAllowedTransitions,
  APPROVAL_STATES_IN_ORDER,
  LOCK_REASONS_IN_ORDER,
  SUPERSEDE_REASONS_IN_ORDER,
  REVIEWER_ROLES_IN_ORDER,
  APPROVAL_BLOCKERS_IN_ORDER,
  type ApprovalState,
  type DeliverableApprovalRecord,
} from '../../../lib/programs/deliverable-approval-flow';

// ---------------------------------------------------------------------
// Manifest-level invariants
// ---------------------------------------------------------------------

describe('buildDeliverableApprovalFlowManifest · manifest invariants', () => {
  const manifest = buildDeliverableApprovalFlowManifest();

  it('manifest.proposedOnly is always true', () => {
    expect(manifest.proposedOnly).toBe(true);
  });

  it('every deliverable has proposedOnly === true', () => {
    for (const d of manifest.deliverables) {
      expect(d.proposedOnly).toBe(true);
    }
  });

  it('totalDeliverables equals deliverables.length', () => {
    expect(manifest.totalDeliverables).toBe(manifest.deliverables.length);
  });

  it('generatedAt is 2026-04-26', () => {
    expect(manifest.generatedAt).toBe('2026-04-26');
  });

  it('approvedCount matches deliverables in approved state', () => {
    const count = manifest.deliverables.filter(
      (d) => d.currentState === 'approved',
    ).length;
    expect(manifest.approvedCount).toBe(count);
  });

  it('pendingCount matches deliverables in pending_review state', () => {
    const count = manifest.deliverables.filter(
      (d) => d.currentState === 'pending_review',
    ).length;
    expect(manifest.pendingCount).toBe(count);
  });

  it('lockedCount matches deliverables in locked state', () => {
    const count = manifest.deliverables.filter(
      (d) => d.currentState === 'locked',
    ).length;
    expect(manifest.lockedCount).toBe(count);
  });

  it('has at least 4 sample deliverables', () => {
    expect(manifest.deliverables.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------
// Decision-grade deliverables require evidence trace
// ---------------------------------------------------------------------

describe('buildDeliverableApprovalFlowManifest · decision-grade deliverables', () => {
  const manifest = buildDeliverableApprovalFlowManifest();

  it('decision-grade deliverables have requiresEvidenceTrace === true', () => {
    const decisionGrade = manifest.deliverables.filter(
      (d) => d.isDecisionGrade,
    );
    expect(decisionGrade.length).toBeGreaterThan(0);
    for (const d of decisionGrade) {
      expect(d.requiresEvidenceTrace).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// Locked and superseded deliverables carry reasons
// ---------------------------------------------------------------------

describe('buildDeliverableApprovalFlowManifest · locked/superseded reasons', () => {
  const manifest = buildDeliverableApprovalFlowManifest();

  it('locked deliverables have a non-null lockReason', () => {
    const locked = manifest.deliverables.filter(
      (d) => d.currentState === 'locked',
    );
    expect(locked.length).toBeGreaterThan(0);
    for (const d of locked) {
      expect(d.lockReason).not.toBeNull();
    }
  });

  it('superseded deliverables have a non-null supersedeReason', () => {
    const superseded = manifest.deliverables.filter(
      (d) => d.currentState === 'superseded',
    );
    expect(superseded.length).toBeGreaterThan(0);
    for (const d of superseded) {
      expect(d.supersedeReason).not.toBeNull();
    }
  });

  it('non-locked deliverables have lockReason === null', () => {
    const nonLocked = manifest.deliverables.filter(
      (d) => d.currentState !== 'locked',
    );
    for (const d of nonLocked) {
      expect(d.lockReason).toBeNull();
    }
  });

  it('non-superseded deliverables have supersedeReason === null', () => {
    const nonSuperseded = manifest.deliverables.filter(
      (d) => d.currentState !== 'superseded',
    );
    for (const d of nonSuperseded) {
      expect(d.supersedeReason).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------
// Blockers invariant
// ---------------------------------------------------------------------

describe('buildDeliverableApprovalFlowManifest · blockers', () => {
  const manifest = buildDeliverableApprovalFlowManifest();

  it('blockers is an array on all deliverables', () => {
    for (const d of manifest.deliverables) {
      expect(Array.isArray(d.blockers)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------
// auditBasis invariant
// ---------------------------------------------------------------------

describe('buildDeliverableApprovalFlowManifest · auditBasis', () => {
  const manifest = buildDeliverableApprovalFlowManifest();

  it('auditBasis is non-empty on all deliverables', () => {
    for (const d of manifest.deliverables) {
      expect(typeof d.auditBasis).toBe('string');
      expect(d.auditBasis.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// allowedTransitions invariant
// ---------------------------------------------------------------------

describe('buildDeliverableApprovalFlowManifest · allowedTransitions', () => {
  const manifest = buildDeliverableApprovalFlowManifest();

  it('every transition has isAllowed: true', () => {
    for (const d of manifest.deliverables) {
      for (const t of d.allowedTransitions) {
        expect(t.isAllowed).toBe(true);
      }
    }
  });

  it('every transition has a non-empty auditBasis', () => {
    for (const d of manifest.deliverables) {
      for (const t of d.allowedTransitions) {
        expect(typeof t.auditBasis).toBe('string');
        expect(t.auditBasis.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------
// getAllowedTransitions
// ---------------------------------------------------------------------

describe('getAllowedTransitions', () => {
  it('returns at least one transition for draft state', () => {
    const transitions = getAllowedTransitions('draft');
    expect(transitions.length).toBeGreaterThan(0);
  });

  it('all returned transitions have from === draft', () => {
    const transitions = getAllowedTransitions('draft');
    for (const t of transitions) {
      expect(t.from).toBe('draft');
    }
  });

  it('all returned transitions have isAllowed: true', () => {
    for (const state of APPROVAL_STATES_IN_ORDER) {
      const transitions = getAllowedTransitions(state);
      for (const t of transitions) {
        expect(t.isAllowed).toBe(true);
      }
    }
  });

  it('transitions that require rationale have requiresRationale: true', () => {
    for (const state of APPROVAL_STATES_IN_ORDER) {
      const transitions = getAllowedTransitions(state);
      for (const t of transitions) {
        if (t.requiresRationale) {
          expect(t.requiresRationale).toBe(true);
        }
      }
    }
  });

  it('lock transitions (to: locked) require rationale', () => {
    for (const state of APPROVAL_STATES_IN_ORDER) {
      const transitions = getAllowedTransitions(state);
      const lockTransitions = transitions.filter((t) => t.to === 'locked');
      for (const t of lockTransitions) {
        expect(t.requiresRationale).toBe(true);
      }
    }
  });

  it('supersede transitions (to: superseded) require rationale', () => {
    for (const state of APPROVAL_STATES_IN_ORDER) {
      const transitions = getAllowedTransitions(state);
      const supersedeTransitions = transitions.filter(
        (t) => t.to === 'superseded',
      );
      for (const t of supersedeTransitions) {
        expect(t.requiresRationale).toBe(true);
      }
    }
  });

  it('pending_review state has transitions to approved and rejected', () => {
    const transitions = getAllowedTransitions('pending_review');
    const toStates = transitions.map((t) => t.to);
    expect(toStates).toContain('approved');
    expect(toStates).toContain('rejected');
  });

  it('approved state has transitions to locked and superseded', () => {
    const transitions = getAllowedTransitions('approved');
    const toStates = transitions.map((t) => t.to);
    expect(toStates).toContain('locked');
    expect(toStates).toContain('superseded');
  });

  it('all transitions have a non-empty auditBasis', () => {
    for (const state of APPROVAL_STATES_IN_ORDER) {
      const transitions = getAllowedTransitions(state);
      for (const t of transitions) {
        expect(typeof t.auditBasis).toBe('string');
        expect(t.auditBasis.length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic — repeated calls return byte-equal output', () => {
    for (const state of APPROVAL_STATES_IN_ORDER) {
      const a = getAllowedTransitions(state);
      const b = getAllowedTransitions(state);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });
});

// ---------------------------------------------------------------------
// Canonical tuple re-exports
// ---------------------------------------------------------------------

describe('canonical type tuples', () => {
  it('APPROVAL_STATES_IN_ORDER covers all six states', () => {
    expect(APPROVAL_STATES_IN_ORDER).toEqual([
      'draft',
      'pending_review',
      'approved',
      'rejected',
      'superseded',
      'locked',
    ]);
  });

  it('LOCK_REASONS_IN_ORDER covers all four reasons', () => {
    expect(LOCK_REASONS_IN_ORDER).toEqual([
      'approved_final',
      'board_presented',
      'client_signed_off',
      'archived',
    ]);
  });

  it('SUPERSEDE_REASONS_IN_ORDER covers all four reasons', () => {
    expect(SUPERSEDE_REASONS_IN_ORDER).toEqual([
      'updated_evidence',
      'scope_change',
      'corrected_error',
      'strategic_pivot',
    ]);
  });

  it('REVIEWER_ROLES_IN_ORDER covers all five roles', () => {
    expect(REVIEWER_ROLES_IN_ORDER).toEqual([
      'maestro',
      'steward',
      'client_sponsor',
      'cxo_sponsor',
      'external_reviewer',
    ]);
  });

  it('APPROVAL_BLOCKERS_IN_ORDER covers all five blockers', () => {
    expect(APPROVAL_BLOCKERS_IN_ORDER).toEqual([
      'missing_evidence',
      'unresolved_risk',
      'pending_review',
      'locked_by_prior',
      'needs_sponsor_signoff',
    ]);
  });
});

// ---------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------

describe('module hygiene', () => {
  it('manifest is deterministic across two calls', () => {
    const a = buildDeliverableApprovalFlowManifest();
    const b = buildDeliverableApprovalFlowManifest();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('no deliverable has a fabricated E-### citation token in auditBasis', () => {
    const manifest = buildDeliverableApprovalFlowManifest();
    const allAuditBases = manifest.deliverables.map((d) => d.auditBasis).join(' ');
    expect(allAuditBases).not.toMatch(/E-\d{2,}/);
  });

  it('no deliverable has a https:// URL in auditBasis', () => {
    const manifest = buildDeliverableApprovalFlowManifest();
    for (const d of manifest.deliverables) {
      expect(d.auditBasis).not.toContain('https://');
    }
  });
});
