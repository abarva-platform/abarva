import {
  buildPricingNormalizationModel,
  PricingTower,
  PricingRole,
  NormalizedLineStatus,
  PricingNormalizationModelResult,
} from '../../../lib/source/pricing-normalization-model';

const TOWERS: PricingTower[] = [
  'infrastructure', 'application_management', 'service_desk',
  'security', 'governance', 'transition', 'transformation', 'other',
];

const ROLES: PricingRole[] = [
  'delivery_manager', 'architect', 'senior_engineer', 'engineer',
  'analyst', 'sme', 'executive_sponsor', 'other',
];

const LINE_STATUSES: NormalizedLineStatus[] = [
  'comparable', 'needs_clarification', 'excluded', 'split_required',
];

const testInput = {
  eventId: 'evt-pricing-test',
  eventName: 'Pricing Test Event',
  vendors: [
    { vendorId: 'vendor-a', vendorName: 'Vendor Alpha', totalQuotedCost: 1_000_000, currency: 'USD' },
    { vendorId: 'vendor-b', vendorName: 'Vendor Beta', totalQuotedCost: 900_000, currency: 'USD' },
  ],
};

describe('pricing-normalization-model - PricingTower vocabulary', () => {
  it('defines at least 6 tower types', () => {
    expect(TOWERS.length).toBeGreaterThanOrEqual(6);
  });

  it('includes infrastructure and application_management', () => {
    expect(TOWERS).toContain('infrastructure');
    expect(TOWERS).toContain('application_management');
  });
});

describe('pricing-normalization-model - PricingRole vocabulary', () => {
  it('defines at least 6 role types', () => {
    expect(ROLES.length).toBeGreaterThanOrEqual(6);
  });

  it('includes engineer and delivery_manager', () => {
    expect(ROLES).toContain('engineer');
    expect(ROLES).toContain('delivery_manager');
  });
});

describe('pricing-normalization-model - buildPricingNormalizationModel', () => {
  let result: PricingNormalizationModelResult;

  beforeAll(() => {
    result = buildPricingNormalizationModel(testInput);
  });

  it('returns correct eventId and eventName', () => {
    expect(result.eventId).toBe('evt-pricing-test');
    expect(result.eventName).toBe('Pricing Test Event');
  });

  it('sets generatedAt to 2026-04-26', () => {
    expect(result.generatedAt).toBe('2026-04-26');
  });

  it('sets modelVersion to 1.0', () => {
    expect(result.modelVersion).toBe('1.0');
  });

  it('returns lines array', () => {
    expect(Array.isArray(result.lines)).toBe(true);
    expect(result.lines.length).toBeGreaterThan(0);
  });

  it('every line has a valid tower', () => {
    for (const line of result.lines) {
      expect(TOWERS).toContain(line.tower);
    }
  });

  it('every line has a valid role', () => {
    for (const line of result.lines) {
      expect(ROLES).toContain(line.role);
    }
  });

  it('every line has a valid status', () => {
    for (const line of result.lines) {
      expect(LINE_STATUSES).toContain(line.status);
    }
  });

  it('every line has non-negative totalPrice', () => {
    for (const line of result.lines) {
      expect(line.totalPrice).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns one vendorSnapshot per vendor', () => {
    expect(result.vendorSnapshots).toHaveLength(2);
    const ids = result.vendorSnapshots.map((s) => s.vendorId);
    expect(ids).toContain('vendor-a');
    expect(ids).toContain('vendor-b');
  });

  it('every vendorSnapshot has towerBreakdown array', () => {
    for (const snap of result.vendorSnapshots) {
      expect(Array.isArray(snap.towerBreakdown)).toBe(true);
      expect(snap.towerBreakdown.length).toBeGreaterThan(0);
    }
  });

  it('every towerBreakdown percentOfTotal is 0-100', () => {
    for (const snap of result.vendorSnapshots) {
      for (const tb of snap.towerBreakdown) {
        expect(tb.percentOfTotal).toBeGreaterThanOrEqual(0);
        expect(tb.percentOfTotal).toBeLessThanOrEqual(100);
      }
    }
  });

  it('comparisonMatrix has towers and vendorIds', () => {
    expect(Array.isArray(result.comparisonMatrix.towers)).toBe(true);
    expect(Array.isArray(result.comparisonMatrix.vendorIds)).toBe(true);
    expect(result.comparisonMatrix.vendorIds).toContain('vendor-a');
    expect(result.comparisonMatrix.vendorIds).toContain('vendor-b');
  });

  it('is deterministic', () => {
    const r1 = buildPricingNormalizationModel(testInput);
    const r2 = buildPricingNormalizationModel(testInput);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
