'use client';

// Shell-native Intelligence pattern detail reading view.
// INT-DTL-VALIDATED: T3-H01 Ambient AI in Retail — reading layout.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { T3_H01_PATTERN } from '@/lib/intelligence/shell-pattern-detail-fixture';

// ─── Sentinel verdict card ────────────────────────────────────────────────────

function SentinelVerdictCard() {
  const v = T3_H01_PATTERN.sentinelVerdict;
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
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
            background: SHELL.MINT_TEXT,
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
            color: SHELL.MINT_TEXT,
            flex: 1,
          }}
        >
          Sentinel Verdict
        </span>

        {/* Validated pill */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: SHELL.MINT_TEXT,
            color: '#fff',
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          Validated
        </span>

        {/* Confidence badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(42,90,58,0.12)',
            color: SHELL.MINT_TEXT,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            lineHeight: 1.6,
          }}
        >
          High confidence
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
        {v.verdictDate} · {v.evidenceSources} evidence sources reviewed
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

function UsedByPrograms() {
  const programs = T3_H01_PATTERN.usedByPrograms;
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
        Used in {programs.length} programs
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
        {programs.map((prog, i) => (
          <Link
            key={prog.id}
            href={`/programs/${prog.id}`}
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
              {prog.id}
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

            {/* Phase pill */}
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.PEACH_TEXT,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {prog.phase}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PatternDetailPage() {
  const pattern = T3_H01_PATTERN;

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
            { key: 't3', label: 'T3 · Use-case', active: true },
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
        surface="intelligence"
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
            {pattern.tier} · Use-case pattern · {pattern.status}
          </div>

          {/* ID + star */}
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
            <span style={{ color: SHELL.AMBER_DOT }}>★</span>
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
              {pattern.usedInPrograms} programs
            </span>
            {/* Status pill */}
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: SHELL.MINT_BG,
                color: SHELL.MINT_TEXT,
                fontFamily: SHELL.SANS,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              Validated
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
        <SentinelVerdictCard />

        {/* Used by programs */}
        <UsedByPrograms />
      </div>
    </AppShell>
  );
}
