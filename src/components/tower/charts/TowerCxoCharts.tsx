"use client";

// Recharts-based visualizations for the Tower CXO command center (Value,
// Budget, Benchmark sections). These sit alongside the existing governed
// tables in TowerIndexPage.tsx — they're a visual summary, not a replacement;
// the tables remain the source of full per-row detail and evidence links.
//
// Data contracts: CioTowerPortfolioValueRow / CioTowerCxoBenchmarkRow come
// from src/lib/cio-tower/cxo-view-model.ts (loadCioTowerCxoView, deterministic
// SQL over cio_tower.facts/measure_results). TowerBudgetRollup comes from
// src/lib/tower/tower-budget-rollups.ts (listTowerBudgetRollupsForClient,
// same substrate, grouped by entity). No chart here computes a number —
// every value is read directly off these already-computed rows.
//
// TowerBudgetRollup has no department/sector/owner field, so entity rows
// show only what the substrate actually carries (name + $ figures). Program
// rows already carry "Owner not loaded" honestly upstream (CxoPortfolioValuePackTable)
// — these charts don't invent a name where the fact table has none.

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
  type YAxisTickContentProps,
} from "recharts";
import type {
  CioTowerCxoBenchmarkRow,
  CioTowerPortfolioValueRow,
} from "@/lib/cio-tower/cxo-view-model";
import type { TowerBudgetRollup } from "@/lib/tower/tower-budget-rollups";

