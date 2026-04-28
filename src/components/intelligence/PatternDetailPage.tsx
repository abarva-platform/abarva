'use client';

// Shell-native Intelligence pattern detail reading view.
// INT-DTL: Accepts a pattern prop — handles validated, in-review, candidate, deprecated statuses.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Pattern shape accepted by this component ─────────────────────────────────

type PatternStatus = 'validated' | 'in-review' | 'candidate' | 'deprecated' | 'emerging';
type PatternTier = 'T1' | 'T2' | 'T3';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface PatternDetailProgram {
  id: string;
  displayId?: string;
  name: string;
  phase: string | number;
  phaseLabel?: string;
  href?: string;
}

interface PatternDetailShape {
  id: string;
  name: string;
  tier: PatternTier;
  status: PatternStatus;
  lastReviewed: string;
  usedInPrograms: number;
  sentinelVerdict: {
    status: PatternStatus;
    confidence: ConfidenceLevel;
    verdictDate: string;
    evidenceSources: number;
    note: string;
  };
  sections: Array<{ heading: string; body: string }>;
  usedByPrograms: PatternDetailProgram[];
  agentQuote: string;
  agentContext: string;
  actions: Array<{ letter: 'A' | 'B' | 'C'; text: string; detail?: string }>;
}

// ─── Status-aware verdict card colors ────────────────────────────────────────

function getVerdictColors(status: PatternStatus): {
  bg: string;
  border: string;
  accentColor: string;
  pillBg: string;
  pillText: string;
  pillLabel: string;
  confidenceBg: string;
} {
  switch (status) {
    case 'validated':
      return {
        bg: SHELL.MINT_BG,
        border: SHELL.MINT_LINE,
        accentColor: SHELL.MINT_TEXT,
        pillBg: SHELL.MINT_TEXT,
        pillText: '#fff',
        pillLabel: 'Validated',
        confidenceBg: 'rgba(42,90,58,0.12)',
      };
    case 'in-review':
      return {
        bg: SHELL.BLUE_BG,
        border: SHELL.BLUE_LINE,
        accentColor: '#2a4a7a',
        pillBg: '#2a4a7a',
        pillText: '#fff',
        pillLabel: 'IN REVIEW',
        confidenceBg: 'rgba(42,74,122,0.12)',
      };
    case 'candidate':
      return {
        bg: SHELL.GRAY_BG,
        border: SHELL.GRAY_LINE,
        accentColor: SHELL.GRAY_TEXT,
        pillBg: SHELL.GRAY_TEXT,
        pillText: '#fff',
        pillLabel: 'CANDIDATE',
        confidenceBg: 'rgba(139,135,121,0.12)',
      };
    case 'deprecated':
      return {
        bg: SHELL.RUST_BG,
        border: '#d4a48a',
        accentColor: SHELL.RUST_TEXT,
        pillBg: SHELL.RUST_TEXT,
        pillText: '#fff',
        pillLabel: 'Deprecated',
        confidenceBg: 'rgba(138,62,34,0.12)',
      };
    default:
      return {
        bg: SHELL.PEACH_BG,
        border: SHELL.PEACH_LINE,
        accentColor: SHELL.PEACH_TEXT,
        pillBg: SHELL.PEACH_TEXT,
        pillText: '#fff',
        pillLabel: 'Emerging',
        confidenceBg: 'rgba(160,109,40,0.12)',
      };
  }
}

// ─── Status pill label (header area) ─────────────────────────────────────────

function getStatusPillStyle(status: PatternStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'validated':
      return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Validated' };
    case 'in-review':
      return { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'In review' };
    case 'candidate':
      return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Candidate' };
    case 'deprecated':
      return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, label: 'Deprecated' };
    default:
      return { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Emerging' };
  }
}

// ─── Sentinel verdict card ────────────────────────────────────────────────────

function SentinelVerdictCard({ pattern }: { pattern: PatternDetailShape }) {
  const v = pattern.sentinelVerdict;
  const colors = getVerdictColors(v.status);

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: '20px',
        maxWidth: 720,
        marginTop: 24,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        {/* Sn glyph */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: colors.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1,
            }}
          >
            Sn
          </span>
        </div>

        {/* Label */}
        <span
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: colors.accentColor,
            flex: 1,
          }}
        >
          Sentinel Verdict
        </span>

        {/* Status pill */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: colors.pillBg,
            color: colors.pillText,
            fontFamily: v.status === 'in-review' || v.status === 'candidate' ? SHELL.MONO : SHELL.SANS,
            fontSize: v.status === 'in-review' || v.status === 'candidate' ? 9.5 : 11,
            fontWeight: 600,
            letterSpacing: v.status === 'in-review' || v.status === 'candidate' ? '0.06em' : undefined,
            textTransform: v.status === 'in-review' || v.status === 'candidate' ? 'uppercase' : undefined,
            lineHeight: 1.6,
          }}
        >
          {colors.pillLabel}
        </span>

        {/* Confidence badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: colors.confidenceBg,
            color: colors.accentColor,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          {v.confidence} confidence
        </span>
      </div>

      {/* Date + evidence */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          marginBottom: 10,
          letterSpacing: '0.04em',
        }}
      >
        {v.verdictDate} · {v.evidenceSources} evidence source{v.evidenceSources !== 1 ? 's' : ''} reviewed
      </div>

      {/* Note */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {v.note}
      </p>
    </div>
  );
}

