// Source · d16 Evaluation Scorecard · pdf renderer
//
// PDF companion to scorecard-docx.ts (Slice 5) and the xlsx (Slice 2b).
// The xlsx is where scoring happens (weighted formulas, variable
// vendor columns). This PDF is the print-ready reference doc — the
// rubric record filed alongside the scored xlsx, or distributed before
// the evaluation panel meets.
//
// Sections:
//   1. Cover
//   2. Criteria & weights (locked; sums to 100)
//   3. Vendors under evaluation (locked, from d12 shortlist)
//   4. Score guidance (locked 1-5 rubric)
//   5. Decision notes seed topics

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfKeyValueTable,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import { sourceArtifactGovernanceBanner } from '@/lib/source/artifact-governance';
import type { ScorecardPayload } from './scorecard';

export function buildScorecardPdf(
  payload: ScorecardPayload,
): ReactElement<DocumentProps> {
  const totalWeight = payload.criteria.reduce(
    (acc, c) => acc + c.weightPercent,
    0,
  );
  return buildStructuredPdfDocument({
    documentTitle: `Evaluation Scorecard · ${payload.eventCode}`,
    subject: `d16 Evaluation Scorecard reference doc for sourcing event ${payload.eventCode}.`,
    eyebrow: `d16 · Evaluation Scorecard · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
      ...(payload.roundLabel ? [{ label: 'Evaluation round', value: payload.roundLabel }] : []),
    ],
    governanceNotice: sourceArtifactGovernanceBanner('ai_draft', {
      artifactCode: 'd16',
    }),
    introNote:
      'This PDF is the reference rubric for the evaluation panel. ' +
      'Actual per-vendor scoring happens in the d16 xlsx companion ' +
      '(weighted formulas, variable vendor columns, totals). Use this ' +
      'document for pre-meeting distribution and post-meeting filing.',
    confidentialityNote: 'Confidential — evaluation panel only',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Evaluation Scorecard`,
    body: (
      <>
        <StructuredPdfHeading>Criteria & weights</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.criteria.length} criteria. Weights must sum to 100. Current total: ${totalWeight}%${totalWeight === 100 ? ' (balanced)' : ' — re-derive via d17 weight log'}.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Criterion ID', flex: 1.2, extract: (r) => r.id },
            { header: 'Criterion', flex: 1.8, extract: (r) => r.label },
            { header: 'Weight (%)', flex: 0.9, extract: (r) => String(r.weightPercent) },
            { header: 'Description', flex: 4, extract: (r) => r.description },
          ]}
          rows={payload.criteria}
          emptyLabel="No criteria defined — populate the scorecard before the panel meets."
        />
        <StructuredPdfHeading>Vendors under evaluation</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.vendors.length} vendor${payload.vendors.length === 1 ? '' : 's'} from d12 shortlist. Each vendor will be scored against every criterion above on a 1-5 scale.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: '#', flex: 0.4, extract: (r: { name: string; idx: number }) => String(r.idx + 1) },
            { header: 'Vendor', flex: 4.6, extract: (r: { name: string; idx: number }) => r.name },
          ]}
          rows={payload.vendors.map((v, i) => ({ name: v, idx: i }))}
          emptyLabel="No vendors on the shortlist yet."
        />
        <StructuredPdfHeading>Score guidance</StructuredPdfHeading>
        <StructuredPdfNote>
          Locked rubric. Apply the same definition consistently across every vendor.
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Score', flex: 0.6, extract: (r) => String(r.score) },
            { header: 'Label', flex: 1.4, extract: (r) => r.label },
            { header: 'Rubric', flex: 4, extract: (r) => r.rubric },
          ]}
          rows={payload.scoreGuidance}
          emptyLabel="No score guidance defined for this scorecard."
        />
        <StructuredPdfHeading>Decision notes (seed topics)</StructuredPdfHeading>
        <StructuredPdfNote>
          Populate these narratives at the close of the evaluation meeting. They flow into d18 (disqualification log) + d24 (decision brief).
        </StructuredPdfNote>
        <StructuredPdfKeyValueTable
          editableValues
          rows={[
            { label: 'Top-ranked vendor — primary rationale', value: '' },
            { label: 'Second-place vendor — gap vs. top', value: '' },
            { label: 'Tiebreaker rules applied (if any totals were within 2%)', value: '' },
            { label: 'Dissents — name + criterion + summary', value: '' },
            { label: 'Cross-check against d20 trap log — priced traps shifting ranking?', value: '' },
            { label: 'Cross-check against d18 disqualification log', value: '' },
            { label: 'Recommendation to sponsor (advance to BAFO)', value: '' },
          ]}
        />
      </>
    ),
  });
}
