/**
 * ReasoningMetricsSection — admin reasoning telemetry metrics charts.
 *
 * Three mini SVG charts rendered as a server component:
 *   1. Gate Pass Rate — horizontal bar chart per AMS lifecycle stage.
 *   2. Health Score Distribution — donut chart (healthy/degraded/critical).
 *   3. Contradiction Rate by Pattern — horizontal bar chart, top-5 patterns.
 *
 * Pure SVG: no charting library. All data derived from fixture instances
 * at server-render time. No client JS.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';

// ─── Design constants ─────────────────────────────────────────────────────────

const MINT = COLORS.mintInk;       // ≥80% pass rate — healthy
const AMBER = COLORS.amberInk;     // 50–79%
const RUST = COLORS.coralInk;      // <50%

// ─── AMS lifecycle stage order ────────────────────────────────────────────────

const AMS_STAGES: ReadonlyArray<string> = [
  'Plan',
  'RFI',
  'Shortlist',
  'RFP',
  'Q&A',
  'Initial-Bid',
  'BAFO',
  'Selection',
  'Award',
  'Onboard',
];

// ─── Data derivation helpers ──────────────────────────────────────────────────

interface StageGateData {
  stage: string;
  met: number;
  total: number;
  pct: number;
}

/**
 * For each AMS lifecycle stage, evaluate gate criteria across all SOURCE
 * instances bound to PAT-SRC-AMS-001 and compute the aggregate pass rate.
 *
 * Returns one entry per stage that has ≥1 criterion defined. Stages with no
 * criteria are omitted so the chart stays clean.
 */
function computeGatePassRates(): StageGateData[] {
  const amsPattern = SOURCE_LIFECYCLE_PATTERNS.find(
    (p) => p.patternId === 'PAT-SRC-AMS-001',
  );
  if (amsPattern === undefined) return [];

  const evaluator = createGateEvaluator(amsPattern);

  // Aggregate met/total per stage across all AMS-bound instances
  const stageTotals = new Map<string, { met: number; total: number }>();

  for (const inst of SOURCE_EVENT_INSTANCES) {
    if (inst.patternId !== 'PAT-SRC-AMS-001') continue;
    const evidenceMap = buildEvidenceMap(inst);

    for (const stageId of AMS_STAGES) {
      const evals = evaluator.evaluateStage(stageId, evidenceMap);
      if (evals.length === 0) continue;
      const metCount = evals.filter(
        (e) => e.status === 'met' || e.status === 'waived',
      ).length;
      const entry = stageTotals.get(stageId) ?? { met: 0, total: 0 };
      entry.met += metCount;
      entry.total += evals.length;
      stageTotals.set(stageId, entry);
    }
  }

  const out: StageGateData[] = [];
  for (const stageId of AMS_STAGES) {
    const entry = stageTotals.get(stageId);
    if (entry === undefined || entry.total === 0) continue;
    out.push({
      stage: stageId,
      met: entry.met,
      total: entry.total,
      pct: entry.met / entry.total,
    });
  }
  return out;
}

interface HealthDistData {
  healthy: number;
  degraded: number;
  critical: number;
  total: number;
}

/**
 * Compute health distribution across ALL fixture instances (source + programs).
 */
function computeHealthDistribution(): HealthDistData {
  let healthy = 0;
  let degraded = 0;
  let critical = 0;

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === inst.patternId,
    );
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(ctx);
    if (health.grade === 'green') healthy += 1;
    else if (health.grade === 'amber') degraded += 1;
    else critical += 1;
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === inst.patternId,
    );
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(ctx);
    if (health.grade === 'green') healthy += 1;
    else if (health.grade === 'amber') degraded += 1;
    else critical += 1;
  }

  return { healthy, degraded, critical, total: healthy + degraded + critical };
}

interface PatternContraData {
  patternId: string;
  count: number;
}

/**
 * Count total active contradictions per pattern across all instances, then
 * return the top-5 by count descending.
 */
