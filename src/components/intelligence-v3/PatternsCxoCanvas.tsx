'use client';

// Intelligence v3 · Patterns (CXO mode · PR-K2.4).
//
// Pattern library bound to Meridian. Every pattern shows the
// quantified with-vs-without delta — that's the CXO read. Two views:
// list (default) and quantified bars.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import { MERIDIAN_PATTERNS, type PatternRow } from './cxo-fixtures';

type PatternsView = 'list' | 'quantbars';

const VIEWS: ReadonlyArray<{ key: PatternsView; label: string }> = [
  { key: 'list', label: 'List' },
  { key: 'quantbars', label: 'Quantified bars' },
];

interface Props {
  patterns?: ReadonlyArray<PatternRow>;
}

export function PatternsCxoCanvas({ patterns = MERIDIAN_PATTERNS }: Props) {
  const [view, setView] = useState<PatternsView>('list');

  return (
    <section data-canvas="patterns" data-view={view}>
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>Patterns</span>
          </>
        }
        title="What patterns are binding on the bets you're shaping?"
        lead="Quantified with-vs-without deltas from corpus-grounded research. Each pattern names the bet it binds to so you can sequence accordingly."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>{patterns.length}</strong> patterns active ·{' '}
            <strong style={{ color: COLORS.ink }}>2 binding</strong> on top 3 bets
          </>
        }
        views={VIEWS}
        activeView={view}
        onViewChange={setView}
      />

      {view === 'list' && <ListView patterns={patterns} />}
      {view === 'quantbars' && <QuantBarsView patterns={patterns} />}
    </section>
  );
}

function ListView({ patterns }: { patterns: ReadonlyArray<PatternRow> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
      {patterns.map((p) => (
        <article
          key={p.id}
          style={{
            background: COLORS.card,
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            display: 'grid',
            gridTemplateColumns: '110px 1fr 220px',
            gap: SPACING.lg,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: COLORS.navy,
              }}
            >
              {p.id}
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9.5,
                color: COLORS.muted,
                letterSpacing: '0.06em',
                marginTop: 4,
              }}
            >
              binds · {p.bindsTo}
            </div>
          </div>
          <div>
            <h3
              style={{
                fontFamily: FONT.display,
                fontSize: 17,
                fontWeight: 400,
                color: COLORS.ink,
                letterSpacing: '-0.008em',
                margin: '0 0 4px',
                lineHeight: 1.25,
              }}
            >
              {p.name}
            </h3>
            <p style={{ fontSize: 13, color: COLORS.body, margin: 0, lineHeight: 1.55 }}>
              {p.description}
            </p>
          </div>
          <div>
            <BarPair pattern={p} />
          </div>
        </article>
      ))}
    </div>
  );
}

function QuantBarsView({ patterns }: { patterns: ReadonlyArray<PatternRow> }) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.md,
          paddingBottom: SPACING.sm,
          borderBottom: BORDER.hairlineSoft,
        }}
      >
        <ColHead label="With pattern" tone="#0E8C7E" />
        <ColHead label="Without pattern" tone="#B8443A" />
      </div>
      {patterns.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING.md,
            padding: `${SPACING.sm}px 0`,
            borderBottom: BORDER.hairlineSoft,
            alignItems: 'center',
          }}
        >
          <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 10,
                color: COLORS.navy,
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginRight: 8,
              }}
            >
              {p.id}
            </span>
            <span style={{ fontFamily: FONT.body, fontSize: 13, color: COLORS.ink, fontWeight: 500 }}>
              {p.name}
            </span>
          </div>
          <Bar pct={p.withPct} label={p.withLabel} tone="#0E8C7E" />
          <Bar pct={p.withoutPct} label={p.withoutLabel} tone="#B8443A" />
        </div>
      ))}
    </div>
  );
}

function ColHead({ label, tone }: { label: string; tone: string }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: tone,
      }}
    >
      {label}
    </div>
  );
}

function Bar({ pct, label, tone }: { pct: number; label: string; tone: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
      <div
        style={{
          flex: 1,
          height: 14,
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            width: `${pct}%`,
            height: '100%',
            background: tone,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 10.5,
          color: tone,
          fontWeight: 700,
          letterSpacing: '0.04em',
          minWidth: 90,
          textAlign: 'right',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BarPair({ pattern }: { pattern: PatternRow }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Bar pct={pattern.withPct} label={pattern.withLabel} tone="#0E8C7E" />
      <Bar pct={pattern.withoutPct} label={pattern.withoutLabel} tone="#B8443A" />
    </div>
  );
}
