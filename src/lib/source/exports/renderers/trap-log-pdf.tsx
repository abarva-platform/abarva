// Source · d20 Pricing Trap Log · pdf renderer
//
// PDF companion to trap-log-docx.ts and the xlsx. The xlsx is the
// working grid; this PDF is the print-ready readable rendering of the
// severity rubric + the logged traps + the computed resolution
// summary.
//
// Sections mirror the docx:
//   1. Cover
//   2. Severity definitions
//   3. Trap log
//   4. Resolution summary

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
import type { TrapLogPayload } from './trap-log';

export function buildTrapLogPdf(
  payload: TrapLogPayload,
): ReactElement<DocumentProps> {
  const p0Count = payload.rows.filter((r) => r.severity === 'P0').length;
  const p1Count = payload.rows.filter((r) => r.severity === 'P1').length;
  const p2Count = payload.rows.filter((r) => r.severity === 'P2').length;

  return buildStructuredPdfDocument({
    documentTitle: `Pricing Trap Log · ${payload.eventCode}`,
    subject: `d20 Pricing Trap Log (reference rendering) for sourcing event ${payload.eventCode}.`,
    eyebrow: `d20 · Pricing Trap Log · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
    ],
    introNote:
      'Readable rendering of the d20 trap log. Buyers triage and resolve ' +
      'traps in the xlsx companion; this PDF is for decision packs. Open ' +
      'P0 and P1 traps flow into the d22 BAFO question pack.',
    confidentialityNote:
      'Confidential — buyer-side pricing trap log; the d20 xlsx is the canonical working grid',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Pricing Trap Log`,
    body: (
      <>
        <StructuredPdfHeading>Severity definitions</StructuredPdfHeading>
        <StructuredPdfNote>
          Locked rubric. Every trap must be tagged with one of P0 / P1 / P2.
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Severity', flex: 0.7, extract: (r) => r.severity },
            { header: 'Label', flex: 1.3, extract: (r) => r.label },
            { header: 'Rubric', flex: 4.5, extract: (r) => r.rubric },
          ]}
          rows={payload.severityDefinitions}
          emptyLabel="No severity definitions supplied for this trap log."
        />
        <StructuredPdfHeading>Trap log</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.rows.length} trap${payload.rows.length === 1 ? '' : 's'} logged. P0 (deal-shaping) rows are highlighted. Resolution columns are buyer-fillable.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Trap ID', flex: 1, extract: (r) => r.id },
            { header: 'Sev', flex: 0.5, extract: (r) => r.severity },
            { header: 'Category', flex: 1.2, extract: (r) => r.category },
            { header: 'Description', flex: 3.6, extract: (r) => r.description },
            { header: 'For', flex: 0.8, extract: (r) => r.surfacedFor },
            { header: 'By', flex: 0.9, extract: (r) => r.surfacedBy },
            { header: 'Resolution', flex: 1, extract: () => '' },
          ]}
          rows={payload.rows}
          rowStyle={(r) => (r.severity === 'P0' ? 'warning' : undefined)}
          emptyLabel="No traps logged yet — author the trap log before circulating."
        />
        <StructuredPdfHeading>Resolution summary</StructuredPdfHeading>
        <StructuredPdfNote>
          Computed at generation time. Re-run this export after the trap log changes to refresh the counts.
        </StructuredPdfNote>
        <StructuredPdfKeyValueTable
          rows={[
            { label: 'Total traps logged', value: String(payload.rows.length) },
            { label: 'P0 (deal-shaping)', value: String(p0Count) },
            { label: 'P1 (material)', value: String(p1Count) },
            { label: 'P2 (noted)', value: String(p2Count) },
            { label: 'Open P0 + P1 (flow into d22 BAFO question pack)', value: String(p0Count + p1Count) },
          ]}
        />
      </>
    ),
  });
}
