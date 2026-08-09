"use client";

// CFO conversion bridge.
//
// The values arrive from the governed view-model. This chart only changes
// units for plotting and keeps null values blank.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerConversionBridgeStage } from "@/lib/tower/command-center/types";

import { HEX, withSliver } from "./chart-kit";
import { MeasuredChartFrame } from "./MeasuredChartFrame";

const TONE_FILL: Record<TowerConversionBridgeStage["tone"], string> = {
  teal: HEX.teal,
  amber: HEX.amber,
  red: HEX.red,
  gray: HEX.gray300,
};

function toM(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return value / 1_000_000;
}

function labelFor(stage: TowerConversionBridgeStage) {
  return stage.label.length > 20 ? stage.label.replace(" ", "\n") : stage.label;
}

export function ValueConversionBridgeChart({
  stages,
}: {
  stages: readonly TowerConversionBridgeStage[];
}) {
  const plottedValues = stages
    .map((stage) => toM(stage.valueUsd))
    .filter((value): value is number => value !== null);
  const axisMax = Math.max(...plottedValues.map(Math.abs), 0.0001);
  const data = stages.map((stage, index) => {
    const valueM = toM(stage.valueUsd);
    return {
      key: stage.key,
      label: labelFor(stage),
      plotValue: valueM === null ? 0 : withSliver(Math.max(valueM, 0), axisMax),
      displayValue: formatUsdM(stage.valueUsd),
      countLabel:
        stage.count === null ? "" : `${formatCount(stage.count)} claims`,
      fill: TONE_FILL[stage.tone],
      order: String(index + 1).padStart(2, "0"),
    };
  });

  return (
    <MeasuredChartFrame minHeight={220}>
      {({ width, height }) => (
        <BarChart
          width={width}
          height={height}
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 64, left: 104, bottom: 2 }}
          barCategoryGap="18%"
        >
          <CartesianGrid horizontal={false} stroke={HEX.border} />
          <XAxis
            type="number"
            tickFormatter={(value: number) => `$${value}`}
            tick={{
              fontSize: 10,
              fill: HEX.gray300,
              fontFamily: "var(--abarva-mono)",
            }}
            axisLine={{ stroke: HEX.borderStrong }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={102}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fill: HEX.gray700,
              fontFamily: "var(--abarva-mono)",
            }}
          />
          <Bar
            dataKey="plotValue"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            {data.map((row) => (
              <Cell key={row.key} fill={row.fill} />
            ))}
            <LabelList
              dataKey="displayValue"
              position="right"
              style={{
                fontFamily: "var(--abarva-mono)",
                fontSize: 10.5,
                fontWeight: 650,
                fill: HEX.gray900,
              }}
            />
            <LabelList
              dataKey="countLabel"
              position="insideLeft"
              style={{
                fontFamily: "var(--abarva-mono)",
                fontSize: 9.5,
                fill: "#ffffff",
              }}
            />
          </Bar>
        </BarChart>
      )}
    </MeasuredChartFrame>
  );
}
