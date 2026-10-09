"use client";

import { type ReactNode } from "react";
import type {
  CostScenariosChart,
  GovernedShareChart,
  PhaseChart,
  PhaseChartsModel,
  RootCauseParetoChart,
  SensitivityTornadoChart,
  ValueBridgeChart,
} from "@/lib/programs/moves-phase-charts";

/**
 * The v2 OUTCOME charts / intelligence layer (Increment 3). Presentational
 * only: it draws faithful inline SVG to scale from the semantic numbers the
 * host derives (`buildPhaseCharts`) — it computes no value of its own and reads
 * no tenant data. Every label names a value the chart reaches; fills are
 * explicit; labels stay inside the viewBox.
 *
 * Provenance is shown per chart: a readiness/gap-derived chart (P2, from the
 * real governed states) carries a neutral "Readiness-derived" / "Gap-derived"
 * chip; an illustrative chart (P4 cost/value/sensitivity, which has no governed
 * baseline) carries the amber "Illustrative" chip. When any series is
 * illustrative the honesty note is rendered beneath the grid — so no figure is
 * ever presented as a confirmed client measurement.
 *
 * Rendered inside the findings surface's OUTCOME step, under the same
 * `.mcf-v2` locked-light tokens (`--mcf-*`).
 */
export interface MovesPhaseChartsProps {
  model: PhaseChartsModel;
}

const NAVY = "var(--mcf-accent)";
const TEAL = "var(--mcf-teal)";
const AMBER = "#ba7517";
const RED = "#a32d2d";
const MUTED = "var(--mcf-muted)";
const FAINT = "var(--mcf-faint)";
const LINE = "var(--mcf-line)";
const LINE_STRONG = "var(--mcf-line-strong)";
const MONO = "var(--mcf-mono)";
const round1 = (n: number): string => (Math.round(n * 10) / 10).toString();

function ProvenanceChip({ chart }: { chart: PhaseChart }): ReactNode {
  return (
    <span
      className={`mpc-chip${chart.illustrative ? " is-illus" : " is-derived"}`}
      data-testid={`chart-chip-${chart.id}`}
    >
      {chart.provenanceLabel}
    </span>
  );
}

function CardShell({
  chart,
  ariaLabel,
  children,
}: {
  chart: PhaseChart;
  ariaLabel: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="mpc-card" data-testid={`chart-${chart.id}`}>
      <div className="mpc-ct">
        {chart.title} <ProvenanceChip chart={chart} />
      </div>
      <p className="mpc-cs">{chart.caption}</p>
      <svg role="img" aria-label={ariaLabel} viewBox={svgViewBox(chart)}>
        {children}
      </svg>
    </div>
  );
}

function svgViewBox(chart: PhaseChart): string {
  switch (chart.kind) {
    case "governed_share":
      return `0 0 360 ${13 + chart.data.length * 28 + 22}`;
    case "root_cause_pareto":
      return "0 0 360 185";
    case "cost_scenarios":
      return "0 0 360 190";
    case "value_bridge":
      return "0 0 380 190";
    case "sensitivity_tornado":
      return "0 0 360 150";
  }
}

// ── P2: governed share — horizontal bars ─────────────────────────────────────

function GovernedShareSvg({ chart }: { chart: GovernedShareChart }): ReactNode {
  const TRACK_X0 = 92;
  const TRACK_W = 208;
  const TOP = 13;
  const ROW = 28;
  const BAR_H = 14;
  const plotBottom = TOP + chart.data.length * ROW;
  const midX = TRACK_X0 + TRACK_W / 2;
  return (
    <>
      {/* 50% reference gridline */}
      <line x1={midX} y1={8} x2={midX} y2={plotBottom} stroke={LINE} strokeDasharray="3 3" />
      <text x={midX} y={plotBottom + 16} textAnchor="middle" fontSize="8.5" fill={FAINT} fontFamily={MONO}>50%</text>
      <text x={TRACK_X0} y={plotBottom + 16} textAnchor="middle" fontSize="8.5" fill={FAINT} fontFamily={MONO}>0</text>
      {chart.data.map((d, i) => {
        const y = TOP + i * ROW;
        const barW = Math.max(0, d.fraction * TRACK_W);
        const fill = chart.illustrative ? NAVY : d.fraction >= 1 ? TEAL : NAVY;
        return (
          <g key={d.key}>
            <text x={0} y={y + 11} fontSize="9.5" fill={MUTED} fontFamily={MONO}>{d.label}</text>
            <rect x={TRACK_X0} y={y} width={barW} height={BAR_H} fill={fill} />
            <text
              x={TRACK_X0 + barW + 6}
              y={y + 11}
              fontSize="9.5"
              fill={NAVY}
              fontFamily={MONO}
              fontWeight="600"
            >
              {d.valueLabel}
            </text>
          </g>
        );
      })}
    </>
  );
}

