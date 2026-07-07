/**
 * @jest-environment jsdom
 */

// Honesty invariants for the Pricing value-bridge insight (the value-type
// waterfall as Recharts). These must never regress:
//   1. An insufficient-evidence band renders "needs evidence" — NEVER a $0.
//   2. Only quantified bands become chart bars (insufficient bands never inflate
//      the chart with a fabricated number).
//   3. The doctrine footer + provenance badge are present.

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

import { ValueBridgeInsight } from '../ValueBridgeInsight';
import type { ValueBridgeInsightView } from '../../view-model';

const BRIDGE: ValueBridgeInsightView = {
  kind: 'value_bridge',
  provenance: 'live',
  headline: '$1M–$2M of classified value — every band math over a cited fact.',
  waterfall: {
    provenance: 'live',
    baselineLabel: 'Value at stake',
    baselineAmount: 10_000_000,
    unit: 'usd',
    bands: [
      {
        id: 'b-quantified',
        valueType: 'protected',
        label: 'Change-order leakage folded to base',
        amountLow: 1_200_000,
        amountHigh: 1_800_000,
        unit: 'usd',
        confidence: 'med',
        state: 'quantified',
        citation: { doc: 'Incumbent MSA', locator: 'Sch. C' },
      },
      {
        id: 'b-insufficient',
        valueType: 'solution_tightening',
        label: 'Automation credit — no committed schedule yet',
        amountLow: 0,
        amountHigh: 0,
        unit: 'usd',
        confidence: 'low',
        state: 'insufficient_evidence',
        citation: null,
      },
    ],
  },
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('ValueBridgeInsight — honesty invariants', () => {
  it('renders an insufficient-evidence band as "needs evidence", never a $0 figure', () => {
    render(<ValueBridgeInsight insight={BRIDGE} />);
    // The insufficient band shows the honest label...
    const needsEvidence = screen.getByText('needs evidence');
    expect(needsEvidence).toBeInTheDocument();
    // ...and its row carries NO fabricated $ figure (the band label is present
    // but no dollar amount). A "$0" chart-axis origin tick is legitimate and not
    // part of the band, so we scope the assertion to the insufficient band row.
    const bandRow = needsEvidence.closest('div');
    expect(bandRow).not.toBeNull();
    expect(bandRow?.textContent ?? '').not.toMatch(/\$/);
  });

  it('only quantified bands become chart bars (insufficient never inflate it)', () => {
    const { container } = render(<ValueBridgeInsight insight={BRIDGE} />);
    // One quantified band → offset + span = up to 2 rectangles; the insufficient
    // band contributes NO chart bar (it is listed as "needs evidence" instead).
    const bars = countBars(container);
    expect(bars).toBeGreaterThanOrEqual(1);
    expect(bars).toBeLessThanOrEqual(2);
  });

  it('shows the doctrine footer and the provenance badge', () => {
    render(<ValueBridgeInsight insight={BRIDGE} />);
    expect(screen.getByText(/classified movement, not a headline discount/i)).toBeInTheDocument();
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/live/i);
  });

  it('renders the empty state when no band is quantified (never a $0 chart)', () => {
    const allInsufficient: ValueBridgeInsightView = {
      ...BRIDGE,
      waterfall: {
        ...BRIDGE.waterfall,
        bands: [BRIDGE.waterfall.bands[1]], // only the insufficient band
      },
    };
    const { container } = render(<ValueBridgeInsight insight={allInsufficient} />);
    expect(screen.getByTestId('value-bridge-empty')).toBeInTheDocument();
    expect(countBars(container)).toBe(0);
    expect(screen.getByText('needs evidence')).toBeInTheDocument();
  });
});
