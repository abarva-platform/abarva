import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { OverviewCrossPageCounts } from '@/lib/admin/overview-page-view';

export interface CrossPageCountsBarProps {
  counts: OverviewCrossPageCounts;
}

export function CrossPageCountsBar({ counts }: CrossPageCountsBarProps) {
  const tiles = [
    { label: 'Open blockers', value: counts.openBlockers, href: '/admin/production-readiness', urgent: counts.openBlockers > 0 },
    { label: 'Pending approvals', value: counts.datasetsPendingApproval, href: '/admin/data-trust', urgent: counts.datasetsPendingApproval > 0 },
    { label: 'Connectors not configured', value: counts.connectorsNotConfigured, href: '/admin/connectors', urgent: counts.connectorsNotConfigured > 0 },
    { label: 'Pending invites', value: counts.invitesPending, href: '/admin/users-access', urgent: false },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
      }}
      data-cross-page-counts-bar="true"
    >
      {tiles.map((tile) => (
        <a
          key={tile.label}
          href={tile.href}
          style={{
            display: 'block',
            background: tile.urgent ? `${COLORS.ink}06` : COLORS.white,
            border: `1px solid ${tile.urgent ? COLORS.ink + '20' : COLORS.ink + '10'}`,
            borderRadius: RADIUS.md,
            padding: SPACING.md,
            textDecoration: 'none',
            fontFamily: TYPOGRAPHY.sans,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.ink, fontFamily: TYPOGRAPHY.serif }}>
            {tile.value}
          </div>
          <div style={{ fontSize: 12, color: `${COLORS.ink}88`, marginTop: 2 }}>{tile.label}</div>
        </a>
      ))}
    </div>
  );
}
