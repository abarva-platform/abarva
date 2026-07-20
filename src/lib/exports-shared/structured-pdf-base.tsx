// Source · structured-data pdf helpers
//
// PDF companion to structured-docx-base.ts. Where structured-docx
// renders typed payloads (AppInventoryPayload / TrapLogPayload / etc.)
// as docx tables, this module renders the same typed payloads as
// @react-pdf/renderer table Views — so every structured Source
// artifact has a readable, print-ready PDF alongside its xlsx data
// surface.
//
// The shared infrastructure here is purely table + cover styling.
// Each per-artifact PDF renderer composes these helpers + the cover
// blocks below into a <Document>.
//
// Pure: returns React elements; the route serializes via
// @react-pdf's pdf().toBuffer().

import 'server-only';

import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement, ReactNode } from 'react';

import { PDF_COLORS, PDF_FONTS, PDF_STYLES } from './pdf-base';

/** A column definition for a structured PDF table. */
export interface StructuredPdfColumn<T> {
  header: string;
  /** Relative flex weight for the column width. */
  flex: number;
  /** Cell value extractor. */
  extract: (row: T) => string;
}

/**
 * Build a structured table as a stack of flex-row Views. Mirrors the
 * docx buildMultiColumnTable helper. `rowStyle` returns 'warning' for
 * rows the buyer should attend to (unclassified tier, P0 severity).
 */
export function StructuredPdfTable<T>(props: {
  columns: ReadonlyArray<StructuredPdfColumn<T>>;
  rows: ReadonlyArray<T>;
  rowStyle?: (row: T) => 'warning' | undefined;
  /** Rendered when `rows` is empty — explicit empty state, never invented. */
  emptyLabel?: string;
}): ReactElement {
  const { columns, rows, rowStyle, emptyLabel } = props;
  return (
    <View style={PDF_STYLES.table}>
      <View style={PDF_STYLES.tableHeaderRow}>
        {columns.map((c, i) => (
          <View key={i} style={{ ...PDF_STYLES.tableHeaderCell, flex: c.flex }}>
            <Text style={PDF_STYLES.tableHeaderText}>{c.header}</Text>
          </View>
        ))}
      </View>
      {rows.length === 0 ? (
        <View style={PDF_STYLES.tableRow}>
          <View style={{ ...PDF_STYLES.tableCell, flex: 1 }}>
            <Text style={{ ...PDF_STYLES.tableCellText, color: PDF_COLORS.MUTED, fontFamily: PDF_FONTS.BODY_ITALIC }}>
              {emptyLabel ?? 'No rows — this section is empty in the current artifact.'}
            </Text>
          </View>
        </View>
      ) : (
        rows.map((row, ri) => {
          const flag = rowStyle?.(row);
          return (
            <View
              key={ri}
              style={{
                ...PDF_STYLES.tableRow,
                ...(flag === 'warning' ? { backgroundColor: '#FBEFC4' } : {}),
              }}
              wrap={false}
            >
              {columns.map((col, ci) => (
                <View key={ci} style={{ ...PDF_STYLES.tableCell, flex: col.flex }}>
                  <Text
                    style={{
                      ...PDF_STYLES.tableCellText,
                      ...(flag === 'warning' ? { color: '#5B3F00' } : {}),
                    }}
                  >
                    {col.extract(row)}
                  </Text>
                </View>
              ))}
            </View>
          );
        })
      )}
    </View>
  );
}

/** A label/value row for a structured PDF key-value block. */
export interface StructuredPdfKeyValue {
  label: string;
  value: string;
}

