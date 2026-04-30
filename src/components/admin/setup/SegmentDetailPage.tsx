/**
 * SegmentDetailPage · SETUP-1.7
 *
 * The "open one segment" surface. Lands when a tenant admin
 * clicks an Act 1 fact card or an Act 3 "Open segment" CTA from
 * /admin. Renders:
 *   • Header with segment name + family number + breadcrumb
 *     back to /admin
 *   • Live rollup ribbon (record count, coverage, stale, missing,
 *     health state, last-ingested relative)
 *   • Record table — title, kind, source doc, freshness,
 *     classification, confidence, uploaded-by/at
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.6.
 */

import Link from 'next/link';

import type {
  InventorySegmentRollup,
  SegmentReference,
} from '@/lib/admin/setup-acts-registry';
import type { SegmentRecordSummary } from '@/lib/admin/setup-data-broker';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';

export interface SegmentDetailPageProps {
  reference: SegmentReference;
  rollup: InventorySegmentRollup | null;
  records: SegmentRecordSummary[];
  lastIngestedRelative?: string;
}

export function SegmentDetailPage({
  reference,
  rollup,
  records,
  lastIngestedRelative,
}: SegmentDetailPageProps) {
  return (
    <EditorialCanvas
      eyebrow={`Segment ${reference.numericId} of 14`}
      title={reference.displayName}
      subtitle={`The full record set for this segment of the data substrate. Sentinel grounds tenant-scoped reasoning here. ${rollup ? `Health state today: ${rollup.healthState}.` : 'Not loaded yet.'}`}
    >
      <div
        data-testid="admin-segment-detail"
        data-segment-id={reference.numericId}
        data-segment-key={reference.segmentKey}
        style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}
      >
        <Link
          href="/admin"
          data-testid="admin-segment-breadcrumb"
          style={{
            color: COLORS.navy,
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            alignSelf: 'flex-start',
            borderBottom: `1px dotted ${COLORS.navy}66`,
          }}
        >
          ← Back to setup landing
        </Link>

        {rollup ? (
          <RollupRibbon rollup={rollup} lastIngestedRelative={lastIngestedRelative} />
        ) : (
          <NotLoadedNotice reference={reference} />
        )}

        <RecordTable records={records} reference={reference} />
      </div>
    </EditorialCanvas>
  );
}

