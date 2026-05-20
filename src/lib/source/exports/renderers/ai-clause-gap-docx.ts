// Source · AI Clause Gap · docx renderer

import 'server-only';

import { Document, Footer, Paragraph, TextRun } from 'docx';

import {
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
import type { AiClauseGapPayload } from './ai-clause-gap';

export function buildAiClauseGapDocx(payload: AiClauseGapPayload): Document {
  const counts = computeCounts(payload);
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `AI Clause Gap · ${payload.eventCode}`,
    description: `AI clause gap checklist for sourcing event ${payload.eventCode}.`,
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
                    text: 'Confidential — AI-clause checklist; review with procurement counsel before signature (methodology §6)',
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
          eyebrowParagraph(`Stage 6 · AI Clause Gap · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          coverSubtitleParagraph(`Vendor under review: ${payload.vendorName || '(buyer fills before circulating)'}`),
          ...(payload.issuedBy ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)] : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          bodyParagraph([
            bodyRun(
              'Methodology §6: most procurement orgs do not yet know to ask for the clauses below. Each is scored against the vendor draft; Critical-risk clauses left Missing or Partial must be redlined before signature.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),

          heading2('Gap summary'),
          buildKeyValueTable({
            rows: [
              { label: 'Total clauses in library', value: String(payload.clauses.length) },
              { label: 'Present', value: String(counts.present) },
              { label: 'Partial', value: String(counts.partial) },
              { label: 'Missing', value: String(counts.missing) },
              { label: 'N/A', value: String(counts.na) },
              { label: 'Critical-risk × Missing (must redline)', value: String(counts.criticalMissing) },
              { label: 'Critical-risk × Partial (must redline)', value: String(counts.criticalPartial) },
              { label: 'High-risk × Missing', value: String(counts.highMissing) },
            ],
            labelWidth: 60,
          }),

          heading2('Clause library'),
          buildMultiColumnTable({
            columns: [
              { header: 'Clause', widthPercent: 18, extract: (r) => r.clause },
              { header: 'Why it matters', widthPercent: 28, extract: (r) => r.whyItMatters },
              { header: 'Required language', widthPercent: 30, extract: (r) => r.requiredLanguage },
              { header: 'Risk', widthPercent: 10, extract: (r) => r.riskIfMissing },
              { header: 'Status', widthPercent: 14, extract: (r) => r.status },
            ],
            rows: payload.clauses,
            rowStyle: (r) =>
              r.riskIfMissing === 'critical' && (r.status === 'missing' || r.status === 'partial')
                ? 'warning'
                : undefined,
          }),
        ],
      },
    ],
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
