// Source · markdown → docx walker
//
// Parses an authored markdown body via mdast (the unified ecosystem's
// AST format used by react-markdown + remark) and emits a flat list of
// docx paragraphs / tables. Used by every long-form Source docx
// renderer (d05 scope memo, d09 RFP, d24 decision brief, d27 selection
// memo) so authored markdown round-trips without per-renderer parsing.
//
// Coverage:
//   - Headings 1-3 (and 4-6 collapse to 3) → styled headings
//   - Paragraphs with mixed bold / italic / inline-code runs
//   - Bulleted + ordered lists (depth ≤ 2)
//   - Block quotes
//   - Code blocks (preserved as monospaced paragraphs)
//   - GFM tables (rendered as docx Table)
//   - Horizontal rule (rendered as a 1-pt border-only paragraph)
//   - Soft breaks within a paragraph
//
// Out of scope (returns the raw text as a paragraph):
//   - Images (would need server-side fetch + embed)
//   - Footnotes
//   - HTML embeds

import 'server-only';

import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import {
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IRunOptions,
  type ParagraphChild,
} from 'docx';
import type {
  Blockquote,
  Code,
  Content,
  Emphasis,
  Heading,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph as MdParagraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table as MdTable,
  TableCell as MdTableCell,
  TableRow as MdTableRow,
  Text,
} from 'mdast';

import {
  ORDERED_NUMBERING_REF,
  SOURCE_DOCX,
  bodyParagraph,
  bodyRun,
  codeRun,
  heading1,
  heading2,
  heading3,
  quoteParagraph,
} from './docx-base';

/** Top-level entry. Parses md and returns an array of docx blocks. */
export function markdownToDocxBlocks(md: string): Array<Paragraph | Table> {
  const tree = fromMarkdown(md, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as Root;
  const out: Array<Paragraph | Table> = [];
  for (const child of tree.children) {
    out.push(...renderRoot(child));
  }
  return out;
}

function renderRoot(node: RootContent): Array<Paragraph | Table> {
  switch (node.type) {
    case 'heading':
      return [renderHeading(node)];
    case 'paragraph':
      return [renderParagraph(node)];
    case 'list':
      return renderList(node, 0);
    case 'blockquote':
      return renderBlockquote(node);
    case 'code':
      return [renderCodeBlock(node)];
    case 'table':
      return [renderTable(node)];
    case 'thematicBreak':
      return [renderThematicBreak()];
    case 'html':
      // Render raw HTML as plain text (best-effort).
      return [bodyParagraph([bodyRun(node.value)])];
    case 'definition':
    case 'footnoteDefinition':
    case 'yaml':
      // Skip (frontmatter, link defs, footnotes — out of scope).
      return [];
    default:
      // Unknown root — render the node's text content if any.
      return [bodyParagraph([bodyRun(extractPlain(node as Content))])];
  }
}

// ── Headings ───────────────────────────────────────────────────────────────

function renderHeading(node: Heading): Paragraph {
  const text = renderInline(node.children).map(textOf).join('');
  switch (node.depth) {
    case 1:
      return heading1(text);
    case 2:
      return heading2(text);
    default:
      return heading3(text);
  }
}

// ── Paragraphs ─────────────────────────────────────────────────────────────

function renderParagraph(node: MdParagraph): Paragraph {
  return bodyParagraph(renderInline(node.children));
}

// ── Lists ──────────────────────────────────────────────────────────────────

function renderList(node: List, depth: number): Paragraph[] {
  const out: Paragraph[] = [];
  for (const item of node.children as ListItem[]) {
    out.push(...renderListItem(item, !!node.ordered, depth));
  }
  return out;
}

function renderListItem(
  item: ListItem,
  ordered: boolean,
  depth: number,
): Paragraph[] {
  const out: Paragraph[] = [];
  for (const child of item.children) {
    if (child.type === 'paragraph') {
      const runs = renderInline(child.children);
      out.push(
        new Paragraph({
          children: runs,
          spacing: { before: 40, after: 40 },
          ...(ordered
            ? {
                numbering: {
                  reference: ORDERED_NUMBERING_REF,
                  level: Math.min(depth, 1),
                },
              }
            : { bullet: { level: Math.min(depth, 2) } }),
        }),
      );
    } else if (child.type === 'list') {
      out.push(...renderList(child, depth + 1));
    } else {
      out.push(bodyParagraph([bodyRun(extractPlain(child as Content))]));
    }
  }
  return out;
}

// ── Blockquote ─────────────────────────────────────────────────────────────

function renderBlockquote(node: Blockquote): Paragraph[] {
  const out: Paragraph[] = [];
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const text = renderInline(child.children).map(textOf).join('');
      out.push(quoteParagraph(text));
    } else {
      out.push(...renderRoot(child as RootContent).filter((b): b is Paragraph => b instanceof Paragraph));
    }
  }
  return out;
}