// ── P2: root-cause Pareto — bars + cumulative line ───────────────────────────

function ParetoSvg({ chart }: { chart: RootCauseParetoChart }): ReactNode {
  const BASE_Y = 150;
  const TOP_Y = 30; // 100%
  const H = BASE_Y - TOP_Y; // px for full 0..100%
  const PLOT_X0 = 52;
  const PLOT_W = 280;
  const n = chart.data.length;
  const slot = PLOT_W / n;
  const barW = Math.min(44, slot * 0.58);
  const cx = (i: number): number => PLOT_X0 + slot * i + slot / 2;
  const barFills = [NAVY, "#2d3f6b", "#51608a", "#8992ad", "#a9b0c4"];
  const thresholdY = BASE_Y - chart.thresholdFraction * H;
  const points = chart.data
    .map((d, i) => `${cx(i)},${BASE_Y - d.cumulativeFraction * H}`)
    .join(" ");
  return (
    <>
      <line x1={44} y1={BASE_Y} x2={332} y2={BASE_Y} stroke={LINE_STRONG} />
      <g fontSize="8.5" fill={FAINT} fontFamily={MONO}>
        <text x={40} y={TOP_Y + 4} textAnchor="end">100%</text>
        <text x={40} y={(TOP_Y + BASE_Y) / 2 + 4} textAnchor="end">50%</text>
        <text x={40} y={BASE_Y + 3} textAnchor="end">0</text>
      </g>
      {/* Pareto 80% threshold */}
      <line x1={44} y1={thresholdY} x2={332} y2={thresholdY} stroke={AMBER} strokeDasharray="3 3" />
      <text x={336} y={thresholdY + 3} fontSize="8" fill={AMBER} fontFamily={MONO}>80</text>
      {chart.data.map((d, i) => {
        const h = d.fraction * H;
        const x = cx(i) - barW / 2;
        return (
          <g key={d.key}>
            <rect x={x} y={BASE_Y - h} width={barW} height={h} fill={barFills[i % barFills.length]} />
            <text x={cx(i)} y={BASE_Y - h - 5} textAnchor="middle" fontSize="9" fill={NAVY} fontWeight="600" fontFamily={MONO}>{d.valueLabel}</text>
            <text x={cx(i)} y={BASE_Y + 13} textAnchor="middle" fontSize="7.5" fill={MUTED} fontFamily={MONO}>{d.label}</text>
          </g>
        );
      })}
      <polyline points={points} fill="none" stroke={AMBER} strokeWidth="1.6" />
      {chart.data.map((d, i) => (
        <circle key={`c_${d.key}`} cx={cx(i)} cy={BASE_Y - d.cumulativeFraction * H} r="2.6" fill={AMBER} />
      ))}
    </>
  );
}

// ── P4: cost scenarios — low–high range bars with mid tick ───────────────────

function CostScenariosSvg({ chart }: { chart: CostScenariosChart }): ReactNode {
  const BASE_Y = 160;
  const TOP_Y = 30;
  const scale = (BASE_Y - TOP_Y) / chart.axisMax;
  const yOf = (v: number): number => BASE_Y - v * scale;
  const PLOT_X0 = 60;
  const PLOT_W = 272;
  const n = chart.data.length;
  const slot = PLOT_W / n;
  const barW = 50;
  const fills = [NAVY, "#2d3f6b", "#51608a"];
  const gridlines: number[] = [];
  for (let v = 1; v <= chart.axisMax; v += 1) gridlines.push(v);
  return (
    <>
      <line x1={40} y1={BASE_Y} x2={332} y2={BASE_Y} stroke={LINE_STRONG} />
      <g fontSize="8.5" fill={FAINT} fontFamily={MONO}>
        {gridlines.map((v) => (
          <text key={v} x={34} y={yOf(v) + 3} textAnchor="end">{v}</text>
        ))}
        <text x={34} y={BASE_Y + 3} textAnchor="end">0</text>
      </g>
      {chart.data.map((d, i) => {
        const cx = PLOT_X0 + slot * i + slot / 2;
        const x = cx - barW / 2;
        const top = yOf(d.high);
        const bottom = yOf(d.low);
        const midY = yOf(d.mid);
        const fill = fills[i % fills.length];
        return (
          <g key={d.key}>
            <rect x={x} y={top} width={barW} height={bottom - top} fill={fill} />
            <line x1={x} y1={midY} x2={x + barW} y2={midY} stroke="#fff" strokeWidth="1.2" />
            <text x={cx} y={top - 6} textAnchor="middle" fontSize="8.5" fill={fill} fontFamily={MONO}>{round1(d.high)}</text>
            <text x={cx} y={bottom + 12} textAnchor="middle" fontSize="8.5" fill={fill} fontFamily={MONO}>{round1(d.low)}</text>
            <text x={cx} y={BASE_Y + 16} textAnchor="middle" fontSize="8.5" fill={MUTED} fontFamily={MONO}>{d.label}</text>
          </g>
        );
      })}
      <text x={316} y={yOf(chart.axisMax) + 4} fontSize="7.5" fill={FAINT} fontFamily={MONO} textAnchor="end">
        {chart.unit} · bar=range · tick=mid
      </text>
    </>
  );
}

