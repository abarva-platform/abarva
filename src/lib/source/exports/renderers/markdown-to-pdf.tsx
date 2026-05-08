// Source · markdown → react-pdf walker
//
// Sister to markdown-to-html.ts and markdown-to-docx.ts. Parses an
// authored markdown body via mdast and emits an array of @react-pdf/
// renderer elements ready to nest inside a <Page>.
//
// v1 coverage (Slice 4.2):
//   - Headings 1-3 (4-6 collapse to 3)
//   - Paragraphs with mixed bold / italic / inline-code runs
//   - Bulleted + ordered lists (depth ≤ 2)
//   - Block quotes (rendered as left-rule + muted text)
//   - Fenced code blocks (monospaced + softer bg)
//   - Thematic break (horizontal rule via View border-bottom)
//   - GFM tables (flex-row Views with header bg)
//
// Out of scope for v1:
//   - Heading id slugs (no anchor support in PDFs we generate)
//   - Image embeds
//   - Footnotes
//
// Pure: input markdown → ReactNode array. The narrative-pdf renderer
// nests these inside a Document/Page hierarchy.

import 'server-only';

import { Text, View } from '@react-pdf/renderer';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import type { ReactNode } from 'react';
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
  Text as MdText,
} from 'mdast';

import { PDF_COLORS, PDF_FONTS, PDF_STYLES } from './pdf-base';

