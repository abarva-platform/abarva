import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ConnectorReadiness, ConnectorStatus } from '@/lib/admin/connectors-readiness-view';

export interface ConnectorsListProps {
  connectors: ReadonlyArray<ConnectorReadiness>;
  caveat: string;
}

const STATUS_STYLES: Record<ConnectorStatus, { bg: string; fg: string; label: string }> = {
  not_configured: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Not configured' },
  configured_stub: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Stub configured' },
  blocked: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Blocked' },
  deferred: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Deferred' },
};

export function ConnectorsList({ connectors, caveat }: ConnectorsListProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-connectors-list="true"
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
        Connector inventory
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        {connectors.map((conn, idx) => {
          const status = STATUS_STYLES[conn.status];
          return (
            <li
              key={conn.id}
              style={{
                padding: `${SPACING.md} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                display: 'grid',
                gridTemplateColumns: '220px 1fr 160px',
                gap: SPACING.md,
                alignItems: 'start',
                fontFamily: TYPOGRAPHY.sans,
              }}
              data-connector-id={conn.id}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{conn.label}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: `${COLORS.ink}80`,
                    marginTop: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {conn.kind.replace(/_/g, ' ')}
                </div>
              </div>
              <div style={{ fontSize: 13, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}>
                {conn.stewardGuidance}
              </div>
              <span
                style={{
                  justifySelf: 'end',
                  padding: '4px 12px',
                  borderRadius: RADIUS.pill,
                  background: status.bg,
                  color: status.fg,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
                data-status={conn.status}
              >
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>
      <p
        style={{
          marginTop: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}80`,
          fontStyle: 'italic',
        }}
      >
        {caveat}
      </p>
    </section>
  );
}
