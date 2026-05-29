// Unit tests for the Source Decision Queue read adapter.
//
// Audit P0 regression guard: the adapter must canonicalize EVERY tenant key
// before reading `data_inventory_*`. The substrate keys rows under the
// canonical slugs (`apex-retail`, `meridian-health`, `first-capital`), so a
// legacy alias (`apexretail`, `meridian`, `arcturus`) that is not mapped
// returns an empty queue. A prior local `brokerTenantKey` mapped only Apex
// and let Meridian + First Capital through unmapped — the queue went empty
// for two of three tenants. This test pins all three.

import { canonicalTenantKey } from '@/lib/tenant-keys';

// Capture every `tenant_key` value the adapter filters on.
const tenantKeyFilters: string[] = [];

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureReadFluentClient: () => {
    // A thin query-builder stub: `.from().select().eq().eq().limit()` and
    // `.from().select().eq().in()` both resolve to an empty result. Every
    // `.eq('tenant_key', value)` records the value.
    const builder: Record<string, unknown> = {};
    builder.select = () => builder;
    builder.eq = (column: string, value: string) => {
      if (column === 'tenant_key') tenantKeyFilters.push(value);
      return builder;
    };
    builder.in = () => Promise.resolve({ data: [], error: null });
    builder.limit = () => Promise.resolve({ data: [], error: null });
    return { from: () => builder };
  },
}));

import { readSourceDecisionQueueData } from '../sourceDecisionQueueReadAdapter';

describe('readSourceDecisionQueueData · tenant-key canonicalization', () => {
  beforeEach(() => {
    tenantKeyFilters.length = 0;
  });

  it.each([
    ['apexretail', 'apex-retail'],
    ['meridian', 'meridian-health'],
    ['arcturus', 'first-capital'],
  ])(
    'canonicalizes the %s client key to the substrate key %s on every read',
    async (clientKey, expectedCanonical) => {
      await readSourceDecisionQueueData(clientKey);

      // Three reads (vendor_contracts, it_financials, segments) — every one
      // must filter on the canonical key, never the legacy alias.
      expect(tenantKeyFilters.length).toBeGreaterThan(0);
      expect(tenantKeyFilters.every((k) => k === expectedCanonical)).toBe(true);
      expect(tenantKeyFilters).not.toContain(clientKey);
      expect(expectedCanonical).toBe(canonicalTenantKey(clientKey));
    },
  );

  it('passes an already-canonical key through unchanged', async () => {
    await readSourceDecisionQueueData('meridian-health');
    expect(tenantKeyFilters.every((k) => k === 'meridian-health')).toBe(true);
  });

  it('still returns a fully-shaped (empty) bundle when the substrate has no rows', async () => {
    const bundle = await readSourceDecisionQueueData('meridian');
    expect(bundle.vendorContractRecords).toEqual([]);
    expect(bundle.financialRecords).toEqual([]);
    // Freshness is always shaped for both segments, even with no data.
    expect(bundle.segmentFreshness.map((s) => s.segment)).toEqual([
      'vendor_contracts',
      'it_financials',
    ]);
    expect(bundle.segmentFreshness.every((s) => s.sourceType === 'absent')).toBe(true);
  });
});
