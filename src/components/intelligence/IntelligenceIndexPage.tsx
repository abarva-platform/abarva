'use client';

// Shell-native Intelligence Index page — pattern library browsing surface.
// INT-IDX: AppShell + FilterPillStrip + Sentinel AgentColumn + pattern list.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SHELL } from '@/lib/shell/shell-tokens';
import { INTELLIGENCE_INDEX_VIEW, type IntelligencePattern } from '@/lib/intelligence/shell-intelligence-fixture';

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: IntelligencePattern['tier'] }) {
  const map: Record<IntelligencePattern['tier'], { bg: string; text: string; label: string }> = {
    T3: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'T3 · Use-case' },
    T2: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'T2 · Capability' },
    T1: { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'T1 · Foundation' },
  };
  const m = map[tier];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: m.bg,
        color: m.text,
        fontFamily: SHELL.MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: IntelligencePattern['status'] }) {
  const map: Record<IntelligencePattern['status'], { bg: string; text: string; label: string }> = {
    validated: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Validated' },
    emerging: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, label: 'Emerging' },
    deprecated: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Deprecated' },
  };
  const m = map[status];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: m.bg,
        color: m.text,
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {m.label}
    </span>
  );
}

// ─── Pattern row ──────────────────────────────────────────────────────────────

function PatternRow({ pattern }: { pattern: IntelligencePattern }) {
  const href = `/intelligence/${pattern.id.toLowerCase().replace('/', '-').replace('_', '-')}`;

  return (
    <Link
      href={href}
      style={{
        display: 'grid',
        gridTemplateColumns: '72px 1fr 120px 96px 72px 64px',
        alignItems: 'center',
        height: 48,
        padding: '0 20px',
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        textDecoration: 'none',
        color: SHELL.INK,
        gap: 8,
        transition: 'background 100ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = SHELL.PAPER_SOFT;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      {/* ID */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.06em',
        }}
      >
        {pattern.id}
        {pattern.id === 'T3-H01' && (
          <span style={{ marginLeft: 4, color: SHELL.AMBER_DOT }}>★</span>
        )}
      </span>

      {/* Name + description */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 14,
            fontWeight: 700,
            color: SHELL.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {pattern.name}
        </div>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 11,
            fontStyle: 'italic',
            color: SHELL.INK_MUTED,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            marginTop: 1,
          }}
        >
          {pattern.description}
        </div>
      </div>

      {/* Tier badge */}
      <div>
        <TierBadge tier={pattern.tier} />
      </div>

      {/* Status pill */}
      <div>
        <StatusPill status={pattern.status} />
      </div>

      {/* Programs count */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          letterSpacing: '0.04em',
        }}
      >
        {pattern.usedInPrograms}p
      </span>

      {/* View link */}
      <div>
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${SHELL.INK}`,
            background: 'transparent',
            color: SHELL.INK,
            fontFamily: SHELL.MONO,
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          View
        </Link>
      </div>
    </Link>
  );
}

// ─── Pattern table ────────────────────────────────────────────────────────────

function PatternTable({ patterns }: { patterns: IntelligencePattern[] }) {
  const colHeaderStyle: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: SHELL.INK_MUTED,
  };

  return (
    <div
      style={{
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        overflow: 'hidden',
      }}
    >
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 120px 96px 72px 64px',
          padding: '7px 20px',
          gap: 8,
          background: SHELL.PAPER_SOFT,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        }}
      >
        <span style={colHeaderStyle}>ID</span>
        <span style={colHeaderStyle}>Pattern</span>
        <span style={colHeaderStyle}>Tier</span>
        <span style={colHeaderStyle}>Status</span>
        <span style={colHeaderStyle}>Programs</span>
        <span style={colHeaderStyle}></span>
      </div>

      {/* Rows */}
      {patterns.map((p) => (
        <PatternRow key={p.id} pattern={p} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function IntelligenceIndexPage() {
  const view = INTELLIGENCE_INDEX_VIEW;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Pattern Library',
      }}
      middleStrip={
        <FilterPillStrip
          pills={[
            { key: 'all', label: 'All patterns', active: true },
            { key: 't3', label: 'T3 · Use-case' },
            { key: 't2', label: 'T2 · Capability' },
            { key: 't1', label: 'T1 · Foundation' },
            { key: 'validated', label: 'Validated' },
          ]}
        />
      }
    >
      {/* Sentinel column */}
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={view.agentQuote}
        agentContext={view.agentContext}
        actions={view.actions}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '32px 48px',
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
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
            Intelligence · Pattern Library
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 26,
              fontWeight: 700,
              color: SHELL.INK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Pattern Library
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MUTED,
              margin: '6px 0 0',
              lineHeight: 1.5,
            }}
          >
            {view.patterns.length} patterns · validated and emerging signals for AI program design
          </p>
        </div>

        {/* Pattern table */}
        <PatternTable patterns={view.patterns} />
      </div>
    </AppShell>
  );
}
