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
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { CSSProperties } from "react";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerAiKind,
  TowerAiView,
} from "@/lib/tower/command-center/types";

import { AI_KIND_HEX, AI_KIND_WORD } from "../primitives";
import { ChartTooltip, HEX, scatterDatum, toM } from "./chart-kit";
import { MeasuredChartFrame } from "./MeasuredChartFrame";
import styles from "../TowerCommandCenter.module.css";

interface BubblePoint {
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  z: number;
  n: number;
  label: string;
  name: string;
  kind: TowerAiKind;
}

const COLLISION_BUCKET_SIZE = 10;
const COLLISION_SPREAD = 7;
const COMPRESSED_AXIS_RANGE = 16;
const COMPRESSED_CLUSTER_MIN = 4;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function collisionKey(point: Pick<BubblePoint, "rawX" | "rawY">): string {
  return [
    Math.round(point.rawX / COLLISION_BUCKET_SIZE),
    Math.round(point.rawY / COLLISION_BUCKET_SIZE),
  ].join(":");
}

function scoreSpread(items: readonly TowerAiView[]) {
  const readiness = items.map((item) => clampScore(item.readinessScore));
  const value = items.map((item) => clampScore(item.valueScore));
  const range = (values: number[]) => {
    if (values.length === 0) return { min: 0, max: 0, spread: 0 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max, spread: max - min };
  };
  return {
    readiness: range(readiness),
    value: range(value),
  };
}

export function isBubbleMatrixCompressed(
  items: readonly TowerAiView[],
): boolean {
  if (items.length < COMPRESSED_CLUSTER_MIN) return false;
  const spread = scoreSpread(items);
  const tightBand =
    spread.readiness.spread <= COMPRESSED_AXIS_RANGE &&
    spread.value.spread <= COMPRESSED_AXIS_RANGE;
  const clusterCounts = new Map<string, number>();
  for (const item of items) {
    const key = collisionKey({
      rawX: clampScore(item.readinessScore),
      rawY: clampScore(item.valueScore),
    });
    clusterCounts.set(key, (clusterCounts.get(key) ?? 0) + 1);
  }
  const largestCluster = Math.max(0, ...clusterCounts.values());
  return tightBand || largestCluster >= COMPRESSED_CLUSTER_MIN;
}

function formatScoreRange({ min, max }: { min: number; max: number }): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

