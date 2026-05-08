// exports-shared · DOCX base primitives.
//
// Run/paragraph helpers, heading styles, brand fonts, and cover-page
// builders shared across all DOCX document renderers. Zero coupling to
// any product module — may be imported by programs/exports, moves/exports,
// or any future module that generates DOCX.
//
// Extracted from src/lib/programs/exports/renderers/program-charter.ts,
// discovery-report.ts, meeting-notes.ts, outcome-report.ts,
// pilot-result-report.ts, and workshop-facilitator-guide.ts in the
// journey-kit-phase3 wave.

import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Paragraph,
  TextRun,
} from 'docx';

// ── Brand fonts ─────────────────────────────────────────────────────────

/** Serif heading font (matches AbarVa design system). */
export const SERIF_HEADING_FONT = 'Georgia';
/** Sans-serif body font. */
export const SANS_BODY_FONT = 'Calibri';

// ── Document styles (for Document({ styles }) blocks) ──────────────────

/**
 * Canonical heading styles object for `new Document({ styles })`.
 *
 * Callers spread this into their Document constructor:
 *   `new Document({ styles: DOCX_HEADING_STYLES, ... })`
 */
export const DOCX_HEADING_STYLES = {
  default: {
    heading1: {
      run: {
        font: SERIF_HEADING_FONT,
        size: 44,
        bold: true,
        color: '0A0A0A',
      },
    },
    heading2: {
      run: {
        font: SERIF_HEADING_FONT,
        size: 30,
        bold: true,
        color: '0A0A0A',
      },
    },
    heading3: {
      run: {
        font: SERIF_HEADING_FONT,
        size: 24,
        bold: true,
        color: '0A0A0A',
      },
    },
  },
} as const;

// ── Cover-page paragraph helpers ────────────────────────────────────────

/** H1 title in the serif heading font (44pt bold). */
export function titleHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 44,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

/** Italic subtitle under the title (24pt serif). */
export function subtitleParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        italics: true,
        size: 24,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

/** Tenant key in monospace — small, muted. */
export function tenantKeyParagraph(tenantKey: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text: `Tenant: ${tenantKey}`,
        font: 'Courier New',
        size: 18,
        color: '706D66',
      }),
    ],
  });
}

/** Generation timestamp / author lines — small, italic, muted. */
export function timestampParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        italics: true,
        size: 18,
        color: '706D66',
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

/**
 * Bordered banner paragraph used to label the document class at the
 * top of the cover page (e.g. "SIGNED PROGRAM CHARTER · P2 GATE PACKAGE").
 */
export function gateBannerParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 240 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '0A0A0A' },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

// ── Body paragraph helpers ───────────────────────────────────────────────

/** H2 section heading (30pt serif bold). */
export function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 30,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

/** H3 sub-section heading (24pt serif bold). */
export function subsectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        font: SERIF_HEADING_FONT,
      }),
    ],
  });
}

/** Body prose paragraph (22pt Calibri). */
export function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

/** Body prose paragraph in italic (22pt Calibri). */
export function italicParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        italics: true,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

/** Body paragraph with mixed bold/plain/colored runs. */
export function bodyParagraphRich(
  runs: ReadonlyArray<{ text: string; bold?: boolean; color?: string }>,
): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold === true,
          color: r.color,
          size: 22,
          font: SANS_BODY_FONT,
        }),
    ),
  });
}

/** Bulleted list paragraph (level 0). */
export function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}

/** `Label: value` inline paragraph with bolded label. */
export function labeledLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: 22,
        font: SANS_BODY_FONT,
      }),
      new TextRun({
        text: value,
        size: 22,
        font: SANS_BODY_FONT,
      }),
    ],
  });
}
