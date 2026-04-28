import { COLORS } from '@/lib/design/design-tokens';

export interface HealthTrendSparklineProps {
  /** Deterministic 24-point series, values 0–100. */
  points: ReadonlyArray<number>;
  width?: number;
  height?: number;
  /** Accessible label describing the trend. */
  ariaLabel: string;
}

/**
 * ADMIN13 — Health trend sparkline.
 *
 * Renders a 24h deterministic seed health-trend mini-chart for a connector.
 * Pure SVG. No animation. Tokens only.
 */
export function HealthTrendSparkline({
  points,
  width = 180,
  height = 36,
  ariaLabel,
}: HealthTrendSparklineProps) {
  if (points.length === 0) {
    return (
      <span
        data-component="HealthTrendSparkline"
        data-empty="true"
        aria-label={ariaLabel}
        style={{
          display: 'inline-block',
          width,
          height,
          background: COLORS.cream,
        }}
      />
    );
  }

  const max = 100;
  const min = 0;
  const range = max - min || 1;
  const stepX = width / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / range) * height;
    return { x, y };
  });
  const path = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ');
  const last = coords[coords.length - 1];

  return (
    <svg
      data-component="HealthTrendSparkline"
      data-points={points.length}
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={path}
        fill="none"
        stroke={COLORS.navy}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last.x} cy={last.y} r={2.5} fill={COLORS.navy} />
    </svg>
  );
}
