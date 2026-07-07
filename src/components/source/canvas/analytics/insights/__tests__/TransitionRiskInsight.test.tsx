/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Transition transition-risk insight:
//   1. LIVE — renders the exposure band + fee-at-risk cap + the drivers read-out.
//   2. Honest empty — renders "needs evidence", never a $0 chart, when unsized.
//   3. Advisor layer present (milestone best-practice + downstream).

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

import { TransitionRiskInsight } from '../TransitionRiskInsight';
import type { TransitionRiskInsightView } from '../../view-model';

const LIVE: TransitionRiskInsightView = {
  kind: 'transition_risk',
  provenance: 'live',
  headline:
    '$1M–$1.5M at risk if the transition overruns (30% probability × 1.6× cost); a milestone-based plan caps the exposure to the $3.1M transition fee.',
  quantified: true,
  transitionFee: 3_100_000,
  exposureLow: 1_041_600,
  exposureHigh: 1_488_000,
  overrunProbabilityPct: 30,
  overrunCostMultiple: 1.6,
  confidence: 'low',
  bestPractice: ['Require a milestone-based transition plan with fee-at-risk on slippage.'],
  benchmark: 'Market range — AMS transitions overrun on ~25–35% of deals.',
  downstreamImpact: 'Transition ambiguity becomes retained-cost exposure and delayed value.',
};

const EMPTY: TransitionRiskInsightView = {
  kind: 'transition_risk',
  provenance: 'sample',
  headline: 'Provide the transition fee and overrun-probability benchmark to size the transition-risk exposure.',
  quantified: false,
  transitionFee: 0,
  exposureLow: 0,
  exposureHigh: 0,
  overrunProbabilityPct: 0,
  overrunCostMultiple: 0,
  confidence: 'low',
  note: 'Needs evidence — missing transition_fee, overrun_probability. Not a tenant claim.',
  bestPractice: ['Require a milestone-based transition plan with fee-at-risk on slippage.'],
  downstreamImpact: 'Transition ambiguity becomes retained-cost exposure and delayed value.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('TransitionRiskInsight', () => {
  it('renders LIVE: the exposure band, the fee-at-risk cap, and the drivers', () => {
    const { container } = render(<TransitionRiskInsight insight={LIVE} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
    // Chart mounted with rectangles (exposure + cap).
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
    // Read-out surfaces the drivers.
    const readout = screen.getByTestId('transition-risk-readout');
    expect(readout).toHaveTextContent('30%');
    expect(readout).toHaveTextContent('1.6×');
    // Advisor layer.
    expect(screen.getByTestId('advisor-best-practice')).toBeInTheDocument();
    expect(screen.getByTestId('advisor-downstream')).toBeInTheDocument();
  });

  it('renders an honest empty (never $0) when unsized', () => {
    render(<TransitionRiskInsight insight={EMPTY} />);
    expect(screen.getByTestId('transition-risk-empty')).toBeInTheDocument();
    expect(screen.getByText(/needs evidence/i)).toBeInTheDocument();
    // No live badge on an unsized insight.
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(/live/i);
  });
});
