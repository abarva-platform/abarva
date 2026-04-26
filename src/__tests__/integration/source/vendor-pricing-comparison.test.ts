import {
  VendorPricingComparison,
  VendorPricingComparisonTower,
  VendorPricingRank,
  VendorPricingRow,
  VendorPricingComparisonProps,
} from '../../../components/source/VendorPricingComparison';

const TOWERS: VendorPricingComparisonTower[] = [
  'infrastructure', 'application_management', 'service_desk',
  'security', 'governance', 'transition', 'transformation', 'other',
];

const RANKS: VendorPricingRank[] = ['lowest', 'mid', 'highest'];

describe('VendorPricingComparison - type shape', () => {
  it('exports VendorPricingComparison as a function', () => {
    expect(typeof VendorPricingComparison).toBe('function');
  });

  it('VendorPricingComparisonTower includes 8 values', () => {
    expect(TOWERS).toHaveLength(8);
    expect(TOWERS).toContain('infrastructure');
    expect(TOWERS).toContain('application_management');
  });

  it('VendorPricingRank includes lowest, mid, highest', () => {
    expect(RANKS).toContain('lowest');
    expect(RANKS).toContain('mid');
    expect(RANKS).toContain('highest');
  });

  it('constructs a valid VendorPricingRow', () => {
    const row: VendorPricingRow = {
      vendorId: 'vendor-a',
      vendorName: 'Vendor Alpha',
      totalNormalizedCost: 1_000_000,
      currency: 'USD',
      towerCosts: {
        infrastructure: 300_000,
        application_management: 400_000,
        service_desk: 200_000,
        governance: 100_000,
      },
      rank: 'lowest',
      deltaFromLowest: 0,
      deltaFromLowestPct: 0,
      normalizationConfidence: 'medium',
    };
    expect(row.vendorId).toBe('vendor-a');
    expect(row.rank).toBe('lowest');
    expect(row.deltaFromLowestPct).toBe(0);
  });

  it('constructs a valid VendorPricingComparisonProps with two vendors', () => {
    const vendorA: VendorPricingRow = {
      vendorId: 'vendor-a',
      vendorName: 'Vendor Alpha',
      totalNormalizedCost: 1_000_000,
      currency: 'USD',
      towerCosts: { infrastructure: 500_000, governance: 500_000 },
      rank: 'lowest',
      deltaFromLowest: 0,
      deltaFromLowestPct: 0,
      normalizationConfidence: 'high',
    };
    const vendorB: VendorPricingRow = {
      vendorId: 'vendor-b',
      vendorName: 'Vendor Beta',
      totalNormalizedCost: 1_100_000,
      currency: 'USD',
      towerCosts: { infrastructure: 600_000, governance: 500_000 },
      rank: 'highest',
      deltaFromLowest: 100_000,
      deltaFromLowestPct: 10,
      normalizationConfidence: 'medium',
    };

    const props: VendorPricingComparisonProps = {
      eventId: 'evt-comparison',
      eventName: 'Comparison Test',
      towers: ['infrastructure', 'governance'],
      vendors: [vendorA, vendorB],
      lowestCostVendorId: 'vendor-a',
      generatedAt: '2026-04-26',
    };

    expect(props.vendors).toHaveLength(2);
    expect(props.lowestCostVendorId).toBe('vendor-a');
    expect(props.towers).toHaveLength(2);
  });

  it('accepts empty vendors array', () => {
    const props: VendorPricingComparisonProps = {
      eventId: 'evt-empty',
      eventName: 'Empty Event',
      towers: [],
      vendors: [],
      lowestCostVendorId: null,
      generatedAt: '2026-04-26',
    };
    expect(props.vendors).toHaveLength(0);
    expect(props.lowestCostVendorId).toBeNull();
  });

  it('accepts optional className prop', () => {
    const props: VendorPricingComparisonProps = {
      eventId: 'evt-class',
      eventName: 'Class Test',
      towers: [],
      vendors: [],
      lowestCostVendorId: null,
      generatedAt: '2026-04-26',
      className: 'mt-4',
    };
    expect(props.className).toBe('mt-4');
  });
});
