"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import type { EstateRow } from "./page-tables";
import {
  HOME_HEX,
  HomeChartTooltip,
  formatCompactNumber,
  formatCompactUsd,
} from "@/components/home/preview/visuals/home-chart-kit";
import { ChartFrame, GovernedHBar } from "./CockpitChartGrid";
import {
  PIVOT_DIMENSIONS,
  aggregateByDimension,
  defaultDir,
  estateScale,
  filterByDrill,
  normalizeApps,
  normalizeVendors,
  relationshipSummary,
  scatterPoints,
  sortApps,
  vendorSpendIndex,
  type PivotDimension,
  type PivotMeasure,
  type TableSort,
  type TableSortKey,
} from "./tech-estate-pivot";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The Technology & Data chapter, read as a cockpit over the whole application estate.
 *
 * This is the one chapter whose evidence is dense enough to explore rather than only read: three
 * hundred-odd applications, each carrying a provider, a business function, a criticality, a deployment
 * model, a scope, a run cost, an interface count, and a debt score. The cockpit lets a reader pivot
 * that estate across any of those dimensions, drill into a value to see the slice behind it and how it
 * relates across the others, and read every application in a sortable table -- the "mix of charts and
 * tables, drilling across dimensions" the surface was asked for.
 *
 * It is governed the same way everything else on this surface is: every bar, point, card, and cell is
 * computed in tech-estate-pivot.ts from the estate rows the bundle already carries. The model supplies
 * no plotted value, no count, and no relationship. The pivot does not decide what is true about the
 * estate; it only re-projects what the record already states.
 */
