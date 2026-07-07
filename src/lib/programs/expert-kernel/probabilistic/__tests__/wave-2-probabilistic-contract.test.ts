import { scoreAnswer } from '@/lib/eval/answer-quality/scorer';
import { renderProbabilisticForecastHtml } from '../../exports/board-grade';
import { buildEffortEstimate, DEFAULT_PLANNING_RATE_CARD } from '../../effort-estimator';
import { rangeOf } from '../../types';
import { buildValueForecast } from '../../value-forecast';
import { buildProbabilisticValueForecast } from '../value-forecast-mc';

describe('Wave 2 probabilistic value modeling contract', () => {
  it('runs the A1-A2-B1-B2 chain without losing the decision-grade outputs', () => {
    const effort = buildEffortEstimate({
      moveName: 'Apex Store Labor AI',
      rateCard: DEFAULT_PLANNING_RATE_CARD,
      offshoreRatio: 0.4,
      probabilistic: {
        effortCostDist: 'triangular_from_range',
        trials: 2_000,
        seed: 2026,
      },
      workstreams: [
        {
          id: 'ai_build',
          durationMonths: 3,
          agentSplit: 0.25,
          roleMix: [{ role: 'engineer', headcount: 1 }],
        },
      ],
    });
    const value = buildValueForecast({
      moveName: 'Apex Store Labor AI',
      grossAnnualValue: rangeOf(240_000, 420_000),
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
      probabilistic: {
        adoptionRampDist: {
          yearly: [
            { min: 0.12, mode: 0.3, max: 0.52 },
            { min: 0.38, mode: 0.65, max: 0.9 },
            { min: 0.5, mode: 0.85, max: 0.98 },
          ],
        },
        valuePerUnitDist: { mu: 0, sigma: 0.12 },
        churnRateDist: { min: 0.01, mode: 0.04, max: 0.09 },
        vendorRepriceDist: {
          probability: 0.18,
          magnitudeDist: { min: 0.03, mode: 0.12, max: 0.28 },
        },
        trials: 2_000,
        seed: 2026,
      },
    });

    const forecast = buildProbabilisticValueForecast({
      value,
      effort,
      discountRate: 0.1,
    });
    const html = renderProbabilisticForecastHtml({
      forecast,
      moveLabel: 'Apex Store Labor AI',
      tenantLabel: 'Apex Retail',
      tenantKey: 'apex-retail',
      generatedOn: '2026-06-01',
    });

    expect(effort.probabilistic?.distribution.kind).toBe('triangular');
    expect(value.probabilistic?.adoptionRamp).toHaveLength(3);
    expect(forecast.threeYearNpv.p10).toBeLessThan(forecast.threeYearNpv.p50);
    expect(forecast.threeYearNpv.p50).toBeLessThan(forecast.threeYearNpv.p90);
    expect(forecast.probNetPositive3yr).toBeGreaterThanOrEqual(0);
    expect(forecast.probNetPositive3yr).toBeLessThanOrEqual(1);
    expect(forecast.topVarianceDrivers).toHaveLength(3);
    expect(html).toContain('P10');
    expect(html).toContain('P50');
    expect(html).toContain('P90');
    expect(html).toContain('Top driver');
    expect(html).not.toMatch(/\bsignal:[0-9a-f-]{8,}/i);
  });

  it('keeps deterministic callers backward-compatible', () => {
    const effort = buildEffortEstimate({
      moveName: 'Meridian Ambient Documentation',
      rateCard: DEFAULT_PLANNING_RATE_CARD,
      offshoreRatio: 0.3,
      workstreams: [
        {
          id: 'change_adoption',
          durationMonths: 2,
          agentSplit: 0.1,
          roleMix: [{ role: 'engineer', headcount: 1 }],
        },
      ],
    });
    const value = buildValueForecast({
      moveName: 'Meridian Ambient Documentation',
      grossAnnualValue: rangeOf(100_000, 100_000),
      horizonYears: 3,
      adoptionCurve: [0.4, 0.7, 0.9],
      haircutScores: {
        adoptionRisk: 0.8,
        dataReadiness: 0.8,
        processDependency: 0.8,
        integrationComplexity: 0.8,
        controlBurden: 0.8,
        sponsorStrength: 0.8,
      },
    });
    const forecast = buildProbabilisticValueForecast({
      value,
      effort,
      trials: 500,
      seed: 11,
      discountRate: 0,
    });

    expect(effort.probabilistic).toBeNull();
    expect(value.probabilistic).toBeNull();
    expect(forecast.threeYearNpv.stdev).toBe(0);
  });

  it('scores good probabilistic language higher than raw or vague language', () => {
    const good = scoreAnswer(
      'Apex Store Labor AI is decision-ready at the median case: P50 3-year net value is $4.2M, with an 80% band from $1.8M to $6.9M from the forecast artifact as of 2026-06-01. Next step: validate the adoption-ramp evidence with the sponsor before funding.',
      { questionId: 'wave2-good', tenantKey: 'apex-retail', surface: 'moves' },
    );
    const bad = scoreAnswer(
      'signal:39901c16-2e8b-4c8c-80aa-8a0182f26754 says the P50 is fine. Consider exploring it.',
      { questionId: 'wave2-bad', tenantKey: 'apex-retail', surface: 'moves' },
    );

    expect(good.gatePassed).toBe(true);
    expect(bad.gatePassed).toBe(false);
    expect(good.overall).toBeGreaterThan(bad.overall);
  });
});