/** Build a 2-column key/value block (computed-summary / sign-off slots). */
export function StructuredPdfKeyValueTable(props: {
  rows: ReadonlyArray<StructuredPdfKeyValue>;
  /** When true, value cells render an underline slot for offline fill. */
  editableValues?: boolean;
}): ReactElement {
  const { rows, editableValues } = props;
  return (
    <View style={PDF_STYLES.table}>
      {rows.map((row, i) => (
        <View key={i} style={PDF_STYLES.tableRow} wrap={false}>
          <View
            style={{
              ...PDF_STYLES.tableCell,
              flex: 1,
              backgroundColor: PDF_COLORS.SOFT,
            }}
          >
            <Text style={{ ...PDF_STYLES.tableCellText, fontFamily: PDF_FONTS.BODY_BOLD }}>
              {row.label}
            </Text>
          </View>
          <View style={{ ...PDF_STYLES.tableCell, flex: 1.6 }}>
            <Text style={PDF_STYLES.tableCellText}>
              {row.value || (editableValues ? ' '.repeat(40) : '')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Cover-page metadata line. */
export interface StructuredPdfCoverMeta {
  label: string;
  value: string;
}

/**
 * Build the standard structured-artifact PDF document: a cover page
 * (eyebrow + title + metadata + intro note) followed by one body page
 * holding the supplied section nodes. @react-pdf auto-paginates the
 * body. Mirrors the structured-docx section layout.
 */
export function buildStructuredPdfDocument(props: {
  documentTitle: string;
  author?: string;
  subject?: string;
  eyebrow: string;
  title: string;
  meta: ReadonlyArray<StructuredPdfCoverMeta>;
  /** Optional intro paragraph under the cover divider. */
  introNote?: string;
  /**
   * Optional governance/status notice (e.g. "AI-prepared draft...").
   * Generic text in — callers own the copy; this only owns the visual
   * treatment (same amber-bordered box as the narrative scaffold warning)
   * so every structured PDF shows its draft/final status the same way.
   */
  governanceNotice?: { message: string; detail?: string | null } | null;
  /** Confidentiality note printed at the foot of the cover. */
  confidentialityNote: string;
  /** Running header line on body pages. */
  headerLine: string;
  /** Body section nodes — typically headings + StructuredPdfTable views. */
  body: ReactNode;
}): ReactElement<DocumentProps> {
  const author = props.author ?? 'AbarVa · Sentinel';
  return (
    <Document
      title={props.documentTitle}
      author={author}
      subject={props.subject ?? props.documentTitle}
      creator={author}
      producer={author}
    >
      <Page size="LETTER" style={PDF_STYLES.page}>
        <Text style={PDF_STYLES.eyebrow}>{props.eyebrow}</Text>
        <Text style={PDF_STYLES.title}>{props.title}</Text>
        {props.meta.map((m, i) => (
          <Text key={i} style={PDF_STYLES.meta}>
            {m.label}: {m.value}
          </Text>
        ))}
        {props.governanceNotice ? (
          <View style={PDF_STYLES.scaffoldWarning}>
            <Text>
              {props.governanceNotice.detail
                ? `${props.governanceNotice.message} ${props.governanceNotice.detail}`
                : props.governanceNotice.message}
            </Text>
          </View>
        ) : null}
        {props.introNote ? (
          <>
            <View style={PDF_STYLES.divider} />
            <Text style={PDF_STYLES.body}>{props.introNote}</Text>
          </>
        ) : (
          <View style={PDF_STYLES.divider} />
        )}
        <Text
          style={{
            fontSize: 9,
            color: PDF_COLORS.MUTED,
            fontFamily: PDF_FONTS.BODY_ITALIC,
            marginTop: 8,
          }}
        >
          {props.confidentialityNote}
        </Text>
      </Page>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <View
          style={{
            marginBottom: 12,
            paddingBottom: 4,
            borderBottomColor: PDF_COLORS.RULE,
            borderBottomWidth: 0.5,
          }}
        >
          <Text style={{ fontSize: 8, color: PDF_COLORS.MUTED }}>
            {props.headerLine}
          </Text>
        </View>
        {props.body}
      </Page>
    </Document>
  );
}

/** Section heading inside a structured PDF body. */
export function StructuredPdfHeading(props: { children: string }): ReactElement {
  return <Text style={PDF_STYLES.h2}>{props.children}</Text>;
}

/** Muted descriptive note under a section heading. */
export function StructuredPdfNote(props: { children: string }): ReactElement {
  return (
    <Text
      style={{
        ...PDF_STYLES.body,
        fontSize: 9,
        color: PDF_COLORS.MUTED,
      }}
    >
      {props.children}
    </Text>
  );
}
