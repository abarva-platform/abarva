"use client";

import { useMemo } from "react";

import type {
  ArchitectureAdvisory,
  ArchitectureEdge,
  ArchitectureGraph,
  ArchitectureLayer,
  ArchitectureNode,
} from "@/types/architecture";

const LAYERS: Array<{ layer: ArchitectureLayer; label: string; hint: string }> =
  [
    {
      layer: "business",
      label: "Business capabilities",
      hint: "who depends on the estate",
    },
    {
      layer: "source",
      label: "Apps and source systems",
      hint: "operational systems of record",
    },
    {
      layer: "integration",
      label: "Integration",
      hint: "APIs, files and messaging",
    },
    {
      layer: "transformation",
      label: "Transformation",
      hint: "ETL, pipelines and logic",
    },
    {
      layer: "data_platform",
      label: "Data platforms",
      hint: "warehouses, lakes and marts",
    },
    {
      layer: "consumption",
      label: "Analytics and decisions",
      hint: "BI, reports and decision use",
    },
    {
      layer: "ai_and_decision",
      label: "AI tools and outcomes",
      hint: "AI activation and proof",
    },
  ];

const ZONES = [
  "Flight operations",
  "Airport operations",
  "Customer and commercial",
  "Revenue and planning",
  "Maintenance and safety",
  "Finance and corporate",
  "HR and workforce",
  "Enterprise technology",
] as const;

const OVERLAYS = [
  { ref: "", label: "Default" },
  { ref: "annual_cost", label: "Cost" },
  { ref: "lifecycle_risk", label: "Modernization" },
  { ref: "criticality", label: "Risk" },
  { ref: "vendor_concentration", label: "Vendor exposure" },
  { ref: "evidence_completeness", label: "AI readiness" },
] as const;

const FLOW_STEPS = [
  "Business operations",
  "Source systems",
  "Integration",
  "Transformation",
  "Data platforms",
  "Decision tools",
  "AI-enabled work and outcomes",
] as const;

type Zone = (typeof ZONES)[number];

interface PositionedNode {
  node: ArchitectureNode;
  x: number;
  y: number;
  zone: Zone;
}

interface Layout {
  nodes: PositionedNode[];
  edges: ArchitectureEdge[];
  positions: Map<string, PositionedNode>;
  width: number;
  height: number;
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
  const layout = useMemo(() => buildLayout(graph, advisory), [graph, advisory]);
  const callouts = useMemo(
    () => normalizeDiagramCallouts(advisory),
    [advisory],
  );

