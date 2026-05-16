// Outcome ledger · Wave 3, Slice 3.1 · view-model unit tests.
//
// Pure. No DOM, no model calls, no network, no clock.
//
// Coverage:
//
// - `rungToValueTier` maps every canonical value rung onto a tier;
//   `declined` reads as `projected`, never `verified`.
// - `toOutcomeLedgerEntryView` derives the tier, computes variance via
//   the Slice 0.3 builder, and flags evidence-backed entries.
// - `unevidencedVerifiedClaim` is true exactly when a verified-tier
//   figure carries no evidence — the inflated-claim signal.
// - `summarizeOutcomeLedger` reconciles every rollup against
//   `totalEntries`.
// - `buildOutcomeLedgerView` sorts by `recordedAt` desc, stable on id.

import {
  VALUE_READINESS_STATES,
  type ValueReadinessState,
} from '@/lib/tower/ai-value-outcome-ledger';
import type { OutcomeLedgerRow } from '@/lib/tower/outcome-ledger/types';
import {
  buildOutcomeLedgerView,
  rungToValueTier,
  summarizeOutcomeLedger,
  toOutcomeLedgerEntryView,
} from '@/lib/tower/outcome-ledger/view-model';

function row(overrides: Partial<OutcomeLedgerRow> = {}): OutcomeLedgerRow {
  return {
    id: 'ol-1',
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: 'apexretail',
    clientId: 'client-1',
    subjectKind: 'move',
    subjectRef: 'move-101',
    subjectLabel: 'Contact Center AI deflection',
    valueRung: 'projected_only',
    valueCategory: 'cost_avoidance',
    measurementUnit: 'usd_seed',
    projectedAmount: 1_000_000,
    realizedAmount: null,
    baselineAmount: null,
    counterfactualConfidence: 'low',
    governanceReviewStatus: 'not_started',
    measurementOwnerRole: 'VP Customer Experience',
    evidencePointer: null,
    evidenceClaimIds: [],
    note: null,
    recordedBy: 'svc',
    recordedAt: '2026-05-16T10:00:00.000Z',
    ...overrides,
  };
}

describe('rungToValueTier', () => {
  it('classifies every canonical value rung', () => {
    for (const rung of VALUE_READINESS_STATES) {
      expect(['projected', 'tracked', 'verified']).toContain(
        rungToValueTier(rung),
      );
    }
  });

  it('maps measured rungs to verified', () => {
    expect(rungToValueTier('measured_in_pilot')).toBe('verified');
    expect(rungToValueTier('measured_in_production')).toBe('verified');
  });

  it('maps baseline / in-pilot rungs to tracked', () => {
    expect(rungToValueTier('baseline_pending')).toBe('tracked');
    expect(rungToValueTier('baseline_set')).toBe('tracked');
    expect(rungToValueTier('in_pilot_measurement')).toBe('tracked');
  });

  it('maps projected_only and declined to projected (never verified)', () => {
    expect(rungToValueTier('projected_only')).toBe('projected');
    expect(rungToValueTier('declined')).toBe('projected');
  });
});

describe('toOutcomeLedgerEntryView', () => {
  it('computes variance when a realized amount is present', () => {
    const view = toOutcomeLedgerEntryView(
      row({
        valueRung: 'measured_in_production',
        projectedAmount: 1_000_000,
        realizedAmount: 900_000,
        evidencePointer: 'evidence/contact-center-ai-deflection',
      }),
    );
    expect(view.valueTier).toBe('verified');
    expect(view.varianceAbs).toBe(-100_000);
    expect(view.variancePercent).toBe(-10);
  });

  it('leaves variance null when the figure is unmeasured', () => {
    const view = toOutcomeLedgerEntryView(row({ realizedAmount: null }));
    expect(view.varianceAbs).toBeNull();
    expect(view.variancePercent).toBeNull();
  });

  it('marks an entry evidence-backed via pointer or claim ids', () => {
    expect(
      toOutcomeLedgerEntryView(row({ evidencePointer: 'evidence/x' }))
        .evidenceBacked,
    ).toBe(true);
    expect(
      toOutcomeLedgerEntryView(row({ evidenceClaimIds: ['claim-seed-1'] }))
        .evidenceBacked,
    ).toBe(true);
    expect(toOutcomeLedgerEntryView(row()).evidenceBacked).toBe(false);
  });

  it('flags a verified-tier figure with no evidence as unevidenced', () => {
    const flagged = toOutcomeLedgerEntryView(
      row({ valueRung: 'measured_in_pilot', evidencePointer: null }),
    );
    expect(flagged.unevidencedVerifiedClaim).toBe(true);
  });

  it('does not flag an evidence-backed verified figure', () => {
    const ok = toOutcomeLedgerEntryView(
      row({ valueRung: 'measured_in_pilot', evidencePointer: 'evidence/x' }),
    );
    expect(ok.unevidencedVerifiedClaim).toBe(false);
  });

  it('does not flag a projected-tier figure even without evidence', () => {
    expect(toOutcomeLedgerEntryView(row()).unevidencedVerifiedClaim).toBe(false);
  });
});

