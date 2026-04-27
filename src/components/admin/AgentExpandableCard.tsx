// ADMIN12 — Per-agent expandable card.
//
// Renders one agent's posture, context coverage, capabilities (canDo /
// cannotDo), and unblock path. Server component — expansion is structural,
// not interactive (the page route renders the active agent's full detail).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  AgentDetailModel,
  ContextCoverageLevel,
} from '@/lib/admin/agent-readiness-page-view';
import type { AgentPosture } from '@/lib/admin/admin-shell-config';

export interface AgentExpandableCardProps {
  detail: AgentDetailModel;
}

const POSTURE_STYLES: Record<AgentPosture, { bg: string; fg: string }> = {
  BLOCKED: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
  PARTIAL: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  THIN: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  READY: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
};

const COVERAGE_STYLES: Record<ContextCoverageLevel, { bg: string; fg: string; label: string }> = {
  decision_grade: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Decision-grade' },
  partial: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Partial' },
  thin: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Thin' },
  none: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'None' },
};

export function AgentExpandableCard({ detail }: AgentExpandableCardProps) {
  const postureStyle = POSTURE_STYLES[detail.posture];

  return (
    <article
      data-agent-expandable-card="true"
      data-agent-id={detail.id}
      data-agent-posture={detail.posture}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {detail.label}
          </h2>
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}80`,
              margin: 0,
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Governs · {detail.governs}
          </p>
        </div>
        <span
          data-posture={detail.posture}
          style={{
            padding: '4px 12px',
            borderRadius: RADIUS.pill,
            background: postureStyle.bg,
            color: postureStyle.fg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          {detail.posture}
        </span>
      </header>

      <p
        data-agent-posture-reason="true"
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}cc`,
          lineHeight: 1.6,
          margin: 0,
          marginBottom: SPACING.lg,
        }}
      >
        {detail.postureReason}
        {detail.unblockBy ? ` · Unblock: ${detail.unblockBy}` : ''}
      </p>

      <section
        data-agent-context-coverage="true"
        style={{ marginBottom: SPACING.lg }}
      >
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            marginBottom: SPACING.sm,
          }}
        >
          Context coverage by surface
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: SPACING.sm,
          }}
        >
          {detail.contextCoverage.map((cell) => {
            const style = COVERAGE_STYLES[cell.level];
            return (
              <li
                key={cell.surface}
                data-coverage-surface={cell.surface}
                data-coverage-level={cell.level}
                style={{
                  background: COLORS.cream,
                  border: `1px solid ${COLORS.ink}10`,
                  borderRadius: RADIUS.md,
                  padding: SPACING.sm,
                  fontFamily: TYPOGRAPHY.sans,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
                    {cell.surfaceLabel}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: RADIUS.pill,
                      background: style.bg,
                      color: style.fg,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {style.label}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: `${COLORS.ink}99`,
                    lineHeight: 1.5,
                  }}
                >
                  {cell.note}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: SPACING.lg,
          marginBottom: SPACING.lg,
        }}
      >
        <div data-agent-can-do="true">
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              marginBottom: SPACING.sm,
            }}
          >
            What this agent can do today
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
          >
            {detail.canDo.map((item) => (
              <li
                key={item}
                data-capability-can-do="true"
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}cc`,
                  lineHeight: 1.5,
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  background: COLORS.mintSoft,
                  borderRadius: RADIUS.sm,
                  borderLeft: `3px solid ${COLORS.mintInk}`,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div data-agent-cannot-do="true">
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              marginBottom: SPACING.sm,
            }}
          >
            What this agent cannot do today
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
          >
            {detail.cannotDo.map((item) => (
              <li
                key={item}
                data-capability-cannot-do="true"
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  color: `${COLORS.ink}cc`,
                  lineHeight: 1.5,
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  background: COLORS.coralSoft,
                  borderRadius: RADIUS.sm,
                  borderLeft: `3px solid ${COLORS.coralInk}`,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        data-agent-unblocked-by="true"
        style={{
          padding: SPACING.md,
          background: COLORS.amberSoft,
          color: COLORS.amberInk,
          borderRadius: RADIUS.md,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Unblocked by · {detail.unblockedBy}
      </section>
    </article>
  );
}
