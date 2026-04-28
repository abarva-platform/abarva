import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { OverviewRecentActivityItem } from '@/lib/admin/overview-page-view';

export interface RecentActivityListProps {
  items: ReadonlyArray<OverviewRecentActivityItem>;
}

const CATEGORY_LABELS: Record<string, string> = {
  auth: '[auth]',
  role_change: '[role]',
  connector: '[connector]',
  dataset: '[dataset]',
  approval: '[approval]',
  blocker: '[blocker]',
  setup_progress: '[setup]',
  readiness_state: '[readiness]',
  other: '[other]',
};

export function RecentActivityList({ items }: RecentActivityListProps) {
  if (items.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.ink}10`,
          padding: SPACING.xl,
        }}
        data-recent-activity-list="true"
      >
        <p style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}88`, margin: 0 }}>
          No recent activity.
        </p>
      </section>
    );
  }
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-recent-activity-list="true"
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.lg,
        }}
      >
        Recent activity
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, idx) => (
          <li
            key={item.id}
            style={{
              padding: `${SPACING.sm} 0`,
              borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}08`,
              display: 'flex',
              gap: SPACING.sm,
              alignItems: 'flex-start',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
            }}
          >
            <span
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                flexShrink: 0,
                color: `${COLORS.ink}66`,
                fontFamily: TYPOGRAPHY.mono,
                paddingTop: 1,
              }}
            >
              {CATEGORY_LABELS[item.category] ?? '[other]'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: COLORS.ink, fontWeight: 500 }}>{item.summary}</span>
              <span style={{ color: `${COLORS.ink}66`, marginLeft: 8, fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
