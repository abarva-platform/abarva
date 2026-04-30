import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminSidebar } from './AdminSidebar';
import { AppShell } from '@/components/shell/AppShell';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  agentRail: ReactNode;
}

export function AdminCanonShellV2({ children, agentRail }: AdminCanonShellV2Props) {
  const alerts = buildPortfolioAlerts();
  const reasoningAlertCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName: 'Apex Retail Group',
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
        {children}
        {agentRail}
      </div>
    </AppShell>
  );
}
