/**
 * PerAgentActions · Block 5.3 (Setup Redesign Package PR C).
 *
 * Two visually distinct sections:
 *  - Admin-actionable: red/amber severity dots, prominent, link
 *    to Data Trust per item.
 *  - Engineering-tracked: muted, italic, Wave reference, no
 *    severity dot, no action affordance.
 *
 * Per `DATA_BINDING_CATALOG.md` §5.3 and PR_C §4. The visual
 * separation is "the most important visual decision" of the
 * redesign — admin can scan in 3 seconds and know what they act
 * on vs. what's tracked separately.
 */

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  AdminActionableItem,
  EngineeringTrackedItem,
} from '@/lib/admin/agent-readiness-composer';

const SEVERITY_DOT = {
  high: COLORS.coralInk,
  medium: COLORS.amberInk,
  low: COLORS.mintInk,
};

export function PerAgentActions({
  adminActionable,
  engineeringTracked,
}: {
  adminActionable: AdminActionableItem[];
  engineeringTracked: EngineeringTrackedItem[];
}) {
  return (
    <section
      data-agent-readiness-block="per-agent-actions"
      data-testid="agent-readiness-per-agent-actions"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <header>
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          Per-agent next-action
        </h2>
        <p
          style={{
            margin: `${SPACING.xs} 0 0`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            lineHeight: 1.5,
          }}
        >
          What admin can resolve directly, separated from what AbarVa engineering tracks.
        </p>
      </header>

      {/* Admin-actionable */}
      <div data-section="admin-actionable" data-testid="per-agent-admin-actionable">
        <h3
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK,
            fontWeight: 700,
          }}
        >
          Admin-actionable · {adminActionable.length} item{adminActionable.length === 1 ? '' : 's'}
        </h3>
        {adminActionable.length === 0 ? (
          <p
            style={{
              marginTop: SPACING.xs,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: SHELL.INK_SOFT,
            }}
          >
            All four agents have the data they need from the loaded segments.
          </p>
        ) : (
          <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0, marginTop: SPACING.xs }}>
            {adminActionable.map((item) => (
              <li
                key={item.id}
                data-action-id={item.id}
                data-agent-id={item.agentId}
                data-action-severity={item.severity}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  padding: `${SPACING.sm} 0`,
                  borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  aria-label={`severity-${item.severity}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: SEVERITY_DOT[item.severity],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14, fontWeight: 700, color: SHELL.INK }}>
                  {item.agentLabel}
                </span>
                <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK, flex: 1 }}>
                  → can&apos;t do {item.capabilityGap} · needs {item.needs}
                </span>
                <Link
                  href={item.href}
                  data-testid={`per-agent-action-${item.id}-link`}
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLORS.navy,
                    textDecoration: 'none',
                    border: `1px solid ${COLORS.navy}55`,
                    borderRadius: RADIUS.pill,
                    padding: `2px ${SPACING.sm}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Data Trust →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Engineering-tracked — muted, italic, no severity, no action */}
      <div
        data-section="engineering-tracked"
        data-testid="per-agent-engineering-tracked"
        style={{
          borderTop: `1px dashed ${SHELL.CARD_LINE_SOFT}`,
          paddingTop: SPACING.md,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            fontWeight: 700,
          }}
        >
          Tracked by AbarVa engineering · {engineeringTracked.length} item{engineeringTracked.length === 1 ? '' : 's'}
        </h3>
        <ul
          role="list"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            marginTop: SPACING.xs,
          }}
        >
          {engineeringTracked.map((item) => (
            <li
              key={item.id}
              data-engineering-id={item.id}
              style={{
                padding: `${SPACING.xs} 0`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontStyle: 'italic',
                color: SHELL.INK_MUTED,
                lineHeight: 1.5,
                opacity: 0.85,
              }}
            >
              <span style={{ fontWeight: 600 }}>{item.wave}:</span> {item.capability}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
