/**
 * DataCoverageMatrix · SETUP-1.4
 *
 * Shows the width (how many business functions are covered) and
 * depth (KPI count + completeness per function) of data loaded for
 * the active tenant.
 *
 * Rendered between Act 1 and Act 2 so admins can see at a glance
 * what's loaded before the capability constellation. Complies with
 * NFR-004 (no-JS) — purely server-renderable.
 */

import type { FunctionCoverageEntry } from '@/lib/admin/setup-acts-registry';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

import { SetupActHeader } from './SetupActOne';

export interface DataCoverageMatrixProps {
  functionCoverage: FunctionCoverageEntry[];
  tenantDisplayName: string;
}

// ---------------------------------------------------------------------------
// Completeness encoding
// ---------------------------------------------------------------------------

function completenessStyles(completeness: FunctionCoverageEntry['completeness']) {
  if (completeness === 'full') {
    return {
      barColor: COLORS.mintInk,
      bg: COLORS.mintSoft,
      pillBg: COLORS.mintSoft,
      pillText: COLORS.mintInk,
      pillLabel: 'Full',
      glyph: '●',
    };
  }
  if (completeness === 'partial') {
    return {
      barColor: COLORS.amberInk,
      bg: COLORS.amberSoft,
      pillBg: COLORS.amberSoft,
      pillText: COLORS.amberInk,
      pillLabel: 'Partial',
      glyph: '◐',
    };
  }
  return {
    barColor: COLORS.coralInk,
    bg: COLORS.coralSoft,
    pillBg: COLORS.coralSoft,
    pillText: COLORS.coralInk,
    pillLabel: 'Gap',
    glyph: '○',
  };
}

// ---------------------------------------------------------------------------
// Single function row
// ---------------------------------------------------------------------------

function FunctionRow({ entry, maxKpis }: { entry: FunctionCoverageEntry; maxKpis: number }) {
  const enc = completenessStyles(entry.completeness);
  const barPct = Math.min(100, Math.round((entry.kpiCount / maxKpis) * 100));

  return (
    <div
      data-testid={`setup-coverage-function-${entry.functionName.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr auto',
        gap: SPACING.md,
        alignItems: 'center',
        padding: `${SPACING.sm} ${SPACING.md}`,
        borderRadius: RADIUS.sm,
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      {/* Function name + glyph */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
        <span
          aria-hidden="true"
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: enc.barColor,
            flexShrink: 0,
          }}
        >
          {enc.glyph}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 600,
            color: SHELL.INK,
            lineHeight: 1.3,
          }}
        >
          {entry.functionName}
        </span>
      </div>

      {/* Bar + key metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: SHELL.CARD_LINE_SOFT,
            borderRadius: 3,
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              height: '100%',
              width: `${barPct}%`,
              background: enc.barColor,
              borderRadius: 3,
              transition: 'width 300ms ease',
            }}
          />
        </div>
        {/* Key metrics */}
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.04em',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={entry.keyMetrics.join(' · ')}
        >
          {entry.keyMetrics.slice(0, 3).join(' · ')}
        </div>
      </div>

      {/* KPI count + completeness pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 3,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 16,
            fontWeight: 700,
            color: COLORS.ink,
            lineHeight: 1,
          }}
        >
          {entry.kpiCount}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          KPIs
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary legend
// ---------------------------------------------------------------------------

function CoverageLegend() {
  const items: Array<{ glyph: string; color: string; label: string }> = [
    { glyph: '●', color: COLORS.mintInk, label: 'Full — complete KPI coverage for this function' },
    { glyph: '◐', color: COLORS.amberInk, label: 'Partial — key metrics loaded; depth gaps remain' },
    { glyph: '○', color: COLORS.coralInk, label: 'Gap — minimal or no KPIs for this function' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${SPACING.sm} ${SPACING.lg}`,
        paddingTop: SPACING.sm,
        borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      {items.map(({ glyph, color, label }) => (
        <div key={glyph} style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <span
            aria-hidden="true"
            style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color, lineHeight: 1 }}
          >
            {glyph}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: SHELL.INK_MUTED,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function DataCoverageMatrix({ functionCoverage, tenantDisplayName }: DataCoverageMatrixProps) {
  if (!functionCoverage || functionCoverage.length === 0) return null;

  const totalKpis = functionCoverage.reduce((sum, entry) => sum + entry.kpiCount, 0);
  const maxKpis = Math.max(...functionCoverage.map((entry) => entry.kpiCount));
  const fullCount = functionCoverage.filter((entry) => entry.completeness === 'full').length;
  const partialCount = functionCoverage.filter((entry) => entry.completeness === 'partial').length;
  const gapCount = functionCoverage.filter((entry) => entry.completeness === 'gap').length;

  return (
    <section
      data-testid="admin-setup-coverage-matrix"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.lg,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: SPACING.md }}>
        <SetupActHeader
          eyebrow="Data Coverage"
          title="Corporate metrics — width and depth per business function"
          subtitle={`${totalKpis} KPIs loaded across ${functionCoverage.length} business functions for ${tenantDisplayName}. Each function shows KPI count, key metrics, and coverage completeness.`}
        />

        {/* Summary chips */}
        <div
          style={{
            display: 'flex',
            gap: SPACING.sm,
            flexShrink: 0,
            alignItems: 'flex-start',
          }}
        >
          {fullCount > 0 && (
            <span
              data-testid="setup-coverage-full-count"
              style={{
                padding: `3px 10px`,
                background: COLORS.mintSoft,
                color: COLORS.mintInk,
                borderRadius: RADIUS.pill,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {fullCount} FULL
            </span>
          )}
          {partialCount > 0 && (
            <span
              data-testid="setup-coverage-partial-count"
              style={{
                padding: `3px 10px`,
                background: COLORS.amberSoft,
                color: COLORS.amberInk,
                borderRadius: RADIUS.pill,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {partialCount} PARTIAL
            </span>
          )}
          {gapCount > 0 && (
            <span
              data-testid="setup-coverage-gap-count"
              style={{
                padding: `3px 10px`,
                background: COLORS.coralSoft,
                color: COLORS.coralInk,
                borderRadius: RADIUS.pill,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {gapCount} GAP
            </span>
          )}
        </div>
      </div>

      {/* Function rows */}
      <div
        role="list"
        aria-label={`KPI coverage by business function for ${tenantDisplayName}`}
        style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}
      >
        {functionCoverage.map((entry) => (
          <div key={entry.functionName} role="listitem">
            <FunctionRow entry={entry} maxKpis={maxKpis} />
          </div>
        ))}
      </div>

      <CoverageLegend />
    </section>
  );
}
