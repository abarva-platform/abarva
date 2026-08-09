"use client";

// AI spend lens — horizontal bars by AI spend category.
// Transcribed from `chart_lens()` in the design file (line ~1322).

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerSpendLensRow } from "@/lib/tower/command-center/types";

import { AI_KIND_HEX } from "../primitives";
import { ChartTooltip, HEX, toM } from "./chart-kit";
import { MeasuredChartFrame } from "./MeasuredChartFrame";

export function AiSpendLensChart({
  rows,
}: {
  rows: readonly TowerSpendLensRow[];
}) {
  const data = [...rows]
    .filter((row) => row.valueUsd > 0)
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .map((row) => ({
      name: row.category,
      v: toM(row.valueUsd),
      lab: formatUsdM(row.valueUsd),
      fill: AI_KIND_HEX[row.kind],
    }));

  const axisMax = Math.ceil(Math.max(0.01, ...data.map((d) => d.v)));

  return (
    <MeasuredChartFrame minHeight={170}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
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
          <ChartTooltip
            formatter={(value) => `$${Number(value).toFixed(1)}M`}
          />
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
      )}
    </MeasuredChartFrame>
  );
}

/** Text alternative for the spend lens. */
export function spendLensTextAlternative(
  rows: readonly TowerSpendLensRow[],
): string {
  const chartRows = rows.filter((r) => r.valueUsd > 0);
  if (chartRows.length === 0)
    return "No positive AI spend recorded by category.";
  return chartRows
    .map((r) => `${r.category}: ${formatUsdM(r.valueUsd)}.`)
    .join(" ");
}
