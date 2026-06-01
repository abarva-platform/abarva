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
  urgencyFromDays,
} from '../detectors';
import { bundleDecisionItems } from '../bundle';
import { buildSourceDecisionQueue, compareDecisionBundles } from '../queue';

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

describe('urgencyFromDays — truthful, calendar-anchored bands (FIX 3)', () => {
  it('maps overdue / due-today to due_now', () => {
    expect(urgencyFromDays(-5)).toBe('due_now');
    expect(urgencyFromDays(0)).toBe('due_now');
  });

  it('maps 1..14 days to next_14_days', () => {
    expect(urgencyFromDays(1)).toBe('next_14_days');
    expect(urgencyFromDays(14)).toBe('next_14_days');
  });

  it('a 26-day renewal lands in next_45_days — never the misleading "this week"', () => {
    expect(urgencyFromDays(26)).toBe('next_45_days');
    expect(urgencyFromDays(45)).toBe('next_45_days');
  });

  it('maps 46..90 days to next_90_days', () => {
    expect(urgencyFromDays(46)).toBe('next_90_days');
    expect(urgencyFromDays(90)).toBe('next_90_days');
  });

  it('maps beyond 90 days to watch', () => {
    expect(urgencyFromDays(91)).toBe('watch');
    expect(urgencyFromDays(250)).toBe('watch');
  });
});

