/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Selection committed-value insight:
//   1. MODEL badge — award facts aren't in the fact model yet.
//   2. Renders the compact per-lever committed-value bars.
//   3. Names the fact that flips it live.
//   4. LIVE mode — once award commitments are ingested, the badge drops MODEL and
//      the committed values annotate the bars (awaiting-award levers stay honest).

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

import { CommittedValueInsight } from '../CommittedValueInsight';
import type { CommittedValueInsightView } from '../../view-model';

const MODEL: CommittedValueInsightView = {
  kind: 'committed_value',
  provenance: 'sample',
  headline: 'The award locks $3M–$4.5M across 2 levers — confirmed against the executed contract once award facts land.',
  bars: [
    { leverKey: 'AMS.ENHANCEMENT_LEAKAGE', label: 'Enhancement / change-order leakage', valueType: 'protected', low: 1_800_000, high: 2_600_000, confidence: 'med' },
    { leverKey: 'AMS.VOLUME_BAND_PRICING', label: 'Volume-band price flex-down', valueType: 'incremental_negotiated', low: 1_200_000, high: 1_900_000, confidence: 'med' },
  ],
  flipFact: 'Award facts (the executed contract / award record confirming which levers the winning vendor committed).',
  isModel: true,
  note: 'Model — award facts are not in the fact model yet.',
  bestPractice: ['Confirm every priced lever survived into the executed contract.'],
  benchmark: 'Market range — value is lost between BAFO and signature.',
  downstreamImpact: 'The award is the contract of record.',
};

// LIVE: an award has been ingested. One lever committed, one still awaiting award.
const LIVE: CommittedValueInsightView = {
  ...MODEL,
  provenance: 'live',
  isModel: false,
  headline:
    'The executed award locks $2.4M across 1 of 2 levers (target pool $3M–$4.5M); the rest are still awaiting award confirmation.',
  bars: [
    { leverKey: 'AMS.ENHANCEMENT_LEAKAGE', label: 'Enhancement / change-order leakage', valueType: 'protected', low: 1_800_000, high: 2_600_000, confidence: 'med', committed: 2_400_000 },
    { leverKey: 'AMS.VOLUME_BAND_PRICING', label: 'Volume-band price flex-down', valueType: 'incremental_negotiated', low: 1_200_000, high: 1_900_000, confidence: 'med' },
  ],
  note: 'Live — committed value is read from the award commitments you provided.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('CommittedValueInsight', () => {
  it('is a MODEL, renders the compact per-lever bars', () => {
    const { container } = render(<CommittedValueInsight insight={MODEL} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
  });

  it('names the fact that flips it live', () => {
    render(<CommittedValueInsight insight={MODEL} />);
    const flip = screen.getByTestId('committed-value-flip');
    expect(flip).toHaveTextContent(/goes live when/i);
    expect(flip).toHaveTextContent(/award facts/i);
  });

  it('LIVE: drops the MODEL badge and shows the live committed read (no flip line)', () => {
    render(<CommittedValueInsight insight={LIVE} />);
    // Not a model anymore.
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(
      /model/i,
    );
    // The "goes live when" flip line is gone; the live footnote is present.
    expect(screen.queryByTestId('committed-value-flip')).toBeNull();
    expect(screen.getByTestId('committed-value-live')).toHaveTextContent(
      /committed value read from the award commitments/i,
    );
  });

  it('LIVE: renders the compact per-lever bars for both committed and awaiting-award levers', () => {
    const { container } = render(<CommittedValueInsight insight={LIVE} />);
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
  });
});
