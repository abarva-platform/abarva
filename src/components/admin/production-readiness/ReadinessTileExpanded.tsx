// ADMIN16 — Per-tile expanded detail panel.
//
// Server component. When ?expand=<demo|pilot|production> is present, the
// tile renders blockers + criteria + "what unblocks the next tier" guidance
// inline beneath the tile grid. No client state.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  GateCriterion,
  ReadinessTileExpanded,
} from '@/lib/admin/production-readiness-page-view';
import type { BlockerDetail } from '@/lib/admin/blocker-detail-view';

export interface ReadinessTileExpandedProps {
  detail: ReadinessTileExpanded;
  baseUrl: string;
  closeHref: string;
}

const STATUS_PALETTE: Record<GateCriterion['status'], { fg: string; bg: string; label: string }> = {
  pass: { fg: COLORS.mintInk, bg: COLORS.mintSoft, label: 'Pass' },
  partial: { fg: COLORS.amberInk, bg: COLORS.amberSoft, label: 'Partial' },
  fail: { fg: COLORS.coralInk, bg: COLORS.coralSoft, label: 'Fail' },
};

const SEVERITY_COLOR: Record<BlockerDetail['severity'], string> = {
  critical: COLORS.coralInk,
  high: COLORS.amberInk,
  medium: COLORS.amberInk,
  low: `${COLORS.ink}80`,
};

export function ReadinessTileExpanded({
  detail,
  baseUrl,
  closeHref,
}: ReadinessTileExpandedProps) {
  return (
    <section
      data-readiness-tile-expanded="true"
      data-tile-id={detail.tileId}
      aria-label={`Expanded detail for ${detail.tileId} tier`}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}15`,
        padding: SPACING.xl,
        marginTop: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: `${COLORS.ink}99`,
              marginBottom: SPACING.xs,
            }}
          >
            Tier detail · deterministic seed
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
              textTransform: 'capitalize',
            }}
          >
            {detail.tileId}
          </h3>
        </div>
        <Link
          href={closeHref}
          data-readiness-tile-close="true"
          aria-label="Close tier detail"
          style={{
            padding: `${SPACING.xs} ${SPACING.md}`,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.ink}20`,
            background: COLORS.cream,
            color: COLORS.ink,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Close
        </Link>
      </header>

      <section style={{ marginBottom: SPACING.lg }}>
        <h4
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}99`,
            margin: 0,
            marginBottom: SPACING.sm,
          }}
        >
          Gate criteria
        </h4>
        <ul
          data-tile-criteria="true"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
          }}
        >
          {detail.criteria.map((c) => {
            const palette = STATUS_PALETTE[c.status];
            return (
              <li
                key={c.id}
                data-criterion-id={c.id}
                data-criterion-status={c.status}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 220px',
                  gap: SPACING.md,
                  alignItems: 'start',
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.ink,
                }}
              >
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: RADIUS.pill,
                    background: palette.bg,
                    color: palette.fg,
                    fontSize: 11,
                    fontWeight: 600,
                    alignSelf: 'start',
                    width: 'fit-content',
                  }}
                >
                  {palette.label}
                </span>
                <span style={{ fontWeight: 600 }}>{c.label}</span>
                <span style={{ color: `${COLORS.ink}99`, fontSize: 12 }}>
                  {c.evidenceBasis}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section style={{ marginBottom: SPACING.lg }}>
        <h4
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}99`,
            margin: 0,
            marginBottom: SPACING.sm,
          }}
        >
          Blockers ({detail.blockers.length})
        </h4>
        {detail.blockers.length === 0 ? (
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}aa`,
              margin: 0,
            }}
          >
            No blockers for this tier.
          </p>
        ) : (
          <ul
            data-tile-blockers="true"
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
            }}
          >
            {detail.blockers.map((b) => (
              <li
                key={b.id}
                data-blocker-id={b.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr',
                  gap: SPACING.md,
                  alignItems: 'baseline',
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: COLORS.ink,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: SEVERITY_COLOR[b.severity] ?? COLORS.ink,
                  }}
                >
                  {b.severity}
                </span>
                <Link
                  href={`${baseUrl}?tab=blockers&blocker=${b.id}`}
                  data-blocker-link={b.id}
                  style={{
                    color: COLORS.navy,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        data-tile-unblocks-next="true"
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          background: COLORS.cream,
          border: `1px solid ${COLORS.ink}10`,
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: `${COLORS.ink}99`,
            marginBottom: SPACING.xs,
          }}
        >
          What unblocks the next tier
        </div>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.ink,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {detail.unblocksNextTier}
        </p>
      </section>
    </section>
  );
}
