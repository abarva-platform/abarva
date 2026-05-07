import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminSidebar } from './AdminSidebar';
import { AppShell } from '@/components/shell/AppShell';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  agentRail: ReactNode;
  /** Tenant name for the top bar. Server-component callers should resolve
   *  via getActiveClientRow() and pass the name here. */
  tenantName?: string;
}

export function AdminCanonShellV2({ children, agentRail, tenantName = 'Apex Retail Group' }: AdminCanonShellV2Props) {
  return (
    <AppShell
      surface="setup"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'Setup / Admin',
      }}
    >
      <style>
        {`
          @media (max-width: 900px) {
            [data-admin-shell="canon-v2"] {
              grid-template-columns: minmax(0, 1fr) !important;
              height: auto !important;
              min-height: calc(100vh - 48px) !important;
              overflow: visible !important;
            }
            [data-admin-shell="canon-v2"] [data-admin-main-scroll] {
              overflow: visible !important;
            }
            [data-admin-shell="canon-v2"] [data-admin-agent-rail] {
              display: none !important;
            }
          }
        `}
      </style>
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
        <AdminSidebar />
        <div
          data-admin-main-scroll
          style={{ overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}
        >
          {children}
        </div>
        <aside
          aria-label="Steward setup agent"
          data-admin-agent-rail
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