export function TechCockpit({
  applications,
  vendors,
  dataAssetCount,
  onOpenRows,
}: {
  applications?: EstateRow[];
  vendors?: EstateRow[];
  dataAssetCount?: number;
  /** Opens the application register filtered to the drilled slice, continuing the figure-to-rows
   * drill the rest of the surface uses. */
  onOpenRows?: (objectType: string, filter: string) => void;
}) {
  const apps = useMemo(() => normalizeApps(applications ?? []), [applications]);
  const vendorList = useMemo(
    () => normalizeVendors(vendors ?? []),
    [vendors],
  );
  const vendorIndex = useMemo(
    () => vendorSpendIndex(vendorList),
    [vendorList],
  );

  const [dim, setDim] = useState<PivotDimension["key"]>("provider");
  const [measure, setMeasure] = useState<PivotMeasure>("cost");
  const [drill, setDrill] = useState<string | null>(null);
  const [sort, setSort] = useState<TableSort>({ key: "cost", dir: -1 });

  const scale = useMemo(
    () => estateScale(apps, vendorList, dataAssetCount ?? 0),
    [apps, vendorList, dataAssetCount],
  );
  const aggregate = useMemo(
    () => aggregateByDimension(apps, dim, measure),
    [apps, dim, measure],
  );
  const filtered = useMemo(
    () => filterByDrill(apps, dim, drill),
    [apps, dim, drill],
  );
  const sorted = useMemo(() => sortApps(filtered, sort), [filtered, sort]);
  const scatter = useMemo(() => scatterPoints(filtered), [filtered]);
  const relationship =
    drill != null
      ? relationshipSummary(filtered, dim, drill, vendorIndex)
      : null;

  const activeDim =
    PIVOT_DIMENSIONS.find((d) => d.key === dim) ?? PIVOT_DIMENSIONS[0];
  const money = formatCompactUsd;
  const count = (value: number) => formatCompactNumber(value);
  const measureFormat = measure === "cost" ? money : formatCompactNumber;

  // The estate is meant to be here (the bundle carries a technologyEstate), so an empty one is a load
  // that failed, not a chapter with nothing to say. Say that plainly rather than drawing a blank grid.
  if (apps.length === 0) {
    return (
      <section
        data-home-tech-cockpit="empty"
        style={{ padding: `22px ${PAGE_X}px 0` }}
      >
        <p style={emptyNoticeStyle}>
          The application estate did not load for this record, so the
          cross-dimensional cockpit cannot be drawn. The evidence tables below
          still read from the record; this view returns once the estate is
          present.
        </p>
      </section>
    );
  }

  const pivotTo = (key: PivotDimension["key"], value: string) => {
    setDim(key);
    setDrill(value);
    setSort({ key: "cost", dir: -1 });
  };
  const clearDrill = () => setDrill(null);
  const toggleSort = (key: TableSortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: (current.dir * -1) as 1 | -1 }
        : { key, dir: defaultDir(key) },
    );

  return (
    <section data-home-tech-cockpit={apps.length} style={cockpitStyle}>
      <div style={scaleStripStyle} data-home-tech-scale>
        <ScaleTile value={count(scale.appCount)} label="applications in the estate" />
        <ScaleTile value={money(scale.appRunCost)} label="annual application run cost" />
        <ScaleTile value={count(scale.vendorCount)} label="vendor contracts" />
        <ScaleTile value={money(scale.vendorSpend)} label="annual vendor spend" />
        <ScaleTile
          value={count(scale.dataAssetCount)}
          label="data assets & integrations"
        />
      </div>

      <div style={controlsStyle}>
        <div style={controlGroupStyle}>
          <span style={{ ...eyebrow(V4.stone) }}>Pivot by</span>
          <div style={segStyle} role="group" aria-label="Pivot dimension">
            {PIVOT_DIMENSIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                data-home-pivot-dim={d.key}
                aria-pressed={dim === d.key}
                onClick={() => {
                  setDim(d.key);
                  setDrill(null);
                }}
                style={segButtonStyle(dim === d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div style={controlGroupStyle}>
          <span style={{ ...eyebrow(V4.stone) }}>Measure</span>
          <div style={segStyle} role="group" aria-label="Measure">
            <button
              type="button"
              data-home-pivot-measure="count"
              aria-pressed={measure === "count"}
              onClick={() => setMeasure("count")}
              style={segButtonStyle(measure === "count")}
            >
              Count
            </button>
            <button
              type="button"
              data-home-pivot-measure="cost"
              aria-pressed={measure === "cost"}
              onClick={() => setMeasure("cost")}
              style={segButtonStyle(measure === "cost")}
            >
              Annual cost
            </button>
          </div>
        </div>
      </div>

      <div style={drillbarStyle} data-home-tech-drillbar>
        {drill != null ? (
          <>
            <span>Drilled into {activeDim.label.toLowerCase()}</span>
            <span style={drillPillStyle}>
              {drill}
              <button
                type="button"
                data-home-tech-drill-clear
                onClick={clearDrill}
                aria-label="Clear drill"
                style={drillPillButtonStyle}
              >
                ×
              </button>
            </span>
            <span>
              — {filtered.length.toLocaleString()} of{" "}
              {apps.length.toLocaleString()} applications
            </span>
            {onOpenRows ? (
              <button
                type="button"
                data-home-tech-open-rows
                onClick={() =>
                  onOpenRows("application_system", `${activeDim.label}: ${drill}`)
                }
                style={openRowsButtonStyle}
              >
                Open these rows
              </button>
            ) : null}
          </>
        ) : (
          <span>
            All {apps.length.toLocaleString()} applications. Select a{" "}
            {activeDim.label.toLowerCase()} to drill into the slice behind it.
          </span>
        )}
      </div>

      {relationship ? (
        <div style={relGridStyle} data-home-tech-relationship>
          {relationship.vendorSpend != null ? (
            <RelCard
              k="Vendor contract spend"
              v={money(relationship.vendorSpend)}
            />
          ) : null}
          <RelCard k="Applications" v={count(relationship.applications)} />
          <RelCard k="Annual run cost" v={money(relationship.annualCost)} />
          <RelCard k="Tier-1 critical" v={count(relationship.tier1)} />
          <RelCard
            k="Functions touched"
            v={count(relationship.functionsTouched)}
          />
          <RelCard k="Interfaces" v={count(relationship.interfaces)} />
        </div>
      ) : null}

      <div style={chartsGridStyle}>
        <ChartFrame
          dataAttr="pivot-bar"
          title={`${activeDim.label} by ${measure === "cost" ? "annual cost" : "application count"}`}
          subtitle={`Top ${Math.min(aggregate.length, 8)} of ${aggregate.length}. Select a bar to drill.`}
        >
          <GovernedHBar
            rows={aggregate as unknown as Array<Record<string, unknown>>}
            labelKey="name"
            valueKey={measure}
            valueLabel={measure === "cost" ? "Annual cost" : "Applications"}
            format={measureFormat}
            selected={drill}
            onSelect={(label) =>
              setDrill((current) => (current === label ? null : label))
            }
          />
        </ChartFrame>

        <ChartFrame
          dataAttr="debt-scatter"
          title="Run cost against technical debt"
          subtitle={`Each point an application; size is interface count, colour is criticality.${drill != null ? ` Filtered to ${drill}.` : ""}`}
        >
          <DebtScatter
            points={scatter.points}
            dropped={scatter.dropped}
          />
        </ChartFrame>
      </div>

      <div style={tableWrapStyle} data-home-tech-table>
        <div style={tableHeadStyle}>
          <h3 style={tableTitleStyle}>
            Applications{drill != null ? ` · ${drill}` : ""}
          </h3>
          <span style={tableCountStyle}>
            {sorted.length.toLocaleString()} rows
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th sortKey="name" sort={sort} onSort={toggleSort}>
                  Application
                </Th>
                <Th sortKey="provider" sort={sort} onSort={toggleSort}>
                  Provider
                </Th>
                <Th sortKey="func" sort={sort} onSort={toggleSort}>
                  Function
                </Th>
                <Th sortKey="criticality" sort={sort} onSort={toggleSort}>
                  Criticality
                </Th>
                <Th sortKey="cost" sort={sort} onSort={toggleSort} numeric>
                  Annual cost
                </Th>
                <Th sortKey="interfaces" sort={sort} onSort={toggleSort} numeric>
                  Interfaces
                </Th>
                <Th sortKey="debt" sort={sort} onSort={toggleSort} numeric>
                  Debt
                </Th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, TABLE_CAP).map((app, index) => (
                <tr key={`${app.name}-${index}`} style={rowStyle}>
                  <td style={appCellStyle}>{app.name}</td>
                  <td style={cellStyle}>
                    <DrillCell
                      label={app.provider}
                      active={dim === "provider" && drill === app.provider}
                      onClick={() => pivotTo("provider", app.provider)}
                    />
                  </td>
                  <td style={cellStyle}>
                    <DrillCell
                      label={app.func}
                      active={dim === "func" && drill === app.func}
                      onClick={() => pivotTo("func", app.func)}
                    />
                  </td>
                  <td style={cellStyle}>
                    <button
                      type="button"
                      data-home-tech-drill-criticality={app.criticality}
                      onClick={() => pivotTo("criticality", app.criticality)}
                      style={badgeButtonStyle}
                    >
                      <span style={badgeStyle(app.criticality)}>
                        {app.criticality}
                      </span>
                    </button>
                  </td>
                  <td style={numCellStyle}>{money(app.cost)}</td>
                  <td style={numCellStyle}>{app.interfaces.toLocaleString()}</td>
                  <td style={numCellStyle}>
                    {app.debt === null ? "—" : app.debt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length > TABLE_CAP ? (
          <p style={tableCapNoteStyle}>
            Showing the first {TABLE_CAP.toLocaleString()} of{" "}
            {sorted.length.toLocaleString()} rows. Narrow the view with a drill,
            or open the full register from the drill bar above.
          </p>
        ) : null}
      </div>
    </section>
  );
}

const TABLE_CAP = 160;
const SCATTER_WIDTH = 560;
const SCATTER_HEIGHT = 300;

/** The cost-versus-debt scatter, drawn at a fixed size and scaled by CSS for the same reason the bar
 * is (ResponsiveContainer renders nothing a test can see). Points are split into three series by
 * criticality so colour carries the tier without a fourth encoding. */
function DebtScatter({
  points,
  dropped,
}: {
  points: Array<{
    name: string;
    cost: number;
    debt: number;
    interfaces: number;
    criticality: string;
  }>;
  dropped: number;
}) {
  const tiers: Array<{ label: string; color: string }> = [
    { label: "Tier 1", color: HOME_HEX.navy },
    { label: "Tier 2", color: HOME_HEX.teal },
    { label: "Tier 3", color: HOME_HEX.textDisabled },
  ];
  const known = new Set(tiers.map((t) => t.label));
  const other = points.filter((p) => !known.has(p.criticality));
  return (
    <div data-home-debt-scatter={points.length}>
      <div style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}>
        <ScatterChart
          width={SCATTER_WIDTH}
          height={SCATTER_HEIGHT}
          margin={{ top: 10, right: 16, bottom: 22, left: 6 }}
          style={{ width: "100%", height: "auto" }}
        >
          <CartesianGrid stroke={V4.ruleSoft} />
          <XAxis
            type="number"
            dataKey="cost"
            name="Annual cost"
            tickFormatter={formatCompactUsd}
            tick={{ fill: V4.stone, fontSize: 10.5, fontFamily: MONO }}
            axisLine={{ stroke: V4.rule }}
            tickLine={false}
            label={{
              value: "Annual cost",
              position: "insideBottom",
              offset: -10,
              fontSize: 10.5,
              fill: V4.slate,
              fontFamily: MONO,
            }}
          />
          <YAxis
            type="number"
            dataKey="debt"
            name="Technical debt"
            domain={[0, 10]}
            tick={{ fill: V4.stone, fontSize: 10.5, fontFamily: MONO }}
            axisLine={{ stroke: V4.rule }}
            tickLine={false}
            label={{
              value: "Debt",
              angle: -90,
              position: "insideLeft",
              fontSize: 10.5,
              fill: V4.slate,
              fontFamily: MONO,
            }}
          />
          <ZAxis
            type="number"
            dataKey="interfaces"
            range={[24, 320]}
            name="Interfaces"
          />
          <HomeChartTooltip
            formatter={(value, name) =>
              name === "Annual cost"
                ? [formatCompactUsd(value), name]
                : [String(value), name]
            }
          />
          {tiers.map((tier) => (
            <Scatter
              key={tier.label}
              name={tier.label}
              data={points.filter((p) => p.criticality === tier.label)}
              fill={tier.color}
              fillOpacity={0.72}
              isAnimationActive={false}
            />
          ))}
          {other.length > 0 ? (
            <Scatter
              name="Other"
              data={other}
              fill={HOME_HEX.amber}
              fillOpacity={0.72}
              isAnimationActive={false}
            />
          ) : null}
        </ScatterChart>
      </div>
      <div style={scatterLegendStyle}>
        {tiers.map((tier) => (
          <span key={tier.label} style={legendItemStyle}>
            <span style={{ ...legendDotStyle, background: tier.color }} />
            {tier.label}
          </span>
        ))}
      </div>
      {dropped > 0 ? (
        <p style={{ ...chartNoteStyle, marginTop: 6 }}>
          {dropped} application{dropped === 1 ? "" : "s"} declare no debt score
          and {dropped === 1 ? "is" : "are"} not plotted — counted in the table,
          not drawn here, so the scatter never reads a missing score as zero.
        </p>
      ) : null}
    </div>
  );
}

function ScaleTile({ value, label }: { value: string; label: string }) {
  return (
    <div style={scaleTileStyle}>
      <div style={scaleNumberStyle}>{value}</div>
      <div style={scaleLabelStyle}>{label}</div>
    </div>
  );
}

function RelCard({ k, v }: { k: string; v: string }) {
  return (
    <div style={relCardStyle} data-home-rel-card={k}>
      <div style={relKeyStyle}>{k}</div>
      <div style={relValueStyle}>{v}</div>
    </div>
  );
}

function DrillCell({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...drillCellStyle,
        color: active ? V4.navy : V4.slate,
        fontWeight: active ? 600 : 400,
      }}
      title={`Drill into ${label}`}
    >
      {label}
    </button>
  );
}

