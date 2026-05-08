// Source · docx renderer base utilities
//
// Shared style tokens + helpers used by every Source docx generator.
// Mirrors the xlsx-base.ts pattern — pure helpers, no I/O. Renderers
// build a docx.Document and the route serializes via Packer.toBuffer.
//
// Brand tokens: paragraphs use AbarVa typography (DM Sans body, Georgia
// for big headings on cover) so the downloaded artifact reads like the
// canvas. Colors mirror the Source xlsx palette where they overlap.

import 'server-only';

import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  LevelFormat,
  Paragraph,
  TextRun,
  type IParagraphOptions,
  type IRunOptions,
  type ParagraphChild,
} from 'docx';

// ── Brand tokens ───────────────────────────────────────────────────────────
export const SOURCE_DOCX = {
  /** AbarVa ink (deep navy). */
  HEADER_COLOR: '0C1A3A',
  /** AbarVa muted text. */
  MUTED_COLOR: '706D66',
  /** Sentinel teal accent. */
  ACCENT_COLOR: '2DD4C8',
  /** Soft amber for callouts. */
  WARNING_COLOR: 'F4B400',
  /** Cream cover bg analog (used as table fill on cover). */
  COVER_BG: 'F8F7F4',
  /** AbarVa v3 body sans — Inter (matches src/app/layout.tsx). Word
   *  substitutes with the closest installed sans (Inter is now common
   *  on Win11/macOS; older systems fall back to Calibri / Helvetica). */
  BODY_FONT: 'Inter',
  /** AbarVa v3 display serif — Fraunces. Word substitutes with the
   *  closest serif (Georgia is the most likely fallback). */
  DISPLAY_FONT: 'Fraunces',
  /** AbarVa v3 mono — JetBrains Mono. Word fallbacks to Consolas/Menlo. */
  MONO_FONT: 'JetBrains Mono',
} as const;

/** Standard body run options. */
export function bodyRun(text: string, opts: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({
    text,
    font: SOURCE_DOCX.BODY_FONT,
    size: 22, // 11pt (docx uses half-points)
    ...opts,
  });
}

/** Bold-styled run (headings + emphasis). */
export function boldRun(text: string, opts: Partial<IRunOptions> = {}): TextRun {
  return bodyRun(text, { bold: true, ...opts });
}

/** Italic run. */
export function italicRun(text: string, opts: Partial<IRunOptions> = {}): TextRun {
  return bodyRun(text, { italics: true, ...opts });
}

/** Inline code / monospace run. */
export function codeRun(text: string, opts: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({
    text,
    font: SOURCE_DOCX.MONO_FONT,
    size: 20, // 10pt
    color: '383530',
    ...opts,
  });
}

/** Standard paragraph wrapper around runs with consistent spacing. */
export function bodyParagraph(
  children: ParagraphChild[],
  opts: Partial<IParagraphOptions> = {},
): Paragraph {
  return new Paragraph({
    children,
    spacing: { before: 80, after: 80, line: 320 }, // ~1.15 line height
    ...opts,
  });
}

/** Big display heading for cover-page artifact title. */
export function coverTitleParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 160, line: 360 },
    children: [
      new TextRun({
        text,
        font: SOURCE_DOCX.DISPLAY_FONT,
        size: 44, // 22pt
        color: SOURCE_DOCX.HEADER_COLOR,
      }),
    ],
  });
}

/** Subtitle paragraph (event code, generated-at). */
export function coverSubtitleParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 60 },
    children: [
      new TextRun({
        text,
        font: SOURCE_DOCX.BODY_FONT,
        size: 22,
        color: SOURCE_DOCX.MUTED_COLOR,
      }),
    ],
  });
}

/**
 * Eyebrow paragraph — small uppercase row above a section. Used at the
 * top of section dividers to mark the artifact code.
 */
export function eyebrowParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 60 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: SOURCE_DOCX.BODY_FONT,
        size: 18, // 9pt
        bold: true,
        color: SOURCE_DOCX.MUTED_COLOR,
        characterSpacing: 12,
      }),
    ],
  });
}

/** Heading 1 paragraph (big section). */
export function heading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({
        text,
        font: SOURCE_DOCX.BODY_FONT,
        size: 32, // 16pt
        bold: true,
        color: SOURCE_DOCX.HEADER_COLOR,
      }),
    ],
  });
}

/** Heading 2 paragraph (subsection). */
export function heading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [
      new TextRun({
        text,
        font: SOURCE_DOCX.BODY_FONT,
        size: 26, // 13pt
        bold: true,
        color: SOURCE_DOCX.HEADER_COLOR,
      }),
    ],
  });
}

/** Heading 3 paragraph. */
export function heading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        font: SOURCE_DOCX.BODY_FONT,
        size: 24, // 12pt
        bold: true,
        color: SOURCE_DOCX.HEADER_COLOR,
      }),
    ],
  });
}

/** Page break. */
export function pageBreak(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '', break: 1 })],
    pageBreakBefore: true,
  });
}

/** Block-quote paragraph (left rule + muted text). */
export function quoteParagraph(text: string): Paragraph {
  return new Paragraph({
    indent: { left: 360 },
    border: {
      left: {
        color: SOURCE_DOCX.ACCENT_COLOR,
        space: 12,
        style: BorderStyle.SINGLE,
        size: 12,
      },
    },
    spacing: { before: 120, after: 120, line: 320 },
    children: [
      italicRun(text, { color: SOURCE_DOCX.MUTED_COLOR }),
    ],
  });
}

/** Numbering config for the markdown-to-docx ordered-list mapping. */
export const ORDERED_NUMBERING_REF = 'source-ordered';

/** Document-level numbering definition. */
export const ORDERED_NUMBERING_CONFIG = {
  config: [
    {
      reference: ORDERED_NUMBERING_REF,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 480, hanging: 360 } },
          },
        },
        {
          level: 1,
          format: LevelFormat.LOWER_LETTER,
          text: '%2.',
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 960, hanging: 360 } },
          },
        },
      ],
    },
  ],
};

/** DOCX MIME (Open Office XML word). */
export const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
