import React from 'react';

interface SourceRouteShellProps {
  children: React.ReactNode;
  pageMode?: 'index' | 'events' | 'event_detail';
  eventName?: string;
  tenantName?: string;
  hasLinkedProgram?: boolean;
  linkedProgramCode?: string;
  caveat?: string;
  contextUsed?: string[];
  suggestedActions?: Array<{ label: string; href: string; description?: string }>;
  customAskPrompt?: string;
}

export function SourceRouteShell({
  children,
  pageMode = 'index',
  eventName,
  tenantName,
  hasLinkedProgram = false,
  linkedProgramCode,
  caveat = 'Deterministic seed data. No live sourcing signals.',
  contextUsed = [],
  suggestedActions = [],
  customAskPrompt = 'Ask Nexus about this program, gate, workshop, evidence, or readiness state...',
}: SourceRouteShellProps) {
  const modeLabel =
    pageMode === 'index' ? 'SOURCE · OUTSOURCING INTELLIGENCE' :
    pageMode === 'events' ? 'SOURCE · EVENT PORTFOLIO' :
    'SOURCE · COMMERCIAL EVENT DETAIL';

  const defaultActions = suggestedActions.length > 0 ? suggestedActions : [
    {
      label: 'Review gate blockers',
      href: '#source-route-gate-blockers',
      description: 'Inspect top blockers for the active stage.',
    },
    {
      label: 'Open workflow checklist',
      href: '#source-route-workflow-checklist',
      description: 'Review next milestones before moving forward.',
    },
    {
      label: 'Show evidence gaps',
      href: '#source-route-evidence-gaps',
      description: 'Reveal missing artifacts and low-confidence claims.',
    },
  ];

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
      <div style={{ borderBottom: '1px solid #E8E6E1', backgroundColor: '#FFFFFF', padding: '10px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6A7280', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Context used
            </span>
            {contextUsed.length > 0 ? (
              contextUsed.map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: '11px',
                    border: '1px solid #CFD7E2',
                    borderRadius: 999,
                    padding: '2px 8px',
                    background: '#F3F6FB',
                    color: '#1F2433',
                    fontWeight: 600,
                  }}
                >
                  {item}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: '#8A94A6' }}>
                Context is currently seeded for this route and includes event, stage, gate, and artifact availability.
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: '11px', color: '#6A7280', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Suggested actions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {defaultActions.slice(0, 3).map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  style={{
                    textDecoration: 'none',
                    border: '1px solid #1B2B5C',
                    borderRadius: 999,
                    background: '#EEF3FF',
                    color: '#1F2433',
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title={action.description}
                >
                  {action.label}
                </a>
              ))}
            </div>
            <label htmlFor="nexus-custom-input" style={{ margin: 0, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <input
                id="nexus-custom-input"
                type="text"
                placeholder={customAskPrompt}
                readOnly
                style={{
                  border: '1px solid #C8D3E3',
                  borderRadius: 8,
                  background: '#F4F7FB',
                  color: '#6B7280',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  padding: '6px 10px',
                  minWidth: 260,
                }}
              />
              <span
                style={{
                  borderRadius: 999,
                  padding: '7px 12px',
                  border: '1px solid #2D3D64',
                  fontSize: '11px',
                  color: '#334155',
                  background: '#F2F5FF',
                  fontWeight: 600,
                }}
              >
                Submit (disabled until runtime)
              </span>
            </label>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
