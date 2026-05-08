'use client';

// Intelligence v3 · Peer activity (CXO mode · PR-K2.4).
//
// Two views: cohort list (default · adoption bars) · heatmap.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import { MERIDIAN_PEER_ROWS, type PeerRow } from './cxo-fixtures';

type PeerView = 'list' | 'heatmap';

const VIEWS: ReadonlyArray<{ key: PeerView; label: string }> = [
  { key: 'list', label: 'List' },
  { key: 'heatmap', label: 'Heatmap' },
];

interface Props {
  rows?: ReadonlyArray<PeerRow>;
}

export function PeerActivityCxoCanvas({ rows = MERIDIAN_PEER_ROWS }: Props) {
  const [view, setView] = useState<PeerView>('list');

  const avg = Math.round(rows.reduce((s, r) => s + r.adoptionPct, 0) / rows.length);

  return (
    <section data-canvas="peer-activity" data-view={view}>
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>Peer activity</span>
          </>
        }
        title="What are your named peers actually doing — and where are you the laggard?"
        lead="Adoption read across your IDN and AMC cohorts. The Epic-instance cohort is where the laggard signal is loudest."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>{rows.length}</strong> cohorts ·{' '}
            <strong style={{ color: COLORS.ink }}>{avg}%</strong> avg adoption
          </>
        }
        views={VIEWS}
        activeView={view}
        onViewChange={setView}
      />

      {view === 'list' && <ListView rows={rows} />}
      {view === 'heatmap' && <HeatmapView rows={rows} />}
    </section>
  );
}

function ListView({ rows }: { rows: ReadonlyArray<PeerRow> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
      {rows.map((r) => (
        <article
          key={r.cohort}
          style={{
            background: COLORS.card,
            border: BORDER.hairline,
            borderRadius: RADIUS.md,
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            display: 'grid',
            gridTemplateColumns: '1fr 240px 200px',
            gap: SPACING.lg,
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: FONT.display,
                fontSize: 17,
                fontWeight: 400,
                color: COLORS.ink,
                letterSpacing: '-0.008em',
                margin: '0 0 4px',
              }}
            >
              {r.cohort}
            </h3>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10.5,
                color: COLORS.muted,
                letterSpacing: '0.06em',
              }}
            >
              outcome · {r.outcome}
            </div>
          </div>
          <div>
            <div
              style={{
                display: 'flex',
                height: 14,
                borderRadius: 3,
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.04)',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  width: `${r.adoptionPct}%`,
                  background: '#0E8C7E',
                }}
              />
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 10.5,
                color: COLORS.muted,
                letterSpacing: '0.04em',
              }}
            >
              {r.delta}
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 24,
              fontWeight: 400,
              color: COLORS.ink,
              textAlign: 'right',
              letterSpacing: '-0.01em',
            }}
          >
            {r.adoptionPct}%
          </div>
        </article>
      ))}
    </div>
  );
}

function HeatmapView({ rows }: { rows: ReadonlyArray<PeerRow> }) {
  // Bucket adoption % into 5 bins, show as a colored grid per cohort.
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
          gridTemplateColumns: '260px repeat(5, 1fr)',
          gap: 4,
          marginBottom: SPACING.sm,
        }}
      >
        <div />
        {[20, 40, 60, 80, 100].map((b) => (
          <div
            key={b}
            style={{
              fontFamily: FONT.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: COLORS.muted,
              textAlign: 'center',
            }}
          >
            ≤{b}%
          </div>
        ))}
      </div>
      {rows.map((r) => {
        const filledBin = Math.ceil(r.adoptionPct / 20);
        return (
          <div
            key={r.cohort}
            style={{
              display: 'grid',
              gridTemplateColumns: '260px repeat(5, 1fr)',
              gap: 4,
              marginBottom: 4,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 12.5,
                color: COLORS.ink,
                fontWeight: 500,
                paddingRight: SPACING.sm,
              }}
            >
              {r.cohort}
            </div>
            {[1, 2, 3, 4, 5].map((bin) => (
              <div
                key={bin}
                style={{
                  height: 28,
                  borderRadius: 3,
                  background: bin <= filledBin ? heatColor(bin) : 'rgba(0,0,0,0.03)',
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function heatColor(bin: number): string {
  // Darker green = higher adoption.
  const opacity = 0.2 + bin * 0.16;
  return `rgba(14,140,126,${opacity})`;
}
