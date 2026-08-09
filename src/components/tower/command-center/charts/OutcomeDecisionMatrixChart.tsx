"use client";

// Outcome decision matrix — first-screen capital cockpit.
//
// Recharts owns the quantitative rendering. Bubble labels are direct program
// names because this chart is meant to be an operating control, not an abstract
// diagnostic scatter.

import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
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
import { HEX, scatterDatum, toM } from "./chart-kit";
import { MeasuredChartFrame } from "./MeasuredChartFrame";

interface DecisionMatrixPoint {
  id: string;
  name: string;
  label: string;
  owner: string;
  lane: TowerLaneKey;
  x: number;
  y: number;
  z: number;
  blockedUsd: number;
  valueAtStakeUsd: number;
  nextGate: string;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function programRiskScore(program: TowerProgramView): number {
  const laneBase: Record<TowerLaneKey, number> = {
    stop: 88,
    freeze: 78,
    fix: 66,
    watch: 32,
    fund: 18,
  };
  const blockedRatio =
    program.promisedUsd > 0
      ? Math.min(1, program.blockedUsd / program.promisedUsd)
      : 0;
  const usagePenalty = program.usageStatus === "none" ? 12 : 0;
  const financePenalty = program.financeStatus === "none" ? 8 : 0;
  return clampScore(
    laneBase[program.lane] + blockedRatio * 14 + usagePenalty + financePenalty,
  );
}

function shortLabel(name: string): string {
  const compact = name.replace(/\s+Wave\s+\d+$/i, "").trim();
  return compact.length > 24 ? `${compact.slice(0, 21)}...` : compact;
}

function toPoints(
  programs: readonly TowerProgramView[],
): DecisionMatrixPoint[] {
  return [...programs]
    .sort((a, b) => b.valueAtStakeUsd - a.valueAtStakeUsd)
    .slice(0, 6)
    .map((program) => ({
      id: program.id,
      name: program.name,
      label: shortLabel(program.name),
      owner: program.ownerRole ?? "No owner recorded",
      lane: program.lane,
      x: clampScore(program.evidenceMaturity),
      y: programRiskScore(program),
      z: Math.max(1, toM(program.valueAtStakeUsd)),
      blockedUsd: program.blockedUsd,
      valueAtStakeUsd: program.valueAtStakeUsd,
      nextGate: program.nextGate ?? "No governed next gate recorded",
    }));
}

function MatrixTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DecisionMatrixPoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${HEX.borderStrong}`,
        borderRadius: 8,
        boxShadow: "var(--shadow-pop)",
        color: HEX.gray900,
        fontFamily: "var(--abarva-sans)",
        fontSize: 12,
        maxWidth: 250,
        padding: "9px 11px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--abarva-serif)",
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.2,
          marginBottom: 5,
        }}
      >
        {point.name}
      </div>
      <div>{LANE_WORD[point.lane]} lane</div>
      <div>{formatUsdM(point.valueAtStakeUsd)} capital exposure</div>
      <div>{formatUsdM(point.blockedUsd)} blocked</div>
      <div style={{ color: HEX.gray500, marginTop: 5 }}>{point.nextGate}</div>
    </div>
  );
}

export function OutcomeDecisionMatrixChart({
  programs,
  onSelect,
}: {
  programs: readonly TowerProgramView[];
  onSelect: (programId: string) => void;
}) {
  const points = toPoints(programs);
  const byLane = new Map<TowerLaneKey, DecisionMatrixPoint[]>();
  for (const point of points) {
    byLane.set(point.lane, [...(byLane.get(point.lane) ?? []), point]);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <div style={{ flex: "1 1 auto", minHeight: 160 }}>
        <MeasuredChartFrame minHeight={160}>
          {({ width, height }) => (
            <ScatterChart
              width={width}
              height={height}
              margin={{ top: 22, right: 22, left: 10, bottom: 26 }}
            >
              <ReferenceArea
                x1={0}
                x2={50}
                y1={50}
                y2={100}
                fill={HEX.red}
                fillOpacity={0.055}
                label={{
                  value: "STOP / REDESIGN",
                  position: "insideTopLeft",
                  fill: HEX.red,
                  fontSize: 10,
                  fontFamily: "var(--abarva-mono)",
                  fontWeight: 700,
                }}
              />
              <ReferenceArea
                x1={50}
                x2={100}
                y1={50}
                y2={100}
                fill={HEX.amber}
                fillOpacity={0.06}
                label={{
                  value: "FIX PROOF",
                  position: "insideTopRight",
                  fill: HEX.amber,
                  fontSize: 10,
                  fontFamily: "var(--abarva-mono)",
                  fontWeight: 700,
                }}
              />
              <ReferenceArea
                x1={0}
                x2={50}
                y1={0}
                y2={50}
                fill={HEX.gray300}
                fillOpacity={0.05}
                label={{
                  value: "WATCH",
                  position: "insideBottomLeft",
                  fill: HEX.gray700,
                  fontSize: 10,
                  fontFamily: "var(--abarva-mono)",
                  fontWeight: 700,
                }}
              />
              <ReferenceArea
                x1={50}
                x2={100}
                y1={0}
                y2={50}
                fill={HEX.teal}
                fillOpacity={0.055}
                label={{
                  value: "SCALE",
                  position: "insideBottomRight",
                  fill: HEX.tealDark,
                  fontSize: 10,
                  fontFamily: "var(--abarva-mono)",
                  fontWeight: 700,
                }}
              />
              <CartesianGrid stroke={HEX.border} />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 100]}
                tickCount={6}
                tick={{
                  fontSize: 9.5,
                  fill: HEX.gray300,
                  fontFamily: "var(--abarva-mono)",
                }}
                axisLine={{ stroke: HEX.borderStrong }}
                tickLine={false}
                label={{
                  value: "Value proof maturity →",
                  position: "bottom",
                  offset: 7,
                  style: {
                    fontFamily: "var(--abarva-mono)",
                    fontSize: 9.5,
                    fill: HEX.gray500,
                  },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                tickCount={5}
                tick={{
                  fontSize: 9.5,
                  fill: HEX.gray300,
                  fontFamily: "var(--abarva-mono)",
                }}
                axisLine={false}
                tickLine={false}
                width={28}
                label={{
                  value: "Risk pressure",
                  angle: -90,
                  position: "insideLeft",
                  offset: 2,
                  style: {
                    fontFamily: "var(--abarva-mono)",
                    fontSize: 9.5,
                    fill: HEX.gray500,
                  },
                }}
              />
              <ZAxis type="number" dataKey="z" range={[80, 560]} />
              <ReferenceLine
                x={50}
                stroke={HEX.borderStrong}
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={50}
                stroke={HEX.borderStrong}
                strokeDasharray="3 3"
              />
              <Tooltip content={<MatrixTooltip />} />
              {[...byLane.entries()].map(([lane, lanePoints]) => (
                <Scatter
                  key={lane}
                  name={LANE_WORD[lane]}
                  data={lanePoints}
                  fill={LANE_HEX[lane]}
                  fillOpacity={0.84}
                  stroke="#fff"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                  style={{ cursor: "pointer" }}
                  onClick={(arg: unknown) => {
                    const point = scatterDatum<DecisionMatrixPoint>(arg);
                    if (point?.id) onSelect(point.id);
                  }}
                />
              ))}
            </ScatterChart>
          )}
        </MeasuredChartFrame>
      </div>
      <div
        aria-label="Capital decision matrix program legend"
        style={{
          borderTop: `1px solid ${HEX.border}`,
          display: "grid",
          gap: 6,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          maxHeight: 74,
          overflowY: "auto",
          padding: "8px 10px 0",
        }}
      >
        {points.map((point) => (
          <button
            key={point.id}
            type="button"
            onClick={() => onSelect(point.id)}
            style={{
              appearance: "none",
              alignItems: "center",
              background: "rgba(255,255,255,0.68)",
              border: "0 solid transparent",
              borderRadius: 4,
              boxShadow: "none",
              color: HEX.gray700,
              cursor: "pointer",
              display: "grid",
              fontFamily: "var(--abarva-sans)",
              fontSize: 11,
              gap: 6,
              gridTemplateColumns: "9px minmax(0, 1fr) auto",
              lineHeight: 1.15,
              outline: "none",
              padding: "3px 5px",
              textAlign: "left",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                background: LANE_HEX[point.lane],
                borderRadius: 999,
                display: "block",
                height: 9,
                width: 9,
              }}
            />
            <span
              style={{
                fontWeight: 650,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={point.name}
            >
              {point.label}
            </span>
            <span
              style={{
                color: HEX.gray500,
                fontFamily: "var(--abarva-mono)",
                fontSize: 10,
              }}
            >
              {formatUsdM(point.valueAtStakeUsd)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function decisionMatrixTextAlternative(
  programs: readonly TowerProgramView[],
): string {
  const points = toPoints(programs);
  if (points.length === 0) return "No programs to plot.";
  return points
    .map(
      (point) =>
        `${point.name}: ${LANE_WORD[point.lane]} lane, value proof maturity ${point.x} of 100, ` +
        `risk pressure ${point.y} of 100, ${formatUsdM(point.valueAtStakeUsd)} capital exposure.`,
    )
    .join(" ");
}
