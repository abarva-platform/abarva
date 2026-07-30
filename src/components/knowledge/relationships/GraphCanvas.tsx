"use client";

import { useMemo } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import { readinessPresentation } from "../state/gate-utils";
import {
  deriveReadiness,
  type ComponentReadinessState,
} from "@/lib/knowledge/view-model";
import type {
  RelationshipEdgeV1,
  RelationshipNodeV1,
} from "@/lib/knowledge/consumption-contracts";

type ReadyEdge = RelationshipEdgeV1 & { readiness: ComponentReadinessState };

/**
 * Focused-projection graph canvas. The real RelationshipNodeV1/RelationshipEdgeV1
 * contract has no `canonicalObjectTypeResolved`/`endpointCatalogBacked`/`isGap`/
 * `isConflict` booleans the original prototype's duplicate provider invented --
 * per VIEW_MODEL_ASSEMBLER_INTERFACES.md §1, "solid vs dashed" collapses to a
 * single real signal: `readiness === "ENABLED_AND_PROVEN"` (solid) vs
 * everything else (dashed), already computed per-edge by the assembler. Nodes
 * carry no assembler-computed readiness of their own (the assembler's
 * RelationshipNeighborhoodViewModel does not attach one), so this component
 * derives an equivalent presentation locally from the node's own real
 * authorityState/availabilityState, via the same deriveReadiness() function --
 * never a fabricated trust signal.
 *
 * Candidate/proposed content is excluded unless the caller has explicitly
 * toggled "Show candidates" -- never shown by default.
 */
export function GraphCanvas({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
}: {
  readonly nodes: readonly RelationshipNodeV1[];
  readonly edges: readonly ReadyEdge[];
  readonly onNodeClick: (node: RelationshipNodeV1) => void;
  readonly onEdgeClick: (edge: ReadyEdge) => void;
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
          const solid = edge.readiness === "ENABLED_AND_PROVEN";
          const tone = readinessPresentation(edge.readiness).tone;
          const stroke =
            tone === "gap" || tone === "blocked" || tone === "restricted"
              ? "#a32d2d"
              : !solid
                ? "#ba7517"
                : "rgba(10,10,11,0.32)";
          const dash = solid ? undefined : "5 4";
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
                strokeWidth={tone === "gap" ? 2 : 1.4}
                strokeDasharray={dash}
              />
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#888780"
              >
                {edge.relationshipType}
              </text>
            </g>
          );
        })}
      </g>
      <g>
        {visibleNodes.map((node) => {
          const pos = positions.get(node.nodeId);
          if (!pos) return null;
          const nodeReadiness = deriveReadiness({
            availabilityState: node.availabilityState,
            authorityState: node.authorityState,
            freshnessState: "fresh",
            warnings: [],
            proven: false,
          });
          const tone = readinessPresentation(nodeReadiness).tone;
          const solid = nodeReadiness === "ENABLED_AND_PROVEN";
          const fill =
            tone === "gap" || tone === "blocked" || tone === "restricted"
              ? "#fceded"
              : !solid
                ? "#fff7ec"
                : "#ffffff";
          const stroke =
            tone === "gap" || tone === "blocked" || tone === "restricted"
              ? "#a32d2d"
              : !solid
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
                strokeDasharray={solid ? undefined : "5 4"}
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
                {solid ? node.nodeType : `${node.nodeType} (unverified)`}
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
  nodes: readonly RelationshipNodeV1[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = 380;
  const centerY = 230;
  const focal =
    nodes.find((n) => n.hop === 0) ??
    nodes.find((n) => n.authorityState === "accepted") ??
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
