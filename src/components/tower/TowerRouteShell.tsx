import React from 'react';

interface TowerRouteShellProps {
  children: React.ReactNode;
  tenantName?: string;
  caveat?: string;
}

export function TowerRouteShell({
  children,
  tenantName = 'Apex Retail',
  caveat = 'Deterministic signals. No live procurement monitoring. All values are seed data.',
}: TowerRouteShellProps) {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#FBFAF7', minHeight: '100vh' }}>
      <div style={{
        borderBottom: '1px solid #E8E6E1',
        padding: '8px 24px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
        color: '#525866',
      }}>
        <span style={{ fontWeight: 600, color: '#1B2B5C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          CONTROL TOWER · SIGNAL INTELLIGENCE
        </span>
        <span>·</span>
        <span style={{ color: '#0A0C12', fontWeight: 500 }}>{tenantName}</span>
        <span style={{ marginLeft: 'auto', color: '#9AA3B2', fontSize: '10px' }}>{caveat}</span>
      </div>
      {children}
    </div>
  );
}
