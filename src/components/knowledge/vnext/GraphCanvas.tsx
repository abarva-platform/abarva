"use client";

/**
 * Relationship graph — a lightweight SVG renderer (no React Flow / heavy dep).
 * Deliberately a *renderer abstraction*: the data + interaction contract
 * (nodes, edges, selection, evidence) does not depend on this SVG layout, so a
 * heavier library could replace it later behind the same props.
 *
 * DEPENDENCY NOTE: an SVG renderer keeps bundle size flat and is fully
 * keyboard-accessible; React Flow (~50kb+ gzip) was not adopted because the
 * one/two-hop, evidence-per-edge requirement does not need pan/zoom/minimap and
 * the accessibility story is simpler with native SVG + an alternate table.
 *
 * Not a static diagram: nodes/edges are selectable & focusable, the graph and
 * the alternate table stay in sync, caps/aggregation are surfaced honestly, and
 * empty graphs stay empty (no speculative relationships).
 */

import { useMemo } from "react";
import type {
  RelationshipEdgeV1,
  RelationshipNodeV1,
  RelationshipProjectionV1,
} from "@/lib/knowledge/consumption-contracts";

export interface GraphSelection {
  kind: "node" | "edge";
  id: string;
}

export function GraphCanvas({
  projection,
  selection,
  onSelect,
}: {
  projection: RelationshipProjectionV1;
  selection: GraphSelection | null;
  onSelect: (sel: GraphSelection) => void;
}) {
  const W = 640;
  const H = 380;
  const positions = useMemo(() => layout(projection.nodes, W, H), [projection.nodes]);

  if (projection.nodes.length === 0) {
    return (
      <div className="kv-empty">
        No accepted relationships are available for this selection. The graph is
        intentionally left empty rather than filled with speculative links.
      </div>
    );
  }

  return (
    <div className="kv-graph-wrap">
      <svg
        className="kv-graph-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label="Relationship graph. A synchronized data table follows below for non-visual access."
      >
        {projection.edges.map((e) => {
          const a = positions[e.fromNodeId];
          const b = positions[e.toNodeId];
          if (!a || !b) return null;
          const selected = selection?.kind === "edge" && selection.id === e.edgeId;
          return (
            <line
              key={e.edgeId}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className={e.authorityState === "candidate" ? "kv-edge-candidate" : "kv-edge-accepted"}
              strokeWidth={selected ? 3 : undefined}
              onClick={() => onSelect({ kind: "edge", id: e.edgeId })}
              style={{ cursor: "pointer" }}
            >
              <title>{edgeTitle(e)}</title>
            </line>
          );
        })}
        {projection.nodes.map((n) => {
          const p = positions[n.nodeId];
          if (!p) return null;
          const selected = selection?.kind === "node" && selection.id === n.nodeId;
          return (
            <g
              key={n.nodeId}
              className="kv-graph-node"
              tabIndex={0}
              role="button"
              aria-label={`${n.label}, ${n.nodeType}, ${n.authorityState}${n.hop === 0 ? ", focal" : `, hop ${n.hop}`}`}
              onClick={() => onSelect({ kind: "node", id: n.nodeId })}
              onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onSelect({ kind: "node", id: n.nodeId }); } }}
            >
              <circle
                cx={p.x} cy={p.y}
                r={n.hop === 0 ? 15 : 10}
                fill={n.hop === 0 ? "#0b4a91" : n.authorityState === "candidate" ? "#efeaf9" : "#eef3fb"}
                stroke={selected ? "#0066cc" : "#7a8aa0"}
                strokeWidth={selected ? 3 : 1.4}
                strokeDasharray={n.authorityState === "candidate" ? "4 3" : undefined}
              />
              <text x={p.x} y={p.y + (n.hop === 0 ? 28 : 22)} textAnchor="middle" fontSize="10" fill="#333">
                {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {(projection.truncated || projection.aggregationApplied) && (
        <p style={{ fontSize: 12, color: "var(--kv-warn)", padding: "0 12px 8px" }} role="status">
          {projection.truncated
            ? `Showing a capped view — ${projection.omittedNodeCount} node(s) beyond the current hop/cap are not shown.`
            : "Some nodes are aggregated."}
        </p>
      )}

      {/* Accessible synchronized alternate table */}
      <details style={{ padding: "0 12px 12px" }}>
        <summary style={{ cursor: "pointer", fontSize: 12 }}>Relationships as a table</summary>
        <table className="kv-table" aria-label="Relationships as a data table">
          <thead>
            <tr><th>From</th><th>Relationship</th><th>To</th><th>Authority</th></tr>
          </thead>
          <tbody>
            {projection.edges.map((e) => (
              <tr key={e.edgeId}>
                <td>{nodeLabel(projection.nodes, e.fromNodeId)}</td>
                <td>
                  <button type="button" className="kv-row-btn" onClick={() => onSelect({ kind: "edge", id: e.edgeId })}>
                    {e.relationshipType}
                  </button>
                </td>
                <td>{nodeLabel(projection.nodes, e.toNodeId)}</td>
                <td>{e.authorityState}{e.authorityState === "candidate" ? " (dashed)" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function layout(nodes: RelationshipNodeV1[], W: number, H: number): Record<string, { x: number; y: number }> {
  const cx = W / 2;
  const cy = H / 2;
  const byHop: Record<number, RelationshipNodeV1[]> = { 0: [], 1: [], 2: [] };
  nodes.forEach((n) => byHop[n.hop].push(n));
  const pos: Record<string, { x: number; y: number }> = {};
  byHop[0].forEach((n) => { pos[n.nodeId] = { x: cx, y: cy }; });
  ring(byHop[1], 120, cx, cy, pos);
  ring(byHop[2], 175, cx, cy, pos);
  return pos;
}

function ring(nodes: RelationshipNodeV1[], radius: number, cx: number, cy: number, pos: Record<string, { x: number; y: number }>) {
  const n = nodes.length;
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    pos[node.nodeId] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

function nodeLabel(nodes: RelationshipNodeV1[], id: string): string {
  return nodes.find((n) => n.nodeId === id)?.label ?? id;
}
function edgeTitle(e: RelationshipEdgeV1): string {
  return `${e.relationshipType} (${e.authorityState})`;
}
