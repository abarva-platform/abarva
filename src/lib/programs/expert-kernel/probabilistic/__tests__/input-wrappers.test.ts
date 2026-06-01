import { buildEffortEstimate, DEFAULT_PLANNING_RATE_CARD } from '../../effort-estimator';
import { buildValueForecast } from '../../value-forecast';
import { rangeOf } from '../../types';
import {
  buildEffortCostDistribution,
  buildProbabilisticConfig,
  buildValueForecastDistributions,
  type ProbabilisticInputs,
} from '../input-wrappers';

const probabilistic: ProbabilisticInputs = {
  effortCostDist: 'triangular_from_range',
  adoptionRampDist: {
    yearly: [
      { min: 0.2, mode: 0.3, max: 0.45 },
      { min: 0.5, mode: 0.65, max: 0.8 },
      { min: 0.7, mode: 0.85, max: 0.95 },
    ],
  },
  valuePerUnitDist: { mu: 2, sigma: 0.25 },
  churnRateDist: { min: 0.02, mode: 0.05, max: 0.1 },
  vendorRepriceDist: {
    probability: 0.2,
    magnitudeDist: { min: 0.05, mode: 0.12, max: 0.3 },
  },
  trials: 12_000,
  seed: 99,
};

describe('probabilistic input wrappers', () => {
  it('defaults sampling config when callers omit it', () => {
    expect(buildProbabilisticConfig({})).toEqual({ trials: 10_000, seed: 1 });
  });

  it('wraps effort ranges as triangular distributions', () => {
    const wrapped = buildEffortCostDistribution(
      { low: 80, point: 100, high: 140 },
      probabilistic,
    );

    expect(wrapped).toEqual({
      source: 'effort.totalCost',
      distribution: { kind: 'triangular', min: 80, mode: 100, max: 140 },
      config: { trials: 12_000, seed: 99 },
    });
  });

  it('wraps value forecast inputs without sampling yet', () => {
    const wrapped = buildValueForecastDistributions([0.3, 0.65, 0.85], probabilistic);

    expect(wrapped?.adoptionRamp).toHaveLength(3);
    expect(wrapped?.adoptionRamp[1]).toEqual({
      year: 2,
      distribution: { kind: 'beta_pert', min: 0.5, mode: 0.65, max: 0.8 },
    });
    expect(wrapped?.valuePerUnit).toEqual({ kind: 'lognormal', mu: 2, sigma: 0.25 });
    expect(wrapped?.churnRate).toEqual({
      kind: 'beta_pert',
      min: 0.02,
      mode: 0.05,
      max: 0.1,
    });
    expect(wrapped?.vendorReprice?.probability).toBe(0.2);
    expect(wrapped?.vendorReprice?.magnitudeDistribution).toEqual({
      kind: 'beta_pert',
      min: 0.05,
      mode: 0.12,
      max: 0.3,
    });
  });

  it('threads optional probabilistic input through the effort estimator', () => {
    const estimate = buildEffortEstimate({
      moveName: 'Apex Store Labor AI',
      rateCard: DEFAULT_PLANNING_RATE_CARD,
      offshoreRatio: 0.4,
      probabilistic,
      workstreams: [
        {
          id: 'ai_build',
          durationMonths: 3,
          agentSplit: 0.25,
          roleMix: [{ role: 'engineer', headcount: 1 }],
        },
      ],
    });

    expect(estimate.probabilistic?.distribution.kind).toBe('triangular');
    expect(estimate.probabilistic?.config).toEqual({ trials: 12_000, seed: 99 });
  });

  it('threads optional probabilistic input through the value forecast', () => {
    const forecast = buildValueForecast({
      moveName: 'Apex Store Labor AI',
      grossAnnualValue: rangeOf(100, 200),
      horizonYears: 3,
      adoptionCurve: [0.3, 0.65, 0.85],
      haircutScores: {
        adoptionRisk: 0.7,
        dataReadiness: 0.7,
        processDependency: 0.7,
        integrationComplexity: 0.7,
        controlBurden: 0.7,
        sponsorStrength: 0.7,
      },
      probabilistic,
    });

    expect(forecast.probabilistic?.adoptionRamp[0].distribution).toEqual({
      kind: 'beta_pert',
      min: 0.2,
      mode: 0.3,
      max: 0.45,
    });
    expect(forecast.totalNetValue.point).toBeGreaterThan(0);
  });

  it('keeps existing callers backward-compatible when probabilistic input is absent', () => {
    const forecast = buildValueForecast({
      moveName: 'Meridian Ambient Documentation',
      grossAnnualValue: rangeOf(50, 100),
      horizonYears: 1,
      adoptionCurve: [0.5],
      haircutScores: {
        adoptionRisk: 0.6,
        dataReadiness: 0.6,
        processDependency: 0.6,
        integrationComplexity: 0.6,
        controlBurden: 0.6,
        sponsorStrength: 0.6,
      },
    });

    expect(forecast.probabilistic).toBeNull();
  });

  it('rejects mismatched adoption distributions', () => {
    expect(() =>
      buildValueForecastDistributions([0.5], {
        adoptionRampDist: { yearly: [] },
        trials: 10,
        seed: 1,
      }),
    ).toThrow('adoptionRampDist');
  });
});
