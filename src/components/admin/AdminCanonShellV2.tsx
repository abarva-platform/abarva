import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminSidebar } from './AdminSidebar';
import { AppShell } from '@/components/shell/AppShell';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';
import { getActiveClientRow } from '@/lib/active-client';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  agentRail: ReactNode;
}

export async function AdminCanonShellV2({ children, agentRail }: AdminCanonShellV2Props) {
  const alerts = buildPortfolioAlerts();
  const reasoningAlertCount = alerts.filter((a) => a.severity === 'high').length;

  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantName = activeClient?.name ?? 'Apex Retail Group';

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
          gridTemplateColumns: '280px 1fr 320px',
          flex: 1,
          overflow: 'hidden',
          background: SHELL.PAPER,
        }}
        data-admin-shell="canon-v2"
      >
        <AdminSidebar reasoningAlertCount={reasoningAlertCount} />
        <div style={{ overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        {agentRail}
      </div>
    </AppShell>
  );
}