function truncateLabel(value: string, max = 34): string {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function CompressedBubbleMatrix({
  items,
  sizeMode,
  onSelect,
}: {
  items: readonly TowerAiView[];
  sizeMode: "spend" | "constant";
  onSelect: (n: number) => void;
}) {
  const spread = scoreSpread(items);
  const maxSpend = Math.max(0, ...items.map((item) => item.aiSpendUsd));
  const spendNotAttributed = maxSpend <= 0;
  const sorted = [...items].sort(
    (a, b) =>
      b.valueScore - a.valueScore ||
      b.readinessScore - a.readinessScore ||
      b.aiSpendUsd - a.aiSpendUsd ||
      a.name.localeCompare(b.name),
  );

  return (
    <MeasuredChartFrame minHeight={280}>
      {({ width, height }) => (
        <div
          className={styles.compressedAiChart}
          style={{ width, height }}
          role="group"
          aria-label={`Compressed AI proof band. Readiness ${formatScoreRange(
            spread.readiness,
          )} of 100, value ${formatScoreRange(spread.value)} of 100.`}
        >
          <div className={styles.compressedAiHeader}>
            <span>
              <b>Compressed proof band</b>
              <small>
                readiness {formatScoreRange(spread.readiness)}/100 / value{" "}
                {formatScoreRange(spread.value)}/100
              </small>
            </span>
            <em>
              {spendNotAttributed
                ? "spend not item-attributed"
                : sizeMode === "constant"
                  ? "constant radius"
                  : "ranked by proof and spend"}
            </em>
          </div>
          <div className={styles.compressedAiRows}>
            {sorted.map((item) => {
              const kindColor = AI_KIND_HEX[item.kind];
              const spendWidth =
                maxSpend > 0
                  ? `${Math.max(4, (item.aiSpendUsd / maxSpend) * 100)}%`
                  : "0%";
              const valueWidth = `${clampScore(item.valueScore)}%`;
              const readinessWidth = `${clampScore(item.readinessScore)}%`;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.compressedAiRow}
                  onClick={() => onSelect(item.n)}
                  aria-label={`${item.n}. ${item.name}: value ${item.valueScore} of 100, readiness ${item.readinessScore} of 100, ${formatUsdM(item.aiSpendUsd)} AI spend.`}
                  style={
                    {
                      "--ai-kind": kindColor,
                      "--ai-value-width": valueWidth,
                      "--ai-readiness-width": readinessWidth,
                      "--ai-spend-width": spendWidth,
                    } as CSSProperties
                  }
                >
                  <span
                    className={styles.compressedAiBadge}
                    style={{ background: kindColor }}
                  >
                    {item.n}
                  </span>
                  <span className={styles.compressedAiName}>
                    <b>{truncateLabel(item.name)}</b>
                    <small>{AI_KIND_WORD[item.kind]}</small>
                  </span>
                  <span className={styles.compressedAiBars}>
                    <i data-label="Value">
                      <span />
                    </i>
                    <i data-label="Readiness" className={styles.readinessBar}>
                      <span />
                    </i>
                  </span>
                  <span className={styles.compressedAiSpend}>
                    {formatUsdM(item.aiSpendUsd)}
                    {maxSpend > 0 ? <i /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </MeasuredChartFrame>
  );
}

export function buildBubblePoints(
  items: readonly TowerAiView[],
  sizeMode: "spend" | "constant" = "spend",
): BubblePoint[] {
  const points = items.map((item, index) => ({
    x: item.readinessScore,
    y: item.valueScore,
    rawX: item.readinessScore,
    rawY: item.valueScore,
    z: sizeMode === "constant" ? 1 : Math.max(toM(item.aiSpendUsd), 0.01),
    n: item.n,
    label: index < 3 ? String(item.n) : "",
    name: item.name,
    kind: item.kind,
  }));
  const collisions = new Map<string, BubblePoint[]>();
  for (const point of points) {
    const key = collisionKey(point);
    collisions.set(key, [...(collisions.get(key) ?? []), point]);
  }
  for (const cluster of collisions.values()) {
    if (cluster.length <= 1) continue;
    cluster
      .sort((a, b) => a.n - b.n)
      .forEach((point, index) => {
        const angle = (Math.PI * 2 * index) / cluster.length - Math.PI / 2;
        point.x = clampScore(point.rawX + Math.cos(angle) * COLLISION_SPREAD);
        point.y = clampScore(point.rawY + Math.sin(angle) * COLLISION_SPREAD);
        point.label = index === 0 ? String(point.n) : "";
      });
  }
  return points;
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
  if (isBubbleMatrixCompressed(items)) {
    return (
      <CompressedBubbleMatrix
        items={items}
        sizeMode={sizeMode}
        onSelect={onSelect}
      />
    );
  }

  const byKind = new Map<TowerAiKind, BubblePoint[]>();
  const points = buildBubblePoints(items, sizeMode);
  for (const point of points) {
    const kindPoints = byKind.get(point.kind) ?? [];
    kindPoints.push(point);
    byKind.set(point.kind, kindPoints);
  }

  return (
    <MeasuredChartFrame minHeight={220}>
      {({ width, height }) => (
        <ScatterChart
          width={width}
          height={height}
          margin={{ top: 12, right: 16, left: 2, bottom: 20 }}
        >
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
            range={sizeMode === "constant" ? [620, 620] : [120, 900]}
            name={sizeMode === "constant" ? "Constant radius" : "AI spend"}
          />
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
          <ChartTooltip />
          {[...byKind.entries()].map(([kind, points]) => (
            <Scatter
              key={kind}
              name={AI_KIND_WORD[kind]}
              data={points}
              fill={AI_KIND_HEX[kind]}
              fillOpacity={0.82}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
              style={{ cursor: "pointer" }}
              onClick={(arg: unknown) => {
                const point = scatterDatum<BubblePoint>(arg);
                if (typeof point?.n === "number") onSelect(point.n);
              }}
            >
              <LabelList
                dataKey="label"
                position="center"
                style={{
                  fontFamily: "var(--abarva-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  fill: "#fff",
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

/** Text alternative for the bubble matrix. */
export function bubbleTextAlternative(
  items: readonly TowerAiView[],
  sizeMode: "spend" | "constant" = "spend",
): string {
  if (items.length === 0) return "No AI capabilities to plot.";
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
