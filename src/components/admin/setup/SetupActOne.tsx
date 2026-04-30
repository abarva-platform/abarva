/**
 * SetupActOne · SETUP-1.2
 *
 * Act 1 — "What we know about your enterprise today."
 *
 * Two layers:
 *   • Facts grid (top): authored Sentinel-voice statements that
 *     cite the 14 segments by id + last-reviewed days.
 *   • Segments rollup (bottom): live read of
 *     `data_inventory_segments` showing per-family record count,
 *     coverage, and freshness.
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.2.
 */

import type {
  ActOneFact,
  InventorySegmentRollup,
} from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface SetupActOneProps {
  facts: ActOneFact[];
  segmentRollups: InventorySegmentRollup[];
}

export function SetupActOne({ facts, segmentRollups }: SetupActOneProps) {
  return (
    <section
      data-testid="admin-setup-act-one"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <ActHeader
        eyebrow="Act 1"
        title="What we know about you today"
        subtitle="Each fact below cites the segment it was loaded from. The richer the segment, the sharper Sentinel can reason about that program area."
      />

      {facts.length === 0 ? (
        <EmptyState
          message="No tenant data loaded yet. Upload to a segment to give the platform something to reason about."
        />
      ) : (
        <ul
          role="list"
          data-testid="admin-setup-act-one-facts"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: SPACING.md,
          }}
        >
          {facts.map((fact) => (
            <FactCard key={`${fact.factType}-${fact.sourceSegmentId}`} fact={fact} />
          ))}
        </ul>
      )}

      {segmentRollups.length > 0 ? (
        <div
          data-testid="admin-setup-act-one-rollups"
          style={{
            marginTop: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: SHELL.SANS,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.navy,
              fontWeight: 700,
            }}
          >
            All 14 segments — live rollup
          </h3>
          <ul
            role="list"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: SPACING.sm,
            }}
          >
            {segmentRollups.map((seg) => (
              <SegmentRollupCard key={seg.segmentId} segment={seg} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function FactCard({ fact }: { fact: ActOneFact }) {
  return (
    <li
      role="listitem"
      data-testid={`admin-setup-fact-${fact.factType}`}
      style={{
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: '0.1em',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        {fact.label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 14,
          lineHeight: 1.5,
          color: SHELL.INK,
        }}
      >
        {fact.value}
      </p>
      <p
        style={{
          margin: `${SPACING.xs} 0 0`,
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
        }}
      >
        Source: segment {fact.sourceSegmentId} · {fact.sourceSegmentName} ·{' '}
        {fact.lastReviewedDays === null
          ? 'never reviewed'
          : `reviewed ${fact.lastReviewedDays}d ago`}
      </p>
    </li>
  );
}

function SegmentRollupCard({ segment }: { segment: InventorySegmentRollup }) {
  const tone = healthTone(segment.healthState);
  return (
    <li
      role="listitem"
      data-testid={`admin-setup-segment-${segment.segmentId}`}
      style={{
        background: tone.background,
        border: `1px solid ${tone.border}`,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          {String(segment.familyNumber).padStart(2, '0')} ·{' '}
          {segment.segmentName}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: tone.text,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {segment.healthState}
        </p>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.MONO,
          fontSize: 11,
          color: SHELL.INK_SOFT,
        }}
      >
        {segment.recordCount.toLocaleString()} record
        {segment.recordCount === 1 ? '' : 's'} ·{' '}
        {Number(segment.coverageScore).toFixed(0)}% coverage
        {segment.staleCount > 0 ? ` · ${segment.staleCount} stale` : ''}
        {segment.missingCount > 0 ? ` · ${segment.missingCount} missing` : ''}
      </p>
    </li>
  );
}

interface HealthTone {
  background: string;
  border: string;
  text: string;
}

function healthTone(healthState: string): HealthTone {
  switch (healthState) {
    case 'complete':
      return {
        background: COLORS.mintSoft,
        border: `${COLORS.mintInk}33`,
        text: COLORS.mintInk,
      };
    case 'partial':
      return {
        background: COLORS.amberSoft,
        border: `${COLORS.amberInk}33`,
        text: COLORS.amberInk,
      };
    case 'sparse':
    case 'attention':
      return {
        background: COLORS.amberSoft,
        border: `${COLORS.amberInk}55`,
        text: COLORS.amberInk,
      };
    case 'critical':
      return {
        background: COLORS.coralSoft,
        border: `${COLORS.coralInk}55`,
        text: COLORS.coralInk,
      };
    default:
      return {
        background: SHELL.GRAY_BG,
        border: SHELL.CARD_LINE_SOFT,
        text: SHELL.INK_MUTED,
      };
  }
}

function ActHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: COLORS.navy,
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          margin: 0,
          fontFamily: SHELL.SERIF,
          fontSize: 28,
          color: SHELL.INK,
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.INK_SOFT,
          lineHeight: 1.5,
          maxWidth: '720px',
        }}
      >
        {subtitle}
      </p>
    </header>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p
      data-testid="admin-setup-empty"
      style={{
        margin: 0,
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.INK_SOFT,
        fontStyle: 'italic',
      }}
    >
      {message}
    </p>
  );
}

export { ActHeader as SetupActHeader };
