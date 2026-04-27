// ADMIN17 — Component detail drawer.
// Renders metadata for a single PlaneComponent: route path, code path,
// dependencies, current state. Drawer state is URL-driven via
// `?component=<id>`; the close affordance is a Link back to the
// drilldown view. SAFE affordance (no live writes).

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { PlaneComponent } from '@/lib/admin/architecture-page-view';

export interface ComponentDetailDrawerProps {
  component: PlaneComponent;
  closeHref: string;
  componentDetailMap: Readonly<Record<string, PlaneComponent>>;
}

const STATE_LABEL: Record<PlaneComponent['state'], string> = {
  active: 'Active',
  partial: 'Partial',
  deferred: 'Deferred',
};

const STATE_PILL: Record<PlaneComponent['state'], { bg: string; fg: string }> = {
  active: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  partial: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  deferred: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
};

export function ComponentDetailDrawer({
  component,
  closeHref,
  componentDetailMap,
}: ComponentDetailDrawerProps) {
  const pill = STATE_PILL[component.state];

  return (
    <aside
      data-component-detail-drawer={component.id}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}15`,
        padding: SPACING.xl,
        marginTop: SPACING.lg,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: SPACING.md,
          marginBottom: SPACING.md,
        }}
      >
        <div>
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
            Component detail
          </div>
          <h3
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {component.label}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: SPACING.sm, alignItems: 'center' }}>
          <span
            data-drawer-state={component.state}
            style={{
              background: pill.bg,
              color: pill.fg,
              fontSize: 11,
              fontWeight: 600,
              padding: `2px ${SPACING.sm}`,
              borderRadius: RADIUS.pill,
            }}
          >
            {STATE_LABEL[component.state]}
          </span>
          <Link
            href={closeHref}
            data-drawer-close="true"
            aria-label="Close drawer"
            style={{
              fontSize: 14,
              color: `${COLORS.ink}80`,
              textDecoration: 'none',
              padding: `${SPACING.xs} ${SPACING.sm}`,
              border: `1px solid ${COLORS.ink}20`,
              borderRadius: RADIUS.sm,
            }}
          >
            Close
          </Link>
        </div>
      </header>

      <p
        style={{
          fontSize: 14,
          color: `${COLORS.ink}cc`,
          margin: 0,
          marginBottom: SPACING.lg,
          lineHeight: 1.5,
        }}
      >
        {component.summary}
      </p>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: `${SPACING.sm} ${SPACING.md}`,
          margin: 0,
        }}
      >
        {component.routePath ? (
          <>
            <dt
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: `${COLORS.ink}80`,
              }}
            >
              Route path
            </dt>
            <dd
              data-drawer-route-path="true"
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.ink,
                margin: 0,
              }}
            >
              {component.routePath}
            </dd>
          </>
        ) : null}
        <dt
          style={{ fontSize: 12, fontWeight: 600, color: `${COLORS.ink}80` }}
        >
          Code path
        </dt>
        <dd
          data-drawer-code-path="true"
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.ink,
            margin: 0,
          }}
        >
          {component.codePath}
        </dd>
        <dt
          style={{ fontSize: 12, fontWeight: 600, color: `${COLORS.ink}80` }}
        >
          Plane
        </dt>
        <dd style={{ fontSize: 13, color: COLORS.ink, margin: 0 }}>
          {component.planeId}
        </dd>
        <dt
          style={{ fontSize: 12, fontWeight: 600, color: `${COLORS.ink}80` }}
        >
          Dependencies
        </dt>
        <dd
          data-drawer-dependencies="true"
          style={{ fontSize: 13, color: COLORS.ink, margin: 0 }}
        >
          {component.dependencies.length === 0 ? (
            <span style={{ color: `${COLORS.ink}80`, fontStyle: 'italic' }}>
              none
            </span>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                gap: SPACING.xs,
                flexWrap: 'wrap',
              }}
            >
              {component.dependencies.map((dep) => {
                const depLabel = componentDetailMap[dep]?.label ?? dep;
                return (
                  <li
                    key={dep}
                    data-drawer-dependency={dep}
                    style={{
                      background: COLORS.skyPale,
                      color: COLORS.navy,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: `2px ${SPACING.sm}`,
                      borderRadius: RADIUS.pill,
                    }}
                  >
                    {depLabel}
                  </li>
                );
              })}
            </ul>
          )}
        </dd>
      </dl>
    </aside>
  );
}
