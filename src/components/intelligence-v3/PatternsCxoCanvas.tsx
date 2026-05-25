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
import { StrategicPatternsList } from './StrategicPatternsList';

type PatternsView = 'list' | 'quantbars';
type OfficeFilter = 'all' | 'front_office' | 'middle_office' | 'back_office';

const VIEWS: ReadonlyArray<{ key: PatternsView; label: string }> = [
  { key: 'list', label: 'List' },
  { key: 'quantbars', label: 'Quantified bars' },
];

const OFFICE_FILTERS: ReadonlyArray<{ key: OfficeFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'front_office', label: 'Front office' },
  { key: 'middle_office', label: 'Middle office' },
  { key: 'back_office', label: 'Back office' },
];

interface Props {
  patterns?: ReadonlyArray<PatternRow>;
}

export function PatternsCxoCanvas({ patterns = MERIDIAN_PATTERNS }: Props) {
  const [view, setView] = useState<PatternsView>('list');
  const [officeFilter, setOfficeFilter] = useState<OfficeFilter>('all');
  const [selectedId, setSelectedId] = useState(patterns[0]?.id ?? null);
  const filteredPatterns =
    officeFilter === 'all'
      ? patterns
      : patterns.filter((pattern) => pattern.officeCategory === officeFilter);
  const selectedPattern =
    patterns.find((pattern) => pattern.id === selectedId) ??
    filteredPatterns[0] ??
    patterns[0] ??
    null;

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

      <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap', marginBottom: SPACING.md }}>
        {OFFICE_FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setOfficeFilter(filter.key)}
            style={{
              border: filter.key === officeFilter ? `1px solid ${COLORS.navy}` : BORDER.hairline,
              background: filter.key === officeFilter ? 'rgba(27,43,92,0.08)' : COLORS.card,
              color: filter.key === officeFilter ? COLORS.navy : COLORS.body,
              borderRadius: 6,
              padding: '7px 10px',
              fontFamily: FONT.mono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {view === 'list' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.7fr)',
            gap: SPACING.lg,
            alignItems: 'start',
          }}
        >
          <StrategicPatternsList
            patterns={filteredPatterns}
            selectedId={selectedPattern?.id ?? null}
            onSelect={setSelectedId}
          />
          <PatternGraphNeighborhood pattern={selectedPattern} />
        </div>
      )}
      {view === 'quantbars' && <QuantBarsView patterns={filteredPatterns} />}
    </section>
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

function PatternGraphNeighborhood({ pattern }: { pattern: PatternRow | null }) {
  if (!pattern) return null;

  const groups = [
    { label: 'Apex use cases', values: pattern.useCaseNames ?? [], tone: '#1B2B5C' },
    { label: 'Knowledge sources', values: pattern.sourceTitles ?? [], tone: '#0E8C7E' },
    { label: 'Contradictions', values: pattern.contradictionTitles ?? [], tone: '#B8443A' },
  ];
  const moveParams = new URLSearchParams({
    fromIntelligence: '1',
    client: 'apexretail',
    patternId: pattern.id,
    patternName: pattern.name,
    useCaseName: pattern.useCaseNames?.[0] ?? pattern.bindsTo,
    sourceTitle: pattern.sourceTitles?.[0] ?? '',
    contradictionTitle: pattern.contradictionTitles?.[0] ?? '',
    failureRatePct: String(pattern.failureRatePct ?? pattern.withoutPct),
    intelligenceSessionId: `patterns:${pattern.id}:${pattern.useCaseNames?.[0] ?? pattern.bindsTo}`
      .toLowerCase()
      .replace(/[^a-z0-9:.-]+/g, '-'),
  });

  return (
    <aside
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
        position: 'sticky',
        top: 142,
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: COLORS.navy, textTransform: 'uppercase' }}>
        Graph neighborhood
      </div>
      <h3 style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 500, color: COLORS.ink, margin: '8px 0 6px' }}>
        {pattern.id} · {pattern.name}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.body, margin: '0 0 14px' }}>
        {pattern.description}
      </p>
      <a
        href={`/strategic-moves/new?${moveParams.toString()}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 36,
          width: '100%',
          borderRadius: 6,
          background: COLORS.navy,
          color: COLORS.card,
          textDecoration: 'none',
          fontFamily: FONT.body,
          fontSize: 13,
          fontWeight: 700,
          marginBottom: SPACING.sm,
        }}
      >
        Shape into Move
      </a>
      {groups.map((group) => (
        <div key={group.label} style={{ borderTop: BORDER.hairlineSoft, paddingTop: SPACING.sm, marginTop: SPACING.sm }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: group.tone, textTransform: 'uppercase', marginBottom: 8 }}>
            {group.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(group.values.length > 0 ? group.values : ['No edge indexed yet']).slice(0, 4).map((value) => (
              <span
                key={value}
                style={{
                  border: `1px solid ${group.values.length > 0 ? group.tone : COLORS.border}`,
                  background: group.values.length > 0 ? `${group.tone}12` : COLORS.surface2,
                  color: group.values.length > 0 ? group.tone : COLORS.muted,
                  borderRadius: 4,
                  padding: '6px 8px',
                  fontSize: 12,
                  lineHeight: 1.35,
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
