"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import type {
  HomeV4ChartVisual,
  HomeV4Classification,
  HomeV4DataPoint,
  HomeV4GraphVisual,
  HomeV4PrimaryVisual,
} from "./homeV4Visual";
import { isHomeV4GraphVisual } from "./homeV4Visual";

// Classification -> color follows the same semantic mapping used elsewhere on
// Home (loaded_fact reads as settled/confident, missing_evidence reads as a
// gap) rather than inventing a second palette.
const CLASSIFICATION_COLOR: Record<HomeV4Classification, string> = {
  loaded_fact: COLORS.teal,
  derived_measure: COLORS.blue,
  industry_pattern: COLORS.amber,
  strategic_inference: COLORS.quiet,
  missing_evidence: COLORS.red,
};

function classificationColor(value: unknown): string {
  const key = typeof value === "string" ? (value as HomeV4Classification) : undefined;
  return (key && CLASSIFICATION_COLOR[key]) || COLORS.quiet;
}

function VisualFrame({
  visual,
  children,
}: {
  visual: HomeV4ChartVisual | HomeV4GraphVisual;
  children: React.ReactNode;
}) {
  const hasData = isHomeV4GraphVisual(visual)
    ? visual.node_groups.length > 0
    : (visual as HomeV4ChartVisual).data_points?.length > 0;
  return (
    <div className="heb-v4-visual">
      <div className="heb-v4-visual-head">
        <span className="heb-section-label">
          {visual.visual_type.replaceAll("_", " ")}
        </span>
        <h4>{isHomeV4GraphVisual(visual) ? visual.projection_type.replaceAll("_", " ") : visual.title}</h4>
        {!isHomeV4GraphVisual(visual) && visual.executive_question ? (
          <p className="heb-v4-visual-question">{visual.executive_question}</p>
        ) : null}
      </div>
      <div className="heb-v4-visual-body">
        {hasData ? children : <p className="heb-v4-empty-state">{visual.empty_state}</p>}
      </div>
      {!isHomeV4GraphVisual(visual) && visual.annotation ? (
        <p className="heb-v4-visual-annotation">{visual.annotation}</p>
      ) : null}
      <p className="heb-v4-visual-boundary">
        {isHomeV4GraphVisual(visual) ? visual.edge_meaning : visual.evidence_boundary}
      </p>
    </div>
  );
}

function HorizontalBarVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  const rows = data_points.map((d) => ({ ...d, fill: classificationColor(d.classification) }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 24, top: 6, bottom: 6 }}>
        <CartesianGrid horizontal={false} stroke={COLORS.line} />
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 11, fill: COLORS.muted }} />
        <Tooltip formatter={(value, _name, item) => [value, (item?.payload as HomeV4DataPoint)?.source_basis ?? ""]} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {rows.map((row, index) => (
            <Cell key={`${row.label ?? index}`} fill={row.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function StackedBarVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  const seriesKeys = Array.from(new Set(data_points.map((d) => (typeof d.series === "string" ? d.series : "value"))));
  const byLabel = new Map<string, Record<string, unknown>>();
  for (const point of data_points) {
    const label = point.label ?? "";
    const row = byLabel.get(label) ?? { label };
    row[typeof point.series === "string" ? point.series : "value"] = point.value;
    byLabel.set(label, row);
  }
  const rows = Array.from(byLabel.values());
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 24, top: 6, bottom: 6 }}>
        <CartesianGrid horizontal={false} stroke={COLORS.line} />
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 11, fill: COLORS.muted }} />
        <Tooltip />
        {seriesKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="stack"
            fill={[COLORS.teal, COLORS.blue, COLORS.amber, COLORS.red][index % 4]}
            radius={index === seriesKeys.length - 1 ? [0, 6, 6, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function WaterfallVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  // Stacked bar with an invisible base segment, per the established Home
  // Recharts waterfall convention (design_system memory: value-hypothesis
  // waterfall was built this way when no real $ data existed to plot).
  let cumulative = 0;
  const rows = data_points.map((d) => {
    const value = typeof d.value === "number" ? d.value : 0;
    const base = value >= 0 ? cumulative : cumulative + value;
    cumulative += value;
    return { label: d.label, base: Math.max(base, 0), value: Math.abs(value), fill: classificationColor(d.classification) };
  });
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ left: 12, right: 24, top: 6, bottom: 24 }}>
        <CartesianGrid vertical={false} stroke={COLORS.line} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis hide />
        <Tooltip />
        <Bar dataKey="base" stackId="wf" fill="transparent" />
        <Bar dataKey="value" stackId="wf" radius={[4, 4, 0, 0]}>
          {rows.map((row, index) => (
            <Cell key={`${row.label ?? index}`} fill={row.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineTrendVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data_points} margin={{ left: 12, right: 24, top: 6, bottom: 6 }}>
        <CartesianGrid stroke={COLORS.line} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaTrendVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data_points} margin={{ left: 12, right: 24, top: 6, bottom: 6 }}>
        <CartesianGrid stroke={COLORS.line} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.muted }} />
        <YAxis tick={{ fontSize: 11, fill: COLORS.muted }} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.18} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RadarVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data_points} outerRadius="75%">
        <PolarGrid stroke={COLORS.line} />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.muted }} />
        <PolarRadiusAxis tick={{ fontSize: 9, fill: COLORS.quiet }} />
        <Radar dataKey="value" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.25} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function TreemapVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  const rows = data_points.map((d) => ({
    name: d.label,
    size: typeof d.value === "number" ? d.value : 1,
    fill: classificationColor(d.classification),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <Treemap data={rows} dataKey="size" stroke={COLORS.surface} content={<TreemapCell />} />
    </ResponsiveContainer>
  );
}

function TreemapCell(props: Record<string, unknown>) {
  const { x, y, width, height, name, fill } = props as {
    x: number; y: number; width: number; height: number; name?: string; fill?: string;
  };
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill ?? COLORS.quiet} stroke={COLORS.surface} />
      {width > 50 && height > 20 ? (
        <text x={x + 6} y={y + 16} fontSize={10} fill="#fffdf8">
          {name}
        </text>
      ) : null}
    </g>
  );
}