describe('summarizeOutcomeLedger', () => {
  it('reconciles every rollup against the entry total', () => {
    const entries = [
      row({ id: 'a', valueRung: 'projected_only', subjectKind: 'move' }),
      row({
        id: 'b',
        valueRung: 'measured_in_pilot',
        subjectKind: 'source_event',
        evidencePointer: 'evidence/b',
      }),
      row({
        id: 'c',
        valueRung: 'measured_in_production',
        subjectKind: 'use_case',
        governanceReviewStatus: 'flagged',
      }),
    ].map(toOutcomeLedgerEntryView);

    const summary = summarizeOutcomeLedger(entries);
    expect(summary.totalEntries).toBe(3);
    const sum = (rec: Record<string, number>) =>
      Object.values(rec).reduce((a, b) => a + b, 0);
    expect(sum(summary.byValueTier)).toBe(3);
    expect(sum(summary.byCategory)).toBe(3);
    expect(sum(summary.bySubjectKind)).toBe(3);
  });

  it('counts unevidenced verified claims and flagged governance rows', () => {
    const entries = [
      // verified, no evidence -> unevidenced
      row({ id: 'a', valueRung: 'measured_in_production' }),
      // verified, evidence -> not unevidenced
      row({
        id: 'b',
        valueRung: 'measured_in_pilot',
        evidencePointer: 'evidence/b',
        governanceReviewStatus: 'flagged',
      }),
    ].map(toOutcomeLedgerEntryView);

    const summary = summarizeOutcomeLedger(entries);
    expect(summary.unevidencedVerifiedCount).toBe(1);
    expect(summary.flaggedGovernanceCount).toBe(1);
  });

  it('exposes all canonical keys with zero counts on an empty ledger', () => {
    const summary = summarizeOutcomeLedger([]);
    expect(summary.totalEntries).toBe(0);
    expect(summary.byValueTier).toEqual({
      projected: 0,
      tracked: 0,
      verified: 0,
    });
    expect(Object.keys(summary.byCategory)).toHaveLength(7);
    expect(Object.keys(summary.bySubjectKind)).toHaveLength(4);
  });
});

describe('buildOutcomeLedgerView', () => {
  it('sorts entries by recordedAt descending, stable on id', () => {
    const rows: OutcomeLedgerRow[] = [
      row({ id: 'older', recordedAt: '2026-05-10T00:00:00.000Z' }),
      row({ id: 'newer', recordedAt: '2026-05-16T00:00:00.000Z' }),
      row({ id: 'tie-b', recordedAt: '2026-05-12T00:00:00.000Z' }),
      row({ id: 'tie-a', recordedAt: '2026-05-12T00:00:00.000Z' }),
    ];
    const view = buildOutcomeLedgerView('apexretail', rows);
    expect(view.entries.map((e) => e.id)).toEqual([
      'newer',
      'tie-a',
      'tie-b',
      'older',
    ]);
    expect(view.tenantClientKey).toBe('apexretail');
    expect(view.summary.totalEntries).toBe(4);
  });

  it('returns an empty, reconciled view for no rows', () => {
    const view = buildOutcomeLedgerView('meridian', []);
    expect(view.entries).toEqual([]);
    expect(view.summary.totalEntries).toBe(0);
  });
});

// Type-only guard: every value rung is handled by rungToValueTier.
const _exhaustive: ValueReadinessState = 'projected_only';
void _exhaustive;
