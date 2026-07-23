"use client";

// AI bubble matrix — value potential × readiness, bubble size = AI spend.
// Transcribed from `chart_bubble()` in the design file (line ~1300).
//
// The `<LabelList>` nested inside `<Scatter>` puts the initiative's ordinal
// inside its circle. Verified still supported on Recharts 3.8.1.

import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerAiKind,
  TowerAiView,
} from "@/lib/tower/command-center/types";

import { AI_KIND_HEX, AI_KIND_WORD } from "../primitives";
import { ChartTooltip, HEX, scatterDatum, toM } from "./chart-kit";

interface BubblePoint {
  x: number;
  y: number;
  z: number;
  n: number;
  name: string;
}

export function AiBubbleMatrixChart({
  items,
  sizeMode = "spend",
  onSelect,
}: {
  items: readonly TowerAiView[];
  sizeMode?: "spend" | "constant";
  onSelect: (n: number) => void;
}) {
  const byKind = new Map<TowerAiKind, BubblePoint[]>();
  for (const item of items) {
    const points = byKind.get(item.kind) ?? [];
    points.push({
      x: item.readinessScore,
      y: item.valueScore,
      z: sizeMode === "constant" ? 1 : Math.max(toM(item.aiSpendUsd), 0.01),
      n: item.n,
      name: item.name,
    });
    byKind.set(item.kind, points);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 12, right: 16, left: 2, bottom: 20 }}>
        <CartesianGrid stroke={HEX.border} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, 100]}
          name="Readiness"
          tick={{
            fontSize: 9.5,
            fill: HEX.gray300,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={{ stroke: HEX.borderStrong }}
          tickLine={false}
          label={{
            value: "Readiness →",
            position: "bottom",
            offset: 6,
            style: {
              fontFamily: "var(--abarva-mono)",
              fontSize: 9.5,
              fill: HEX.gray500,
              letterSpacing: "0.04em",
            },
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[0, 100]}
          name="Value potential"
          tick={{
            fontSize: 9.5,
            fill: HEX.gray300,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={false}
          tickLine={false}
          width={26}
          label={{
            value: "Value →",
            angle: -90,
            position: "insideLeft",
            offset: 14,
            style: {
              fontFamily: "var(--abarva-mono)",
              fontSize: 9.5,
              fill: HEX.gray500,
              letterSpacing: "0.04em",
            },
          }}
        />
        <ZAxis
          type="number"
          dataKey="z"
          range={sizeMode === "constant" ? [260, 260] : [120, 900]}
          name={sizeMode === "constant" ? "Constant radius" : "AI spend"}
        />
        <ReferenceLine x={50} stroke={HEX.borderStrong} strokeDasharray="3 3" />
        <ReferenceLine y={50} stroke={HEX.borderStrong} strokeDasharray="3 3" />
        <ChartTooltip />
        {[...byKind.entries()].map(([kind, points]) => (
          <Scatter
            key={kind}
            name={AI_KIND_WORD[kind]}
            data={points}
            fill={AI_KIND_HEX[kind]}
            fillOpacity={0.82}
            stroke="#fff"
            strokeWidth={1.5}
            isAnimationActive={false}
            style={{ cursor: "pointer" }}
            onClick={(arg: unknown) => {
              const point = scatterDatum<BubblePoint>(arg);
              if (typeof point?.n === "number") onSelect(point.n);
            }}
          >
            <LabelList
              dataKey="n"
              position="center"
              style={{
                fontFamily: "var(--abarva-mono)",
                fontSize: 10.5,
                fontWeight: 700,
                fill: "#fff",
                pointerEvents: "none",
              }}
            />
          </Scatter>
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/** Text alternative for the bubble matrix. */
export function bubbleTextAlternative(
  items: readonly TowerAiView[],
  sizeMode: "spend" | "constant" = "spend",
): string {
  if (items.length === 0) return "No AI initiatives to plot.";
  return items
    .map(
      (a) =>
        `${a.n}. ${a.name}: value ${a.valueScore} of 100, readiness ` +
        `${a.readinessScore} of 100` +
        (sizeMode === "constant"
          ? ", constant bubble radius."
          : `, ${formatUsdM(a.aiSpendUsd)} AI spend.`),
    )
    .join(" ");
}
