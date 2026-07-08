/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Evaluation should-cost insight:
//   1. Renders the vendor comparison (headline vs normalized TCO).
//   2. Is clearly marked a MODEL (not live) — vendor bids aren't in the fact
//      model yet, so it must never masquerade as real bids.
//   3. Surfaces the flip: the paper-cheapest vendor is NOT the normalized winner.

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

import { ShouldCostInsight } from '../ShouldCostInsight';
import type { ShouldCostInsightView } from '../../view-model';

const MODEL: ShouldCostInsightView = {
  kind: 'should_cost_normalization',
  provenance: 'sample',
  headline:
    'Vendor B is cheapest on paper ($21.9M); normalized, Vendor A wins by $6M.',
  vendors: [
    {
      vendorKey: 'vendor_a',
      label: 'Vendor A',
      headlinePrice: 24_800_000,
      adjustments: [{ label: 'Retained FTE', amount: 2_340_000 }],
      normalizedTco: 27_140_000,
    },
    {
      vendorKey: 'vendor_b',
      label: 'Vendor B',
      headlinePrice: 21_900_000,
      adjustments: [{ label: 'Retained FTE', amount: 8_190_000 }],
      normalizedTco: 30_090_000,
    },
  ],
  headlineWinnerKey: 'vendor_b',
  normalizedWinnerKey: 'vendor_a',
  isModel: true,
  note: 'Model — illustrative AMS vendors. Goes live when vendor responses are ingested.',
};

const LIVE: ShouldCostInsightView = {
  kind: 'should_cost_normalization',
  provenance: 'live',
  headline:
    'Vega Systems is cheapest on paper ($21.9M); normalized for retained cost and SLA risk, Orion Managed wins by $338K.',
  vendors: [
    {
      vendorKey: 'Vega Systems',
      label: 'Vega Systems',
      headlinePrice: 21_900_000,
      adjustments: [
        { label: 'Retained FTE (20 @ $195K)', amount: 3_900_000 },
        { label: 'SLA-credit risk (cap 6% vs 15% benchmark)', amount: 118_260 },
      ],
      normalizedTco: 25_918_260,
    },
    {
      vendorKey: 'Orion Managed',
      label: 'Orion Managed',
      headlinePrice: 24_800_000,
      adjustments: [{ label: 'Retained FTE (4 @ $195K)', amount: 780_000 }],
      normalizedTco: 25_580_000,
      needsEvidence: [],
    },
  ],
  headlineWinnerKey: 'Vega Systems',
  normalizedWinnerKey: 'Orion Managed',
  isModel: false,
  note: 'Live — normalized from the vendor bids you provided.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('ShouldCostInsight', () => {
  it('renders the vendor comparison (both vendors, headline → TCO)', () => {
    const { container } = render(<ShouldCostInsight insight={MODEL} />);
    // Both vendors appear in the read-out.
    const readout = screen.getByTestId('should-cost-readout');
    expect(readout).toHaveTextContent('Vendor A');
    expect(readout).toHaveTextContent('Vendor B');
    // The chart mounted with rectangles (headline + adjustment segments).
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
  });

  it('is clearly marked a MODEL, not live (never real bids)', () => {
    render(<ShouldCostInsight insight={MODEL} />);
    // Badge reads "Model", not "Live".
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(/live/i);
    // The honesty note is present.
    expect(
      screen.getByText(/Goes live when vendor responses are ingested/i),
    ).toBeInTheDocument();
  });

  it('surfaces the flip: the normalized winner ≠ the paper-cheapest', () => {
    render(<ShouldCostInsight insight={MODEL} />);
    expect(screen.getByText(/✓ normalized winner/)).toBeInTheDocument();
    // "cheapest on paper" appears in the headline AND the loser's read-out badge.
    expect(screen.getAllByText(/cheapest on paper/i).length).toBeGreaterThanOrEqual(1);
    // The headline states the trap.
    expect(screen.getByTestId('insight-headline')).toHaveTextContent(
      /cheapest on paper/i,
    );
  });

  it('renders LIVE (badge reads Live, not Model) when normalized from real bids', () => {
    render(<ShouldCostInsight insight={LIVE} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(/model/i);
    // The flip still surfaces from the live bids.
    expect(screen.getByText(/✓ normalized winner/)).toBeInTheDocument();
    const readout = screen.getByTestId('should-cost-readout');
    expect(readout).toHaveTextContent('Vega Systems');
    expect(readout).toHaveTextContent('Orion Managed');
  });
});
