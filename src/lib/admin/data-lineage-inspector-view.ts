// data-lineage-inspector-view.ts — DATA2
//
// Deterministic inspector view model for the Data Lineage UI.
// Layers drill-down info (inbound/outbound edges, upstream/downstream chains)
// on top of DATA1's DataLineageGraph.
//
// No React. No network calls. No model calls. Deterministic seed output only.
//
// DATA2 explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

import {
  buildDataLineageGraph,
  type DataLineageGraph,
  type DataLineageNode,
  type DataLineageEdge,
} from './data-lineage-read-model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LineageInspectorNodeDetail {
  node: DataLineageNode;
  inboundEdges: readonly DataLineageEdge[];
  outboundEdges: readonly DataLineageEdge[];
  inboundCount: number;
  outboundCount: number;
  /** All ancestor nodeIds in BFS order, nearest first. */
  upstreamChain: readonly string[];
  /** All descendant nodeIds in BFS order, nearest first. */
  downstreamChain: readonly string[];
  stubNote: string;
  deterministicSeed: true;
}

export interface LineageInspectorView {
  selectedNodeId: string | null;
  detail: LineageInspectorNodeDetail | null;
  graph: DataLineageGraph;
  totalNodes: number;
  totalEdges: number;
  honestNote: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal BFS helpers
// ---------------------------------------------------------------------------

/**
 * Walk the graph upstream (i.e. follow edges backwards: toNodeId → fromNodeId)
 * from a starting nodeId and return all ancestor nodeIds in BFS order.
 * The starting node itself is NOT included.
 */
function buildUpstreamChain(
  startNodeId: string,
  edges: readonly DataLineageEdge[],
): readonly string[] {
  // Build reverse adjacency: toNodeId → fromNodeIds
  const reverseAdj = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = reverseAdj.get(edge.toNodeId);
    if (existing !== undefined) {
      existing.push(edge.fromNodeId);
    } else {
      reverseAdj.set(edge.toNodeId, [edge.fromNodeId]);
    }
  }

  const visited = new Set<string>();
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const parents = reverseAdj.get(current) ?? [];
    for (const parentId of parents) {
      if (!visited.has(parentId)) {
        visited.add(parentId);
        result.push(parentId);
        queue.push(parentId);
      }
    }
  }

  return result;
}

/**
 * Walk the graph downstream (i.e. follow edges forwards: fromNodeId → toNodeId)
 * from a starting nodeId and return all descendant nodeIds in BFS order.
 * The starting node itself is NOT included.
 */
function buildDownstreamChain(
  startNodeId: string,
  edges: readonly DataLineageEdge[],
): readonly string[] {
  // Build forward adjacency: fromNodeId → toNodeIds
  const forwardAdj = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = forwardAdj.get(edge.fromNodeId);
    if (existing !== undefined) {
      existing.push(edge.toNodeId);
    } else {
      forwardAdj.set(edge.fromNodeId, [edge.toNodeId]);
    }
  }

  const visited = new Set<string>();
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = forwardAdj.get(current) ?? [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        result.push(childId);
        queue.push(childId);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function findNodeById(
  graph: DataLineageGraph,
  nodeId: string,
): DataLineageNode | null {
  for (const node of graph.nodes) {
    if (node.nodeId === nodeId) return node;
  }
  return null;
}

function buildNodeDetail(
  node: DataLineageNode,
  graph: DataLineageGraph,
): LineageInspectorNodeDetail {
  const inboundEdges = graph.edges.filter((e) => e.toNodeId === node.nodeId);
  const outboundEdges = graph.edges.filter((e) => e.fromNodeId === node.nodeId);
  const upstreamChain = buildUpstreamChain(node.nodeId, graph.edges);
  const downstreamChain = buildDownstreamChain(node.nodeId, graph.edges);

  return {
    node,
    inboundEdges,
    outboundEdges,
    inboundCount: inboundEdges.length,
    outboundCount: outboundEdges.length,
    upstreamChain,
    downstreamChain,
    stubNote: node.stubNote,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the LineageInspectorNodeDetail for a single node in the tenant's
 * lineage graph, or null if the nodeId is not found.
 */
export function getLineageNodeDetail(
  tenantKey: string,
  nodeId: string,
): LineageInspectorNodeDetail | null {
  const graph = buildDataLineageGraph(tenantKey);
  const node = findNodeById(graph, nodeId);
  if (node === null) return null;
  return buildNodeDetail(node, graph);
}

/**
 * Builds the LineageInspectorView for a tenant, optionally selecting a node
 * for drill-down. If selectedNodeId is omitted or null, detail is null.
 * If selectedNodeId is provided but not found, detail is null.
 */
export function buildLineageInspectorView(
  tenantKey: string,
  selectedNodeId?: string,
): LineageInspectorView {
  const graph = buildDataLineageGraph(tenantKey);

  if (selectedNodeId === undefined || selectedNodeId === null) {
    return {
      selectedNodeId: null,
      detail: null,
      graph,
      totalNodes: graph.totalNodes,
      totalEdges: graph.edges.length,
      honestNote: graph.honestNote,
      deterministicSeed: true,
    };
  }

  const node = findNodeById(graph, selectedNodeId);
  const detail = node !== null ? buildNodeDetail(node, graph) : null;

  return {
    selectedNodeId,
    detail,
    graph,
    totalNodes: graph.totalNodes,
    totalEdges: graph.edges.length,
    honestNote: graph.honestNote,
    deterministicSeed: true,
  };
}

/**
 * Returns a concise prose description of a LineageInspectorNodeDetail.
 * Example: "ERP / Finance · 0 inbound · 1 outbound"
 */
export function describeNodeDetail(detail: LineageInspectorNodeDetail): string {
  return (
    detail.node.label +
    ' · ' +
    detail.inboundCount +
    ' inbound · ' +
    detail.outboundCount +
    ' outbound'
  );
}
