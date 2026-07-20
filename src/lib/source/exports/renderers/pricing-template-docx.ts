// Source · d19 Pricing Workbook (template) · docx renderer
//
// Slice G7 — adds a docx surface alongside the existing xlsx. The xlsx
// is where vendors actually price (formula-driven extended price + TCO
// rollup). This docx is the *reference rendering* — a CFO-readable
// rendering of the locked assumption set + scope-derived line items +
// the TCO schedule, suitable for a board pack where a spreadsheet
// won't be opened.
//
// Word does not execute formulas, so the line-item Unit Price and
// Extended Price cells render as empty fill-slots and the TCO schedule
// renders with the escalator schedule but no live total. The xlsx
// remains the canonical pricing surface.
//
// Sections mirror the xlsx sheet structure:
//   1. Cover (eyebrow + event metadata + vendor name slot)
//   2. Assumption set (locked rows from d21)
//   3. Pricing detail (scope-derived line items; vendor-fill price)
//   4. TCO schedule (term-year escalator schedule)
//   5. Pricing notes (vendor-fill narrative seed topics)

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
  governanceNoticeParagraph,
  heading2,
} from '@/lib/exports-shared/docx-base';
import {
  buildKeyValueTable,
  buildMultiColumnTable,
} from '@/lib/exports-shared/structured-docx-base';
import { sourceArtifactGovernanceBanner } from '@/lib/source/artifact-governance';
import type { PricingTemplatePayload } from './pricing-template';

const PRICING_NOTE_SEED_TOPICS: ReadonlyArray<string> = [
  'Assumption challenge — which row in the assumption set do you contest? (state row + your alternative)',
  'Alternative pricing model — describe any consumption / outcome / shared-risk model you propose',
  'Volume sensitivities — at what quantities does your unit price step? (cite line ID + threshold)',
  'Term sensitivities — pricing change at 5y vs 3y commit?',
  'Inclusions you assume but did not see in scope',
  'Exclusions / carve-outs not visible in our scope memo (will be reconciled at BAFO)',
];

export function buildPricingTemplateDocx(
  payload: PricingTemplatePayload,
): Document {
  const escalatorPct = `${(payload.escalator * 100).toFixed(2)}%`;
  const pricingTemplateGovernanceNotice = sourceArtifactGovernanceBanner(
    'ai_draft',
    { artifactCode: 'd19' },
  );
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Pricing Workbook · ${payload.eventCode}`,
    description: `d19 Pricing Workbook (reference rendering) for sourcing event ${payload.eventCode}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Confidential — pricing reference; the d19 xlsx is the canonical priced submission surface',
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
          eyebrowParagraph(`d19 · Pricing Workbook · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy
            ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)]
            : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          governanceNoticeParagraph(
            pricingTemplateGovernanceNotice.message,
            pricingTemplateGovernanceNotice.detail,
          ),
          bodyParagraph([
            bodyRun(
              'This document is a readable rendering of the d19 pricing ' +
                'workbook. Vendors price in the xlsx companion — its ' +
                'formulas compute Extended Price and the multi-year TCO ' +
                'rollup. Use this docx for board packs and offline review.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          // Vendor name slot.
          heading2('Vendor of record'),
          buildKeyValueTable({
            rows: [{ label: 'Vendor legal name', value: '' }],
            labelWidth: 30,
            editableValues: true,
          }),
          // Section 1 — Assumption set
          heading2('Assumption set'),
          bodyParagraph([
            bodyRun(
              `${payload.assumptions.length} locked assumption${payload.assumptions.length === 1 ? '' : 's'}. All vendor submissions are normalized against these rows; do not re-price them.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Assumption', widthPercent: 28, style: 'locked', extract: (r) => r.key },
              { header: 'Value', widthPercent: 22, style: 'locked', extract: (r) => r.value },
              { header: 'Rationale', widthPercent: 50, style: 'locked', extract: (r) => r.rationale ?? '' },
            ],
            rows: payload.assumptions,
          }),
          // Section 2 — Pricing detail
          heading2('Pricing detail'),
          bodyParagraph([
            bodyRun(
              `${payload.lineItems.length} scope-derived line item${payload.lineItems.length === 1 ? '' : 's'}. Fill the Unit Price column for every row in the xlsx; Extended Price calculates automatically there.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Line ID', widthPercent: 13, style: 'locked', extract: (r) => r.id },
              { header: 'Category', widthPercent: 15, style: 'locked', extract: (r) => r.category },
              { header: 'Description', widthPercent: 33, style: 'locked', extract: (r) => r.description },
              { header: 'Unit', widthPercent: 11, style: 'locked', extract: (r) => r.unit },
              { header: 'Annual qty', widthPercent: 9, style: 'locked', extract: (r) => (r.annualQuantity > 0 ? r.annualQuantity.toLocaleString() : '') },
              { header: 'Unit price (USD)', widthPercent: 10, style: 'editable', extract: () => '' },
              { header: 'Vendor note', widthPercent: 9, style: 'editable', extract: (r) => r.note ?? '' },
            ],
            rows: payload.lineItems,
          }),
          // Section 3 — TCO schedule
          heading2('TCO schedule'),
          bodyParagraph([
            bodyRun(
              `${payload.tcoYears}-year horizon. Annual escalator: ${escalatorPct} (Year 1 holds at the steady-state base). The xlsx computes the live cumulative TCO from the priced detail above.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Term year', widthPercent: 30, style: 'locked', extract: (r: { year: string; escalator: string }) => r.year },
              { header: 'Escalator applied', widthPercent: 35, style: 'locked', extract: (r: { year: string; escalator: string }) => r.escalator },
              { header: 'Annual TCO (USD)', widthPercent: 35, style: 'editable', extract: () => '' },
            ],
            rows: Array.from({ length: Math.max(payload.tcoYears, 0) }, (_, i) => ({
              year: `Year ${i + 1}`,
              escalator: i === 0 ? '0.00% (base)' : escalatorPct,
            })),
          }),
          // Section 4 — Pricing notes
          heading2('Pricing notes (seed topics)'),
          bodyParagraph([
            bodyRun(
              'Flag any assumption you wish to challenge plus any alternative pricing model. Submissions that ignore these topics are normalized against the locked assumption set with no caveats applied.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Topic', widthPercent: 45, style: 'locked', extract: (r) => r },
              { header: 'Vendor narrative', widthPercent: 55, style: 'editable', extract: () => '' },
            ],
            rows: PRICING_NOTE_SEED_TOPICS,
          }),
        ],
      },
    ],
  });
}
