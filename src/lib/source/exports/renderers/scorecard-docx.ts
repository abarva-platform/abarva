// Source · d16 Evaluation Scorecard · docx renderer
//
// Slice 5 — companion to the d16 xlsx (Slice 2b). The xlsx is where
// actual scoring happens (variable vendor columns, weighted-score
// formulas). The docx is the *reference doc* — criteria + weights +
// rubric + decision-notes seed topics — useful for distributing the
// scoring framework before the evaluation panel meets, or for filing
// the rubric record alongside the scored xlsx.
//
// Sections:
//   1. Cover
//   2. Criteria & weights (locked; sums to 100)
//   3. Vendors under evaluation (locked, from d12 shortlist)
//   4. Score guidance (locked 1-5 rubric)
//   5. Decision notes seed topics

import 'server-only';

import { Document, Footer, Paragraph, TextRun } from 'docx';

import {
  ORDERED_NUMBERING_CONFIG,
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
  heading2,
} from '@/lib/exports-shared/docx-base';
import {
  buildKeyValueTable,
  buildMultiColumnTable,
} from '@/lib/exports-shared/structured-docx-base';
import type { ScorecardPayload } from './scorecard';

export function buildScorecardDocx(payload: ScorecardPayload): Document {
  const totalWeight = payload.criteria.reduce(
    (acc, c) => acc + c.weightPercent,
    0,
  );
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Evaluation Scorecard · ${payload.eventCode}`,
    description: `d16 Evaluation Scorecard reference doc for sourcing event ${payload.eventCode}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Confidential — evaluation panel only',
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 16,
                    color: SOURCE_DOCX.MUTED_COLOR,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Cover
          eyebrowParagraph(`d16 · Evaluation Scorecard · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy
            ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)]
            : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          ...(payload.roundLabel
            ? [coverSubtitleParagraph(`Evaluation round: ${payload.roundLabel}`)]
            : []),
          bodyParagraph([
            bodyRun(
              'This document is the reference rubric for the evaluation panel. ' +
                'Actual per-vendor scoring happens in the d16 xlsx companion ' +
                '(weighted formulas, variable vendor columns, totals). Use this ' +
                'docx for pre-meeting distribution and post-meeting filing.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          // Section 1 — Criteria & weights
          heading2('Criteria & weights'),
          bodyParagraph([
            bodyRun(
              `${payload.criteria.length} criteria. Weights must sum to 100. Current total: ${totalWeight}%${totalWeight === 100 ? ' ✓' : ' — re-derive via d17 weight log'}.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Criterion ID', widthPercent: 14, style: 'locked', extract: (r) => r.id },
              { header: 'Criterion', widthPercent: 22, style: 'locked', extract: (r) => r.label },
              { header: 'Weight (%)', widthPercent: 12, style: 'locked', extract: (r) => String(r.weightPercent) },
              { header: 'Description', widthPercent: 52, style: 'locked', extract: (r) => r.description },
            ],
            rows: payload.criteria,
          }),
          // Section 2 — Vendors
          heading2('Vendors under evaluation'),
          bodyParagraph([
            bodyRun(
              `${payload.vendors.length} vendor${payload.vendors.length === 1 ? '' : 's'} from d12 shortlist. Each vendor will be scored against every criterion above on a 1-5 scale.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: '#', widthPercent: 8, style: 'locked', extract: (r: { idx: number }) => String(r.idx + 1) },
              { header: 'Vendor', widthPercent: 92, style: 'locked', extract: (r: { name: string }) => r.name },
            ],
            rows: payload.vendors.map((v, i) => ({ name: v, idx: i })),
          }),
          // Section 3 — Score guidance
          heading2('Score guidance'),
          bodyParagraph([
            bodyRun(
              'Locked rubric. Apply the same definition consistently across every vendor.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Score', widthPercent: 10, style: 'locked', extract: (r) => String(r.score) },
              { header: 'Label', widthPercent: 20, style: 'locked', extract: (r) => r.label },
              { header: 'Rubric', widthPercent: 70, style: 'locked', extract: (r) => r.rubric },
            ],
            rows: payload.scoreGuidance,
          }),
          // Section 4 — Decision notes seed topics
          heading2('Decision notes (seed topics)'),
          bodyParagraph([
            bodyRun(
              'Populate these narratives at the close of the evaluation meeting. They flow into d18 (disqualification log) + d24 (decision brief).',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildKeyValueTable({
            rows: [
              { label: 'Top-ranked vendor — primary rationale', value: '' },
              { label: 'Second-place vendor — gap vs. top', value: '' },
              { label: 'Tiebreaker rules applied (if any totals were within 2%)', value: '' },
              { label: 'Dissents — name + criterion + summary', value: '' },
              { label: 'Cross-check against d20 trap log — priced traps shifting ranking?', value: '' },
              { label: 'Cross-check against d18 disqualification log', value: '' },
              { label: 'Recommendation to sponsor (advance to BAFO)', value: '' },
            ],
            labelWidth: 50,
            editableValues: true,
          }),
        ],
      },
    ],
  });
}
