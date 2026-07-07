/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Scope scope-to-value coverage insight:
//   1. Renders one bar per lever (reachable + stranded) from a real fixture.
//   2. Surfaces WHY a stranded lever is stranded (its missing evidence family).
//   3. Renders the advisor layer (best-practice / benchmark / downstream).
//   4. A no-facts MODEL is clearly badged with no fabricated tenant numbers.

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

import { ScopeCoverageInsight } from '../ScopeCoverageInsight';
import type { ScopeCoverageInsightView } from '../../view-model';

const LIVE_COVERAGE: ScopeCoverageInsightView = {
  kind: 'scope_coverage',
  provenance: 'live',
  headline:
    '$1.8M–$2.6M of $4M–$6M reachable under current scope; $2.2M–$3.4M stranded — biggest is Volume-band price flex-down, blocked on ticket volumes.',
  rows: [
    {
      leverKey: 'AMS.ENHANCEMENT_LEAKAGE',
      label: 'Change-order leakage',
      valueType: 'protected',
      low: 1_800_000,
      high: 2_600_000,
      reachable: true,
      requiredEvidence: ['ticket volumes', 'contract baseline'],
      missingEvidence: [],
    },
    {
      leverKey: 'AMS.VOLUME_BAND_PRICING',
      label: 'Volume-band price flex-down',
      valueType: 'incremental_negotiated',
      low: 1_200_000,
      high: 1_900_000,
      reachable: false,
      requiredEvidence: ['ticket volumes', 'run-cost baseline'],
      missingEvidence: ['ticket volumes', 'run-cost baseline'],
    },
  ],
  isModel: false,
  bestPractice: ['AMS scope must carry ticket volumes + a retained boundary.'],
  benchmark: 'Market range — comparable AMS events scope ~6–9 towers.',
  downstreamImpact: 'Scope sets your ceiling.',
};

const MODEL_COVERAGE: ScopeCoverageInsightView = {
  ...LIVE_COVERAGE,
  provenance: 'sample',
  isModel: true,
  headline: 'A complete scope unlocks $3M–$4.5M across 2 levers.',
  note: 'Model — with no scope evidence landed, every lever is shown as what a complete scope would unlock.',
  rows: LIVE_COVERAGE.rows.map((r) => ({ ...r, reachable: true, missingEvidence: [] })),
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('ScopeCoverageInsight', () => {
  it('renders a bar per lever and names why a stranded lever is stranded', () => {
    const { container } = render(<ScopeCoverageInsight insight={LIVE_COVERAGE} />);
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
    // Live badge.
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
    // Stranded read-out names the missing evidence.
    const stranded = screen.getByTestId('scope-coverage-stranded');
    expect(stranded).toHaveTextContent('Volume-band price flex-down');
    expect(stranded).toHaveTextContent(/ticket volumes/i);
    // Headline states reachable vs stranded.
    expect(screen.getByTestId('insight-headline')).toHaveTextContent(/stranded/i);
  });

  it('renders the advisor layer (best-practice / benchmark / downstream)', () => {
    render(<ScopeCoverageInsight insight={LIVE_COVERAGE} />);
    expect(screen.getByTestId('advisor-best-practice')).toBeInTheDocument();
    expect(screen.getByTestId('advisor-benchmark')).toHaveTextContent(
      /market range/i,
    );
    expect(screen.getByTestId('advisor-downstream')).toHaveTextContent(/ceiling/i);
  });

  it('a no-facts MODEL is clearly badged, no fabricated tenant state', () => {
    render(<ScopeCoverageInsight insight={MODEL_COVERAGE} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(
      screen.getByText(/complete scope would unlock/i),
    ).toBeInTheDocument();
  });
});
