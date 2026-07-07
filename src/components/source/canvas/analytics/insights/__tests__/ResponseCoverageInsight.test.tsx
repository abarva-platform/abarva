/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the Responses vendor dodge-map insight:
//   1. MODEL badge — vendor-response facts aren't in the fact model yet.
//   2. Renders the per-dimension bars + the dodged read-out (evaluation impact).
//   3. Names the fact that flips it live.

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

import { ResponseCoverageInsight } from '../ResponseCoverageInsight';
import type { ResponseCoverageInsightView } from '../../view-model';

const MODEL: ResponseCoverageInsightView = {
  kind: 'response_coverage',
  provenance: 'sample',
  headline: '$5M–$8M across 3 value dimensions depends on a vendor answer; every dimension is shown unanswered.',
  rows: [
    { leverKey: 'AMS.ENHANCEMENT_LEAKAGE', label: 'Enhancement / change-order leakage', valueType: 'protected', low: 1_800_000, high: 2_600_000, status: 'dodged', evaluationImpact: 'Penalize vague enhancement exclusions.' },
    { leverKey: 'AMS.VOLUME_BAND_PRICING', label: 'Volume-band price flex-down', valueType: 'incremental_negotiated', low: 1_200_000, high: 1_900_000, status: 'dodged', evaluationImpact: 'Disqualify pricing with no band step-down.' },
  ],
  flipFact: 'Vendor responses ingested per lever/clause (a parsed vendor proposal whose commitments are extracted).',
  note: 'Model — vendor-response facts are not in the fact model yet.',
  bestPractice: ['Score each dimension on whether the vendor committed.'],
  benchmark: 'Market range — vendors under-answer SLA remedies.',
  downstreamImpact: 'A dodged dimension not pressed becomes an exposed lever at award.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('ResponseCoverageInsight', () => {
  it('is a MODEL, renders the per-dimension bars', () => {
    const { container } = render(<ResponseCoverageInsight insight={MODEL} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
  });

  it('surfaces the dodged read-out (evaluation impact) + names the flip fact', () => {
    render(<ResponseCoverageInsight insight={MODEL} />);
    const dodged = screen.getByTestId('response-coverage-dodged');
    expect(dodged).toHaveTextContent(/vague enhancement exclusions/i);
    const flip = screen.getByTestId('response-coverage-flip');
    expect(flip).toHaveTextContent(/vendor responses ingested/i);
  });
});
