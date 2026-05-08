import React from 'react';

interface TowerRouteShellProps {
  children: React.ReactNode;
  tenantName?: string;
  activeLens?: string;    // e.g. "Portfolio" | "Value" | "Risk" etc.
  caveat?: string;
}

export function TowerRouteShell({
  children,
  tenantName = 'Apex Retail',
  activeLens,
  caveat = 'Deterministic signals. No live procurement monitoring.',
}: TowerRouteShellProps) {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Orientation strip — primary agent: Atlas */}
      <div style={{
        borderBottom: '1px solid #e5e5e5',
        padding: '8px 24px',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px',
        color: '#525866',
      }}>
        {/* Agent badge */}
        <span style={{
          fontWeight: 700,
          color: '#FFFFFF',
          backgroundColor: '#1B2B5C',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
          padding: '2px 8px',
          borderRadius: '3px',
          fontSize: '10px',
        }}>
          ATLAS
        </span>
        <span style={{ fontWeight: 600, color: '#1B2B5C', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
          CONTROL TOWER · SIGNAL INTELLIGENCE · ATLAS
        </span>
        <span>·</span>
        <span style={{ color: '#0A0C12', fontWeight: 500 }}>{tenantName}</span>
        {activeLens && (
          <>
            <span>·</span>
            <span style={{ color: '#3B4B6B', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontSize: '10px' }}>
              {activeLens}
            </span>
          </>
        )}
        <span style={{ marginLeft: 'auto', color: '#9AA3B2', fontSize: '10px' }}>{caveat}</span>
      </div>
      {children}
    </div>
  );
}
