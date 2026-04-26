import React from 'react';

interface SourceRouteShellProps {
  children: React.ReactNode;
  pageMode?: 'index' | 'events' | 'event_detail';
  eventName?: string;
  tenantName?: string;
  hasLinkedProgram?: boolean;
  linkedProgramCode?: string;
  caveat?: string;
}

export function SourceRouteShell({
  children,
  pageMode = 'index',
  eventName,
  tenantName,
  hasLinkedProgram = false,
  linkedProgramCode,
  caveat = 'Deterministic seed data. No live sourcing signals.',
}: SourceRouteShellProps) {
  const modeLabel =
    pageMode === 'index' ? 'SOURCE · OUTSOURCING INTELLIGENCE' :
    pageMode === 'events' ? 'SOURCE · EVENT PORTFOLIO' :
    'SOURCE · COMMERCIAL EVENT DETAIL';

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
          {modeLabel}
        </span>
        {tenantName && (
          <>
            <span>·</span>
            <span style={{ color: '#0A0C12', fontWeight: 500 }}>{tenantName}</span>
          </>
        )}
        {eventName && (
          <>
            <span>·</span>
            <span style={{ color: '#0A0C12' }}>{eventName}</span>
          </>
        )}
        {hasLinkedProgram && linkedProgramCode && (
          <span style={{
            marginLeft: '8px',
            padding: '2px 6px',
            backgroundColor: '#EEF2F8',
            border: '1px solid #1B2B5C',
            borderRadius: '3px',
            color: '#1B2B5C',
            fontSize: '10px',
            fontWeight: 600,
          }}>
            → {linkedProgramCode}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: '#9AA3B2', fontSize: '10px' }}>{caveat}</span>
      </div>
      {children}
    </div>
  );
}
