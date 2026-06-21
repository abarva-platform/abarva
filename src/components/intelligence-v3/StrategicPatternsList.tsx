'use client';

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { PatternRow } from './cxo-fixtures';

interface Props {
  patterns: ReadonlyArray<PatternRow>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function StrategicPatternsList({ patterns, selectedId, onSelect }: Props) {
  if (patterns.length === 0) {
    return <StrategicPatternsEmptyState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
      {patterns.map((p) => (
        <article
          key={p.id}
          onClick={() => onSelect?.(p.id)}
          style={{
            background: COLORS.card,
            border: selectedId === p.id ? `1px solid ${COLORS.navy}` : BORDER.hairline,
            borderRadius: RADIUS.md,
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            display: 'grid',
            gridTemplateColumns: '110px 1fr 220px',
            gap: SPACING.lg,
            alignItems: 'flex-start',
            cursor: onSelect ? 'pointer' : 'default',
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
            {p.officeCategory && (
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  color: COLORS.muted,
                  letterSpacing: '0.06em',
                  marginTop: 8,
                  textTransform: 'uppercase',
                }}
              >
                {p.officeCategory.replace('_', ' ')}
              </div>
            )}
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
            <PatternEvidence pattern={p} />
          </div>
          <div>
            <BarPair pattern={p} />
          </div>
        </article>
      ))}
    </div>
  );
}

function PatternEvidence({ pattern }: { pattern: PatternRow }) {
  const chips = [
    ...(pattern.useCaseNames ?? []).slice(0, 2).map((value) => ({ value, tone: COLORS.navy })),
    ...(pattern.sourceTitles ?? []).slice(0, 1).map((value) => ({ value, tone: '#0E8C7E' })),
    ...(pattern.contradictionTitles ?? []).slice(0, 1).map((value) => ({ value, tone: '#B8443A' })),
  ];
  if (chips.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm }}>
      {chips.map((chip) => (
        <span
          key={`${chip.tone}-${chip.value}`}
          style={{
            border: `1px solid ${chip.tone}33`,
            background: `${chip.tone}0F`,
            color: chip.tone,
            borderRadius: RADIUS.pill,
            padding: '3px 8px',
            fontFamily: FONT.body,
            fontSize: 11,
            fontWeight: 600,
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {chip.value}
        </span>
      ))}
    </div>
  );
}

function StrategicPatternsEmptyState() {
  return (
    <section
      aria-label="No strategic patterns yet"
      style={{
        background: SHELL.PAPER_SOFT,
        borderTop: `1px solid ${SHELL.CARD_LINE}`,
        borderBottom: `1px solid ${SHELL.CARD_LINE}`,
        padding: `${SPACING.xxl}px clamp(${SPACING.lg}px, 5vw, ${SPACING.xxxl}px)`,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <p
          style={{
            margin: '0 0 8px',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
            fontWeight: 700,
          }}
        >
          No patterns yet
        </p>
        <h2
          style={{
            margin: '0 0 10px',
            fontFamily: SHELL.SERIF,
            fontSize: 28,
            lineHeight: 1.12,
            color: SHELL.INK,
            fontWeight: 700,
          }}
        >
          Strategic patterns appear here once Intelligence has enough evidence to bind them to a Move.
        </h2>
        <p
          style={{
            margin: '0 0 20px',
            fontFamily: SHELL.SANS,
            fontSize: 14,
            lineHeight: 1.55,
            color: SHELL.INK_SOFT,
          }}
        >
          Use this surface to see which operating patterns support, contradict, or constrain the bets in flight. Start by asking Ava to review the current tenant signals or originate a Move from the strongest pressure.
        </p>
        <Link
          href="/strategic-moves/new"
          prefetch={false}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: 40,
            padding: '0 18px',
            borderRadius: 8,
            background: SHELL.INK,
            color: SHELL.PAPER,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Create a Move
        </Link>
      </div>
    </section>
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
