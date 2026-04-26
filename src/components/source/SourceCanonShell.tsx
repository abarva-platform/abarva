import type { CSSProperties, ReactNode } from 'react';
import type { SourceRouteKey } from '@/lib/source/types';
import { SourceFoundationShell } from './SourceFoundationShell';

interface SourceCanonShellProps {
  activeRoute: SourceRouteKey;
  title: string;
  summary: string;
  children: ReactNode;
}

const stripStyle: CSSProperties = {
  marginTop: 14,
  background: '#FFFFFF',
  border: '1px solid #E8E6E1',
  borderRadius: 10,
  padding: '10px 12px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
};

const badgeStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: '#1B2B5C',
};

const flowStyle: CSSProperties = {
  fontSize: 13,
  color: '#1F2433',
};

const caveatStyle: CSSProperties = {
  marginLeft: 'auto',
  fontSize: 12,
  color: '#706D66',
};

export function SourceCanonShell({
  activeRoute,
  title,
  summary,
  children,
}: SourceCanonShellProps) {
  return (
    <SourceFoundationShell activeRoute={activeRoute} title={title} summary={summary}>
      <div style={stripStyle}>
        <span style={badgeStyle}>Nexus commercial flow</span>
        <span style={flowStyle}>
          Event → Pricing → Risk → BAFO → Readiness → Missions → Signals
        </span>
        <span style={caveatStyle}>
          Deterministic seeded guidance. No live vendor upload or savings claim.
        </span>
      </div>
      {children}
    </SourceFoundationShell>
  );
}
