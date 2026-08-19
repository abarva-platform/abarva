"use client";

// The governed visual dispatcher. Every chart on the Home preview passes through here rather than
// a component reaching into visualDatasets directly -- this is the one place that enforces the
// contract's actual invariant: a chart may only plot a dataset_ref that exists verbatim in the
// packet's visualDatasets, and the model never supplies or adjusts a plotted value itself. If a
// visual_type doesn't have a built renderer yet, this shows a labeled fallback (a table, or
// nothing with an honest note) instead of silently dropping the exhibit -- "missing is never
// zero" applies to a proposed visual exactly as much as to a governed fact.

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { VisualOpportunity } from "@/lib/home/preview/types";
import { DATASET_FIELD_CONFIG, inferFieldConfig, type DatasetFieldConfig } from "./dataset-fields";
import { HOME_HEX, HOME_SERIES, HomeChartTooltip, VisualCard } from "./home-chart-kit";

const AXIS_STYLE = { fontFamily: "var(--font-body-sans)", fontSize: 11, fill: HOME_HEX.textMuted };

function HorizontalBarChart({ rows, config }: { rows: Array<Record<string, unknown>>; config: DatasetFieldConfig }) {
  const data = rows.slice(0, 8).map((r) => ({
    label: String(r[config.labelKey] ?? ""),
    value: Number(r[config.valueKey] ?? 0),
  }));
  const height = Math.max(140, data.length * 34 + 24);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={HOME_HEX.border} horizontal={false} />
        <XAxis type="number" tickFormatter={config.format} tick={AXIS_STYLE} axisLine={{ stroke: HOME_HEX.border }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={190}
          tick={AXIS_STYLE}
          axisLine={{ stroke: HOME_HEX.border }}
          tickLine={false}
        />
        <HomeChartTooltip formatter={(value) => [config.format(Number(value)), config.valueLabel]} />
        <Bar dataKey="value" fill={HOME_HEX.navy} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

function VerticalBarChart({ rows, config }: { rows: Array<Record<string, unknown>>; config: DatasetFieldConfig }) {
  const data = rows.slice(0, 8).map((r) => ({
    label: String(r[config.labelKey] ?? ""),
    value: Number(r[config.valueKey] ?? 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={HOME_HEX.border} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={{ stroke: HOME_HEX.border }} tickLine={false} />
        <YAxis tickFormatter={config.format} tick={AXIS_STYLE} axisLine={{ stroke: HOME_HEX.border }} tickLine={false} />
        <HomeChartTooltip formatter={(value) => [config.format(Number(value)), config.valueLabel]} />
        <Bar dataKey="value" fill={HOME_HEX.teal} radius={[4, 4, 0, 0]} maxBarSize={64} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ rows, config }: { rows: Array<Record<string, unknown>>; config: DatasetFieldConfig }) {
  const data = rows.map((r) => ({
    label: String(r[config.labelKey] ?? ""),
    value: Number(r[config.valueKey] ?? 0),
  }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 200, height: 200, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={90} paddingAngle={2} strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={HOME_SERIES[i % HOME_SERIES.length]} />
              ))}
            </Pie>
            <HomeChartTooltip formatter={(value) => [config.format(Number(value)), config.valueLabel]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, fontFamily: "var(--font-body-sans)", fontSize: 12.5 }}>
        {data.map((d, i) => (
          <li key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: HOME_SERIES[i % HOME_SERIES.length], flexShrink: 0 }} />
            <span style={{ color: HOME_HEX.textSecondary }}>{d.label}</span>
            <span style={{ color: HOME_HEX.textMuted, marginLeft: "auto" }}>
              {config.format(d.value)} · {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Fallback for a visual_type this dispatcher doesn't have a chart renderer for yet (the
 * relational/structural set: capability_map, dependency_graph, organization_map, strategy_tree,
 * risk_chain, value_chain, timeline -- none of which appear in either accepted tenant's current
 * output) or a dataset_ref not in DATASET_FIELD_CONFIG. Shows the real rows as a table rather than
 * dropping the exhibit silently. */
function FallbackTable({ rows, inferredConfig }: { rows: Array<Record<string, unknown>>; inferredConfig: DatasetFieldConfig | null }) {
  if (rows.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-body-sans)", fontSize: 12.5, color: HOME_HEX.textMuted, fontStyle: "italic" }}>
        This exhibit&apos;s dataset has no rows to show.
      </p>
    );
  }
  const columns = inferredConfig ? [inferredConfig.labelKey, inferredConfig.valueKey] : Object.keys(rows[0]).slice(0, 4);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body-sans)", fontSize: 12.5 }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} style={{ textAlign: "left", color: HOME_HEX.textMuted, fontWeight: 500, padding: "4px 8px", borderBottom: `1px solid ${HOME_HEX.border}` }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 8).map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c} style={{ padding: "4px 8px", borderBottom: `1px solid ${HOME_HEX.border}`, color: HOME_HEX.textSecondary }}>
                {String(row[c] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const QUANTITATIVE_RENDERERS: Record<string, (props: { rows: Array<Record<string, unknown>>; config: DatasetFieldConfig }) => React.JSX.Element> = {
  horizontal_bar: HorizontalBarChart,
  bar: VerticalBarChart,
  stacked_bar: VerticalBarChart,
  donut: DonutChart,
};

export function GovernedVisual({
  visual,
  visualDatasets,
}: {
  visual: VisualOpportunity;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
}) {
  const rows = visualDatasets[visual.dataset_ref];
  if (!rows) {
    // The contract's own invariant failing at render time -- a dataset_ref that doesn't resolve
    // to a real deterministic dataset should never happen (structural validation checks this at
    // generation time), but if it ever does, say so plainly rather than rendering nothing.
    return (
      <VisualCard title={visual.title} purpose={visual.purpose} priority={visual.priority}>
        <p style={{ fontFamily: "var(--font-body-sans)", fontSize: 12.5, color: HOME_HEX.red }}>
          This exhibit references dataset &ldquo;{visual.dataset_ref}&rdquo;, which does not exist in this tenant&apos;s
          visual datasets. This should not happen — it means structural validation missed a bad reference.
        </p>
      </VisualCard>
    );
  }
  const config = DATASET_FIELD_CONFIG[visual.dataset_ref];
  const Renderer = config ? QUANTITATIVE_RENDERERS[visual.visual_type] : undefined;
  return (
    <VisualCard title={visual.title} purpose={visual.purpose} priority={visual.priority}>
      {Renderer && config ? <Renderer rows={rows} config={config} /> : <FallbackTable rows={rows} inferredConfig={config ?? inferFieldConfig(rows)} />}
    </VisualCard>
  );
}
