/**
 * /admin/users-access/sso-configuration · Setup Fix Package PR 5
 *
 * Documentation page describing the SSO request flow. AbarVa
 * configures SSO for tenants by request — this page tells admins
 * what to send and what unlocks once SSO is live.
 *
 * Route is reachable from the "Configure SSO" CTA on the Users &
 * Access primary action and from the action strip.
 */

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const metadata = {
  title: 'Configure SSO | AbarVa Setup',
};

export default async function SsoConfigurationPage() {
  const tenant = await resolveAdminTenant();

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Users & Access"
          primaryActionHref="/admin/users-access"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Users & Access · SSO setup"
        title="Configure single sign-on"
        subtitle={`AbarVa configures SSO per tenant. Send the details below to support; we configure your IdP federation and ${tenant.tenantName} unlocks the items listed under "What this unlocks".`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>
          <section
            data-sso-request-flow="true"
            style={{
              background: COLORS.white,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.ink}10`,
              padding: SPACING.xl,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              How to request SSO
            </h2>
            <p style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14, color: COLORS.ink, margin: 0, lineHeight: 1.6 }}>
              SSO setup is not self-service. Send the following to{' '}
              <a
                href="mailto:support@abarva.com?subject=SSO%20configuration%20request"
                style={{ color: COLORS.navy, fontWeight: 600 }}
              >
                support@abarva.com
              </a>
              {' '}and AbarVa will provision the federation:
            </p>
            <ol
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 14,
                color: COLORS.ink,
                margin: 0,
                paddingLeft: SPACING.lg,
                lineHeight: 1.8,
              }}
            >
              <li><strong>Tenant identifier:</strong> {tenant.tenantSlug}</li>
              <li><strong>Identity provider:</strong> Okta, Azure AD, Google Workspace, OneLogin, or any SAML 2.0 / OIDC IdP</li>
              <li><strong>SAML metadata URL</strong> or <strong>OIDC client ID + issuer URL</strong></li>
              <li><strong>Email domain(s)</strong> that should authenticate via SSO (e.g. <code>@example.com</code>)</li>
              <li><strong>Default role</strong> for new SSO sign-ins (operator / executive_sponsor / read_only)</li>
              <li><strong>Approver:</strong> a tenant admin contact who can confirm the configuration before AbarVa flips it live</li>
            </ol>
            <p
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}99`,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              AbarVa typically completes SSO configuration within two business days of receiving complete details. You will receive a verification email when the federation is live and ready for sign-in.
            </p>
          </section>

          <section
            data-sso-unlocks="true"
            style={{
              background: COLORS.skyPale,
              borderLeft: `4px solid ${COLORS.navy}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              What this unlocks
            </h2>
            <ul
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 14,
                color: COLORS.ink,
                margin: 0,
                paddingLeft: SPACING.lg,
                lineHeight: 1.8,
              }}
            >
              <li>
                <strong>Invite pipeline.</strong> Tenant admins can invite users by email; invitees sign in via SSO.
              </li>
              <li>
                <strong>Maestro access to Programs.</strong> Engagement owners can be invited to drive Programs work.
              </li>
              <li>
                <strong>Sponsor access to Tower briefs.</strong> Executive sponsors can read scorecards and pressure cards.
              </li>
              <li>
                <strong>Cross-tenant role assignment.</strong> Platform admins can manage role assignments across tenants.
              </li>
            </ul>
            <p style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}cc`, margin: 0, lineHeight: 1.6 }}>
              Until SSO is configured, the user roster is read-only and reflects deterministic seed data. Live invite and revoke pipelines come online with Wave 27 once SSO is live and the audit event store ships.
            </p>
          </section>

          <Link
            href="/admin/users-access"
            data-sso-back-link="true"
            style={{
              alignSelf: 'flex-start',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.navy,
              textDecoration: 'none',
              padding: `${SPACING.xs} ${SPACING.md}`,
              borderRadius: RADIUS.sm,
              border: `1px solid ${COLORS.navy}40`,
            }}
          >
            ← Back to Users & Access
          </Link>
        </div>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
