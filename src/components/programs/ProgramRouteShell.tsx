import React from 'react';

interface ProgramRouteShellProps {
  children: React.ReactNode;
  tenantName?: string;
  tenantSlug?: string;
  pageMode?: 'list' | 'detail';
  programName?: string;
  caveat?: string;
}

export function ProgramRouteShell({
  children,
  tenantName = 'Apex Retail',
  tenantSlug: _ts = 'apex-retail', // accepted by callers; reserved for future URL generation
  pageMode = 'list',
  programName,
  caveat = 'Deterministic seed data. No live programme updates.',
}: ProgramRouteShellProps) {
  void _ts;
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
          PROGRAMME WORKFLOW · NEXUS-LED
        </span>
        <span>·</span>
        <span style={{ color: '#0A0C12', fontWeight: 500 }}>{tenantName}</span>
        {pageMode === 'detail' && programName && (
          <>
            <span>·</span>
            <span style={{ color: '#0A0C12' }}>{programName}</span>
          </>
        )}
        <span style={{ marginLeft: 'auto', color: '#9AA3B2', fontSize: '10px' }}>{caveat}</span>
      </div>
      {children}
    </div>
  );
}
