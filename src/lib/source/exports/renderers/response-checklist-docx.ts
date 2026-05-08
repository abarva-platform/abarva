// Source · d11 Response Checklist · docx renderer
//
// Slice 5 — vendor-facing checklist as a docx file. Reuses the
// ResponseChecklistPayload from the xlsx pipeline. Sections mirror the
// xlsx sheets:
//
//   1. Cover (eyebrow + event metadata + vendor name slot + deadline)
//   2. Mandatory items (locked Item / Section / Requirement; vendor
//      fills Confirmed (Y/N) + Evidence pointer + Note via redline)
//   3. Optional / Recommended items (same shape)
//   4. Format expectations (locked rubric)
//   5. Submission sign-off (vendor sign-off block + certifications)

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
import type { ResponseChecklistPayload } from './response-checklist';

export function buildResponseChecklistDocx(
  payload: ResponseChecklistPayload,
): Document {
  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Response Checklist · ${payload.eventCode}`,
    description: `d11 Response Checklist for sourcing event ${payload.eventCode}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Confidential vendor RFP response checklist — distribute only to invited bidders',
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
          // Cover
          eyebrowParagraph(`d11 · Response Checklist · ${payload.tenantName}`),
          coverTitleParagraph(payload.eventName),
          coverSubtitleParagraph(`Event code: ${payload.eventCode}`),
          ...(payload.issuedBy
            ? [coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`)]
            : []),
          coverSubtitleParagraph(`Generated: ${payload.generatedAt}`),
          ...(payload.submissionDeadline
            ? [coverSubtitleParagraph(`Submission deadline: ${payload.submissionDeadline}`)]
            : []),
          // Vendor sign-in slot
          heading2('Vendor of record'),
          bodyParagraph([
            bodyRun(
              'Fill the Vendor name field below before completing the checklist. ' +
                'For each item, mark Confirmed (Y/N) and provide an Evidence pointer ' +
                '(filename + page) in your response document.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildKeyValueTable({
            rows: [{ label: 'Vendor legal name', value: '' }],
            labelWidth: 30,
            editableValues: true,
          }),
          // Section 1 — Mandatory items
          heading2('Mandatory items'),
          bodyParagraph([
            bodyRun(
              `${payload.mandatoryItems.length} item${payload.mandatoryItems.length === 1 ? '' : 's'}. Every row is required for response completeness (d15).`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Item ID', widthPercent: 12, style: 'locked', extract: (r) => r.id },
              { header: 'Section', widthPercent: 14, style: 'locked', extract: (r) => r.section },
              { header: 'Requirement', widthPercent: 50, style: 'locked', extract: (r) => r.requirement },
              { header: 'Confirmed (Y/N)', widthPercent: 12, style: 'editable', extract: () => '' },
              { header: 'Evidence pointer', widthPercent: 12, style: 'editable', extract: () => '' },
            ],
            rows: payload.mandatoryItems,
          }),
          // Section 2 — Optional items
          heading2('Optional / recommended items'),
          bodyParagraph([
            bodyRun(
              `${payload.optionalItems.length} item${payload.optionalItems.length === 1 ? '' : 's'}. Affirmative answers strengthen scoring (d16) but do not gate response completeness.`,
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Item ID', widthPercent: 12, style: 'locked', extract: (r) => r.id },
              { header: 'Section', widthPercent: 14, style: 'locked', extract: (r) => r.section },
              { header: 'Requirement', widthPercent: 50, style: 'locked', extract: (r) => r.requirement },
              { header: 'Confirmed (Y/N/N/A)', widthPercent: 12, style: 'editable', extract: () => '' },
              { header: 'Evidence pointer', widthPercent: 12, style: 'editable', extract: () => '' },
            ],
            rows: payload.optionalItems,
          }),
          // Section 3 — Format expectations
          heading2('Format expectations'),
          bodyParagraph([
            bodyRun(
              'Locked rubric. Submissions outside these conventions may be rejected.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildMultiColumnTable({
            columns: [
              { header: 'Topic', widthPercent: 26, style: 'locked', extract: (r) => r.topic },
              { header: 'Requirement', widthPercent: 74, style: 'locked', extract: (r) => r.requirement },
            ],
            rows: payload.formatExpectations,
          }),
          // Section 4 — Sign-off
          heading2('Submission sign-off'),
          bodyParagraph([
            bodyRun(
              'An authorized officer must complete this block before submission. Each certification statement must be Confirmed or Declined.',
              { color: SOURCE_DOCX.MUTED_COLOR },
            ),
          ]),
          buildKeyValueTable({
            rows: [
              { label: 'Vendor legal name', value: '' },
              { label: 'Authorized signing officer (name + title)', value: '' },
              { label: 'Officer email', value: '' },
              { label: 'Officer phone', value: '' },
              { label: 'Submission date', value: '' },
            ],
            labelWidth: 35,
            editableValues: true,
          }),
          heading2('Certification statements'),
          buildMultiColumnTable({
            columns: [
              { header: 'Statement', widthPercent: 80, style: 'locked', extract: (r) => r },
              { header: 'Confirmed / Declined', widthPercent: 20, style: 'editable', extract: () => '' },
            ],
            rows: payload.certifications,
          }),
        ],
      },
    ],
  });
}
