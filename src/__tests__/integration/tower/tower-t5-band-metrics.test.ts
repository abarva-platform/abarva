// TOWER · T-5 (Bind 1) — Band metrics view-model unit tests.
//
// Pure deterministic coverage of band-metrics-view.ts. Uses the Meridian
// Health fixture (per AI Initiatives Substrate v1.1.0 templates) so the
// computed values can be hand-checked against the spec.

import {
  buildTowerBandMetrics,
  type BandMetric,
} from '@/lib/tower/band-metrics-view';
import type {
  AIInitiative,
  AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';

const TODAY = '2026-05-07';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeInitiative(overrides: Partial<AIInitiative>): AIInitiative {
  return {
    initiativeId: 'init-id',
    displayId: 'XX-00',
    name: 'Test',
    description: '',
    primaryCategoryId: 'cat',
    primaryCategoryName: 'Cat',
    secondaryCategoryId: null,
    secondaryCategoryName: null,
    primaryGoalId: 'goal',
    primaryGoalName: 'Goal',
    stage: 'pilot',
    stageDetail: null,
    ownerName: 'Owner',
    ownerTitle: 'Title',
    ownerFunction: null,
    committedAnnualUsd: 1_000_000,
    committedTotalUsd: null,
    measuredValueUsd: 500_000,
    statusFlag: 'healthy',
    statusSummary: 'OK',
    confidenceLevel: 'HIGH',
    alignedCallout: false,
    alignedRationale: null,
    loadedViaTemplate: 'fixture',
    ...overrides,
  };
}

function makeVendor(
  overrides: Partial<AIInitiativeVendorRow>,
): AIInitiativeVendorRow {
  return {
    vendorId: 'v',
    initiativeId: 'init',
    initiativeDisplayId: 'XX-00',
    initiativeName: 'Test',
    vendorName: 'Vendor',
    contractValueUsd: 1_000_000,
    renewalDate: null,
    financialHealth: null,
    ...overrides,
  };
}

const MERIDIAN: ReadonlyArray<AIInitiative> = [
  makeInitiative({ displayId: 'MH-01', stage: 'scaled', statusFlag: 'healthy', committedAnnualUsd: 4_100_000, measuredValueUsd: 5_800_000, alignedCallout: true, confidenceLevel: 'HIGH' }),
  makeInitiative({ displayId: 'MH-02', stage: 'pilot', statusFlag: 'foundation_phase', committedAnnualUsd: 400_000, measuredValueUsd: 180_000, confidenceLevel: 'MED' }),
  makeInitiative({ displayId: 'MH-03', stage: 'pilot', statusFlag: 'duplication_risk', committedAnnualUsd: 900_000, measuredValueUsd: 380_000, confidenceLevel: 'LOW' }),
  makeInitiative({ displayId: 'MH-04', stage: 'multi_year_strategic_bet', statusFlag: 'value_lag', committedAnnualUsd: 1_300_000, measuredValueUsd: 1_400_000, alignedCallout: true, confidenceLevel: 'HIGH' }),
  makeInitiative({ displayId: 'MH-05', stage: 'scaled', statusFlag: 'healthy', committedAnnualUsd: 600_000, measuredValueUsd: 3_800_000, confidenceLevel: 'HIGH' }),
  makeInitiative({ displayId: 'MH-06', stage: 'pilot', statusFlag: 'value_lag', committedAnnualUsd: 3_200_000, measuredValueUsd: 1_400_000, confidenceLevel: 'MED' }),
  makeInitiative({ displayId: 'MH-07', stage: 'multi_year_strategic_bet', statusFlag: 'foundation_phase', committedAnnualUsd: 1_400_000, measuredValueUsd: 0, confidenceLevel: 'MED' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// Empty-state behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerBandMetrics — empty', () => {
  it('returns isEmpty: true when no initiatives provided', () => {
    const view = buildTowerBandMetrics([], [], TODAY);
    expect(view.isEmpty).toBe(true);
    expect(view.deterministicSeed).toBe(true);
  });

  it('returns five placeholder metrics with "—" values', () => {
    const view = buildTowerBandMetrics([], [], TODAY);
    expect(view.metrics).toHaveLength(5);
    for (const m of view.metrics) {
      expect(m.value).toBe('—');
      expect(m.confidence).toBe('none');
    }
  });

  it('placeholder tooltips invite substrate load', () => {
    const view = buildTowerBandMetrics([], [], TODAY);
    for (const m of view.metrics) {
      expect(m.tooltip).toMatch(/Setup → AI Initiatives/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Substrate-driven computation (Meridian fixture)
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerBandMetrics — Meridian fixture', () => {
  function pick(view: ReturnType<typeof buildTowerBandMetrics>, key: BandMetric['key']) {
    return view.metrics.find((m) => m.key === key)!;
  }

  it('isEmpty = false when initiatives provided', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(view.isEmpty).toBe(false);
  });

  it('returns exactly five metrics in band order', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(view.metrics.map((m) => m.key)).toEqual([
      'portfolio_roi',
      'active_pressures',
      'spend_at_risk',
      'renewals_90d',
      'adoption_rate',
    ]);
  });

  it('Portfolio ROI = sum(measured) ÷ sum(committed) — "1.1×" for Meridian', () => {
    // sum(measured) = 5.8 + 0.18 + 0.38 + 1.4 + 3.8 + 1.4 + 0 = 12.96M
    // sum(committed) = 4.1 + 0.4 + 0.9 + 1.3 + 0.6 + 3.2 + 1.4 = 11.9M
    // ratio = 12.96 / 11.9 ≈ 1.089 → "1.1×"
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'portfolio_roi').value).toBe('1.1×');
  });

  it('Portfolio ROI subtext shows the gap to target 3.5×', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'portfolio_roi').subtext).toMatch(/target 3.5×/);
    expect(pick(view, 'portfolio_roi').subtext).toMatch(/under/);
  });

  it('Active pressures = 3 (MH-03 dup_risk, MH-04 value_lag, MH-06 value_lag)', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'active_pressures').value).toBe('3');
  });

  it('Active pressures subtext distinguishes high vs watch by confidence level', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    // MH-04 confidence=HIGH → 1 high; MH-03 LOW + MH-06 MED → 2 watch
    expect(pick(view, 'active_pressures').subtext).toBe('1 high · 2 watch');
  });

  it('Spend at risk = $5.4M (sum committed for MH-03+MH-04+MH-06: 0.9+1.3+3.2)', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'spend_at_risk').value).toBe('$5.4M');
  });

  it('Spend at risk subtext counts pressuring initiatives', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'spend_at_risk').subtext).toBe('3 initiatives');
  });

  it('Renewals · 90d = 0 when no Meridian vendors renew before 2026-08-05', () => {
    // Meridian vendor renewal dates: 2027-06-30, 2027-04-30, 2026-12-31, 2028-06-30, 2027-12-31, 2027-01-31
    // None within 90 days of 2026-05-07 (cutoff = 2026-08-05).
    const meridianVendors: AIInitiativeVendorRow[] = [
      makeVendor({ initiativeDisplayId: 'MH-01', renewalDate: '2027-06-30' }),
      makeVendor({ initiativeDisplayId: 'MH-02', renewalDate: '2027-04-30' }),
      makeVendor({ initiativeDisplayId: 'MH-03', renewalDate: '2026-12-31' }),
      makeVendor({ initiativeDisplayId: 'MH-04', renewalDate: '2028-06-30' }),
      makeVendor({ initiativeDisplayId: 'MH-06', renewalDate: '2027-12-31' }),
    ];
    const view = buildTowerBandMetrics(MERIDIAN, meridianVendors, TODAY);
    expect(pick(view, 'renewals_90d').value).toBe('0');
    expect(pick(view, 'renewals_90d').subtext).toBe('none in 90d');
  });

  it('Renewals · 90d counts vendors whose renewal_date falls within 90 days', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ initiativeDisplayId: 'MH-X', vendorName: 'Vendor A', renewalDate: '2026-06-15', contractValueUsd: 2_000_000 }),
      makeVendor({ initiativeDisplayId: 'MH-Y', vendorName: 'Vendor B', renewalDate: '2026-07-30', contractValueUsd: 800_000 }),
      makeVendor({ initiativeDisplayId: 'MH-Z', vendorName: 'Vendor C', renewalDate: '2027-01-01' }),
    ];
    const view = buildTowerBandMetrics(MERIDIAN, vendors, TODAY);
    const renewals = pick(view, 'renewals_90d');
    expect(renewals.value).toBe('2');
    // Soonest = Vendor A (39 days from 2026-05-07 to 2026-06-15)
    expect(renewals.subtext).toMatch(/MH-X 39d/);
    expect(renewals.subtext).toMatch(/\$2\.8M/);
  });

  it('Adoption rate = % of non-foundation initiatives in scaled stage (Meridian: 2 of 4 = 50%)', () => {
    // Eligible (excludes foundation_phase + multi_year_strategic_bet):
    //   MH-01 scaled, MH-03 pilot, MH-05 scaled, MH-06 pilot = 4 eligible
    // (MH-02 foundation_phase, MH-04 multi_year_strategic_bet, MH-07 multi_year_strategic_bet excluded)
    // Scaled = MH-01, MH-05 = 2 → 2/4 = 50%
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'adoption_rate').value).toBe('50%');
    expect(pick(view, 'adoption_rate').subtext).toBe('2 of 4 scaled');
  });

  it('Adoption rate is marked LOW confidence (proxy metric until MAU integrations land)', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'adoption_rate').confidence).toBe('low');
  });

  it('All metric tooltips reference the underlying calculation', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    for (const m of view.metrics) {
      expect(m.tooltip.length).toBeGreaterThan(20);
    }
  });

  it('Portfolio ROI tooltip cites the ratio inputs', () => {
    const view = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(pick(view, 'portfolio_roi').tooltip).toMatch(/\$13\.0M/);
    expect(pick(view, 'portfolio_roi').tooltip).toMatch(/\$11\.9M/);
  });

  it('is pure — same input yields identical output', () => {
    const a = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    const b = buildTowerBandMetrics(MERIDIAN, [], TODAY);
    expect(a).toEqual(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTowerBandMetrics — edge cases', () => {
  it('handles initiatives with null measured value gracefully', () => {
    const initiatives = [
      makeInitiative({ committedAnnualUsd: 1_000_000, measuredValueUsd: null }),
    ];
    const view = buildTowerBandMetrics(initiatives, [], TODAY);
    const roi = view.metrics.find((m) => m.key === 'portfolio_roi')!;
    expect(roi.value).toBe('0.0×');
  });

  it('Spend at risk = $0 when no initiatives are pressuring', () => {
    const initiatives = [
      makeInitiative({ statusFlag: 'healthy' }),
      makeInitiative({ statusFlag: 'foundation_phase' }),
    ];
    const view = buildTowerBandMetrics(initiatives, [], TODAY);
    const spend = view.metrics.find((m) => m.key === 'spend_at_risk')!;
    expect(spend.value).toBe('$0');
    expect(spend.subtext).toBe('no risk');
  });

  it('Active pressures = 0 + "all healthy" when all initiatives are healthy', () => {
    const initiatives = [
      makeInitiative({ statusFlag: 'healthy' }),
      makeInitiative({ statusFlag: 'healthy' }),
    ];
    const view = buildTowerBandMetrics(initiatives, [], TODAY);
    const pressures = view.metrics.find((m) => m.key === 'active_pressures')!;
    expect(pressures.value).toBe('0');
    expect(pressures.subtext).toBe('all healthy');
  });

  it('Renewals counter ignores past renewal dates', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ renewalDate: '2026-04-01' }), // before today
      makeVendor({ renewalDate: '2026-06-01' }), // within window
    ];
    const view = buildTowerBandMetrics(MERIDIAN, vendors, TODAY);
    expect(view.metrics.find((m) => m.key === 'renewals_90d')!.value).toBe('1');
  });

  it('Renewals counter ignores vendors with null renewal_date', () => {
    const vendors: AIInitiativeVendorRow[] = [
      makeVendor({ renewalDate: null }),
      makeVendor({ renewalDate: null }),
    ];
    const view = buildTowerBandMetrics(MERIDIAN, vendors, TODAY);
    expect(view.metrics.find((m) => m.key === 'renewals_90d')!.value).toBe('0');
  });
});