// Local copy of the locked AbarVa/Tower design tokens (TowerIndexPage.tsx
// keeps its own `T` unexported — duplicated here rather than widening that
// file's export surface for a handful of color/font constants).
const CT = {
  INK: "#1A1A18",
  INK_2: "#525866",
  GRAY: "#9AA3B2",
  GRAY_DK: "#525866",
  RULE: "rgba(10,10,11,0.10)",
  CREAM_DEEP: "#eeece6",
  GOLD: "#c9a227",
  GREEN: "#1d9e75",
  GREEN_DEEP: "#0f6e5b",
  GREEN_SOFT: "#c9ece2",
  GREEN_BG: "#e1f5ee",
  AMBER: "#ba7517",
  SERIF: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  SANS: 'var(--font-inter), "Inter", system-ui, sans-serif',
  MONO: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

function formatMoneyShort(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!n) return "$0";
  if (Math.abs(n) >= 1_000_000_000)
    return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function ChartEyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: CT.MONO,
        fontSize: 9.5,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: CT.GOLD,
        fontWeight: 900,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

// ─── Value: the flagship program's committed → promised → measured bridge ─
//
// The single highest-promised-value program, as a 3-bar bridge: what's
// committed, what was promised, and how much of the promise has actually
// been measured so far (measured stacked under the still-unproven balance).

export function ValueBridgeChart({
  program,
}: {
  program: CioTowerPortfolioValueRow;
}) {
  const committed = program.budgetNumeric ?? 0;
  const promised = program.promisedValueNumeric ?? 0;
  const measured = Math.min(program.measuredValueNumeric ?? 0, promised);
  const toProve = Math.max(promised - measured, 0);
  const pctProven = promised > 0 ? Math.round((measured / promised) * 100) : 0;

  if (promised <= 0) return null;

  const data = [
    { label: "Committed", committed, promised: 0, measured: 0, toProve: 0 },
    { label: "Promised", committed: 0, promised, measured: 0, toProve: 0 },
    { label: "Measured", committed: 0, promised: 0, measured, toProve },
  ];

  const sourceLine = [program.owner, program.source]
    .filter((v) => v && v !== "Owner not loaded")
    .join(" · ");

  return (
    <div>
      <div
        style={{
          fontFamily: CT.MONO,
          fontSize: 9.5,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: CT.GOLD,
          fontWeight: 900,
          marginBottom: 10,
        }}
      >
        Committed → Promised → Measured
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div style={{ fontFamily: CT.SERIF, fontSize: 26, color: CT.INK }}>
          {program.program}
        </div>
        {sourceLine ? (
          <div
            style={{
              fontFamily: CT.MONO,
              fontSize: 10,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: CT.GRAY_DK,
            }}
          >
            {sourceLine}
          </div>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 36, right: 24, left: 4, bottom: 4 }}
          barCategoryGap="30%"
        >
          <XAxis
            dataKey="label"
            tick={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK_2 }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <YAxis hide domain={[0, Math.max(promised, committed) * 1.15]} />
          <Bar
            dataKey="committed"
            fill={CT.INK}
            radius={[4, 4, 0, 0]}
            maxBarSize={110}
          >
            <LabelList
              dataKey="committed"
              position="top"
              formatter={(v) =>
                Number(v) > 0 ? formatMoneyShort(Number(v)) : ""
              }
              style={{
                fontFamily: CT.SERIF,
                fontSize: 20,
                fontWeight: 700,
                fill: CT.INK,
              }}
            />
          </Bar>
          <Bar
            dataKey="promised"
            fill={CT.GREEN_DEEP}
            radius={[4, 4, 0, 0]}
            maxBarSize={110}
          >
            <LabelList
              dataKey="promised"
              position="top"
              formatter={(v) =>
                Number(v) > 0 ? formatMoneyShort(Number(v)) : ""
              }
              style={{
                fontFamily: CT.SERIF,
                fontSize: 20,
                fontWeight: 700,
                fill: CT.INK,
              }}
            />
          </Bar>
          <Bar
            dataKey="measured"
            stackId="measured"
            fill={CT.GREEN}
            radius={[0, 0, 0, 0]}
            maxBarSize={110}
          >
            <LabelList
              dataKey="measured"
              position="center"
              formatter={(v) =>
                Number(v) > 0 ? formatMoneyShort(Number(v)) : ""
              }
              style={{
                fontFamily: CT.SANS,
                fontSize: 13,
                fontWeight: 700,
                fill: "#fff",
              }}
            />
          </Bar>
          <Bar
            dataKey="toProve"
            stackId="measured"
            fill={CT.GREEN_SOFT}
            radius={[4, 4, 0, 0]}
            maxBarSize={110}
          >
            <LabelList
              dataKey="toProve"
              position="center"
              formatter={(v) =>
                Number(v) > 0 ? `${formatMoneyShort(Number(v))} to prove` : ""
              }
              style={{ fontFamily: CT.SANS, fontSize: 11, fill: CT.INK_2 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 8 }}>
        <span
          style={{
            fontFamily: CT.SERIF,
            fontSize: 24,
            color: CT.GREEN_DEEP,
            fontWeight: 700,
          }}
        >
          {pctProven}% proven
        </span>
        <span style={{ fontFamily: CT.SERIF, fontSize: 24, color: CT.INK }}>
          {" "}
          of the promise.
        </span>
        <div
          style={{
            fontFamily: CT.SANS,
            fontSize: 13.5,
            color: CT.INK_2,
            marginTop: 4,
          }}
        >
          {formatMoneyShort(measured)} measured of {formatMoneyShort(promised)}{" "}
          promised · {formatMoneyShort(committed)} committed, not yet evidenced.
        </div>
      </div>
    </div>
  );
}

// ─── Value: proven vs. promised, per program ──────────────────────────────
//
// One bar per program, split into "measured" (solid) and "unproven"
// (promised minus measured, soft), each labeled with the exact fraction and
// percent proven — mirrors CxoPortfolioValuePackTable's rows in chart form.

interface ValueProvenChartRow {
  program: string;
  fullProgram: string;
  measured: number;
  unproven: number;
  promised: number;
  committed: number;
  pctProven: number;
  labelText: string;
}

function ValueProvenEndLabel(
  props: LabelProps & { rows: ValueProvenChartRow[] },
) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const index = Number(props.index ?? 0);
  const row = props.rows[index];
  if (!row) return null;
  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dy={4}
      textAnchor="start"
      style={{ fontFamily: CT.SANS, fontSize: 11, fill: CT.INK_2 }}
    >
      {row.labelText}
    </text>
  );
}

