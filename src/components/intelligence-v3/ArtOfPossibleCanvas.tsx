'use client';

// Intelligence v3 · Art of Possible · 4-view canvas (PR-K2.4).
//
// Locked design from docs/training/intelligence-all-surfaces-cxo.html.
// Four views over the same underlying band data:
//   · Bands · honest-asymmetry stacked-bar rows (default, CXO frame)
//   · Donut · proportion of $ possible by category
//   · Stacked · single horizontal stacked bar (allocation across all)
//   · Kanban · 4-column board (in-flight / candidate / risk / empty)
//
// Reads as Meridian's portfolio actually is: workforce heavy · margin
// thin · clinical empty (whitespace) · foundation blocking via MH-07.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { ArtOfPossibleData, OutcomeBand, OutcomeBandTone } from './types';

const TONE_COLORS: Record<OutcomeBandTone, { accent: string; ink: string; chip: string }> = {
  heavy: { accent: '#0E8C7E', ink: '#0E8C7E', chip: 'rgba(14,140,126,0.12)' },
  thin: { accent: '#C8881C', ink: '#C8881C', chip: 'rgba(200,136,28,0.12)' },
  gap: { accent: '#B8443A', ink: '#B8443A', chip: 'rgba(184,68,58,0.12)' },
  foundation: { accent: '#1F3A6E', ink: '#1F3A6E', chip: 'rgba(31,58,110,0.12)' },
};

type AopView = 'bands' | 'donut' | 'stacked' | 'kanban';

const VIEWS: ReadonlyArray<{ key: AopView; label: string }> = [
  { key: 'bands', label: 'Bands' },
  { key: 'donut', label: 'Donut' },
  { key: 'stacked', label: 'Stacked' },
  { key: 'kanban', label: 'Kanban' },
];

interface Props {
  data: ArtOfPossibleData;
}

export function ArtOfPossibleCanvas({ data }: Props) {
  const [view, setView] = useState<AopView>('bands');
  const isRetail = isApexRetailData(data);
  const blockedLabel = blockedOpportunityLabel(data);

  if (data.bands.length === 0) {
    return (
      <section data-canvas="art-of-possible" data-view="empty">
        <MockHero
          eyebrow="Stage · Art of Possible"
          title="This tenant's Art of Possible has not been loaded yet."
          lead="AbarVa will not borrow another client's value pools, vendors, or initiative codes to fill this view. Load tenant-specific opportunity bands before using this surface for a decision."
          decisionTitle="Load tenant-specific opportunity bands"
          metrics={[
            ['Possible', 'Not loaded'],
            ['Captured', 'Not loaded'],
            ['Blocked', 'Not loaded'],
            ['Best first', 'Not loaded'],
          ]}
        />
        <EmptyTenantCanvas
          title="No tenant-specific opportunity bands are available"
          body="Use the Brief and Map if this tenant has a seeded corpus. This panel will populate after opportunity bands are loaded for the active tenant."
        />
      </section>
    );
  }

  return (
    <section data-canvas="art-of-possible" data-view={view}>
      <div style={{ display: 'none' }} aria-hidden="true">
        {VIEWS.map((option) => (
          <button key={option.key} type="button" onClick={() => setView(option.key)}>
            {option.label}
          </button>
        ))}
      </div>

      <MockHero
        eyebrow="Stage · Art of Possible"
        title={
          isRetail
            ? 'Apex is capturing a small slice of the retail AI opportunity. The upside is real, but gated.'
            : 'This portfolio is capturing a small slice of the AI opportunity. The upside is real, but gated.'
        }
        lead="This is not a capability inventory. It separates value already being captured from white space, risk, and the one operating-model decision that unlocks the next wave."
        decisionTitle="Pick the first value pool to unlock"
        metrics={[
          ['Possible', data.totalPossibleLabel.replace(' possible', '')],
          ['Captured', data.totalCapturingLabel],
          ['Blocked', blockedLabel],
          ['Best first', bestFirstValuePool(data)],
        ]}
      />

      {view === 'bands' && <BandsView data={data} />}
      {view === 'donut' && <DonutView data={data} />}
      {view === 'stacked' && <StackedView data={data} />}
      {view === 'kanban' && <KanbanView data={data} />}
    </section>
  );
}

