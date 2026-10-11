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
import { matrixQuadrants } from "@/lib/intelligence/answer/model-exhibit-layout";

/** Chart libraries lay out Claude's data; they do not score or rewrite it. */
export function ModelAuthoredChart({ chart }: { chart: AnswerChart }) {
  const rows = chart.data as Record<string, string | number | null>[];
  const xKey = chart.xKey!,
    yKey = chart.yKey!;
  if (chart.kind === "quadrant-matrix") {
    return (
      <div
        data-chart-renderer="categorical-matrix"
        role="group"
        aria-label={chart.title}
      >
        {chart.subtitle && <p className="mb-3 text-sm">{chart.subtitle}</p>}
        <div className="grid grid-cols-2 gap-2">
          {matrixQuadrants(chart).map((q) => (
            <section
              key={`${q.x}-${q.y}`}
              className="min-h-28 rounded border border-emerald-200 bg-emerald-50/50 p-3"
            >
              <h4 className="mb-2 text-xs font-semibold">
                {xKey}: {q.x} · {yKey}: {q.y}
              </h4>
              <ul className="space-y-2 text-sm">
                {q.rows.map((row, i) => (
                  <li key={i}>
                    <strong>{String(row.label)}</strong>
                    {Object.entries(row)
                      .filter(([key]) => !["label", xKey, yKey].includes(key))
                      .map(([key, value]) => (
                        <p key={key}>
                          {key}: {String(value ?? "")}
                        </p>
                      ))}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {chart.sourceNote && <p className="mt-2 text-sm">{chart.sourceNote}</p>}
      </div>
    );
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
        style={{
          height: horizontal ? Math.max(280, rows.length * 42 + 70) : 320,
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
      {chart.sourceNote && <p className="mt-2 text-sm">{chart.sourceNote}</p>}
    </div>
  );
}
