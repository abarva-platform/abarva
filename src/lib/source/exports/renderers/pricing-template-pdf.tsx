// Source · d19 Pricing Workbook (template) · pdf renderer
//
// PDF companion to pricing-template-docx.ts and the xlsx. The xlsx is
// the canonical priced surface (live formulas); this PDF is the
// print-ready reference rendering of the locked assumption set + the
// scope-derived line items + the TCO schedule.
//
// Sections mirror the docx:
//   1. Cover
//   2. Assumption set
//   3. Pricing detail
//   4. TCO schedule
//   5. Pricing notes (seed topics)

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import { sourceArtifactGovernanceBanner } from '@/lib/source/artifact-governance';
import type { PricingTemplatePayload } from './pricing-template';

const PRICING_NOTE_SEED_TOPICS: ReadonlyArray<string> = [
  'Assumption challenge — which assumption-set row do you contest? (state row + your alternative)',
  'Alternative pricing model — describe any consumption / outcome / shared-risk model you propose',
  'Volume sensitivities — at what quantities does your unit price step? (cite line ID + threshold)',
  'Term sensitivities — pricing change at 5y vs 3y commit?',
  'Inclusions you assume but did not see in scope',
  'Exclusions / carve-outs not visible in our scope memo (will be reconciled at BAFO)',
];

export function buildPricingTemplatePdf(
  payload: PricingTemplatePayload,
): ReactElement<DocumentProps> {
  const escalatorPct = `${(payload.escalator * 100).toFixed(2)}%`;
  return buildStructuredPdfDocument({
    documentTitle: `Pricing Workbook · ${payload.eventCode}`,
    subject: `d19 Pricing Workbook (reference rendering) for sourcing event ${payload.eventCode}.`,
    eyebrow: `d19 · Pricing Workbook · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
      { label: 'TCO horizon', value: `${payload.tcoYears} years` },
    ],
    governanceNotice: sourceArtifactGovernanceBanner('ai_draft', {
      artifactCode: 'd19',
    }),
    introNote:
      'Readable rendering of the d19 pricing workbook. Vendors price in ' +
      'the xlsx companion — its formulas compute Extended Price and the ' +
      'multi-year TCO rollup. Use this PDF for board packs and review.',
    confidentialityNote:
      'Confidential — pricing reference; the d19 xlsx is the canonical priced submission surface',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Pricing Workbook`,
    body: (
      <>
        <StructuredPdfHeading>Assumption set</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.assumptions.length} locked assumption${payload.assumptions.length === 1 ? '' : 's'}. All vendor submissions are normalized against these rows.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Assumption', flex: 1.5, extract: (r) => r.key },
            { header: 'Value', flex: 1.2, extract: (r) => r.value },
            { header: 'Rationale', flex: 2.8, extract: (r) => r.rationale ?? '' },
          ]}
          rows={payload.assumptions}
          emptyLabel="No assumptions locked yet — derive the assumption set (d21) before pricing."
        />
        <StructuredPdfHeading>Pricing detail</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.lineItems.length} scope-derived line item${payload.lineItems.length === 1 ? '' : 's'}. Vendors fill Unit Price in the xlsx; Extended Price calculates there automatically.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Line ID', flex: 1.1, extract: (r) => r.id },
            { header: 'Category', flex: 1.2, extract: (r) => r.category },
            { header: 'Description', flex: 2.8, extract: (r) => r.description },
            { header: 'Unit', flex: 1, extract: (r) => r.unit },
            { header: 'Annual qty', flex: 0.9, extract: (r) => (r.annualQuantity > 0 ? r.annualQuantity.toLocaleString() : '') },
            { header: 'Unit price (USD)', flex: 1, extract: () => '' },
            { header: 'Vendor note', flex: 1.2, extract: (r) => r.note ?? '' },
          ]}
          rows={payload.lineItems}
          emptyLabel="No pricing line items derived yet — populate scope (d05) before pricing."
        />
        <StructuredPdfHeading>TCO schedule</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.tcoYears}-year horizon. Annual escalator: ${escalatorPct} (Year 1 holds at the steady-state base). The xlsx computes live cumulative TCO from the priced detail.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Term year', flex: 1, extract: (r: { year: string; escalator: string }) => r.year },
            { header: 'Escalator applied', flex: 1.4, extract: (r: { year: string; escalator: string }) => r.escalator },
            { header: 'Annual TCO (USD)', flex: 1.4, extract: () => '' },
          ]}
          rows={Array.from({ length: Math.max(payload.tcoYears, 0) }, (_, i) => ({
            year: `Year ${i + 1}`,
            escalator: i === 0 ? '0.00% (base)' : escalatorPct,
          }))}
          emptyLabel="No TCO horizon defined for this workbook."
        />
        <StructuredPdfHeading>Pricing notes (seed topics)</StructuredPdfHeading>
        <StructuredPdfNote>
          Flag any assumption you wish to challenge plus any alternative pricing model. Submissions that ignore these topics are normalized with no caveats applied.
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Topic', flex: 2, extract: (r) => r },
            { header: 'Vendor narrative', flex: 2.5, extract: () => '' },
          ]}
          rows={PRICING_NOTE_SEED_TOPICS}
        />
      </>
    ),
  });
}
