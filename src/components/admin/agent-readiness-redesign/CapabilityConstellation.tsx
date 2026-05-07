/**
 * CapabilityConstellation · Block 5.2 (Setup Redesign Package PR C).
 *
 * 14×6 segment-by-capability matrix. Page hero per
 * `DATA_BINDING_CATALOG.md` §5.2 + Setup canon refit.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import {
  CAPABILITY_VERBS_ORDERED,
  capabilityVerbLabel,
  type MatrixRow,
} from '@/lib/admin/agent-readiness-composer';

const CELL_STATE_STYLE: Record<
  string,
  { bg: string; mark: string; symbol: string; ink: string }
> = {
  deep: { bg: SETUP.mintSoft, mark: SETUP.mint, symbol: '●', ink: SETUP.mint },
  partial: { bg: SETUP.amberSoft, mark: SETUP.amber, symbol: '●', ink: SETUP.amber },
  thin: { bg: SETUP.coralSoft, mark: SETUP.coral, symbol: '●', ink: SETUP.coral },
  empty: { bg: SETUP.paperSoft, mark: SETUP.inkFaint, symbol: '○', ink: SETUP.inkFaint },
  'not-applicable': { bg: SETUP.grayBg, mark: SETUP.inkFaint, symbol: '—', ink: SETUP.inkFaint },
};

export function CapabilityConstellation({ matrix }: { matrix: MatrixRow[] }) {
  const gridTemplateColumns = `200px repeat(${CAPABILITY_VERBS_ORDERED.length}, minmax(80px, 1fr))`;
  return (
    <section
      data-agent-readiness-block="matrix"
      data-testid="agent-readiness-matrix"
      style={{
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '20px 22px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h2
          style={{
            ...SETUP_TYPE.cardH2,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '-0.018em',
          }}
        >
          Capability constellation
        </h2>
        <span style={SETUP_TYPE.cardMeta}>
          14 segments × 6 capabilities · click any cell for guidance
        </span>
      </header>

      <div role="table" aria-label="Segment-by-capability matrix" style={{ overflowX: 'auto' }}>
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns,
            gap: 4,
            paddingBottom: 6,
            borderBottom: `1px solid ${SETUP.cardLine}`,
          }}
        >
          <div
            role="columnheader"
            style={{
              fontFamily: SETUP.mono,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: SETUP.inkMuted,
              fontWeight: 700,
              padding: '0 8px',
            }}
          >
            Segment
          </div>
          {CAPABILITY_VERBS_ORDERED.map((v) => (
            <div
              key={v}
              role="columnheader"
              style={{
                fontFamily: SETUP.mono,
                fontSize: 9,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: SETUP.inkMuted,
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
              padding: '7px 0',
              borderBottom: `1px solid ${SETUP.cardLine}`,
              alignItems: 'center',
            }}
          >
            <div
              role="rowheader"
              style={{
                fontFamily: SETUP.sans,
                fontSize: 12,
                color: SETUP.ink,
                fontWeight: 600,
                padding: '0 8px',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span style={{ fontFamily: SETUP.mono, fontSize: 9.5, color: SETUP.inkFaint }}>
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
                    height: 28,
                    background: style.bg,
                    color: style.ink,
                    border: `1px solid ${style.mark}33`,
                    borderRadius: 6,
                    fontFamily: SETUP.mono,
                    fontSize: 13,
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
          gap: 18,
          fontFamily: SETUP.mono,
          fontSize: 10,
          color: SETUP.inkMuted,
          flexWrap: 'wrap',
          paddingTop: 12,
          borderTop: `1px solid ${SETUP.cardLine}`,
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
