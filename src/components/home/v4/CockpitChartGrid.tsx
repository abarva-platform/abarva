"use client";

import type { CSSProperties, ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import type {
  EnterpriseSignalPacket,
  VisualOpportunity,
} from "@/lib/home/preview/types";
import {
  HOME_HEX,
  HomeChartTooltip,
} from "@/components/home/preview/visuals/home-chart-kit";
import {
  DATASET_FIELD_CONFIG,
  inferFieldConfig,
} from "@/components/home/preview/visuals/dataset-fields";
import { cxoText } from "./cxo-language";
import { DATASET_SUBJECT } from "./Exhibit";
import { sourceForIds } from "./source-label";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The chapter's exhibits, laid out as a responsive dashboard grid instead of a single-file stack.
 *
 * The earlier reading of this surface stacked each exhibit full-bleed down the page, so a reader
 * scrolled past one chart to reach the next and never saw two side by side. The approved cockpit puts
 * them in a grid -- two across on a wide screen, one when narrow -- so the page reads as an
 * application, not a scroll. The grid is the only thing that changed: every bar is still drawn from a
 * governed dataset the packet already carries, the model supplies no plotted value, and each card
 * still names its own source.
 *
 * A chapter carries the exhibits its generator proposed -- one, sometimes none. The grid does not
 * invent charts to fill itself: a one-exhibit chapter shows one card, which the grid spans to full
 * width, and a chapter with none renders nothing here. Fabricating an exhibit to make the dashboard
 * look busier is exactly the model-supplied content this surface exists to refuse.
 */
export function CockpitChartGrid({
  visuals,
  signalPacket,
  visualDatasets,
}: {
  visuals: VisualOpportunity[];
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
}) {
  const drawable = visuals.filter((visual) => {
    const rows = visualDatasets[visual.dataset_ref];
    return Array.isArray(rows) && rows.length > 0;
  });
  if (drawable.length === 0) return null;
  return (
    <section
      data-home-chart-grid={drawable.length}
      style={{ padding: `22px ${PAGE_X}px 0` }}
    >
      <div style={chartGridStyle}>
        {drawable.map((visual, index) => (
          <ChartCard
            key={visual.dataset_ref}
            visual={visual}
            index={index + 1}
            signalPacket={signalPacket}
            rows={visualDatasets[visual.dataset_ref]}
          />
        ))}
      </div>
    </section>
  );
}

/** The responsive grid itself: as many ~360px columns as the canvas holds, each card stretching to
 * fill its track. Two up on a wide screen, one when narrow -- the dashboard rhythm the cockpit asks
 * for, driven by the width available rather than a fixed column count. */
const chartGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
  gap: "clamp(14px,1.6vw,20px)",
} as const;

/**
 * One exhibit, as a dashboard card: the subject, the argument the generator wrote for it, the
 * governed chart, and the source it stands on. The source line is not optional furniture -- it is the
 * per-exhibit provenance the surface promises, so it renders on every card, and says so plainly when
 * a cited id did not resolve rather than quietly dropping it.
 */
function ChartCard({
  visual,
  index,
  signalPacket,
  rows,
}: {
  visual: VisualOpportunity;
  index: number;
  signalPacket: EnterpriseSignalPacket;
  rows: Array<Record<string, unknown>>;
}) {
  const source = sourceForIds(visual.evidence_ids, signalPacket);
  const config =
    DATASET_FIELD_CONFIG[visual.dataset_ref] ?? inferFieldConfig(rows);
  const subject = DATASET_SUBJECT[visual.dataset_ref];
  return (
    <figure data-home-chart-card={visual.dataset_ref} style={chartCardStyle}>
      <figcaption>
        <span style={eyebrow(V4.blue)}>
          Exhibit {String(index).padStart(2, "0")}
          {subject ? ` · ${subject}` : ""}
        </span>
        <h3 style={chartTitleStyle}>{cxoText(visual.title)}</h3>
        {/* The key message is the specific, governed reading of the chart -- the one the stale-claim
            guard rewrites from live rows when a reviewed narrative has gone stale. It renders on the
            card rather than only in a side panel, so the figure a reader sees always carries the
            sentence that states what it means. */}
        {visual.key_message && visual.key_message.trim() !== visual.title.trim() ? (
          <p data-home-chart-message style={chartMessageStyle}>
            {cxoText(visual.key_message)}
          </p>
        ) : null}
      </figcaption>
      {config ? (
        <GovernedHBar
          rows={rows}
          labelKey={config.labelKey}
          valueKey={config.valueKey}
          valueLabel={config.valueLabel}
          format={config.format}
        />
      ) : (
        <p style={chartNoteStyle}>
          This exhibit&apos;s dataset does not declare a label and a value to
          plot, so it is listed in the evidence tables below rather than charted.
        </p>
      )}
      <div style={chartFooterStyle}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 4 }}>Source</div>
        <p style={chartSourceStyle}>
          {source.label}
          {source.ids ? ` · ${source.ids}` : ""}
          {source.hasUnresolved
            ? " · one cited source could not be resolved and is named here rather than hidden"
            : ""}
        </p>
      </div>
    </figure>
  );
}

