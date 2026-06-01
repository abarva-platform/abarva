import { buildEffortEstimate, DEFAULT_PLANNING_RATE_CARD } from '../../effort-estimator';
import { rangeOf } from '../../types';
import { buildValueForecast } from '../../value-forecast';
import { buildProbabilisticValueForecast } from '../value-forecast-mc';

function effort() {
  return buildEffortEstimate({
    moveName: 'Apex Store Labor AI',
    rateCard: DEFAULT_PLANNING_RATE_CARD,
    offshoreRatio: 0.4,
    workstreams: [
      {
        id: 'ai_build',
        durationMonths: 1,
        agentSplit: 0.2,
        roleMix: [{ role: 'engineer', headcount: 0.5 }],
      },
    ],
  });
}

function forecast() {
  return buildValueForecast({
    moveName: 'Apex Store Labor AI',
    grossAnnualValue: rangeOf(120_000, 120_000),
    horizonYears: 3,
    adoptionCurve: [0.3, 0.65, 0.85],
    haircutScores: {
      adoptionRisk: 0.8,
      dataReadiness: 0.8,
      processDependency: 0.8,
      integrationComplexity: 0.8,
      controlBurden: 0.8,
      sponsorStrength: 0.8,
    },
  });
}

describe('probabilistic value forecast', () => {
  it('matches the deterministic net-return direction when inputs have no variance', () => {
    const deterministicForecast = forecast();
    const deterministicEffort = effort();
    const result = buildProbabilisticValueForecast({
      value: deterministicForecast,
      effort: deterministicEffort,
      trials: 500,
      seed: 4,
      discountRate: 0,
    });

    const deterministicThreeYearNet =
      deterministicForecast.totalNetValue.point - deterministicEffort.totalCost.point;
    expect(result.threeYearNpv.mean).toBeCloseTo(deterministicThreeYearNet, 2);
    expect(result.threeYearNpv.stdev).toBe(0);
  });

  it('samples distributions and ranks adoption as a top variance driver', () => {
    const deterministicEffort = buildEffortEstimate({
      ...baseEffortInput(),
      probabilistic: {
        effortCostDist: 'triangular_from_range',
        trials: 2_000,
        seed: 12,
      },
    });
    const deterministicForecast = buildValueForecast({
      ...baseValueInput(),
      probabilistic: {
        adoptionRampDist: {
          yearly: [
            { min: 0.1, mode: 0.3, max: 0.6 },
            { min: 0.2, mode: 0.65, max: 0.9 },
            { min: 0.3, mode: 0.85, max: 1 },
          ],
        },
        trials: 2_000,
        seed: 12,
      },
    });

    const result = buildProbabilisticValueForecast({
      value: deterministicForecast,
      effort: deterministicEffort,
    });

    expect(result.yearly).toHaveLength(3);
    expect(result.threeYearNpv.p10).toBeLessThan(result.threeYearNpv.p90);
    expect(result.probNetPositive3yr).toBeGreaterThanOrEqual(0);
    expect(result.probNetPositive3yr).toBeLessThanOrEqual(1);
    expect(result.topVarianceDrivers.map((driver) => driver.input)).toContain(
      'adoption ramp',
    );
  });

  it('computes target-hit probability against an explicit target', () => {
    const result = buildProbabilisticValueForecast({
      value: forecast(),
      effort: effort(),
      lockedProjectedTarget: 10_000_000,
      trials: 500,
      seed: 6,
    });

    expect(result.probHitTarget).toBe(0);
  });
});

function baseEffortInput(): Parameters<typeof buildEffortEstimate>[0] {
  return {
    moveName: 'Apex Store Labor AI',
    rateCard: DEFAULT_PLANNING_RATE_CARD,
    offshoreRatio: 0.4,
    workstreams: [
      {
        id: 'ai_build',
        durationMonths: 3,
        agentSplit: 0.25,
        roleMix: [{ role: 'engineer', headcount: 1 }],
      },
    ],
  };
}

function baseValueInput(): Parameters<typeof buildValueForecast>[0] {
  return {
    moveName: 'Apex Store Labor AI',
    grossAnnualValue: rangeOf(200_000, 350_000),
    horizonYears: 3,
    adoptionCurve: [0.3, 0.65, 0.85],
    haircutScores: {
      adoptionRisk: 0.75,
      dataReadiness: 0.75,
      processDependency: 0.75,
      integrationComplexity: 0.75,
      controlBurden: 0.75,
      sponsorStrength: 0.75,
    },
  };
}
