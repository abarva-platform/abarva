/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the BAFO captured-vs-target insight:
//   1. MODEL badge — concession actuals aren't in the fact model yet.
//   2. Renders the target/captured bars + the per-lever BAFO ask.
//   3. Names the fact that flips it live; captured never fabricated.

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

import { BafoProgressInsight } from '../BafoProgressInsight';
import type { BafoProgressInsightView } from '../../view-model';

const MODEL: BafoProgressInsightView = {
  kind: 'bafo_progress',
  provenance: 'sample',
  headline: '$5M–$8M of value targeted across 2 levers to pull in BAFO; captured tracks here once actuals land.',
  rows: [
    { leverKey: 'AMS.ENHANCEMENT_LEAKAGE', label: 'Enhancement / change-order leakage', valueType: 'protected', targetLow: 1_800_000, targetHigh: 2_600_000, captured: 0, bafoAsk: 'Convert change-order categories into a fixed service catalog.' },
    { leverKey: 'AMS.VOLUME_BAND_PRICING', label: 'Volume-band price flex-down', valueType: 'incremental_negotiated', targetLow: 1_200_000, targetHigh: 1_900_000, captured: 0, bafoAsk: 'Add volume-band step-down pricing.' },
  ],
  flipFact: 'BAFO concession actuals per lever (each negotiated concession booked against the lever it moves).',
  isModel: true,
  note: 'Model — negotiation actuals are not in the fact model yet.',
  bestPractice: ['Enter BAFO with a per-lever concession ask.'],
  benchmark: 'Market range — structured lever-level BAFO asks recover more.',
  downstreamImpact: 'BAFO is the last negotiation round.',
};

const LIVE: BafoProgressInsightView = {
  ...MODEL,
  provenance: 'live',
  headline: 'BAFO captured $4M across 1 of 2 levers (target pool $3M–$4.5M); the rest are still open to pull in this round.',
  rows: [
    { ...MODEL.rows[1], captured: 4_000_000 },
    { ...MODEL.rows[0], captured: 0 },
  ],
  isModel: false,
  note: 'Live — captured value is read from the BAFO concession actuals you provided.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('BafoProgressInsight', () => {
  it('is a MODEL, renders the target/captured bars', () => {
    const { container } = render(<BafoProgressInsight insight={MODEL} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
  });

  it('surfaces the per-lever BAFO ask + names the flip fact', () => {
    render(<BafoProgressInsight insight={MODEL} />);
    const asks = screen.getByTestId('bafo-progress-asks');
    expect(asks).toHaveTextContent(/fixed service catalog/i);
    expect(asks).toHaveTextContent(/volume-band step-down/i);
    const flip = screen.getByTestId('bafo-progress-flip');
    expect(flip).toHaveTextContent(/BAFO concession actuals/i);
  });

  it('renders LIVE (not model) when concession actuals are present', () => {
    const { container } = render(<BafoProgressInsight insight={LIVE} />);
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(
      /model/i,
    );
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
  });
});
