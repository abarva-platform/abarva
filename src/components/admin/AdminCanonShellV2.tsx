import type { ReactNode } from 'react';
import { COLORS } from '@/lib/design/design-tokens';
import { AdminSidebar } from './AdminSidebar';
import { buildPortfolioAlerts } from '@/lib/reasoning/portfolio-alerts';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  agentRail: ReactNode;
}

export function AdminCanonShellV2({ children, agentRail }: AdminCanonShellV2Props) {
  // Count high-severity alerts for the Reasoning nav badge.
  // buildPortfolioAlerts() is pure / deterministic — no IO, safe to call
  // in any server component. We treat 'high' as the critical tier because
  // PortfolioAlert.severity tops out at 'high'.
  const alerts = buildPortfolioAlerts();
  const reasoningAlertCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 320px',
        minHeight: '100vh',
        background: COLORS.cream,
      }}
      data-admin-shell="canon-v2"
    >
      <AdminSidebar reasoningAlertCount={reasoningAlertCount} />
      {children}
      {agentRail}
    </div>
  );
}
