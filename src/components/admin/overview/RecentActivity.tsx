/**
 * RecentActivity · Overview Block 1.4 (Setup Redesign Package PR A).
 *
 * Last 7 days of real changes, max 5 items. Hidden when no real
 * activity per `DATA_BINDING_CATALOG.md` §1 Block 1.4 + Setup
 * canon refit.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';

export interface RecentActivityItem {
  id: string;
  summary: string;
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
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h2 style={SETUP_TYPE.cardH2}>Last 7 days</h2>
        <span style={SETUP_TYPE.cardMeta}>({cap.length})</span>
      </header>
      <ul
        role="list"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}
      >
        {cap.map((item) => (
          <li
            key={item.id}
            data-activity-id={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr',
              alignItems: 'baseline',
              gap: 12,
              padding: '8px 0',
              borderTop: `1px solid ${SETUP.cardLine}`,
            }}
          >
            <span
              style={{
                fontFamily: SETUP.mono,
                fontSize: 10,
                color: SETUP.inkMuted,
                whiteSpace: 'nowrap',
              }}
            >
              {item.relativeTimestamp}
            </span>
            <span style={SETUP_TYPE.bodySans}>{item.summary}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
