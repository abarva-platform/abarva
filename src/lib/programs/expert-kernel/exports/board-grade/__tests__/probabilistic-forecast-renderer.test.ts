import type { ProbabilisticValueForecast } from '../../../probabilistic';
import { renderProbabilisticForecastHtml } from '../probabilistic-forecast-renderer';

function summary(
  p10: number,
  p50: number,
  p90: number,
): ProbabilisticValueForecast['threeYearNpv'] {
  return {
    p10,
    p25: (p10 + p50) / 2,
    p50,
    p75: (p50 + p90) / 2,
    p90,
    mean: p50,
    stdev: (p90 - p10) / 3,
    min: p10 - 100_000,
    max: p90 + 100_000,
    samples: 10_000,
    seed: 42,
  };
}

const FORECAST: ProbabilisticValueForecast = {
  yearly: [
    {
      year: 1,
      revenueDist: summary(1_100_000, 1_400_000, 1_900_000),
      costDist: summary(900_000, 1_000_000, 1_200_000),
      netDist: summary(-100_000, 400_000, 900_000),
    },
    {
      year: 2,
      revenueDist: summary(2_000_000, 2_600_000, 3_200_000),
      costDist: summary(700_000, 900_000, 1_100_000),
      netDist: summary(900_000, 1_700_000, 2_400_000),
    },
    {
      year: 3,
      revenueDist: summary(2_600_000, 3_400_000, 4_400_000),
      costDist: summary(650_000, 850_000, 1_050_000),
      netDist: summary(1_600_000, 2_550_000, 3_550_000),
    },
  ],
  threeYearNpv: summary(1_800_000, 4_200_000, 6_900_000),
  fiveYearNpv: summary(3_600_000, 8_100_000, 11_800_000),
  probNetPositive3yr: 0.87,
  probHitTarget: 0.61,
  topVarianceDrivers: [
    {
      input: 'adoption ramp',
      elasticity: 0.78,
      note: 'Higher adoption raises realized value; low adoption widens the downside tail.',
    },
    {
      input: 'effort cost',
      elasticity: 0.42,
      note: 'Higher build/change/run cost lowers NPV.',
    },
    {
      input: 'vendor reprice',
      elasticity: 0.29,
      note: 'Pricing-tier repricing raises operating cost in affected trials.',
    },
  ],
};

describe('Probabilistic Value Forecast board-grade renderer', () => {
  const html = renderProbabilisticForecastHtml({
    forecast: FORECAST,
    moveLabel: 'Apex Store Labor AI',
    tenantLabel: 'Apex Retail',
    tenantKey: 'apex-retail',
    generatedOn: '2026-06-01',
  });

  it('renders a standalone deck with the forecast sections', () => {
    expect(html.slice(0, 40).toLowerCase()).toContain('<!doctype html');
    expect(html).toContain('Probabilistic Value Forecast');
    expect(html).toContain('id="probabilistic-forecast"');
    expect(html).toContain('id="decision-probabilities"');
    expect(html).toContain('id="variance-drivers"');
    expect(html).toContain('Slide 4 / 4');
  });

  it('surfaces P10 P50 P90, net-positive odds, and target-hit odds', () => {
    expect(html).toContain('P10');
    expect(html).toContain('P50');
    expect(html).toContain('P90');
    expect(html).toContain('87% probability of net-positive');
    expect(html).toContain('61% probability of hitting');
    expect(html).toContain('$1.80M');
    expect(html).toContain('$4.20M');
    expect(html).toContain('$6.90M');
  });

  it('renders a fan chart and the top variance drivers', () => {
    expect(html).toContain('Fan chart of yearly net value P10 P50 and P90 bands');
    expect(html).toContain('P10-P90 band');
    expect(html).toContain('Top driver: adoption ramp');
    expect(html).toContain('Higher adoption raises realized value');
    expect(html).toContain('Pricing-tier repricing raises operating cost');
  });

  it('stays self-contained for board circulation', () => {
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+href="https?:/i);
    expect(html).not.toMatch(/<img[^>]+src="https?:/i);
  });
});