// ─── Used by programs ─────────────────────────────────────────────────────────

function UsedByPrograms({ pattern }: { pattern: PatternDetailShape }) {
  const programs = pattern.usedByPrograms;
  return (
    <div style={{ marginTop: 40, maxWidth: 720 }}>
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 12,
        }}
      >
        Used in {programs.length} program{programs.length !== 1 ? 's' : ''}
      </div>

      {/* Program rows */}
      <div
        style={{
          borderRadius: 8,
          border: `1px solid ${SHELL.CARD_LINE}`,
          background: SHELL.CARD_WHITE,
          overflow: 'hidden',
        }}
      >
        {programs.map((prog, i) => {
          const programId = prog.id;
          const displayId = prog.displayId ?? prog.id;
          const phaseStr = typeof prog.phase === 'number'
            ? `P${prog.phase}${prog.phaseLabel ? ' ' + prog.phaseLabel : ''}`
            : prog.phase;
          const href = prog.href ?? `/programs/${programId}`;

          return (
            <Link
              key={prog.id}
              href={href}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 120px',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: i < programs.length - 1 ? `1px solid ${SHELL.CARD_LINE_SOFT}` : 'none',
                textDecoration: 'none',
                color: SHELL.INK,
                gap: 12,
                cursor: 'pointer',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = SHELL.PAPER_SOFT;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              {/* Program ID */}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayId}
              </span>

              {/* Program name */}
              <span
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 13,
                  color: SHELL.INK,
                  fontWeight: 500,
                }}
              >
                {prog.name}
              </span>

              {/* Phase */}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.PEACH_TEXT,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {phaseStr}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PatternDetailPageProps {
  pattern: PatternDetailShape;
}

export function PatternDetailPage({ pattern }: PatternDetailPageProps) {
  const statusStyle = getStatusPillStyle(pattern.status);
  const tierLabel = pattern.tier === 'T3' ? 'Use-case' : pattern.tier === 'T2' ? 'Capability' : 'Foundation';

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · ${pattern.id} · ${pattern.name}`,
      }}
      middleStrip={
        <FilterPillStrip
          pills={[
            { key: 'all', label: 'All' },
            { key: pattern.tier.toLowerCase(), label: `${pattern.tier} · ${tierLabel}`, active: true },
          ]}
        />
      }
    >
      {/* Sentinel column */}
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={pattern.agentQuote}
        agentContext={pattern.agentContext}
        actions={pattern.actions}
      />

      {/* Main reading area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '32px 48px',
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/intelligence"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
              letterSpacing: '0.06em',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = SHELL.INK;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = SHELL.INK_MUTED;
            }}
          >
            ← Pattern Library
          </Link>
        </div>

        {/* Pattern header */}
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              marginBottom: 6,
            }}
          >
            {pattern.tier} · {tierLabel} pattern · {pattern.status}
          </div>

          {/* ID */}
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 13,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            {pattern.id}{' '}
            {pattern.id === 'T3-H01' && <span style={{ color: SHELL.AMBER_DOT }}>★</span>}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {pattern.name}
          </h1>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              Reviewed {pattern.lastReviewed}
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              {pattern.usedInPrograms} program{pattern.usedInPrograms !== 1 ? 's' : ''}
            </span>
            {/* Status pill */}
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: statusStyle.bg,
                color: statusStyle.text,
                fontFamily: SHELL.SANS,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Reading sections */}
        <div style={{ maxWidth: 720 }}>
          {pattern.sections.map((section, i) => (
            <div key={section.heading}>
              <h2
                style={{
                  fontFamily: SHELL.SERIF,
                  fontSize: 17,
                  fontWeight: 700,
                  color: SHELL.INK,
                  margin: '0 0 8px',
                  lineHeight: 1.3,
                }}
              >
                {section.heading}
              </h2>
              <p
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 15,
                  color: SHELL.INK,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {section.body}
              </p>
              {i < pattern.sections.length - 1 && (
                <div
                  style={{
                    borderTop: `1px solid ${SHELL.CARD_LINE}`,
                    margin: '24px 0',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Sentinel verdict card */}
        <SentinelVerdictCard pattern={pattern} />

        {/* Used by programs */}
        <UsedByPrograms pattern={pattern} />
      </div>
    </AppShell>
  );
}