/** Top-level entry. Parses md and returns an array of ReactNodes. */
export function markdownToPdfNodes(md: string): ReactNode[] {
  if (!md) return [];
  const tree = fromMarkdown(md, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as Root;
  return tree.children.map((child, idx) => (
    <View key={idx}>{renderRoot(child)}</View>
  ));
}

function renderRoot(node: RootContent): ReactNode {
  switch (node.type) {
    case 'heading':
      return renderHeading(node);
    case 'paragraph':
      return renderParagraph(node);
    case 'list':
      return renderList(node, 0);
    case 'blockquote':
      return renderBlockquote(node);
    case 'code':
      return renderCodeBlock(node);
    case 'table':
      return renderTable(node);
    case 'thematicBreak':
      return <View style={PDF_STYLES.hr} />;
    case 'html':
      return (
        <Text style={PDF_STYLES.body}>
          {(node as { value: string }).value}
        </Text>
      );
    case 'definition':
    case 'footnoteDefinition':
    case 'yaml':
      return null;
    default:
      return (
        <Text style={PDF_STYLES.body}>{extractPlain(node as Content)}</Text>
      );
  }
}

// ── Headings ───────────────────────────────────────────────────────────────

function renderHeading(node: Heading): ReactNode {
  const text = renderInline(node.children);
  switch (node.depth) {
    case 1:
      return <Text style={PDF_STYLES.h1}>{text}</Text>;
    case 2:
      return <Text style={PDF_STYLES.h2}>{text}</Text>;
    default:
      return <Text style={PDF_STYLES.h3}>{text}</Text>;
  }
}

// ── Paragraphs ─────────────────────────────────────────────────────────────

function renderParagraph(node: MdParagraph): ReactNode {
  return <Text style={PDF_STYLES.body}>{renderInline(node.children)}</Text>;
}

// ── Lists ──────────────────────────────────────────────────────────────────

function renderList(node: List, depth: number): ReactNode {
  return (
    <View style={depth === 0 ? PDF_STYLES.list : PDF_STYLES.listNested}>
      {(node.children as ListItem[]).map((item, idx) =>
        renderListItem(item, !!node.ordered, idx, depth),
      )}
    </View>
  );
}

function renderListItem(
  item: ListItem,
  ordered: boolean,
  index: number,
  depth: number,
): ReactNode {
  const marker = ordered ? `${index + 1}.` : depth === 0 ? '•' : '◦';
  const parts: ReactNode[] = [];
  for (const child of item.children) {
    if (child.type === 'paragraph') {
      parts.push(
        <Text style={PDF_STYLES.listItemText} key={parts.length}>
          {renderInline(child.children)}
        </Text>,
      );
    } else if (child.type === 'list') {
      parts.push(
        <View key={parts.length}>{renderList(child, depth + 1)}</View>,
      );
    }
  }
  return (
    <View style={PDF_STYLES.listItem} key={index}>
      <Text style={PDF_STYLES.listMarker}>{marker}</Text>
      <View style={PDF_STYLES.listItemBody}>{parts}</View>
    </View>
  );
}

// ── Block quote ────────────────────────────────────────────────────────────

function renderBlockquote(node: Blockquote): ReactNode {
  return (
    <View style={PDF_STYLES.blockquote}>
      {node.children.map((child, idx) => {
        if (child.type === 'paragraph') {
          return (
            <Text key={idx} style={PDF_STYLES.blockquoteText}>
              {renderInline(child.children)}
            </Text>
          );
        }
        return <View key={idx}>{renderRoot(child as RootContent)}</View>;
      })}
    </View>
  );
}

// ── Code block ─────────────────────────────────────────────────────────────

function renderCodeBlock(node: Code): ReactNode {
  return (
    <View style={PDF_STYLES.codeBlock}>
      <Text style={PDF_STYLES.codeBlockText}>{node.value ?? ''}</Text>
    </View>
  );
}

// ── Tables ─────────────────────────────────────────────────────────────────
//
// @react-pdf's flexbox layout has a known overflow bug for tables with
// many rows or wide content — the "unsupported number: -8.5e+21" error
// in d09 RFP (11 tables) traced to this. We render tables as a stack
// of monospaced rows separated by ASCII pipes — loses some visual
// styling but is robust against any input shape. Buyers reading the
// PDF still see the table contents clearly; if pristine visual tables
// are needed the docx + html exports are the better surface for that.

function renderTable(node: MdTable): ReactNode {
  const rows = node.children as MdTableRow[];
  if (rows.length === 0) return null;
  // Compute the plain-text content of each cell so we can size widths.
  const textRows: string[][] = rows.map((row) =>
    (row.children as MdTableCell[]).map((cell) =>
      (cell.children as PhrasingContent[])
        .map((c) => extractPlain(c as Content))
        .join(''),
    ),
  );
  // Render as a View with one Text per row. Header row uses bold +
  // ink color; body rows use the muted style for separators.
  return (
    <View
      style={{
        marginVertical: 8,
        borderColor: PDF_COLORS.RULE,
        borderWidth: 1,
        borderRadius: 2,
        backgroundColor: PDF_COLORS.SOFT,
        padding: 6,
      }}
    >
      {textRows.map((row, idx) => {
        const isHeader = idx === 0;
        return (
          <Text
            key={idx}
            style={{
              fontFamily: PDF_FONTS.MONO,
              fontSize: 8,
              color: isHeader ? PDF_COLORS.HEADER : PDF_COLORS.MUTED,
              marginBottom: 2,
            }}
          >
            {row.join(' │ ')}
          </Text>
        );
      })}
    </View>
  );
}

// ── Inline ─────────────────────────────────────────────────────────────────
//
// react-pdf flattens text — when you nest <Text> in <Text>, layout
// math breaks for long bodies (it runs into floating-point overflow on
// very large paragraphs, throwing "unsupported number: -8.5e+21" or
// similar). Strategy: only emit nested <Text> when we need a different
// font/style; plain text emits as raw strings inside the parent Text.

function renderInline(children: PhrasingContent[]): ReactNode[] {
  // Returns an array of (string | ReactElement) children that the parent
  // <Text> element can splice in directly. No outer <Text> wrapper.
  return children.map((child, idx) => renderInlineNode(child, idx));
}

function renderInlineNode(node: PhrasingContent, key: number): ReactNode {
  switch (node.type) {
    case 'text':
      // Plain text becomes a raw string child of the parent Text. This
      // is the load-bearing case for long bodies — wrapping plain text
      // in <Text> is what triggers the layout overflow.
      return (node as MdText).value;
    case 'strong':
      return (
        <Text key={key} style={{ fontFamily: PDF_FONTS.BODY_BOLD }}>
          {(node as Strong).children.map((c, i) => renderInlineNode(c, i))}
        </Text>
      );
    case 'emphasis':
      return (
        <Text key={key} style={{ fontFamily: PDF_FONTS.BODY_ITALIC }}>
          {(node as Emphasis).children.map((c, i) => renderInlineNode(c, i))}
        </Text>
      );
    case 'inlineCode':
      return (
        <Text
          key={key}
          style={{
            fontFamily: PDF_FONTS.MONO,
            backgroundColor: PDF_COLORS.SOFT,
            fontSize: 9,
          }}
        >
          {(node as InlineCode).value}
        </Text>
      );
    case 'break':
      return '\n';
    case 'link': {
      const link = node as Link;
      const inner = link.children
        .map((c) => extractPlain(c as Content))
        .join('');
      return (
        <Text
          key={key}
          style={{ color: '#1B5BB8', textDecoration: 'underline' }}
        >
          {inner}
        </Text>
      );
    }
    case 'delete':
      return (
        <Text key={key} style={{ textDecoration: 'line-through' }}>
          {(node as { children: PhrasingContent[] }).children.map((c, i) =>
            renderInlineNode(c, i),
          )}
        </Text>
      );
    default:
      return extractPlain(node as Content);
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
