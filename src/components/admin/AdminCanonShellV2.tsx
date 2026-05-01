import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminSidebar } from './AdminSidebar';
import { AppShell } from '@/components/shell/AppShell';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  agentRail: ReactNode;
  /** Tenant name for the top bar. Server-component callers should resolve
   *  via getActiveClientRow() and pass the name here. */
  tenantName?: string;
}

export function AdminCanonShellV2({ children, agentRail, tenantName = 'Apex Retail Group' }: AdminCanonShellV2Props) {
  const alerts = buildPortfolioAlerts();
  const reasoningAlertCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'Setup / Admin',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr) minmax(360px, 28vw)',
          flex: 1,
          minHeight: 0,
          height: 'calc(100vh - 48px)',
          overflow: 'hidden',
          background: SHELL.PAPER,
        }}
        data-admin-shell="canon-v2"
      >
        <AdminSidebar reasoningAlertCount={reasoningAlertCount} />
        <div style={{ overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        <aside
          aria-label="Steward setup agent"
          style={{
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            overflow: 'hidden',
            borderLeft: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          {agentRail}
        </aside>
      </div>
    </AppShell>
  );
}
