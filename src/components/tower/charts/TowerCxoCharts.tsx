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

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  GOLD: "#c9a227",
  GREEN: "#1d9e75",
  GREEN_SOFT: "#a9ded0",
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

function ChartEyebrow({ children }: { children: React.ReactNode }) {
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

// ─── Value: proven vs. promised, per program ──────────────────────────────
//
// One bar per program, split into "measured" (solid) and "unproven"
// (promised minus measured, soft). Sorted by promised value so the biggest
// bets lead. Mirrors CxoPortfolioValuePackTable's data one-to-one — this is
// the same rows, just the visual-summary form of the same table below it.

export function ValueProvenBarChart({
  rows,
}: {
  rows: ReadonlyArray<CioTowerPortfolioValueRow>;
}) {
  const chartRows = rows
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
      return {
        program:
          row.program.length > 28
            ? `${row.program.slice(0, 26)}…`
            : row.program,
        fullProgram: row.program,
        measured,
        unproven,
        promised,
        pctProven: promised > 0 ? Math.round((measured / promised) * 100) : 0,
      };
    });

  if (chartRows.length === 0) return null;

  return (
    <div>
      <ChartEyebrow>Value proven vs. promised — top programs</ChartEyebrow>
      <ResponsiveContainer
        width="100%"
        height={Math.max(220, chartRows.length * 46)}
      >
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
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
            dataKey="program"
            width={190}
            tick={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatMoneyShort(value),
              name === "measured"
                ? "Measured"
                : "Unproven (promised − measured)",
            ]}
            labelFormatter={(_label: string, payload) =>
              payload?.[0]?.payload?.fullProgram ?? _label
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
          >
            <LabelList
              dataKey="pctProven"
              position="insideLeft"
              formatter={(value: number) => (value > 15 ? `${value}%` : "")}
              style={{
                fill: "#fff",
                fontFamily: CT.SANS,
                fontSize: 10,
                fontWeight: 700,
              }}
            />
          </Bar>
          <Bar
            dataKey="unproven"
            stackId="value"
            fill={CT.GREEN_SOFT}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Budget: run vs. change, per entity ───────────────────────────────────
//
// Holdco + operating companies, one stacked horizontal bar each — run
// (keeps-the-lights-on) in ink, change (builds-the-future) in green. Sorted
// by total budget, largest first, matching the entity-spine framing from
// the Portfolio section.

export function BudgetRunChangeChart({
  rows,
}: {
  rows: ReadonlyArray<TowerBudgetRollup>;
}) {
  const chartRows = rows
    .filter((row) => row.totalItBudgetUsd > 0)
    .slice()
    .sort((a, b) => b.totalItBudgetUsd - a.totalItBudgetUsd)
    .slice(0, 10)
    .map((row) => ({
      entity:
        row.portfolioCompany.length > 26
          ? `${row.portfolioCompany.slice(0, 24)}…`
          : row.portfolioCompany,
      run: row.runAmountUsd,
      change: row.changeAmountUsd,
      total: row.totalItBudgetUsd,
    }));

  if (chartRows.length === 0) return null;

  return (
    <div>
      <ChartEyebrow>
        Run keeps the lights on. Change funds the future.
      </ChartEyebrow>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
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
        height={Math.max(220, chartRows.length * 42)}
      >
        <BarChart
          data={chartRows}
          layout="vertical"
          margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
          barCategoryGap={12}
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
            width={190}
            tick={{ fontFamily: CT.SANS, fontSize: 12, fill: CT.INK }}
            axisLine={{ stroke: CT.RULE }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatMoneyShort(value),
              name === "run" ? "Run" : "Change",
            ]}
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
          />
          <Bar
            dataKey="change"
            stackId="budget"
            fill={CT.GREEN}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Benchmark: this tenant vs. real governed peers ───────────────────────
//
// Grouped bars across three percent-of-budget measures so tenants of very
// different absolute size stay comparable. Peers are already anonymized
// upstream (loadCioTowerCxoView labels them "Peer 1", "Peer 2", ...) — this
// chart does not add or remove any identifying detail.

export function BenchmarkComparisonChart({
  rows,
}: {
  rows: ReadonlyArray<CioTowerCxoBenchmarkRow>;
}) {
  const chartRows = rows.map((row) => {
    const ratio = (numerator: number | null, denominator: number | null) =>
      numerator !== null && denominator !== null && denominator > 0
        ? Math.round((numerator / denominator) * 100)
        : 0;
    return {
      label: row.isCurrent ? "This tenant" : row.label,
      isCurrent: row.isCurrent,
      runPct: ratio(row.runBudget, row.totalBudget),
      changePct: ratio(row.changeBudget, row.totalBudget),
      valueProvenPct: ratio(row.measuredValue, row.promisedValue),
    };
  });

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
            formatter={(value: number, name: string) => [
              `${value}%`,
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
