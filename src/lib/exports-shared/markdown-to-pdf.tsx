// exports-shared · Pure mdast → @react-pdf walker.
//
// Converts a mdast (markdown abstract syntax tree) node tree to React
// elements using @react-pdf/renderer primitives. Zero coupling to any
// product module, zero Next.js, zero browser APIs.
//
// Callers parse markdown with mdast-util-from-markdown + mdast-util-gfm
// and pass the root node to `MdastToPdf`. The component can be embedded
// inside any @react-pdf Page / View hierarchy.
//
// Supported node types: heading, paragraph, text, strong, emphasis,
// inlineCode, code, blockquote, list, listItem, thematicBreak,
// table (GFM), tableRow, tableCell. Links render as plain text.
//
// Added in the journey-kit-phase3 wave.

// @react-pdf/renderer is installed when PDF support ships (EXPORT-5).
// Until then, require() with a fallback stub so this module compiles and
// tests can import it without the package being present.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReactPdfComponent = React.ComponentType<Record<string, any>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Text: ReactPdfComponent, View: ReactPdfComponent;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const r = require('@react-pdf/renderer');
  Text = r.Text;
  View = r.View;
} catch {
  // Stubs that render nothing — safe at type-check + test time.
  // eslint-disable-next-line react/display-name
  Text = ({ children }: React.PropsWithChildren) => <span>{children}</span>;
  // eslint-disable-next-line react/display-name
  View = ({ children }: React.PropsWithChildren) => <div>{children}</div>;
}

import React from 'react';

import { PDF_COLORS, PDF_FONT_SIZES, styles } from './pdf-base';
import type { MdastNode } from './markdown-to-html';

// ── Inline renderer ──────────────────────────────────────────────────────

