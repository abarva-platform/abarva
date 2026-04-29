'use client';

// ProgramBriefPanel · Surface 1 of Programs Strict Completion v1.2
//
// Right-pane companion to StewardChat. PR2 wires the reactive artifact
// channel: Steward emits structured artifacts (brief-field, pattern-match,
// cross-program-dependency, classification) which the workspace
// dispatches into the brief state below. The chat narrative stays
// conversational ("see the pattern card on your right"); the rich
// pattern card and field rows live here.

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

/**
 * Pattern-match card data dispatched by the `pattern-match` artifact.
 * Renders as a prominent card inside the brief panel — the canonical
 * "see the pattern card on your right" reference target.
 */
export interface PatternMatchCard {
  patternId: string;
  name: string;
  summary: string;
  successRatePct?: number;
  deploymentCount?: number;
  typicalDurationMonths?: number;
}

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
  /** Optional rich pattern card; rendered above the field rows when present. */
  patternMatch?: PatternMatchCard | null;
  /** True once the user has confirmed and the registration tool is in flight. */
  registering?: boolean;
}

function PatternMatchCardView({ card }: { card: PatternMatchCard }) {
  const stats: Array<{ label: string; value: string }> = [];
  if (typeof card.successRatePct === 'number') {
    stats.push({ label: 'success rate', value: `${card.successRatePct}%` });
  }
  if (typeof card.deploymentCount === 'number') {
    stats.push({ label: 'deployments', value: `${card.deploymentCount}` });
  }
  if (typeof card.typicalDurationMonths === 'number') {
    stats.push({ label: 'typical duration', value: `${card.typicalDurationMonths} mo` });
  }
  return (
    <a
      href={`/source/patterns/${card.patternId}`}
      style={{
        display: 'block',
        background: '#FFFFFF',
        border: `1px solid rgba(12,26,58,0.16)`,
        borderRadius: 8,
        padding: '14px 16px',
        textDecoration: 'none',
        color: BrandColors.inkBlack,
        boxShadow: '0 1px 3px rgba(12,26,58,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: BrandColors.signalBlue,
            fontWeight: 700,
          }}
        >
          Matched pattern
        </span>
        <span
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 11,
            color: BrandColors.stone,
          }}
        >
          {card.patternId}
        </span>
      </div>
      <div
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: 17,
          fontWeight: 500,
          color: BrandColors.inkBlack,
          lineHeight: 1.3,
          marginBottom: 6,
        }}
      >
        {card.name}
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: BrandTypography.sans,
          fontSize: 13,
          color: BrandColors.slate,
          lineHeight: 1.55,
        }}
      >
        {card.summary}
      </p>
      {stats.length > 0 ? (
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          {stats.map((s) => (
            <span
              key={s.label}
              style={{
                fontFamily: BrandTypography.mono,
                fontSize: 11,
                color: BrandColors.stone,
              }}
            >
              <span style={{ color: BrandColors.inkBlack, fontWeight: 600 }}>{s.value}</span>
              {' '}
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </a>
  );
}

export function ProgramBriefPanel({
  brief,
  patternMatch,
  registering = false,
}: ProgramBriefPanelProps) {
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

      {patternMatch ? <PatternMatchCardView card={patternMatch} /> : null}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <BriefRow label="Problem" value={brief.problemStatement} />
        <BriefRow label="Outcome" value={brief.targetOutcome} />
        <BriefRow label="Timeline" value={brief.timeline} />
        <BriefRow label="Classification" value={brief.classification} />
        {patternMatch ? null : <BriefRow label="Matched pattern" value={brief.matchedPatternId} />}
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
