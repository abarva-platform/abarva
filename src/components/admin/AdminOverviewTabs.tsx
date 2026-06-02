// AdminOverviewTabs — Snowflake-style horizontal tab strip directly below the
// /admin page header. This is the single sub-nav pattern for Setup per
// SETUP_AUDIT_2026-05-30_VERDICT §5.3 / Wave 1 PR-3. It replaces the legacy
// SubNavStrip embedded inside SetupTenantPage et al.
//
// Tabs:
//   - Overview  → /admin            (default)
//   - Tenant    → /admin?tab=tenant (the demoted /admin/tenant content)
//
// The tab bar uses `<a href>` so it works under Server Components without
// client-side state.

import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export type AdminOverviewTabId = 'overview' | 'tenant';

interface AdminOverviewTab {
  id: AdminOverviewTabId;
  label: string;
  href: string;
}

const TABS: ReadonlyArray<AdminOverviewTab> = [
  { id: 'overview', label: 'Overview', href: '/admin' },
  { id: 'tenant', label: 'Tenant', href: '/admin?tab=tenant' },
];

export function resolveAdminOverviewTab(raw: string | undefined): AdminOverviewTabId {
  return raw === 'tenant' ? 'tenant' : 'overview';
}

export function AdminOverviewTabs({ activeTab }: { activeTab: AdminOverviewTabId }) {
  return (
    <nav
      data-component="AdminOverviewTabs"
      aria-label="Admin overview sections"
      style={{
        display: 'flex',
        gap: SPACING.xs,
        borderBottom: `1px solid ${COLORS.ink}14`,
        padding: `0 ${SPACING.xxl}`,
        background: COLORS.cream,
        fontFamily: TYPOGRAPHY.mono,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <a
            key={tab.id}
            href={tab.href}
            data-tab={tab.id}
            data-active={isActive ? 'true' : 'false'}
            style={{
              padding: `${SPACING.sm} ${SPACING.md}`,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: isActive ? COLORS.navy : `${COLORS.ink}80`,
              textDecoration: 'none',
              borderBottom: isActive
                ? `2px solid ${COLORS.navy}`
                : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
