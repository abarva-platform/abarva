// Intelligence · CXO brief · DOCX renderer
//
// Narrative brief renderer. Mirrors the Source narrative-docx pattern:
// a cover block + a markdown-walked body + page header / footer. Pure:
// IntelligenceBriefPayload → docx.Document. The route serializes via
// Packer.toBuffer.

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
} from '@/lib/exports-shared/docx-base';
import { markdownToDocxBlocks } from '@/lib/exports-shared/markdown-to-docx';
import type { IntelligenceBriefPayload } from '../brief-payload';

/** Build the Intelligence CXO brief docx Document. */
export function buildIntelligenceBriefDocx(
  payload: IntelligenceBriefPayload,
): Document {
  const cover = buildCoverBlock(payload);
  const bodyBlocks = markdownToDocxBlocks(payload.body || '');
  const footerNote = bodyParagraph([
    bodyRun(
      `Intelligence brief · ${payload.tenantName} · scaffolded by AbarVa Sentinel · generated ${payload.generatedAt}`,
      { color: SOURCE_DOCX.MUTED_COLOR, size: 18 },
    ),
  ]);

  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `Intelligence Brief · ${payload.tenantName}`,
    description: `CXO Intelligence brief for ${payload.tenantName}.`,
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
                    text: '   ·   Intelligence Brief',
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
                    text: 'Confidential — executive review · AbarVa Intelligence surface',
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

function buildCoverBlock(payload: IntelligenceBriefPayload): Paragraph[] {
  const blocks: Paragraph[] = [];
  blocks.push(eyebrowParagraph(`Intelligence · CXO Brief · ${payload.tenantName}`));
  blocks.push(coverTitleParagraph(`Intelligence Brief — ${payload.tenantName}`));
  blocks.push(coverSubtitleParagraph(`Generated: ${payload.generatedAt}`));
  if (!payload.hasCorpus) {
    blocks.push(
      bodyParagraph([
        boldRun('CORPUS NOT YET SEEDED — ', {
          color: SOURCE_DOCX.WARNING_COLOR,
        }),
        bodyRun(
          'this tenant has no Intelligence corpus loaded. Corpus-derived sections are honestly omitted; the AI initiative portfolio below reflects real records.',
          { color: SOURCE_DOCX.MUTED_COLOR },
        ),
      ]),
    );
  }
  return blocks;
}