// ── P4: value bridge — waterfall with connectors ─────────────────────────────

function ValueBridgeSvg({ chart }: { chart: ValueBridgeChart }): ReactNode {
  const BASE_Y = 160;
  const TOP_Y = 30;
  const scale = (BASE_Y - TOP_Y) / chart.axisMax;
  const yOf = (v: number): number => BASE_Y - v * scale;
  const PLOT_X0 = 40;
  const PLOT_W = 316;
  const n = chart.steps.length;
  const slot = PLOT_W / n;
  const barW = Math.min(50, slot * 0.78);
  // Running cumulative for the waterfall; net step is drawn from 0.
  let running = 0;
  const bars = chart.steps.map((step, i) => {
    const cx = PLOT_X0 + slot * i + slot / 2;
    let topVal: number;
    let bottomVal: number;
    if (step.stepKind === "net") {
      topVal = Math.max(0, step.delta);
      bottomVal = Math.min(0, step.delta);
    } else {
      const start = running;
      const end = running + step.delta;
      running = end;
      topVal = Math.max(start, end);
      bottomVal = Math.min(start, end);
    }
    const fill =
      step.stepKind === "net" ? NAVY : step.stepKind === "outflow" ? RED : TEAL;
    return { step, cx, topVal, bottomVal, fill };
  });
  return (
    <>
      <line x1={34} y1={BASE_Y} x2={356} y2={BASE_Y} stroke={LINE_STRONG} />
      <g fontSize="8.5" fill={FAINT} fontFamily={MONO}>
        <text x={30} y={yOf(chart.axisMax / 2) + 3} textAnchor="end">{round1(chart.axisMax / 2)}</text>
        <text x={30} y={BASE_Y + 3} textAnchor="end">0</text>
      </g>
      {/* connectors between consecutive step tops (the running level) */}
      {bars.slice(0, -1).map((b, i) => {
        const next = bars[i + 1];
        if (next.step.stepKind === "net") return null;
        return (
          <line
            key={`conn_${b.step.key}`}
            x1={b.cx + barW / 2}
            y1={yOf(b.step.stepKind === "outflow" ? b.bottomVal : b.topVal)}
            x2={next.cx - barW / 2}
            y2={yOf(next.step.stepKind === "outflow" ? next.topVal : next.bottomVal)}
            stroke={FAINT}
            strokeDasharray="2 2"
          />
        );
      })}
      {bars.map(({ step, cx, topVal, bottomVal, fill }) => {
        const top = yOf(topVal);
        const bottom = yOf(bottomVal);
        const x = cx - barW / 2;
        return (
          <g key={step.key}>
            <rect x={x} y={top} width={barW} height={Math.max(1, bottom - top)} fill={fill} />
            <text
              x={cx}
              y={top - 6}
              textAnchor="middle"
              fontSize={step.stepKind === "net" ? "9" : "8.5"}
              fill={fill}
              fontWeight={step.stepKind === "net" ? "600" : "400"}
              fontFamily={MONO}
            >
              {step.valueLabel}
            </text>
            <text x={cx} y={BASE_Y + 16} textAnchor="middle" fontSize="7.5" fill={MUTED} fontFamily={MONO}>{step.label}</text>
          </g>
        );
      })}
    </>
  );
}

// ── P4: sensitivity — tornado around the base case ───────────────────────────