export function ValueProvenBarChart({
  rows,
}: {
  rows: ReadonlyArray<CioTowerPortfolioValueRow>;
}) {
  const chartRows: ValueProvenChartRow[] = rows
    .filter(
      (row) =>
        row.promisedValueNumeric !== null && row.promisedValueNumeric > 0,
    )
    .slice()
    .sort(
      (a, b) => (b.promisedValueNumeric ?? 0) - (a.promisedValueNumeric ?? 0),
    )
    .slice(0, 8)
    .map((row) => {
      const promised = row.promisedValueNumeric ?? 0;
      const measured = Math.min(row.measuredValueNumeric ?? 0, promised);
      const unproven = Math.max(promised - measured, 0);
      const pctProven =
        promised > 0 ? Math.round((measured / promised) * 100) : 0;
      return {
        program:
          row.program.length > 26
            ? `${row.program.slice(0, 24)}…`
            : row.program,
        fullProgram: row.program,
        measured,
        unproven,
        promised,
        committed: row.budgetNumeric ?? 0,
        pctProven,
        labelText: `${formatMoneyShort(measured)} / ${formatMoneyShort(promised)} · ${pctProven}%`,
      };
    });

  if (chartRows.length === 0) return null;

  return (
    <div>
      <ChartEyebrow>Value proven vs. promised — top programs</ChartEyebrow>
      <ResponsiveContainer
        width="100%"
        height={Math.max(220, chartRows.length * 48)}
      >
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 140, left: 4, bottom: 4 }}
          barCategoryGap={16}
        >
          <CartesianGrid horizontal={false} stroke={CT.RULE} />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatMoneyShort(value)}
            tick={{ fontFamily: CT.SANS, fontSize: 11, fill: CT.GRAY_DK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="program"
            width={190}
            tick={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              formatMoneyShort(Number(value)),
              name === "measured"
                ? "Measured"
                : "Unproven (promised − measured)",
            ]}
            labelFormatter={(label, payload) =>
              (payload?.[0]?.payload as { fullProgram?: string } | undefined)
                ?.fullProgram ?? label
            }
            contentStyle={{
              fontFamily: CT.SANS,
              fontSize: 12,
              border: `1px solid ${CT.RULE}`,
              borderRadius: 8,
            }}
          />
          <Bar
            dataKey="measured"
            stackId="value"
            fill={CT.GREEN}
            radius={[4, 0, 0, 4]}
          />
          <Bar
            dataKey="unproven"
            stackId="value"
            fill={CT.GREEN_SOFT}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              content={(props) => (
                <ValueProvenEndLabel {...props} rows={chartRows} />
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Budget: run vs. change, per entity ───────────────────────────────────
//
// Holdco + operating companies, one stacked horizontal bar each — run
// (keeps-the-lights-on) in ink, change (builds-the-future) in green, each
// segment labeled with its own dollar figure and the row's total at the end.
// Entities where change is a small share of the total ("mostly run") are
// flagged inline, and a bottom callout summarizes the holdco-wide split —
// all computed from the real rows, nothing hardcoded.

const MOSTLY_RUN_THRESHOLD = 0.15;

interface BudgetChartRow {
  entity: string;
  fullEntity: string;
  run: number;
  change: number;
  total: number;
  changeRatio: number;
  mostlyRun: boolean;
}

function BudgetYAxisTick(
  props: Partial<YAxisTickContentProps> & {
    rowsByEntity: Map<string, BudgetChartRow>;
  },
) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const payload = props.payload;
  const row = payload
    ? props.rowsByEntity.get(String(payload.value))
    : undefined;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={row?.mostlyRun ? -3 : 4}
        textAnchor="end"
        style={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK }}
      >
        {payload?.value}
      </text>
      {row?.mostlyRun ? (
        <text
          x={0}
          y={12}
          textAnchor="end"
          style={{
            fontFamily: CT.MONO,
            fontSize: 9,
            fill: CT.AMBER,
            letterSpacing: "0.5px",
          }}
        >
          {`change ${Math.round(row.changeRatio * 100)}% · mostly run`}
        </text>
      ) : null}
    </g>
  );
}

function BudgetSegmentLabel(
  props: LabelProps & {
    rows: BudgetChartRow[];
    field: "run" | "change";
  },
) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const index = Number(props.index ?? 0);
  const row = props.rows[index];
  // Recharts passes the stacked cumulative top as `value` for the second+
  // segment of a stacked bar, not the segment's own magnitude — read the
  // real per-field amount off the row instead of trusting `props.value`.
  const value = row ? row[props.field] : 0;
  if (!value || width < 34) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      dy={4}
      textAnchor="middle"
      style={{
        fontFamily: CT.SANS,
        fontSize: 10.5,
        fontWeight: 700,
        fill: "#fff",
      }}
    >
      {formatMoneyShort(value)}
    </text>
  );
}

function BudgetTotalLabel(props: LabelProps & { rows: BudgetChartRow[] }) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const index = Number(props.index ?? 0);
  const row = props.rows[index];
  if (!row) return null;
  return (
    <text
      x={x + width + 10}
      y={y + height / 2}
      dy={4}
      textAnchor="start"
      style={{
        fontFamily: CT.SANS,
        fontSize: 12.5,
        fontWeight: 700,
        fill: CT.INK,
      }}
    >
      {formatMoneyShort(row.total)}
    </text>
  );
}

