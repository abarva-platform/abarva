// I7 · INT-LNS-QUALITY — Server-component Intelligence knowledge quality lens page.
//
// Meta-view of the knowledge layer's own health.
// Canonical surface at /intelligence/quality.
//
// Surfaces:
//   • Summary metrics (total patterns, solutions, contradictions, density)
//   • Domain coverage map (strong / moderate / thin by domain)
//   • Contradiction status breakdown
//   • Identified knowledge gaps
//   • IntelligenceProvenanceRibbon anchored below page header
//
// Server component — no useState, no client hooks.
// Client island: IntelligenceQualityLensSentinel (AgentColumn only).
//
// No live model calls, no fetch(), no Date.now, no Math.random.

import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { IntelligenceProvenanceRibbon } from '@/components/intelligence/IntelligenceProvenanceRibbon';
import { IntelligenceQualityLensSentinel } from '@/components/intelligence/IntelligenceQualityLensSentinel';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  IntelligenceQualityLensView,
  DomainCoverageRow,
  GapRow,
} from '@/lib/intelligence/intelligence-quality-lens-view';

// ─── Coverage strength styles ─────────────────────────────────────────────────

const COVERAGE_STYLE = {
  strong:   { bg: SHELL.MINT_BG,  text: SHELL.MINT_TEXT,  label: 'Strong' },
  moderate: { bg: SHELL.BLUE_BG,  text: '#2a4a7a',         label: 'Moderate' },
  thin:     { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT,  label: 'Thin' },
};

const PRIORITY_STYLE = {
  high:   { bg: SHELL.RUST_BG,  text: SHELL.RUST_TEXT },
  medium: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT },
  low:    { bg: SHELL.GRAY_BG,  text: SHELL.GRAY_TEXT },
};

// ─── Summary metric card ──────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        padding: '16px 20px',
        flex: 1,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 28,
          fontWeight: 700,
          color: accent ?? SHELL.INK,
          lineHeight: 1,
          marginBottom: sub ? 6 : 0,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Domain coverage table ────────────────────────────────────────────────────

function DomainCoverageTable({
  rows,
}: {
  rows: readonly DomainCoverageRow[];
}) {
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
        Coverage by domain
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row) => {
          const style = COVERAGE_STYLE[row.coverage];
          return (
            <div
              key={row.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              {/* Domain name */}
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  fontWeight: 500,
                  flex: 1,
                  minWidth: 140,
                }}
              >
                {row.domain}
              </span>

              {/* Pattern count */}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                  minWidth: 80,
                  textAlign: 'right',
                }}
              >
                {row.patternCount} pattern{row.patternCount !== 1 ? 's' : ''}
              </span>

              {/* Fixture indicator */}
              {row.hasDetailFixtures && (
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 8,
                    color: SHELL.MINT_TEXT,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  fixtures ✓
                </span>
              )}

              {/* Coverage pill */}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: style.bg,
                  color: style.text,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap',
                }}
              >
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contradiction status ─────────────────────────────────────────────────────

function ContradictionStatusSection({
  view,
}: {
  view: IntelligenceQualityLensView;
}) {
  const { contradictionStatus } = view;

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Contradiction density</span>
        <span style={{ color: SHELL.INK }}>{view.contradictionDensityPer100} active per 100 primitives</span>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Open', count: contradictionStatus.open, color: SHELL.RUST_TEXT, bg: SHELL.RUST_BG },
          { label: 'Under review', count: contradictionStatus.underReview, color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG },
          { label: 'Resolved → A', count: contradictionStatus.resolvedTowardA, color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
          { label: 'Resolved → B', count: contradictionStatus.resolvedTowardB, color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
          { label: 'Accepted tension', count: contradictionStatus.acceptedAsTension, color: SHELL.GRAY_TEXT, bg: SHELL.GRAY_BG },
        ].map(({ label, count, color, bg }) => (
          <div
            key={label}
            style={{
              flex: 1,
              minWidth: 100,
              background: bg,
              borderRadius: 8,
              padding: '10px 14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 22,
                fontWeight: 700,
                color,
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {count}
            </div>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 8.5,
                color: SHELL.INK_MUTED,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <Link
          href="/intelligence/contradictions/con-001"
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            textDecoration: 'none',
            letterSpacing: '0.06em',
          }}
        >
          View CON-001 (flagship) →
        </Link>
      </div>
    </div>
  );
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

function GapAnalysisSection({ gaps }: { gaps: readonly GapRow[] }) {
  if (gaps.length === 0) return null;

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
        Identified knowledge gaps · {gaps.length}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gaps.map((gap) => {
          const priority = PRIORITY_STYLE[gap.priority];
          return (
            <div
              key={gap.id}
              style={{
                display: 'flex',
                gap: 12,
                paddingBottom: 10,
                borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              }}
            >
              {/* Gap ID */}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9.5,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                  minWidth: 56,
                  marginTop: 2,
                }}
              >
                {gap.id}
              </span>

              {/* Description */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK,
                    lineHeight: 1.5,
                    margin: '0 0 4px',
                  }}
                >
                  {gap.description}
                </p>
                <span
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 9,
                    color: SHELL.INK_MUTED,
                    letterSpacing: '0.04em',
                  }}
                >
                  {gap.occurrences} reference{gap.occurrences !== 1 ? 's' : ''} without a pattern
                </span>
              </div>

              {/* Priority pill */}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: priority.bg,
                  color: priority.text,
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-start',
                  marginTop: 2,
                }}
              >
                {gap.priority}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface IntelligenceQualityLensPageProps {
  view: IntelligenceQualityLensView;
}

export function IntelligenceQualityLensPage({
  view,
}: IntelligenceQualityLensPageProps) {
  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: 'Intelligence · Knowledge Quality Lens',
      }}
    >
      {/* Sentinel column — client island */}
      <IntelligenceQualityLensSentinel
        agentQuote={view.agentQuote}
        agentContext={view.agentContext}
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
            Intelligence · Knowledge Quality Lens
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
            Knowledge Layer Health
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
            {view.healthSummary}
          </p>
        </div>

        {/* ── I7: Provenance ribbon ── */}
        <div style={{ maxWidth: 720, marginBottom: 24 }}>
          <IntelligenceProvenanceRibbon view={view.provenanceRibbon} />
        </div>

        {/* Summary metrics row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            maxWidth: 720,
            marginBottom: 28,
          }}
          data-testid="quality-metrics"
        >
          <MetricCard
            label="Total patterns"
            value={view.totalPatterns}
            sub={`across ${view.domainCoverage.length} domains`}
          />
          <MetricCard
            label="Solution archetypes"
            value={view.totalSolutions}
            sub="deterministic seed"
          />
          <MetricCard
            label="Contradictions"
            value={view.totalContradictions}
            sub={`${view.activeContradictions} active`}
            accent={view.activeContradictions > 3 ? SHELL.RUST_TEXT : undefined}
          />
          <MetricCard
            label="Density / 100"
            value={view.contradictionDensityPer100}
            sub="active contradictions"
          />
        </div>

        {/* Domain coverage map */}
        <DomainCoverageTable rows={view.domainCoverage} />

        {/* Contradiction status */}
        <ContradictionStatusSection view={view} />

        {/* Gap analysis */}
        <GapAnalysisSection gaps={view.identifiedGaps} />

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
