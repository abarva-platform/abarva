"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnswerChart } from "@/lib/ava-answer/contract";
import { ModelAuthoredMatrix } from "./ModelAuthoredMatrix";

/** Chart libraries lay out Claude's data; they do not score or rewrite it. */
export function ModelAuthoredChart({
  chart,
  compact = false,
}: {
  chart: AnswerChart;
  compact?: boolean;
}) {
  const rows = chart.data as Record<string, string | number | null>[];
  const xKey = chart.xKey!,
    yKey = chart.yKey!;
  if (chart.kind === "quadrant-matrix") {
    return <ModelAuthoredMatrix chart={chart} compact={compact} />;
  }
  const horizontal = chart.kind === "horizontal-bar";
  const axes = (
    <>
      <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" />
      <XAxis
        dataKey={horizontal ? undefined : xKey}
        type={horizontal ? "number" : "category"}
      />
      <YAxis
        dataKey={horizontal ? xKey : undefined}
        type={horizontal ? "category" : "number"}
        width={horizontal ? 160 : 70}
      />
      <Tooltip />
    </>
  );
  return (
    <div
      data-chart-renderer="recharts"
      data-chart-kind={chart.kind}
      role="group"
      aria-label={chart.title}
    >
      {chart.subtitle && <p className="text-sm">{chart.subtitle}</p>}
      <div
        className="min-w-0"
        data-chart-frame="numeric"
        style={{
          height: compact
            ? "clamp(220px, 30dvh, 300px)"
            : horizontal
              ? Math.max(280, rows.length * 42 + 70)
              : 320,
        }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={1}>
          {chart.kind === "line" ? (
            <LineChart
              data={rows}
              margin={{ top: 16, right: 24, bottom: 16, left: 8 }}
            >
              {axes}
              <Line
                dataKey={yKey}
                stroke="#166534"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart
              data={rows}
              layout={horizontal ? "vertical" : "horizontal"}
              margin={{ top: 16, right: 24, bottom: 16, left: 8 }}
            >
              {axes}
              <Bar
                dataKey={yKey}
                fill="#166534"
                radius={4}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {chart.unit && <p className="text-sm">{chart.unit}</p>}
      <details open={compact ? undefined : true} className="mt-2 text-sm">
        <summary className="cursor-pointer text-slate-600">Chart data</summary>
        <ol
          className="list-inside list-decimal text-sm"
          aria-label="Chart values"
        >
          {rows.map((row, i) => (
            <li key={i}>
              {String(row[xKey])}: {String(row[yKey])}
            </li>
          ))}
        </ol>
      </details>
      {chart.sourceNote && <p className="mt-2 text-sm">{chart.sourceNote}</p>}
    </div>
  );
}
