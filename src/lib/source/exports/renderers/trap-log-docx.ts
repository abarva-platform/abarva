// Source · d20 Pricing Trap Log · docx renderer
//
// Slice G7 — adds a docx surface alongside the existing xlsx. The xlsx
// is the working grid (data validation, formula-driven resolution
// counts). This docx is the readable rendering — the severity rubric +
// the logged traps + the computed resolution summary, suitable for a
// decision pack where a spreadsheet won't be opened.
//
// Sections mirror the xlsx sheet structure:
//   1. Cover (eyebrow + event metadata)
//   2. Severity definitions (locked P0/P1/P2 rubric)
//   3. Trap log (one row per trap; P0 highlighted)
//   4. Resolution summary (computed counts by severity)

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
import type { TrapLogPayload } from './trap-log';

export function buildTrapLogDocx(payload: TrapLogPayload): Document {
  const p0Count = payload.rows.filter((r) => r.severity === 'P0').length;
  const p1Count = payload.rows.filter((r) => r.severity === 'P1').length;
  const p2Count = payload.rows.filter((r) => r.severity === 'P2').length;

  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Pricing Trap Log · ${payload.eventCode}`,
    description: `d20 Pricing Trap Log (reference rendering) for sourcing event ${payload.eventCode}.`,
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
                    text: 'Confidential — buyer-side pricing trap log; the d20 xlsx is the canonical working grid',
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
          eyebrowParagraph(`d20 · Pricing Trap Log · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy
            ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)]
            : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          bodyParagraph([
            bodyRun(
              'This document is a readable rendering of the d20 trap log. ' +
                'Buyers triage and resolve traps in the xlsx companion ' +
                '(data validation + formula-driven resolution counts). ' +
                'Use this docx for decision packs and offline review. ' +
                'Open P0 and P1 traps flow into the d22 BAFO question pack.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          // Section 1 — Severity definitions
          heading2('Severity definitions'),
          bodyParagraph([
            bodyRun(
              'Locked rubric. Every trap must be tagged with one of P0 / P1 / P2.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Severity', widthPercent: 12, style: 'locked', extract: (r) => r.severity },
              { header: 'Label', widthPercent: 20, style: 'locked', extract: (r) => r.label },
              { header: 'Rubric', widthPercent: 68, style: 'locked', extract: (r) => r.rubric },
            ],
            rows: payload.severityDefinitions,
          }),
          // Section 2 — Trap log
          heading2('Trap log'),
          bodyParagraph([
            bodyRun(
              `${payload.rows.length} trap${payload.rows.length === 1 ? '' : 's'} logged. P0 (deal-shaping) rows are highlighted. Resolution columns are buyer-fillable.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Trap ID', widthPercent: 11, extract: (r) => r.id },
              { header: 'Severity', widthPercent: 9, extract: (r) => r.severity },
              { header: 'Category', widthPercent: 14, extract: (r) => r.category },
              { header: 'Description', widthPercent: 36, extract: (r) => r.description },
              { header: 'Surfaced for', widthPercent: 10, extract: (r) => r.surfacedFor },
              { header: 'Surfaced by', widthPercent: 10, extract: (r) => r.surfacedBy },
              { header: 'Resolution', widthPercent: 10, extract: () => '' },
            ],
            rows: payload.rows,
            rowStyle: (r) => (r.severity === 'P0' ? 'warning' : undefined),
          }),
          // Section 3 — Resolution summary
          heading2('Resolution summary'),
          bodyParagraph([
            bodyRun(
              'Computed at generation time. Re-run this export after the trap log changes to refresh the counts.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildKeyValueTable({
            rows: [
              { label: 'Total traps logged', value: String(payload.rows.length) },
              { label: 'P0 (deal-shaping)', value: String(p0Count) },
              { label: 'P1 (material)', value: String(p1Count) },
              { label: 'P2 (noted)', value: String(p2Count) },
              { label: 'Open P0 + P1 (flow into d22 BAFO question pack)', value: String(p0Count + p1Count) },
            ],
            labelWidth: 55,
          }),
        ],
      },
    ],
  });
}