function EmptyTenantCanvas({ title, body }: { title: string; body: string }) {
  return (
    <div
      role="status"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
      }}
    >
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 24,
          fontWeight: 400,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <p
        style={{
          color: COLORS.body,
          fontSize: 14,
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 760,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function MockHero({
  eyebrow,
  title,
  lead,
  decisionTitle,
  metrics,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  decisionTitle: string;
  metrics: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: 36,
        alignItems: 'center',
        borderBottom: BORDER.hairline,
        paddingBottom: 22,
        marginBottom: 22,
      }}
    >
      <div>
        <div style={heroEyebrowStyle()}>{eyebrow}</div>
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize: 'clamp(28px, 3vw, 40px)',
            fontWeight: 400,
            lineHeight: 1.04,
            letterSpacing: '-0.012em',
            color: COLORS.ink,
            margin: '8px 0 12px',
            maxWidth: 920,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            lineHeight: 1.5,
            color: COLORS.body,
            maxWidth: 880,
            margin: 0,
          }}
        >
          {lead}
        </p>
      </div>
      <DecisionNow title={decisionTitle} metrics={metrics} />
    </header>
  );
}

function DecisionNow({
  title,
  metrics,
}: {
  title: string;
  metrics: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <aside
      aria-label="Decision now"
      style={{
        borderLeft: `3px solid ${COLORS.navy}`,
        padding: '12px 0 12px 18px',
      }}
    >
      <div style={heroEyebrowStyle()}>Decision now</div>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.1,
          color: COLORS.ink,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 18px' }}>
        {metrics.map(([label, value]) => (
          <div key={label}>
            <div style={metricLabelStyle()}>{label}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 800, color: COLORS.ink }}>{value}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function heroEyebrowStyle(): React.CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: COLORS.muted,
  };
}

function metricLabelStyle(): React.CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginBottom: 4,
  };
}

function blockedOpportunityLabel(data: ArtOfPossibleData): string {
  return isApexRetailData(data) ? '~$46M' : 'Gated';
}

function bestFirstValuePool(data: ArtOfPossibleData): string {
  return isApexRetailData(data) ? 'Labor' : data.bands[0]?.label ?? 'First value pool';
}

function isApexRetailData(data: ArtOfPossibleData): boolean {
  return data.bands.some((band) => band.key === 'store-ops' || band.key === 'customer-growth');
}

// ─── Bands view (default · CXO frame) ────────────────────────────

function BandsView({ data }: { data: ArtOfPossibleData }) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
      }}
    >
      {data.bands.map((band) => (
        <BandRow key={band.key} band={band} />
      ))}
      <div
        style={{
          background: COLORS.navy,
          color: COLORS.surface,
          padding: `${SPACING.md}px ${SPACING.xl}px`,
          fontFamily: FONT.body,
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        {data.cxoFrame}
      </div>
    </div>
  );
}

function BandRow({ band }: { band: OutcomeBand }) {
  const tone = TONE_COLORS[band.tone];
  return (
    <div
      data-band-key={band.key}
      data-band-tone={band.tone}
      style={{
        padding: `${SPACING.md}px ${SPACING.xl}px`,
        borderBottom: BORDER.hairline,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 220px',
        gap: SPACING.lg,
        alignItems: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.ink,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: tone.accent,
              display: 'inline-block',
            }}
          />
          {band.label}
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            color: COLORS.muted,
            letterSpacing: '0.04em',
            marginTop: 4,
          }}
        >
          {band.possibleUsd} possible · {band.capturingUsd} capturing
        </div>
      </div>

      <StackedBar segments={band.segments} accent={tone.accent} />

      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-block',
            background: tone.chip,
            color: tone.ink,
            fontFamily: FONT.body,
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: RADIUS.pill,
            letterSpacing: '0.01em',
          }}
        >
          {band.verdict}
        </span>
        {band.blocker && (
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9.5,
              color: COLORS.muted,
              marginTop: 6,
              letterSpacing: '0.04em',
            }}
          >
            ⚠ {band.blocker}
          </div>
        )}
      </div>
    </div>
  );
}

