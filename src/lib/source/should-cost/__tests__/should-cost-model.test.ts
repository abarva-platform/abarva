import {
  buildShouldCostEstimate,
  DEFAULT_HIDDEN_LAYER_DRIVERS,
  type ShouldCostModelInput,
  type RoleRateCard,
} from '../should-cost-model';

const RATE_CARD: RoleRateCard[] = [
  { role: 'engagement_lead', onshoreAnnualRate: 320_000, offshoreAnnualRate: 140_000 },
  { role: 'solution_architect', onshoreAnnualRate: 280_000, offshoreAnnualRate: 120_000 },
  { role: 'senior_engineer', onshoreAnnualRate: 220_000, offshoreAnnualRate: 90_000 },
  { role: 'engineer', onshoreAnnualRate: 160_000, offshoreAnnualRate: 60_000 },
  { role: 'analyst', onshoreAnnualRate: 120_000, offshoreAnnualRate: 48_000 },
  { role: 'project_manager', onshoreAnnualRate: 200_000, offshoreAnnualRate: 84_000 },
];

function baseInput(overrides: Partial<ShouldCostModelInput> = {}): ShouldCostModelInput {
  return {
    estimateLabel: 'Apex contact-center AI — Vendor A',
    vendorQuotedCost: 1_200_000,
    vendorMarginRatio: 0.25,
    roleMix: [
      { role: 'engagement_lead', headcount: 1 },
      { role: 'solution_architect', headcount: 2 },
      { role: 'senior_engineer', headcount: 3 },
      { role: 'engineer', headcount: 4 },
    ],
    rateCard: RATE_CARD,
    durationMonths: 12,
    offshoreRatio: 0.5,
    transitionCost: 150_000,
    consumption: {
      monthlyCloudCost: 18_000,
      monthlyModelCost: 22_000,
    },
    ...overrides,
  };
}

