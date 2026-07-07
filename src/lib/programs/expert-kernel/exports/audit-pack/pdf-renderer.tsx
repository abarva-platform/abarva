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
import type { MoveBusinessCaseInput } from '../../../move-business-case';
import {
  buildMoveAuditPack,
  type AuditPackSection,
  type MoveAuditPackResult,
} from './audit-pack-model';

function statusLabel(status: AuditPackSection['status']): string {
  return status === 'supported'
    ? 'Supported'
    : status === 'blocked'
      ? 'Blocked'
      : 'Gap';
}

function Section({ section }: { section: AuditPackSection }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={PDF_STYLES.h2}>
        {section.ordinal}. {section.title} - {statusLabel(section.status)}
      </Text>
      <Text style={PDF_STYLES.body}>{section.summary}</Text>
      {section.items.slice(0, 8).map((item) => (
        <Text key={`${section.id}-${item.label}`} style={PDF_STYLES.body}>
          {item.label}: {item.value}
        </Text>
      ))}
      {section.gaps.length > 0 ? (
        <Text style={{ ...PDF_STYLES.body, color: PDF_COLORS.WARNING }}>
          Gaps: {section.gaps.slice(0, 3).join(' | ')}
        </Text>
      ) : (
        <Text style={PDF_STYLES.body}>Gaps: none recorded for this section.</Text>
      )}
    </View>
  );
}

export function buildAuditPackPdfElement(
  pack: MoveAuditPackResult,
): ReactElement<DocumentProps> {
  const verdict = pack.bound ? pack.verdict.toUpperCase() : 'NOT RUN';
  return (
    <Document title={`${pack.moveLabel} - Per-Move Audit Pack`}>
      <Page size="LETTER" style={PDF_STYLES.page}>
        <Text style={PDF_STYLES.eyebrow}>AbarVa - Moves - Audit Pack</Text>
        <Text style={PDF_STYLES.title}>{pack.moveLabel}</Text>
        <Text style={PDF_STYLES.meta}>Client: {pack.tenantLabel}</Text>
        <Text style={PDF_STYLES.meta}>Generated: {pack.generatedOn}</Text>
        <Text style={PDF_STYLES.meta}>Verdict: {verdict}</Text>
        <Text style={PDF_STYLES.meta}>
          Evidence links: {pack.evidenceCount} | Open gaps: {pack.gapCount}
        </Text>
        <View style={PDF_STYLES.divider} />
        {pack.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
        <View style={PDF_STYLES.divider} />
        <Text style={PDF_STYLES.body}>{pack.disclaimer}</Text>
      </Page>
    </Document>
  );
}

export function buildMoveAuditPackPdfElement(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): ReactElement<DocumentProps> {
  return buildAuditPackPdfElement(buildMoveAuditPack(move, generatedOn));
}