describe('detectRenewals', () => {
  it('surfaces a renewal within the horizon', () => {
    const items = detectRenewals(
      input({ contracts: [contract({ contractId: 'vc:a', termEndDate: isoOffset(10) })] }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('renewal');
    expect(items[0].urgency).toBe('next_14_days');
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
    // 70 - 60 = 10 days to deadline -> next_14_days band.
    expect(items[0].urgency).toBe('next_14_days');
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
    expect(items[0].deepLink).toBe('/source/new?intent=renewal');
    expect(items[0].deepLink).not.toBe('/setup/source');
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

describe('bundleDecisionItems — one card per contract (FIX 2)', () => {
  it('folds renewal + notice-window + savings on the same contract into ONE bundle', () => {
    // A contract that is simultaneously: auto-renewing with a closing notice
    // window, near term-end, and over benchmark — three detector hits.
    const c = contract({
      contractId: 'vc:servicenow',
      vendorName: 'ServiceNow',
      product: 'ITSM',
      category: 'itsm',
      annualSpendUsd: 690_000,
      termEndDate: isoOffset(40),
      autoRenew: true,
      noticePeriodDays: 27, // 40 - 27 = 13 days to notice deadline
    });
    const fin: FinancialLineInput = {
      recordId: 'fin:itsm',
      category: 'itsm',
      annualBudgetUsd: 500_000,
      benchmarkUsd: 500_000,
    };
    const queue = buildSourceDecisionQueue(
      input({ contracts: [c], financials: [fin] }),
    );
    expect(queue.bundles).toHaveLength(1);
    const bundle = queue.bundles[0];
    expect(bundle.contractId).toBe('vc:servicenow');
    expect(bundle.vendorName).toBe('ServiceNow');
    // All three detector hits live inside the one bundle as sub-issues.
    const kinds = bundle.subIssues.map((s) => s.kind).sort();
    expect(kinds).toEqual(['notice_window', 'renewal', 'savings_opportunity']);
    // Headline carries the posture chip.
    expect(bundle.headline).toContain('posture: renegotiate');
  });

  it('keeps separate contracts in separate bundles', () => {
    const queue = buildSourceDecisionQueue(
      input({
        contracts: [
          contract({ contractId: 'vc:a', category: 'cat_a', termEndDate: isoOffset(10) }),
          contract({ contractId: 'vc:b', category: 'cat_b', termEndDate: isoOffset(20) }),
        ],
      }),
    );
    expect(queue.bundles).toHaveLength(2);
    expect(queue.bundles.map((b) => b.bundleId).sort()).toEqual([
      'bundle:vc:a',
      'bundle:vc:b',
    ]);
  });

  it('bundle urgency is the most-urgent band across its sub-issues', () => {
    // Renewal far out (next_45_days) but a closing notice window (next_14_days).
    const c = contract({
      contractId: 'vc:mix',
      termEndDate: isoOffset(40),
      autoRenew: true,
      noticePeriodDays: 30, // 40 - 30 = 10 days -> next_14_days
    });
    const bundles = bundleDecisionItems(
      'apexretail',
      [
        ...detectRenewals(input({ contracts: [c] })),
        ...detectNoticeWindows(input({ contracts: [c] })),
      ],
      AS_OF.toISOString(),
    );
    expect(bundles).toHaveLength(1);
    expect(bundles[0].urgency).toBe('next_14_days');
  });

  it('value at stake is the max quantified sub-issue, not a double-counted sum', () => {
    const c = contract({
      contractId: 'vc:val',
      category: 'crm',
      annualSpendUsd: 600_000,
      termEndDate: isoOffset(40),
    });
    const fin: FinancialLineInput = {
      recordId: 'fin:crm',
      category: 'crm',
      annualBudgetUsd: 400_000,
      benchmarkUsd: 400_000,
    };
    const queue = buildSourceDecisionQueue(
      input({ contracts: [c], financials: [fin] }),
    );
    expect(queue.bundles).toHaveLength(1);
    // renewal ACV = 600K, savings overspend = 200K -> max is 600K, not 800K.
    expect(queue.bundles[0].valueAtStakeUsd).toBe(600_000);
  });
});

describe('buildSourceDecisionQueue ordering & determinism', () => {
  it('sorts by urgency then value-at-stake, deterministically', () => {
    const queue = buildSourceDecisionQueue(
      input({
        contracts: [
          contract({ contractId: 'vc:soon-small', category: 'cat_a', termEndDate: isoOffset(10), annualSpendUsd: 100_000 }),
          contract({ contractId: 'vc:soon-big', category: 'cat_b', termEndDate: isoOffset(12), annualSpendUsd: 900_000 }),
          contract({ contractId: 'vc:later', category: 'cat_c', termEndDate: isoOffset(60), annualSpendUsd: 500_000 }),
        ],
      }),
    );
    const ids = queue.bundles.map((b) => b.bundleId);
    // Both 'next_14_days' bundles first, bigger value first; then 'next_90_days'.
    expect(ids).toEqual([
      'bundle:vc:soon-big',
      'bundle:vc:soon-small',
      'bundle:vc:later',
    ]);
  });

  it('is fully deterministic — same input yields identical output', () => {
    const build = () =>
      buildSourceDecisionQueue(
        input({
          contracts: [
            contract({ contractId: 'vc:a', category: 'cat_a', termEndDate: isoOffset(10) }),
            contract({ contractId: 'vc:b', category: 'cat_b', termEndDate: isoOffset(20) }),
          ],
        }),
      );
    expect(JSON.stringify(build())).toEqual(JSON.stringify(build()));
  });

  it('is never empty-and-silent — empty queue carries an emptyState line', () => {
    const queue = buildSourceDecisionQueue(input({ contracts: [] }));
    expect(queue.bundles).toHaveLength(0);
    expect(queue.emptyState).toBeTruthy();
    expect(typeof queue.emptyState).toBe('string');
  });

  it('reports band counts that match the bundles', () => {
    const queue = buildSourceDecisionQueue(
      input({ contracts: [contract({ contractId: 'vc:x', termEndDate: isoOffset(8) })] }),
    );
    const total = Object.values(queue.bandCounts).reduce((s, n) => s + n, 0);
    expect(total).toBe(queue.bundles.length);
  });

  it('comparator gives a stable total order via bundleId tie-break', () => {
    const a = { bundleId: 'a', urgency: 'due_now', valueAtStakeUsd: null } as never;
    const b = { bundleId: 'b', urgency: 'due_now', valueAtStakeUsd: null } as never;
    expect(compareDecisionBundles(a, b)).toBeLessThan(0);
    expect(compareDecisionBundles(b, a)).toBeGreaterThan(0);
  });
});
