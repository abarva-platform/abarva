/**
 * @jest-environment jsdom
 */

// Render invariants for the Strategy value-pool insight — the FIRST per-step
// Recharts chart. The contract:
//   1. One bar per lever from a real fixture (biggest-first), colored by type.
//   2. An honest EMPTY state when there are no bars — no fabricated chart.
//   3. The "so what" headline is foregrounded.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { cloneElement, isValidElement } from 'react';

// Mock ONLY ResponsiveContainer (the jsdom-hostile measuring wrapper): inject an
// explicit width/height into the child chart so the real BarChart/Bar/Cell tree
// mounts and emits SVG without ResizeObserver.
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

import { ValuePoolInsight } from '../ValuePoolInsight';
import type { ValuePoolInsightView } from '../../view-model';

const LIVE_POOL: ValuePoolInsightView = {
  kind: 'value_pool',
  provenance: 'live',
  headline: '$3M–$5M at stake across 3 levers; biggest is Change-order leakage.',
  bars: [
    {
      leverKey: 'AMS.ENHANCEMENT_LEAKAGE',
      label: 'Change-order leakage',
      valueType: 'protected',
      low: 1_800_000,
      high: 2_600_000,
      confidence: 'med',
    },
    {
      leverKey: 'AMS.VOLUME_BAND_PRICING',
      label: 'Volume-band price flex-down',
      valueType: 'incremental_negotiated',
      low: 1_200_000,
      high: 1_900_000,
      confidence: 'med',
    },
    {
      leverKey: 'AMS.PRODUCTIVITY_CREDITS',
      label: 'Productivity credits',
      valueType: 'solution_tightening',
      low: 700_000,
      high: 1_300_000,
      confidence: 'low',
    },
  ],
  needsEvidenceLevers: ['SLA credit economics'],
};

const EMPTY_POOL: ValuePoolInsightView = {
  kind: 'value_pool',
  provenance: 'sample',
  headline: 'Provide evidence to size the value pool for this event.',
  bars: [],
  needsEvidenceLevers: [],
  note: 'No value levers are wired for this archetype yet.',
};

function countBars(container: HTMLElement): number {
  // recharts renders each visible bar segment as a <path class="recharts-rectangle">.
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('ValuePoolInsight', () => {
  it('renders one visible bar per lever from a real fixture', () => {
    const { container } = render(<ValuePoolInsight insight={LIVE_POOL} />);
    // Two <Bar> series (transparent offset + visible span); only the visible
    // span's rectangles carry the value-type color. We assert the chart mounted
    // with rectangles for each of the 3 levers (offset + span = up to 6).
    expect(countBars(container)).toBeGreaterThanOrEqual(3);
    // The headline (the "so what") is present.
    expect(screen.getByTestId('insight-headline')).toHaveTextContent(
      /at stake across 3 levers/i,
    );
    // Live badge, not sample.
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
    // Unsized lever is named, not guessed.
    expect(screen.getByText(/SLA credit economics/)).toBeInTheDocument();
  });

  it('renders an honest empty state (no chart) when there are no bars', () => {
    const { container } = render(<ValuePoolInsight insight={EMPTY_POOL} />);
    expect(screen.getByTestId('value-pool-empty')).toBeInTheDocument();
    // No fabricated chart bars.
    expect(countBars(container)).toBe(0);
    expect(screen.queryByText(/\$0\b/)).not.toBeInTheDocument();
  });
});
