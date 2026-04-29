// I1 · INT-IDX-LIBRARY — Server-component Intelligence pattern library index.
//
// PR-INT-B reshape: the page leads with an agent-centric canvas
// (Sentinel chat dominant + reactive knowledge pane). The static
// pattern library table sits below inside a collapsible details
// accordion — present but de-emphasized. Same layout pattern PR-F
// established for /programs/[id].
//
// Filter state remains URL-param-driven (searchParams.filter passed
// as a prop from the route). The canvas is a client island; the
// table is server-rendered.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  filterIntelligencePatterns,
  getIntelligenceLibraryFilterLabel,
  INTELLIGENCE_INDEX_VIEW,
  INTELLIGENCE_LIBRARY_FILTERS,
  normalizeIntelligenceLibraryFilter,
  type IntelligencePattern,
} from '@/lib/intelligence/shell-intelligence-fixture';
import { IntelligenceAgentCanvas } from '@/components/intelligence/IntelligenceAgentCanvas';
import { IntelligenceFilterLinks } from '@/components/intelligence/IntelligenceFilterLinks';

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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceIndexPageProps {
  /** URL filter param — e.g. 'all', 'm', 't1', 't3', 'in-review'. */
  filter?: string;
}

export function IntelligenceIndexPage({ filter }: IntelligenceIndexPageProps) {
  const activeFilter = normalizeIntelligenceLibraryFilter(filter);
  const allPatterns = INTELLIGENCE_INDEX_VIEW.patterns;
  const filtered = filterIntelligencePatterns(allPatterns, activeFilter);
  const activeFilterLabel = getIntelligenceLibraryFilterLabel(activeFilter);
  const filterPills = INTELLIGENCE_LIBRARY_FILTERS.map((filter) => ({
    ...filter,
    active: activeFilter === filter.key,
    count: filterIntelligencePatterns(allPatterns, filter.key).length,
  }));

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Sentinel',
      }}
      middleStrip={<IntelligenceFilterLinks pills={filterPills} />}
    >
      {/* Single full-width column · canvas-dominant + collapsed library */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '24px 48px 32px',
          }}
        >
          {/* Page header */}
          <div style={{ marginBottom: 18 }}>
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
              Intelligence · {filtered.length} pattern{filtered.length !== 1 ? 's' : ''} ·{' '}
              {activeFilterLabel}
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
          </div>

          {/* Sentinel agent canvas — chat dominant + reactive knowledge pane */}
          <IntelligenceAgentCanvas quote={INTELLIGENCE_INDEX_VIEW.agentQuote} />

          {/* Static corpus browser — collapsed by default */}
          <details
            data-testid="intelligence-library-legacy"
            style={{
              marginBottom: 20,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              background: SHELL.PAPER,
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                fontFamily: SHELL.MONO,
                fontSize: 11,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: SHELL.GRAY_TEXT,
                fontWeight: 700,
                userSelect: 'none',
              }}
            >
              Pattern library · {filtered.length} entries · direct browse
            </summary>
            <div style={{ padding: '8px 16px 16px' }}>
              <PatternTable patterns={filtered} />
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: `1px solid ${SHELL.CARD_LINE}`,
                }}
              >
                <Link
                  href="/intelligence/solutions"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: SHELL.MONO,
                    fontSize: 11,
                    color: SHELL.INK_SOFT,
                    textDecoration: 'none',
                  }}
                >
                  <span>→</span>
                  <span>Solution archetypes · end-to-end blueprints</span>
                </Link>
              </div>
            </div>
          </details>
        </div>
      </div>
    </AppShell>
  );
}
