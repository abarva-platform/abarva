/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Value committed-vs-realized insight:
//   1. MODEL badge — realized-value actuals aren't in the fact model yet.
//   2. Renders the committed track; realized is pending (never a fabricated $).
//   3. Names the fact that flips it live + advisor layer.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { cloneElement, isValidElement } from 'react';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      isValidElement(children)
        ? cloneElement(
            children as React.ReactElement<{ width?: number; height?: number }>,
            { width: 640, height: 320 },
          )
        : children,
  };
});

import { ValueRealizationInsight } from '../ValueRealizationInsight';
import type { ValueRealizationInsightView } from '../../view-model';

const MODEL: ValueRealizationInsightView = {
  kind: 'value_realization',
  provenance: 'sample',
  headline: '$6M of value committed across the term; realization is tracked here once actuals are ingested.',
  points: [
    { period: 'Y1', committed: 2_000_000, realized: null },
    { period: 'Y2', committed: 4_000_000, realized: null },
    { period: 'Y3', committed: 6_000_000, realized: null },
  ],
  isModel: true,
  flipFact: 'Periodic realized-value actuals per lever (run-cost actuals, SLA-credit actuals).',
  note: 'Model — realized-value actuals are not in the fact model yet.',
  bestPractice: ['Book realized value per period against the committed lever.'],
  benchmark: 'Market range — 40–60% of negotiated value is never measured post-award.',
  downstreamImpact: 'Realization is where the whole event pays off or leaks.',
};

const LIVE: ValueRealizationInsightView = {
  kind: 'value_realization',
  provenance: 'live',
  headline: '$3M realized to date across 2 of 3 levers (50% of the $6M committed pool); the rest are still awaiting realization.',
  points: [
    { period: 'Y1', committed: 2_000_000, realized: null },
    { period: 'Y2', committed: 4_000_000, realized: null },
    { period: 'Y3', committed: 6_000_000, realized: 3_000_000 },
  ],
  bars: [
    {
      leverKey: 'AMS.VOLUME_BAND_PRICING',
      label: 'Volume-band price flex-down',
      valueType: 'incremental_negotiated',
      committed: 2_500_000,
      realized: 2_000_000,
    },
    {
      leverKey: 'AMS.SLA_ECONOMICS',
      label: 'SLA credit economics',
      valueType: 'protected',
      committed: 2_000_000,
      realized: 1_000_000,
    },
    {
      leverKey: 'AMS.RETAINED_COST',
      label: 'Retained client / SME cost',
      valueType: 'risk_adjusted',
      committed: 1_500_000,
      // no realized fact → not yet realized (undefined, never fabricated)
    },
  ],
  isModel: false,
  flipFact: 'Realized-value actuals per lever booked to date.',
  note: 'Live (snapshot) — realized value is read from the realized-to-date actuals you provided.',
  bestPractice: ['Book realized value per lever against the committed line it maps to.'],
  benchmark: 'Market range — 40–60% of negotiated value is never measured post-award.',
  downstreamImpact: 'Realization is where the whole event pays off or leaks.',
};

describe('ValueRealizationInsight', () => {
  it('is clearly a MODEL, renders the committed track (lines mounted)', () => {
    const { container } = render(<ValueRealizationInsight insight={MODEL} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(/live/i);
    // Line chart mounted.
    expect(container.querySelectorAll('.recharts-line').length).toBeGreaterThanOrEqual(1);
    // No per-lever snapshot list in MODEL mode.
    expect(screen.queryByTestId('value-realization-bars')).not.toBeInTheDocument();
  });

  it('names the fact that flips it live + carries the advisor layer', () => {
    render(<ValueRealizationInsight insight={MODEL} />);
    const flip = screen.getByTestId('value-realization-flip');
    expect(flip).toHaveTextContent(/goes live when/i);
    expect(flip).toHaveTextContent(/realized-value actuals/i);
    expect(screen.getByTestId('advisor-best-practice')).toBeInTheDocument();
  });

  it('LIVE: badge reads Live and the per-lever realized-to-date snapshot renders (not-yet-realized honest)', () => {
    render(<ValueRealizationInsight insight={LIVE} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(/model/i);
    // Per-lever snapshot list present, one row per lever.
    const bars = screen.getByTestId('value-realization-bars');
    expect(bars).toBeInTheDocument();
    // A realized lever shows its realized $; the un-realized lever is honest.
    expect(bars).toHaveTextContent(/realized/i);
    expect(bars).toHaveTextContent(/not yet realized/i);
  });
});