export function BudgetRunChangeChart({
  rows,
}: {
  rows: ReadonlyArray<TowerBudgetRollup>;
}) {
  const chartRows: BudgetChartRow[] = rows
    .filter((row) => row.totalItBudgetUsd > 0)
    .slice()
    .sort((a, b) => b.totalItBudgetUsd - a.totalItBudgetUsd)
    .slice(0, 10)
    .map((row) => {
      const changeRatio =
        row.totalItBudgetUsd > 0
          ? row.changeAmountUsd / row.totalItBudgetUsd
          : 0;
      const label =
        row.portfolioCompany.length > 30
          ? `${row.portfolioCompany.slice(0, 28)}…`
          : row.portfolioCompany;
      return {
        entity: label,
        fullEntity: row.portfolioCompany,
        run: row.runAmountUsd,
        change: row.changeAmountUsd,
        total: row.totalItBudgetUsd,
        changeRatio,
        mostlyRun: changeRatio > 0 && changeRatio < MOSTLY_RUN_THRESHOLD,
      };
    });

  if (chartRows.length === 0) return null;

  const rowsByEntity = new Map(chartRows.map((row) => [row.entity, row]));
  const totalRun = chartRows.reduce((sum, row) => sum + row.run, 0);
  const totalChange = chartRows.reduce((sum, row) => sum + row.change, 0);
  const totalBudget = totalRun + totalChange;
  const overallChangePct =
    totalBudget > 0 ? Math.round((totalChange / totalBudget) * 100) : 0;
  const mostlyRunEntities = chartRows.filter((row) => row.mostlyRun);

  return (
    <div>
      <div
        style={{
          fontFamily: CT.SERIF,
          fontSize: 20,
          color: CT.INK,
          marginBottom: 4,
        }}
      >
        Run keeps the lights on.{" "}
        <span style={{ color: CT.INK_2, fontStyle: "italic" }}>
          Change funds the future.
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          fontFamily: CT.SANS,
          fontSize: 12,
          color: CT.INK_2,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: CT.INK,
              display: "inline-block",
            }}
          />
          Run — operate &amp; maintain
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: CT.GREEN,
              display: "inline-block",
            }}
          />
          Change — build &amp; transform
        </span>
      </div>
      <ResponsiveContainer
        width="100%"
        height={Math.max(240, chartRows.length * 46)}
      >
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 70, left: 4, bottom: 4 }}
          barCategoryGap={14}
        >
          <CartesianGrid horizontal={false} stroke={CT.RULE} />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatMoneyShort(value)}
            tick={{ fontFamily: CT.SANS, fontSize: 11, fill: CT.GRAY_DK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="entity"
            width={210}
            tick={(props) => (
              <BudgetYAxisTick {...props} rowsByEntity={rowsByEntity} />
            )}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              formatMoneyShort(Number(value)),
              name === "run" ? "Run" : "Change",
            ]}
            labelFormatter={(label, payload) =>
              (payload?.[0]?.payload as { fullEntity?: string } | undefined)
                ?.fullEntity ?? label
            }
            contentStyle={{
              fontFamily: CT.SANS,
              fontSize: 12,
              border: `1px solid ${CT.RULE}`,
              borderRadius: 8,
            }}
          />
          <Bar
            dataKey="run"
            stackId="budget"
            fill={CT.INK}
            radius={[4, 0, 0, 4]}
          >
            <LabelList
              content={(props) => (
                <BudgetSegmentLabel {...props} rows={chartRows} field="run" />
              )}
            />
          </Bar>
          <Bar
            dataKey="change"
            stackId="budget"
            fill={CT.GREEN}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              content={(props) => (
                <BudgetSegmentLabel
                  {...props}
                  rows={chartRows}
                  field="change"
                />
              )}
            />
            <LabelList
              content={(props) => (
                <BudgetTotalLabel {...props} rows={chartRows} />
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {mostlyRunEntities.length > 0 ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: CT.GREEN_BG,
            borderLeft: `3px solid ${CT.GREEN}`,
            borderRadius: 6,
            fontFamily: CT.SANS,
            fontSize: 13,
            color: CT.INK_2,
            lineHeight: 1.5,
          }}
        >
          Across the holdco,{" "}
          <strong style={{ color: CT.INK }}>{overallChangePct}%</strong> of
          spend is change — the rest keeps existing systems running.{" "}
          {mostlyRunEntities.map((row, i) => (
            <span key={row.entity}>
              <strong style={{ color: CT.INK }}>{row.fullEntity}</strong> (
              {Math.round(row.changeRatio * 100)}% change)
              {i < mostlyRunEntities.length - 1 ? " and " : " "}
            </span>
          ))}
          sit almost entirely in run: worth asking whether they&rsquo;re
          under-investing in modernization, or genuinely steady-state.
        </div>
      ) : null}
    </div>
  );
}

