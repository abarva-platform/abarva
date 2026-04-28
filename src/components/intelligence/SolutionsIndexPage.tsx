'use client';

// Shell-native Intelligence Solutions index page.
// INT-IDX-SOLUTIONS: AppShell + Sentinel AgentColumn + solution archetype cards.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { AgentColumn } from '@/components/shell/AgentColumn';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOLUTIONS_INDEX_VIEW, type SolutionArchetypeCard } from '@/lib/intelligence/shell-solutions-fixture';

// ─── Maturity pill ────────────────────────────────────────────────────────────

function MaturityPill({ maturity }: { maturity: SolutionArchetypeCard['maturity'] }) {
  const styles: Record<SolutionArchetypeCard['maturity'], { bg: string; text: string; label: string }> = {
    proven:       { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, label: 'Proven' },
    emerging:     { bg: SHELL.BLUE_BG, text: '#2a4a7a',       label: 'Emerging' },
    experimental: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, label: 'Experimental' },
  };
  const s = styles[maturity];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: s.bg,
        color: s.text,
        fontFamily: SHELL.MONO,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Solution card ────────────────────────────────────────────────────────────

function SolutionCard({ archetype }: { archetype: SolutionArchetypeCard }) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '18px 22px',
        marginBottom: 12,
      }}
    >
      {/* Header row: domain + maturity pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {archetype.domain}
        </span>
        <MaturityPill maturity={archetype.maturity} />
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 16,
          fontWeight: 700,
          color: SHELL.INK,
          lineHeight: 1.2,
        }}
      >
        {archetype.name}
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK_MUTED,
          lineHeight: 1.5,
          margin: '6px 0 0',
        }}
      >
        {archetype.description}
      </p>

      {/* Patterns row */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 0,
          marginTop: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.06em',
            marginRight: 6,
          }}
        >
          Built on:
        </span>
        {archetype.patterns.map((patternId) => (
          <Link
            key={patternId}
            href={`/intelligence/${patternId.toLowerCase().replace('/', '-')}`}
            style={{
              display: 'inline-block',
              background: SHELL.PAPER_DEEP,
              borderRadius: 4,
              padding: '2px 8px',
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK,
              margin: '0 4px 0 0',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              lineHeight: 1.6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = SHELL.CARD_LINE;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = SHELL.PAPER_DEEP;
            }}
          >
            {patternId}
          </Link>
        ))}
      </div>

      {/* Programs count */}
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 11,
          color: SHELL.INK_MUTED,
          marginTop: 8,
        }}
      >
        {archetype.programCount} active program{archetype.programCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SolutionsIndexPage() {
  const view = SOLUTIONS_INDEX_VIEW;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Solution Archetypes',
      }}
    >
      {/* Sentinel column */}
      <AgentColumn
        agent={{ initials: 'Sn', name: 'Sentinel', role: 'Pattern Validator' }}
        quote={view.agentQuote}
        agentContext={view.agentContext}
        actions={view.actions}
        surface="intelligence"
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
        {/* Back link */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/intelligence"
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 11,
              color: SHELL.INK_SOFT,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = SHELL.INK;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = SHELL.INK_SOFT;
            }}
          >
            ← Pattern library
          </Link>
        </div>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 6px',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            Solution Archetypes
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MUTED,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            End-to-end AI transformation blueprints built on validated patterns
          </p>
        </div>

        {/* Solution cards */}
        <div>
          {view.archetypes.map((archetype) => (
            <SolutionCard key={archetype.id} archetype={archetype} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
