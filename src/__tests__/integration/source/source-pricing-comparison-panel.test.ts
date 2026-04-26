import {
  buildPricingComparisonViewModel,
  SourcePricingComparisonContext,
  SourcePricingComparisonViewModel,
} from '../../../lib/source/source-pricing-comparison-view';
import {
  SourcePricingComparisonPanel,
  SourcePricingComparisonPanelProps,
} from '../../../components/source/SourcePricingComparisonPanel';

const twoVendorCtx: SourcePricingComparisonContext = {
  eventId: 'evt-pricing-test',
  eventName: 'Pricing Test',
  vendors: [
    { vendorId: 'vendor-a', vendorName: 'Alpha', totalQuotedCost: 1_000_000, currency: 'USD' },
    { vendorId: 'vendor-b', vendorName: 'Beta', totalQuotedCost: 900_000, currency: 'USD' },
  ],
};

describe('source-pricing-comparison-view - buildPricingComparisonViewModel', () => {
  let vm: SourcePricingComparisonViewModel;
  beforeAll(() => { vm = buildPricingComparisonViewModel(twoVendorCtx); });

  it('returns correct eventId', () => { expect(vm.normalizationResult.eventId).toBe('evt-pricing-test'); });
  it('has comparisonProps with two vendors', () => { expect(vm.comparisonProps.vendors).toHaveLength(2); });
  it('lowestCostVendorId is vendor-b (900k)', () => { expect(vm.comparisonProps.lowestCostVendorId).toBe('vendor-b'); });
  it('completenessPercent is 0-100', () => {
    expect(vm.completenessPercent).toBeGreaterThanOrEqual(0);
    expect(vm.completenessPercent).toBeLessThanOrEqual(100);
  });
  it('caveat is a non-empty string', () => { expect(vm.caveat.length).toBeGreaterThan(0); });
  it('is deterministic', () => {
    expect(JSON.stringify(buildPricingComparisonViewModel(twoVendorCtx)))
      .toBe(JSON.stringify(buildPricingComparisonViewModel(twoVendorCtx)));
  });
});

describe('SourcePricingComparisonPanel - type shape', () => {
  it('exports as a function', () => { expect(typeof SourcePricingComparisonPanel).toBe('function'); });
  it('constructs valid props', () => {
    const vm = buildPricingComparisonViewModel(twoVendorCtx);
    const props: SourcePricingComparisonPanelProps = { viewModel: vm };
    expect(props.viewModel.comparisonProps.eventId).toBe('evt-pricing-test');
  });
});
