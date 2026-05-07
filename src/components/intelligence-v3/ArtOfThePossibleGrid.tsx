// Intelligence v3 · Art of the Possible · 3-layer Move grid.
//
// Three columns: Experience Layer (Front Office) · Decision Layer
// (Middle Office) · Operations Layer (Back Office). Each column has a
// gating sentence and a small stack of candidate Move cards. The
// `focused` column receives the gold border + "✦ focus" treatment.
//
// Move cards are the Shape-into-Move affordance — clicking one opens
// the Strategic Moves originate flow with the pattern context attached
// (wired in a follow-up PR; for now they're visual targets).

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { LayerColumn, MoveCard as MoveCardData } from './types';

const FOCUS_BORDER_COLOR = COLORS.amber;
const FOCUS_HEADER_BG = '#7A4F1B';
const SURFACE_HIGHLIGHT_BG = 'rgba(180, 83, 9, 0.06)';
const SURFACE_HIGHLIGHT_BORDER = COLORS.amber;

interface GridProps {
  columns: ReadonlyArray<LayerColumn>;
}

export function ArtOfThePossibleGrid({ columns }: GridProps) {
  return (
    <section
      aria-label="Art of the Possible"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: SPACING.md,
      }}
    >
      {columns.map((col) => (
        <LayerColumnView key={col.key} column={col} />
      ))}
    </section>
  );
}

function LayerColumnView({ column }: { column: LayerColumn }) {
  const focused = column.focused === true;
  return (
    <div
      style={{
        border: focused
          ? `2px solid ${FOCUS_BORDER_COLOR}`
          : BORDER.hairline,
        borderRadius: RADIUS.md,
        background: COLORS.card,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          background: focused ? FOCUS_HEADER_BG : COLORS.navy,
          color: COLORS.surface,
          padding: `${SPACING.sm}px ${SPACING.md}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            fontFamily: FONT.body,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {column.name}
          {focused && (
            <span
              aria-hidden="true"
              style={{
                color: COLORS.amberSoft,
                fontWeight: 700,
              }}
            >
              ✦
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.85,
            marginTop: 2,
          }}
        >
          {column.parenthetical}
          {focused ? ' · focus' : ''}
        </div>
      </header>

      <div style={{ padding: SPACING.md, flex: 1 }}>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 11,
            fontStyle: 'italic',
            color: COLORS.muted,
            paddingBottom: SPACING.xs,
            borderBottom: `1px dotted ${COLORS.border}`,
            marginBottom: SPACING.sm,
          }}
        >
          {column.gating}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
          {column.moves.map((mv) => (
            <MoveCardView key={mv.id} move={mv} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MoveCardView({ move }: { move: MoveCardData }) {
  const surfaced = move.surfaceState !== undefined;
  return (
    <button
      type="button"
      data-move-id={move.id}
      data-surface-state={move.surfaceState ?? 'static'}
      // Click handler is wired in a follow-up PR (Shape-into-Move opens
      // the Strategic Moves originate flow).
      onClick={undefined}
      style={{
        textAlign: 'left',
        background: surfaced ? SURFACE_HIGHLIGHT_BG : COLORS.surface,
        border: surfaced
          ? `1px solid ${SURFACE_HIGHLIGHT_BORDER}`
          : BORDER.hairline,
        borderRadius: RADIUS.sm,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        cursor: 'pointer',
        fontFamily: FONT.body,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
        }}
      >
        {move.surfaceState === 'surfaced-in-thread' && (
          <span aria-hidden="true" style={{ color: COLORS.amber }}>
            ⭐
          </span>
        )}
        <span>{move.name}</span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.muted,
          marginTop: 2,
        }}
      >
        {move.rationale}
      </div>
    </button>
  );
}
