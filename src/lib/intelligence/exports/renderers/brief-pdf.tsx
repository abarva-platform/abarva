// Intelligence · CXO brief · PDF renderer
//
// CFO-readable one-pager. The cover page is a scannable key-figures
// table + executive synthesis; subsequent pages auto-paginate the
// markdown-walked body. Mirrors the Source narrative-pdf pattern —
// plain inline elements only (no `fixed` headers / page-counter
// accumulators) to avoid pdfkit's float-overflow on long bodies.
//
// Pure: payload → ReactElement. The route serializes via
// @react-pdf/renderer's pdf().toBuffer().

import 'server-only';

import { Document, Page, Text, View, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

import { markdownToPdfNodes } from '@/lib/exports-shared/markdown-to-pdf';
import { PDF_COLORS, PDF_STYLES } from '@/lib/exports-shared/pdf-base';
import type { IntelligenceBriefPayload } from '../brief-payload';

/**
 * Build the React element representing the Intelligence brief PDF.
 *
 * `degraded`: when true, render only the one-pager cover and skip the
 * markdown body — the route's fallback when @react-pdf throws on a
 * structurally-complex body.
 */
export function buildIntelligenceBriefPdf(
  payload: IntelligenceBriefPayload,
  options: { degraded?: boolean } = {},
): ReactElement<DocumentProps> {
  const degraded = options.degraded ?? false;
  const bodyNodes = degraded ? [] : markdownToPdfNodes(payload.body || '');
  const headerLine = `${payload.tenantName}   ·   Intelligence Brief`;

  return (
    <Document
      title={`Intelligence Brief · ${payload.tenantName}`}
      author="AbarVa · Sentinel"
      subject={`CXO Intelligence brief for ${payload.tenantName}.`}
      creator="AbarVa · Sentinel"
      producer="AbarVa · Sentinel"
    >
      {/* CFO one-pager cover */}
      <Page size="LETTER" style={PDF_STYLES.page}>
        <Text style={PDF_STYLES.eyebrow}>
          Intelligence · CXO Brief · {payload.tenantName}
        </Text>
        <Text style={PDF_STYLES.title}>
          Intelligence Brief — {payload.tenantName}
        </Text>
        <Text style={PDF_STYLES.meta}>Generated: {payload.generatedAt}</Text>

        {!payload.hasCorpus ? (
          <View style={PDF_STYLES.scaffoldWarning}>
            <Text>
              Corpus not yet seeded — this tenant has no Intelligence corpus
              loaded. Corpus-derived sections are honestly omitted; the key
              figures and portfolio below reflect real AI initiative records.
            </Text>
          </View>
        ) : null}

        <View style={PDF_STYLES.divider} />

        {/* Key figures — the scannable CFO summary */}
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'Helvetica-Bold',
            color: PDF_COLORS.MUTED,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
            marginTop: 4,
          }}
        >
          Key figures
        </Text>
        {payload.onePager.map((line) => (
          <View
            key={line.label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 3,
              borderBottomColor: PDF_COLORS.RULE,
              borderBottomWidth: 0.5,
            }}
          >
            <Text style={{ fontSize: 10, color: PDF_COLORS.MUTED }}>
              {line.label}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Helvetica-Bold',
                color: PDF_COLORS.HEADER,
              }}
            >
              {line.value}
            </Text>
          </View>
        ))}

        <Text
          style={{
            fontSize: 9,
            fontFamily: 'Helvetica-Bold',
            color: PDF_COLORS.MUTED,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
            marginTop: 14,
          }}
        >
          Executive synthesis
        </Text>
        <Text style={PDF_STYLES.body}>{payload.synthesis}</Text>

        <View style={PDF_STYLES.divider} />
        <Text
          style={{
            fontSize: 9,
            color: PDF_COLORS.MUTED,
            fontStyle: 'italic',
            marginTop: 8,
          }}
        >
          Confidential — executive review · AbarVa Intelligence surface
        </Text>
      </Page>

      {/* Body page(s) — degraded mode skips this entirely. */}
      {degraded ? (
        <Page size="LETTER" style={PDF_STYLES.page}>
          <Text style={PDF_STYLES.eyebrow}>Body content notice</Text>
          <Text style={PDF_STYLES.body}>
            The full Intelligence brief body could not be rendered in PDF
            format. For the complete narrative, please use the DOCX export —
            it renders the full body faithfully.
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
