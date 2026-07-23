"use client";

// AI spend lens — horizontal bars by AI spend category.
// Transcribed from `chart_lens()` in the design file (line ~1322).

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerSpendLensRow } from "@/lib/tower/command-center/types";

import { AI_KIND_HEX } from "../primitives";
import { ChartTooltip, HEX, toM } from "./chart-kit";

export function AiSpendLensChart({
  rows,
}: {
  rows: readonly TowerSpendLensRow[];
}) {
  const data = [...rows]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .map((row) => ({
      name: row.category,
      v: toM(row.valueUsd),
      lab: formatUsdM(row.valueUsd),
      fill: AI_KIND_HEX[row.kind],
    }));

  const axisMax = Math.ceil(Math.max(0.01, ...data.map((d) => d.v)));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 2, right: 52, left: 0, bottom: 2 }}
        barCategoryGap="22%"
      >
        <XAxis type="number" hide domain={[0, axisMax]} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 12,
            fill: HEX.gray700,
            fontFamily: "var(--abarva-sans)",
          }}
        />
        <ChartTooltip formatter={(value) => `$${Number(value).toFixed(1)}M`} />
        <Bar dataKey="v" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
          <LabelList
            dataKey="lab"
            position="right"
            style={{
              fontFamily: "var(--abarva-mono)",
              fontSize: 11.5,
              fontWeight: 600,
              fill: HEX.gray900,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Text alternative for the spend lens. */
export function spendLensTextAlternative(
  rows: readonly TowerSpendLensRow[],
): string {
  if (rows.length === 0) return "No AI spend recorded by category.";
  return rows.map((r) => `${r.category}: ${formatUsdM(r.valueUsd)}.`).join(" ");
}
