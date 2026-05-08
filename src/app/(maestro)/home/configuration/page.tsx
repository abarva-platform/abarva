// /home/configuration · placeholder per Home Refinement Package
// HOME_PANELS_INVENTORY.md panel #7. The package describes this as
// "platform configuration that doesn't fit elsewhere — feature flags,
// integration secrets, compliance settings, audit log access."
//
// Today the existing /admin sub-routes (users-access · policies ·
// invite · audit · production-readiness · etc.) cover the underlying
// concerns; this placeholder routes the canonical /home/configuration
// URL to a directory of those tools rather than 404.

import Link from 'next/link';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';

export const metadata = {
  title: 'Configuration | AbarVa Home',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminLink {
  label: string;
  href: string;
  description: string;
}

const ADMIN_LINKS: ReadonlyArray<AdminLink> = [
  {
    label: 'Users & Access',
    href: '/admin/users-access',
    description: 'Roles, access grants, audit-able permission changes.',
  },
  {
    label: 'Invite a User',
    href: '/admin/invite',
    description: 'Invite a new tenant member.',
  },
  {
    label: 'Policies',
    href: '/admin/policies',
    description: 'Tenant policies, compliance settings.',
  },
  {
    label: 'Audit Log',
    href: '/admin/audit',
    description: 'Tenant-scoped audit history.',
  },
  {
    label: 'Production Readiness',
    href: '/admin/production-readiness',
    description: 'Pre-production checklist · demo / pilot / production.',
  },
];

export default async function ConfigurationPage() {
  const tenant = await resolveAdminTenant();
  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={tenant.tenantName}>
      <div
        style={{
          padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ marginBottom: SPACING.xl }}>
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
            Home · Configuration
          </div>
          <h1
            style={{
              fontFamily: FONT.body,
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              margin: 0,
              marginBottom: SPACING.xs,
            }}
          >
            Platform configuration
          </h1>
          <p style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.muted, margin: 0 }}>
            Admin tools that don&apos;t fit elsewhere. Roles, policies,
            audit, production readiness.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: SPACING.sm,
          }}
        >
          {ADMIN_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'block',
                border: BORDER.hairline,
                background: COLORS.card,
                borderRadius: RADIUS.md,
                padding: SPACING.lg,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <h3
                style={{
                  fontFamily: FONT.body,
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.ink,
                  margin: 0,
                  marginBottom: SPACING.xs,
                }}
              >
                {l.label}
              </h3>
              <p
                style={{
                  fontFamily: FONT.body,
                  fontSize: 12,
                  color: COLORS.muted,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {l.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AdminCanonShellV2>
  );
}
