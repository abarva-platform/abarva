/**
 * RecentActivity · Overview Block 1.4 (Setup Redesign Package PR A).
 *
 * Last 7 days of real changes, max 5 items. Hidden when no real
 * activity per `DATA_BINDING_CATALOG.md` §1 Block 1.4.
 *
 * Filters out platform-administrative entries (e.g. "Steward
 * authored financial-services setup posture · Today" — that's not
 * real activity, it's the page existing).
 */

import { RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface RecentActivityItem {
  id: string;
  /** Plain-language summary, e.g. "Compliance posture marked 'ready to load'". */
  summary: string;
  /** Relative timestamp string, e.g. "2d ago". */
  relativeTimestamp: string;
}

export interface RecentActivityProps {
  items: RecentActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) return null;
  const cap = items.slice(0, 5);
  return (
    <section
      data-overview-block="recent-activity"
      data-testid="overview-recent-activity"
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
          Last 7 days
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.INK_MUTED,
          }}
        >
          ({cap.length})
        </span>
      </header>
      <ul
        role="list"
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
            data-activity-id={item.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.sm,
              padding: `${SPACING.xs} 0`,
              borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                whiteSpace: 'nowrap',
                minWidth: 64,
              }}
            >
              {item.relativeTimestamp}
            </span>
            <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: SHELL.INK, lineHeight: 1.5 }}>
              {item.summary}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
