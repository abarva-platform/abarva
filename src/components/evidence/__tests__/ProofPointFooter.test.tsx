/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProofPointFooter } from '../ProofPointFooter';

describe('ProofPointFooter', () => {
  it('renders a non-zero proof-point count with source breakdown', () => {
    render(
      <ProofPointFooter
        surface="source"
        artifactRef="event-1"
        counts={{
          total: 12,
          tenantRecords: 9,
          corpusPatterns: 2,
          documentExtracts: 0,
          workshopOutputs: 0,
          liveTelemetry: 0,
          derived: 0,
          noEvidence: 1,
          notEnoughData: 1,
        }}
      />,
    );

    expect(screen.getByText('12 proof points')).toHaveAttribute(
      'href',
      '/evidence-ledger?surface=source&artifact_ref=event-1',
    );
    expect(screen.getByText(/9 from tenant records/)).toBeInTheDocument();
    expect(screen.getByText(/1 marked not enough data/)).toBeInTheDocument();
  });

  it('makes the zero state explicit rather than pretending proof exists', () => {
    render(
      <ProofPointFooter
        surface="moves"
        artifactRef="move-1"
        counts={{
          total: 0,
          tenantRecords: 0,
          corpusPatterns: 0,
          documentExtracts: 0,
          workshopOutputs: 0,
          liveTelemetry: 0,
          derived: 0,
          noEvidence: 0,
          notEnoughData: 0,
        }}
      />,
    );

    expect(screen.getByText('0 proof points')).toBeInTheDocument();
    expect(screen.getByText('No ledger-backed evidence yet.')).toBeInTheDocument();
  });
});
