"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

import type {
  ArchitectureAdvisory,
  ArchitectureGraph,
  ArchitectureLayer,
  ArchitectureNode,
} from "@/types/architecture";

const LENS_OPTIONS = [
  { ref: "", label: "Current flow" },
  { ref: "annual_cost", label: "Cost" },
  { ref: "lifecycle_risk", label: "Modernization" },
  { ref: "criticality", label: "Risk" },
  { ref: "vendor_concentration", label: "Vendor exposure" },
  { ref: "evidence_completeness", label: "AI readiness" },
] as const;

const ARCH_COLUMNS: Array<{
  ref: string;
  title: string;
  subtitle: string;
  layers: ArchitectureLayer[];
  fill: string;
  stroke: string;
}> = [
  {
    ref: "business",
    title: "Business Demand",
    subtitle: "airline operating domains",
    layers: ["business"],
    fill: "#f8f4eb",
    stroke: "#d5c9b9",
  },
  {
    ref: "systems",
    title: "Systems of Record",
    subtitle: "applications and platforms",
    layers: ["source"],
    fill: "#fffaf1",
    stroke: "#dfc892",
  },
  {
    ref: "integration",
    title: "Integration Fabric",
    subtitle: "APIs, files, events",
    layers: ["integration"],
    fill: "#f0f6f3",
    stroke: "#b9cbc3",
  },
  {
    ref: "foundation",
    title: "Data Foundation",
    subtitle: "collect and organize",
    layers: ["transformation", "data_platform"],
    fill: "#eef5f8",
    stroke: "#adcbd6",
  },
  {
    ref: "decision",
    title: "Decision Surfaces",
    subtitle: "analyze and explain",
    layers: ["consumption"],
    fill: "#f7f2fa",
    stroke: "#cdb9dc",
  },
  {
    ref: "ai",
    title: "AI Activation",
    subtitle: "infuse into work",
    layers: ["ai_and_decision"],
    fill: "#edf7f1",
    stroke: "#9dcab0",
  },
];

interface ArchitectureColumn {
  ref: string;
  title: string;
  subtitle: string;
  layers: ArchitectureLayer[];
  fill: string;
  stroke: string;
  nodes: ArchitectureNode[];
  annualCost: number;
  interfaceCount: number;
  evidenceRatio: number;
}

