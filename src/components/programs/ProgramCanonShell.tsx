import type { CSSProperties, ReactNode } from 'react';

interface ProgramCanonShellProps {
  title: string;
  summary: string;
  children: ReactNode;
}

const rootStyle: CSSProperties = {
  background: '#FBFAF7',
  minHeight: '100vh',
  padding: '24px 24px 48px',
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: '#0A0C12',
};

const maxStyle: CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#525866',
  fontWeight: 700,
};

const titleStyle: CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 30,
  lineHeight: 1.2,
  fontWeight: 600,
};

const summaryStyle: CSSProperties = {
  margin: 0,
  color: '#1F2433',
  fontSize: 15,
  lineHeight: 1.55,
  maxWidth: 920,
};

const stripStyle: CSSProperties = {
  marginTop: 16,
  marginBottom: 16,
  background: '#FFFFFF',
  border: '1px solid #E8E6E1',
  borderRadius: 10,
  padding: '12px 14px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
};

const stripLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  fontWeight: 700,
  color: '#1B2B5C',
};

const stripTextStyle: CSSProperties = {
  fontSize: 13,
  color: '#1F2433',
};

const stripCaveatStyle: CSSProperties = {
  marginLeft: 'auto',
  fontSize: 12,
  color: '#525866',
};

export function ProgramCanonShell({ title, summary, children }: ProgramCanonShellProps) {
  return (
    <div style={rootStyle} data-canon="program-shell">
      <div style={maxStyle}>
        <div style={eyebrowStyle}>Program workflow · Nexus-led</div>
        <h1 style={titleStyle}>{title}</h1>
        <p style={summaryStyle}>{summary}</p>
        <div style={stripStyle}>
          <span style={stripLabelStyle}>Workflow orientation</span>
          <span style={stripTextStyle}>
            Journey → Phase → Gate → Nexus next action → Deliverables/Evidence → Missions
          </span>
          <span style={stripCaveatStyle}>
            Deterministic route shell. No fake approvals or live actions.
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

