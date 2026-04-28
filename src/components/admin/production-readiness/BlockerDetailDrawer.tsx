// ADMIN16 — Blocker detail drawer.
//
// Server component. Renders inline (not a fixed overlay) when ?blocker=<id>
// is present. Uses W32F BlockerDetail data shape via the page-view's
// blockerDetailMap. Mark resolved button is HARD-GATED with reason.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { BlockerDetail } from '@/lib/admin/blocker-detail-view';

export interface BlockerDetailDrawerProps {
  blocker: BlockerDetail;
  baseUrl: string;
  /** Tab to return to when closing the drawer. */
  returnTab: string;
}

const SEVERITY_PALETTE: Record<BlockerDetail['severity'], { fg: string; bg: string }> = {
  critical: { fg: COLORS.coralInk, bg: COLORS.coralSoft },
  high: { fg: COLORS.amberInk, bg: COLORS.amberSoft },
  medium: { fg: COLORS.amberInk, bg: COLORS.amberSoft },
  low: { fg: `${COLORS.ink}80`, bg: COLORS.cream },
};

export function BlockerDetailDrawer({
  blocker,
  baseUrl,
  returnTab,
}: BlockerDetailDrawerProps) {
  const closeHref = `${baseUrl}?tab=${returnTab}`;
  const palette = SEVERITY_PALETTE[blocker.severity] ?? SEVERITY_PALETTE.medium;

  return (
    <aside
      role="complementary"
      aria-label={`Details for ${blocker.title}`}
      data-blocker-detail-drawer="true"
      data-blocker-id={blocker.id}
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
          marginBottom: SPACING.lg,
          gap: SPACING.md,
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
            Blocker detail · deterministic seed
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {blocker.title}
          </h3>
          <div style={{ display: 'flex', gap: SPACING.xs, marginTop: SPACING.sm }}>
            <span
              data-blocker-severity={blocker.severity}
              style={{
                padding: '2px 10px',
                borderRadius: RADIUS.pill,
                background: palette.bg,
                color: palette.fg,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {blocker.severity}
            </span>
            <span
              data-blocker-owner={blocker.owner}
              style={{
                padding: '2px 10px',
                borderRadius: RADIUS.pill,
                background: COLORS.skyPale,
                color: COLORS.navy,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              Owner: {blocker.owner}
            </span>
          </div>
        </div>
        <Link
          href={closeHref}
          data-blocker-drawer-close="true"
          aria-label="Close blocker detail"
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

      <p
        data-blocker-description="true"
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: COLORS.ink,
          margin: 0,
          marginBottom: SPACING.lg,
          lineHeight: 1.6,
        }}
      >
        {blocker.description}
      </p>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
        }}
      >
        <div>
          <dt
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}80`,
              marginBottom: SPACING.xs,
            }}
          >
            Impacted component
          </dt>
          <dd style={{ margin: 0, color: COLORS.ink }}>{blocker.impactedComponent}</dd>
        </div>
        <div>
          <dt
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}80`,
              marginBottom: SPACING.xs,
            }}
          >
            Evidence basis
          </dt>
          <dd
            data-blocker-evidence-basis="true"
            style={{ margin: 0, color: COLORS.ink }}
          >
            {blocker.evidenceBasis}
          </dd>
        </div>
        <div>
          <dt
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}80`,
              marginBottom: SPACING.xs,
            }}
          >
            Next action
          </dt>
          <dd
            data-blocker-next-action="true"
            style={{ margin: 0, color: COLORS.ink }}
          >
            {blocker.nextAction}
          </dd>
        </div>
        <div>
          <dt
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: `${COLORS.ink}80`,
              marginBottom: SPACING.xs,
            }}
          >
            Estimated resolution path
          </dt>
          <dd style={{ margin: 0, color: COLORS.ink }}>
            {blocker.estimatedResolutionPath}
          </dd>
        </div>
      </dl>

      <footer
        style={{
          display: 'flex',
          gap: SPACING.sm,
          alignItems: 'center',
          paddingTop: SPACING.md,
          borderTop: `1px solid ${COLORS.ink}10`,
        }}
      >
        <button
          type="button"
          disabled
          aria-disabled="true"
          data-blocker-mark-resolved="true"
          title="Resolution write available in Wave 27"
          style={{
            padding: `${SPACING.xs} ${SPACING.md}`,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.ink}20`,
            background: COLORS.white,
            color: `${COLORS.ink}80`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          Mark resolved
        </button>
        <span
          style={{
            padding: '2px 10px',
            borderRadius: RADIUS.pill,
            background: COLORS.amberSoft,
            color: COLORS.amberInk,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Resolution write available in Wave 27
        </span>
      </footer>
    </aside>
  );
}
