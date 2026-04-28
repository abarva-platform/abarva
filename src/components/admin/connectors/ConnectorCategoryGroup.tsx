import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  ConnectorCategoryGroup as ConnectorCategoryGroupModel,
} from '@/lib/admin/connectors-page-view';
import type { ConnectorStatus } from '@/lib/admin/connectors-readiness-view';

export interface ConnectorCategoryGroupProps {
  category: ConnectorCategoryGroupModel;
  /** Currently-selected connector id, if any. */
  selectedConnectorId?: string;
  /** Builder to compute the href that opens the drawer for a given connector id. */
  buildSelectHref: (connectorId: string) => string;
}

const STATUS_PILL: Record<ConnectorStatus, { bg: string; fg: string; label: string }> = {
  not_configured: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Not configured' },
  configured_stub: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Stub configured' },
  blocked: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Blocked' },
  deferred: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Deferred' },
};

/**
 * ADMIN13 — Connector category group.
 *
 * Renders a collapsible-style group of connectors of one ConnectorKind.
 * Default expanded state is encoded in markup (open by default for ERP);
 * the group itself is a `<details>` element so expand/collapse works
 * without client-side JavaScript.
 */
export function ConnectorCategoryGroup({
  category,
  selectedConnectorId,
  buildSelectHref,
}: ConnectorCategoryGroupProps) {
  // ERP is the default-open group per ADMIN13 spec.
  const defaultOpen = category.kind === 'erp';

  return (
    <details
      data-component="ConnectorCategoryGroup"
      data-kind={category.kind}
      data-default-open={defaultOpen ? 'true' : 'false'}
      open={defaultOpen}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        marginBottom: SPACING.md,
      }}
    >
      <summary
        style={{
          padding: SPACING.md,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          fontFamily: TYPOGRAPHY.sans,
          listStyle: 'none',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.005em',
            }}
          >
            {category.label}
          </span>
          <span
            style={{
              marginLeft: SPACING.sm,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}99`,
              letterSpacing: '0.04em',
            }}
          >
            {category.configuredCount}/{category.totalCount} configured
          </span>
        </div>
        {category.pilotBlockerCount > 0 ? (
          <span
            data-pilot-blocker-pill="true"
            style={{
              padding: '2px 10px',
              borderRadius: RADIUS.pill,
              background: COLORS.coralSoft,
              color: COLORS.coralInk,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {category.pilotBlockerCount} pilot blocker
            {category.pilotBlockerCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </summary>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          borderTop: `1px solid ${COLORS.ink}10`,
        }}
      >
        {category.connectors.map((c, idx) => {
          const status = STATUS_PILL[c.status];
          const isSelected = selectedConnectorId === c.id;
          return (
            <li
              key={c.id}
              data-connector-id={c.id}
              data-selected={isSelected ? 'true' : 'false'}
              style={{
                borderTop: idx === 0 ? 'none' : `1px solid ${COLORS.ink}0a`,
              }}
            >
              <a
                href={buildSelectHref(c.id)}
                data-action="select-connector"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr 160px',
                  gap: SPACING.md,
                  padding: SPACING.md,
                  textDecoration: 'none',
                  background: isSelected ? COLORS.skyPale : 'transparent',
                  alignItems: 'center',
                  fontFamily: TYPOGRAPHY.sans,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>
                    {c.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: `${COLORS.ink}80`,
                      marginTop: 2,
                      fontFamily: TYPOGRAPHY.mono,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {c.id}
                  </div>
                </div>
                <div
                  style={{ fontSize: 12, color: `${COLORS.ink}cc`, lineHeight: 1.5 }}
                >
                  {c.requiredForPilot ? 'Pilot-required.' : 'Not required for pilot.'}
                  {c.requiredForProduction ? ' Production-required.' : ''}
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
                  data-status={c.status}
                >
                  {status.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