/**
 * A governed horizontal bar, drawn at a fixed size and scaled by CSS rather than measured at runtime.
 *
 * ResponsiveContainer renders nothing until the browser lays its parent out, so a chart inside one is
 * never seen by a test or a static render -- which is how a chart on this very surface once shipped
 * blank past a green suite (see MetricDistance for the same note). A fixed viewBox trades
 * per-breakpoint tick density for a chart that actually renders, and can be asserted on.
 *
 * Every value is read straight from the dataset row by its configured key; nothing is scaled,
 * re-based, or supplied here. The top rows are shown and the count of what is not drawn is stated
 * beneath, so the card never silently truncates its own evidence.
 */
export function GovernedHBar({
  rows,
  labelKey,
  valueKey,
  valueLabel,
  format,
  limit = 8,
  colorFor,
  selected,
  onSelect,
}: {
  rows: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
  valueLabel: string;
  format: (value: number) => string;
  limit?: number;
  /** Per-bar fill, for the drill emphasis in the pivot. Omitted means the navy primary throughout. */
  colorFor?: (label: string) => string;
  /** The drilled value, so its bar keeps full weight while the rest dim. */
  selected?: string | null;
  /** Drills into a bar. When set, bars are buttons to a reader and to a keyboard. */
  onSelect?: (label: string) => void;
}) {
  const data = rows
    .map((row) => ({
      label: String(row[labelKey] ?? ""),
      value: Number(row[valueKey] ?? 0),
    }))
    .filter((row) => row.label.length > 0);
  const shown = data.slice(0, limit);
  const remainder = data.length - shown.length;
  if (shown.length === 0) return null;
  const height = Math.max(150, shown.length * 34 + 28);
  const fillFor = (label: string): string => {
    if (colorFor) return colorFor(label);
    if (selected != null) return label === selected ? HOME_HEX.navy : BAR_MUTED;
    return HOME_HEX.navy;
  };
  return (
    <div data-home-governed-hbar style={{ marginTop: 4 }}>
      <div style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}>
        <BarChart
          width={CHART_WIDTH}
          height={height}
          data={shown}
          layout="vertical"
          margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
          style={{ width: "100%", height: "auto" }}
        >
          <CartesianGrid
            horizontal={false}
            stroke={V4.ruleSoft}
            strokeDasharray="0"
          />
          <XAxis
            type="number"
            tickFormatter={format}
            tick={{ fill: V4.stone, fontSize: 11, fontFamily: MONO }}
            axisLine={{ stroke: V4.rule }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tick={{ fill: V4.slate, fontSize: 11.5, fontFamily: SANS }}
            axisLine={{ stroke: V4.rule }}
            tickLine={false}
            interval={0}
            tickFormatter={(value: string) =>
              value.length > 24 ? `${value.slice(0, 23)}…` : value
            }
          />
          <HomeChartTooltip
            formatter={(value) => [format(Number(value)), valueLabel]}
          />
          <Bar
            dataKey="value"
            isAnimationActive={false}
            radius={[0, 3, 3, 0]}
            maxBarSize={24}
            cursor={onSelect ? "pointer" : undefined}
            onClick={
              onSelect
                ? (_data: unknown, index: number) => {
                    const row = shown[index];
                    if (row) onSelect(row.label);
                  }
                : undefined
            }
          >
            {shown.map((row) => (
              <Cell key={row.label} fill={fillFor(row.label)} />
            ))}
          </Bar>
        </BarChart>
      </div>
      <p style={chartNoteStyle}>
        {remainder > 0
          ? `Showing the ${shown.length} largest of ${data.length}. ${remainder} more ${remainder === 1 ? "row is" : "rows are"} in the record and in the table below.`
          : `All ${data.length} ${data.length === 1 ? "row is" : "rows are"} shown.`}
      </p>
    </div>
  );
}

const CHART_WIDTH = 640;
/** The dimmed navy a non-selected bar takes during a drill -- dark enough to read as the same series,
 * light enough that the selected bar is unmistakably the one in focus. */
const BAR_MUTED = "rgba(27,43,92,0.3)";

const chartCardStyle = {
  margin: 0,
  minWidth: 0,
  display: "flex",
  flexDirection: "column" as const,
  background: V4.surface,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  padding: "16px 16px 14px",
} as const;

const chartTitleStyle = {
  margin: "6px 0 6px",
  fontFamily: SERIF,
  fontSize: 16,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.26,
  color: V4.navy,
  textWrap: "balance" as const,
} as const;

const chartMessageStyle = {
  margin: "0 0 10px",
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: V4.slate,
  textWrap: "pretty" as const,
} as const;

const chartNoteStyle = {
  margin: "10px 0 0",
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.5,
  color: V4.slate,
} as const;

const chartFooterStyle: CSSProperties = {
  marginTop: "auto",
  paddingTop: 12,
  borderTop: `1px solid ${V4.ruleSoft}`,
};

const chartSourceStyle = {
  margin: 0,
  fontFamily: MONO,
  fontSize: 10.5,
  lineHeight: 1.6,
  color: V4.slate,
} as const;

/** Re-exported so the pivot cockpit draws its cards in the same frame as the chart grid. */
export function ChartFrame({
  title,
  subtitle,
  children,
  dataAttr,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  dataAttr?: string;
}) {
  return (
    <figure data-home-cockpit-card={dataAttr ?? ""} style={chartCardStyle}>
      <figcaption style={{ marginBottom: 4 }}>
        <h3 style={chartTitleStyle}>{title}</h3>
        {subtitle ? <p style={chartNoteStyle}>{subtitle}</p> : null}
      </figcaption>
      {children}
    </figure>
  );
}
