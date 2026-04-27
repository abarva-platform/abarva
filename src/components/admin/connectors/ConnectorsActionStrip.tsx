import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ConnectorAction } from '@/lib/admin/connectors-page-view';

export interface ConnectorsActionStripProps {
  actions: ReadonlyArray<ConnectorAction>;
}

/**
 * ADMIN13 — Connectors page action strip.
 *
 * Renders Add connector / Test all / Export config affordances. Hard-gated
 * actions are disabled with reason text; safe actions render as anchors.
 */
export function ConnectorsActionStrip({ actions }: ConnectorsActionStripProps) {
  return (
    <nav
      data-component="ConnectorsActionStrip"
      aria-label="Connectors actions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      {actions.map((action) =>
        action.status === 'blocked' ? (
          <button
            key={action.id}
            type="button"
            disabled
            data-action={action.id}
            data-status="blocked"
            title={action.reason ?? undefined}
            aria-disabled="true"
            style={blockedStyle}
          >
            {action.label}
            <span style={hintStyle}>{action.hint}</span>
          </button>
        ) : (
          <a
            key={action.id}
            href={`/admin/connectors?action=${action.id}`}
            data-action={action.id}
            data-status="available"
            style={availableStyle}
          >
            {action.label}
            <span style={hintStyle}>{action.hint}</span>
          </a>
        ),
      )}
    </nav>
  );
}

const baseButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '10px 14px',
  borderRadius: RADIUS.md,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  textDecoration: 'none',
  border: `1px solid ${COLORS.ink}1f`,
  gap: 2,
};

const blockedStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: COLORS.cream,
  color: `${COLORS.ink}80`,
  cursor: 'not-allowed',
};

const availableStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: COLORS.white,
  color: COLORS.navy,
};

const hintStyle: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 10,
  letterSpacing: 0,
  textTransform: 'none',
  fontWeight: 400,
  color: `${COLORS.ink}80`,
  marginTop: 2,
};
