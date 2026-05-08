// Home Panel Grid · canonical 8-panel navigation per
// docs/build/home-refinement-package/HOME_PANELS_INVENTORY.md.
// Renders below the existing Home content (HomeIndexPage) so the
// programs/portfolio dashboard isn't displaced. Three groups —
// Explore, Configure, Learn — each with a small card per panel.

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { panelsByGroup, type HomePanelMetadata } from '@/lib/home/panel-inventory';
// ROLE_KIT_FILTER_HOOK · TODO: filter panels through
// isVisibleToCurrentUser(panel, currentUser.roles) when role kit
// ships. Today every signed-in user sees every panel.
// import { isVisibleToCurrentUser } from '@/lib/home/role-visibility';

export function HomePanelGrid() {
  const groups = panelsByGroup();
  return (
    <section
      data-testid="home-panel-grid"
      aria-label="Home panels"
      style={{
        padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xl,
      }}
    >
      <header>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
            marginBottom: SPACING.xs,
          }}
        >
          Home · Panels
        </div>
        <h2
          style={{
            fontFamily: FONT.body,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.005em',
            margin: 0,
          }}
        >
          Where to next
        </h2>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 13,
            color: COLORS.muted,
            margin: 0,
            marginTop: SPACING.xs,
          }}
        >
          Eight panels — the canonical Home structure. Explore for daily use,
          Configure for admin work, Learn for orientation.
        </p>
      </header>

      {groups.map((group) =>
        group.panels.length === 0 ? null : (
          <div key={group.group}>
            <header style={{ marginBottom: SPACING.sm }}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.muted,
                }}
              >
                {group.label}
              </div>
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 12,
                  color: COLORS.muted,
                  marginTop: 2,
                }}
              >
                {group.subtitle}
              </div>
            </header>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: SPACING.sm,
              }}
            >
              {group.panels.map((p) => (
                <PanelCard key={p.id} panel={p} />
              ))}
            </div>
          </div>
        ),
      )}
    </section>
  );
}

function PanelCard({ panel }: { panel: HomePanelMetadata }) {
  return (
    <Link
      href={panel.route}
      data-panel-id={panel.id}
      data-panel-group={panel.group}
      style={{
        display: 'block',
        border: BORDER.hairline,
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 120ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          marginBottom: SPACING.xs,
        }}
      >
        <h3
          style={{
            fontFamily: FONT.body,
            fontSize: 15,
            fontWeight: 600,
            color: COLORS.ink,
            margin: 0,
          }}
        >
          {panel.label}
        </h3>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          →
        </span>
      </div>
      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 12,
          color: COLORS.muted,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {panel.description}
      </p>
      {panel.statHint && (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            color: COLORS.body,
            marginTop: SPACING.sm,
            paddingTop: SPACING.xs,
            borderTop: `1px dotted ${COLORS.border}`,
          }}
        >
          {panel.statHint}
        </div>
      )}
    </Link>
  );
}
