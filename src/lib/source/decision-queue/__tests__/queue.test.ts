import type {
  DecisionQueueInput,
  FinancialLineInput,
  SegmentFreshnessInput,
  VendorContractInput,
} from '../detector-inputs';
import {
  detectBlockedEvidence,
  detectNoticeWindows,
  detectOverlapShelfware,
  detectRenewals,
  detectSavingsOpportunities,
} from '../detectors';
import { buildSourceDecisionQueue, compareDecisionItems } from '../queue';

// Fixed clock so every test is deterministic.
const AS_OF = new Date('2026-05-17T00:00:00Z');

function isoOffset(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: 'vc:base',
    vendorName: 'BaseVendor',
    product: 'Base Product',
    category: 'base_category',
    annualSpendUsd: 500_000,
    termEndDate: isoOffset(60),
    autoRenew: false,
    noticePeriodDays: null,
    utilizationRate: 0.9,
    criticality: 'medium',
    ...overrides,
  };
}

function input(overrides: Partial<DecisionQueueInput> = {}): DecisionQueueInput {
  return {
    clientKey: 'apexretail',
    contracts: [],
    financials: [],
    segmentFreshness: [],
    asOf: AS_OF,
    ...overrides,
  };
}

describe('detectRenewals', () => {
  it('surfaces a renewal within the horizon', () => {
    const items = detectRenewals(
      input({ contracts: [contract({ contractId: 'vc:a', termEndDate: isoOffset(10) })] }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('renewal');
    expect(items[0].urgency).toBe('today');
    expect(items[0].deepLink).toBe('/source/renewal/vc%3Aa');
  });

  it('does not fabricate a card when there is no term-end date (no fabrication)', () => {
    const items = detectRenewals(
      input({ contracts: [contract({ termEndDate: null })] }),
    );
    expect(items).toHaveLength(0);
  });

  it('ignores contracts far outside the horizon', () => {
    const items = detectRenewals(
      input({ contracts: [contract({ termEndDate: isoOffset(400) })] }),
    );
    expect(items).toHaveLength(0);
  });
});

describe('detectNoticeWindows', () => {
  it('flags an auto-renewing contract with a closing notice window', () => {
    const items = detectNoticeWindows(
      input({
        contracts: [
          contract({
            contractId: 'vc:auto',
            autoRenew: true,
            noticePeriodDays: 60,
            termEndDate: isoOffset(70),
          }),
        ],
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('notice_window');
    // 70 - 60 = 10 days to deadline -> today band.
    expect(items[0].urgency).toBe('today');
  });

  it('emits no card when the contract does not auto-renew (no fabrication)', () => {
    const items = detectNoticeWindows(
      input({
        contracts: [contract({ autoRenew: false, noticePeriodDays: 60 })],
      }),
    );
    expect(items).toHaveLength(0);
  });

  it('emits no card when the notice period is unknown', () => {
    const items = detectNoticeWindows(
      input({
        contracts: [contract({ autoRenew: true, noticePeriodDays: null })],
      }),
    );
    expect(items).toHaveLength(0);
  });
});

describe('detectOverlapShelfware', () => {
  it('flags two contracts sharing a category as an overlap', () => {
    const items = detectOverlapShelfware(
      input({
        contracts: [
          contract({ contractId: 'vc:crm-1', category: 'crm', utilizationRate: 0.9 }),
          contract({ contractId: 'vc:crm-2', category: 'crm', utilizationRate: 0.9 }),
        ],
      }),
    );
    const overlap = items.filter((i) => i.itemId.includes('category'));
    expect(overlap).toHaveLength(1);
    expect(overlap[0].evidenceRefs).toContain('vc:crm-1');
    expect(overlap[0].evidenceRefs).toContain('vc:crm-2');
  });

  it('flags low-utilization contracts as shelfware', () => {
    const items = detectOverlapShelfware(
      input({
        contracts: [contract({ contractId: 'vc:shelf', utilizationRate: 0.3 })],
      }),
    );
    const shelfware = items.filter((i) => i.itemId.includes('shelfware:vc:shelf'));
    expect(shelfware).toHaveLength(1);
    expect(shelfware[0].valueAtStakeUsd).toBeGreaterThan(0);
  });

  it('does not flag shelfware when utilization is unmeasured (no fabrication)', () => {
    const items = detectOverlapShelfware(
      input({ contracts: [contract({ utilizationRate: null })] }),
    );
    expect(items).toHaveLength(0);
  });
});

describe('detectSavingsOpportunities', () => {
  const financial = (overrides: Partial<FinancialLineInput> = {}): FinancialLineInput => ({
    recordId: 'fin:base',
    category: 'crm',
    annualBudgetUsd: 500_000,
    benchmarkUsd: 400_000,
    ...overrides,
  });

  it('flags a contract running materially above benchmark', () => {
    const items = detectSavingsOpportunities(
      input({
        contracts: [contract({ contractId: 'vc:over', category: 'crm', annualSpendUsd: 600_000 })],
        financials: [financial()],
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('savings_opportunity');
    expect(items[0].valueAtStakeUsd).toBe(200_000);
  });

  it('emits no card when there is no benchmark (no fabrication)', () => {
    const items = detectSavingsOpportunities(
      input({
        contracts: [contract({ category: 'crm', annualSpendUsd: 600_000 })],
        financials: [financial({ benchmarkUsd: null })],
      }),
    );
    expect(items).toHaveLength(0);
  });

  it('emits no card when spend is within threshold of benchmark', () => {
    const items = detectSavingsOpportunities(
      input({
        contracts: [contract({ category: 'crm', annualSpendUsd: 420_000 })],
        financials: [financial()],
      }),
    );
    expect(items).toHaveLength(0);
  });
});

describe('detectBlockedEvidence', () => {
  it('flags blocked decisions when a segment is stale', () => {
    const fresh: SegmentFreshnessInput[] = [
      { segment: 'vendor_contracts', lastUpdated: '2024-01-01', sourceType: 'sourced' },
      { segment: 'it_financials', lastUpdated: isoOffset(-5), sourceType: 'sourced' },
    ];
    const items = detectBlockedEvidence(input({ segmentFreshness: fresh }));
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('blocked_missing_evidence');
  });

  it('emits no card when grounding is healthy (no fabrication)', () => {
    const fresh: SegmentFreshnessInput[] = [
      { segment: 'vendor_contracts', lastUpdated: isoOffset(-5), sourceType: 'sourced' },
      { segment: 'it_financials', lastUpdated: isoOffset(-5), sourceType: 'sourced' },
    ];
    const items = detectBlockedEvidence(input({ segmentFreshness: fresh }));
    expect(items).toHaveLength(0);
  });
});

describe('buildSourceDecisionQueue ordering & determinism', () => {
  it('sorts by urgency then value-at-stake, deterministically', () => {
    const queue = buildSourceDecisionQueue(
      input({
        contracts: [
          contract({ contractId: 'vc:soon-small', category: 'cat_a', termEndDate: isoOffset(10), annualSpendUsd: 100_000 }),
          contract({ contractId: 'vc:soon-big', category: 'cat_b', termEndDate: isoOffset(12), annualSpendUsd: 900_000 }),
          contract({ contractId: 'vc:later', category: 'cat_c', termEndDate: isoOffset(100), annualSpendUsd: 500_000 }),
        ],
      }),
    );
    const ids = queue.items.map((i) => i.itemId);
    // Both 'today' band items first, bigger value first; then the 'this_month'.
    expect(ids).toEqual([
      'renewal:vc:soon-big',
      'renewal:vc:soon-small',
      'renewal:vc:later',
    ]);
  });

  it('is fully deterministic — same input yields identical output', () => {
    const build = () =>
      buildSourceDecisionQueue(
        input({
          contracts: [
            contract({ contractId: 'vc:a', termEndDate: isoOffset(10) }),
            contract({ contractId: 'vc:b', termEndDate: isoOffset(20) }),
          ],
        }),
      );
    expect(JSON.stringify(build())).toEqual(JSON.stringify(build()));
  });

  it('is never empty-and-silent — empty queue carries an emptyState line', () => {
    const queue = buildSourceDecisionQueue(input({ contracts: [] }));
    expect(queue.items).toHaveLength(0);
    expect(queue.emptyState).toBeTruthy();
    expect(typeof queue.emptyState).toBe('string');
  });

  it('reports band counts that match the items', () => {
    const queue = buildSourceDecisionQueue(
      input({ contracts: [contract({ contractId: 'vc:x', termEndDate: isoOffset(8) })] }),
    );
    const total = Object.values(queue.bandCounts).reduce((s, n) => s + n, 0);
    expect(total).toBe(queue.items.length);
  });

  it('comparator gives a stable total order via itemId tie-break', () => {
    const a = { itemId: 'a', urgency: 'today', valueAtStakeUsd: null } as never;
    const b = { itemId: 'b', urgency: 'today', valueAtStakeUsd: null } as never;
    expect(compareDecisionItems(a, b)).toBeLessThan(0);
    expect(compareDecisionItems(b, a)).toBeGreaterThan(0);
  });
});
