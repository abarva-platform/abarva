// GateProgressRing — compact SVG donut ring showing gate completion percentage.
//
// Pure server component: no hooks, no client JS. Renders an SVG arc via
// stroke-dasharray / stroke-dashoffset. Fill color follows traffic-light logic:
//   ≥75%  → mint    (#10A34A)
//   40–74% → amber  (#D97706)
//   <40%   → coral  (#EF4444)

import { TYPOGRAPHY } from '@/lib/design/design-tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACK_COLOR = '#E8E6E1'; // CARD_LINE from SHELL tokens

const MINT_FILL = '#10A34A';
const AMBER_FILL = '#D97706';
const CORAL_FILL = '#EF4444';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fillColor(pct: number): string {
  if (pct >= 75) return MINT_FILL;
  if (pct >= 40) return AMBER_FILL;
  return CORAL_FILL;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GateProgressRingProps {
  /** 0–100 integer percentage */
  pct: number;
  /** Size of the ring in px. Default 40. */
  size?: number;
  /** Optional label below the ring. */
  label?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GateProgressRing({ pct, size = 40, label }: GateProgressRingProps) {
  const strokeWidth = Math.round(size / 6);
  const radius = Math.round((size - strokeWidth) / 2);
  const circumference = Math.round(2 * Math.PI * radius);
  const dashOffset = Math.round(circumference * (1 - pct / 100));
  const center = size / 2;
  const color = fillColor(pct);
  const fontSize = Math.round(size * 0.22);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Gate progress: ${pct}%`}
        role="img"
      >
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
        />
        {/* Fill arc — rotated so 0% starts at top (12 o'clock) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Centered percentage text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={fontSize}
          fontFamily={TYPOGRAPHY.sans}
          fontWeight={700}
        >
          {pct}%
        </text>
      </svg>
      {label !== undefined && (
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            color: '#07070799',
            letterSpacing: '0.03em',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
