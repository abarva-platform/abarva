import { buildPricingCompletenessView } from '../pricing-completeness-view';

describe('buildPricingCompletenessView', () => {
  it('keeps the legacy deterministic view for legacy callers', () => {
    const view = buildPricingCompletenessView('apex-retail');

    expect(view.deterministicSeed).toBe(true);
    expect(view.summary.totalVendorCount).toBe(3);
    expect(view.vendors).toHaveLength(3);
  });

  it('blocks governed foundation tenants from the Source pricing completeness fixture', () => {
    expect(() => buildPricingCompletenessView('airline-demo-new')).toThrow(
      /governed_foundation_tenant/,
    );
  });
});
