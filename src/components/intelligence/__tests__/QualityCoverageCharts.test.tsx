/**
 * @jest-environment jsdom
 */

// Honesty + render invariants for the Quality-lens Recharts visualizations —
// the FIRST Recharts charts in the app. The contract these guard:
//   1. A real domainCoverage fixture renders bars (one per domain) — real data.
//   2. An empty domainCoverage renders the honest empty state — no chart, no
//      fabricated bars, no invented series.
//   3. A zero-total contradiction summary renders the honest empty state
//      ("No contradictions logged yet"), NEVER a zero/empty donut.
//
// Recharts' ResponsiveContainer measures its parent with ResizeObserver, which
// jsdom does not implement — so we mock it to render its child at a fixed size.
// This lets the real BarChart / PieChart / Bar / Cell tree mount and emit SVG.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock ONLY ResponsiveContainer (the jsdom-hostile measuring wrapper). Recharts
// 3.x skips rendering the chart body when it measures a 0×0 parent (jsdom has no
// layout), so instead of wrapping we inject explicit width/height into the child
// chart element — BarChart / PieChart accept those directly and render their real
// SVG (Bar / Pie / Cell) without any measurement. The real chart tree is exercised.
import { cloneElement, isValidElement } from 'react';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ width?: number; height?: number }>, {
            width: 640,
            height: 320,
          })
        : children,
  };
});

import { QualityCoverageCharts } from '../charts/QualityCoverageCharts';
import type {
  DomainCoverageRow,
  ContradictionStatusSummary,
} from '@/lib/intelligence/intelligence-quality-lens-view';

const DOMAIN_ROWS: DomainCoverageRow[] = [
  { id: 'ai-programs', domain: 'AI Programs', patternCount: 14, hasDetailFixtures: false, coverage: 'strong' },
  { id: 'sourcing', domain: 'Sourcing', patternCount: 8, hasDetailFixtures: false, coverage: 'moderate' },
  { id: 'industry', domain: 'Industry', patternCount: 4, hasDetailFixtures: false, coverage: 'thin' },
];

const CONTRA_WITH_DATA: ContradictionStatusSummary = {
  open: 2,
  underReview: 1,
  resolvedTowardA: 3,
  resolvedTowardB: 1,
  acceptedAsTension: 1,
  total: 8,
};

const CONTRA_EMPTY: ContradictionStatusSummary = {
  open: 0,
  underReview: 0,
  resolvedTowardA: 0,
  resolvedTowardB: 0,
  acceptedAsTension: 0,
  total: 0,
};

function countBars(container: HTMLElement): number {
  // Recharts renders each Bar datum as a <path class="recharts-rectangle" />
  // inside a <g class="recharts-bar-rectangle">. Count the rectangle groups.
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('QualityCoverageCharts — render + honesty', () => {
  it('renders one bar per domainCoverage row for a real fixture', () => {
    const { container } = render(
      <QualityCoverageCharts
        domainCoverage={DOMAIN_ROWS}
        contradictionStatus={CONTRA_WITH_DATA}
      />,
    );

    // The domain-coverage chart mounts...
    expect(screen.getByTestId('domain-coverage-chart')).toBeInTheDocument();
    // ...with exactly one bar per real domain row (no fabricated extras).
    expect(countBars(container)).toBe(DOMAIN_ROWS.length);
    // Axis labels present (real domain names).
    expect(screen.getAllByText('AI Programs').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the empty state (no chart, no fabricated bars) when domainCoverage is empty', () => {
    const { container } = render(
      <QualityCoverageCharts
        domainCoverage={[]}
        contradictionStatus={CONTRA_WITH_DATA}
      />,
    );

    // No chart mounted for the coverage section...
    expect(screen.queryByTestId('domain-coverage-chart')).not.toBeInTheDocument();
    // ...zero bars (never invents a series)...
    expect(countBars(container)).toBe(0);
    // ...and the honest empty message is shown.
    expect(
      screen.getByText(/No domain coverage recorded yet/i),
    ).toBeInTheDocument();
  });

  it('renders the honest empty state for a zero-total contradiction summary (never a zero donut)', () => {
    render(
      <QualityCoverageCharts
        domainCoverage={DOMAIN_ROWS}
        contradictionStatus={CONTRA_EMPTY}
      />,
    );

    // No donut chart when there is nothing to chart...
    expect(
      screen.queryByTestId('contradiction-status-chart'),
    ).not.toBeInTheDocument();
    // ...the honest message stands in its place.
    expect(
      screen.getByText(/No contradictions logged yet/i),
    ).toBeInTheDocument();
  });

  it('renders the donut when contradictions exist', () => {
    const { container } = render(
      <QualityCoverageCharts
        domainCoverage={DOMAIN_ROWS}
        contradictionStatus={CONTRA_WITH_DATA}
      />,
    );

    expect(
      screen.getByTestId('contradiction-status-chart'),
    ).toBeInTheDocument();
    // The real total is surfaced honestly beneath the donut (text nodes span
    // multiple elements, so assert on the composed caption text).
    const chart = screen.getByTestId('contradiction-status-chart');
    const caption = chart.parentElement?.textContent ?? container.textContent ?? '';
    expect(caption).toMatch(/8\s*contradictions total/i);
  });
});
