import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ConnectorReadiness } from '@/lib/admin/connectors-readiness-view';

export interface PilotBlockerDrilldownProps {
  blockers: ReadonlyArray<ConnectorReadiness>;
  /** Whether to render expanded; the page wires this from a `?blockers=open` URL param. */
  expanded: boolean;
  /** Toggle target href. */
  toggleHref: string;
  /** Builder for connector-detail href. */
  buildSelectHref: (connectorId: string) => string;
}

/**
 * ADMIN13 — Pilot blocker drilldown.
 *
 * Surfaces "X pilot blockers" pill at top of canvas. Clicking the pill
 * expands the list of connectors that block pilot. URL-driven so it
 * works without client-side state.
 */
export function PilotBlockerDrilldown({
  blockers,
  expanded,
  toggleHref,
  buildSelectHref,
}: PilotBlockerDrilldownProps) {
  const count = blockers.length;
  const label = `${count} pilot blocker${count === 1 ? '' : 's'}`;

  return (
    <section
      data-component="PilotBlockerDrilldown"
      data-expanded={expanded ? 'true' : 'false'}
      data-blocker-count={count}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${count > 0 ? `${COLORS.coralInk}33` : `${COLORS.ink}10`}`,
        padding: SPACING.md,
        marginBottom: SPACING.md,
      }}
      id="blockers"
    >
      <a
        href={toggleHref}
        data-action="toggle-blockers"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textDecoration: 'none',
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.sm,
          }}
        >
          <span
            style={{
              padding: '4px 12px',
              borderRadius: RADIUS.pill,
              background: count > 0 ? COLORS.coralSoft : COLORS.mintSoft,
              color: count > 0 ? COLORS.coralInk : COLORS.mintInk,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 12,
              color: `${COLORS.ink}99`,
            }}
          >
            {count > 0
              ? 'Pilot cannot proceed until these connectors clear Steward review.'
              : 'No connector gaps blocking pilot.'}
          </span>
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 700,
          }}
        >
          {expanded ? 'Hide' : 'Show'}
        </span>
      </a>
      {expanded && count > 0 ? (
        <ul
          data-section="pilot-blocker-list"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginTop: SPACING.md,
            borderTop: `1px solid ${COLORS.ink}10`,
          }}
        >
          {blockers.map((b, idx) => (
            <li
              key={b.id}
              data-connector-id={b.id}
              style={{
                padding: `${SPACING.sm} 0`,
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}0a`,
                display: 'grid',
                gridTemplateColumns: '220px 1fr 110px',
                gap: SPACING.sm,
                alignItems: 'baseline',
                fontFamily: TYPOGRAPHY.sans,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>
                {b.label}
              </div>
              <div style={{ fontSize: 12, color: `${COLORS.ink}cc` }}>
                {b.blockerReason ?? b.stewardGuidance}
              </div>
              <a
                href={buildSelectHref(b.id)}
                data-action="open-blocker-detail"
                style={{
                  justifySelf: 'end',
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.navy,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                View
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