interface InlineOpts {
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

/**
 * Render an inline mdast node to @react-pdf Text content.
 *
 * Returns a React element (or array of elements) suitable as children
 * of a `<Text>` component.
 */
function InlineNode({
  node,
  opts,
}: {
  node: MdastNode;
  opts?: InlineOpts;
}): React.ReactElement {
  switch (node.type) {
    case 'text':
      return (
        <Text
          style={{
            fontWeight: opts?.bold ? 'bold' : 'normal',
            fontStyle: opts?.italic ? 'italic' : 'normal',
            color: opts?.color ?? PDF_COLORS.ink,
          }}
        >
          {node.value ?? ''}
        </Text>
      );

    case 'strong':
      return (
        <>
          {(node.children ?? []).map((c, i) => (
            <InlineNode key={i} node={c} opts={{ ...opts, bold: true }} />
          ))}
        </>
      );

    case 'emphasis':
      return (
        <>
          {(node.children ?? []).map((c, i) => (
            <InlineNode key={i} node={c} opts={{ ...opts, italic: true }} />
          ))}
        </>
      );

    case 'inlineCode':
      return (
        <Text
          style={{
            fontFamily: 'Courier',
            fontSize: PDF_FONT_SIZES.small,
            color: PDF_COLORS.muted,
          }}
        >
          {node.value ?? ''}
        </Text>
      );

    case 'link':
      // Render link text only — @react-pdf Link requires a src prop that
      // changes the element type; keep this module simple.
      return (
        <>
          {(node.children ?? []).map((c, i) => (
            <InlineNode key={i} node={c} opts={opts} />
          ))}
        </>
      );

    default:
      return (
        <>
          {(node.children ?? []).map((c, i) => (
            <InlineNode key={i} node={c} opts={opts} />
          ))}
        </>
      );
  }
}

// ── Block renderer ───────────────────────────────────────────────────────

const HEADING_FONT_SIZES_PDF: Record<number, number> = {
  1: 20,
  2: 15,
  3: 12,
  4: 11,
  5: 10,
  6: 9,
};

/**
 * Render a single block mdast node to a @react-pdf View/Text element.
 */
function BlockNode({ node }: { node: MdastNode }): React.ReactElement {
  switch (node.type) {
    case 'heading': {
      const depth = Math.min(Math.max(node.depth ?? 2, 1), 6);
      const fontSize = HEADING_FONT_SIZES_PDF[depth] ?? 12;
      return (
        <View
          style={{
            marginTop: depth <= 2 ? 16 : 10,
            marginBottom: depth <= 2 ? 6 : 4,
          }}
        >
          <Text
            style={{
              fontSize,
              fontWeight: 'bold',
              color: PDF_COLORS.ink,
            }}
          >
            {(node.children ?? [])
              .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
              .join('')}
          </Text>
        </View>
      );
    }

    case 'paragraph':
      return (
        <View style={styles.bodyParagraph}>
          <Text>
            {(node.children ?? []).map((c, i) => (
              <InlineNode key={i} node={c} />
            ))}
          </Text>
        </View>
      );

    case 'blockquote':
      return (
        <View
          style={{
            borderLeftWidth: 3,
            borderLeftColor: PDF_COLORS.muted,
            paddingLeft: 8,
            marginLeft: 8,
            marginBottom: 6,
          }}
        >
          {(node.children ?? []).map((c, i) => (
            <BlockNode key={i} node={c} />
          ))}
        </View>
      );

    case 'list':
      return (
        <View style={{ marginBottom: 6 }}>
          {(node.children ?? []).map((item, i) => {
            const text = (item.children ?? [])
              .flatMap((c) =>
                c.type === 'paragraph' ? (c.children ?? []) : [c],
              )
              .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
              .join('');
            return (
              <View key={i} style={styles.bulletItem}>
                <Text>{'• ' + text}</Text>
              </View>
            );
          })}
        </View>
      );

    case 'code':
      return (
        <View style={{ marginBottom: 6 }}>
          <Text
            style={{
              fontFamily: 'Courier',
              fontSize: PDF_FONT_SIZES.small,
              color: PDF_COLORS.muted,
              backgroundColor: PDF_COLORS.bandBg,
              padding: 4,
            }}
          >
            {node.value ?? ''}
          </Text>
        </View>
      );

    case 'thematicBreak':
      return (
        <View
          style={{
            borderBottomWidth: 0.5,
            borderBottomColor: PDF_COLORS.muted,
            marginTop: 8,
            marginBottom: 8,
          }}
        />
      );

    case 'table': {
      const [headerRow, ...dataRows] = node.children ?? [];
      return (
        <View style={{ marginBottom: 8 }}>
          {/* Header */}
          {headerRow !== undefined && (
            <View style={{ flexDirection: 'row', backgroundColor: PDF_COLORS.ink }}>
              {(headerRow.children ?? []).map((cell, ci) => (
                <View key={ci} style={{ flex: 1, padding: 4 }}>
                  <Text
                    style={{
                      fontSize: PDF_FONT_SIZES.table,
                      fontWeight: 'bold',
                      color: PDF_COLORS.headerText,
                    }}
                  >
                    {(cell.children ?? [])
                      .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
                      .join('')}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {/* Data rows */}
          {dataRows.map((row, ri) => (
            <View
              key={ri}
              style={ri % 2 === 1 ? styles.tableBandedRow : styles.tableRow}
            >
              {(row.children ?? []).map((cell, ci) => (
                <View key={ci} style={styles.tableDataCell}>
                  <Text style={{ fontSize: PDF_FONT_SIZES.table, color: PDF_COLORS.ink }}>
                    {(cell.children ?? [])
                      .map((c) => (c.type === 'text' ? (c.value ?? '') : ''))
                      .join('')}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    default:
      return (
        <View>
          {(node.children ?? []).map((c, i) => (
            <BlockNode key={i} node={c} />
          ))}
        </View>
      );
  }
}

// ── Public component ─────────────────────────────────────────────────────

interface MdastToPdfProps {
  /** mdast root node produced by fromMarkdown. */
  root: MdastNode;
}

/**
 * Render a mdast root node to @react-pdf elements.
 *
 * Embed inside a `<Page>` component from @react-pdf/renderer:
 *
 * @example
 * ```tsx
 * import { Document, Page } from '@react-pdf/renderer';
 * import { MdastToPdf } from '@/lib/exports-shared/markdown-to-pdf';
 *
 * function MyPdf({ root }: { root: MdastNode }) {
 *   return (
 *     <Document>
 *       <Page style={styles.page}>
 *         <MdastToPdf root={root} />
 *       </Page>
 *     </Document>
 *   );
 * }
 * ```
 */
export function MdastToPdf({ root }: MdastToPdfProps): React.ReactElement {
  return (
    <View>
      {(root.children ?? []).map((node, i) => (
        <BlockNode key={i} node={node} />
      ))}
    </View>
  );
}

// Re-export for convenience.
export type { MdastNode };
