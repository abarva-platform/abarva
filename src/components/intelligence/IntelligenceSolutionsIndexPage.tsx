// I5 · INT-IDX-SOLUTIONS — Server-component Intelligence solutions index page.
//
// Canonical solutions catalog surface for /intelligence/solutions.
// Replaces the 'use client' SolutionsIndexPage removed in I5.
//
// Key I5 additions:
//   • IntelligenceProvenanceRibbon anchored below the page header
//   • Solution cards link to INT-DTL-SOLUTION detail pages
//   • Server component — no useState, no client hooks
//   • Client island: IntelligenceSolutionsSentinel (AgentColumn only)
//
// No live model calls, no fetch(), no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligenceSolutionsSentinel } from '@/components/intelligence/IntelligenceSolutionsSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligenceSolutionsIndexView, SolutionCardView } from '@/lib/intelligence/intelligence-solutions-index-view';

// ─── Maturity pill ────────────────────────────────────────────────────────────

const MATURITY_MAP = {
  proven:       { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT, label: 'Proven' },
  emerging:     { bg: SHELL.BLUE_BG,  text: '#2a4a7a',       label: 'Emerging' },
  experimental: { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT, label: 'Experimental' },
};

// ─── Solution card ────────────────────────────────────────────────────────────

function SolutionCard({ solution }: { solution: SolutionCardView }) {
  const maturity = MATURITY_MAP[solution.maturity];

  return (
    <Link
      href={solution.href}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
    >
      <div
        style={{
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 10,
          padding: '18px 22px',
          transition: 'border-color 0.15s',
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
            {solution.domain}
          </span>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 999,
              background: maturity.bg,
              color: maturity.text,
              fontFamily: SHELL.MONO,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1.6,
              whiteSpace: 'nowrap',
            }}
          >
            {maturity.label}
          </span>
        </div>

        {/* Name */}
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 16,
            fontWeight: 700,
            color: SHELL.INK,
            lineHeight: 1.2,
            marginBottom: 6,
          }}
        >
          {solution.name}
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_MUTED,
            lineHeight: 1.5,
            margin: '0 0 10px',
          }}
        >
          {solution.description}
        </p>

        {/* Patterns row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            flexWrap: 'wrap',
            marginBottom: 8,
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
          {solution.patterns.map((pid) => (
            <span
              key={pid}
              style={{
                display: 'inline-block',
                background: SHELL.PAPER_DEEP,
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: SHELL.MONO,
                fontSize: 9,
                color: SHELL.INK,
                margin: '0 4px 0 0',
                letterSpacing: '0.04em',
                lineHeight: 1.6,
              }}
            >
              {pid}
            </span>
          ))}
        </div>

        {/* Programs count + arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 11,
              color: SHELL.INK_MUTED,
            }}
          >
            {solution.programCount} active program{solution.programCount !== 1 ? 's' : ''}
          </span>
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_SOFT,
              letterSpacing: '0.04em',
            }}
          >
            View detail →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceSolutionsIndexPageProps {
  view: IntelligenceSolutionsIndexView;
}

export function IntelligenceSolutionsIndexPage({
  view,
}: IntelligenceSolutionsIndexPageProps) {
  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Solution Archetypes',
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligenceSolutionsSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
        firstSolutionId={view.solutions[0]?.id}
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
            href={view.intelligenceLandingHref}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
          >
            ← Pattern Library
          </Link>
        </div>

        {/* Page header */}
        <div style={{ maxWidth: 720, marginBottom: 16 }}>
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
            Intelligence · Solution Catalog
          </div>
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 26,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 8px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Solution Archetypes
          </h1>
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 14,
              color: SHELL.INK_MUTED,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            End-to-end AI transformation blueprints built on validated patterns · {view.totalSolutions} archetypes
          </p>
        </div>

        {/* ── I5: Provenance ribbon ── */}
        <div style={{ maxWidth: 720, marginBottom: 28 }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Solution cards */}
        <div style={{ maxWidth: 720 }}>
          {view.solutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </div>

        {/* Honest disclaimer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
            maxWidth: 720,
          }}
        >
          {view.honestDisclaimer}
        </div>
      </div>
    </AppShell>
  );
}
