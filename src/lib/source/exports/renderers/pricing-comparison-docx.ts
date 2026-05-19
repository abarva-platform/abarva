// Source · d19 Pricing Comparison · docx renderer
//
// Slice G7 — adds a docx surface alongside the existing comparison
// xlsx. The xlsx is the analyst's working surface (live formulas,
// side-by-side vendor columns). This docx is the readable rendering —
// the per-vendor annual totals, the assumption-deviation log, and the
// pricing-notes digest — suitable for a decision pack.
//
// Word does not execute formulas, so per-vendor annual totals are
// computed here (sum of unit price × annual quantity across the locked
// line items) and rendered as static values. The xlsx remains the
// canonical comparison surface.
//
// Sections:
//   1. Cover (eyebrow + event metadata; demo-mode note if applicable)
//   2. Submissions index (vendor + submitted-at + computed annual total)
//   3. Assumption deviations (per-vendor challenges to the locked set)
//   4. Pricing notes digest (per-vendor free-form notes)

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
import { buildMultiColumnTable } from '@/lib/exports-shared/structured-docx-base';
import type { PricingComparisonPayload } from './pricing-comparison';

/** Sum of unit price × annual quantity across the locked line items. */
function annualTotalFor(
  payload: PricingComparisonPayload,
  unitPricesById: Record<string, number>,
): number {
  return payload.lineItems.reduce((acc, item) => {
    const unit = unitPricesById[item.id];
    if (typeof unit !== 'number' || Number.isNaN(unit)) return acc;
    return acc + unit * item.annualQuantity;
  }, 0);
}

function fmtUsd(n: number): string {
  return n > 0 ? `$${Math.round(n).toLocaleString()}` : '—';
}

export function buildPricingComparisonDocx(
  payload: PricingComparisonPayload,
): Document {
  const submissionRows = payload.submissions.map((s) => ({
    vendorName: s.vendorName,
    submittedAt: s.submittedAt,
    annualTotal: fmtUsd(annualTotalFor(payload, s.unitPricesById)),
    deviationCount: String(s.assumptionDeviations.length),
  }));

  const deviationRows = payload.submissions.flatMap((s) =>
    s.assumptionDeviations.map((d) => ({
      vendorName: s.vendorName,
      assumptionKey: d.assumptionKey,
      proposedAlternative: d.proposedAlternative,
      severity: d.severity,
    })),
  );

  const noteRows = payload.submissions
    .filter((s) => s.pricingNotes.trim().length > 0)
    .map((s) => ({ vendorName: s.vendorName, pricingNotes: s.pricingNotes }));

  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Pricing Comparison · ${payload.eventCode}`,
    description: `d19 Pricing Comparison (reference rendering) for sourcing event ${payload.eventCode}.`,
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
                    text: 'Confidential — buyer-side pricing comparison; the d19 comparison xlsx is the canonical analysis surface',
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
          eyebrowParagraph(`d19 · Pricing Comparison · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          ...(payload.demoMode
            ? [
                coverSubtitleParagraph(
                  'DEMO MODE — submissions below are synthetic placeholders.',
                ),
              ]
            : []),
          bodyParagraph([
            bodyRun(
              'This document is a readable rendering of the d19 pricing ' +
                'comparison. The comparison xlsx is the analyst working ' +
                'surface (live side-by-side formulas). Per-vendor annual ' +
                'totals below are computed at generation time from each ' +
                'submission’s unit prices and the locked line-item ' +
                'quantities.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          // Section 1 — Submissions index
          heading2('Submissions index'),
          bodyParagraph([
            bodyRun(
              `${payload.submissions.length} vendor submission${payload.submissions.length === 1 ? '' : 's'} compared against ${payload.lineItems.length} locked line item${payload.lineItems.length === 1 ? '' : 's'}.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 28, style: 'locked', extract: (r) => r.vendorName },
              { header: 'Submitted', widthPercent: 26, style: 'locked', extract: (r) => r.submittedAt },
              { header: 'Annual steady-state total (USD)', widthPercent: 28, style: 'locked', extract: (r) => r.annualTotal },
              { header: 'Assumption deviations', widthPercent: 18, style: 'locked', extract: (r) => r.deviationCount },
            ],
            rows: submissionRows,
          }),
          // Section 2 — Assumption deviations
          heading2('Assumption deviations'),
          bodyParagraph([
            bodyRun(
              deviationRows.length > 0
                ? `${deviationRows.length} deviation${deviationRows.length === 1 ? '' : 's'} flagged across all vendor submissions. Each is a challenge to the locked d21 assumption set.`
                : 'No assumption deviations flagged — all vendors priced against the locked assumption set as-is.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 20, extract: (r) => r.vendorName },
              { header: 'Assumption challenged', widthPercent: 24, extract: (r) => r.assumptionKey },
              { header: 'Proposed alternative', widthPercent: 44, extract: (r) => r.proposedAlternative },
              { header: 'Severity', widthPercent: 12, extract: (r) => r.severity },
            ],
            rows: deviationRows,
            rowStyle: (r) => (r.severity === 'high' ? 'warning' : undefined),
          }),
          // Section 3 — Pricing notes digest
          heading2('Pricing notes digest'),
          bodyParagraph([
            bodyRun(
              noteRows.length > 0
                ? 'Free-form pricing notes submitted by each vendor.'
                : 'No vendor submitted free-form pricing notes.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Vendor', widthPercent: 22, style: 'locked', extract: (r) => r.vendorName },
              { header: 'Pricing notes', widthPercent: 78, extract: (r) => r.pricingNotes },
            ],
            rows: noteRows,
          }),
        ],
      },
    ],
  });
}
