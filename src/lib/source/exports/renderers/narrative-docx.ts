// Source · narrative docx renderer
//
// Generic renderer for any long-form narrative artifact. Slice 3.1
// shipped this as scope-memo-docx.ts; Slice 3.2 generalizes it so d09
// (RFP), d24 (Decision Brief), d27 (Selection Memo) — all narrative
// markdown bodies — share the same cover-page + body-walker + footer
// template without code duplication.
//
// The shape of each narrative artifact is identical:
//   1. Cover block (eyebrow / display title / event metadata / scaffold
//      warning when bodyIsAuthored=false)
//   2. Body (markdown → docx via the shared markdown-to-docx walker)
//   3. Footer paragraph + page header/footer
//
// The only thing that varies per artifact is the eyebrow text, the
// header label, and the confidentiality note — all of which come in
// via NarrativeDocxConfig.

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

/** Payload all narrative renderers consume. */
export interface NarrativeDocxPayload {
  tenantName: string;
  eventCode: string;
  eventName: string;
  /** Free-form owner / sponsor block from event intake. Optional. */
  issuedBy?: string;
  /** ISO 8601 generated-at timestamp. */
  generatedAt: string;
  /** Markdown body. */
  body: string;
  /** True when the body is authored content; false = canonical scaffold. */
  bodyIsAuthored: boolean;
}

/** Per-artifact config that customizes the cover + headers. */
export interface NarrativeDocxConfig {
  /** Artifact code (e.g. "d09_rfp_pack") — used in document.title. */
  artifactCode: string;
  /** Display label shown in the page header (e.g. "d09 RFP Package"). */
  headerLabel: string;
  /** Eyebrow line above the cover title (e.g. "d09 · RFP Package · {tenant}"). */
  eyebrowFor: (tenantName: string) => string;
  /** Subtitle prefix for document.title (e.g. "RFP Package"). */
  documentTitle: string;
  /** Confidentiality / distribution caveat shown in the page footer. */
  confidentialityNote: string;
}

/** Build a narrative docx Document. Pure: payload+config → Document. */
export function buildNarrativeDocx(
  payload: NarrativeDocxPayload,
  config: NarrativeDocxConfig,
): Document {
  const cover = buildCoverBlock(payload, config);
  const bodyBlocks = markdownToDocxBlocks(payload.body || '');
  const footerNote = bodyParagraph([
    bodyRun(
      `Source canvas · ${payload.eventCode} · scaffolded by AbarVa Sentinel · generated ${payload.generatedAt}`,
      { color: SOURCE_DOCX.MUTED_COLOR, size: 18 },
    ),
  ]);

  return new Document({
    creator: 'AbarVa · Sentinel',
    title: `${config.documentTitle} · ${payload.eventCode}`,
    description: `${config.headerLabel} for sourcing event ${payload.eventCode}.`,
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
                    text: `   ·   ${payload.eventCode}   ·   ${config.headerLabel}`,
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
                    text: config.confidentialityNote,
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

function buildCoverBlock(
  payload: NarrativeDocxPayload,
  config: NarrativeDocxConfig,
): Paragraph[] {
  const blocks: Paragraph[] = [];
  blocks.push(eyebrowParagraph(config.eyebrowFor(payload.tenantName)));
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
          `The content below is the canonical ${config.headerLabel} scaffold; replace with the actual authored content before circulating.`,
          { color: SOURCE_DOCX.MUTED_COLOR },
        ),
      ]),
    );
  }
  return blocks;
}

// ── Per-artifact configs ───────────────────────────────────────────────────

export const SCOPE_MEMO_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: 'd05_scope_memo',
  headerLabel: 'd05 Scope Memo',
  eyebrowFor: (tenant) => `d05 · Scope Memo · ${tenant}`,
  documentTitle: 'Scope Memo',
  confidentialityNote: 'Confidential — distribute only to procurement panel',
};

export const RFP_PACK_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: 'd09_rfp_pack',
  headerLabel: 'd09 RFP Package',
  eyebrowFor: (tenant) => `d09 · RFP Package · ${tenant}`,
  documentTitle: 'RFP Package',
  confidentialityNote:
    'Confidential vendor RFP — do not redistribute outside the named bidder panel',
};

export const DECISION_BRIEF_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: 'd24_decision_brief',
  headerLabel: 'd24 Atlas Decision Brief',
  eyebrowFor: (tenant) => `d24 · Atlas Decision Brief · ${tenant}`,
  documentTitle: 'Decision Brief',
  confidentialityNote:
    'Executive review only — pre-decision; not for vendor distribution',
};

export const SELECTION_MEMO_DOCX_CONFIG: NarrativeDocxConfig = {
  artifactCode: 'd27_selection_memo',
  headerLabel: 'd27 Selection Memo',
  eyebrowFor: (tenant) => `d27 · Selection Memo · ${tenant}`,
  documentTitle: 'Selection Memo',
  confidentialityNote:
    'Confidential — final selection memo; release after sponsor sign-off only',
};