function Th({
  children,
  sortKey,
  sort,
  onSort,
  numeric,
}: {
  children: string;
  sortKey: TableSortKey;
  sort: TableSort;
  onSort: (key: TableSortKey) => void;
  numeric?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      style={{ ...thStyle, textAlign: numeric ? "right" : "left" }}
      aria-sort={
        active ? (sort.dir > 0 ? "ascending" : "descending") : undefined
      }
    >
      <button
        type="button"
        data-home-tech-sort={sortKey}
        onClick={() => onSort(sortKey)}
        style={{
          ...thButtonStyle,
          justifyContent: numeric ? "flex-end" : "flex-start",
        }}
      >
        {children}
        {active ? (
          <span style={{ marginLeft: 4 }}>{sort.dir > 0 ? "▲" : "▼"}</span>
        ) : null}
      </button>
    </th>
  );
}

const cockpitStyle: CSSProperties = { padding: `22px ${PAGE_X}px 0` };

const scaleStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))",
  gap: 1,
  background: V4.ruleSoft,
  border: `1px solid ${V4.ruleSoft}`,
};

const scaleTileStyle: CSSProperties = {
  background: V4.paper,
  padding: "14px clamp(12px,1.3vw,18px) 13px",
  minWidth: 0,
};

const scaleNumberStyle: CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: "clamp(20px,2.1vw,27px)",
  lineHeight: 1,
  letterSpacing: "-0.025em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  color: V4.navy,
};

