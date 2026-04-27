import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { OverviewSetupItem, OverviewSetupStatus } from '@/lib/admin/overview-page-view';

export interface SetupItemsListProps {
  items: ReadonlyArray<OverviewSetupItem>;
}

const STATUS_STYLES: Record<OverviewSetupStatus, { bg: string; fg: string; label: string }> = {
  done: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Done' },
  in_progress: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'In progress' },
  pending: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Pending' },
};

export function SetupItemsList({ items }: SetupItemsListProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-setup-items-list="true"
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
        Setup items
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => {
          const status = STATUS_STYLES[item.status];
          return (
            <li
              key={item.id}
              style={{
                padding: `${SPACING.md} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                display: 'grid',
                gridTemplateColumns: '180px 1fr 120px',
                gap: SPACING.md,
                alignItems: 'center',
                fontFamily: TYPOGRAPHY.sans,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{item.label}</div>
              <div style={{ fontSize: 13, color: `${COLORS.ink}cc` }}>{item.description}</div>
              <span
                style={{
                  justifySelf: 'end',
                  padding: '4px 12px',
                  borderRadius: RADIUS.pill,
                  background: status.bg,
                  color: status.fg,
                  fontSize: 12,
                  fontWeight: 600,
                }}
                data-status={item.status}
              >
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