function Scatter2x2Visual({ data_points, encoding }: { data_points: HomeV4DataPoint[]; encoding?: HomeV4ChartVisual["encoding"] }) {
  const rows = data_points.map((d) => ({ ...d, fill: classificationColor(d.classification) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ left: 12, right: 24, top: 12, bottom: 12 }}>
        <CartesianGrid stroke={COLORS.line} />
        <XAxis type="number" dataKey="x" name={encoding?.x ?? "x"} tick={{ fontSize: 10, fill: COLORS.muted }} domain={[0, 10]} />
        <YAxis type="number" dataKey="y" name={encoding?.y ?? "y"} tick={{ fontSize: 10, fill: COLORS.muted }} domain={[0, 10]} />
        <ZAxis range={[80, 80]} />
        <ReferenceLine x={5} stroke={COLORS.lineStrong} />
        <ReferenceLine y={5} stroke={COLORS.lineStrong} />
        <Tooltip formatter={(value, _n, item) => [value, (item?.payload as HomeV4DataPoint)?.label ?? ""]} />
        <Scatter data={rows}>
          {rows.map((row, index) => (
            <Cell key={`${row.label ?? index}`} fill={row.fill} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function HeatmapVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  const rowLabels = Array.from(new Set(data_points.map((d) => String(d.row ?? ""))));
  const colLabels = Array.from(new Set(data_points.map((d) => String(d.col ?? ""))));
  const byCell = new Map(data_points.map((d) => [`${d.row}::${d.col}`, d]));
  const values = data_points.map((d) => (typeof d.value === "number" ? d.value : 0));
  const max = Math.max(1, ...values);
  return (
    <div className="heb-v4-heatmap" role="table" aria-label="Heatmap">
      <div className="heb-v4-heatmap-header">
        <div />
        {colLabels.map((col) => (
          <div key={col} className="heb-v4-heatmap-col-label">{col}</div>
        ))}
      </div>
      {rowLabels.map((row) => (
        <div key={row} className="heb-v4-heatmap-row">
          <div className="heb-v4-heatmap-row-label">{row}</div>
          {colLabels.map((col) => {
            const cell = byCell.get(`${row}::${col}`);
            const intensity = cell && typeof cell.value === "number" ? cell.value / max : 0;
            return (
              <div
                key={col}
                className="heb-v4-heatmap-cell"
                title={cell?.source_basis ?? ""}
                style={{ background: `color-mix(in srgb, ${classificationColor(cell?.classification)} ${Math.round(20 + intensity * 70)}%, ${COLORS.surface})` }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EvidenceTimelineVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  const rows = [...data_points].sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  return (
    <div className="heb-v4-timeline">
      {rows.map((row, index) => (
        <div key={`${row.label ?? index}`} className="heb-v4-timeline-row">
          <span className="heb-v4-timeline-date">{row.date ?? ""}</span>
          <span className="heb-v4-timeline-dot" style={{ background: classificationColor(row.classification) }} />
          <span className="heb-v4-timeline-label">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function ExecutiveScorecardVisual({ data_points }: { data_points: HomeV4DataPoint[] }) {
  return (
    <div className="heb-v4-scorecard">
      {data_points.map((row, index) => (
        <div key={`${row.label ?? index}`} className="heb-v4-scorecard-cell">
          <span className="heb-v4-scorecard-value" style={{ color: classificationColor(row.classification) }}>
            {row.value ?? "—"}
          </span>
          <span className="heb-v4-scorecard-label">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function RelationshipGraphVisual({ visual }: { visual: HomeV4GraphVisual }) {
  const groups = visual.node_groups;
  const center = { x: 300, y: 110 };
  const positioned = groups.map((group, index) => {
    const angle = (-140 + index * (280 / Math.max(1, groups.length - 1))) * (Math.PI / 180);
    return {
      ...group,
      x: center.x + Math.cos(angle) * 210,
      y: center.y + Math.sin(angle) * 82,
    };
  });
  return (
    <svg viewBox="0 0 620 220" role="img" aria-label={`Relationship graph: ${visual.projection_type}`} className="heb-v4-graph">
      {positioned.map((group) => (
        <line
          key={`edge-${group.group}`}
          x1={center.x}
          y1={center.y}
          x2={group.x}
          y2={group.y}
          stroke={COLORS.line}
          strokeWidth={1.4}
        />
      ))}
      <circle cx={center.x} cy={center.y} r={26} fill={COLORS.black} />
      <text x={center.x} y={center.y + 4} textAnchor="middle" fill="#fffdf8" fontSize={10} fontWeight={700}>
        {visual.projection_type.slice(0, 10)}
      </text>
      {positioned.map((group) => (
        <g key={group.group}>
          <circle cx={group.x} cy={group.y} r={14} fill={classificationColor(group.classification)} />
          <text x={group.x} y={group.y - 20} textAnchor="middle" fontSize={10} fontWeight={700} fill={COLORS.ink}>
            {group.group}
          </text>
          <text x={group.x} y={group.y + 28} textAnchor="middle" fontSize={8} fill={COLORS.muted}>
            {group.examples.slice(0, 2).join(", ")}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HomeV4VisualRenderer({ visual }: { visual: HomeV4PrimaryVisual }) {
  const body = isHomeV4GraphVisual(visual) ? (
    <VisualFrame visual={visual}>
      <RelationshipGraphVisual visual={visual} />
    </VisualFrame>
  ) : (
    <VisualFrame visual={visual}>
      {visual.visual_type === "horizontal_bar" && <HorizontalBarVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "stacked_bar" && <StackedBarVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "waterfall" && <WaterfallVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "line_trend" && <LineTrendVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "area_trend" && <AreaTrendVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "radar" && <RadarVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "treemap" && <TreemapVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "scatter_2x2" && (
        <Scatter2x2Visual data_points={visual.data_points ?? []} encoding={visual.encoding} />
      )}
      {visual.visual_type === "heatmap" && <HeatmapVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "evidence_timeline" && <EvidenceTimelineVisual data_points={visual.data_points ?? []} />}
      {visual.visual_type === "executive_scorecard" && (
        <ExecutiveScorecardVisual data_points={visual.data_points ?? []} />
      )}
    </VisualFrame>
  );
  return (
    <>
      {body}
      <style jsx global>{`
        .heb-v4-visual {
          padding: 18px;
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          background: ${COLORS.surface};
        }
        .heb-v4-visual-head h4 {
          margin: 6px 0 4px;
          font-size: 16px;
          line-height: 1.25;
          color: ${COLORS.ink};
          text-transform: capitalize;
        }
        .heb-v4-visual-question {
          margin: 0 0 10px;
          font-size: 13px;
          color: ${COLORS.muted};
        }
        .heb-v4-visual-body {
          min-height: 60px;
        }
        .heb-v4-empty-state {
          margin: 12px 0;
          padding: 14px;
          border: 1px dashed ${COLORS.lineStrong};
          border-radius: 8px;
          font-size: 13px;
          color: ${COLORS.quiet};
        }
        .heb-v4-visual-annotation {
          margin: 10px 0 0;
          font-size: 13px;
          color: ${COLORS.ink};
        }
        .heb-v4-visual-boundary {
          margin: 8px 0 0;
          font-size: 11px;
          color: ${COLORS.quiet};
          line-height: 1.4;
        }
        .heb-v4-heatmap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .heb-v4-heatmap-header,
        .heb-v4-heatmap-row {
          display: grid;
          grid-template-columns: 160px repeat(auto-fit, minmax(60px, 1fr));
          gap: 2px;
          align-items: center;
        }
        .heb-v4-heatmap-col-label {
          font-size: 10px;
          color: ${COLORS.muted};
          text-align: center;
        }
        .heb-v4-heatmap-row-label {
          font-size: 11px;
          color: ${COLORS.muted};
        }
        .heb-v4-heatmap-cell {
          height: 28px;
          border-radius: 4px;
        }
        .heb-v4-graph {
          width: 100%;
          height: 220px;
        }
        .heb-v4-timeline {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .heb-v4-timeline-row {
          display: grid;
          grid-template-columns: 90px 12px 1fr;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: ${COLORS.ink};
        }
        .heb-v4-timeline-date {
          color: ${COLORS.quiet};
          font-size: 11px;
        }
        .heb-v4-timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }
        .heb-v4-scorecard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }
        .heb-v4-scorecard-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          border: 1px solid ${COLORS.line};
          border-radius: 8px;
        }
        .heb-v4-scorecard-value {
          font-size: 20px;
          font-weight: 700;
        }
        .heb-v4-scorecard-label {
          font-size: 11px;
          color: ${COLORS.muted};
        }
      `}</style>
    </>
  );
}