function computeContradictionsByPattern(): PatternContraData[] {
  const counts = new Map<string, number>();

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === inst.patternId,
    );
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const existing = counts.get(inst.patternId) ?? 0;
    counts.set(inst.patternId, existing + ctx.activeContradictions.length);
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === inst.patternId,
    );
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const existing = counts.get(inst.patternId) ?? 0;
    counts.set(inst.patternId, existing + ctx.activeContradictions.length);
  }

  return Array.from(counts.entries())
    .map(([patternId, count]) => ({ patternId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct >= 0.8) return MINT;
  if (pct >= 0.5) return AMBER;
  return RUST;
}

// ─── SVG chart components ─────────────────────────────────────────────────────

const CHART_W = 240; // bar chart width
const CHART_H = 150; // bar chart height
const BAR_H = 10;
const LABEL_W = 72;  // left label column width
const TRACK_W = CHART_W - LABEL_W - 40; // bar track + right value label

function GatePassRateChart({ data }: { data: StageGateData[] }) {
  if (data.length === 0) {
    return (
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          padding: SPACING.md,
        }}
      >
        No AMS gate data available.
      </div>
    );
  }

  const rowH = BAR_H + 8; // bar + gap
  const svgH = Math.max(CHART_H, data.length * rowH + 16);

  return (
    <svg
      width={CHART_W}
      height={svgH}
      viewBox={`0 0 ${CHART_W} ${svgH}`}
      aria-label="Gate pass rate by stage"
      role="img"
    >
      {data.map((row, i) => {
        const y = 8 + i * rowH;
        const filledW = Math.round(row.pct * TRACK_W);
        const color = barColor(row.pct);
        const pctLabel = `${Math.round(row.pct * 100)}%`;
        // Shorten stage labels so they fit the 72px column
        const label =
          row.stage.length > 9 ? row.stage.slice(0, 8) + '…' : row.stage;

        return (
          <g key={row.stage}>
            {/* Stage label */}
            <text
              x={LABEL_W - 4}
              y={y + BAR_H / 2 + 4}
              textAnchor="end"
              fontFamily={TYPOGRAPHY.sans}
              fontSize={9}
              fill={`${COLORS.ink}bb`}
            >
              {label}
            </text>
            {/* Track background */}
            <rect
              x={LABEL_W}
              y={y}
              width={TRACK_W}
              height={BAR_H}
              rx={3}
              fill={`${COLORS.ink}10`}
            />
            {/* Filled bar */}
            {filledW > 0 && (
              <rect
                x={LABEL_W}
                y={y}
                width={filledW}
                height={BAR_H}
                rx={3}
                fill={color}
                opacity={0.85}
              />
            )}
            {/* Percentage label */}
            <text
              x={LABEL_W + TRACK_W + 5}
              y={y + BAR_H / 2 + 4}
              fontFamily={TYPOGRAPHY.mono}
              fontSize={9}
              fill={color}
            >
              {pctLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const DONUT_R = 60;
const DONUT_INNER_R = 38;
const DONUT_CX = 75;
const DONUT_CY = 75;
const DONUT_SIZE = 150;

/**
 * Build an SVG arc path for a donut segment.
 * `startAngle` and `endAngle` are in radians, measured from the top (−π/2).
 */
function donutPath(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const cos = Math.cos;
  const sin = Math.sin;

  const x1 = cx + r * cos(startAngle);
  const y1 = cy + r * sin(startAngle);
  const x2 = cx + r * cos(endAngle);
  const y2 = cy + r * sin(endAngle);

  const ix1 = cx + innerR * cos(endAngle);
  const iy1 = cy + innerR * sin(endAngle);
  const ix2 = cx + innerR * cos(startAngle);
  const iy2 = cy + innerR * sin(startAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ');
}

function HealthDonutChart({ data }: { data: HealthDistData }) {
  const { healthy, degraded, critical, total } = data;

  // Legend entries
  const segments: Array<{ label: string; count: number; color: string }> = [
    { label: 'Healthy', count: healthy, color: MINT },
    { label: 'Degraded', count: degraded, color: AMBER },
    { label: 'Critical', count: critical, color: RUST },
  ];

  if (total === 0) {
    return (
      <svg
        width={DONUT_SIZE + 80}
        height={DONUT_SIZE}
        viewBox={`0 0 ${DONUT_SIZE + 80} ${DONUT_SIZE}`}
        aria-label="Health score distribution"
        role="img"
      >
        <circle
          cx={DONUT_CX}
          cy={DONUT_CY}
          r={DONUT_R}
          fill={`${COLORS.ink}10`}
        />
        <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_INNER_R} fill={COLORS.white} />
        <text
          x={DONUT_CX}
          y={DONUT_CY + 4}
          textAnchor="middle"
          fontFamily={TYPOGRAPHY.sans}
          fontSize={10}
          fill={`${COLORS.ink}88`}
        >
          No data
        </text>
      </svg>
    );
  }

  // Build segments with cumulative angles (start from top, −π/2)
  const TWO_PI = 2 * Math.PI;
  const START = -Math.PI / 2;
  let cursor = START;

  const paths = segments
    .filter((s) => s.count > 0)
    .map((s) => {
      const sweep = (s.count / total) * TWO_PI;
      const start = cursor;
      const end = cursor + sweep;
      cursor = end;
      return { ...s, path: donutPath(DONUT_CX, DONUT_CY, DONUT_R, DONUT_INNER_R, start, end) };
    });

  const legendX = DONUT_SIZE + 8;

  return (
    <svg
      width={DONUT_SIZE + 90}
      height={DONUT_SIZE}
      viewBox={`0 0 ${DONUT_SIZE + 90} ${DONUT_SIZE}`}
      aria-label="Health score distribution"
      role="img"
    >
      {paths.map((seg) => (
        <path key={seg.label} d={seg.path} fill={seg.color} opacity={0.85} />
      ))}
      {/* Donut hole */}
      <circle cx={DONUT_CX} cy={DONUT_CY} r={DONUT_INNER_R} fill={COLORS.white} />
      {/* Centre total */}
      <text
        x={DONUT_CX}
        y={DONUT_CY - 5}
        textAnchor="middle"
        fontFamily={TYPOGRAPHY.serif}
        fontSize={18}
        fontWeight="700"
        fill={COLORS.ink}
      >
        {total}
      </text>
      <text
        x={DONUT_CX}
        y={DONUT_CY + 11}
        textAnchor="middle"
        fontFamily={TYPOGRAPHY.sans}
        fontSize={8}
        fill={`${COLORS.ink}99`}
      >
        instances
      </text>
      {/* Legend */}
      {segments.map((seg, i) => {
        const ly = 28 + i * 28;
        return (
          <g key={seg.label}>
            <rect x={legendX} y={ly} width={10} height={10} rx={2} fill={seg.color} opacity={0.85} />
            <text
              x={legendX + 14}
              y={ly + 9}
              fontFamily={TYPOGRAPHY.sans}
              fontSize={10}
              fill={`${COLORS.ink}cc`}
            >
              {seg.label}
            </text>
            <text
              x={legendX + 14}
              y={ly + 20}
              fontFamily={TYPOGRAPHY.mono}
              fontSize={9}
              fill={seg.color}
            >
              {seg.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ContradictionRateChart({ data }: { data: PatternContraData[] }) {
  if (data.length === 0) {
    return (
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}88`,
          padding: SPACING.md,
        }}
      >
        No contradictions detected.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const rowH = BAR_H + 8;
  const svgH = Math.max(CHART_H, data.length * rowH + 16);
  const CLABEL_W = 96; // wider for pattern IDs

  return (
    <svg
      width={CHART_W}
      height={svgH}
      viewBox={`0 0 ${CHART_W} ${svgH}`}
      aria-label="Contradiction count by pattern"
      role="img"
    >
      {data.map((row, i) => {
        const y = 8 + i * rowH;
        const trackW = CHART_W - CLABEL_W - 24;
        const filledW = Math.round((row.count / maxCount) * trackW);
        // Shorten long pattern IDs
        const label =
          row.patternId.length > 14
            ? row.patternId.slice(0, 13) + '…'
            : row.patternId;

        return (
          <g key={row.patternId}>
            <text
              x={CLABEL_W - 4}
              y={y + BAR_H / 2 + 4}
              textAnchor="end"
              fontFamily={TYPOGRAPHY.mono}
              fontSize={8}
              fill={`${COLORS.ink}bb`}
            >
              {label}
            </text>
            {/* Track */}
            <rect
              x={CLABEL_W}
              y={y}
              width={trackW}
              height={BAR_H}
              rx={3}
              fill={`${COLORS.ink}10`}
            />
            {/* Bar */}
            {filledW > 0 && (
              <rect
                x={CLABEL_W}
                y={y}
                width={filledW}
                height={BAR_H}
                rx={3}
                fill={RUST}
                opacity={0.75}
              />
            )}
            {/* Count */}
            <text
              x={CLABEL_W + trackW + 4}
              y={y + BAR_H / 2 + 4}
              fontFamily={TYPOGRAPHY.mono}
              fontSize={9}
              fill={RUST}
            >
              {row.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
        minWidth: 0,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}77`,
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Metrics
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Derived from fixture instances at render time — deterministic, no LLM
        </div>
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

/**
 * ReasoningMetricsSection
 *
 * Server component. Derives all chart data from fixture instances synchronously.
 * Renders three mini SVG charts inside a card grid below the headline stats.
 */
export function ReasoningMetricsSection() {
  const gateData = computeGatePassRates();
  const healthData = computeHealthDistribution();
  const contraData = computeContradictionsByPattern();

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <SectionHeader />
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: SPACING.md,
          padding: SPACING.md,
        }}
      >
        <ChartCard
          title="Gate Pass Rate"
          subtitle="AMS lifecycle · % criteria met per stage"
        >
          <GatePassRateChart data={gateData} />
        </ChartCard>

        <ChartCard
          title="Health Distribution"
          subtitle="All instances — healthy / degraded / critical"
        >
          <HealthDonutChart data={healthData} />
        </ChartCard>

        <ChartCard
          title="Contradiction Rate"
          subtitle="Top 5 patterns by active contradiction count"
        >
          <ContradictionRateChart data={contraData} />
        </ChartCard>
      </div>
    </section>
  );
}
