'use client';

// Intelligence v3 · By function (CXO mode · PR-K2.4).
//
// 6 functions × 4 outcome columns. Empty cells stay empty (whitespace
// is the truth). Three views: Matrix · Maturity bars · Radar.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import {
  BY_FN_OUTCOMES,
  MERIDIAN_BY_FN_ROWS,
  type ByFnCell,
  type ByFnCellState,
  type ByFnRow,
} from './cxo-fixtures';

type ByFnView = 'matrix' | 'maturity' | 'radar';

const VIEWS: ReadonlyArray<{ key: ByFnView; label: string }> = [
  { key: 'matrix', label: 'Matrix' },
  { key: 'maturity', label: 'Maturity bars' },
  { key: 'radar', label: 'Radar' },
];

const STATE_COLORS: Record<
  ByFnCellState,
  { bg: string; border: string; text: string; label: string }
> = {
  'in-flight': {
    bg: 'rgba(14,140,126,0.10)',
    border: '#0E8C7E',
    text: '#0E8C7E',
    label: 'In flight',
  },
  candidate: {
    bg: 'rgba(200,136,28,0.10)',
    border: '#C8881C',
    text: '#C8881C',
    label: 'Candidate',
  },
  risk: {
    bg: 'rgba(184,68,58,0.10)',
    border: '#B8443A',
    text: '#B8443A',
    label: 'At risk',
  },
  empty: {
    bg: 'rgba(0,0,0,0.02)',
    border: COLORS.border,
    text: COLORS.mutedSoft,
    label: '—',
  },
};

interface Props {
  rows?: ReadonlyArray<ByFnRow>;
}

export function ByFunctionCxoCanvas({ rows = MERIDIAN_BY_FN_ROWS }: Props) {
  const [view, setView] = useState<ByFnView>('matrix');

  const counts = countStates(rows);

  return (
    <section data-canvas="by-function" data-view={view}>
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>By function</span>
          </>
        }
        title="Where does AI play across your function × outcome matrix?"
        lead="Six functions × four outcome bands. Empty cells stay empty — that's where the gaps live. Read the columns to see which outcome is starved."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>{counts['in-flight']}</strong> in flight ·{' '}
            <strong style={{ color: COLORS.ink }}>{counts.candidate}</strong> candidate ·{' '}
            <strong style={{ color: COLORS.ink }}>{counts.risk}</strong> at risk ·{' '}
            <strong style={{ color: COLORS.ink }}>{counts.empty}</strong> whitespace
          </>
        }
        views={VIEWS}
        activeView={view}
        onViewChange={setView}
      />

      {view === 'matrix' && <MatrixView rows={rows} />}
      {view === 'maturity' && <MaturityView rows={rows} />}
      {view === 'radar' && <RadarView rows={rows} />}
    </section>
  );
}

function MatrixView({ rows }: { rows: ReadonlyArray<ByFnRow> }) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px repeat(4, 1fr)',
          background: COLORS.surface2,
          borderBottom: BORDER.hairline,
        }}
      >
        <div style={headCellStyle()} />
        {BY_FN_OUTCOMES.map((o) => (
          <div key={o.key} style={headCellStyle()}>
            {o.label}
          </div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '220px repeat(4, 1fr)',
            borderBottom: i === rows.length - 1 ? 'none' : BORDER.hairlineSoft,
          }}
        >
          <div
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: 500,
              color: COLORS.ink,
              borderRight: BORDER.hairlineSoft,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.function}
          </div>
          {row.cells.map((cell, j) => (
            <Cell key={j} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Cell({ cell }: { cell: ByFnCell }) {
  const tone = STATE_COLORS[cell.state];
  return (
    <div
      data-cell-state={cell.state}
      style={{
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        background: tone.bg,
        borderRight: BORDER.hairlineSoft,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: tone.text,
        }}
      >
        {tone.label}
      </span>
      {cell.ref && (
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10.5,
            color: tone.text,
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          {cell.ref}
        </span>
      )}
    </div>
  );
}

function headCellStyle(): React.CSSProperties {
  return {
    padding: `${SPACING.xs}px ${SPACING.md}px`,
    fontFamily: FONT.mono,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: COLORS.muted,
    borderRight: BORDER.hairlineSoft,
  };
}

function MaturityView({ rows }: { rows: ReadonlyArray<ByFnRow> }) {
  // Per-function maturity = % of cells in flight or risk (i.e. addressed).
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {rows.map((row) => {
        const addressed = row.cells.filter(
          (c) => c.state === 'in-flight' || c.state === 'risk',
        ).length;
        const candidate = row.cells.filter((c) => c.state === 'candidate').length;
        const pct = (addressed / 4) * 100;
        const candPct = (candidate / 4) * 100;
        return (
          <div
            key={row.function}
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr 60px',
              gap: SPACING.md,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.ink,
              }}
            >
              {row.function}
            </div>
            <div
              style={{
                display: 'flex',
                height: 18,
                borderRadius: 4,
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.04)',
              }}
            >
              <span
                style={{
                  width: `${pct}%`,
                  background: '#0E8C7E',
                }}
              />
              <span
                style={{
                  width: `${candPct}%`,
                  background: 'rgba(200,136,28,0.6)',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: COLORS.ink,
                fontWeight: 600,
                textAlign: 'right',
                letterSpacing: '0.04em',
              }}
            >
              {pct.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RadarView({ rows }: { rows: ReadonlyArray<ByFnRow> }) {
  // Lightweight radar: per-outcome aggregation, drawn as a bar fan.
  const outcomeTotals = BY_FN_OUTCOMES.map((o, i) => {
    const inFlight = rows.filter((r) => r.cells[i]!.state === 'in-flight').length;
    const candidate = rows.filter((r) => r.cells[i]!.state === 'candidate').length;
    return {
      outcome: o.label,
      pct: ((inFlight + candidate * 0.5) / rows.length) * 100,
    };
  });
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: SPACING.xxl,
        alignItems: 'center',
      }}
    >
      <RadarSvg points={outcomeTotals} />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {outcomeTotals.map((p) => (
          <li
            key={p.outcome}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              padding: `${SPACING.xs}px 0`,
              borderBottom: BORDER.hairlineSoft,
            }}
          >
            <span style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.ink }}>
              {p.outcome}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: COLORS.muted,
                letterSpacing: '0.04em',
              }}
            >
              {p.pct.toFixed(0)}% coverage
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RadarSvg({ points }: { points: Array<{ outcome: string; pct: number }> }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const angleStep = (2 * Math.PI) / points.length;
  const polyPoints = points
    .map((p, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const radius = (p.pct / 100) * r;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r * scale}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={1}
        />
      ))}
      {points.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke={COLORS.border}
            strokeWidth={1}
          />
        );
      })}
      <polygon points={polyPoints} fill="rgba(31,58,110,0.18)" stroke="#1F3A6E" strokeWidth={1.5} />
      {points.map((p, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + Math.cos(angle) * (r + 18);
        const y = cy + Math.sin(angle) * (r + 18);
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontFamily="JetBrains Mono"
            fontSize={9}
            fontWeight={700}
            letterSpacing="0.16em"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={COLORS.muted}
          >
            {p.outcome.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

function countStates(rows: ReadonlyArray<ByFnRow>): Record<ByFnCellState, number> {
  const counts: Record<ByFnCellState, number> = {
    'in-flight': 0,
    candidate: 0,
    risk: 0,
    empty: 0,
  };
  for (const row of rows) {
    for (const cell of row.cells) {
      counts[cell.state] = (counts[cell.state] ?? 0) + 1;
    }
  }
  return counts;
}
