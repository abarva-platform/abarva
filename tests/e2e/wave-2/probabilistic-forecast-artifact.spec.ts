import { expect, test } from '@playwright/test';

import type { ProbabilisticValueForecast } from '../../../src/lib/programs/expert-kernel/probabilistic';
import { renderProbabilisticForecastHtml } from '../../../src/lib/programs/expert-kernel/exports/board-grade/probabilistic-forecast-renderer';

function summary(p10: number, p50: number, p90: number) {
  return {
    p10,
    p25: (p10 + p50) / 2,
    p50,
    p75: (p50 + p90) / 2,
    p90,
    mean: p50,
    stdev: (p90 - p10) / 3,
    min: p10,
    max: p90,
    samples: 10_000,
    seed: 2026,
  };
}

const forecast: ProbabilisticValueForecast = {
  yearly: [
    {
      year: 1,
      revenueDist: summary(1_000_000, 1_400_000, 1_900_000),
      costDist: summary(600_000, 800_000, 1_000_000),
      netDist: summary(200_000, 600_000, 1_100_000),
    },
    {
      year: 2,
      revenueDist: summary(1_800_000, 2_500_000, 3_300_000),
      costDist: summary(500_000, 700_000, 900_000),
      netDist: summary(1_100_000, 1_800_000, 2_600_000),
    },
    {
      year: 3,
      revenueDist: summary(2_400_000, 3_200_000, 4_100_000),
      costDist: summary(500_000, 700_000, 900_000),
      netDist: summary(1_700_000, 2_500_000, 3_400_000),
    },
  ],
  threeYearNpv: summary(1_800_000, 4_200_000, 6_900_000),
  fiveYearNpv: summary(3_200_000, 7_800_000, 11_200_000),
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

test.describe('Wave 2 probabilistic forecast artifact', () => {
  test('renders and navigates as a self-contained board-grade deck', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.setContent(
      renderProbabilisticForecastHtml({
        forecast,
        moveLabel: 'Apex Store Labor AI',
        tenantLabel: 'Apex Retail',
        tenantKey: 'apex-retail',
        generatedOn: '2026-06-01',
      }),
      { waitUntil: 'domcontentloaded' },
    );

    await expect(page.getByRole('heading', { name: 'Apex Store Labor AI' })).toBeVisible();
    await expect(
      page.getByLabel('Cover').getByText('3-year P50', { exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: /Decision odds/ }).click();
    await expect(page.getByText('87% probability of net-positive')).toBeVisible();
    await expect(page.getByText('61% probability of hitting')).toBeVisible();

    await page.getByRole('button', { name: /Variance drivers/ }).click();
    await expect(page.getByText('Top driver: adoption ramp')).toBeVisible();
    await expect(page.getByText('Higher adoption raises realized value')).toBeVisible();

    expect(errors).toEqual([]);
  });
});
