import {
  evaluateSourceApprovalDecision,
  REQUIRED_APPROVAL_CONFIRMATIONS,
} from '../approval-decision';

const ALL_CONFIRMED = {
  strategyMemoReviewed: true,
  valueTargetConfirmed: true,
  archetypeRigorConfirmed: true,
};

describe('evaluateSourceApprovalDecision', () => {
  it('rejects an unknown action', () => {
    const d = evaluateSourceApprovalDecision('publish', ALL_CONFIRMED);
    expect(d.ok).toBe(false);
    expect(d.error).toBe('invalid_action');
  });

  describe('approve', () => {
    it('requires all three confirmations', () => {
      const d = evaluateSourceApprovalDecision('approve', {
        strategyMemoReviewed: true,
        valueTargetConfirmed: true,
        // archetypeRigorConfirmed missing
      });
      expect(d.ok).toBe(false);
      expect(d.error).toBe('confirmations_required');
      expect(d.missingConfirmations).toEqual(['archetypeRigorConfirmed']);
    });

    it('lists every missing confirmation', () => {
      const d = evaluateSourceApprovalDecision('approve', {});
      expect(d.ok).toBe(false);
      expect(d.missingConfirmations).toEqual([...REQUIRED_APPROVAL_CONFIRMATIONS]);
    });

    it('treats undefined confirmations as all-missing', () => {
      const d = evaluateSourceApprovalDecision('approve', undefined);
      expect(d.ok).toBe(false);
      expect(d.missingConfirmations).toHaveLength(3);
    });

    it('does not accept truthy-but-not-true values', () => {
      const d = evaluateSourceApprovalDecision('approve', {
        // @ts-expect-error — exercising runtime coercion guard
        strategyMemoReviewed: 'yes',
        valueTargetConfirmed: true,
        archetypeRigorConfirmed: true,
      });
      expect(d.ok).toBe(false);
      expect(d.missingConfirmations).toEqual(['strategyMemoReviewed']);
    });

    it('approves and advances strategy → scope when fully confirmed', () => {
      const d = evaluateSourceApprovalDecision('approve', ALL_CONFIRMED, {
        currentStageKey: 'strategy',
      });
      expect(d).toMatchObject({
        ok: true,
        toState: 'active',
        advanceStageTo: 'scope',
        approvalAction: 'admin_review',
      });
    });

    // Generic next-stage advance: every stage gate now advances the event to the
    // NEXT stage in SOURCE_STAGE_ORDER — no longer only strategy → scope.
    it('advances to the next stage in the canonical order for every stage', () => {
      const cases: Array<[string, string | null]> = [
        ['strategy', 'scope'],
        ['scope', 'rfp'],
        ['pricing', 'bafo'],
        ['transition', 'value'],
        ['value', null], // final stage — no further advance
        ['not_a_stage', null], // unknown — leaves the stage untouched
      ];
      for (const [currentStageKey, expected] of cases) {
        const d = evaluateSourceApprovalDecision('approve', ALL_CONFIRMED, {
          currentStageKey,
          // Every case here confirms the default (strategy) key set; the advance
          // is independent of which stage's confirmation keys are required.
        });
        expect(d.ok).toBe(true);
        expect(d.toState).toBe('active');
        expect(d.advanceStageTo).toBe(expected);
      }
    });

    it('normalizes a legacy stage key before advancing', () => {
      // 'sourcing_strategy' is a legacy alias of 'strategy' → next is 'scope'.
      const d = evaluateSourceApprovalDecision('approve', ALL_CONFIRMED, {
        currentStageKey: 'sourcing_strategy',
      });
      expect(d.ok).toBe(true);
      expect(d.advanceStageTo).toBe('scope');
    });

    it('leaves the stage untouched when currentStageKey is unknown', () => {
      const d = evaluateSourceApprovalDecision('approve', ALL_CONFIRMED);
      expect(d.ok).toBe(true);
      expect(d.advanceStageTo).toBeNull();
    });

    // Per-stage confirmation validation: the route passes the CURRENT stage's
    // keys; the decision requires exactly those.
    it('validates against the stage-specific confirmation keys when provided', () => {
      const workedKeys = ['evidenceComplete', 'exclusionsReviewed', 'stageFinal'];
      const missing = evaluateSourceApprovalDecision(
        'approve',
        { evidenceComplete: true, exclusionsReviewed: true },
        { currentStageKey: 'scope', requiredConfirmationKeys: workedKeys },
      );
      expect(missing.ok).toBe(false);
      expect(missing.error).toBe('confirmations_required');
      expect(missing.missingConfirmations).toEqual(['stageFinal']);

      const complete = evaluateSourceApprovalDecision(
        'approve',
        { evidenceComplete: true, exclusionsReviewed: true, stageFinal: true },
        { currentStageKey: 'scope', requiredConfirmationKeys: workedKeys },
      );
      expect(complete.ok).toBe(true);
      expect(complete.advanceStageTo).toBe('rfp');
    });

    it('falls back to the strategy confirmation set when no keys are provided', () => {
      const d = evaluateSourceApprovalDecision(
        'approve',
        { evidenceComplete: true },
        { currentStageKey: 'scope' },
      );
      // No requiredConfirmationKeys → defaults to the P0 strategy set, so the
      // worked-stage keys do not satisfy it.
      expect(d.ok).toBe(false);
      expect(d.missingConfirmations).toEqual([...REQUIRED_APPROVAL_CONFIRMATIONS]);
    });
  });

  describe('reject', () => {
    it('archives without needing confirmations', () => {
      const d = evaluateSourceApprovalDecision('reject', undefined);
      expect(d).toMatchObject({
        ok: true,
        toState: 'archived',
        advanceStageTo: null,
        approvalAction: 'rejected',
      });
    });
  });

  describe('send_back', () => {
    it('keeps the event waiting on the client without confirmations', () => {
      const d = evaluateSourceApprovalDecision('send_back', undefined, {
        currentStageKey: 'strategy',
      });
      expect(d).toMatchObject({
        ok: true,
        toState: 'waiting_on_client',
        advanceStageTo: null,
        approvalAction: 'sent_back',
      });
    });
  });
});
