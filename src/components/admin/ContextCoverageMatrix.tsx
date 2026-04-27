// ADMIN12 — Context coverage matrix.
//
// Server component. Renders agents (rows) × surfaces (columns) grid where
// each cell shows the coverage level (decision_grade / partial / thin / none).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  ContextCoverageLevel,
  ContextCoverageMatrixRow,
} from '@/lib/admin/agent-readiness-page-view';

export interface ContextCoverageMatrixProps {
  rows: ReadonlyArray<ContextCoverageMatrixRow>;
}

const LEVEL_STYLES: Record<ContextCoverageLevel, { bg: string; fg: string; label: string }> = {
  decision_grade: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Decision-grade' },
  partial: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Partial' },
  thin: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Thin' },
  none: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'None' },
};

export function ContextCoverageMatrix({ rows }: ContextCoverageMatrixProps) {
  if (rows.length === 0) {
    return null;
  }

  const surfaces = rows[0].cells.map((c) => ({
    key: c.surface,
    label: c.surfaceLabel,
  }));

  return (
    <section
      data-context-coverage-matrix="true"
      aria-label="Agent context coverage matrix"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
      }}
    >
      <header style={{ marginBottom: SPACING.lg }}>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Context coverage matrix
        </h2>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}99`,
            margin: 0,
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Which agent has decision-grade context where · deterministic seed
        </p>
      </header>

      <div
        data-coverage-grid="true"
        style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${surfaces.length}, 1fr)`,
          gap: SPACING.xs,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <div />
        {surfaces.map((surface) => (
          <div
            key={surface.key}
            data-coverage-header-surface={surface.key}
            style={{
              padding: SPACING.sm,
              fontSize: 11,
              fontWeight: 700,
              color: `${COLORS.ink}80`,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}
          >
            {surface.label}
          </div>
        ))}

        {rows.map((row) => (
          <div
            key={row.agent}
            data-coverage-row-agent={row.agent}
            style={{ display: 'contents' }}
          >
            <div
              style={{
                padding: SPACING.sm,
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.ink,
                background: COLORS.cream,
                borderRadius: RADIUS.sm,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {row.agentLabel}
            </div>
            {row.cells.map((cell) => {
              const style = LEVEL_STYLES[cell.level];
              return (
                <div
                  key={`${row.agent}-${cell.surface}`}
                  data-coverage-cell-agent={row.agent}
                  data-coverage-cell-surface={cell.surface}
                  data-coverage-cell-level={cell.level}
                  title={cell.note}
                  style={{
                    padding: SPACING.sm,
                    background: style.bg,
                    color: style.fg,
                    borderRadius: RADIUS.sm,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    border: `1px solid ${COLORS.ink}10`,
                  }}
                >
                  {style.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <footer
        style={{
          marginTop: SPACING.lg,
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}80`,
        }}
        aria-label="Coverage legend"
      >
        {(Object.keys(LEVEL_STYLES) as ContextCoverageLevel[]).map((level) => {
          const style = LEVEL_STYLES[level];
          return (
            <span
              key={level}
              data-coverage-legend-level={level}
              style={{ display: 'inline-flex', alignItems: 'center', gap: SPACING.xs }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: style.bg,
                  border: `1px solid ${style.fg}40`,
                  display: 'inline-block',
                }}
              />
              <span>{style.label}</span>
            </span>
          );
        })}
      </footer>
    </section>
  );
}
