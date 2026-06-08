/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { DiscoveryReceiptCard } from '../DiscoveryReceiptCard';
import { planDiscoveryExtraction } from '@/lib/programs/discovery/extraction-planner';
import { emptyDiscoveryShape } from '@/lib/programs/discovery/discovery-intake';
import type { ExtractedProgramEvidence } from '@/lib/programs/evidence-ingestion';

function receipt() {
  const evidence: ExtractedProgramEvidence = {
    evidenceType: 'architecture_inventory',
    title: 'inv',
    summary: 's',
    extractedText: '',
    extractedStructured: {
      decisions: ['Adopt Databricks'],
      action_items: [],
      risks: ['PHI exposure'],
      baseline_candidates: ['Epic Clarity', 'SAP ERP'],
      attendees: [],
      parse_method: 'xlsx',
      warnings: [],
    },
    confidence: 0.9,
  };
  return planDiscoveryExtraction(evidence, emptyDiscoveryShape(), { sourceFile: 'inv.xlsx' }).receipt;
}

describe('DiscoveryReceiptCard', () => {
  it('renders the source, every stage, and the summary', () => {
    render(<DiscoveryReceiptCard receipt={receipt()} />);
    expect(screen.getByText('inv.xlsx')).toBeTruthy();
    for (const stage of ['staged', 'parsed', 'extracted', 'routed', 'review']) {
      expect(screen.getByText(stage)).toBeTruthy();
    }
    expect(screen.getByText(/routed 2 to landscape/)).toBeTruthy();
  });

  it('surfaces the evidence-only (unmapped) count without faking it into fields', () => {
    render(<DiscoveryReceiptCard receipt={receipt()} />);
    expect(screen.getAllByText(/kept as evidence only/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('discovery-receipt-card')).toBeTruthy();
  });
});
