/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Executive Decision insight:
//   1. LIVE — renders the classified value buckets, each stated apart.
//   2. Surfaces the residual-risk read (levers still needing evidence).
//   3. Never folds protected/risk into the negotiable number.

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

import { ExecDecisionInsight } from '../ExecDecisionInsight';
import type { ExecDecisionInsightView } from '../../view-model';

const LIVE: ExecDecisionInsightView = {
  kind: 'exec_decision',
  provenance: 'live',
  headline:
    'Net negotiable value $2M–$3M; protected $1.5M–$2M, risk-adjusted $0.7M–$1.2M stated apart — med confidence.',
  slices: [
    { bucket: 'negotiable', label: 'Net negotiable value', low: 2_000_000, high: 3_000_000, valueTypes: ['incremental_negotiated', 'solution_tightening'] },
    { bucket: 'protected', label: 'Protected value (risk hedge)', low: 1_500_000, high: 2_000_000, valueTypes: ['protected'] },
    { bucket: 'risk_adjusted', label: 'Risk-adjusted (TCO normalization)', low: 700_000, high: 1_200_000, valueTypes: ['risk_adjusted'] },
  ],
  confidence: 'med',
  computedLeverCount: 3,
  residualRiskLeverCount: 2,
  residualRiskLevers: ['SLA credit economics', 'Productivity / automation not priced back'],
  bestPractice: ['State protected and risk-adjusted value apart.'],
  benchmark: 'Market range — board-grade decisions separate earned value from protected value.',
  downstreamImpact: 'The executive decision sets the mandate for BAFO and award.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('ExecDecisionInsight', () => {
  it('renders LIVE: the classified value buckets stated apart', () => {
    const { container } = render(<ExecDecisionInsight insight={LIVE} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
    // Three range bars (one per bucket).
    expect(countBars(container)).toBeGreaterThanOrEqual(3);
    // The headline states negotiable value apart from protected/risk.
    expect(screen.getByTestId('insight-headline')).toHaveTextContent(/negotiable/i);
    expect(screen.getByTestId('insight-headline')).toHaveTextContent(/apart/i);
  });

  it('surfaces the residual-risk read (unsized levers named, never a number)', () => {
    render(<ExecDecisionInsight insight={LIVE} />);
    const residual = screen.getByTestId('exec-decision-residual');
    expect(residual).toHaveTextContent(/residual risk/i);
    expect(residual).toHaveTextContent('SLA credit economics');
    expect(residual).toHaveTextContent(/pending|never as a number/i);
  });
});
