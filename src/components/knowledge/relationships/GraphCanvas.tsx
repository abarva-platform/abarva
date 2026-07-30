"use client";

import { useMemo } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import type {
  RelationshipEdgeDetailRow,
  RelationshipNodeRow,
} from "@/lib/knowledge/providers/read-models";

/**
 * Focused-projection graph canvas per the Graph Binding Contract:
 *  - a node renders as an ordinary accepted node ONLY if node_type resolves
 *    to a real canonical object type AND endpoint_catalog_backed=true
 *    (Section 1). Anything else renders, if shown at all, visually distinct
 *    -- dashed amber outline, "unverified" label -- never identical to an
 *    accepted node.
 *  - an edge renders solid-and-clickable only if authority_state=accepted,
 *    both endpoints are catalog-backed, and relationship_type_ref resolves
 *    to a ratified verb (Section 2). An unresolved type renders exactly as
 *    "relationship not typed", never an invented-sounding verb (SD-08's
 *    failure mode this whole contract exists to prevent).
 *  - candidate/proposed content is excluded unless the caller has explicitly
 *    toggled "Show candidates" -- never shown by default (Section 5).
 */
export function GraphCanvas({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
}: {
  readonly nodes: readonly RelationshipNodeRow[];
  readonly edges: readonly RelationshipEdgeDetailRow[];
  readonly onNodeClick: (node: RelationshipNodeRow) => void;
  readonly onEdgeClick: (edge: RelationshipEdgeDetailRow) => void;
}) {
  const { showCandidateRelationships } = useKnowledgeApp();

  const visibleNodes = useMemo(
    () =>
      nodes.filter(
        (n) => showCandidateRelationships || n.authorityState !== "candidate",
      ),
    [nodes, showCandidateRelationships],
  );
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => showCandidateRelationships || e.authorityState !== "candidate",
      ),
    [edges, showCandidateRelationships],
  );

  const positions = useMemo(() => layoutRadial(visibleNodes), [visibleNodes]);

  if (visibleNodes.length === 0) return null;

  const width = 760;
  const height = 460;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-md border border-[rgba(10,10,11,0.1)] bg-white"
      role="img"
      aria-label="Relationship graph"
    >
      <g>
        {visibleEdges.map((edge) => {
          const a = positions.get(edge.fromNodeId);
          const b = positions.get(edge.toNodeId);
          if (!a || !b) return null;
          const untrusted =
            edge.authorityState !== "accepted" ||
            !edge.endpointCatalogBacked ||
            !edge.relationshipTypeResolved;
          const stroke =
            edge.isGap || edge.isConflict
              ? "#a32d2d"
              : untrusted
                ? "#ba7517"
                : "rgba(10,10,11,0.32)";
          const dash = untrusted ? "5 4" : undefined;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          return (
            <g
              key={edge.edgeId}
              className="cursor-pointer"
              onClick={() => onEdgeClick(edge)}
            >
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke}
                strokeWidth={edge.isConflict ? 2 : 1.4}
                strokeDasharray={dash}
              />
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#888780"
              >
                {edge.relationshipTypeResolved
                  ? edge.relationshipTypeRef
                  : "relationship not typed"}
              </text>
            </g>
          );
        })}
      </g>
      <g>
        {visibleNodes.map((node) => {
          const pos = positions.get(node.nodeId);
          if (!pos) return null;
          const untrusted =
            !node.canonicalObjectTypeResolved || !node.endpointCatalogBacked;
          const fill =
            node.isGap || node.isConflict
              ? "#fceded"
              : untrusted
                ? "#fff7ec"
                : "#ffffff";
          const stroke =
            node.isGap || node.isConflict
              ? "#a32d2d"
              : untrusted
                ? "#ba7517"
                : "rgba(10,10,11,0.24)";
          return (
            <g
              key={node.nodeId}
              className="cursor-pointer"
              onClick={() => onNodeClick(node)}
            >
              <rect
                x={pos.x - 60}
                y={pos.y - 18}
                width={120}
                height={36}
                rx={6}
                fill={fill}
                stroke={stroke}
                strokeDasharray={untrusted ? "5 4" : undefined}
                strokeWidth={1.4}
              />
              <text
                x={pos.x}
                y={pos.y - 2}
                textAnchor="middle"
                fontSize={11}
                fill="#2c2c2a"
              >
                {truncate(node.label, 20)}
              </text>
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fontSize={9}
                fill="#888780"
              >
                {untrusted ? `${node.nodeType} (unverified)` : node.nodeType}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}...` : s;
}

function layoutRadial(
  nodes: readonly RelationshipNodeRow[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 380;
  const centerY = 230;
  const focal =
    nodes.find((n) => n.nodeType && n.authorityState === "accepted") ??
    nodes[0];
  if (!focal) return positions;
  positions.set(focal.nodeId, { x: centerX, y: centerY });
  const others = nodes.filter((n) => n.nodeId !== focal.nodeId);
  const radius = 170;
  others.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
    positions.set(node.nodeId, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });
  return positions;
}
