// Source · AI Clause Gap · pdf renderer

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
import type { AiClauseGapPayload } from './ai-clause-gap';

export function buildAiClauseGapPdf(
  payload: AiClauseGapPayload,
): ReactElement<DocumentProps> {
  const counts = computeCounts(payload);
  return buildStructuredPdfDocument({
    documentTitle: `AI Clause Gap · ${payload.eventCode}`,
    subject: `AI clause gap checklist for sourcing event ${payload.eventCode}.`,
    eyebrow: `Stage 6 · AI Clause Gap · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      { label: 'Vendor under review', value: payload.vendorName || '(buyer fills before circulating)' },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
    ],
    introNote:
      'Methodology §6: most procurement orgs do not yet know to ask for ' +
      'the clauses below. Critical-risk clauses left Missing or Partial ' +
      'must be redlined before signature.',
    confidentialityNote: 'Review with procurement counsel before signature (methodology §6)',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   AI Clause Gap`,
    body: (
      <>
        <StructuredPdfHeading>Gap summary</StructuredPdfHeading>
        <StructuredPdfKeyValueTable
          rows={[
            { label: 'Total clauses in library', value: String(payload.clauses.length) },
            { label: 'Present', value: String(counts.present) },
            { label: 'Partial', value: String(counts.partial) },
            { label: 'Missing', value: String(counts.missing) },
            { label: 'N/A', value: String(counts.na) },
            { label: 'Critical-risk × Missing (must redline)', value: String(counts.criticalMissing) },
            { label: 'Critical-risk × Partial (must redline)', value: String(counts.criticalPartial) },
            { label: 'High-risk × Missing', value: String(counts.highMissing) },
          ]}
        />
        <StructuredPdfHeading>Clause library</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.clauses.length} clause${payload.clauses.length === 1 ? '' : 's'} in the methodology §6 library.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Clause', flex: 1.8, extract: (r) => r.clause },
            { header: 'Why it matters', flex: 2.8, extract: (r) => r.whyItMatters },
            { header: 'Required language', flex: 3, extract: (r) => r.requiredLanguage },
            { header: 'Risk', flex: 0.8, extract: (r) => r.riskIfMissing },
            { header: 'Status', flex: 1.2, extract: (r) => r.status },
          ]}
          rows={payload.clauses}
          rowStyle={(r) =>
            r.riskIfMissing === 'critical' && (r.status === 'missing' || r.status === 'partial')
              ? 'warning'
              : undefined
          }
          emptyLabel="No clauses in library — substrate gap."
        />
      </>
    ),
  });
}

function computeCounts(payload: AiClauseGapPayload) {
  let present = 0,
    partial = 0,
    missing = 0,
    na = 0;
  let criticalMissing = 0,
    criticalPartial = 0,
    highMissing = 0;
  for (const c of payload.clauses) {
    if (c.status === 'present') present += 1;
    else if (c.status === 'partial') partial += 1;
    else if (c.status === 'missing') missing += 1;
    else if (c.status === 'n/a') na += 1;
    if (c.riskIfMissing === 'critical' && c.status === 'missing') criticalMissing += 1;
    if (c.riskIfMissing === 'critical' && c.status === 'partial') criticalPartial += 1;
    if (c.riskIfMissing === 'high' && c.status === 'missing') highMissing += 1;
  }
  return { present, partial, missing, na, criticalMissing, criticalPartial, highMissing };
}
