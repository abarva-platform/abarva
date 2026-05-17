// Outcome pattern feedback · Wave 3, Slice 3.6 · builder + anonymize tests.

import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger';
import {
  anonymizeOutcomeFeedback,
  anonymizeOutcomeFeedbackBatch,
  buildOutcomePatternFeedback,
  buildOutcomePatternFeedbackBatch,
  isResolvedOutcome,
  OUTCOME_FEEDBACK_SCHEMA_VERSION,
} from '../index';

/** A baseline ledger row; override per test. */
function row(overrides: Partial<OutcomeLedgerRow> = {}): OutcomeLedgerRow {
  return {
    id: 'entry-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: 'apexretail',
    clientId: 'client-uuid-1',
    subjectKind: 'move',
    subjectRef: 'MOVE-42',
    subjectLabel: 'Contact Center AI rollout',
    valueRung: 'measured_in_production',
    valueCategory: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedAmount: 100,
    realizedAmount: 100,
    baselineAmount: 0,
    counterfactualConfidence: 'medium',
    governanceReviewStatus: 'approved',
    measurementOwnerRole: 'cfo',
    evidencePointer: 'EVID3-1',
    evidenceClaimIds: ['EVID3-1'],
    note: 'sensitive internal note',
    recordedBy: 'user-99',
    recordedAt: '2026-05-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('isResolvedOutcome', () => {
  it('is true for terminal rungs', () => {
    for (const r of [
      'measured_in_pilot',
      'measured_in_production',
      'declined',
    ] as const) {
      expect(isResolvedOutcome(row({ valueRung: r }))).toBe(true);
    }
  });

  it('is false for non-terminal rungs', () => {
    for (const r of [
      'projected_only',
      'baseline_pending',
      'baseline_set',
      'in_pilot_measurement',
    ] as const) {
      expect(isResolvedOutcome(row({ valueRung: r }))).toBe(false);
    }
  });
});

describe('buildOutcomePatternFeedback', () => {
  it('returns null for an unresolved outcome', () => {
    expect(buildOutcomePatternFeedback(row({ valueRung: 'baseline_set' }))).toBeNull();
  });

  it('builds an on_target record when realized matches projection', () => {
    const fb = buildOutcomePatternFeedback(
      row({ projectedAmount: 100, realizedAmount: 100 }),
    );
    expect(fb).not.toBeNull();
    expect(fb!.outcomeArchetype).toBe('on_target');
    expect(fb!.deltaBucket).toBe('near');
    expect(fb!.deltaSign).toBe(0);
    expect(fb!.deltaAbs).toBe(0);
    expect(fb!.deltaRatio).toBe(1);
    expect(fb!.feedbackSchemaVersion).toBe(OUTCOME_FEEDBACK_SCHEMA_VERSION);
  });

  it('classifies a strong overdelivery', () => {
    const fb = buildOutcomePatternFeedback(
      row({ projectedAmount: 100, realizedAmount: 200 }),
    )!;
    expect(fb.outcomeArchetype).toBe('overdelivered');
    expect(fb.deltaBucket).toBe('far_above');
    expect(fb.deltaSign).toBe(1);
    expect(fb.deltaAbs).toBe(100);
  });

  it('classifies an underdelivery', () => {
    const fb = buildOutcomePatternFeedback(
      row({ projectedAmount: 100, realizedAmount: 70 }),
    )!;
    expect(fb.outcomeArchetype).toBe('underdelivered');
    expect(fb.deltaBucket).toBe('below');
    expect(fb.deltaSign).toBe(-1);
  });

  it('treats a declined outcome as the declined archetype', () => {
    const fb = buildOutcomePatternFeedback(
      row({ valueRung: 'declined', realizedAmount: null }),
    )!;
    expect(fb.outcomeArchetype).toBe('declined');
    expect(fb.outcomeRung).toBe('declined');
    expect(fb.deltaBucket).toBe('not_applicable');
    expect(fb.deltaAbs).toBeNull();
    expect(fb.deltaRatio).toBeNull();
    expect(fb.deltaSign).toBe(0);
  });

  it('handles a non-computable delta (zero projection) as on_target', () => {
    const fb = buildOutcomePatternFeedback(
      row({ projectedAmount: 0, realizedAmount: 50 }),
    )!;
    expect(fb.deltaBucket).toBe('not_applicable');
    expect(fb.outcomeArchetype).toBe('on_target');
  });

  it('carries the decision shape but no labels or notes', () => {
    const fb = buildOutcomePatternFeedback(row())!;
    expect(fb.decisionShape).toEqual({
      subjectKind: 'move',
      valueCategory: 'cost_avoidance',
      measurementUnit: 'usd_seed',
    });
    // No field on the record carries the label / note / evidence / user.
    const serialized = JSON.stringify(fb);
    expect(serialized).not.toContain('Contact Center AI');
    expect(serialized).not.toContain('sensitive internal note');
    expect(serialized).not.toContain('user-99');
  });
});

describe('buildOutcomePatternFeedbackBatch', () => {
  it('skips unresolved rows and preserves order', () => {
    const records = buildOutcomePatternFeedbackBatch([
      row({ id: 'a', valueRung: 'measured_in_pilot' }),
      row({ id: 'b', valueRung: 'baseline_set' }),
      row({ id: 'c', valueRung: 'declined', realizedAmount: null }),
    ]);
    expect(records.map((r) => r.sourceEntryId)).toEqual(['a', 'c']);
  });
});

describe('anonymizeOutcomeFeedback', () => {
  it('drops every re-identifying field', () => {
    const fb = buildOutcomePatternFeedback(row())!;
    const anon = anonymizeOutcomeFeedback(fb);
    const keys = Object.keys(anon);
    expect(keys).not.toContain('tenantClientKey');
    expect(keys).not.toContain('clientId');
    expect(keys).not.toContain('sourceEntryId');
    // The tenant slug must not survive anywhere in the projection.
    expect(JSON.stringify(anon)).not.toContain('apexretail');
    expect(JSON.stringify(anon)).not.toContain('client-uuid-1');
  });

  it('drops raw figures, keeping only coarsened bands', () => {
    const fb = buildOutcomePatternFeedback(
      row({ projectedAmount: 100, realizedAmount: 137 }),
    )!;
    const anon = anonymizeOutcomeFeedback(fb);
    const keys = Object.keys(anon);
    expect(keys).not.toContain('projectedAmount');
    expect(keys).not.toContain('realizedAmount');
    expect(keys).not.toContain('deltaAbs');
    expect(keys).not.toContain('deltaRatio');
    expect(anon.deltaBucket).toBe('above');
    expect(anon.outcomeArchetype).toBe('overdelivered');
  });

  it('anonymizes a batch preserving order', () => {
    const records = buildOutcomePatternFeedbackBatch([
      row({ id: 'a' }),
      row({ id: 'b', projectedAmount: 100, realizedAmount: 10 }),
    ]);
    const anon = anonymizeOutcomeFeedbackBatch(records);
    expect(anon).toHaveLength(2);
    expect(anon[1].deltaBucket).toBe('far_below');
  });
});
