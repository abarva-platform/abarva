// I5 · INT-DTL-SOLUTION — Server-component Intelligence solution detail page.
//
// Canonical reading layout for /intelligence/solutions/[solutionId].
//
// Key I5 additions:
//   • IntelligenceProvenanceRibbon anchored below solution header
//   • Composition manifest with pattern roles
//   • Server component — no useState, no client hooks
//   • Client island: IntelligenceSolutionsSentinel (AgentColumn only)
//
// No live model calls, no fetch(), no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligenceSolutionsSentinel } from '@/components/intelligence/IntelligenceSolutionsSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { IntelligenceSolutionDetailView, SolutionPatternRef } from '@/lib/intelligence/intelligence-solution-detail-view';

// ─── Maturity pill ────────────────────────────────────────────────────────────

const MATURITY_MAP = {
  proven:       { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT, label: 'Proven' },
  emerging:     { bg: SHELL.BLUE_BG,  text: '#2a4a7a',       label: 'Emerging' },
  experimental: { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT, label: 'Experimental' },
};

const ROLE_MAP: Record<SolutionPatternRef['role'], { label: string; bg: string; text: string }> = {
  foundation:          { label: 'Foundation',         bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT },
  variation:           { label: 'Variation',          bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  'signal-calibrator': { label: 'Signal calibrator',  bg: SHELL.BLUE_BG,  text: '#2a4a7a' },
};

// ─── Composition manifest ─────────────────────────────────────────────────────

function CompositionManifest({
  patterns,
}: {
  patterns: IntelligenceSolutionDetailView['compositionPatterns'];
}) {
  if (patterns.length === 0) return null;

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '20px 24px',
        maxWidth: 720,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 14,
        }}
      >
        Composition manifest · {patterns.length} pattern{patterns.length !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {patterns.map((ref) => {
          const role = ROLE_MAP[ref.role];
          return (
            <div
              key={ref.patternId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 10,
                borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK,
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  minWidth: 72,
                }}
              >
                {ref.patternId}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: role.bg,
                  color: role.text,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1.6,
                }}
              >
                {role.label}
              </span>
              <Link
                href={ref.href}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  marginLeft: 'auto',
                }}
              >
                View pattern →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceSolutionDetailPageProps {
  view: IntelligenceSolutionDetailView;
}

export function IntelligenceSolutionDetailPage({
  view,
}: IntelligenceSolutionDetailPageProps) {
  const maturity = MATURITY_MAP[view.maturity];

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Intelligence · Solutions · ${view.name}`,
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligenceSolutionsSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
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
        {/* Breadcrumb */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
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
            Pattern Library
          </Link>
          <span style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_MUTED }}>·</span>
          <Link
            href={view.solutionsIndexHref}
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              color: SHELL.INK_MUTED,
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
          >
            Solution Archetypes
          </Link>
        </div>

        {/* Solution header */}
        <div style={{ maxWidth: 720, marginBottom: 20 }}>
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
            Solution · {view.domain}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              fontWeight: 700,
              color: SHELL.INK,
              margin: '0 0 12px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {view.name}
          </h1>

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: maturity.bg,
                color: maturity.text,
                fontFamily: SHELL.MONO,
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.5,
              }}
            >
              {maturity.label}
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              {view.programCount} active program{view.programCount !== 1 ? 's' : ''}
            </span>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.04em',
              }}
            >
              {view.compositionPatterns.length} pattern{view.compositionPatterns.length !== 1 ? 's' : ''} in composition
            </span>
          </div>

          {/* Description */}
          <p
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 15,
              color: SHELL.INK,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {view.description}
          </p>
        </div>

        {/* ── I5: Provenance ribbon ── */}
        <div style={{ maxWidth: 720, marginBottom: 28 }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Composition manifest */}
        <CompositionManifest patterns={view.compositionPatterns} />

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
