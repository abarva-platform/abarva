// DES2 · MetricStrip.
//
// Calm horizontal row of small stat chips. Used to surface 3 – 5
// numbers at a glance. Imports restricted to the AbarVa theme module.

import {
  COLORS,
  FONT,
  RADIUS,
  TYPE,
} from '@/lib/design/abarva-theme';

export type MetricStripTone = 'default' | 'navy' | 'amber' | 'red';

export interface MetricStripItem {
  label: string;
  value: string;
  tone?: MetricStripTone;
}

export interface MetricStripProps {
  metrics: ReadonlyArray<MetricStripItem>;
}

const MAX_METRICS = 5;

export function MetricStrip({ metrics }: MetricStripProps) {
  const display = metrics.slice(0, MAX_METRICS);
  return (
    <div
      role="list"
      aria-label="metric strip"
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        fontFamily: FONT.body,
      }}
    >
      {display.map((m) => {
        const tone = m.tone ?? 'default';
        const fg = (() => {
          switch (tone) {
            case 'navy':
              return COLORS.navy;
            case 'amber':
              return COLORS.amber;
            case 'red':
              return COLORS.red;
            default:
              return COLORS.ink;
          }
        })();
        return (
          <span
            key={m.label}
            role="listitem"
            data-abarva-metric={m.label}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 12px',
              background: COLORS.surface2,
              borderRadius: RADIUS.pill,
              minWidth: 64,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: fg,
                lineHeight: 1,
              }}
            >
              {m.value}
            </span>
            <span style={{ ...TYPE.eyebrow, color: COLORS.mutedSoft }}>
              {m.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
