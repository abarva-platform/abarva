// DES2 · MetricStrip.
//
// Calm horizontal row of stat chips. Hard-capped at 5 metrics — the
// canon forbids cluttered KPI walls.
//
// Each metric has an optional tone (default | navy | amber | red).

import {
  COLORS,
  FONT,
  BORDER,
  RADIUS,
  SPACING,
} from '@/lib/design/abarva-theme';

export type MetricTone = 'default' | 'navy' | 'amber' | 'red';

export interface MetricStripItem {
  key: string;
  label: string;
  value: string | number;
  tone?: MetricTone;
  /** Optional sub-caption beneath the value. */
  caption?: string;
}

export interface MetricStripProps {
  items: ReadonlyArray<MetricStripItem>;
}

const MAX_METRICS = 5;

function valueColor(tone: MetricTone): string {
  if (tone === 'navy') return COLORS.navy;
  if (tone === 'amber') return COLORS.amber;
  if (tone === 'red') return COLORS.red;
  return COLORS.ink;
}

export function MetricStrip({ items }: MetricStripProps) {
  const trimmed = items.slice(0, MAX_METRICS);
  return (
    <div
      role="group"
      aria-label="Metric strip"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.md,
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        fontFamily: FONT.body,
      }}
    >
      {trimmed.map((m) => (
        <div
          key={m.key}
          data-tone={m.tone ?? 'default'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 96,
            paddingRight: SPACING.lg,
            borderRight: `1px solid ${COLORS.borderSoft}`,
          }}
        >
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: COLORS.muted,
            }}
          >
            {m.label}
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: valueColor(m.tone ?? 'default'),
              lineHeight: 1.1,
            }}
          >
            {m.value}
          </span>
          {m.caption ? (
            <span
              style={{
                fontSize: 11,
                color: COLORS.muted,
                lineHeight: 1.3,
              }}
            >
              {m.caption}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
