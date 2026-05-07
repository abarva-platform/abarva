/**
 * CapabilityConstellation · Block 5.2 (Setup Redesign Package PR C).
 *
 * 14×6 segment-by-capability matrix. Page hero per
 * `DATA_BINDING_CATALOG.md` §5.2. Cells colored by depth state;
 * non-applicable cells rendered distinct from empty.
 *
 * Cell click → guidance is delivered via `title` attribute (native
 * tooltip). A richer popover would be a follow-up enhancement.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import {
  CAPABILITY_VERBS_ORDERED,
  capabilityVerbLabel,
  type MatrixRow,
} from '@/lib/admin/agent-readiness-composer';

const CELL_STATE_STYLE: Record<
  string,
  { bg: string; mark: string; symbol: string; ink: string }
> = {
  deep: { bg: COLORS.mintSoft, mark: COLORS.mintInk, symbol: '●', ink: COLORS.mintInk },
  partial: { bg: COLORS.amberSoft, mark: COLORS.amberInk, symbol: '●', ink: COLORS.amberInk },
  thin: { bg: COLORS.coralSoft, mark: COLORS.coralInk, symbol: '●', ink: COLORS.coralInk },
  empty: { bg: SHELL.PAPER, mark: SHELL.INK_MUTED, symbol: '○', ink: SHELL.INK_MUTED },
  'not-applicable': { bg: SHELL.PAPER_SOFT, mark: SHELL.INK_MUTED, symbol: '—', ink: SHELL.INK_MUTED },
};

export function CapabilityConstellation({ matrix }: { matrix: MatrixRow[] }) {
  const gridTemplateColumns = `200px repeat(${CAPABILITY_VERBS_ORDERED.length}, minmax(80px, 1fr))`;
  return (
    <section
      data-agent-readiness-block="matrix"
      data-testid="agent-readiness-matrix"
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.sm, flexWrap: 'wrap' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 22,
            color: SHELL.INK,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          Capability constellation
        </h2>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: SHELL.INK_MUTED }}>
          14 segments × 6 capabilities · click any cell for guidance
        </span>
      </header>

      <div
        role="table"
        aria-label="Segment-by-capability matrix"
        style={{ overflowX: 'auto' }}
      >
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns,
            gap: 4,
            paddingBottom: SPACING.xs,
            borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          }}
        >
          <div
            role="columnheader"
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              fontWeight: 700,
              padding: `0 ${SPACING.sm}`,
            }}
          >
            Segment
          </div>
          {CAPABILITY_VERBS_ORDERED.map((v) => (
            <div
              key={v}
              role="columnheader"
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 9,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {capabilityVerbLabel(v)}
            </div>
          ))}
        </div>

        {matrix.map((row) => (
          <div
            key={row.segmentId}
            role="row"
            data-matrix-row-segment={row.segmentId}
            style={{
              display: 'grid',
              gridTemplateColumns,
              gap: 4,
              padding: `${SPACING.xs} 0`,
              borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              alignItems: 'center',
            }}
          >
            <div
              role="rowheader"
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                color: SHELL.INK,
                fontWeight: 600,
                padding: `0 ${SPACING.sm}`,
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
              }}
            >
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: SHELL.INK_MUTED }}>
                {String(row.familyNumber).padStart(2, '0')}
              </span>
              {row.segmentName}
            </div>
            {CAPABILITY_VERBS_ORDERED.map((verb) => {
              const cell = row.cells[verb];
              const style = CELL_STATE_STYLE[cell.state] ?? CELL_STATE_STYLE.empty;
              return (
                <button
                  type="button"
                  key={verb}
                  role="cell"
                  data-cell-segment={row.segmentId}
                  data-cell-verb={verb}
                  data-cell-state={cell.state}
                  title={cell.guidance}
                  aria-label={`${row.segmentName} · ${capabilityVerbLabel(verb)} · ${cell.state}`}
                  style={{
                    height: 32,
                    background: style.bg,
                    color: style.ink,
                    border: `1px solid ${style.mark}33`,
                    borderRadius: RADIUS.sm,
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'help',
                    textAlign: 'center',
                  }}
                >
                  {style.symbol}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <footer
        style={{
          display: 'flex',
          gap: SPACING.md,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: SHELL.INK_MUTED,
          flexWrap: 'wrap',
          paddingTop: SPACING.xs,
        }}
      >
        <span>● deep</span>
        <span>● partial</span>
        <span>● thin</span>
        <span>○ empty</span>
        <span>— not applicable</span>
      </footer>
    </section>
  );
}
