"use client";

// Standalone visuals for the Home "Enterprise Brief" Overview tab and Use
// Cases cards — hand-authored inline SVG, light-themed to match HomeSurface's
// own `.homex`/`.hx3-*` palette (not the dark-tuned MicroViz.tsx palette).

const INK = "#1A1A18";
const MUTED = "#6B6B63";
const LINE = "#E7E3DA";
const PAPER = "#FBFAF7";
const STRONG = "#1F6B3A";
const PARTIAL = "#A66A1F";
const WEAK = "#a32d2d";

function toneForValue(pct: number): string {
  if (pct >= 0.7) return STRONG;
  if (pct >= 0.4) return PARTIAL;
  return WEAK;
}

interface ContextStrengthGaugeProps {
  value: number;
  max?: number;
  label?: string;
}

export function ContextStrengthGauge({
  value,
  max = 100,
  label,
}: ContextStrengthGaugeProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const color = toneForValue(pct);
  const angle = Math.PI * pct;
  const r = 68;
  const cx = 80;
  const cy = 76;
  const x = cx + r * Math.cos(Math.PI - angle);
  const y = cy - r * Math.sin(Math.PI - angle);

  return (
    <div className="hx3-gauge">
      <svg
        width={160}
        height={96}
        viewBox="0 0 160 96"
        role="img"
        aria-label={label ?? `Context strength ${Math.round(pct * 100)} of 100`}
      >
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={LINE}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={30}
          fontWeight={700}
          fill={INK}
        >
          {Math.round(pct * 100)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill={MUTED}>
          / 100
        </text>
      </svg>
      {label ? <div className="hx3-gaugeLabel">{label}</div> : null}
    </div>
  );
}

interface ReadinessBarProps {
  value: number;
  max?: number;
}

export function ReadinessBar({ value, max = 100 }: ReadinessBarProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const color = toneForValue(pct);
  return (
    <svg
      width={120}
      height={8}
      viewBox="0 0 120 8"
      role="img"
      aria-label={`Readiness ${Math.round(pct * 100)} of 100`}
    >
      <rect x={0} y={2} width={120} height={4} rx={2} fill={LINE} />
      <rect x={0} y={2} width={120 * pct} height={4} rx={2} fill={color} />
    </svg>
  );
}

interface RelationshipDomain {
  label: string;
  tone?: "strong" | "partial" | "weak";
}

interface HomeRelationshipDiagramProps {
  spineLabel: string;
  domains: RelationshipDomain[];
}

const TONE_COLOR: Record<NonNullable<RelationshipDomain["tone"]>, string> = {
  strong: STRONG,
  partial: PARTIAL,
  weak: WEAK,
};

export function HomeRelationshipDiagram({
  spineLabel,
  domains,
}: HomeRelationshipDiagramProps) {
  const shown = domains.slice(0, 6);
  const width = 640;
  const height = 220;
  const spineX = 40;
  const spineWidth = 150;
  const spineY = height / 2 - 26;
  const spineCenterY = height / 2;
  const domainX = 300;
  const domainWidth = 300;
  const rowGap = shown.length > 0 ? height / shown.length : height;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${spineLabel} connects to ${shown.length} domains`}
    >
      <rect
        x={spineX}
        y={spineY}
        width={spineWidth}
        height={52}
        rx={10}
        fill={INK}
      />
      <foreignObject x={spineX + 10} y={spineY + 8} width={spineWidth - 20} height={36}>
        <div
          style={{
            color: PAPER,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {spineLabel}
        </div>
      </foreignObject>

      {shown.map((domain, index) => {
        const rowCenterY = rowGap * index + rowGap / 2;
        const boxY = rowCenterY - 16;
        const color = TONE_COLOR[domain.tone ?? "partial"];
        const startX = spineX + spineWidth;
        const endX = domainX;
        const midX = (startX + endX) / 2;
        return (
          <g key={domain.label}>
            <path
              d={`M ${startX} ${spineCenterY} C ${midX} ${spineCenterY}, ${midX} ${rowCenterY}, ${endX - 8} ${rowCenterY}`}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
            <path
              d={`M ${endX - 8} ${rowCenterY} L ${endX - 16} ${rowCenterY - 4} L ${endX - 16} ${rowCenterY + 4} Z`}
              fill={color}
            />
            <rect
              x={domainX}
              y={boxY}
              width={domainWidth}
              height={32}
              rx={8}
              fill="#fff"
              stroke={LINE}
              strokeWidth={1}
            />
            <foreignObject
              x={domainX + 12}
              y={boxY + 6}
              width={domainWidth - 24}
              height={20}
            >
              <div
                style={{
                  color: INK,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {domain.label}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
