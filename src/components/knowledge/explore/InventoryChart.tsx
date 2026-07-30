"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InventoryKindConfig, InventoryRecord } from "./inventory-config";

/**
 * Client-side sum-by-facet aggregation bar chart, per matrix row "Chart
 * toggle": only renders when the parent has already established the
 * underlying numeric column is governed/populated (config.chartable) and the
 * table is non-empty. This component performs no interpolation and plots
 * nothing for rows missing the numeric field -- unobserved values are
 * excluded from the sum, never coerced to 0 within it.
 */
export function InventoryChart({
  config,
  rows,
}: {
  readonly config: InventoryKindConfig;
  readonly rows: readonly InventoryRecord[];
}) {
  const numericColumn = config.columns.find((c) => c.numeric);
  const groupColumn = config.facets[0]?.key ?? config.primaryKey;

  if (!numericColumn || rows.length === 0) return null;

  const totals = new Map<string, number>();
  for (const row of rows) {
    const value = row[numericColumn.key];
    if (typeof value !== "number") continue; // never coerce a missing numeric to 0
    const key = String(row[groupColumn] ?? "Unlabeled");
    totals.set(key, (totals.get(key) ?? 0) + value);
  }

  const data = Array.from(totals.entries()).map(([label, value]) => ({
    label,
    value,
  }));
  if (data.length === 0) return null;

  return (
    <div className="mb-3 h-56 rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,10,11,0.08)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#888780" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11, fill: "#888780" }} />
          <Tooltip
            formatter={(value) =>
              typeof value === "number"
                ? value.toLocaleString("en-US")
                : String(value ?? "-")
            }
          />
          <Bar
            dataKey="value"
            fill="#0c1a3a"
            radius={[3, 3, 0, 0]}
            name={numericColumn.label}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="px-1 pt-1 text-xs text-[#888780]">
        Read this as where the money and the risk sit, not as a count.
      </p>
    </div>
  );
}
