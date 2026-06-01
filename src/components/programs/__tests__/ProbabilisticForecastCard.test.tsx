/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ProbabilisticForecastCard } from '../ProbabilisticForecastCard';
import type { ProbabilisticValueForecast } from '@/lib/programs/expert-kernel/probabilistic';

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
    min: p10,
    max: p90,
    samples: 10_000,
    seed: 7,
  };
}

const forecast: ProbabilisticValueForecast = {
  yearly: [
    {
      year: 1,
      revenueDist: summary(800_000, 1_100_000, 1_500_000),
      costDist: summary(500_000, 650_000, 820_000),
      netDist: summary(100_000, 450_000, 850_000),
    },
    {
      year: 2,
      revenueDist: summary(1_700_000, 2_100_000, 2_900_000),
      costDist: summary(450_000, 600_000, 800_000),
      netDist: summary(900_000, 1_500_000, 2_200_000),
    },
  ],
  threeYearNpv: summary(1_200_000, 3_000_000, 5_200_000),
  fiveYearNpv: summary(2_200_000, 5_800_000, 8_600_000),
  probNetPositive3yr: 0.93,
  probHitTarget: 0.64,
  topVarianceDrivers: [
    {
      input: 'adoption ramp',
      elasticity: 0.72,
      note: 'Higher adoption raises realized value; low adoption widens the downside tail.',
    },
    {
      input: 'value per unit',
      elasticity: 0.31,
      note: 'Higher realized value per decision raises NPV.',
    },
  ],
};

describe('ProbabilisticForecastCard', () => {
  it('renders CXO-readable forecast bands and drivers', () => {
    render(<ProbabilisticForecastCard forecast={forecast} title="Apex Store Labor AI" />);

    expect(screen.getByRole('region', { name: 'Apex Store Labor AI' })).toBeInTheDocument();
    expect(screen.getByText('P10 downside')).toBeInTheDocument();
    expect(screen.getByText('P50 median')).toBeInTheDocument();
    expect(screen.getByText('P90 upside')).toBeInTheDocument();
    expect(screen.getByText('Net-positive odds')).toBeInTheDocument();
    expect(screen.getByText('93%')).toBeInTheDocument();
    expect(screen.getByText('adoption ramp')).toBeInTheDocument();
    expect(screen.getByText(/80% probability between/)).toHaveTextContent(
      'top driver: adoption ramp',
    );
  });
});
