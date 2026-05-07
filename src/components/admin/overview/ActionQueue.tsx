/**
 * ActionQueue · Overview Block 1.3 (Setup Redesign Package PR A).
 *
 * Ranked list of pending decisions with severity dots and links to
 * the resolving panel. Hidden when empty per
 * `DATA_BINDING_CATALOG.md` §1 Block 1.3.
 */

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export type ActionSeverity = 'high' | 'medium' | 'low';

export interface ActionQueueItem {
  id: string;
  severity: ActionSeverity;
  /** Short description, e.g. "Load Compliance posture". */
  label: string;
  /** Plain-language consequence, e.g. "unlocks Steward gating on AI / sourcing / programs". */
  consequence: string;
  /** Resolving panel destination. */
  href: string;
  /** Panel label shown in the link, e.g. "Data Trust". */
  panelLabel: string;
}

export interface ActionQueueProps {
  items: ActionQueueItem[];
  /** Used to render "View all (N) →" if more pending than rendered. */
  totalPending?: number;
}

const SEVERITY_DOT: Record<ActionSeverity, string> = {
  high: COLORS.coralInk,
  medium: COLORS.amberInk,
  low: COLORS.mintInk,
};

export function ActionQueue({ items, totalPending }: ActionQueueProps) {
  if (items.length === 0) return null;
  const cap = items.slice(0, 5);
  const overflow = (totalPending ?? items.length) - cap.length;
  return (
    <section
      data-overview-block="action-queue"
      data-testid="overview-action-queue"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm }}>
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.INK,
            fontWeight: 600,
          }}
        >
          Pending your decision
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          ({totalPending ?? items.length})
        </span>
      </header>
      <ul
        role="list"
        data-testid="overview-action-queue-list"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {cap.map((item) => (
          <li
            key={item.id}
            data-action-id={item.id}
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
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14, fontWeight: 600, color: SHELL.INK }}>
              {item.label}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK_SOFT, flex: 1 }}>
              · {item.consequence}
            </span>
            <Link
              href={item.href}
              data-testid={`overview-action-${item.id}-link`}
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
              {item.panelLabel} →
            </Link>
          </li>
        ))}
      </ul>
      {overflow > 0 ? (
        <Link
          href="/admin/data-trust"
          data-testid="overview-action-queue-view-all"
          style={{
            alignSelf: 'flex-start',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.navy,
            textDecoration: 'none',
          }}
        >
          View all ({overflow + cap.length}) →
        </Link>
      ) : null}
    </section>
  );
}