const scaleLabelStyle: CSSProperties = {
  marginTop: 8,
  fontFamily: MONO,
  fontSize: 10.5,
  lineHeight: 1.35,
  color: V4.slate,
};

const controlsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px 26px",
  alignItems: "center",
  margin: "20px 0 4px",
};

const controlGroupStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const segStyle: CSSProperties = {
  display: "inline-flex",
  border: `1px solid ${V4.rule}`,
  borderRadius: 7,
  overflow: "hidden",
};

function segButtonStyle(active: boolean): CSSProperties {
  return {
    font: "inherit",
    fontFamily: SANS,
    fontSize: 12.5,
    fontWeight: 600,
    color: active ? V4.paper : V4.slate,
    background: active ? V4.navy : V4.surface,
    border: 0,
    borderRight: `1px solid ${V4.ruleSoft}`,
    padding: "7px 12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

const drillbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  minHeight: 26,
  margin: "14px 0 2px",
  fontFamily: SANS,
  fontSize: 13,
  color: V4.slate,
};

const drillPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(0,102,204,0.08)",
  border: `1px solid ${V4.blue}`,
  color: V4.navy,
  borderRadius: 100,
  padding: "4px 6px 4px 12px",
  fontWeight: 600,
  fontSize: 12.5,
};

const drillPillButtonStyle: CSSProperties = {
  font: "inherit",
  border: 0,
  background: "none",
  cursor: "pointer",
  color: V4.slate,
  fontSize: 15,
  lineHeight: 1,
  padding: "0 4px",
};