function StackedBar({
  segments,
  accent,
}: {
  segments: OutcomeBand['segments'];
  accent: string;
}) {
  const cells: Array<{ pct: number; bg: string; key: string }> = [
    { pct: segments.inFlight, bg: accent, key: 'inFlight' },
    { pct: segments.candidate, bg: 'rgba(180,180,180,0.32)', key: 'candidate' },
    { pct: segments.risk, bg: 'rgba(200,80,60,0.45)', key: 'risk' },
    { pct: segments.empty, bg: 'rgba(0,0,0,0.04)', key: 'empty' },
  ];
  return (
    <div
      role="img"
      aria-label="Allocation breakdown"
      style={{
        display: 'flex',
        height: 22,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.04)',
      }}
    >
      {cells.map((cell) =>
        cell.pct > 0 ? (
          <span
            key={cell.key}
            data-segment={cell.key}
            style={{
              width: `${cell.pct}%`,
              background: cell.bg,
              borderRight: '1px solid rgba(255,255,255,0.6)',
            }}
          />
        ) : null,
      )}
    </div>
  );
}

// ─── Donut view ──────────────────────────────────────────────────

function DonutView({ data }: { data: ArtOfPossibleData }) {
  // Uses possibleUsd midpoints for proportions. Reads as a $ allocation
  // pie across the 4 bands.
  const slices = data.bands.map((band) => {
    const accent = TONE_COLORS[band.tone].accent;
    const mid = midpoint(band.possibleUsd);
    return { band, accent, value: mid };
  });
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const segs = slices.map((s, i) => {
    const pctStart = slices.slice(0, i).reduce((sum, x) => sum + x.value, 0) / total;
    const pctEnd = pctStart + s.value / total;
    return { ...s, pctStart, pctEnd };
  });

  // Build conic-gradient string
  const gradientStops = segs
    .map((s) => `${s.accent} ${(s.pctStart * 100).toFixed(2)}% ${(s.pctEnd * 100).toFixed(2)}%`)
    .join(', ');

  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: SPACING.xl,
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: SPACING.xxl,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `conic-gradient(${gradientStops})`,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 38,
            background: COLORS.card,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            Possible
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 22,
              fontWeight: 400,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {data.totalPossibleLabel.split(' ')[0]}
          </div>
        </div>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {segs.map((s) => (
          <li
            key={s.band.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '12px 1fr auto',
              gap: SPACING.sm,
              alignItems: 'center',
              padding: `${SPACING.xs}px 0`,
              borderBottom: BORDER.hairlineSoft,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.accent,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: FONT.body,
                fontSize: 13,
                color: COLORS.ink,
                fontWeight: 500,
              }}
            >
              {s.band.label}
            </span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: COLORS.muted,
                letterSpacing: '0.04em',
              }}
            >
              {s.band.possibleUsd} · {((s.pctEnd - s.pctStart) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function midpoint(label: string): number {
  // "$60-150M" → 105
  const match = label.match(/\$?([\d.]+)[^\d]+([\d.]+)?/);
  if (!match) return 1;
  const lo = parseFloat(match[1] ?? '0');
  const hi = match[2] ? parseFloat(match[2]) : lo;
  return (lo + hi) / 2 || 1;
}

// ─── Stacked view ────────────────────────────────────────────────

function StackedView({ data }: { data: ArtOfPossibleData }) {
  const totals = data.bands.map((band) => ({
    band,
    accent: TONE_COLORS[band.tone].accent,
    value: midpoint(band.possibleUsd),
  }));
  const sum = totals.reduce((s, t) => s + t.value, 0);

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
          display: 'flex',
          height: 56,
          borderRadius: 6,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.04)',
          marginBottom: SPACING.md,
        }}
      >
        {totals.map((t) => {
          const pct = (t.value / sum) * 100;
          return (
            <div
              key={t.band.key}
              style={{
                width: `${pct}%`,
                background: t.accent,
                borderRight: '1px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: FONT.mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
              title={`${t.band.label} · ${pct.toFixed(0)}%`}
            >
              {pct >= 12 ? `${pct.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: SPACING.md,
        }}
      >
        {totals.map((t) => (
          <div key={t.band.key}>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: t.accent,
                marginBottom: 4,
              }}
            >
              {t.band.label}
            </div>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 18,
                fontWeight: 400,
                color: COLORS.ink,
              }}
            >
              {t.band.possibleUsd}
            </div>
            <div
              style={{
                fontSize: 11,
                color: COLORS.muted,
                marginTop: 2,
              }}
            >
              {t.band.verdict}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban view ─────────────────────────────────────────────────

function KanbanView({ data }: { data: ArtOfPossibleData }) {
  // Buckets bands by their primary state (which segment dominates).
  type ColumnKey = 'inFlight' | 'candidate' | 'risk' | 'empty';
  const COLUMNS: Array<{ key: ColumnKey; label: string; tone: string }> = [
    { key: 'inFlight', label: 'In flight', tone: '#0E8C7E' },
    { key: 'candidate', label: 'Candidate', tone: '#C8881C' },
    { key: 'risk', label: 'At risk', tone: '#B8443A' },
    { key: 'empty', label: 'Whitespace', tone: COLORS.mutedSoft },
  ];

  const placement = (band: OutcomeBand): ColumnKey => {
    const s = band.segments;
    const max = Math.max(s.inFlight, s.candidate, s.risk, s.empty);
    if (s.inFlight === max) return 'inFlight';
    if (s.empty === max) return 'empty';
    if (s.risk >= s.candidate) return 'risk';
    return 'candidate';
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SPACING.md,
      }}
    >
      {COLUMNS.map((col) => {
        const bands = data.bands.filter((b) => placement(b) === col.key);
        return (
          <div
            key={col.key}
            style={{
              background: COLORS.card,
              border: BORDER.hairline,
              borderRadius: RADIUS.md,
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderBottom: BORDER.hairline,
                background: COLORS.surface2,
              }}
            >
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: col.tone,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.xs,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: col.tone,
                    display: 'inline-block',
                  }}
                />
                {col.label}
              </div>
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 11,
                  color: COLORS.muted,
                  marginTop: 2,
                }}
              >
                {bands.length} {bands.length === 1 ? 'band' : 'bands'}
              </div>
            </div>
            <div
              style={{
                padding: SPACING.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.xs,
                flex: 1,
              }}
            >
              {bands.length === 0 ? (
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 10,
                    color: COLORS.mutedSoft,
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                    padding: SPACING.lg,
                    border: `1px dashed ${COLORS.border}`,
                    borderRadius: RADIUS.sm,
                  }}
                >
                  — empty —
                </div>
              ) : (
                bands.map((band) => (
                  <KanbanCard key={band.key} band={band} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ band }: { band: OutcomeBand }) {
  const tone = TONE_COLORS[band.tone];
  return (
    <div
      style={{
        background: COLORS.surface,
        border: BORDER.hairline,
        borderLeft: `3px solid ${tone.accent}`,
        borderRadius: RADIUS.sm,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
      }}
    >
      <div
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
          marginBottom: 2,
        }}
      >
        {band.label}
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: COLORS.muted,
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        {band.possibleUsd} · {band.capturingUsd}
      </div>
      <div
        style={{
          fontSize: 11,
          color: tone.ink,
          fontWeight: 600,
        }}
      >
        {band.verdict}
      </div>
      {band.blocker && (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            color: COLORS.muted,
            marginTop: 4,
            letterSpacing: '0.04em',
          }}
        >
          ⚠ {band.blocker}
        </div>
      )}
    </div>
  );
}
