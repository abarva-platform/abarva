// Source · narrative pdf renderer
//
// PDF companion to narrative-docx.ts and narrative-html.ts. Same per-
// artifact configs (re-exported from narrative-docx for the third
// time — same shape applies). The PDF document is structured:
//
//   <Document>
//     <Page>                      ← Cover page
//       <Text> eyebrow </Text>
//       <Text> event title </Text>
//       <Text> event metadata </Text>
//       (scaffold warning if applicable)
//     </Page>
//     <Page>                      ← Body page(s) — auto-paginates
//       (markdown-walked content)
//     </Page>
//   </Document>
//
// Returns a React element that the route serializes via @react-pdf's
// pdf().toBuffer(). Pure: payload + config → ReactElement.

import 'server-only';

import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

import {
  DECISION_BRIEF_DOCX_CONFIG,
  RFP_PACK_DOCX_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG,
  type NarrativeDocxConfig,
  type NarrativeDocxPayload,
} from './narrative-docx';
import { markdownToPdfNodes } from './markdown-to-pdf';
import { PDF_COLORS, PDF_STYLES } from './pdf-base';

export type NarrativePdfConfig = NarrativeDocxConfig;
export type NarrativePdfPayload = NarrativeDocxPayload;

export {
  DECISION_BRIEF_DOCX_CONFIG as DECISION_BRIEF_PDF_CONFIG,
  RFP_PACK_DOCX_CONFIG as RFP_PACK_PDF_CONFIG,
  SCOPE_MEMO_DOCX_CONFIG as SCOPE_MEMO_PDF_CONFIG,
  SELECTION_MEMO_DOCX_CONFIG as SELECTION_MEMO_PDF_CONFIG,
};

/**
 * Build the React element representing the PDF.
 *
 * `degraded`: when true, skip the markdown body and render only the
 * cover page + a "body too complex for PDF" notice. The route uses
 * this as a fallback when @react-pdf's layout engine throws on the
 * full body — so the buyer still gets a usable cover-only PDF rather
 * than a 500.
 */
export function buildNarrativePdf(
  payload: NarrativePdfPayload,
  config: NarrativePdfConfig,
  options: { degraded?: boolean } = {},
): ReactElement<DocumentProps> {
  const degraded = options.degraded ?? false;
  const bodyNodes = degraded ? [] : markdownToPdfNodes(payload.body || '');
  const headerLine = `${payload.tenantName}   ·   ${payload.eventCode}   ·   ${config.headerLabel}`;
  return (
    <Document
      title={`${config.documentTitle} · ${payload.eventCode}`}
      author="AbarVa · Sentinel"
      subject={`${config.headerLabel} for sourcing event ${payload.eventCode}.`}
      creator="AbarVa · Sentinel"
      producer="AbarVa · Sentinel"
    >
      {/* Cover page — kept simple. Earlier slices used `fixed`
          headers + footers with a `render` page-counter, but that
          accumulator math is what triggers pdfkit's float overflow
          on long bodies. We use plain inline elements here. */}
      <Page size="LETTER" style={PDF_STYLES.page}>
        <Text style={PDF_STYLES.eyebrow}>
          {config.eyebrowFor(payload.tenantName)}
        </Text>
        <Text style={PDF_STYLES.title}>{payload.eventName}</Text>
        <Text style={PDF_STYLES.meta}>Tenant: {payload.tenantName}</Text>
        <Text style={PDF_STYLES.meta}>Event code: {payload.eventCode}</Text>
        {payload.issuedBy ? (
          <Text style={PDF_STYLES.meta}>Issued by: {payload.issuedBy}</Text>
        ) : null}
        <Text style={PDF_STYLES.meta}>Generated: {payload.generatedAt}</Text>
        {!payload.bodyIsAuthored ? (
          <View style={PDF_STYLES.scaffoldWarning}>
            <Text>
              Template scaffold — body has not been authored yet. The content
              below is the canonical {config.headerLabel} scaffold; replace
              with the actual authored content before circulating.
            </Text>
          </View>
        ) : null}
        <View style={PDF_STYLES.divider} />
        <Text
          style={{
            fontSize: 9,
            color: PDF_COLORS.MUTED,
            fontStyle: 'italic',
            marginTop: 8,
          }}
        >
          {config.confidentialityNote}
        </Text>
      </Page>
      {/* Body page — degraded mode skips this entirely. Otherwise it
          auto-paginates via @react-pdf's default wrap behavior.
          Note: we removed the `fixed` page header / footer that earlier
          slices used. They were prone to triggering pdfkit's float
          overflow on long bodies (the `render` prop in the footer's
          page counter recurses on cumulative position). The cover
          page footer is enough — the body just has a header bar
          (non-fixed) at the top of the first body page. */}
      {degraded ? (
        <Page size="LETTER" style={PDF_STYLES.page}>
          <Text style={PDF_STYLES.eyebrow}>Body content notice</Text>
          <Text style={PDF_STYLES.body}>
            The full {config.headerLabel} body could not be rendered in
            PDF format. This is a known limitation when the body is
            structurally complex (deeply nested lists, many tables, or
            cross-referenced sections).
          </Text>
          <Text style={PDF_STYLES.body}>
            For the complete content, please use the docx or HTML
            export — both render the full body faithfully. The HTML
            version is also print-friendly via your browser&apos;s
            Print → Save as PDF.
          </Text>
        </Page>
      ) : (
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
              {headerLine}
            </Text>
          </View>
          {bodyNodes}
        </Page>
      )}
    </Document>
  );
}
