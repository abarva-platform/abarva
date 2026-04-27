// ADMIN17 — Plane drilldown.
// Renders the 7-plane stack with per-plane expand affordance: clicking
// a plane row reveals its constituent components linked to the
// component detail drawer (?component=<id>). Drilldown state is driven
// by URL `?expand=<planeId>` so this stays a Server Component.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  ArchitecturePlane,
  PlaneComponent,
} from '@/lib/admin/architecture-page-view';

export interface ArchitecturePlaneDrilldownProps {
  planes: ReadonlyArray<ArchitecturePlane>;
  components: ReadonlyArray<PlaneComponent>;
  expandedPlaneId?: string;
  basePath?: string;
}

const STATE_PILL_STYLE: Record<
  PlaneComponent['state'],
  { bg: string; fg: string; label: string }
> = {
  active: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Active' },
  partial: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Partial' },
  deferred: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Deferred' },
};

export function ArchitecturePlaneDrilldown({
  planes,
  components,
  expandedPlaneId,
  basePath = '/admin/architecture',
}: ArchitecturePlaneDrilldownProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-architecture-plane-drilldown="true"
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
        Architecture workflow
      </h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {planes.map((plane, idx) => {
          const isExpanded = expandedPlaneId === plane.id;
          const planeComponents = components.filter((c) => c.planeId === plane.id);
          const toggleHref = isExpanded
            ? basePath
            : `${basePath}?expand=${plane.id}`;

          return (
            <li
              key={plane.id}
              data-plane-row={plane.id}
              data-expanded={isExpanded ? 'true' : 'false'}
              style={{
                padding: `${SPACING.md} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}10`,
                fontFamily: TYPOGRAPHY.sans,
              }}
            >
              <Link
                href={toggleHref}
                data-plane-toggle={plane.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr 24px',
                  gap: SPACING.md,
                  textDecoration: 'none',
                  color: COLORS.ink,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>{plane.label}</div>
                <div style={{ fontSize: 13, color: `${COLORS.ink}cc` }}>
                  {plane.components.join(' · ')}
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    fontSize: 14,
                    color: `${COLORS.ink}80`,
                    textAlign: 'right',
                  }}
                >
                  {isExpanded ? '−' : '+'}
                </div>
              </Link>

              {isExpanded ? (
                <div
                  data-plane-expand={plane.id}
                  style={{
                    marginTop: SPACING.md,
                    background: COLORS.cream,
                    border: `1px solid ${COLORS.ink}10`,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                  }}
                >
                  <ul
                    style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: SPACING.sm,
                    }}
                  >
                    {planeComponents.map((c) => {
                      const pill = STATE_PILL_STYLE[c.state];
                      const detailHref = `${basePath}?expand=${plane.id}&component=${c.id}`;
                      return (
                        <li key={c.id} data-component-row={c.id}>
                          <Link
                            href={detailHref}
                            data-component-link={c.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '160px 1fr auto',
                              gap: SPACING.md,
                              alignItems: 'center',
                              padding: `${SPACING.sm} ${SPACING.md}`,
                              background: COLORS.white,
                              border: `1px solid ${COLORS.ink}10`,
                              borderRadius: RADIUS.sm,
                              textDecoration: 'none',
                              color: COLORS.ink,
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                              {c.label}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                color: `${COLORS.ink}aa`,
                                fontFamily: TYPOGRAPHY.mono,
                              }}
                            >
                              {c.routePath ?? c.codePath}
                            </span>
                            <span
                              data-component-state={c.state}
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
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