// ─── Benchmark: this tenant vs. real governed peers ───────────────────────
//
// Per-tenant summary cards (this tenant highlighted) plus a radar overlay
// across four normalized measures so tenants of very different absolute
// size stay comparable on one shape. Peers are already anonymized upstream
// (loadCioTowerCxoView labels them "Peer 1", "Peer 2", ...) — this component
// does not add or remove any identifying detail.

interface BenchmarkRow {
  label: string;
  isCurrent: boolean;
  totalBudget: number;
  runPct: number;
  changePct: number;
  valueProvenPct: number;
}

function benchmarkRows(
  rows: ReadonlyArray<CioTowerCxoBenchmarkRow>,
): BenchmarkRow[] {
  const ratio = (numerator: number | null, denominator: number | null) =>
    numerator !== null && denominator !== null && denominator > 0
      ? Math.round((numerator / denominator) * 100)
      : 0;
  return rows.map((row) => ({
    label: row.isCurrent ? "This tenant" : row.label,
    isCurrent: row.isCurrent,
    totalBudget: row.totalBudget ?? 0,
    runPct: ratio(row.runBudget, row.totalBudget),
    changePct: ratio(row.changeBudget, row.totalBudget),
    valueProvenPct: ratio(row.measuredValue, row.promisedValue),
  }));
}

function MiniBar({ pct, tone }: { pct: number; tone: "current" | "peer" }) {
  return (
    <div
      style={{
        height: 6,
        borderRadius: 999,
        background: CT.CREAM_DEEP,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: "100%",
          background: tone === "current" ? CT.GREEN : CT.GRAY,
        }}
      />
    </div>
  );
}