// ── Code block ─────────────────────────────────────────────────────────────

function renderCodeBlock(node: Code): Paragraph {
  const lines = node.value.split('\n');
  const runs: TextRun[] = [];
  lines.forEach((line, idx) => {
    runs.push(codeRun(line));
    if (idx < lines.length - 1) {
      runs.push(new TextRun({ text: '', break: 1 }));
    }
  });
  return new Paragraph({
    children: runs,
    spacing: { before: 120, after: 120 },
    border: {
      left: {
        color: SOURCE_DOCX.MUTED_COLOR,
        space: 12,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    indent: { left: 240 },
    shading: { fill: 'F4F2EC', type: 'clear', color: 'auto' },
  });
}

// ── Tables ─────────────────────────────────────────────────────────────────

function renderTable(node: MdTable): Table {
  const rows: TableRow[] = [];
  let isHeader = true;
  for (const r of node.children as MdTableRow[]) {
    const cells: TableCell[] = (r.children as MdTableCell[]).map(
      (c) => renderTableCell(c, isHeader),
    );
    rows.push(new TableRow({ children: cells, tableHeader: isHeader }));
    isHeader = false;
  }
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'D8D5CC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'ECE9E0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'ECE9E0' },
    },
  });
}

function renderTableCell(node: MdTableCell, isHeader: boolean): TableCell {
  const runs = renderInline(node.children);
  if (isHeader) {
    return new TableCell({
      shading: { fill: SOURCE_DOCX.HEADER_COLOR, type: 'clear', color: 'auto' },
      children: [
        new Paragraph({
          children: runs.map((r) =>
            r instanceof TextRun
              ? new TextRun({
                  text: textOf(r),
                  font: SOURCE_DOCX.BODY_FONT,
                  size: 20,
                  bold: true,
                  color: 'FAF7F1',
                })
              : r,
          ),
          spacing: { before: 60, after: 60 },
        }),
      ],
    });
  }
  return new TableCell({
    children: [
      new Paragraph({
        children: runs,
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
}

// ── Thematic break ─────────────────────────────────────────────────────────

function renderThematicBreak(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 200, after: 200 },
    border: {
      bottom: {
        color: SOURCE_DOCX.MUTED_COLOR,
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  });
}

// ── Inline ─────────────────────────────────────────────────────────────────

function renderInline(
  children: PhrasingContent[],
  inheritedStyle: Partial<IRunOptions> = {},
): ParagraphChild[] {
  const out: ParagraphChild[] = [];
  for (const c of children) {
    out.push(...renderInlineNode(c, inheritedStyle));
  }
  return out;
}

function renderInlineNode(
  node: PhrasingContent,
  style: Partial<IRunOptions>,
): ParagraphChild[] {
  switch (node.type) {
    case 'text':
      return [bodyRun((node as Text).value, style)];
    case 'strong':
      return renderInline((node as Strong).children, { ...style, bold: true });
    case 'emphasis':
      return renderInline((node as Emphasis).children, { ...style, italics: true });
    case 'inlineCode':
      return [codeRun((node as InlineCode).value, style)];
    case 'break':
      return [new TextRun({ text: '', break: 1 })];
    case 'link': {
      const text = (node as Link).children.map((c) => extractPlain(c as Content)).join('');
      return [bodyRun(text, { ...style, color: '1B5BB8', underline: {} })];
    }
    case 'delete':
      return renderInline(
        (node as { children: PhrasingContent[] }).children,
        { ...style, strike: true },
      );
    case 'html':
      return [bodyRun((node as { value: string }).value, style)];
    default:
      return [bodyRun(extractPlain(node as Content), style)];
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractPlain(node: Content): string {
  if (typeof (node as { value?: string }).value === 'string') {
    return (node as { value: string }).value;
  }
  if (Array.isArray((node as { children?: Content[] }).children)) {
    return ((node as { children: Content[] }).children)
      .map(extractPlain)
      .join('');
  }
  return '';
}

function textOf(child: ParagraphChild): string {
  // ParagraphChild can be TextRun (with options.text) or other shapes.
  // Use a defensive read since TextRun doesn't expose a .text property
  // publicly — but we only feed our own bodyRun-produced runs through
  // here, so we know they were built from a string.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = (child as any).options;
  if (opts && typeof opts.text === 'string') return opts.text;
  return '';
}
