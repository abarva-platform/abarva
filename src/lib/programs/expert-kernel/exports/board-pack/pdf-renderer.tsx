import 'server-only';

import {
  Document,
  Page,
  Text,
  View,
  type DocumentProps,
} from '@react-pdf/renderer';
import type { ReactElement } from 'react';

import { PDF_COLORS, PDF_STYLES } from '@/lib/exports-shared/pdf-base';
import {
  AI_DECISION_SUPPORT_WATERMARK,
  HUMAN_DECISION_ATTESTATION_TEXT,
} from '@/lib/ai-liability/human-decision-controls';
import {
  buildQuarterlyBoardPack,
  type QuarterlyBoardPack,
  type QuarterlyBoardPackInput,
  type QuarterlyBoardPackSection,
} from './quarterly-board-pack-model';

function Section({ section }: { section: QuarterlyBoardPackSection }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={PDF_STYLES.h2}>
        {section.ordinal}. {section.title}
      </Text>
      <Text style={PDF_STYLES.body}>{section.summary}</Text>
      {section.rows.length === 0 ? (
        <Text style={{ ...PDF_STYLES.body, color: PDF_COLORS.MUTED }}>
          No rows are currently surfaced for this section.
        </Text>
      ) : (
        section.rows.slice(0, 8).map((row) => (
          <View key={`${section.id}-${row.label}`} style={{ marginBottom: 5 }}>
            <Text style={PDF_STYLES.body}>
              {row.label}: {row.value}
            </Text>
            {row.detail ? (
              <Text style={{ ...PDF_STYLES.body, color: PDF_COLORS.MUTED }}>
                {row.detail}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

export function buildBoardPackPdfElement(
  pack: QuarterlyBoardPack,
): ReactElement<DocumentProps> {
  return (
    <Document title={`${pack.title} - Quarterly Board Pack`}>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <Text style={PDF_STYLES.eyebrow}>AbarVa - Tower - Quarterly Board Pack</Text>
        <Text style={PDF_STYLES.title}>{pack.title}</Text>
        <Text style={PDF_STYLES.meta}>Client: {pack.clientLabel}</Text>
        <Text style={PDF_STYLES.meta}>Quarter: {pack.quarter}</Text>
        <Text style={PDF_STYLES.meta}>Generated: {pack.generatedOn}</Text>
        <Text style={PDF_STYLES.meta}>
          Evidence gaps: {pack.evidenceGapCount}
        </Text>
        <View style={PDF_STYLES.divider} />
        {pack.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
        <View style={PDF_STYLES.divider} />
        <Text style={PDF_STYLES.body}>{pack.disclaimer}</Text>
        <Text style={{ ...PDF_STYLES.body, color: PDF_COLORS.MUTED }}>
          {AI_DECISION_SUPPORT_WATERMARK} {HUMAN_DECISION_ATTESTATION_TEXT}
        </Text>
      </Page>
    </Document>
  );
}

export function buildQuarterlyBoardPackPdfElement(
  input: QuarterlyBoardPackInput,
): ReactElement<DocumentProps> {
  return buildBoardPackPdfElement(buildQuarterlyBoardPack(input));
}
