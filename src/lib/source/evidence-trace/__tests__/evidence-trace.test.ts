// Tests for the evidence-trace view-model.
//
// Coverage:
//  - resolution of a contract ref, a financial-line ref, a bare segment ref
//  - the "not recorded" honesty path — undated segments, no-owner contracts,
//    unresolvable refs never invent an owner or a date
//  - trust-rung propagation from the freshness model
//  - de-duplication across a ref list

import type {
  FinancialLineInput,
  VendorContractInput,
} from '@/lib/source/decision-queue/detector-inputs';
import {
  NOT_RECORDED,
  resolveEvidenceTrace,
  resolveEvidenceTraces,
  type EvidenceResolutionContext,
} from '../evidence-trace';

// Fixed clock so every age computation is deterministic.
const AS_OF = new Date('2026-05-17T00:00:00Z');

function isoDaysAgo(days: number): string {
  const d = new Date(AS_OF);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function contract(overrides: Partial<VendorContractInput> = {}): VendorContractInput {
  return {
    contractId: 'apex-vc-014',
    vendorName: 'ServiceNow',
    product: 'ITSM Platform',
    category: 'itsm',
    annualSpendUsd: 980_000,
    termEndDate: '2026-09-01',
    autoRenew: true,
    noticePeriodDays: 90,
    utilizationRate: 0.61,
    criticality: 'high',
    ownerRef: 'Priya Raman',
    ...overrides,
  };
}

function financial(overrides: Partial<FinancialLineInput> = {}): FinancialLineInput {
  return {
    recordId: 'apex-fin-itsm',
    category: 'itsm',
    annualBudgetUsd: 820_000,
    benchmarkUsd: 700_000,
    ...overrides,
  };
}

function ctx(
  overrides: Partial<EvidenceResolutionContext> = {},
): EvidenceResolutionContext {
  return {
    contracts: [contract()],
    financials: [financial()],
    segmentFreshness: [
      { segment: 'vendor_contracts', lastUpdated: isoDaysAgo(20), sourceType: 'sourced' },
      { segment: 'it_financials', lastUpdated: isoDaysAgo(40), sourceType: 'sourced' },
    ],
    asOf: AS_OF,
    ...overrides,
  };
}

describe('resolveEvidenceTrace — contract refs', () => {
  it('resolves a contract id to a grounded trace', () => {
    const t = resolveEvidenceTrace('apex-vc-014', ctx());
    expect(t.kind).toBe('contract');
    expect(t.title).toBe('ServiceNow — ITSM Platform');
    expect(t.sourceRecord).toContain('vendor_contracts');
    expect(t.sourceRecord).toContain('apex-vc-014');
    expect(t.linkedSegment).toBe('Vendor contracts');
    expect(t.owner).toBe('Priya Raman');
    expect(t.lastRefreshed).toBe(isoDaysAgo(20));
    expect(t.ageDays).toBe(20);
    // vendor_contracts cadence is 90d; 20d old → fresh → sourced rung.
    expect(t.trustRung).toBe('sourced');
    expect(t.whyUsable).toMatch(/usable/i);
  });

  it('shows "not recorded" for a contract with no owner — never invents one', () => {
    const t = resolveEvidenceTrace(
      'apex-vc-014',
      ctx({ contracts: [contract({ ownerRef: undefined })] }),
    );
    expect(t.owner).toBe(NOT_RECORDED);
  });

  it('treats a blank owner string as not recorded', () => {
    const t = resolveEvidenceTrace(
      'apex-vc-014',
      ctx({ contracts: [contract({ ownerRef: '   ' })] }),
    );
    expect(t.owner).toBe(NOT_RECORDED);
  });
});

describe('resolveEvidenceTrace — financial-line refs', () => {
  it('resolves a financial record id to a benchmark trace', () => {
    const t = resolveEvidenceTrace('apex-fin-itsm', ctx());
    expect(t.kind).toBe('financial_line');
    expect(t.sourceRecord).toContain('it_financials');
    expect(t.linkedSegment).toBe('IT financials');
    expect(t.lastRefreshed).toBe(isoDaysAgo(40));
    // it_financials cadence is 90d; 40d old → fresh → sourced.
    expect(t.trustRung).toBe('sourced');
  });

  it('never claims a per-row owner for a financial line', () => {
    const t = resolveEvidenceTrace('apex-fin-itsm', ctx());
    expect(t.owner).toBe(NOT_RECORDED);
  });
});

describe('resolveEvidenceTrace — bare segment refs', () => {
  it('resolves a bare segment name to a segment trace', () => {
    const t = resolveEvidenceTrace('vendor_contracts', ctx());
    expect(t.kind).toBe('segment');
    expect(t.linkedSegment).toBe('Vendor contracts');
    expect(t.title).toContain('context segment');
  });

  it('names no owner for a non-verified segment', () => {
    const t = resolveEvidenceTrace('it_financials', ctx());
    expect(t.owner).toBe(NOT_RECORDED);
  });

  it('reports a system-of-record owner for a verified segment without naming a person', () => {
    const t = resolveEvidenceTrace(
      'vendor_contracts',
      ctx({
        segmentFreshness: [
          {
            segment: 'vendor_contracts',
            lastUpdated: isoDaysAgo(10),
            sourceType: 'verified',
          },
          { segment: 'it_financials', lastUpdated: isoDaysAgo(40), sourceType: 'sourced' },
        ],
      }),
    );
    expect(t.trustRung).toBe('verified');
    expect(t.owner).toMatch(/system of record/i);
  });
});

describe('resolveEvidenceTrace — the "not recorded" honesty path', () => {
  it('returns an unresolved trace for an unknown ref — every field is honest', () => {
    const t = resolveEvidenceTrace('apex-vc-999-ghost', ctx());
    expect(t.kind).toBe('unresolved');
    expect(t.sourceRecord).toBe(NOT_RECORDED);
    expect(t.lastRefreshed).toBe(NOT_RECORDED);
    expect(t.owner).toBe(NOT_RECORDED);
    expect(t.linkedSegment).toBe(NOT_RECORDED);
    expect(t.trustRung).toBe('missing');
    expect(t.ageDays).toBeNull();
    expect(t.whyUsable).toMatch(/unverified/i);
  });

  it('treats an empty / whitespace ref as unresolved', () => {
    expect(resolveEvidenceTrace('', ctx()).kind).toBe('unresolved');
    expect(resolveEvidenceTrace('   ', ctx()).kind).toBe('unresolved');
  });

  it('shows "not recorded" for a refresh date when the segment is undated', () => {
    const t = resolveEvidenceTrace(
      'apex-vc-014',
      ctx({
        segmentFreshness: [
          { segment: 'vendor_contracts', lastUpdated: null, sourceType: 'sourced' },
          { segment: 'it_financials', lastUpdated: isoDaysAgo(40), sourceType: 'sourced' },
        ],
      }),
    );
    expect(t.lastRefreshed).toBe(NOT_RECORDED);
    expect(t.ageDays).toBeNull();
    expect(t.whyUsable).toMatch(/age cannot be certified/i);
  });

  it('flags a stale segment as past its refresh cadence', () => {
    // vendor_contracts staleDays is 180; 200d old → stale.
    const t = resolveEvidenceTrace(
      'apex-vc-014',
      ctx({
        segmentFreshness: [
          {
            segment: 'vendor_contracts',
            lastUpdated: isoDaysAgo(200),
            sourceType: 'sourced',
          },
          { segment: 'it_financials', lastUpdated: isoDaysAgo(40), sourceType: 'sourced' },
        ],
      }),
    );
    expect(t.trustRung).toBe('stale');
    expect(t.whyUsable).toMatch(/refresh cadence/i);
  });
});

describe('resolveEvidenceTraces — list resolution', () => {
  it('resolves and de-duplicates a mixed ref list, preserving order', () => {
    const traces = resolveEvidenceTraces(
      ['apex-vc-014', 'apex-fin-itsm', 'apex-vc-014', 'vendor_contracts'],
      ctx(),
    );
    expect(traces).toHaveLength(3);
    expect(traces.map((t) => t.kind)).toEqual([
      'contract',
      'financial_line',
      'segment',
    ]);
  });

  it('returns an empty list for an empty ref list', () => {
    expect(resolveEvidenceTraces([], ctx())).toEqual([]);
  });
});
