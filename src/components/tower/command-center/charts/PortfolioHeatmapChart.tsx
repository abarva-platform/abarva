"use client";

// Portfolio heatmap — value at stake × proof maturity, coloured by lane.
// Transcribed from `chart_quad()` in the design file (line ~1278).

import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerLaneKey,
  TowerProgramView,
} from "@/lib/tower/command-center/types";

import { LANE_HEX, LANE_WORD } from "../primitives";
import { ChartTooltip, HEX, scatterDatum, toM } from "./chart-kit";
import { MeasuredChartFrame } from "./MeasuredChartFrame";

interface QuadPoint {
  x: number;
  y: number;
  z: number;
  id: string;
  name: string;
  label: string;
}

function shortLabel(name: string): string {
  const compact = name.replace(/\s+Wave\s+\d+$/i, "").trim();
  return compact.length > 22 ? `${compact.slice(0, 19)}...` : compact;
}

export function PortfolioHeatmapChart({
  programs,
  onSelect,
}: {
  programs: readonly TowerProgramView[];
  onSelect: (programId: string) => void;
}) {
  const maxStakeM = Math.max(1, ...programs.map((p) => toM(p.valueAtStakeUsd)));
  const labeledProgramIds = new Set(
    [...programs]
      .sort((a, b) => b.valueAtStakeUsd - a.valueAtStakeUsd)
      .slice(0, 8)
      .map((p) => p.id),
  );

  const byLane = new Map<TowerLaneKey, QuadPoint[]>();
  for (const p of programs) {
    const stake = toM(p.valueAtStakeUsd);
    const points = byLane.get(p.lane) ?? [];
    points.push({
      x: p.evidenceMaturity,
      y: stake,
      z: stake,
      id: p.id,
      name: p.name,
      label: labeledProgramIds.has(p.id) ? shortLabel(p.name) : "",
    });
    byLane.set(p.lane, points);
  }

  return (
    <MeasuredChartFrame minHeight={220}>
      {({ width, height }) => (
        <ScatterChart
          width={width}
          height={height}
          margin={{ top: 12, right: 14, left: 2, bottom: 20 }}
        >
          <CartesianGrid stroke={HEX.border} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            name="Proof maturity"
            tickCount={6}
            tick={{
              fontSize: 9.5,
              fill: HEX.gray300,
              fontFamily: "var(--abarva-mono)",
            }}
            axisLine={{ stroke: HEX.borderStrong }}
            tickLine={false}
            label={{
              value: "Proof maturity (0 = no usable proof loaded) →",
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
            domain={[0, Math.ceil(maxStakeM)]}
            name="Program promised value"
            tick={{
              fontSize: 9.5,
              fill: HEX.gray300,
              fontFamily: "var(--abarva-mono)",
            }}
            axisLine={false}
            tickLine={false}
            width={34}
            tickFormatter={(v: number) => `$${v}M`}
          />
          <ZAxis type="number" dataKey="z" range={[60, 620]} />
          <ReferenceLine
            x={50}
            stroke={HEX.borderStrong}
            strokeDasharray="3 3"
          />
          <ReferenceLine
            y={maxStakeM / 2}
            stroke={HEX.borderStrong}
            strokeDasharray="3 3"
          />
          <ChartTooltip />
          {[...byLane.entries()].map(([lane, points]) => (
            <Scatter
              key={lane}
              name={LANE_WORD[lane]}
              data={points}
              fill={LANE_HEX[lane]}
              fillOpacity={0.85}
              stroke="#fff"
              strokeWidth={1.5}
              isAnimationActive={false}
              style={{ cursor: "pointer" }}
              onClick={(arg: unknown) => {
                const point = scatterDatum<QuadPoint>(arg);
                if (point?.id) onSelect(point.id);
              }}
            >
              <LabelList
                dataKey="label"
                position="right"
                offset={7}
                style={{
                  fontFamily: "var(--abarva-sans)",
                  fontSize: 10,
                  fontWeight: 650,
                  fill: HEX.gray700,
                  pointerEvents: "none",
                }}
              />
            </Scatter>
          ))}
        </ScatterChart>
      )}
    </MeasuredChartFrame>
  );
}

/**
 * Text alternative for the heatmap. Associated with the chart via
 * `aria-describedby` so the picture is not the only route to its content.
 */
export function heatmapTextAlternative(
  programs: readonly TowerProgramView[],
): string {
  if (programs.length === 0) return "No programs to plot.";
  return programs
    .map(
      (p) =>
        `${p.name}: evidence maturity ${p.evidenceMaturity} of 100, ` +
        `${formatUsdM(p.valueAtStakeUsd)} value at stake, ${LANE_WORD[p.lane]} lane.`,
    )
    .join(" ");
}