function SensitivitySvg({ chart }: { chart: SensitivityTornadoChart }): ReactNode {
  const LEFT_X = 72;
  const RIGHT_X = 330;
  const span = chart.axisMax - chart.axisMin || 1;
  const xOf = (v: number): number =>
    LEFT_X + ((v - chart.axisMin) / span) * (RIGHT_X - LEFT_X);
  const centerX = xOf(chart.center);
  const TOP = 24;
  const ROW = 38;
  const BAR_H = 20;
  const plotBottom = TOP + chart.data.length * ROW;
  return (
    <>
      <line x1={centerX} y1={18} x2={centerX} y2={plotBottom} stroke={LINE_STRONG} />
      <text x={centerX} y={14} textAnchor="middle" fontSize="8" fill={MUTED} fontFamily={MONO}>{chart.centerLabel}</text>
      {chart.data.map((d, i) => {
        const y = TOP + i * ROW;
        const lowX = xOf(d.low);
        const highX = xOf(d.high);
        const leftX = Math.min(lowX, centerX);
        const rightX = Math.max(highX, centerX);
        return (
          <g key={d.key}>
            <text x={0} y={y + BAR_H / 2 + 3} fontSize="8.5" fill={MUTED} fontFamily={MONO}>{d.label}</text>
            {/* low side (left of centre) */}
            <rect x={leftX} y={y} width={Math.max(0, centerX - leftX)} height={BAR_H} fill={AMBER} />
            {/* high side (right of centre) */}
            <rect x={centerX} y={y} width={Math.max(0, rightX - centerX)} height={BAR_H} fill={NAVY} />
            <text x={leftX - 5} y={y + BAR_H / 2 + 3} textAnchor="end" fontSize="8" fill={AMBER} fontFamily={MONO}>{d.lowLabel}</text>
            <text x={rightX + 5} y={y + BAR_H / 2 + 3} fontSize="8" fill={NAVY} fontFamily={MONO}>{d.highLabel}</text>
          </g>
        );
      })}
    </>
  );
}

function ChartSvg({ chart }: { chart: PhaseChart }): ReactNode {
  switch (chart.kind) {
    case "governed_share":
      return <GovernedShareSvg chart={chart} />;
    case "root_cause_pareto":
      return <ParetoSvg chart={chart} />;
    case "cost_scenarios":
      return <CostScenariosSvg chart={chart} />;
    case "value_bridge":
      return <ValueBridgeSvg chart={chart} />;
    case "sensitivity_tornado":
      return <SensitivitySvg chart={chart} />;
  }
}

function ariaFor(chart: PhaseChart): string {
  switch (chart.kind) {
    case "governed_share":
      return `${chart.title}: ${chart.data
        .map((d) => `${d.label} ${d.valueLabel}`)
        .join(", ")}`;
    case "root_cause_pareto":
      return `${chart.title}: ${chart.data
        .map((d) => `${d.label} ${d.valueLabel} (cumulative ${d.cumulativeLabel})`)
        .join(", ")}`;
    case "cost_scenarios":
      return `${chart.title} (${chart.unit}): ${chart.data
        .map((d) => `${d.label} ${d.rangeLabel}`)
        .join(", ")}`;
    case "value_bridge":
      return `${chart.title} (${chart.unit}): ${chart.steps
        .map((s) => `${s.label} ${s.valueLabel}`)
        .join(", ")}`;
    case "sensitivity_tornado":
      return `${chart.title} around ${chart.centerLabel} (${chart.unit}): ${chart.data
        .map((d) => `${d.label} ${d.lowLabel}–${d.highLabel}`)
        .join(", ")}`;
  }
}

export function MovesPhaseCharts({ model }: MovesPhaseChartsProps) {
  if (model.pending || model.charts.length === 0) return null;
  return (
    <section className="mpc" data-testid="moves-phase-charts">
      <style>{MPC_CSS}</style>
      <div className="mpc-grid">
        {model.charts.map((chart) => (
          <CardShell key={chart.id} chart={chart} ariaLabel={ariaFor(chart)}>
            <ChartSvg chart={chart} />
          </CardShell>
        ))}
      </div>
      {model.anyIllustrative && model.honestyNote ? (
        <p className="mpc-illus" data-testid="charts-honesty-note">
          <span className="mpc-chip is-illus">Illustrative</span>
          {model.honestyNote}
        </p>
      ) : null}
    </section>
  );
}

/* Scoped to .mpc; inherits the v2 locked-light tokens (--mcf-*). */
const MPC_CSS = `
.mpc{display:flex;flex-direction:column;gap:12px;margin-top:4px}
.mpc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
.mpc-card{border:1px solid var(--mcf-line);border-radius:11px;background:var(--mcf-bg);padding:14px 16px;min-width:0}
.mpc-ct{font-weight:600;font-size:13.5px;color:var(--mcf-ink);display:flex;align-items:center;gap:8px}
.mpc-cs{font-size:12px;color:var(--mcf-muted);margin:3px 0 10px;max-width:60ch}
.mpc-card svg{display:block;width:100%;height:auto}
.mpc-chip{font-family:var(--mcf-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;padding:3px 7px;border-radius:999px;white-space:nowrap}
.mpc-chip.is-illus{color:#ba7517;background:rgba(186,117,23,.12)}
.mpc-chip.is-derived{color:var(--mcf-teal);background:rgba(29,158,117,.12)}
.mpc-illus{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 0;font-size:12px;color:var(--mcf-muted);max-width:82ch}
`;