export function BenchmarkTenantCards({
  rows,
  currentTenantName,
}: {
  rows: ReadonlyArray<CioTowerCxoBenchmarkRow>;
  currentTenantName: string;
}) {
  const cards = benchmarkRows(rows);
  if (cards.length === 0) return null;

  return (
    <div>
      <ChartEyebrow>
        Against real governed tenants — not a synthetic corpus
      </ChartEyebrow>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))`,
          gap: 12,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              border: `1px solid ${card.isCurrent ? CT.GREEN : CT.RULE}`,
              background: card.isCurrent ? CT.GREEN_BG : "#fff",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontFamily: CT.SERIF,
                fontSize: 16,
                color: CT.INK,
                marginBottom: 2,
              }}
            >
              {card.isCurrent ? currentTenantName : card.label}
            </div>
            <div
              style={{
                fontFamily: CT.MONO,
                fontSize: 9,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: card.isCurrent ? CT.GREEN : CT.GRAY_DK,
                marginBottom: 10,
              }}
            >
              {card.isCurrent ? "You · this tenant" : "Governed tenant"}
            </div>
            {[
              {
                label: "Total budget",
                value: formatMoneyShort(card.totalBudget),
                pct: 100,
              },
              {
                label: "Run share",
                value: `${card.runPct}%`,
                pct: card.runPct,
              },
              {
                label: "Change share",
                value: `${card.changePct}%`,
                pct: card.changePct,
              },
              {
                label: "Value proven",
                value: `${card.valueProvenPct}%`,
                pct: card.valueProvenPct,
              },
            ].map((stat, i) => (
              <div key={stat.label} style={{ marginTop: i === 0 ? 0 : 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: CT.MONO,
                    fontSize: 9,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: CT.GRAY_DK,
                    marginBottom: 3,
                  }}
                >
                  <span>{stat.label}</span>
                  <span style={{ color: CT.INK, fontWeight: 700 }}>
                    {stat.value}
                  </span>
                </div>
                {stat.label === "Total budget" ? null : (
                  <MiniBar
                    pct={stat.pct}
                    tone={card.isCurrent ? "current" : "peer"}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BenchmarkRadarChart({
  rows,
}: {
  rows: ReadonlyArray<CioTowerCxoBenchmarkRow>;
}) {
  const cards = benchmarkRows(rows);
  if (cards.length === 0) return null;

  const maxBudget = Math.max(...cards.map((c) => c.totalBudget), 1);
  const radarData = ["Budget", "Run share", "Value proven", "Change share"].map(
    (axis) => {
      const point: Record<string, number | string> = { axis };
      for (const card of cards) {
        const value =
          axis === "Budget"
            ? Math.round((card.totalBudget / maxBudget) * 100)
            : axis === "Run share"
              ? card.runPct
              : axis === "Value proven"
                ? card.valueProvenPct
                : card.changePct;
        point[card.label] = value;
      }
      return point;
    },
  );

  return (
    <div>
      <ChartEyebrow>Every measure, one shape</ChartEyebrow>
      <div
        style={{
          fontFamily: CT.SERIF,
          fontSize: 20,
          color: CT.INK,
          marginBottom: 12,
        }}
      >
        Lakeshore against the peer set —{" "}
        <span style={{ color: CT.INK_2, fontStyle: "italic" }}>
          apples to apples.
        </span>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={radarData} outerRadius="72%">
          <PolarGrid stroke={CT.RULE} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontFamily: CT.SANS, fontSize: 9, fill: CT.GRAY_DK }}
            tickCount={5}
          />
          {cards.map((card) => (
            <Radar
              key={card.label}
              name={card.isCurrent ? "This tenant" : card.label}
              dataKey={card.label}
              stroke={card.isCurrent ? CT.GREEN_DEEP : CT.GRAY}
              fill={card.isCurrent ? CT.GREEN : CT.GRAY}
              fillOpacity={card.isCurrent ? 0.28 : 0}
              strokeWidth={card.isCurrent ? 2.5 : 1.25}
              strokeDasharray={card.isCurrent ? undefined : "4 3"}
            />
          ))}
          <Legend
            wrapperStyle={{
              fontFamily: CT.SANS,
              fontSize: 12,
              color: CT.INK_2,
            }}
          />
          <Tooltip
            formatter={(value) => `${Number(value)}%`}
            contentStyle={{
              fontFamily: CT.SANS,
              fontSize: 12,
              border: `1px solid ${CT.RULE}`,
              borderRadius: 8,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div
        style={{
          fontFamily: CT.SANS,
          fontSize: 12,
          color: CT.GRAY_DK,
          marginTop: 8,
          fontStyle: "italic",
        }}
      >
        Peers are other governed tenants loaded in AbarVa, anonymized. Coverage
        is whoever is loaded — not a full market panel.
      </div>
    </div>
  );
}

/** @deprecated use BenchmarkTenantCards + BenchmarkRadarChart instead. */
export function BenchmarkComparisonChart({
  rows,
}: {
  rows: ReadonlyArray<CioTowerCxoBenchmarkRow>;
}) {
  const chartRows = benchmarkRows(rows);
  if (chartRows.length === 0) return null;

  return (
    <div>
      <ChartEyebrow>
        Every measure, one shape — Lakeshore against the peer set
      </ChartEyebrow>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartRows}
          margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
          barGap={4}
        >
          <CartesianGrid vertical={false} stroke={CT.RULE} />
          <XAxis
            dataKey="label"
            tick={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => `${value}%`}
            tick={{ fontFamily: CT.SANS, fontSize: 11, fill: CT.GRAY_DK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              `${Number(value)}%`,
              name === "runPct"
                ? "Run share"
                : name === "changePct"
                  ? "Change share"
                  : "Value proven",
            ]}
            contentStyle={{
              fontFamily: CT.SANS,
              fontSize: 12,
              border: `1px solid ${CT.RULE}`,
              borderRadius: 8,
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "runPct"
                ? "Run share"
                : value === "changePct"
                  ? "Change share"
                  : "Value proven"
            }
            wrapperStyle={{
              fontFamily: CT.SANS,
              fontSize: 12,
              color: CT.INK_2,
            }}
          />
          <Bar dataKey="runPct" fill={CT.INK} radius={[3, 3, 0, 0]}>
            {chartRows.map((row) => (
              <Cell key={row.label} fillOpacity={row.isCurrent ? 1 : 0.55} />
            ))}
          </Bar>
          <Bar dataKey="changePct" fill={CT.GREEN} radius={[3, 3, 0, 0]}>
            {chartRows.map((row) => (
              <Cell key={row.label} fillOpacity={row.isCurrent ? 1 : 0.55} />
            ))}
          </Bar>
          <Bar dataKey="valueProvenPct" fill={CT.AMBER} radius={[3, 3, 0, 0]}>
            {chartRows.map((row) => (
              <Cell key={row.label} fillOpacity={row.isCurrent ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
