// Pack D Principle 5 · inline micro-visualizations. 40px SVG primitives
// rendered inline with surrounding text. Tiny, monochrome, aligned to baseline.

const TEAL = '#2DD4C8';
const INK = '#F5F5F0';
const MUTE = 'rgba(245, 245, 240, 0.55)';
const BG_FILL = 'rgba(45, 212, 200, 0.14)';
const AMBER = '#F5C54A';

interface MicroBarProps {
  value: number;
  max?: number;
  color?: string;
}

export function MicroBar({ value, max = 100, color = TEAL }: MicroBarProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <svg width={44} height={10} viewBox="0 0 44 10" style={{ verticalAlign: 'middle', margin: '0 4px', display: 'inline-block' }}>
      <rect x={0} y={3} width={44} height={4} rx={2} fill={BG_FILL} />
      <rect x={0} y={3} width={44 * pct} height={4} rx={2} fill={color} />
    </svg>
  );
}

interface MicroGaugeProps {
  value: number;
  max?: number;
  color?: string;
}

export function MicroGauge({ value, max = 100, color = TEAL }: MicroGaugeProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const angle = Math.PI * pct;
  const r = 12;
  const cx = 14;
  const cy = 12;
  const x = cx + r * Math.cos(Math.PI - angle);
  const y = cy - r * Math.sin(Math.PI - angle);
  const largeArc = 0;
  return (
    <svg width={28} height={14} viewBox="0 0 28 14" style={{ verticalAlign: 'middle', margin: '0 4px', display: 'inline-block' }}>
      <path d={`M 2 12 A 12 12 0 0 1 26 12`} fill="none" stroke={BG_FILL} strokeWidth={2} strokeLinecap="round" />
      <path d={`M 2 12 A 12 12 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

interface MicroBarbellProps {
  client: number;
  benchmark: number;
  min?: number;
  max?: number;
  betterDirection?: 'lower' | 'higher';
}

export function MicroBarbell({ client, benchmark, min, max, betterDirection = 'higher' }: MicroBarbellProps) {
  const lo = min ?? Math.min(client, benchmark) * 0.7;
  const hi = max ?? Math.max(client, benchmark) * 1.3;
  const range = hi - lo || 1;
  const w = 60;
  const clientX = Math.max(0, Math.min(w, ((client - lo) / range) * w));
  const benchX = Math.max(0, Math.min(w, ((benchmark - lo) / range) * w));

  const clientBetter = betterDirection === 'higher' ? client > benchmark : client < benchmark;
  const clientColor = clientBetter ? TEAL : AMBER;

  return (
    <svg width={w + 6} height={12} viewBox={`0 0 ${w + 6} 12`} style={{ verticalAlign: 'middle', margin: '0 4px', display: 'inline-block' }}>
      <line x1={3} y1={6} x2={w + 3} y2={6} stroke={BG_FILL} strokeWidth={1} />
      <circle cx={benchX + 3} cy={6} r={3} fill={MUTE} />
      <circle cx={clientX + 3} cy={6} r={3.5} fill={clientColor} />
    </svg>
  );
}

interface MicroSparklineProps {
  data: number[];
  color?: string;
}

export function MicroSparkline({ data, color = TEAL }: MicroSparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 50;
  const h = 12;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w + 4} height={h + 2} viewBox={`0 -1 ${w + 4} ${h + 2}`} style={{ verticalAlign: 'middle', margin: '0 4px', display: 'inline-block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1} strokeLinejoin="round" transform="translate(2, 0)" />
    </svg>
  );
}

export const _unused = INK;