const openRowsButtonStyle: CSSProperties = {
  font: "inherit",
  fontFamily: MONO,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: V4.blue,
  background: "none",
  border: 0,
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
};

const relGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))",
  gap: 1,
  background: V4.ruleSoft,
  border: `1px solid ${V4.ruleSoft}`,
  borderRadius: 8,
  overflow: "hidden",
  marginTop: 14,
};

const relCardStyle: CSSProperties = {
  background: V4.surface,
  padding: "12px 14px",
  minWidth: 0,
};

const relKeyStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 9.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: V4.stone,
};

const relValueStyle: CSSProperties = {
  fontFamily: SERIF,
  fontSize: 19,
  color: V4.navy,
  marginTop: 5,
  letterSpacing: "-0.01em",
};

const chartsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
  gap: "clamp(14px,1.6vw,20px)",
  marginTop: 18,
};

const chartNoteStyle: CSSProperties = {
  margin: "10px 0 0",
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.5,
  color: V4.slate,
};

const scatterLegendStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  marginTop: 10,
  fontFamily: MONO,
  fontSize: 10.5,
  color: V4.slate,
};

const legendItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const legendDotStyle: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: "50%",
  display: "inline-block",
};

const tableWrapStyle: CSSProperties = {
  marginTop: 20,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  overflow: "hidden",
  background: V4.surface,
};

const tableHeadStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  padding: "13px 16px",
  borderBottom: `1px solid ${V4.rule}`,
  flexWrap: "wrap",
};

const tableTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: SERIF,
  fontSize: 16,
  fontWeight: 500,
  color: V4.navy,
};

const tableCountStyle: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  color: V4.stone,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: SANS,
  fontSize: 13,
};

const thStyle: CSSProperties = {
  padding: 0,
  borderBottom: `1px solid ${V4.rule}`,
  position: "sticky",
  top: 0,
  background: V4.surface,
};

const thButtonStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  font: "inherit",
  fontFamily: MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: V4.slate,
  background: "none",
  border: 0,
  cursor: "pointer",
  padding: "11px 14px",
};

const rowStyle: CSSProperties = { borderBottom: `1px solid ${V4.ruleSoft}` };

const cellStyle: CSSProperties = {
  padding: "9px 14px",
  color: V4.slate,
  verticalAlign: "top",
};

const appCellStyle: CSSProperties = {
  ...cellStyle,
  color: V4.ink,
  fontWeight: 500,
};

const numCellStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "right",
  fontFamily: MONO,
  fontSize: 12,
  color: V4.inkSoft,
  fontVariantNumeric: "tabular-nums",
};

const drillCellStyle: CSSProperties = {
  font: "inherit",
  fontFamily: SANS,
  fontSize: 13,
  textAlign: "left",
  background: "none",
  border: 0,
  padding: 0,
  cursor: "pointer",
  textDecorationLine: "underline",
  textDecorationColor: V4.ruleSoft,
  textUnderlineOffset: 2,
};

const badgeButtonStyle: CSSProperties = {
  background: "none",
  border: 0,
  padding: 0,
  cursor: "pointer",
};

function badgeStyle(criticality: string): CSSProperties {
  const palette: Record<string, { bg: string; fg: string }> = {
    "Tier 1": { bg: V4.navy, fg: V4.paper },
    "Tier 2": { bg: "rgba(0,102,204,0.12)", fg: V4.blue },
    "Tier 3": { bg: "rgba(136,135,128,0.16)", fg: V4.slate },
  };
  const tone = palette[criticality] ?? {
    bg: "rgba(136,135,128,0.16)",
    fg: V4.slate,
  };
  return {
    display: "inline-block",
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "3px 8px",
    borderRadius: 100,
    background: tone.bg,
    color: tone.fg,
    whiteSpace: "nowrap",
  };
}

const tableCapNoteStyle: CSSProperties = {
  margin: 0,
  padding: "10px 16px",
  borderTop: `1px solid ${V4.ruleSoft}`,
  fontFamily: SANS,
  fontSize: 12,
  color: V4.slate,
};

const emptyNoticeStyle: CSSProperties = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 15,
  lineHeight: 1.6,
  color: V4.slate,
  maxWidth: "62ch",
};
