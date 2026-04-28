import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export type ContextLiveStatus = 'live' | 'partial' | 'deferred';

export interface ContextBarProps {
  tenant: string;
  mode: string;
  agent: string;
  data: string;
  liveStatus: string;
  liveStatusKind?: ContextLiveStatus;
}

const STATUS_COLOR: Record<ContextLiveStatus, string> = {
  live: COLORS.mintInk,
  partial: COLORS.amberInk,
  deferred: COLORS.coralInk,
};

export function ContextBar({
  tenant,
  mode,
  agent,
  data,
  liveStatus,
  liveStatusKind = 'deferred',
}: ContextBarProps) {
  const cells = [
    { label: 'Tenant', value: tenant, color: COLORS.ink },
    { label: 'Mode', value: mode, color: COLORS.ink },
    { label: 'Agent', value: agent, color: COLORS.ink },
    { label: 'Data', value: data, color: COLORS.amberInk },
    { label: 'Live status', value: liveStatus, color: STATUS_COLOR[liveStatusKind] },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: SPACING.md,
        padding: SPACING.md,
        background: COLORS.white,
        borderRadius: RADIUS.md,
        border: `1px solid ${COLORS.ink}10`,
      }}
      data-context-bar="true"
    >
      {cells.map((cell) => (
        <div key={cell.label}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}80`,
            }}
          >
            {cell.label}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              fontWeight: 600,
              color: cell.color,
              marginTop: 4,
            }}
          >
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  );
}
