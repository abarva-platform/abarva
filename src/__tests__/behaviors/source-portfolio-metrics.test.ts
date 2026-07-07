/**
 * Trust Gate — the automated guard for the audit's Tier-0 finding.
 *
 * Background (reports/2026-06-03-source-simplicity-audit/): the same Apex tenant
 * reported 3 events / $74.0M on the Events surface and 2 events / $39.0M on the
 * Portfolio surface, because each surface filtered and summed the raw event list
 * its own way. A CXO who sees two portfolio values one click apart trusts
 * neither. These tests assert there is now exactly ONE way to count Source
 * events — `computeSourcePortfolioMetrics` — and that the legacy unfiltered
 * counting it replaced would have produced the discrepancy this catches.
 */

import {
  computePortfolioKpis,
  type PortfolioKpis,
} from '@/lib/source/portfolio-filtering';
import {
  computeSourcePortfolioMetrics,
  selectVisibleSourceEvents,
} from '@/lib/source/portfolio-metrics';
import type { SourcingEventSummary } from '@/lib/source/types';

function makeEvent(
  overrides: Partial<SourcingEventSummary> & Pick<SourcingEventSummary, 'code'>,
): SourcingEventSummary {
  return {
    id: `evt-${overrides.code}`,
    name: `Event ${overrides.code}`,
    accountName: 'Apex Retail',
    leadAgent: 'Sentinel',
    archetype: 'managed_service',
    rigor: 'strategic',
    status: 'active',
    statusLabel: 'Active',
    priority: 'high',
    currentStageKey: 'bafo',
    currentStageLabel: 'BAFO',
    openAlerts: 0,
    owner: 'CIO Office',
    agingDays: 1,
    blocker: null,
    nextAction: 'Continue Source workflow',
    isAtRisk: false,
    valueAtStakeUsd: 0,
    projectedValueUsd: 0,
    realizedValueUsd: 0,
    nextDecision: '',
    ...overrides,
  };
}

describe('canonical Source portfolio metrics (Trust Gate)', () => {
  it('excludes E2E / test-artifact events from counts and value', () => {
    const raw = [
      makeEvent({ code: 'SRC-001', valueAtStakeUsd: 35_000_000 }),
      makeEvent({ code: 'E2E-CRAWL-001', valueAtStakeUsd: 99_000_000 }),
      makeEvent({ code: 'SRC-PW', name: 'playwright smoke', valueAtStakeUsd: 12_000_000 }),
    ];
    const { metrics } = computeSourcePortfolioMetrics(raw);
    expect(metrics.total).toBe(1);
    expect(metrics.openValueUsd).toBe(35_000_000);
  });

  it('dedupes by event code, keeping the more-advanced stage', () => {
    const raw = [
      makeEvent({ code: 'SRC-004', currentStageKey: 'strategy', valueAtStakeUsd: 35_000_000 }),
      makeEvent({ code: 'SRC-004', currentStageKey: 'bafo', valueAtStakeUsd: 35_000_000 }),
    ];
    const visible = selectVisibleSourceEvents(raw);
    expect(visible).toHaveLength(1);
    expect(visible[0].currentStageKey).toBe('bafo');
    expect(computeSourcePortfolioMetrics(raw).metrics.total).toBe(1);
  });

  it('excludes completed/archived events from open value', () => {
    const raw = [
      makeEvent({ code: 'SRC-001', status: 'active', valueAtStakeUsd: 35_000_000 }),
      makeEvent({ code: 'SRC-002', status: 'completed', valueAtStakeUsd: 20_000_000 }),
      makeEvent({ code: 'SRC-003', status: 'archived', valueAtStakeUsd: 10_000_000 }),
    ];
    const { metrics } = computeSourcePortfolioMetrics(raw);
    expect(metrics.total).toBe(3);
    expect(metrics.openValueUsd).toBe(35_000_000);
  });

  it('reports the oldest non-completed stage age', () => {
    const raw = [
      makeEvent({ code: 'SRC-001', status: 'active', agingDays: 3 }),
      makeEvent({ code: 'SRC-002', status: 'waiting_on_client', agingDays: 8 }),
      makeEvent({ code: 'SRC-003', status: 'completed', agingDays: 40 }),
    ];
    expect(computeSourcePortfolioMetrics(raw).metrics.oldestStageAgeDays).toBe(8);
  });

  it('is idempotent on the visible-event selection', () => {
    const raw = [
      makeEvent({ code: 'SRC-001' }),
      makeEvent({ code: 'E2E-CRAWL-x' }),
      makeEvent({ code: 'SRC-001' }),
    ];
    const once = selectVisibleSourceEvents(raw);
    const twice = selectVisibleSourceEvents(once);
    expect(twice).toEqual(once);
  });

  describe('one source of truth — surfaces cannot disagree', () => {
    // A realistic Apex-shaped tenant: one real active event, one completed
    // event, plus a duplicate row and a test artifact the seed loader left
    // behind — exactly the conditions that produced 3/$74M vs 2/$39M.
    const raw = [
      makeEvent({ code: 'SRC-001', status: 'active', valueAtStakeUsd: 4_000_000 }),
      makeEvent({ code: 'SRC-004', status: 'active', valueAtStakeUsd: 35_000_000 }),
      makeEvent({ code: 'SRC-004', status: 'active', valueAtStakeUsd: 35_000_000 }), // dup row
      makeEvent({ code: 'SRC-OLD', status: 'completed', valueAtStakeUsd: 35_000_000 }),
      makeEvent({ code: 'E2E-CRAWL-9', status: 'active', valueAtStakeUsd: 99_000_000 }),
    ];

    it('the canonical metrics match computePortfolioKpis on the canonical visible set', () => {
      const { metrics } = computeSourcePortfolioMetrics(raw);
      const kpis: PortfolioKpis = computePortfolioKpis(selectVisibleSourceEvents(raw));
      expect(metrics.total).toBe(kpis.total);
      expect(metrics.openValueUsd).toBe(kpis.valueAtStakeUsd);
      expect(metrics.active).toBe(kpis.active);
      expect(metrics.waiting).toBe(kpis.waiting);
    });

    it('the canonical answer is the correct, de-duplicated one (3 events, $39M)', () => {
      const { metrics } = computeSourcePortfolioMetrics(raw);
      expect(metrics.total).toBe(3); // SRC-001, SRC-004 (deduped), SRC-OLD — artifact dropped
      expect(metrics.openValueUsd).toBe(39_000_000); // 4M + 35M; completed + dup + artifact excluded
    });

    it('proves the legacy unfiltered counting drifted (the bug this prevents)', () => {
      // What the Events surface used to do: count and sum the RAW array.
      const legacyTotal = raw.length;
      const legacyValue = raw.reduce((sum, e) => sum + e.valueAtStakeUsd, 0);
      const { metrics } = computeSourcePortfolioMetrics(raw);
      // Legacy saw 5 events / $208M; canonical sees 3 / $39M. They MUST differ —
      // that gap is precisely the cross-surface inconsistency now eliminated.
      expect(legacyTotal).not.toBe(metrics.total);
      expect(legacyValue).not.toBe(metrics.openValueUsd);
    });
  });
});
