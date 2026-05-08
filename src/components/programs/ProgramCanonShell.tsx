import type { CSSProperties, ReactNode } from 'react';

interface ProgramCanonShellProps {
  title: string;
  summary: string;
  children: ReactNode;
}

const rootStyle: CSSProperties = {
  background: '#FBFAF7',
  minHeight: '100vh',
  padding: '20px 24px 48px',
  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  color: '#0A0C12',
};

const maxStyle: CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

// Compact shell header per mockup: serif h1 with the program identity
// and a single subtitle line. No big eyebrow, no oversized workflow
// orientation card — the workflow markers move to a small footer caveat
// so the journey hero in the workbench is the first visible spine.
const titleStyle: CSSProperties = {
  margin: '0',
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: 30,
  lineHeight: 1.18,
  fontWeight: 600,
  color: '#0A0C12',
};

const summaryStyle: CSSProperties = {
  margin: '6px 0 18px',
  color: '#525866',
  fontSize: 14,
  lineHeight: 1.5,
  maxWidth: 920,
};

const footerCaveatStyle: CSSProperties = {
  marginTop: 28,
  fontSize: 11,
  color: '#7A7468',
  fontFamily: '"Inter", sans-serif',
  letterSpacing: '0.02em',
};

export function ProgramCanonShell({ title, summary, children }: ProgramCanonShellProps) {
  return (
    <div style={rootStyle} data-canon="program-shell">
      <div style={maxStyle}>
        <h1 style={titleStyle}>{title}</h1>
        <p style={summaryStyle}>{summary}</p>
        {children}
        {/* Workflow orientation marker — kept terse per the canon-trim
         *  redesign so the page chrome above the workbench stays light.
         *  Required marker text is preserved for the route-shell test:
         *  Journey → Phase → Gate → Nexus next action → Deliverables/Evidence → Missions */}
        <p style={footerCaveatStyle}>
          Workflow orientation · Journey → Phase → Gate → Nexus next action → Deliverables/Evidence → Missions ·
          Deterministic route shell. No fake approvals or live actions.
        </p>
      </div>
    </div>
  );
}
