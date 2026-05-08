// exports-shared · Pure mdast → docx walker.
//
// Converts a mdast (markdown abstract syntax tree) node tree to an array
// of docx block elements (Paragraph | Table). Zero coupling to any product
// module, zero I/O, zero auth.
//
// Callers parse markdown with mdast-util-from-markdown + mdast-util-gfm
// and pass the root node to `mdastToDocxChildren`. The resulting array can
// be spread into a docx Document section's `children` array.
//
// Supported node types: heading (H1–H6), paragraph, text, strong,
// emphasis, inlineCode, code, blockquote, list, listItem, link,
// thematicBreak, table (GFM), tableRow, tableCell.
//
// Added in the journey-kit-phase3 wave.

import {
  HeadingLevel,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import {
  SANS_BODY_FONT,
  SERIF_HEADING_FONT,
  bodyParagraph,
  bulletParagraph,
} from './docx-base';
import { makeDataCell, makeHeaderCell } from './structured-docx-base';
import type { MdastNode } from './markdown-to-html';

// ── Inline run builder ───────────────────────────────────────────────────

/**
 * Flatten an inline mdast subtree into an array of TextRun objects.
 *
 * Supports: text, strong, emphasis, inlineCode, link (href not preserved
 * in docx — link text only). Unknown inline nodes recurse into children.
 */
function inlineRuns(
  node: MdastNode,
  opts?: { bold?: boolean; italic?: boolean; color?: string },
): TextRun[] {
  switch (node.type) {
    case 'text':
      return [
        new TextRun({
          text: node.value ?? '',
          bold: opts?.bold,
          italics: opts?.italic,
          color: opts?.color,
          size: 22,
          font: SANS_BODY_FONT,
        }),
      ];

    case 'strong':
      return (node.children ?? []).flatMap((c) =>
        inlineRuns(c, { ...opts, bold: true }),
      );

    case 'emphasis':
      return (node.children ?? []).flatMap((c) =>
        inlineRuns(c, { ...opts, italic: true }),
      );

    case 'inlineCode':
      return [
        new TextRun({
          text: node.value ?? '',
          font: 'Courier New',
          size: 20,
          color: '706D66',
        }),
      ];

    case 'link':
      // Docx link support via ExternalHyperlink would require extra imports;
      // for now render as plain text to keep this module zero-dependency on
      // the docx hyperlink API. Callers who need clickable links should post-
      // process the output or use the ExternalHyperlink wrapper themselves.
      return (node.children ?? []).flatMap((c) => inlineRuns(c, opts));

    default:
      return (node.children ?? []).flatMap((c) => inlineRuns(c, opts));
  }
}

// ── Block node converter ─────────────────────────────────────────────────

const HEADING_LEVEL_MAP: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

const HEADING_FONT_SIZES: Record<number, number> = {
  1: 44,
  2: 30,
  3: 24,
  4: 22,
  5: 20,
  6: 18,
};

/**
 * Convert a single mdast block node to docx block elements.
 *
 * Returns an array because some nodes (e.g. lists) produce multiple
 * top-level Paragraphs, and tables produce a Table.
 */
function blockNode(node: MdastNode): Array<Paragraph | Table> {
  switch (node.type) {
    case 'root':
      return (node.children ?? []).flatMap(blockNode);

    case 'heading': {
      const depth = Math.min(Math.max(node.depth ?? 2, 1), 6);
      const level = HEADING_LEVEL_MAP[depth] ?? HeadingLevel.HEADING_2;
      const fontSize = HEADING_FONT_SIZES[depth] ?? 24;
      return [
        new Paragraph({
          heading: level,
          spacing: { before: depth <= 2 ? 360 : 240, after: depth <= 2 ? 120 : 80 },
          children: [
            new TextRun({
              text: (node.children ?? [])
                .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
                .join(''),
              bold: true,
              size: fontSize,
              font: SERIF_HEADING_FONT,
            }),
          ],
        }),
      ];
    }

    case 'paragraph':
      return [
        new Paragraph({
          spacing: { after: 120 },
          children: (node.children ?? []).flatMap((c) => inlineRuns(c)),
        }),
      ];

    case 'blockquote': {
      // Render as indented italic body paragraphs.
      const inner = (node.children ?? []).flatMap(blockNode);
      return inner.map((p) => {
        if (p instanceof Paragraph) {
          return new Paragraph({
            spacing: { after: 120 },
            indent: { left: 720 },
            children: [
              new TextRun({
                text: '» ',
                italics: true,
                size: 22,
                font: SANS_BODY_FONT,
                color: '706D66',
              }),
            ],
          });
        }
        return p;
      });
    }

    case 'list':
      return (node.children ?? []).flatMap((item) => {
        const text = (item.children ?? [])
          .flatMap((c) => (c.type === 'paragraph' ? (c.children ?? []) : [c]))
          .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
          .join('');
        return [bulletParagraph(text)];
      });

    case 'listItem': {
      const text = (node.children ?? [])
        .flatMap((c) => (c.type === 'paragraph' ? (c.children ?? []) : [c]))
        .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
        .join('');
      return [bulletParagraph(text)];
    }

    case 'code':
      return [bodyParagraph(`[Code: ${node.lang ?? ''}]\n${node.value ?? ''}`)];

    case 'thematicBreak':
      return [
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: '─'.repeat(60), size: 16, color: '706D66' })],
        }),
      ];

    case 'table': {
      const [headerRow, ...dataRows] = node.children ?? [];
      const headers = (headerRow?.children ?? []).map((cell) =>
        (cell.children ?? [])
          .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
          .join(''),
      );
      const columnCount = headers.length;
      const colWidth = Math.floor(9000 / Math.max(columnCount, 1));

      const tHeaderRow = new TableRow({
        tableHeader: true,
        children: headers.map((h) =>
          makeHeaderCell(h, { widthDxa: colWidth }),
        ),
      });

      const tDataRows = dataRows.map((row) =>
        new TableRow({
          children: (row.children ?? []).map((cell, ci) => {
            const text = (cell.children ?? [])
              .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
              .join('');
            return makeDataCell(text, {
              widthDxa: colWidth,
              bold: ci === 0,
            });
          }),
        }),
      );

      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [tHeaderRow, ...tDataRows],
        }),
      ];
    }

    default:
      // Unknown block — try to render children.
      return (node.children ?? []).flatMap(blockNode);
  }
}

/**
 * Convert a mdast root node to an array of docx block elements.
 *
 * The returned array can be spread into a Document section's `children`:
 *
 * @example
 * ```ts
 * import { fromMarkdown } from 'mdast-util-from-markdown';
 * import { gfm } from 'micromark-extension-gfm';
 * import { gfmFromMarkdown } from 'mdast-util-gfm';
 * import { mdastToDocxChildren } from '@/lib/exports-shared/markdown-to-docx';
 *
 * const tree = fromMarkdown(source, {
 *   extensions: [gfm()],
 *   mdastExtensions: [gfmFromMarkdown()],
 * });
 * const blocks = mdastToDocxChildren(tree);
 * // new Document({ sections: [{ children: [...coverPage, ...blocks] }] })
 * ```
 */
export function mdastToDocxChildren(
  root: MdastNode,
): Array<Paragraph | Table> {
  return blockNode(root);
}

// Re-export the node type so callers don't need to import from markdown-to-html.
export type { MdastNode };
