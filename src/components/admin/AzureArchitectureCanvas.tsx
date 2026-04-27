// ADMIN17 — Azure target architecture canvas.
// Secondary sub-tab on /admin/architecture. Renders the 6 Wave-24
// services (Container Apps, PostgreSQL, Blob, Key Vault, App Insights,
// AI Search) in a deterministic grid with their roles + state pills.
// All state is "Deferred" today — this is the target architecture, not
// the live deployment.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  AzureFlowEdge,
  AzureService,
} from '@/lib/admin/architecture-page-view';

export interface AzureArchitectureCanvasProps {
  services: ReadonlyArray<AzureService>;
  edges: ReadonlyArray<AzureFlowEdge>;
}

const STATE_PILL: Record<AzureService['state'], { bg: string; fg: string; label: string }> = {
  active: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Active' },
  partial: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Partial' },
  deferred: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Deferred' },
};

const CATEGORY_LABEL: Record<AzureService['category'], string> = {
  compute: 'Compute',
  data: 'Data',
  storage: 'Storage',
  security: 'Security',
  observability: 'Observability',
  ai: 'AI',
};

export function AzureArchitectureCanvas({
  services,
  edges,
}: AzureArchitectureCanvasProps) {
  return (
    <section
      data-azure-architecture-canvas="true"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <header style={{ marginBottom: SPACING.lg }}>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: `${COLORS.ink}80`,
            fontWeight: 600,
            marginBottom: SPACING.xs,
          }}
        >
          Target architecture
        </div>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
            marginBottom: SPACING.xs,
          }}
        >
          Azure private data plane
        </h2>
        <p
          style={{
            fontSize: 13,
            color: `${COLORS.ink}cc`,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Customer-owned subscription target. All services deferred to Wave 27 —
          no live calls today.
        </p>
      </header>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        {services.map((s) => {
          const pill = STATE_PILL[s.state];
          return (
            <li
              key={s.id}
              data-azure-service={s.id}
              style={{
                padding: SPACING.md,
                border: `1px solid ${COLORS.ink}15`,
                borderRadius: RADIUS.md,
                background: COLORS.cream,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: SPACING.sm,
                  marginBottom: SPACING.xs,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: `${COLORS.ink}80`,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {CATEGORY_LABEL[s.category]}
                  </div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.serif,
                      fontSize: 15,
                      fontWeight: 700,
                      color: COLORS.ink,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
                <span
                  data-azure-service-state={s.state}
                  style={{
                    background: pill.bg,
                    color: pill.fg,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: `2px ${SPACING.sm}`,
                    borderRadius: RADIUS.pill,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pill.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: `${COLORS.ink}cc`,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {s.role}
              </p>
            </li>
          );
        })}
      </ul>

      <div
        data-azure-edges="true"
        style={{
          padding: SPACING.md,
          background: COLORS.cream,
          borderRadius: RADIUS.md,
          border: `1px solid ${COLORS.ink}10`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: `${COLORS.ink}80`,
            fontWeight: 600,
            marginBottom: SPACING.sm,
          }}
        >
          Service flows
        </div>
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
          {edges.map((e, i) => (
            <li
              key={`${e.from}-${e.to}-${i}`}
              data-azure-edge={`${e.from}->${e.to}`}
              style={{
                fontSize: 12,
                color: `${COLORS.ink}cc`,
                fontFamily: TYPOGRAPHY.mono,
              }}
            >
              {e.from} → {e.to}
              <span style={{ color: `${COLORS.ink}80`, marginLeft: SPACING.sm }}>
                ({e.label})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
