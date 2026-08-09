"use client";

// Eight-quarter governed value trajectory.
//
// React does not classify or calculate value here. It only converts whole USD
// columns from the view-model into $M chart units.

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerTrajectoryPoint } from "@/lib/tower/command-center/types";

import { HEX } from "./chart-kit";
import { MeasuredChartFrame } from "./MeasuredChartFrame";

function toM(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return value / 1_000_000;
}

function tooltipFormatter(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return formatUsdM(numeric * 1_000_000);
}

export function EightQuarterTrajectoryChart({
  points,
}: {
  points: readonly TowerTrajectoryPoint[];
}) {
  const data = points.map((point) => ({
    quarter: point.fiscalQuarter,
    plannedInvestment: toM(point.plannedInvestmentUsd),
    actualSpend: toM(point.actualSpendUsd),
    riskAdjustedForecast: toM(point.riskAdjustedForecastUsd),
    financeRunRate: toM(point.financeValidatedRunRateUsd),
    financialConversion: toM(point.financialConversionUsd),
  }));

  return (
    <MeasuredChartFrame minHeight={220}>
      {({ width, height }) => (
        <ComposedChart
          width={width}
          height={height}
          data={data}
          margin={{ top: 14, right: 20, left: 4, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={HEX.border} />
          <XAxis
            dataKey="quarter"
            tickLine={false}
            axisLine={{ stroke: HEX.borderStrong }}
            tick={{
              fontSize: 10,
              fill: HEX.gray500,
              fontFamily: "var(--abarva-mono)",
            }}
          />
          <YAxis
            tickFormatter={(value: number) => `$${value}`}
            tick={{
              fontSize: 10,
              fill: HEX.gray300,
              fontFamily: "var(--abarva-mono)",
            }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            formatter={tooltipFormatter as never}
            contentStyle={{
              fontFamily: "var(--abarva-sans)",
              fontSize: 12,
              border: `1px solid ${HEX.borderStrong}`,
              borderRadius: 8,
              boxShadow: "var(--shadow-pop)",
              padding: "8px 11px",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="plainline"
            wrapperStyle={{
              fontFamily: "var(--abarva-sans)",
              fontSize: 11,
              color: HEX.gray700,
              paddingBottom: 4,
            }}
          />
          <Bar
            dataKey="plannedInvestment"
            name="Planned investment"
            fill={HEX.gray300}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="actualSpend"
            name="Actual spend"
            fill={HEX.amber}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="riskAdjustedForecast"
            name="Risk forecast"
            stroke={HEX.signalBlue}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="financeRunRate"
            name="Finance run-rate"
            stroke={HEX.tealDark}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="financialConversion"
            name="Conversion"
            stroke={HEX.red}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      )}
    </MeasuredChartFrame>
  );
}