function RollupRibbon({
  rollup,
  lastIngestedRelative,
}: {
  rollup: InventorySegmentRollup;
  lastIngestedRelative?: string;
}) {
  return (
    <section
      data-testid="admin-segment-rollup"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
      role="list"
      aria-label="Segment rollup metrics"
    >
      <Stat
        label="Records loaded"
        value={rollup.recordCount.toLocaleString()}
        testid="admin-segment-stat-records"
      />
      <Stat
        label="Coverage"
        value={`${Number(rollup.coverageScore).toFixed(0)}%`}
        testid="admin-segment-stat-coverage"
      />
      <Stat
        label="Stale"
        value={rollup.staleCount.toLocaleString()}
        testid="admin-segment-stat-stale"
      />
      <Stat
        label="Missing"
        value={rollup.missingCount.toLocaleString()}
        testid="admin-segment-stat-missing"
      />
      <Stat
        label="Health"
        value={rollup.healthState}
        testid="admin-segment-stat-health"
        valueStyle={{ textTransform: 'uppercase', fontSize: 16 }}
      />
      {lastIngestedRelative ? (
        <Stat
          label="Last ingested"
          value={lastIngestedRelative}
          testid="admin-segment-stat-last-ingested"
          valueStyle={{ fontSize: 16 }}
        />
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  testid,
  valueStyle,
}: {
  label: string;
  value: string;
  testid: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div
      role="listitem"
      style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}
      data-testid={testid}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 24,
          lineHeight: 1,
          color: SHELL.INK,
          fontWeight: 600,
          ...valueStyle,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function NotLoadedNotice({ reference }: { reference: SegmentReference }) {
  return (
    <section
      data-testid="admin-segment-not-loaded"
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: COLORS.amberInk,
          lineHeight: 1.5,
        }}
      >
        <strong>Segment {reference.numericId} · {reference.displayName}</strong>{' '}
        is not yet loaded for this tenant. Once data lands here, Sentinel can
        reason about it directly. The segment is required for{' '}
        {reference.familyNumber === 14
          ? 'cross-program contradiction detection'
          : reference.familyNumber === 9
            ? 'evidence citations'
            : 'the corpus reasoning that depends on this family'}{' '}
        — uploading is the next move.
      </p>
    </section>
  );
}

function RecordTable({
  records,
  reference,
}: {
  records: SegmentRecordSummary[];
  reference: SegmentReference;
}) {
  if (records.length === 0) {
    return (
      <section
        data-testid="admin-segment-empty"
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px dashed ${SHELL.CARD_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SERIF,
            fontSize: 18,
            color: SHELL.INK,
            lineHeight: 1.4,
          }}
        >
          No records loaded for{' '}
          <span style={{ fontFamily: SHELL.MONO, fontSize: 14 }}>
            {reference.segmentKey}
          </span>{' '}
          yet.
        </p>
        <p
          style={{
            margin: `${SPACING.sm} 0 0`,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
          }}
        >
          Upload to this segment to start grounding the corpus.
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="admin-segment-records"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        overflowX: 'auto',
      }}
    >
      <h3
        style={{
          margin: `0 0 ${SPACING.md} 0`,
          fontFamily: SHELL.SANS,
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        {records.length.toLocaleString()} record{records.length === 1 ? '' : 's'}
      </h3>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
        }}
      >
        <thead>
          <tr style={{ borderBottom: `1px solid ${SHELL.CARD_LINE}` }}>
            <Th>Title</Th>
            <Th>Kind</Th>
            <Th>Source</Th>
            <Th>Classification</Th>
            <Th>Freshness</Th>
            <Th>Confidence</Th>
            <Th>Last Reviewed</Th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <RecordRow key={record.recordId} record={record} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      style={{
        padding: `${SPACING.xs} ${SPACING.sm}`,
        textAlign: 'left',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: SHELL.INK_MUTED,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function RecordRow({ record }: { record: SegmentRecordSummary }) {
  return (
    <tr
      data-testid={`admin-segment-record-${record.recordId}`}
      style={{ borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}` }}
    >
      <td style={{ padding: `${SPACING.sm}`, maxWidth: 320 }}>
        <p style={{ margin: 0, color: SHELL.INK, fontWeight: 500, lineHeight: 1.4 }}>
          {record.title}
        </p>
        <p
          style={{
            margin: `2px 0 0`,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
          }}
        >
          {record.recordId}
        </p>
      </td>
      <td style={{ padding: `${SPACING.sm}`, fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
        {record.recordKind}
      </td>
      <td style={{ padding: `${SPACING.sm}`, fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED, maxWidth: 220 }}>
        {record.sourceDoc}
      </td>
      <td style={{ padding: `${SPACING.sm}` }}>
        <ClassificationPill classification={record.dataClassification} />
      </td>
      <td style={{ padding: `${SPACING.sm}` }}>
        <FreshnessPill state={record.freshnessState} />
      </td>
      <td style={{ padding: `${SPACING.sm}`, fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED }}>
        {record.confidence === null
          ? '—'
          : `${(record.confidence * 100).toFixed(0)}%`}
      </td>
      <td style={{ padding: `${SPACING.sm}`, fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_MUTED, whiteSpace: 'nowrap' }}>
        {record.lastReviewed ?? '—'}
      </td>
    </tr>
  );
}

function ClassificationPill({ classification }: { classification: string }) {
  const tone = classificationTone(classification);
  return (
    <span
      data-testid={`admin-classification-${classification.toLowerCase()}`}
      style={{
        display: 'inline-block',
        padding: `2px ${SPACING.sm}`,
        background: tone.background,
        color: tone.text,
        borderRadius: RADIUS.pill,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {classification}
    </span>
  );
}

function FreshnessPill({ state }: { state: string }) {
  const tone = freshnessTone(state);
  return (
    <span
      data-testid={`admin-freshness-${state}`}
      style={{
        display: 'inline-block',
        padding: `2px ${SPACING.sm}`,
        background: tone.background,
        color: tone.text,
        borderRadius: RADIUS.pill,
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {state}
    </span>
  );
}

function classificationTone(c: string): { background: string; text: string } {
  switch (c.toLowerCase()) {
    case 'public':
      return { background: COLORS.skyPale, text: COLORS.navy };
    case 'internal':
      return { background: SHELL.GRAY_BG, text: SHELL.INK_SOFT };
    case 'confidential':
      return { background: COLORS.amberSoft, text: COLORS.amberInk };
    case 'restricted':
      return { background: COLORS.coralSoft, text: COLORS.coralInk };
    default:
      return { background: SHELL.GRAY_BG, text: SHELL.INK_SOFT };
  }
}

function freshnessTone(state: string): { background: string; text: string } {
  switch (state) {
    case 'fresh':
      return { background: COLORS.mintSoft, text: COLORS.mintInk };
    case 'attention':
      return { background: COLORS.amberSoft, text: COLORS.amberInk };
    case 'stale':
      return { background: COLORS.coralSoft, text: COLORS.coralInk };
    default:
      return { background: SHELL.GRAY_BG, text: SHELL.INK_SOFT };
  }
}
