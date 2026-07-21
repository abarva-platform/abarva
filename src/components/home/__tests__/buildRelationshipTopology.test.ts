import { Position } from "@xyflow/react";

import { buildRelationshipTopology } from "../HomeKnowledgeDesignContractSurface";
import type { HomeRelationshipEdge } from "@/lib/home/derive-relationship-edges";

function edge(
  from: string,
  to: string,
  relationship = "connects to",
): HomeRelationshipEdge {
  return {
    from,
    fromType: "entity",
    relationship,
    to,
    sourceDimension: "test",
    sourceField: "test",
  };
}

describe("buildRelationshipTopology", () => {
  it("returns empty for no edges", () => {
    const result = buildRelationshipTopology([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("every rendered source node has at least one rendered edge (regression: the independently-top-N-per-side bug produced visible nodes with zero visible edges)", () => {
    // Reproduces the exact live bug: many high-degree "from" nodes whose
    // targets are each LOW-degree (unique per source), plus a handful of
    // low-degree "from" nodes that all point to the same few HIGH-degree
    // "to" nodes. Independently ranking each side by degree picks the
    // high-degree sources and the high-degree targets -- sets that share
    // no real edges, producing a fully edgeless graph.
    const edges: HomeRelationshipEdge[] = [];
    // 8 high out-degree sources, each fanning out to 5 unique low-degree targets.
    for (let s = 0; s < 8; s++) {
      for (let t = 0; t < 5; t++) {
        edges.push(edge(`HighDegreeSource${s}`, `UniqueTarget${s}-${t}`));
      }
    }
    // 20 low out-degree sources (1 edge each) all pointing at the same 3
    // high in-degree targets -- these targets would win a pure
    // in-degree ranking, but none of their sources are high out-degree.
    for (let s = 0; s < 20; s++) {
      edges.push(edge(`LowDegreeSource${s}`, `HighDegreeTarget${s % 3}`));
    }

    const result = buildRelationshipTopology(edges);
    expect(result.edges.length).toBeGreaterThan(0);

    const sourceNodeIds = result.nodes
      .filter((node) => node.id.startsWith("source-"))
      .map((node) => node.id);
    const targetNodeIds = new Set(
      result.nodes
        .filter((node) => node.id.startsWith("target-"))
        .map((node) => node.id),
    );
    expect(sourceNodeIds.length).toBeGreaterThan(0);

    for (const sourceId of sourceNodeIds) {
      const hasVisibleEdge = result.edges.some(
        (flowEdge) =>
          flowEdge.source === sourceId && targetNodeIds.has(flowEdge.target),
      );
      expect(hasVisibleEdge).toBe(true);
    }
  });

  it("every rendered target node has at least one rendered edge", () => {
    const edges: HomeRelationshipEdge[] = [];
    for (let s = 0; s < 8; s++) {
      for (let t = 0; t < 5; t++) {
        edges.push(edge(`Source${s}`, `Target${s}-${t}`));
      }
    }
    const result = buildRelationshipTopology(edges);
    const sourceNodeIds = new Set(
      result.nodes
        .filter((node) => node.id.startsWith("source-"))
        .map((node) => node.id),
    );
    const targetNodeIds = result.nodes
      .filter((node) => node.id.startsWith("target-"))
      .map((node) => node.id);

    for (const targetId of targetNodeIds) {
      const hasVisibleEdge = result.edges.some(
        (flowEdge) =>
          flowEdge.target === targetId && sourceNodeIds.has(flowEdge.source),
      );
      expect(hasVisibleEdge).toBe(true);
    }
  });

  it("reports honest subset counts when the graph is capped", () => {
    const edges: HomeRelationshipEdge[] = [];
    for (let s = 0; s < 30; s++) {
      edges.push(edge(`Source${s}`, `Target${s}`));
    }
    const result = buildRelationshipTopology(edges);
    expect(result.totalSources).toBe(30);
    expect(result.sourceCount).toBeLessThan(result.totalSources);
  });

  it("assigns every node a computed (non-zero-only) position from dagre layout", () => {
    const edges: HomeRelationshipEdge[] = [
      edge("A", "X"),
      edge("A", "Y"),
      edge("B", "X"),
    ];
    const result = buildRelationshipTopology(edges);
    const positions = result.nodes.map((node) => node.position);
    // Not every node should be stacked at the exact same coordinate.
    const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  it("sets sourcePosition/targetPosition matching the LR dagre layout on every node (regression: omitting this silently drops every edge -- React Flow's default handles point Top/Bottom, for vertical flows, confirmed live: nodes and the marker def rendered, zero edge paths)", () => {
    const edges: HomeRelationshipEdge[] = [edge("A", "X")];
    const result = buildRelationshipTopology(edges);
    expect(result.nodes.length).toBeGreaterThan(0);
    for (const node of result.nodes) {
      expect(node.sourcePosition).toBe(Position.Right);
      expect(node.targetPosition).toBe(Position.Left);
    }
  });

  it("never uses the raw entity name as a node/edge id (regression: the derived relationship graph's 'to' values can be full executive-interview-quote sentences, hundreds of characters with slashes/colons/commas/periods -- using those verbatim as React Flow ids broke every internal DOM lookup React Flow uses to resolve an edge's endpoint handle position. Confirmed live via onInit: React Flow's internal store held the correct node/edge COUNT, but rendered zero edge paths, because the ids themselves were unusable)", () => {
    const longQuoteTarget =
      'CEO / Enterprise Strategy says: "Unified clinical + claims lakehouse is promising, but strategy is not decision-grade until Epic Clarity evidence closes." The team wants Nexus to preserve this as context, not produce sourcing-event outputs yet.';
    const edges: HomeRelationshipEdge[] = [
      edge(
        "Unified clinical + claims lakehouse relationship candidate",
        longQuoteTarget,
      ),
    ];
    const result = buildRelationshipTopology(edges);
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
    for (const node of result.nodes) {
      // ids stay short and use only characters safe for DOM/CSS lookups.
      expect(node.id.length).toBeLessThan(20);
      expect(node.id).toMatch(/^(source|target)-\d+$/);
      // the real name lives in data.label/data.fullName, not the id.
      expect(node.id).not.toContain(longQuoteTarget);
    }
    const flowEdge = result.edges[0];
    expect(flowEdge.source.length).toBeLessThan(20);
    expect(flowEdge.target.length).toBeLessThan(20);
    expect(flowEdge.id.length).toBeLessThan(40);
  });
});
