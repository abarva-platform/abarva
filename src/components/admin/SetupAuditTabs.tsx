/**
 * SetupAuditTabs · Wave 2 PR-2 · Snowflake-style sub-nav for /admin/audit.
 *
 * Server component. Tab switching is URL-searchParam driven
 * (`?tab=activity | isolation | approvals`). No client state, no
 * hydration. Mirrors the pattern used by ProductionReadinessTabs and
 * the connectors page.
 *
 * - Activity (default) — the existing audit ribbon view.
 * - Isolation         — IsolationLane (Wave 2 PR-2).
 * - Approvals         — audit ribbon filtered to source=approval
 *                       (PR-6 source filter preserved via the legacy
 *                       `?source=approval` query, so the source
 *                       filter chip on the activity view keeps
 *                       working alongside the tabs).
 */

import { SHELL } from '@/lib/shell/shell-tokens';

export type SetupAuditTabKey = 'activity' | 'isolation' | 'approvals';

interface TabMeta {
  key: SetupAuditTabKey;
  label: string;
  href: string;
}

const TABS: ReadonlyArray<TabMeta> = [
  { key: 'activity', label: 'Activity', href: '/admin/audit' },
  {
    key: 'isolation',
    label: 'Isolation',
    href: '/admin/audit?tab=isolation',
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/admin/audit?tab=approvals',
  },
];

export const SETUP_AUDIT_TAB_KEYS: ReadonlyArray<SetupAuditTabKey> = TABS.map(
  (t) => t.key,
);

export function isSetupAuditTab(
  value: string | null | undefined,
): value is SetupAuditTabKey {
  return (
    typeof value === 'string' &&
    (value === 'activity' || value === 'isolation' || value === 'approvals')
  );
}

interface Props {
  activeTab: SetupAuditTabKey;
}

export function SetupAuditTabs({ activeTab }: Props) {
  return (
    <nav
      aria-label="Audit sections"
      data-testid="setup-audit-tabs"
      style={{
        display: 'flex',
        gap: 6,
        padding: 6,
        background: SHELL.PAPER_SOFT,
        border: '1px solid ' + SHELL.CARD_LINE,
        borderRadius: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <a
            key={tab.key}
            href={tab.href}
            data-tab-key={tab.key}
            data-tab-active={isActive ? 'true' : 'false'}
            aria-current={isActive ? 'page' : undefined}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              fontFamily: SHELL.SANS,
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              background: isActive ? SHELL.CARD_WHITE : 'transparent',
              color: isActive ? SHELL.INK : SHELL.INK_SOFT,
              border: isActive
                ? '1px solid ' + SHELL.CARD_LINE
                : '1px solid transparent',
              lineHeight: 1.2,
              letterSpacing: '0.01em',
            }}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
