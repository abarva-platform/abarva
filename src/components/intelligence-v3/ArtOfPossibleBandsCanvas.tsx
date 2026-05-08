// Intelligence v3 · Art of Possible · honest-asymmetry band canvas.
//
// PR-K2.3 · ships the locked design from
// docs/training/intelligence-all-surfaces-cxo.html (PR #1742).
//
// Reads as it actually is, not artificially balanced: heavy categories
// stay heavy, empty categories stay empty, foundation blockers are
// called out explicitly. Each band shows a stacked bar of in-flight /
// candidate / risk / empty proportions out of "$ possible".

import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { ArtOfPossibleData, OutcomeBand, OutcomeBandTone } from './types';

const TONE_COLORS: Record<OutcomeBandTone, { accent: string; ink: string; chip: string }> = {
  heavy: { accent: '#0E8C7E', ink: '#0E8C7E', chip: 'rgba(14,140,126,0.12)' },
  thin: { accent: '#C8881C', ink: '#C8881C', chip: 'rgba(200,136,28,0.12)' },
  gap: { accent: '#B8443A', ink: '#B8443A', chip: 'rgba(184,68,58,0.12)' },
  foundation: { accent: '#1F3A6E', ink: '#1F3A6E', chip: 'rgba(31,58,110,0.12)' },
};

interface Props {
  data: ArtOfPossibleData;
}

export function ArtOfPossibleBandsCanvas({ data }: Props) {
  return (
    <section
      aria-label="Art of the Possible · outcome bands"
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
      }}
    >
      <Hero data={data} />
      <div>
        {data.bands.map((band) => (
          <BandRow key={band.key} band={band} />
        ))}
      </div>
      <CxoFrame line={data.cxoFrame} />
    </section>
  );
}

function Hero({ data }: { data: ArtOfPossibleData }) {
  return (
    <header
      style={{
        padding: `${SPACING.lg}px ${SPACING.xl}px`,
        borderBottom: BORDER.hairline,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: SPACING.lg,
      }}
    >
      <Stat
        eyebrow="Total possible · 12-month horizon"
        value={data.totalPossibleLabel}
      />
      <Stat
        eyebrow="Capturing today"
        value={data.totalCapturingLabel}
        tone="muted"
      />
    </header>
  );
}

function Stat({
  eyebrow,
  value,
  tone = 'default',
}: {
  eyebrow: string;
  value: string;
  tone?: 'default' | 'muted';
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: tone === 'muted' ? COLORS.muted : COLORS.amber,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 28,
          fontWeight: 300,
          letterSpacing: '-0.018em',
          color: tone === 'muted' ? COLORS.muted : COLORS.ink,
          lineHeight: 1.2,
        }}
      >
        {value}
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
        gridTemplateColumns: '220px 1fr 200px',
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
  const cells: Array<{ pct: number; bg: string; border?: string; key: string }> = [
    { pct: segments.inFlight, bg: accent, key: 'inFlight' },
    { pct: segments.candidate, bg: 'rgba(180,180,180,0.32)', key: 'candidate' },
    { pct: segments.risk, bg: 'rgba(200,80,60,0.45)', key: 'risk' },
    { pct: segments.empty, bg: 'rgba(0,0,0,0.04)', border: BORDER.hairline as string, key: 'empty' },
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

function CxoFrame({ line }: { line: string }) {
  return (
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
      {line}
    </div>
  );
}
