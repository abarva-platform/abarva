// Source · d22 BAFO Question Pack · docx renderer
//
// Slice G7 — adds a docx surface alongside the existing xlsx. The xlsx
// carries the per-vendor response grid (data validation, average-score
// formulas). This docx is the readable rendering — the vendor list +
// the trap-driven and value-uplift question sets, suitable for
// distribution as a reviewable document at BAFO round kickoff.
//
// Sections mirror the xlsx sheet structure:
//   1. Cover (eyebrow + event metadata + round indicator)
//   2. Vendors (locked shortlist)
//   3. Trap-driven questions (required; sourced from open P0/P1 traps)
//   4. Value-uplift questions (opportunity-driven)

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
import type { BafoQuestionPackPayload } from './bafo-question-pack';

export function buildBafoQuestionPackDocx(
  payload: BafoQuestionPackPayload,
): Document {
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `BAFO Question Pack · ${payload.eventCode}`,
    description: `d22 BAFO Question Pack (reference rendering) for sourcing event ${payload.eventCode}.`,
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
                    text: 'Confidential BAFO question pack — distribute only to shortlisted BAFO vendors',
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
          eyebrowParagraph(`d22 · BAFO Question Pack · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy
            ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)]
            : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          ...(payload.roundLabel
            ? [coverSubtitleParagraph(`BAFO round: ${payload.roundLabel}`)]
            : []),
          bodyParagraph([
            bodyRun(
              'This document is a readable rendering of the d22 BAFO ' +
                'question pack. Vendors answer in the xlsx companion — its ' +
                'response grid carries the per-vendor answer + score ' +
                'columns. Use this docx for review and circulation at ' +
                'round kickoff.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          // Section 1 — Vendors
          heading2('Vendors invited to this BAFO round'),
          bodyParagraph([
            bodyRun(
              `${payload.vendors.length} vendor${payload.vendors.length === 1 ? '' : 's'}. Every vendor receives the same set of questions below.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: '#', widthPercent: 10, style: 'locked', extract: (r: { name: string; idx: number }) => String(r.idx + 1) },
              { header: 'Vendor', widthPercent: 90, style: 'locked', extract: (r: { name: string; idx: number }) => r.name },
            ],
            rows: payload.vendors.map((v, i) => ({ name: v, idx: i })),
          }),
          // Section 2 — Trap-driven questions
          heading2('Trap-driven questions'),
          bodyParagraph([
            bodyRun(
              `${payload.trapQuestions.length} question${payload.trapQuestions.length === 1 ? '' : 's'}, one per open P0/P1 trap from d20. These are required for response completeness.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Question ID', widthPercent: 11, extract: (r) => r.id },
              { header: 'Trap source', widthPercent: 14, extract: (r) => r.source },
              { header: 'Severity', widthPercent: 9, extract: (r) => r.severity },
              { header: 'Question', widthPercent: 46, extract: (r) => r.question },
              { header: 'Response format', widthPercent: 20, extract: (r) => r.responseFormat },
            ],
            rows: payload.trapQuestions,
            rowStyle: (r) => (r.severity === 'P0' ? 'warning' : undefined),
          }),
          // Section 3 — Value-uplift questions
          heading2('Value-uplift questions'),
          bodyParagraph([
            bodyRun(
              `${payload.valueQuestions.length} question${payload.valueQuestions.length === 1 ? '' : 's'}. Opportunity-driven — affirmative answers strengthen scoring but do not gate completeness.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Question ID', widthPercent: 11, extract: (r) => r.id },
              { header: 'Opportunity', widthPercent: 18, extract: (r) => r.source },
              { header: 'Question', widthPercent: 49, extract: (r) => r.question },
              { header: 'Response format', widthPercent: 22, extract: (r) => r.responseFormat },
            ],
            rows: payload.valueQuestions,
          }),
        ],
      },
    ],
  });
}