export function CurrentStateArchitectureMap({
  graph,
  advisory,
  overlay,
  selectedRef,
  onOverlayChange,
  onSelect,
}: {
  graph: ArchitectureGraph;
  advisory: ArchitectureAdvisory;
  overlay: string;
  selectedRef?: string;
  onOverlayChange: (overlay: string) => void;
  onSelect: (ref: string) => void;
}) {
  const board = useMemo(
    () => buildArchitectureBoard(graph, advisory),
    [graph, advisory],
  );
  const selected = selectedRef
    ? (board.nodeByRef.get(selectedRef) ?? board.edgeByRef.get(selectedRef))
    : undefined;
  const lens = lensSummary(overlay, graph, board.columns);

  return (
    <section
      style={shellStyle}
      data-testid="current-state-architecture-board"
      data-active-lens={overlay || "current_flow"}
    >
      <header style={headerStyle}>
        <div>
          <div style={kickerStyle}>Architecture review board</div>
          <h3 style={titleStyle}>How SkyHarbor is positioned for AI success</h3>
          <p style={copyStyle}>
            Generated from {graph.nodes.length} graph nodes and{" "}
            {graph.edges.length} evidenced relationship flows. The board shows
            business demand through systems, integration, data, decision
            surfaces and AI activation; value proof is the governing constraint.
          </p>
        </div>
        <div style={metricWrapStyle}>
          <Metric
            label="Graph nodes"
            value={graph.nodes.length.toLocaleString()}
          />
          <Metric label="Flows" value={graph.edges.length.toLocaleString()} />
          <Metric label="Findings" value={graph.deterministicFindings.length} />
        </div>
      </header>

      <div style={toolbarStyle} aria-label="Architecture lens selector">
        {LENS_OPTIONS.map((item) => (
          <button
            key={item.ref || "default"}
            type="button"
            onClick={() => onOverlayChange(item.ref)}
            aria-pressed={overlay === item.ref}
            style={{
              ...lensButtonStyle,
              background: overlay === item.ref ? "#16211d" : "#fffdf8",
              color: overlay === item.ref ? "#eaf5ef" : "#332f29",
              borderColor: overlay === item.ref ? "#16211d" : "#d6ccbf",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={bodyStyle}>
        <div style={diagramPanelStyle}>
          <svg
            role="img"
            aria-label="SkyHarbor current-state architecture from business demand through AI value proof"
            viewBox="0 0 1280 620"
            width="100%"
            style={svgStyle}
          >
            <defs>
              <marker
                id="architecture-board-arrow"
                markerWidth="11"
                markerHeight="11"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <path d="M0,0 L0,7 L9,3.5 z" fill="#53615b" />
              </marker>
              <linearGradient
                id="architecture-flow"
                x1="0"
                x2="1"
                y1="0"
                y2="0"
              >
                <stop offset="0" stopColor="#158a7b" stopOpacity="0.18" />
                <stop offset="0.45" stopColor="#1688ff" stopOpacity="0.08" />
                <stop offset="1" stopColor="#bd720f" stopOpacity="0.14" />
              </linearGradient>
            </defs>

            <rect width="1280" height="620" rx="18" fill="#fffdf8" />
            <rect
              x="40"
              y="52"
              width="1200"
              height="80"
              rx="14"
              fill="url(#architecture-flow)"
              stroke="#e3dbcf"
            />
            <text x="62" y="84" fill="#151311" fontSize="20" fontWeight="900">
              Current-state architecture spine
            </text>
            <text x="62" y="111" fill="#5f5a53" fontSize="14">
              Demand moves through systems, integration, data, decision surfaces
              and AI-enabled work; value proof is the governing constraint.
            </text>

            {board.columns.map((column, index) => {
              const x = 42 + index * 202;
              const selectedColumn = selectedRef === column.ref;
              return (
                <g key={column.ref}>
                  {index < board.columns.length - 1 ? (
                    <path
                      d={`M ${x + 182} 238 C ${x + 214} 238, ${x + 214} 238, ${
                        x + 232
                      } 238`}
                      fill="none"
                      stroke="#53615b"
                      strokeWidth="2"
                      markerEnd="url(#architecture-board-arrow)"
                      opacity="0.72"
                    />
                  ) : null}
                  <rect
                    x={x}
                    y="166"
                    width="182"
                    height="322"
                    rx="16"
                    fill={column.fill}
                    stroke={selectedColumn ? "#1688ff" : column.stroke}
                    strokeWidth={selectedColumn ? "3" : "1.2"}
                    onClick={() => onSelect(column.ref)}
                    style={{ cursor: "pointer" }}
                  />
                  <text
                    x={x + 16}
                    y="198"
                    fill="#151311"
                    fontSize="17"
                    fontWeight="900"
                  >
                    {column.title}
                  </text>
                  <text x={x + 16} y="219" fill="#615a52" fontSize="12.5">
                    {column.subtitle}
                  </text>
                  <text
                    x={x + 16}
                    y="248"
                    fill={lens.color}
                    fontSize="20"
                    fontWeight="900"
                  >
                    {columnMetric(column, overlay)}
                  </text>
                  <text x={x + 16} y="269" fill="#6b655d" fontSize="11.5">
                    {columnSubMetric(column, overlay)}
                  </text>
                  {column.nodes.slice(0, 3).map((node, nodeIndex) => (
                    <NodeCard
                      key={node.nodeRef}
                      node={node}
                      x={x + 16}
                      y={296 + nodeIndex * 52}
                      selected={selectedRef === node.nodeRef}
                      overlay={overlay}
                      onSelect={onSelect}
                    />
                  ))}
                </g>
              );
            })}

            <g>
              <rect
                x="42"
                y="520"
                width="375"
                height="62"
                rx="14"
                fill="#f7e5df"
                stroke="#dbb0a4"
              />
              <text
                x="62"
                y="548"
                fill="#151311"
                fontSize="15"
                fontWeight="900"
              >
                Finding: value proof has not caught up
              </text>
              <text x="62" y="570" fill="#625c54" fontSize="12.5">
                Usage telemetry exists; finance-validated realized value is not
                established.
              </text>
            </g>

            <g>
              <rect
                x="442"
                y="520"
                width="375"
                height="62"
                rx="14"
                fill="#fbefd9"
                stroke="#e2bc78"
              />
              <text
                x="462"
                y="548"
                fill="#151311"
                fontSize="15"
                fontWeight="900"
              >
                Control point: contract evidence pending
              </text>
              <text x="462" y="570" fill="#625c54" fontSize="12.5">
                Annual contract value is known; clause/span evidence is the next
                load.
              </text>
            </g>

            <g>
              <rect
                x="842"
                y="520"
                width="398"
                height="62"
                rx="14"
                fill="#eaf4f0"
                stroke="#a9cfc4"
              />
              <text
                x="862"
                y="548"
                fill="#151311"
                fontSize="15"
                fontWeight="900"
              >
                Operating model: measure before scale
              </text>
              <text x="862" y="570" fill="#625c54" fontSize="12.5">
                Baseline, DORA/service metrics and owner sign-off gate funding.
              </text>
            </g>
          </svg>
        </div>

        <aside
          style={insightPanelStyle}
          aria-label="Architecture insight panel"
        >
          <div style={kickerStyle}>Active lens</div>
          <h4 style={panelTitleStyle} data-testid="architecture-active-lens">
            {lens.title}
          </h4>
          <p style={panelCopyStyle}>{lens.body}</p>
          <div style={statGridStyle}>
            <Metric label="Evidence gaps" value={graph.evidenceGaps.length} />
            <Metric
              label="Evidenced nodes"
              value={`${Math.round(board.evidencedNodeRatio * 100)}%`}
            />
          </div>

          <div style={detailBoxStyle}>
            <div style={kickerStyle}>Selected detail</div>
            {selected ? (
              <SelectedDetail value={selected} />
            ) : selectedRef && board.columnByRef.has(selectedRef) ? (
              <ColumnDetail column={board.columnByRef.get(selectedRef)!} />
            ) : (
              <p style={panelCopyStyle}>
                Select a block or node to inspect source-backed details,
                ownership hints, volumetrics and evidence state.
              </p>
            )}
          </div>

          <div style={detailBoxStyle}>
            <div style={kickerStyle}>Review agenda</div>
            {(advisory.leadershipDecisions ?? [])
              .slice(0, 3)
              .map((item, index) => (
                <div
                  key={`${item.decisionRef || item.headline}-${index}`}
                  style={agendaItemStyle}
                >
                  <strong>{item.headline}</strong>
                  <span>{item.decisionOwnerRole}</span>
                </div>
              ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metricStyle}>
      <span style={metricLabelStyle}>{label}</span>
      <strong style={metricValueStyle}>{value}</strong>
    </div>
  );
}

function NodeCard({
  node,
  x,
  y,
  selected,
  overlay,
  onSelect,
}: {
  node: ArchitectureNode;
  x: number;
  y: number;
  selected: boolean;
  overlay: string;
  onSelect: (ref: string) => void;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${node.label}, ${node.nodeKind}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.nodeRef);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(node.nodeRef);
      }}
      style={{ cursor: "pointer", outline: "none" }}
    >
      <rect
        x={x}
        y={y}
        width="150"
        height="42"
        rx="9"
        fill="#fffdf8"
        stroke={selected ? "#1688ff" : "#d7cfc3"}
        strokeWidth={selected ? "2.4" : "1"}
      />
      <circle
        cx={x + 134}
        cy={y + 14}
        r="4.5"
        fill={evidenceColor(node.evidenceState)}
      />
      <text x={x + 10} y={y + 17} fill="#151311" fontSize="12" fontWeight="900">
        {trimLabel(node.shortLabel || node.label, 21)}
      </text>
      <text x={x + 10} y={y + 32} fill="#625c54" fontSize="10.5">
        {trimLabel(nodeCaption(node, overlay), 26)}
      </text>
    </g>
  );
}

function SelectedDetail({
  value,
}: {
  value:
    | ArchitectureNode
    | {
        edgeRef: string;
        edgeKind: string;
        evidenceState: string;
        evidenceRefs: string[];
      };
}) {
  if ("nodeRef" in value) {
    return (
      <div style={selectedDetailStyle}>
        <strong>{value.label}</strong>
        <span>{value.nodeKind.replaceAll("_", " ")}</span>
        <span>
          {value.ownerRole || value.vendorName || "Owner not supplied"}
        </span>
        <span>
          {[
            value.annualCost ? money(value.annualCost) : "",
            value.interfaceCount ? `${value.interfaceCount} interfaces` : "",
            value.userCount ? `${value.userCount.toLocaleString()} users` : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Volumetrics pending"}
        </span>
        <span>Evidence: {value.evidenceState}</span>
      </div>
    );
  }

  return (
    <div style={selectedDetailStyle}>
      <strong>{value.edgeRef}</strong>
      <span>{value.edgeKind.replaceAll("_", " ")}</span>
      <span>Evidence: {value.evidenceState}</span>
      <span>{value.evidenceRefs.slice(0, 2).join(" · ")}</span>
    </div>
  );
}

function ColumnDetail({ column }: { column: ArchitectureColumn }) {
  return (
    <div style={selectedDetailStyle}>
      <strong>{column.title}</strong>
      <span>{column.layers.join(", ").replaceAll("_", " ")}</span>
      <span>{column.nodes.length} representative graph entities</span>
      <span>{money(column.annualCost)} annual cost visible</span>
      <span>{column.interfaceCount.toLocaleString()} interface references</span>
    </div>
  );
}

function buildArchitectureBoard(
  graph: ArchitectureGraph,
  advisory: ArchitectureAdvisory,
) {
  const emphasisRefs = new Set([
    ...advisory.nodeEmphasis.map((item) => item.nodeRef),
    ...advisory.diagramCallouts.map((item) => item.anchorRef),
  ]);
  const edgesByRef = new Map(graph.edges.map((edge) => [edge.edgeRef, edge]));
  const columns: ArchitectureColumn[] = ARCH_COLUMNS.map((column) => {
    const nodes = graph.nodes
      .filter((node) => column.layers.includes(node.layer))
      .sort(
        (a, b) =>
          nodeRank(b, emphasisRefs) - nodeRank(a, emphasisRefs) ||
          a.label.localeCompare(b.label),
      )
      .slice(0, 5);
    const evidenceCount = nodes.filter(
      (node) => node.evidenceState === "evidenced",
    ).length;
    return {
      ...column,
      nodes,
      annualCost: nodes.reduce((sum, node) => sum + (node.annualCost ?? 0), 0),
      interfaceCount: nodes.reduce(
        (sum, node) => sum + (node.interfaceCount ?? 0),
        0,
      ),
      evidenceRatio: nodes.length ? evidenceCount / nodes.length : 0,
    };
  });
  const nodeByRef = new Map(graph.nodes.map((node) => [node.nodeRef, node]));
  return {
    columns,
    nodeByRef,
    edgeByRef: edgesByRef,
    columnByRef: new Map(columns.map((column) => [column.ref, column])),
    evidencedNodeRatio:
      graph.nodes.filter((node) => node.evidenceState === "evidenced").length /
      Math.max(1, graph.nodes.length),
  };
}

function lensSummary(
  overlay: string,
  graph: ArchitectureGraph,
  columns: ArchitectureColumn[],
) {
  if (overlay === "annual_cost") {
    return {
      title: "Cost concentration",
      body: `${money(
        columns.reduce((sum, column) => sum + column.annualCost, 0),
      )} is visible across the representative board entities. Use Tower for governed totals.`,
      color: "#bd720f",
    };
  }
  if (overlay === "lifecycle_risk") {
    const count = graph.nodes.filter((node) =>
      `${node.lifecycleState ?? ""} ${node.modernizationState ?? ""}`.match(
        /retire|replace|pending|disputed|maintain/i,
      ),
    ).length;
    return {
      title: "Modernization pressure",
      body: `${count} graph entities carry lifecycle or modernization pressure. The board highlights where those decisions cross operating flows.`,
      color: "#b3261e",
    };
  }
  if (overlay === "criticality") {
    const count = graph.nodes.filter((node) =>
      node.criticality?.match(/critical|tier 1|high/i),
    ).length;
    return {
      title: "Criticality and control",
      body: `${count} entities are marked critical or high impact. AI expansion should follow those dependency constraints, not run around them.`,
      color: "#b3261e",
    };
  }
  if (overlay === "vendor_concentration") {
    const count = graph.nodes.filter((node) => node.vendorName).length;
    return {
      title: "Vendor exposure",
      body: `${count} graph entities carry vendor context. Contract files and clause spans are still required for legal-grade findings.`,
      color: "#7b5b0e",
    };
  }
  if (overlay === "evidence_completeness") {
    return {
      title: "AI readiness",
      body: "The architecture can show AI activation and usage telemetry. It cannot call value realized until baseline and outcome evidence are loaded.",
      color: "#157f74",
    };
  }
  return {
    title: "Current operating flow",
    body: "Read left to right: business demand, systems of record, integration, data foundation, decision surfaces and AI-infused work.",
    color: "#157f74",
  };
}

function nodeRank(node: ArchitectureNode, emphasisRefs: Set<string>) {
  return (
    (emphasisRefs.has(node.nodeRef) ? 120 : 0) +
    (node.criticality?.match(/critical|tier 1|high/i) ? 60 : 0) +
    (node.annualCost ?? 0) / 1_000_000 +
    Math.min(50, (node.interfaceCount ?? 0) * 2) +
    Math.min(25, (node.userCount ?? 0) / 1000) +
    (node.evidenceState === "evidenced" ? 20 : 0)
  );
}

function columnMetric(column: ArchitectureColumn, overlay: string) {
  if (overlay === "annual_cost") return money(column.annualCost);
  if (overlay === "evidence_completeness")
    return `${Math.round(column.evidenceRatio * 100)}% evidenced`;
  if (overlay === "vendor_concentration")
    return `${column.nodes.filter((node) => node.vendorName).length} vendors`;
  if (overlay === "criticality")
    return `${column.nodes.filter((node) => node.criticality).length} critical`;
  if (overlay === "lifecycle_risk")
    return `${
      column.nodes.filter((node) =>
        `${node.lifecycleState ?? ""} ${node.modernizationState ?? ""}`.match(
          /retire|replace|pending|disputed|maintain/i,
        ),
      ).length
    } pressured`;
  return `${column.nodes.length} entities`;
}

function columnSubMetric(column: ArchitectureColumn, overlay: string) {
  if (overlay === "annual_cost")
    return `${column.interfaceCount.toLocaleString()} interfaces visible`;
  if (overlay === "evidence_completeness")
    return "dot indicates source evidence state";
  if (overlay === "vendor_concentration") return "supplier linkage visible";
  if (overlay === "criticality") return "criticality supplied in graph";
  if (overlay === "lifecycle_risk") return "lifecycle/decision pressure";
  return `${money(column.annualCost)} · ${column.interfaceCount.toLocaleString()} interfaces`;
}

function nodeCaption(node: ArchitectureNode, overlay: string) {
  if (overlay === "annual_cost")
    return node.annualCost ? money(node.annualCost) : "cost pending";
  if (overlay === "lifecycle_risk")
    return (
      node.modernizationState || node.lifecycleState || "lifecycle pending"
    );
  if (overlay === "criticality")
    return node.criticality || "criticality pending";
  if (overlay === "vendor_concentration")
    return node.vendorName || "vendor pending";
  if (overlay === "evidence_completeness") return node.evidenceState;
  return (
    [
      node.annualCost ? money(node.annualCost) : "",
      node.interfaceCount ? `${node.interfaceCount} interfaces` : "",
    ]
      .filter(Boolean)
      .join(" · ") || node.nodeKind.replaceAll("_", " ")
  );
}

function evidenceColor(state: string) {
  if (state === "evidenced") return "#157f74";
  if (state === "inferred") return "#bd720f";
  return "#b3261e";
}

function money(value: number) {
  if (!value) return "Not supplied";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function trimLabel(value: string, max: number) {
  return value.length > max
    ? `${value.slice(0, Math.max(1, max - 1))}...`
    : value;
}

const shellStyle = {
  minHeight: 560,
  background: "#fffdf8",
} satisfies CSSProperties;

const headerStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 20,
  padding: "18px 20px",
  borderBottom: "1px solid #e4dccf",
  alignItems: "center",
} satisfies CSSProperties;

const kickerStyle = {
  color: "#1688ff",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 10,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
} satisfies CSSProperties;

const titleStyle = {
  margin: "6px 0 0",
  color: "#151311",
  fontSize: 24,
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: 0,
} satisfies CSSProperties;

const copyStyle = {
  maxWidth: 820,
  margin: "8px 0 0",
  color: "#625c54",
  fontSize: 14,
  lineHeight: 1.45,
} satisfies CSSProperties;

const metricWrapStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
} satisfies CSSProperties;

const metricStyle = {
  minWidth: 104,
  border: "1px solid #d9d1c5",
  borderRadius: 8,
  background: "#fffaf1",
  padding: "9px 10px",
} satisfies CSSProperties;

const metricLabelStyle = {
  display: "block",
  color: "#716a61",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
} satisfies CSSProperties;

const metricValueStyle = {
  display: "block",
  marginTop: 3,
  color: "#151311",
  fontSize: 20,
  lineHeight: 1,
} satisfies CSSProperties;

const toolbarStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  padding: "12px 20px",
  borderBottom: "1px solid #e4dccf",
  background: "#fbf8f1",
} satisfies CSSProperties;

const lensButtonStyle = {
  minHeight: 34,
  border: "1px solid #d6ccbf",
  borderRadius: 7,
  padding: "0 12px",
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 0,
  cursor: "pointer",
} satisfies CSSProperties;

const bodyStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 0,
  minHeight: 0,
} satisfies CSSProperties;

const diagramPanelStyle = {
  minWidth: 0,
  background: "#fffdf8",
  overflow: "hidden",
} satisfies CSSProperties;

const svgStyle = {
  display: "block",
  width: "100%",
  minWidth: 0,
  height: 430,
  maxHeight: "none",
  background: "#fffdf8",
} satisfies CSSProperties;

const insightPanelStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  alignItems: "start",
  gap: 14,
  padding: 14,
  background: "#f7f4ee",
  borderTop: "1px solid #e4dccf",
} satisfies CSSProperties;

const panelTitleStyle = {
  margin: "6px 0 0",
  fontSize: 20,
  lineHeight: 1.12,
  fontWeight: 900,
} satisfies CSSProperties;

const panelCopyStyle = {
  margin: "8px 0 0",
  color: "#625c54",
  fontSize: 13,
  lineHeight: 1.45,
} satisfies CSSProperties;

const statGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
} satisfies CSSProperties;

const detailBoxStyle = {
  border: "1px solid #d9d1c5",
  borderRadius: 9,
  background: "#fffdf8",
  padding: 12,
} satisfies CSSProperties;

const selectedDetailStyle = {
  display: "grid",
  gap: 7,
  marginTop: 9,
  color: "#4f4942",
  fontSize: 12,
  lineHeight: 1.35,
} satisfies CSSProperties;

const agendaItemStyle = {
  display: "grid",
  gap: 4,
  borderTop: "1px solid #e6ded3",
  paddingTop: 10,
  marginTop: 10,
  color: "#4f4942",
  fontSize: 12,
  lineHeight: 1.35,
} satisfies CSSProperties;
