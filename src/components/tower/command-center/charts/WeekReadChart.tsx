"use client";

// "This week's read" — the four-stage horizontal bar on the Command Center tab.
// Transcribed from `chart_week()` in the design file (line ~1233).

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
import type { TowerCommandSummary } from "@/lib/tower/command-center/types";

import { HEX, toM, withSliver } from "./chart-kit";

export function WeekReadChart({ summary }: { summary: TowerCommandSummary }) {
  const promisedM = toM(summary.promisedUsd);
  const axisMax = Math.max(promisedM, 0.0001);

  const rows = [
    { name: "Promised", usd: summary.promisedUsd, fill: HEX.gray300 },
    { name: "Usage-supported", usd: summary.usageSupportedUsd, fill: HEX.teal },
    {
      name: "Finance-validated",
      usd: summary.financeValidatedUsd,
      fill: HEX.tealDark,
    },
    { name: "Claimable", usd: summary.claimableUsd, fill: HEX.red },
  ];

  const data = rows.map((row) => ({
    name: row.name,
    // Bar length is the plotted value with a hairline floor so a true zero row
    // still occupies its slot; `lab` always carries the real figure.
    v: withSliver(toM(row.usd), axisMax),
    lab: formatUsdM(row.usd),
    fill: row.fill,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 2, right: 56, left: 0, bottom: 2 }}
        barCategoryGap="26%"
      >
        <XAxis type="number" hide domain={[0, axisMax]} />
        <YAxis
          type="category"
          dataKey="name"
          width={118}
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 11,
            fill: HEX.gray700,
            fontFamily: "var(--abarva-sans)",
          }}
        />
        <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false}>
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
