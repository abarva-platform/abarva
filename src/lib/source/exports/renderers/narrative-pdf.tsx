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

/** Build the React element representing the PDF. */
export function buildNarrativePdf(
  payload: NarrativePdfPayload,
  config: NarrativePdfConfig,
): ReactElement<DocumentProps> {
  const bodyNodes = markdownToPdfNodes(payload.body || '');
  const headerLine = `${payload.tenantName}   ·   ${payload.eventCode}   ·   ${config.headerLabel}`;
  return (
    <Document
      title={`${config.documentTitle} · ${payload.eventCode}`}
      author="AbarVa · Sentinel"
      subject={`${config.headerLabel} for sourcing event ${payload.eventCode}.`}
      creator="AbarVa · Sentinel"
      producer="AbarVa · Sentinel"
    >
      {/* Cover page */}
      <Page size="LETTER" style={PDF_STYLES.page}>
        <Text style={PDF_STYLES.eyebrow} fixed>
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
        {/* Footer */}
        <View style={PDF_STYLES.pageFooter} fixed>
          <Text>{config.confidentialityNote}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
      {/* Body page(s) — auto-paginates */}
      <Page size="LETTER" style={PDF_STYLES.page}>
        {/* Page header (top of every body page) */}
        <View style={PDF_STYLES.pageHeader} fixed>
          <Text>{headerLine}</Text>
          <Text>Generated {payload.generatedAt.slice(0, 10)}</Text>
        </View>
        {/* Body content — content area sits below the page header */}
        <View style={{ marginTop: 12 }}>{bodyNodes}</View>
        {/* Footer (bottom of every body page) */}
        <View style={PDF_STYLES.pageFooter} fixed>
          <Text style={{ color: PDF_COLORS.MUTED }}>
            {config.confidentialityNote}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
