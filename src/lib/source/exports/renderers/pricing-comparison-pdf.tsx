// Source · d19 Pricing Comparison · pdf renderer
//
// PDF companion to pricing-comparison-docx.ts and the comparison xlsx.
// The xlsx is the analyst working surface; this PDF is the print-ready
// readable rendering of the per-vendor annual totals, the
// assumption-deviation log, and the pricing-notes digest.
//
// Per-vendor annual totals are computed at generation time (sum of
// unit price × annual quantity across the locked line items).
//
// Sections mirror the docx:
//   1. Cover
//   2. Submissions index
//   3. Assumption deviations
//   4. Pricing notes digest

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import type { PricingComparisonPayload } from './pricing-comparison';

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

export function buildPricingComparisonPdf(
  payload: PricingComparisonPayload,
): ReactElement<DocumentProps> {
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

  return buildStructuredPdfDocument({
    documentTitle: `Pricing Comparison · ${payload.eventCode}`,
    subject: `d19 Pricing Comparison (reference rendering) for sourcing event ${payload.eventCode}.`,
    eyebrow: `d19 · Pricing Comparison · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      { label: 'Generated', value: payload.generatedAt },
      ...(payload.demoMode
        ? [{ label: 'Mode', value: 'DEMO — synthetic submissions' }]
        : []),
    ],
    introNote:
      'Readable rendering of the d19 pricing comparison. The comparison ' +
      'xlsx is the analyst working surface; per-vendor annual totals ' +
      'below are computed at generation time from each submission’s ' +
      'unit prices and the locked line-item quantities.',
    confidentialityNote:
      'Confidential — buyer-side pricing comparison; the d19 comparison xlsx is the canonical analysis surface',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Pricing Comparison`,
    body: (
      <>
        <StructuredPdfHeading>Submissions index</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.submissions.length} vendor submission${payload.submissions.length === 1 ? '' : 's'} compared against ${payload.lineItems.length} locked line item${payload.lineItems.length === 1 ? '' : 's'}.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.6, extract: (r) => r.vendorName },
            { header: 'Submitted', flex: 1.5, extract: (r) => r.submittedAt },
            { header: 'Annual steady-state total (USD)', flex: 1.7, extract: (r) => r.annualTotal },
            { header: 'Assumption deviations', flex: 1, extract: (r) => r.deviationCount },
          ]}
          rows={submissionRows}
          emptyLabel="No vendor submissions to compare yet."
        />
        <StructuredPdfHeading>Assumption deviations</StructuredPdfHeading>
        <StructuredPdfNote>
          {deviationRows.length > 0
            ? `${deviationRows.length} deviation${deviationRows.length === 1 ? '' : 's'} flagged across all vendor submissions. Each is a challenge to the locked d21 assumption set.`
            : 'No assumption deviations flagged — all vendors priced against the locked assumption set as-is.'}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.2, extract: (r) => r.vendorName },
            { header: 'Assumption challenged', flex: 1.6, extract: (r) => r.assumptionKey },
            { header: 'Proposed alternative', flex: 3, extract: (r) => r.proposedAlternative },
            { header: 'Severity', flex: 0.8, extract: (r) => r.severity },
          ]}
          rows={deviationRows}
          rowStyle={(r) => (r.severity === 'high' ? 'warning' : undefined)}
          emptyLabel="No assumption deviations flagged by any vendor."
        />
        <StructuredPdfHeading>Pricing notes digest</StructuredPdfHeading>
        <StructuredPdfNote>
          {noteRows.length > 0
            ? 'Free-form pricing notes submitted by each vendor.'
            : 'No vendor submitted free-form pricing notes.'}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Vendor', flex: 1.3, extract: (r) => r.vendorName },
            { header: 'Pricing notes', flex: 4, extract: (r) => r.pricingNotes },
          ]}
          rows={noteRows}
          emptyLabel="No vendor pricing notes submitted."
        />
      </>
    ),
  });
}
