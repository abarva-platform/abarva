import type { ReactNode } from 'react';
import { COLORS } from '@/lib/design/design-tokens';
import { AdminSidebar } from './AdminSidebar';

export interface AdminCanonShellV2Props {
  children: ReactNode;
  agentRail: ReactNode;
}

export function AdminCanonShellV2({ children, agentRail }: AdminCanonShellV2Props) {
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
      <AdminSidebar />
      {children}
      {agentRail}
    </div>
  );
}
