'use client';

// ProgramBriefPanel · Surface 1 of Programs Strict Completion v1.2
//
// Right-pane companion to StewardChat. In this PR it shows a placeholder
// awaiting-extraction state; PR2 (structured artifact extraction) wires
// it to the streaming brief assembled by Steward as the conversation
// progresses. By the time Steward says "Shall I register?" this panel
// will show the complete brief ready to commit.

import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

export interface ProgramBriefDraft {
  programName: string | null;
  problemStatement: string | null;
  targetOutcome: string | null;
  timeline: string | null;
  classification: string | null;
  matchedPatternId: string | null;
  sponsor: string | null;
  lead: string | null;
  crossProgramDependencies: string[];
}

export const EMPTY_BRIEF: ProgramBriefDraft = {
  programName: null,
  problemStatement: null,
  targetOutcome: null,
  timeline: null,
  classification: null,
  matchedPatternId: null,
  sponsor: null,
  lead: null,
  crossProgramDependencies: [],
};

interface BriefRowProps {
  label: string;
  value: string | null;
}

function BriefRow({ label, value }: BriefRowProps) {
  const filled = value !== null && value !== '';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 12,
        padding: '8px 0',
        borderBottom: `1px solid rgba(12,26,58,0.06)`,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: BrandColors.stone,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          color: filled ? BrandColors.inkBlack : BrandColors.stone,
          fontStyle: filled ? 'normal' : 'italic',
          lineHeight: 1.5,
        }}
      >
        {filled ? value : 'awaiting from Steward'}
      </span>
    </div>
  );
}

export interface ProgramBriefPanelProps {
  brief: ProgramBriefDraft;
  /** True once the user has confirmed and the registration tool is in flight. */
  registering?: boolean;
}

export function ProgramBriefPanel({ brief, registering = false }: ProgramBriefPanelProps) {
  return (
    <aside
      style={{
        background: BrandColors.paper,
        border: `1px solid rgba(12,26,58,0.12)`,
        borderRadius: 10,
        padding: '20px 22px',
        fontFamily: BrandTypography.sans,
        color: BrandColors.inkBlack,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
        minHeight: 0,
      }}
      aria-label="Program brief"
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: BrandColors.stone,
            fontWeight: 700,
          }}
        >
          Program brief
        </span>
        <h2
          style={{
            fontFamily: BrandTypography.serif,
            fontSize: 22,
            fontWeight: 400,
            color: BrandColors.inkBlack,
            margin: 0,
          }}
        >
          {brief.programName ?? 'Untitled program'}
        </h2>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <BriefRow label="Problem" value={brief.problemStatement} />
        <BriefRow label="Outcome" value={brief.targetOutcome} />
        <BriefRow label="Timeline" value={brief.timeline} />
        <BriefRow label="Classification" value={brief.classification} />
        <BriefRow label="Matched pattern" value={brief.matchedPatternId} />
        <BriefRow label="Sponsor" value={brief.sponsor} />
        <BriefRow label="Lead" value={brief.lead} />
      </div>

      {brief.crossProgramDependencies.length > 0 ? (
        <section>
          <span
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: BrandColors.stone,
              fontWeight: 600,
            }}
          >
            Cross-program dependencies
          </span>
          <ul style={{ margin: '6px 0 0', paddingLeft: '1.1em', fontSize: 13, lineHeight: 1.6 }}>
            {brief.crossProgramDependencies.map((dep) => (
              <li key={dep}>{dep}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: `1px dashed rgba(12,26,58,0.16)`,
          fontFamily: BrandTypography.mono,
          fontSize: 11,
          color: BrandColors.stone,
        }}
      >
        {registering
          ? 'Registering program… Steward will confirm once the API succeeds.'
          : 'Brief assembles as Steward extracts each piece from your conversation.'}
      </footer>
    </aside>
  );
}
