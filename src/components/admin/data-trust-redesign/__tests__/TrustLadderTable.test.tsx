/**
 * @jest-environment jsdom
 */

// TrustLadderTable · per-segment unlock preview render.
//
// Wave 3 PR 2 from SETUP_AUDIT_2026-05-30_VERDICT.md §7.
//
// Coverage:
//   - Sparse rung (Empty / Loaded / Available) renders an unlock-preview
//     block under the row with question + citation example.
//   - Mature rung (Decision-grade / Usable evidence) hides the block.
//   - The preview labels the agent that would answer.

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { TrustLadderTable } from '../TrustLadderTable';
import type { TrustLadderRow } from '@/lib/admin/data-trust-composer';

function sparseRow(): TrustLadderRow {
  return {
    segmentId: 'kpi_dictionary',
    segmentName: 'KPI dictionary',
    familyNumber: 5,
    records: 0,
    trustRung: 'Empty',
    unlocks: 'Outcome attribution — Nexus ties programs to measured KPIs',
    unlocksPreview: {
      question: 'Why did same-store comp slow in Q3?',
      citationExample: 'Apex KPI Dictionary §SSC: comp-store basis — 13-month tenure, ex-fuel',
      agent: 'sentinel',
    },
    isSparse: true,
    nextAction: 'Load',
  };
}

function matureRow(): TrustLadderRow {
  return {
    segmentId: 'enterprise_profile',
    segmentName: 'Enterprise profile',
    familyNumber: 1,
    records: 42,
    trustRung: 'Decision-grade',
    unlocks: 'Steward can anchor the tenant to legal entity',
    unlocksPreview: {
      question: 'Which legal entities sit under our holding company?',
      citationExample: 'Enterprise Profile §Entities: Apex Retail Inc. (DE)',
      agent: 'sentinel',
    },
    isSparse: false,
    nextAction: '—',
  };
}

describe('TrustLadderTable · unlock preview (Wave 3 PR 2)', () => {
  it('sparse segment renders the unlock-preview block with question + citation', () => {
    render(
      <TrustLadderTable
        rows={[sparseRow()]}
        expanded={true}
        baseHref="/admin/data-trust"
      />,
    );

    const block = screen.getByTestId('unlock-preview-kpi_dictionary');
    expect(block).toBeInTheDocument();

    const question = screen.getByTestId('unlock-preview-question-kpi_dictionary');
    expect(question).toHaveTextContent('Why did same-store comp slow in Q3?');

    const citation = screen.getByTestId('unlock-preview-citation-kpi_dictionary');
    expect(citation).toHaveTextContent(
      'Apex KPI Dictionary §SSC: comp-store basis — 13-month tenure, ex-fuel',
    );

    // Agent label appears in the eyebrow.
    expect(block).toHaveTextContent(/sentinel/i);
    expect(block).toHaveTextContent(/would cite/i);
  });

  it('mature segment does NOT render an unlock-preview block', () => {
    render(
      <TrustLadderTable
        rows={[matureRow()]}
        expanded={true}
        baseHref="/admin/data-trust"
      />,
    );

    expect(screen.queryByTestId('unlock-preview-enterprise_profile')).toBeNull();
  });

  it('mixed rows show previews only for sparse segments', () => {
    render(
      <TrustLadderTable
        rows={[sparseRow(), matureRow()]}
        expanded={true}
        baseHref="/admin/data-trust"
      />,
    );

    expect(screen.getByTestId('unlock-preview-kpi_dictionary')).toBeInTheDocument();
    expect(screen.queryByTestId('unlock-preview-enterprise_profile')).toBeNull();
  });
});