describe('buildShouldCostEstimate', () => {
  it('is deterministic — identical input yields identical output', () => {
    const a = buildShouldCostEstimate(baseInput());
    const b = buildShouldCostEstimate(baseInput());
    expect(a).toEqual(b);
  });

  it('itemises all eight iceberg layers (visible + seven hidden)', () => {
    const r = buildShouldCostEstimate(baseInput());
    expect(r.icebergLayers).toHaveLength(8);
    expect(r.icebergLayers.map((l) => l.layer)).toEqual([
      'license_subscription',
      'implementation',
      'integration',
      'data_migration',
      'change_management',
      'operations',
      'consumption_scaling',
      'exit_transition',
    ]);
  });

  it('marks exactly one layer (license/subscription) as visible', () => {
    const r = buildShouldCostEstimate(baseInput());
    const visible = r.icebergLayers.filter((l) => l.visible);
    expect(visible).toHaveLength(1);
    expect(visible[0].layer).toBe('license_subscription');
  });

  it('returns a range, never a single number — totalHigh exceeds totalLow', () => {
    const r = buildShouldCostEstimate(baseInput());
    expect(r.totalHigh).toBeGreaterThan(r.totalLow);
    expect(r.totalPoint).toBeGreaterThan(r.totalLow);
    expect(r.totalPoint).toBeLessThan(r.totalHigh);
  });

  it('every layer has low <= point <= high', () => {
    const r = buildShouldCostEstimate(baseInput());
    for (const layer of r.icebergLayers) {
      expect(layer.low).toBeLessThanOrEqual(layer.point);
      expect(layer.point).toBeLessThanOrEqual(layer.high);
    }
  });

  it('totals equal the sum of the itemised layers', () => {
    const r = buildShouldCostEstimate(baseInput());
    const sumLow = r.icebergLayers.reduce((s, l) => s + l.low, 0);
    const sumHigh = r.icebergLayers.reduce((s, l) => s + l.high, 0);
    expect(r.totalLow).toBeCloseTo(sumLow, 2);
    expect(r.totalHigh).toBeCloseTo(sumHigh, 2);
  });

  it('models true cost above the quote — visible share is well under 100%', () => {
    const r = buildShouldCostEstimate(baseInput());
    expect(r.visibleShareOfTotal).toBeGreaterThan(0);
    expect(r.visibleShareOfTotal).toBeLessThan(0.5);
    expect(r.totalPoint).toBeGreaterThan(r.vendorQuotedCost);
  });

  it('visible layer low is net of vendor margin; high equals the quote', () => {
    const r = buildShouldCostEstimate(baseInput({ vendorMarginRatio: 0.25 }));
    const license = r.icebergLayers.find((l) => l.layer === 'license_subscription')!;
    expect(license.high).toBe(1_200_000);
    expect(license.low).toBe(900_000); // 1.2M * (1 - 0.25)
  });

  it('blends onshore/offshore rates by the offshore ratio', () => {
    const r = buildShouldCostEstimate(baseInput({ offshoreRatio: 0.5 }));
    const lead = r.roleMix.perRole.find((p) => p.role === 'engagement_lead')!;
    // (320k + 140k) / 2 = 230k blended
    expect(lead.blendedAnnualRate).toBe(230_000);
  });

  it('per-role offshoreRatio overrides the engagement default', () => {
    const r = buildShouldCostEstimate(
      baseInput({
        offshoreRatio: 0.5,
        roleMix: [{ role: 'engineer', headcount: 1, offshoreRatio: 1 }],
      }),
    );
    const eng = r.roleMix.perRole.find((p) => p.role === 'engineer')!;
    expect(eng.offshoreRatio).toBe(1);
    expect(eng.blendedAnnualRate).toBe(60_000); // fully offshore
  });

  it('a fully-offshore mix costs less than a fully-onshore mix', () => {
    const onshore = buildShouldCostEstimate(baseInput({ offshoreRatio: 0 }));
    const offshore = buildShouldCostEstimate(baseInput({ offshoreRatio: 1 }));
    expect(offshore.roleMix.implementationLabourBase).toBeLessThan(
      onshore.roleMix.implementationLabourBase,
    );
    expect(offshore.totalPoint).toBeLessThan(onshore.totalPoint);
  });

  it('scales the labour base with duration', () => {
    const short = buildShouldCostEstimate(baseInput({ durationMonths: 6 }));
    const long = buildShouldCostEstimate(baseInput({ durationMonths: 24 }));
    expect(long.roleMix.implementationLabourBase).toBeGreaterThan(
      short.roleMix.implementationLabourBase * 3,
    );
  });

  it('consumption layer scales with cloud + model run-rate and duration', () => {
    const r = buildShouldCostEstimate(baseInput());
    const consumption = r.icebergLayers.find((l) => l.layer === 'consumption_scaling')!;
    // (18k + 22k) * 12 months = 480k low
    expect(consumption.low).toBe(480_000);
    // default 1.6x volatility ceiling
    expect(consumption.high).toBe(768_000);
  });

  it('zero-AI deals carry no model consumption', () => {
    const r = buildShouldCostEstimate(
      baseInput({ consumption: { monthlyCloudCost: 10_000, monthlyModelCost: 0 } }),
    );
    const consumption = r.icebergLayers.find((l) => l.layer === 'consumption_scaling')!;
    expect(consumption.low).toBe(120_000); // 10k * 12
  });

  it('honours a custom highScalingMultiplier', () => {
    const r = buildShouldCostEstimate(
      baseInput({
        consumption: { monthlyCloudCost: 0, monthlyModelCost: 10_000, highScalingMultiplier: 3 },
      }),
    );
    const consumption = r.icebergLayers.find((l) => l.layer === 'consumption_scaling')!;
    expect(consumption.low).toBe(120_000);
    expect(consumption.high).toBe(360_000);
  });

  it('implementation layer includes the one-time transition cost', () => {
    const withT = buildShouldCostEstimate(baseInput({ transitionCost: 300_000 }));
    const withoutT = buildShouldCostEstimate(baseInput({ transitionCost: 0 }));
    const dLow =
      withT.icebergLayers.find((l) => l.layer === 'implementation')!.low -
      withoutT.icebergLayers.find((l) => l.layer === 'implementation')!.low;
    expect(dLow).toBe(300_000);
  });

  it('hidden-layer drivers can be overridden', () => {
    const r = buildShouldCostEstimate(
      baseInput({ hiddenLayerDrivers: { integration: 1.0 } }),
    );
    const integration = r.icebergLayers.find((l) => l.layer === 'integration')!;
    expect(integration.low).toBe(r.roleMix.implementationLabourBase);
  });

  it('default integration driver matches the published §5 default', () => {
    const r = buildShouldCostEstimate(baseInput());
    const integration = r.icebergLayers.find((l) => l.layer === 'integration')!;
    expect(integration.low).toBeCloseTo(
      r.roleMix.implementationLabourBase * DEFAULT_HIDDEN_LAYER_DRIVERS.integration,
      2,
    );
  });

  it('produces a repeatable should-cost-vs-quote headline', () => {
    const r = buildShouldCostEstimate(baseInput());
    expect(r.headline).toContain('The vendor quoted $1,200,000');
    expect(r.headline).toContain('should-cost is');
    expect(r.headline).toContain('once the TCO iceberg is modelled');
  });

  it('reports effective offshore ratio across the whole mix', () => {
    const r = buildShouldCostEstimate(
      baseInput({
        offshoreRatio: 0,
        roleMix: [
          { role: 'engineer', headcount: 2, offshoreRatio: 1 },
          { role: 'analyst', headcount: 2, offshoreRatio: 0 },
        ],
      }),
    );
    expect(r.roleMix.effectiveOffshoreRatio).toBe(0.5);
    expect(r.roleMix.totalHeadcount).toBe(4);
  });

  it('throws on non-positive duration', () => {
    expect(() => buildShouldCostEstimate(baseInput({ durationMonths: 0 }))).toThrow(
      /durationMonths/,
    );
  });

  it('throws on negative vendor quote', () => {
    expect(() => buildShouldCostEstimate(baseInput({ vendorQuotedCost: -1 }))).toThrow(
      /vendorQuotedCost/,
    );
  });

  it('throws when a role mix entry has no matching rate card', () => {
    expect(() =>
      buildShouldCostEstimate(
        baseInput({
          roleMix: [{ role: 'project_manager', headcount: 1 }],
          rateCard: RATE_CARD.filter((r) => r.role !== 'project_manager'),
        }),
      ),
    ).toThrow(/No rate card entry/);
  });

  it('throws on negative headcount', () => {
    expect(() =>
      buildShouldCostEstimate(baseInput({ roleMix: [{ role: 'engineer', headcount: -1 }] })),
    ).toThrow(/headcount/);
  });

  it('clamps an out-of-range offshore ratio into [0,1]', () => {
    const r = buildShouldCostEstimate(
      baseInput({ roleMix: [{ role: 'engineer', headcount: 1, offshoreRatio: 5 }] }),
    );
    const eng = r.roleMix.perRole.find((p) => p.role === 'engineer')!;
    expect(eng.offshoreRatio).toBe(1);
  });
});
