"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import type { EstateRow } from "./page-tables";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * How far the enterprise sits from its own targets, across every metric that declares one.
 *
 * A fifty-row table answers "what is this metric doing". It cannot answer "is this enterprise near
 * or far", which is the question a reader asks of a metric set before any individual metric. That
 * is a distribution, and a distribution is a shape.
 *
 * Every metric carrying both a baseline and a target is placed in a band. Metrics missing either are
 * counted and named beneath rather than dropped -- a distribution drawn only over the rows that
 * happened to be complete is a distribution of our collection, not of their performance.
 */
const BANDS = [
  { key: "at", label: "At target", max: 0 },
  { key: "u10", label: "Within 10%", max: 10 },
  { key: "u25", label: "10–25%", max: 25 },
  { key: "u50", label: "25–50%", max: 50 },
  { key: "u75", label: "50–75%", max: 75 },
  { key: "o75", label: "Over 75%", max: Infinity },
] as const;

const CHART_WIDTH = 900;
const CHART_HEIGHT = 200;

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export interface MetricDistribution {
  bands: Array<{ label: string; count: number; far: boolean }>;
  measured: number;
  total: number;
  far: number;
}

export function buildMetricDistribution(rows: EstateRow[]): MetricDistribution {
  const counts = new Map<string, number>(BANDS.map((b) => [b.key, 0]));
  let measured = 0;
  for (const row of rows) {
    const baseline = num(row.baselineValue);
    const target = num(row.targetValue);
    if (baseline === null || target === null || target === 0) continue;
    measured += 1;
    const distance = Math.abs((target - baseline) / target) * 100;
    const band =
      BANDS.find((b) => distance <= b.max) ?? BANDS[BANDS.length - 1];
    counts.set(band.key, (counts.get(band.key) ?? 0) + 1);
  }
  // "Far" is past a quarter of the way from the target -- the point at which a target stops being a
  // near-term commitment and starts being an ambition. Stated so the reader is not left to infer it.
  const far = BANDS.filter((b) => b.max > 25).reduce(
    (sum, b) => sum + (counts.get(b.key) ?? 0),
    0,
  );
  return {
    bands: BANDS.map((b) => ({
      label: b.label,
      count: counts.get(b.key) ?? 0,
      far: b.max > 25,
    })),
    measured,
    total: rows.length,
    far,
  };
}

export function MetricDistance({ metrics }: { metrics?: EstateRow[] }) {
  if (!metrics || metrics.length === 0) return null;
  const dist = buildMetricDistribution(metrics);
  // Fewer than three occupied bands is a list, not a distribution; the table beside this says it
  // better.
  if (dist.bands.filter((b) => b.count > 0).length < 3) return null;
  const unmeasured = dist.total - dist.measured;
  return (
    <section
      data-home-metric-distance={dist.measured}
      style={{ padding: `30px ${PAGE_X}px 0` }}
    >
      <div style={{ borderTop: `1px solid ${V4.rule}`, paddingTop: 14 }}>
        <span style={eyebrow(V4.slate)}>Distance to target</span>
        <h3 style={headingStyle}>
          {dist.far} of {dist.measured} measures sit more than a quarter from
          their target.
        </h3>
      </div>
      {/*
        Drawn at a fixed size and scaled by CSS, not measured at runtime.

        ResponsiveContainer measures its parent in the browser and renders nothing without a layout
        pass, so no test and no static render can ever see the chart -- it would ship having never
        been observed drawing anything. That is exactly how the renewal chart on this surface first
        shipped blank past a green suite. Fixed viewBox trades per-breakpoint tick density for a
        chart that can be rendered, screenshotted and asserted on.
      */}
      <div
        data-home-metric-distance-chart
        style={{
          width: "100%",
          overflow: "hidden",
          lineHeight: 0,
          marginTop: 16,
        }}
      >
        <div style={{ width: "100%" }}>
          <BarChart
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            data={dist.bands}
            margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
            style={{ width: "100%", height: "auto" }}
          >
            <CartesianGrid
              vertical={false}
              stroke={V4.ruleSoft}
              strokeDasharray="0"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: V4.slate, fontSize: 11, fontFamily: MONO }}
              axisLine={{ stroke: V4.rule }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: V4.stone, fontSize: 11, fontFamily: MONO }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Bar dataKey="count" isAnimationActive={false} maxBarSize={62}>
              {dist.bands.map((band) => (
                <Cell
                  key={band.label}
                  fill={band.far ? V4.navy : "rgba(12,26,58,0.28)"}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>
      <p style={noteStyle}>
        {dist.measured} of {dist.total} measures declare both a baseline and a
        target and are placed above.
        {unmeasured > 0
          ? ` ${unmeasured} declare${unmeasured === 1 ? "s" : ""} one or neither and cannot be placed — counted here rather than dropped, because a distribution drawn only over complete rows describes the record, not the performance.`
          : ""}
      </p>
    </section>
  );
}

const headingStyle = {
  margin: "7px 0 0",
  fontFamily: SERIF,
  fontSize: 23,
  fontWeight: 500,
  lineHeight: 1.22,
  maxWidth: "56ch",
} as const;

const noteStyle = {
  margin: "12px 0 0",
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: V4.slate,
  maxWidth: "78ch",
} as const;
