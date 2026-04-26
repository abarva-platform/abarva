import React from 'react';
import { LinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';

interface LinkedProgramBadgeProps {
  view: LinkedProgramBadgeView;
}

export function LinkedProgramBadge({ view }: LinkedProgramBadgeProps) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 12px',
      backgroundColor: '#EEF2F8',
      border: '1px solid #1B2B5C',
      borderRadius: '4px',
      fontSize: '11px',
      color: '#1B2B5C',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <span style={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        LINKED PROGRAMME
      </span>
      <span style={{ color: '#0A0C12', fontWeight: 500 }}>
        {view.programCode} · {view.programName}
      </span>
      {view.routeHint ? (
        <a
          href={view.routeHint}
          style={{ color: '#1B2B5C', textDecoration: 'underline', fontSize: '11px' }}
        >
          {view.ctaLabel}
        </a>
      ) : (
        <span style={{ color: '#525866' }}>{view.ctaLabel}</span>
      )}
    </div>
  );
}
