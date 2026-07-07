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

    it('does not re-advance the stage when the event has moved past strategy', () => {
      const d = evaluateSourceApprovalDecision('approve', ALL_CONFIRMED, {
        currentStageKey: 'scope',
      });
      expect(d.ok).toBe(true);
      expect(d.toState).toBe('active');
      expect(d.advanceStageTo).toBeNull();
    });

    it('leaves the stage untouched when currentStageKey is unknown', () => {
      const d = evaluateSourceApprovalDecision('approve', ALL_CONFIRMED);
      expect(d.ok).toBe(true);
      expect(d.advanceStageTo).toBeNull();
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