  return (
    <section style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <strong style={{ fontSize: 14 }}>
            End-to-end current-state architecture
          </strong>
          <p style={headerCopyStyle}>
            Showing {layout.nodes.length} executive entities selected from{" "}
            {graph.nodes.length} graph nodes and {graph.edges.length} evidenced
            flows. The sequence runs from operations through source systems,
            integration, data, analytics and AI outcome proof.
          </p>
        </div>
        <div style={overlayWrapStyle} aria-label="Architecture overlay">
          {OVERLAYS.map((item) => (
            <button
              key={item.ref || "default"}
              type="button"
              onClick={() => onOverlayChange(item.ref)}
              aria-pressed={overlay === item.ref}
              style={{
                ...overlayButtonStyle,
                background: overlay === item.ref ? "#17211e" : "#fffdf8",
                color: overlay === item.ref ? "#e7f4ec" : "#3b352e",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div style={flowStripStyle} aria-label="Architecture flow sequence">
        {FLOW_STEPS.map((step, index) => (
          <div key={step} style={flowStepStyle}>
            <span style={flowIndexStyle}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div style={viewportStyle}>
        <svg
          role="img"
          aria-label="SkyHarbor end-to-end current-state architecture"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          style={svgStyle}
        >
          <defs>
            <marker
              id="current-state-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#596660" />
            </marker>
            <linearGradient id="flow-ribbon" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#157f74" stopOpacity="0.12" />
              <stop offset="0.52" stopColor="#5e6b69" stopOpacity="0.08" />
              <stop offset="1" stopColor="#a96d16" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
            fill="#fffdf8"
          />
          <rect
            x={148}
            y={76}
            width={layout.width - 176}
            height={layout.height - 116}
            rx={8}
            fill="url(#flow-ribbon)"
          />

          {ZONES.map((zone, index) => {
            const x = zoneX(index);
            return (
              <g key={zone}>
                <rect
                  x={x - 4}
                  y={16}
                  width={zoneWidth - 12}
                  height={layout.height - 44}
                  rx={8}
                  fill={index % 2 ? "#fbf8f1" : "#fffdf8"}
                  stroke="#ece4d8"
                />
                <text
                  x={x + 8}
                  y={42}
                  fill="#312c26"
                  fontSize={12}
                  fontWeight={900}
                >
                  {zone}
                </text>
              </g>
            );
          })}

          {LAYERS.map((item, index) => {
            const y = layerY(index);
            return (
              <g key={item.layer}>
                <rect
                  x={18}
                  y={y - 16}
                  width={128}
                  height={rowHeight - 16}
                  rx={8}
                  fill={index % 2 ? "#f4efe6" : "#f7f4ee"}
                  stroke="#ded5c8"
                />
                <text
                  x={32}
                  y={y + 5}
                  fill="#161411"
                  fontSize={12}
                  fontWeight={900}
                >
                  {item.label}
                </text>
                <text x={32} y={y + 24} fill="#6d675f" fontSize={10}>
                  {item.hint}
                </text>
                <line
                  x1={150}
                  y1={y - 16}
                  x2={layout.width - 28}
                  y2={y - 16}
                  stroke="#e8dfd3"
                />
              </g>
            );
          })}

          {layout.edges.map((edge) => {
            const from = layout.positions.get(edge.fromNodeRef);
            const to = layout.positions.get(edge.toNodeRef);
            if (!from || !to) return null;
            const [visualFrom, visualTo] = visualEdgeEndpoints(from, to);
            const selected =
              selectedRef === edge.edgeRef ||
              selectedRef === edge.fromNodeRef ||
              selectedRef === edge.toNodeRef;
            return (
              <path
                key={edge.edgeRef}
                d={edgePath(visualFrom, visualTo)}
                fill="none"
                stroke={edgeColor(edge, selected)}
                strokeWidth={selected ? 3.2 : 1.4}
                strokeDasharray={
                  edge.evidenceState === "evidenced" ? undefined : "6 5"
                }
                markerEnd="url(#current-state-arrow)"
                opacity={selected ? 0.95 : 0.48}
                onClick={() => onSelect(edge.edgeRef)}
                style={{ cursor: "pointer" }}
              />
            );
          })}

          {layout.nodes.map(({ node, x, y }) => {
            const selected = selectedRef === node.nodeRef;
            const emphasis = advisory.nodeEmphasis.find(
              (item) => item.nodeRef === node.nodeRef,
            )?.emphasis;
            const color = nodeColor(node, overlay);
            return (
              <g
                key={node.nodeRef}
                transform={`translate(${x}, ${y})`}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, ${node.nodeKind}`}
                onClick={() => onSelect(node.nodeRef)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    onSelect(node.nodeRef);
                }}
                style={{ cursor: "pointer", outline: "none" }}
              >
                {emphasis === "warning" || hasLifecycleConcern(node) ? (
                  <rect
                    x={-7}
                    y={-7}
                    width={nodeWidth + 14}
                    height={nodeHeight + 14}
                    rx={10}
                    fill="#f8dfd8"
                  />
                ) : emphasis === "halo" || isCritical(node) ? (
                  <rect
                    x={-7}
                    y={-7}
                    width={nodeWidth + 14}
                    height={nodeHeight + 14}
                    rx={10}
                    fill="#dff0ec"
                  />
                ) : null}
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={7}
                  fill={color.fill}
                  stroke={selected ? "#157f74" : color.stroke}
                  strokeWidth={selected ? 2.6 : 1}
                />
                <text
                  x={10}
                  y={18}
                  fill="#161411"
                  fontSize={11.5}
                  fontWeight={900}
                >
                  {trimLabel(node.shortLabel || node.label, 22)}
                </text>
                <text x={10} y={35} fill="#5d554b" fontSize={9.5}>
                  {trimLabel(nodeSubtitle(node, overlay), 28)}
                </text>
                <text x={10} y={51} fill="#6d675f" fontSize={9}>
                  {trimLabel(nodeMetric(node, overlay), 30)}
                </text>
                <circle
                  cx={nodeWidth - 13}
                  cy={15}
                  r={4.5}
                  fill={evidenceColor(node.evidenceState)}
                />
              </g>
            );
          })}

          {callouts.slice(0, 5).map((callout, index) => {
            const anchor = layout.positions.get(callout.anchorRef);
            const x = anchor
              ? Math.min(layout.width - 310, anchor.x + 96)
              : 165 + index * 290;
            const y = anchor
              ? Math.max(78, anchor.y - 38)
              : layout.height - 124;
            return (
              <g
                key={`${callout.anchorRef}-${index}`}
                onClick={() => onSelect(callout.anchorRef)}
                style={{ cursor: "pointer" }}
              >
                {anchor ? (
                  <path
                    d={`M ${x + 8} ${y + 48} L ${anchor.x + nodeWidth / 2} ${anchor.y + nodeHeight / 2}`}
                    stroke="#a96d16"
                    strokeWidth={1.2}
                    strokeDasharray="4 4"
                  />
                ) : null}
                <rect
                  x={x}
                  y={y}
                  width={282}
                  height={72}
                  rx={8}
                  fill="#fbefd9"
                  stroke="#e0b76e"
                />
                <text
                  x={x + 12}
                  y={y + 20}
                  fill="#161411"
                  fontSize={11}
                  fontWeight={900}
                >
                  {trimLabel(callout.headline, 36)}
                </text>
                <text x={x + 12} y={y + 40} fill="#5d554b" fontSize={9.5}>
                  {trimLabel(callout.body, 46)}
                </text>
                <text
                  x={x + 12}
                  y={y + 58}
                  fill="#8a5f18"
                  fontSize={9}
                  fontWeight={800}
                >
                  {callout.anchorRef}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

const zoneWidth = 194;
const rowHeight = 154;
const nodeWidth = 154;
const nodeHeight = 62;

function buildLayout(
  graph: ArchitectureGraph,
  advisory: ArchitectureAdvisory,
): Layout {
  const selectedNodes = selectExecutiveNodes(graph, advisory);
  const positions = new Map<string, PositionedNode>();
  const cellCounts = new Map<string, number>();
  for (const node of selectedNodes) {
    const zone = zoneForNode(node);
    const layerIndex = LAYERS.findIndex((item) => item.layer === node.layer);
    const zoneIndex = Math.max(0, ZONES.indexOf(zone));
    const cellKey = `${zone}|${node.layer}`;
    const offset = cellCounts.get(cellKey) ?? 0;
    if (offset >= 3) continue;
    cellCounts.set(cellKey, offset + 1);
    positions.set(node.nodeRef, {
      node,
      zone,
      x: zoneX(zoneIndex) + 8,
      y: layerY(layerIndex) + offset * 46,
    });
  }
  const visibleRefs = new Set(selectedNodes.map((node) => node.nodeRef));
  const positionedRefs = new Set(positions.keys());
  const visibleEdges = graph.edges
    .filter(
      (edge) =>
        visibleRefs.has(edge.fromNodeRef) &&
        visibleRefs.has(edge.toNodeRef) &&
        positionedRefs.has(edge.fromNodeRef) &&
        positionedRefs.has(edge.toNodeRef),
    )
    .sort((a, b) => edgeRank(b) - edgeRank(a))
    .slice(0, 70);
  return {
    nodes: Array.from(positions.values()),
    edges: visibleEdges,
    positions,
    width: 1660,
    height: 1230,
  };
}

function selectExecutiveNodes(
  graph: ArchitectureGraph,
  advisory: ArchitectureAdvisory,
): ArchitectureNode[] {
  const requiredRefs = new Set([
    ...advisory.nodeEmphasis.map((item) => item.nodeRef),
    ...normalizeDiagramCallouts(advisory).map((item) => item.anchorRef),
  ]);
  const picked = new Map<string, ArchitectureNode>();
  const byRef = new Map(graph.nodes.map((node) => [node.nodeRef, node]));
  const outgoing = groupEdges(graph.edges, "fromNodeRef");
  const incoming = groupEdges(graph.edges, "toNodeRef");
  const add = (node?: ArchitectureNode) => {
    if (node) picked.set(node.nodeRef, node);
  };
  for (const ref of requiredRefs) add(byRef.get(ref));

  const sourceSeeds = graph.nodes
    .filter((node) => node.layer === "source")
    .sort(
      (a, b) =>
        nodeRank(b, advisory) - nodeRank(a, advisory) ||
        a.label.localeCompare(b.label),
    )
    .slice(0, 9);
  for (const source of sourceSeeds) {
    add(source);
    addBestNeighbor(source.nodeRef, "supports", outgoing, byRef, add);
    const integration = addBestNeighbor(
      source.nodeRef,
      "extracts_from",
      outgoing,
      byRef,
      add,
    );
    const data = integration
      ? addBestNeighbor(integration.nodeRef, "feeds", outgoing, byRef, add)
      : undefined;
    const transform = data
      ? addBestNeighbor(data.nodeRef, "transforms", outgoing, byRef, add)
      : undefined;
    if (transform)
      addBestNeighbor(transform.nodeRef, "publishes_to", outgoing, byRef, add);
    const business = addBestNeighbor(
      source.nodeRef,
      "supports",
      outgoing,
      byRef,
      add,
    );
    if (business)
      addBestNeighbor(business.nodeRef, "supports", outgoing, byRef, add);
    for (const edge of incoming.get(source.nodeRef) ?? []) {
      if (edge.edgeKind === "contracted_through")
        add(byRef.get(edge.fromNodeRef));
    }
    if (picked.size >= 40) break;
  }

  const quotas: Partial<Record<ArchitectureLayer, number>> = {
    business: 6,
    source: 8,
    integration: 3,
    transformation: 3,
    data_platform: 5,
    consumption: 4,
    ai_and_decision: 5,
  };

  for (const layer of LAYERS.map((item) => item.layer)) {
    const already = Array.from(picked.values()).filter(
      (node) => node.layer === layer,
    ).length;
    const need = Math.max(0, (quotas[layer] ?? 0) - already);
    graph.nodes
      .filter((node) => node.layer === layer && !picked.has(node.nodeRef))
      .sort(
        (a, b) =>
          nodeRank(b, advisory) - nodeRank(a, advisory) ||
          a.label.localeCompare(b.label),
      )
      .slice(0, need)
      .forEach(add);
  }

  return Array.from(picked.values())
    .sort((a, b) => {
      const layerDelta =
        LAYERS.findIndex((item) => item.layer === a.layer) -
        LAYERS.findIndex((item) => item.layer === b.layer);
      if (layerDelta) return layerDelta;
      return (
        ZONES.indexOf(zoneForNode(a)) - ZONES.indexOf(zoneForNode(b)) ||
        nodeRank(b, advisory) - nodeRank(a, advisory)
      );
    })
    .slice(0, 40);
}

function groupEdges(
  edges: ArchitectureEdge[],
  key: "fromNodeRef" | "toNodeRef",
) {
  const grouped = new Map<string, ArchitectureEdge[]>();
  for (const edge of edges) {
    const ref = edge[key];
    grouped.set(ref, [...(grouped.get(ref) ?? []), edge]);
  }
  for (const [ref, group] of grouped.entries()) {
    grouped.set(
      ref,
      group.sort((a, b) => edgeRank(b) - edgeRank(a)),
    );
  }
  return grouped;
}

function addBestNeighbor(
  ref: string,
  edgeKind: ArchitectureEdge["edgeKind"],
  edgesByFrom: Map<string, ArchitectureEdge[]>,
  nodesByRef: Map<string, ArchitectureNode>,
  add: (node?: ArchitectureNode) => void,
) {
  const edge = (edgesByFrom.get(ref) ?? []).find(
    (item) => item.edgeKind === edgeKind,
  );
  const node = edge ? nodesByRef.get(edge.toNodeRef) : undefined;
  add(node);
  return node;
}

function nodeRank(node: ArchitectureNode, advisory: ArchitectureAdvisory) {
  const emphasis = advisory.nodeEmphasis.find(
    (item) => item.nodeRef === node.nodeRef,
  );
  return (
    (emphasis ? 80 : 0) +
    (isCritical(node) ? 45 : 0) +
    (hasLifecycleConcern(node) ? 30 : 0) +
    Math.min(22, (node.annualCost ?? 0) / 1_000_000) +
    Math.min(16, node.interfaceCount ?? 0) +
    (node.evidenceState === "evidenced" ? 8 : 0) +
    (node.layer === "ai_and_decision" ? 16 : 0) +
    (node.vendorName ? 6 : 0)
  );
}

function edgeRank(edge: ArchitectureEdge) {
  return (
    (edge.evidenceState === "evidenced" ? 10 : 0) +
    (edge.criticality?.match(/critical|tier 1|high/i) ? 8 : 0) +
    (edge.dataVolume ?? 0) / 1_000_000
  );
}

function zoneForNode(node: ArchitectureNode): Zone {
  const value = [
    node.businessFunction,
    node.businessCapability,
    node.domain,
    node.label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    matches(value, [
      "flight",
      "crew",
      "dispatch",
      "network",
      "schedule",
      "fleet",
      "operations control",
    ])
  )
    return "Flight operations";
  if (matches(value, ["airport", "station", "baggage", "ground"]))
    return "Airport operations";
  if (
    matches(value, [
      "customer",
      "passenger",
      "contact",
      "digital commerce",
      "commerce",
      "marketing",
      "sales",
      "distribution",
      "loyalty",
    ])
  )
    return "Customer and commercial";
  if (
    matches(value, [
      "revenue",
      "pricing",
      "commercial strategy",
      "alliance",
      "cargo",
    ])
  )
    return "Revenue and planning";
  if (
    matches(value, [
      "maintenance",
      "safety",
      "technical operations",
      "regulatory",
    ])
  )
    return "Maintenance and safety";
  if (
    matches(value, [
      "finance",
      "treasury",
      "corporate",
      "legal",
      "procurement",
      "risk",
      "audit",
      "facility",
      "communications",
    ])
  )
    return "Finance and corporate";
  if (matches(value, ["human resources", "hr", "workforce", "collaboration"]))
    return "HR and workforce";
  return "Enterprise technology";
}

function matches(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function normalizeDiagramCallouts(
  advisory: ArchitectureAdvisory,
): Array<{ anchorRef: string; headline: string; body: string }> {
  return (advisory.diagramCallouts as unknown as Array<Record<string, unknown>>)
    .map((item) => {
      const body = String(
        item.body ?? item.businessImplication ?? item.calloutText ?? "",
      );
      return {
        anchorRef: String(item.anchorRef ?? item.targetRef ?? ""),
        headline: String(
          item.headline ?? item.calloutText ?? "Architecture callout",
        ),
        body,
      };
    })
    .filter((item) => item.anchorRef && item.headline);
}

function zoneX(index: number) {
  return 158 + index * zoneWidth;
}

function layerY(index: number) {
  return 94 + index * rowHeight;
}

function edgePath(from: PositionedNode, to: PositionedNode) {
  const x1 = from.x + nodeWidth / 2;
  const y1 = from.y + nodeHeight;
  const x2 = to.x + nodeWidth / 2;
  const y2 = to.y;
  const midY = y1 + (y2 - y1) * 0.55;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

function visualEdgeEndpoints(
  from: PositionedNode,
  to: PositionedNode,
): [PositionedNode, PositionedNode] {
  const fromIndex = LAYERS.findIndex((item) => item.layer === from.node.layer);
  const toIndex = LAYERS.findIndex((item) => item.layer === to.node.layer);
  return fromIndex <= toIndex ? [from, to] : [to, from];
}

function isCritical(node: ArchitectureNode) {
  return Boolean(node.criticality?.match(/critical|tier 1|high/i));
}

function hasLifecycleConcern(node: ArchitectureNode) {
  return Boolean(
    `${node.lifecycleState ?? ""} ${node.modernizationState ?? ""}`.match(
      /retire|replace|pending|disputed|maintain/i,
    ),
  );
}

function nodeColor(node: ArchitectureNode, overlay: string) {
  if (overlay === "annual_cost" && (node.annualCost ?? 0) > 20_000_000)
    return { fill: "#f7e4e1", stroke: "#dc9b95" };
  if (overlay === "annual_cost" && (node.annualCost ?? 0) > 5_000_000)
    return { fill: "#fbefd9", stroke: "#e0b76e" };
  if (overlay === "lifecycle_risk" && hasLifecycleConcern(node))
    return { fill: "#f7e4e1", stroke: "#dc9b95" };
  if (overlay === "criticality" && isCritical(node))
    return { fill: "#fbefd9", stroke: "#e0b76e" };
  if (overlay === "vendor_concentration" && node.vendorName)
    return { fill: "#edf6e9", stroke: "#a8cda0" };
  if (overlay === "evidence_completeness" && node.layer === "ai_and_decision")
    return { fill: "#e7f4ec", stroke: "#9ecbc6" };
  if (node.layer === "business") return { fill: "#f4efe6", stroke: "#d8cec0" };
  if (node.layer === "ai_and_decision")
    return { fill: "#e7f4ec", stroke: "#9ecbc6" };
  if (node.layer === "data_platform" || node.layer === "consumption")
    return { fill: "#eef3f0", stroke: "#b8c7c1" };
  return { fill: "#fffdf8", stroke: "#cfc6b8" };
}

function nodeSubtitle(node: ArchitectureNode, overlay: string) {
  if (overlay === "annual_cost")
    return node.annualCost ? money(node.annualCost) : "cost not supplied";
  if (overlay === "lifecycle_risk")
    return (
      node.modernizationState || node.lifecycleState || "lifecycle not supplied"
    );
  if (overlay === "criticality")
    return node.criticality || "criticality not supplied";
  if (overlay === "vendor_concentration")
    return node.vendorName || "vendor not supplied";
  if (overlay === "evidence_completeness")
    return node.layer === "ai_and_decision"
      ? "usage visible; value proof gated"
      : node.evidenceState;
  return node.nodeKind.replaceAll("_", " ");
}

function nodeMetric(node: ArchitectureNode, overlay: string) {
  if (overlay === "annual_cost")
    return (
      [
        node.userCount ? `${node.userCount.toLocaleString()} users` : "",
        node.interfaceCount ? `${node.interfaceCount} interfaces` : "",
      ]
        .filter(Boolean)
        .join(" | ") || "volumetrics pending"
    );
  if (overlay === "lifecycle_risk")
    return node.lifecycleState || node.modernizationState || "decision pending";
  if (overlay === "criticality")
    return node.incidentVolume
      ? `${node.incidentVolume} incidents`
      : node.interfaceCount
        ? `${node.interfaceCount} interfaces`
        : "risk evidence";
  if (overlay === "vendor_concentration")
    return node.contractRefs?.length
      ? `${node.contractRefs.length} contract refs`
      : node.vendorRef || "contract link pending";
  if (overlay === "evidence_completeness")
    return node.evidenceRefs.length
      ? `${node.evidenceRefs.length} evidence refs`
      : "evidence gap";
  return (
    [
      node.annualCost ? money(node.annualCost) : "",
      node.interfaceCount ? `${node.interfaceCount} interfaces` : "",
      node.userCount ? `${node.userCount.toLocaleString()} users` : "",
    ]
      .filter(Boolean)
      .slice(0, 2)
      .join(" | ") || node.evidenceState
  );
}

function edgeColor(edge: ArchitectureEdge, selected: boolean) {
  if (selected) return "#157f74";
  if (edge.evidenceState === "unresolved") return "#aa3a32";
  if (edge.evidenceState === "inferred") return "#a96d16";
  return "#596660";
}

function evidenceColor(state: string) {
  if (state === "evidenced") return "#157f74";
  if (state === "inferred") return "#a96d16";
  return "#aa3a32";
}

function money(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString()}`;
}

function trimLabel(value: string, max: number) {
  return value.length > max
    ? `${value.slice(0, Math.max(1, max - 1))}...`
    : value;
}

const shellStyle = {
  border: "1px solid #ded5c8",
  borderRadius: 8,
  background: "#fffdf8",
  overflow: "hidden",
} satisfies React.CSSProperties;

const headerStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 18,
  padding: 14,
  borderBottom: "1px solid #ece4d8",
  alignItems: "center",
} satisfies React.CSSProperties;

const headerCopyStyle = {
  margin: "4px 0 0",
  color: "#5d554b",
  fontSize: 12.5,
  lineHeight: 1.45,
} satisfies React.CSSProperties;

const overlayWrapStyle = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  maxWidth: 560,
} satisfies React.CSSProperties;

const overlayButtonStyle = {
  border: "1px solid #cfc6b8",
  borderRadius: 7,
  minHeight: 30,
  padding: "0 9px",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
  letterSpacing: 0,
} satisfies React.CSSProperties;

const flowStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
  gap: 8,
  padding: "10px 14px",
  borderBottom: "1px solid #ece4d8",
  background: "#fbf8f1",
  overflowX: "auto",
} satisfies React.CSSProperties;

const flowStepStyle = {
  minHeight: 34,
  border: "1px solid #ded5c8",
  borderRadius: 7,
  background: "#fffdf8",
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "7px 9px",
  color: "#2f2a24",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
} satisfies React.CSSProperties;

const flowIndexStyle = {
  color: "#1688ff",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 10,
} satisfies React.CSSProperties;

const viewportStyle = {
  overflow: "auto",
  background: "#f7f4ee",
  borderTop: "1px solid #fff",
} satisfies React.CSSProperties;

const svgStyle = {
  display: "block",
  minWidth: 1280,
  width: "100%",
  height: "min(76vh, 940px)",
  background: "#fffdf8",
} satisfies React.CSSProperties;
