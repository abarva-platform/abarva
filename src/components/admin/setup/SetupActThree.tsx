/**
 * SetupActThree · SETUP-1.2
 *
 * Act 3 — "What changes when you upload one more thing."
 *
 * Each entry shows:
 *   • Headline of the capability gained
 *   • Today / After preview pair (Sentinel's voice changes when
 *     the data lands)
 *   • Programs that benefit
 *   • Click-through to the segment (deep link to be wired in
 *     SETUP-1.7)
 *
 * Per SETUP-1_DETAILED_DESIGN.md §6.4.
 */

import Link from 'next/link';

import type { CapabilityGainEntry } from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

import { SetupActHeader } from './SetupActOne';

export interface SetupActThreeProps {
  gains: CapabilityGainEntry[];
}

export function SetupActThree({ gains }: SetupActThreeProps) {
  const sorted = [...gains].sort((a, b) => a.rank - b.rank);
  return (
    <section
      data-testid="admin-setup-act-three"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <SetupActHeader
        eyebrow="Act 3"
        title="What changes when you upload one more thing"
        subtitle="Each row shows the capability gained from completing one segment, the program(s) it impacts, and how Sentinel's voice changes once the data lands. Ranked by program impact."
      />
      <ol
        data-testid="admin-setup-gain-list"
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {sorted.map((gain) => (
          <GainCard key={gain.id} gain={gain} />
        ))}
      </ol>
    </section>
  );
}

function GainCard({ gain }: { gain: CapabilityGainEntry }) {
  const segmentHref = `/admin/segments/${gain.targetSegmentId}`;
  return (
    <li
      data-testid={`admin-setup-gain-${gain.id}`}
      style={{
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}11`,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            lineHeight: 1.35,
          }}
        >
          {gain.capabilityGained}
        </p>
        <Link
          href={segmentHref}
          data-testid={`admin-setup-gain-cta-${gain.id}`}
          style={{
            color: COLORS.navy,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            border: `1px solid ${COLORS.navy}55`,
            borderRadius: RADIUS.pill,
            padding: `4px ${SPACING.md}`,
            whiteSpace: 'nowrap',
          }}
        >
          Open segment {gain.targetSegmentId} →
        </Link>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}99`,
        }}
      >
        Target: segment {gain.targetSegmentId} · {gain.targetSegmentName}
        {gain.impactedPrograms.length > 0
          ? ` · Impacts ${gain.impactedPrograms.join(', ')}`
          : ' · Portfolio-wide'}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: SPACING.sm,
          marginTop: SPACING.xs,
        }}
      >
        <Preview
          eyebrow="Today"
          tone="amber"
          quote={gain.todayPreview}
          testid={`admin-setup-gain-today-${gain.id}`}
        />
        <Preview
          eyebrow="After upload"
          tone="mint"
          quote={gain.afterPreview}
          testid={`admin-setup-gain-after-${gain.id}`}
        />
      </div>
    </li>
  );
}

function Preview({
  eyebrow,
  tone,
  quote,
  testid,
}: {
  eyebrow: string;
  tone: 'amber' | 'mint';
  quote: string;
  testid: string;
}) {
  const palette =
    tone === 'amber'
      ? {
          background: COLORS.amberSoft,
          border: `${COLORS.amberInk}33`,
          text: COLORS.amberInk,
        }
      : {
          background: COLORS.mintSoft,
          border: `${COLORS.mintInk}33`,
          text: COLORS.mintInk,
        };
  return (
    <div
      data-testid={testid}
      style={{
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: palette.text,
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 14,
          lineHeight: 1.45,
          color: COLORS.ink,
        }}
      >
        {quote}
      </p>
    </div>
  );
}
