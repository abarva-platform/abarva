// I1 · INT-IDX-LIBRARY — Server-component Intelligence pattern library index.
//
// Converted from 'use client' in I1. All filter state is URL-param-driven
// (searchParams.filter passed as a prop from the route). No useState, no
// useRouter, no useSearchParams here.
//
// Client interactivity (AgentColumn actions + PatternSubmitModal) is isolated
// to IntelligenceIndexSentinelPanel (client component island).
// Filter pill navigation uses IntelligenceFilterLinks (server component, Link-based).

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import { INTELLIGENCE_INDEX_VIEW, type IntelligencePattern } from '@/lib/intelligence/shell-intelligence-fixture';
import { IntelligenceIndexSentinelPanel } from '@/components/intelligence/IntelligenceIndexSentinelPanel';
import { IntelligenceFilterLinks, type FilterLinkPill } from '@/components/intelligence/IntelligenceFilterLinks';

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
    'in-review': { bg: SHELL.BLUE_BG, text: '#2a4a7a', label: 'In review' },
    candidate: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Candidate' },
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
        <span
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
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          View
        </span>
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

// ─── Filter logic ─────────────────────────────────────────────────────────────

function applyFilter(
  patterns: IntelligencePattern[],
  filter: string | undefined,
): IntelligencePattern[] {
  if (!filter || filter === 'all') return patterns;
  if (filter === 't1') return patterns.filter((p) => p.tier === 'T1');
  if (filter === 't2') return patterns.filter((p) => p.tier === 'T2');
  if (filter === 't3') return patterns.filter((p) => p.tier === 'T3');
  if (filter === 'in-review') return patterns.filter((p) => p.status === 'in-review');
  if (filter === 'candidate') return patterns.filter((p) => p.status === 'candidate');
  if (filter === 'validated') return patterns.filter((p) => p.status === 'validated');
  return patterns;
}

function buildFilterPills(
  patterns: IntelligencePattern[],
  activeFilter: string,
): FilterLinkPill[] {
  return [
    { key: 'all', label: 'All', active: activeFilter === 'all' || !activeFilter, count: patterns.length, href: '/intelligence' },
    { key: 't3', label: 'T3 · Use-case', active: activeFilter === 't3', count: patterns.filter((p) => p.tier === 'T3').length, href: '/intelligence?filter=t3' },
    { key: 't2', label: 'T2 · Capability', active: activeFilter === 't2', count: patterns.filter((p) => p.tier === 'T2').length, href: '/intelligence?filter=t2' },
    { key: 't1', label: 'T1 · Foundation', active: activeFilter === 't1', count: patterns.filter((p) => p.tier === 'T1').length, href: '/intelligence?filter=t1' },
    { key: 'in-review', label: 'In review', active: activeFilter === 'in-review', count: patterns.filter((p) => p.status === 'in-review').length, href: '/intelligence?filter=in-review' },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceIndexPageProps {
  /** URL filter param — e.g. 'all', 't1', 't2', 't3', 'in-review'. */
  filter?: string;
}

export function IntelligenceIndexPage({ filter }: IntelligenceIndexPageProps) {
  const activeFilter = filter ?? 'all';
  const allPatterns = INTELLIGENCE_INDEX_VIEW.patterns;
  const filtered = applyFilter(allPatterns, activeFilter);
  const filterPills = buildFilterPills(allPatterns, activeFilter);

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Pattern Library',
      }}
      middleStrip={<IntelligenceFilterLinks pills={filterPills} />}
    >
      {/* Sentinel column — client island (handles modal + agent actions) */}
      <IntelligenceIndexSentinelPanel
        agentQuote={INTELLIGENCE_INDEX_VIEW.agentQuote}
        agentContext={INTELLIGENCE_INDEX_VIEW.agentContext}
        actions={INTELLIGENCE_INDEX_VIEW.actions}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: SHELL.PAPER,
          padding: '32px 48px 32px',
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
            {filtered.length} pattern{filtered.length !== 1 ? 's' : ''} · validated and emerging signals for AI program design
          </p>
        </div>

        {/* Pattern table */}
        <PatternTable patterns={filtered} />

        {/* Solutions link */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${SHELL.CARD_LINE}` }}>
          <Link href="/intelligence/solutions" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: SHELL.MONO, fontSize: 11, color: SHELL.INK_SOFT, textDecoration: 'none',
          }}>
            <span>→</span>
            <span>Solution archetypes · end-to-end blueprints</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
