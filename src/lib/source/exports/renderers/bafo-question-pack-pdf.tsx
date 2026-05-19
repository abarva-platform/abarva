// Source · d22 BAFO Question Pack · pdf renderer
//
// PDF companion to bafo-question-pack-docx.ts and the xlsx. The xlsx
// carries the per-vendor response grid; this PDF is the print-ready
// readable rendering of the vendor list + the trap-driven and
// value-uplift question sets.
//
// Sections mirror the docx:
//   1. Cover
//   2. Vendors
//   3. Trap-driven questions
//   4. Value-uplift questions

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import type { BafoQuestionPackPayload } from './bafo-question-pack';

export function buildBafoQuestionPackPdf(
  payload: BafoQuestionPackPayload,
): ReactElement<DocumentProps> {
  return buildStructuredPdfDocument({
    documentTitle: `BAFO Question Pack · ${payload.eventCode}`,
    subject: `d22 BAFO Question Pack (reference rendering) for sourcing event ${payload.eventCode}.`,
    eyebrow: `d22 · BAFO Question Pack · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
      ...(payload.roundLabel ? [{ label: 'BAFO round', value: payload.roundLabel }] : []),
    ],
    introNote:
      'Readable rendering of the d22 BAFO question pack. Vendors answer ' +
      'in the xlsx companion — its response grid carries the per-vendor ' +
      'answer + score columns. Use this PDF for review and circulation.',
    confidentialityNote:
      'Confidential BAFO question pack — distribute only to shortlisted BAFO vendors',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   BAFO Question Pack`,
    body: (
      <>
        <StructuredPdfHeading>Vendors invited to this BAFO round</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.vendors.length} vendor${payload.vendors.length === 1 ? '' : 's'}. Every vendor receives the same set of questions below.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: '#', flex: 0.4, extract: (r: { name: string; idx: number }) => String(r.idx + 1) },
            { header: 'Vendor', flex: 4.6, extract: (r: { name: string; idx: number }) => r.name },
          ]}
          rows={payload.vendors.map((v, i) => ({ name: v, idx: i }))}
          emptyLabel="No vendors invited to this BAFO round yet."
        />
        <StructuredPdfHeading>Trap-driven questions</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.trapQuestions.length} question${payload.trapQuestions.length === 1 ? '' : 's'}, one per open P0/P1 trap from d20. These are required for response completeness.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Question ID', flex: 1, extract: (r) => r.id },
            { header: 'Trap source', flex: 1.1, extract: (r) => r.source },
            { header: 'Sev', flex: 0.5, extract: (r) => r.severity },
            { header: 'Question', flex: 3.6, extract: (r) => r.question },
            { header: 'Response format', flex: 1.6, extract: (r) => r.responseFormat },
          ]}
          rows={payload.trapQuestions}
          rowStyle={(r) => (r.severity === 'P0' ? 'warning' : undefined)}
          emptyLabel="No trap-driven questions — no open P0/P1 traps in d20."
        />
        <StructuredPdfHeading>Value-uplift questions</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.valueQuestions.length} question${payload.valueQuestions.length === 1 ? '' : 's'}. Opportunity-driven — affirmative answers strengthen scoring but do not gate completeness.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Question ID', flex: 1, extract: (r) => r.id },
            { header: 'Opportunity', flex: 1.4, extract: (r) => r.source },
            { header: 'Question', flex: 3.8, extract: (r) => r.question },
            { header: 'Response format', flex: 1.8, extract: (r) => r.responseFormat },
          ]}
          rows={payload.valueQuestions}
          emptyLabel="No value-uplift questions defined for this BAFO round."
        />
      </>
    ),
  });
}
