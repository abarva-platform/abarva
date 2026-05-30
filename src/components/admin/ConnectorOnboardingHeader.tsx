/**
 * ConnectorOnboardingHeader · Wave 2 PR-6
 *
 * A small server-rendered banner that sits between the Steward
 * editorial block and the existing `ConnectorsActionStrip` on
 * `/admin/connectors`. Persona A friction (verdict §4) is that a
 * first-time tenant admin can't add a connector from the landing or
 * from this page; this header surfaces the entry affordance without
 * touching the existing action strip or list.
 *
 * Deliberately isolated from `ConnectorsActionStrip` so W2-PR-1's
 * health-surface reordering work on the same page produces only
 * trivial merge conflicts.
 *
 * Locked design surface: Georgia title (small), DM Sans body,
 * black primary button. No new tokens, no colors.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

interface Props {
  /** Href that opens the `AddConnectorPanel` (typically `?add=open`). */
  addHref: string;
}

export function ConnectorOnboardingHeader({ addHref }: Props) {
  return (
    <section
      data-component="ConnectorOnboardingHeader"
      data-testid="connector-onboarding-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.md,
        flexWrap: 'wrap',
        padding: `${SPACING.md} ${SPACING.lg}`,
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}10`,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.md,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
            marginBottom: 4,
          }}
        >
          Onboarding
        </div>
        <h3
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.ink,
            margin: '0 0 4px',
            letterSpacing: '-0.005em',
          }}
        >
          Add a new connector
        </h3>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12.5,
            color: `${COLORS.ink}99`,
            margin: 0,
            lineHeight: 1.5,
            maxWidth: 640,
          }}
        >
          Pick a template, name the connection, then finish the auth
          handshake on the connector detail page. Drafts hold safely
          while you sort credentials with the owning team.
        </p>
      </div>
      <a
        href={addHref}
        data-testid="connector-onboarding-add-cta"
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.cream,
          background: COLORS.ink,
          border: `1px solid ${COLORS.ink}`,
          borderRadius: 3,
          padding: '8px 16px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Add connector
      </a>
    </section>
  );
}
