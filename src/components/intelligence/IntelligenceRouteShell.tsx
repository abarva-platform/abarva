import React from 'react';

interface IntelligenceRouteShellProps {
  children: React.ReactNode;
  tenantName?: string;
  pageMode?: 'index' | 'pattern_detail';
  caveat?: string;
}

export function IntelligenceRouteShell({
  children,
  tenantName = 'Apex Retail',
  pageMode = 'index',
  caveat = 'Deterministic pattern detection. Not client-specific live intelligence. All signals are seed data.',
}: IntelligenceRouteShellProps) {
  return (
    <div
      data-page-mode={pageMode}
      style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#FBFAF7', minHeight: '100vh' }}
    >
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
          INTELLIGENCE · PATTERN DETECTION
        </span>
        <span>·</span>
        <span style={{ color: '#0A0C12', fontWeight: 500 }}>{tenantName}</span>
        <span style={{ marginLeft: 'auto', color: '#9AA3B2', fontSize: '10px' }}>{caveat}</span>
      </div>
      {children}
    </div>
  );
}
