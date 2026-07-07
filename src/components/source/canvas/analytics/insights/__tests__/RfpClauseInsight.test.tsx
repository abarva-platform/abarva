/**
 * @jest-environment jsdom
 */

// Render + honesty invariants for the RFP lever-to-clause coverage insight:
//   1. Renders one bar per lever, and a clause library for the exposed levers.
//   2. The clause library shows the EXACT rfpClause + bafoAsk text.
//   3. Renders the advisor layer (best-practice / benchmark / downstream).
//   4. Is a clearly-badged MODEL (no RFP-draft signal in the fact model yet).

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

import { RfpClauseInsight } from '../RfpClauseInsight';
import type { RfpClauseInsightView } from '../../view-model';

const MODEL_COVERAGE: RfpClauseInsightView = {
  kind: 'rfp_clause_coverage',
  provenance: 'sample',
  headline:
    'Your $4M–$6M pool depends on 2 levers; best-in-class AMS RFPs protect each with a clause — 2 still exposed ($4M–$6M).',
  rows: [
    {
      leverKey: 'AMS.ENHANCEMENT_LEAKAGE',
      label: 'Change-order leakage',
      valueType: 'protected',
      low: 1_800_000,
      high: 2_600_000,
      protected: false,
      rfpClause:
        'Require vendors to classify recurring support vs enhancement and price a fixed service catalog.',
      bafoAsk:
        'Convert the recurring change-order categories into a fixed service catalog or capped unit-rate structure.',
    },
    {
      leverKey: 'AMS.VOLUME_BAND_PRICING',
      label: 'Volume-band price flex-down',
      valueType: 'incremental_negotiated',
      low: 1_200_000,
      high: 1_900_000,
      protected: false,
      rfpClause:
        'Require a resource-unit pricing schedule with explicit volume bands and step-down thresholds.',
      bafoAsk: 'Add volume-band step-down pricing so cost falls when volumes reduce.',
    },
  ],
  isModel: true,
  note: 'Model — no structured RFP draft is in the fact model yet, so every lever is shown as a clause to require.',
  bestPractice: ['Every priced lever needs a matching RFP clause.'],
  benchmark: 'Market range — ~70% of AMS RFPs omit the volume-band step-down clause.',
  downstreamImpact: 'The RFP is the last point to lock a lever into a requirement.',
};

function countBars(container: HTMLElement): number {
  return container.querySelectorAll('.recharts-bar-rectangle').length;
}

describe('RfpClauseInsight', () => {
  it('renders a bar per lever and the exact clause text for exposed levers', () => {
    const { container } = render(<RfpClauseInsight insight={MODEL_COVERAGE} />);
    expect(countBars(container)).toBeGreaterThanOrEqual(2);
    const library = screen.getByTestId('rfp-clause-library');
    // Exact rfpClause text from the playbook is rendered.
    expect(library).toHaveTextContent(/classify recurring support vs enhancement/i);
    // The BAFO fallback is rendered too.
    expect(library).toHaveTextContent(/fixed service catalog/i);
  });

  it('is a clearly-badged MODEL (no RFP-draft signal yet)', () => {
    render(<RfpClauseInsight insight={MODEL_COVERAGE} />);
    expect(screen.getByTestId('insight-provenance')).toHaveTextContent(/model/i);
    expect(screen.getByTestId('insight-provenance')).not.toHaveTextContent(/live/i);
    expect(screen.getByText(/no structured RFP draft/i)).toBeInTheDocument();
  });

  it('renders the advisor layer (best-practice / benchmark / downstream)', () => {
    render(<RfpClauseInsight insight={MODEL_COVERAGE} />);
    expect(screen.getByTestId('advisor-best-practice')).toBeInTheDocument();
    expect(screen.getByTestId('advisor-benchmark')).toHaveTextContent(
      /market range/i,
    );
    expect(screen.getByTestId('advisor-downstream')).toHaveTextContent(
      /last point to lock/i,
    );
  });
});
