// Source · d05 Scope Memo · docx renderer
//
// First docx artifact in Slice 3. The Scope Memo is the buyer's
// authored statement of in-scope / out-of-scope / target support tier
// /  transition assumptions. It feeds d04 (App Inventory), d06
// (Exclusion Log), d11 (Response Checklist), and d19 (Pricing
// Workbook), so getting it as a clean docx unlocks an offline-edit
// + share path that the inline canvas editor doesn't.
//
// Structure:
//   1. Cover block — artifact title, event metadata block, "Issued by"
//      line, generated-at timestamp
//   2. Body — markdown body rendered via markdownToDocxBlocks. Reuses
//      the exact mdast-to-docx walker that every long-form Source docx
//      artifact will share.
//   3. Footer paragraph — small "Source canvas · MERI-CLOUD-2026" line.
//
// The renderer is pure (payload → Document). The route serializes via
// docx.Packer.toBuffer.

import 'server-only';

import { Document, Footer, Header, Paragraph, TextRun } from 'docx';

import {
  ORDERED_NUMBERING_CONFIG,
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  boldRun,
  coverSubtitleParagraph,
  coverTitleParagraph,
  eyebrowParagraph,
} from './docx-base';
import { markdownToDocxBlocks } from './markdown-to-docx';

export interface ScopeMemoDocxPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  /** Free-form owner / sponsor block from event intake. */
  issuedBy?: string;
  /** ISO 8601 generated-at timestamp. */
  generatedAt: string;
  /** Markdown body — typically the d05 authored body from substrate. */
  body: string;
  /** Whether the body came from the canonical scaffold vs an authored body. */
  bodyIsAuthored: boolean;
}

/** Build the Document. */
export function buildScopeMemoDocx(payload: ScopeMemoDocxPayload): Document {
  const cover = buildCoverBlock(payload);
  const bodyBlocks = markdownToDocxBlocks(payload.body || '');
  const footerNote = bodyParagraph([
    bodyRun(
      `Source canvas · ${payload.eventCode} · scaffolded by AbarVa Sentinel · generated ${payload.generatedAt}`,
      { color: SOURCE_DOCX.MUTED_COLOR, size: 18 },
    ),
  ]);

  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Scope Memo · ${payload.eventCode}`,
    description: `d05 Scope Memo for sourcing event ${payload.eventCode}.`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: payload.tenantName,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 18,
                    color: SOURCE_DOCX.MUTED_COLOR,
                  }),
                  new TextRun({
                    text: `   ·   ${payload.eventCode}   ·   d05 Scope Memo`,
                    font: SOURCE_DOCX.BODY_FONT,
                    size: 18,
                    color: SOURCE_DOCX.MUTED_COLOR,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Confidential — distribute only to procurement panel',
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
        children: [...cover, ...bodyBlocks, footerNote],
      },
    ],
  });
}

function buildCoverBlock(payload: ScopeMemoDocxPayload): Paragraph[] {
  const blocks: Paragraph[] = [];
  blocks.push(eyebrowParagraph(`d05 · Scope Memo · ${payload.tenantName}`));
  blocks.push(coverTitleParagraph(payload.eventName));
  blocks.push(coverSubtitleParagraph(`Event code: ${payload.eventCode}`));
  if (payload.issuedBy) {
    blocks.push(coverSubtitleParagraph(`Issued by: ${payload.issuedBy}`));
  }
  blocks.push(coverSubtitleParagraph(`Generated: ${payload.generatedAt}`));
  if (!payload.bodyIsAuthored) {
    blocks.push(
      bodyParagraph([
        boldRun('TEMPLATE SCAFFOLD — body has not been authored yet. ', {
          color: SOURCE_DOCX.WARNING_COLOR,
        }),
        bodyRun(
          'The content below is the canonical d05 scaffold; replace with the actual scope memo before circulating.',
          { color: SOURCE_DOCX.MUTED_COLOR },
        ),
      ]),
    );
  }
  return blocks;
}
