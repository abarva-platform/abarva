// data-lineage-read-model.ts — DATA1
//
// Deterministic read model for data lineage graphs.
// No React. No network calls. No model calls. Deterministic seed output only.
// All lineage nodes are stubs — no live ingestion pipelines are wired.
//
// DATA1 explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataLineageNodeKind =
  | 'source_system'
  | 'ingestion_pipeline'
  | 'transformation'
  | 'dataset_domain'
  | 'analytics_surface';

export type DataLineageEdgeKind =
  | 'feeds'
  | 'transforms'
  | 'materializes'
  | 'surfaces';

export interface DataLineageNode {
  nodeId: string;
  label: string;
  kind: DataLineageNodeKind;
  tenantKey: string;
  isLive: boolean;
  stubNote: string;
  deterministicSeed: true;
}

export interface DataLineageEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  edgeKind: DataLineageEdgeKind;
  lagDescription: string;
  isLive: boolean;
  deterministicSeed: true;
}

export interface DataLineageGraph {
  nodes: readonly DataLineageNode[];
  edges: readonly DataLineageEdge[];
  totalNodes: number;
  liveNodeCount: number;
  stubNodeCount: number;
  honestNote: string;
  deterministicSeed: true;
}

export interface DataLineageSummary {
  graph: DataLineageGraph;
  rootSources: readonly DataLineageNode[];
  terminalSurfaces: readonly DataLineageNode[];
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Seed data — Apex Retail tenant
// ---------------------------------------------------------------------------

const APEX_RETAIL_NODES: readonly DataLineageNode[] = [
  {
    nodeId: 'lineage-src-erp',
    label: 'ERP / Finance',
    kind: 'source_system',
    tenantKey: 'apexretail',
    isLive: false,
    stubNote: 'ERP connector not yet wired. Stub node only.',
    deterministicSeed: true,
  },
  {
    nodeId: 'lineage-src-spend',
    label: 'Spend Analytics Platform',
    kind: 'source_system',
    tenantKey: 'apexretail',
    isLive: false,
    stubNote: 'Spend analytics connector not yet wired. Stub node only.',
    deterministicSeed: true,
  },
  {
    nodeId: 'lineage-ingest-cdp',
    label: 'CDP Ingestion Pipeline',
    kind: 'ingestion_pipeline',
    tenantKey: 'apexretail',
    isLive: false,
    stubNote: 'CDP ingestion pipeline not yet deployed. Stub node only.',
    deterministicSeed: true,
  },
  {
    nodeId: 'lineage-transform-unified',
    label: 'Unified Customer View Transform',
    kind: 'transformation',
    tenantKey: 'apexretail',
    isLive: false,
    stubNote: 'Transformation runtime not yet wired. Stub node only.',
    deterministicSeed: true,
  },
  {
    nodeId: 'lineage-domain-customer',
    label: 'Customer Domain',
    kind: 'dataset_domain',
    tenantKey: 'apexretail',
    isLive: false,
    stubNote: 'Dataset domain not yet materialized. Stub node only.',
    deterministicSeed: true,
  },
  {
    nodeId: 'lineage-surface-programs',
    label: 'Programs Intelligence Surface',
    kind: 'analytics_surface',
    tenantKey: 'apexretail',
    isLive: false,
    stubNote: 'Analytics surface reads from stub domain. No live data.',
    deterministicSeed: true,
  },
];

const APEX_RETAIL_EDGES: readonly DataLineageEdge[] = [
  {
    edgeId: 'edge-erp-to-ingest',
    fromNodeId: 'lineage-src-erp',
    toNodeId: 'lineage-ingest-cdp',
    edgeKind: 'feeds',
    lagDescription: 'batch nightly',
    isLive: false,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-spend-to-ingest',
    fromNodeId: 'lineage-src-spend',
    toNodeId: 'lineage-ingest-cdp',
    edgeKind: 'feeds',
    lagDescription: 'batch daily',
    isLive: false,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-ingest-to-transform',
    fromNodeId: 'lineage-ingest-cdp',
    toNodeId: 'lineage-transform-unified',
    edgeKind: 'transforms',
    lagDescription: 'streaming near-real-time',
    isLive: false,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-transform-to-domain',
    fromNodeId: 'lineage-transform-unified',
    toNodeId: 'lineage-domain-customer',
    edgeKind: 'materializes',
    lagDescription: 'hourly',
    isLive: false,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-domain-to-surface',
    fromNodeId: 'lineage-domain-customer',
    toNodeId: 'lineage-surface-programs',
    edgeKind: 'surfaces',
    lagDescription: 'on-demand read',
    isLive: false,
    deterministicSeed: true,
  },
];

const HONEST_NOTE =
  'All lineage nodes are deterministic stubs. Live ingestion pipelines and ' +
  'transformation runtimes are not yet wired.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTenantNodes(tenantKey: string): readonly DataLineageNode[] {
  if (tenantKey === 'apexretail') return APEX_RETAIL_NODES;
  return [];
}

function getTenantEdges(tenantKey: string): readonly DataLineageEdge[] {
  if (tenantKey === 'apexretail') return APEX_RETAIL_EDGES;
  return [];
}

/**
 * Returns the set of node ids that have at least one inbound edge.
 */
function getNodeIdsWithInbound(edges: readonly DataLineageEdge[]): Set<string> {
  const withInbound = new Set<string>();
  for (const edge of edges) {
    withInbound.add(edge.toNodeId);
  }
  return withInbound;
}

/**
 * Returns the set of node ids that have at least one outbound edge.
 */
function getNodeIdsWithOutbound(
  edges: readonly DataLineageEdge[],
): Set<string> {
  const withOutbound = new Set<string>();
  for (const edge of edges) {
    withOutbound.add(edge.fromNodeId);
  }
  return withOutbound;
}

function getTenantLabel(tenantKey: string): string {
  if (tenantKey === 'apexretail') return 'Apex Retail';
  return tenantKey;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the DataLineageGraph for a given tenant.
 */
export function buildDataLineageGraph(tenantKey: string): DataLineageGraph {
  const nodes = getTenantNodes(tenantKey);
  const edges = getTenantEdges(tenantKey);
  const liveNodeCount = nodes.filter((n) => n.isLive).length;
  return {
    nodes,
    edges,
    totalNodes: nodes.length,
    liveNodeCount,
    stubNodeCount: nodes.length - liveNodeCount,
    honestNote: HONEST_NOTE,
    deterministicSeed: true,
  };
}

/**
 * Builds the DataLineageSummary for a given tenant, identifying root sources
 * (nodes with no inbound edges) and terminal surfaces (nodes with no outbound
 * edges).
 */
export function buildDataLineageSummary(tenantKey: string): DataLineageSummary {
  const graph = buildDataLineageGraph(tenantKey);
  const withInbound = getNodeIdsWithInbound(graph.edges);
  const withOutbound = getNodeIdsWithOutbound(graph.edges);
  const rootSources = graph.nodes.filter((n) => !withInbound.has(n.nodeId));
  const terminalSurfaces = graph.nodes.filter(
    (n) => !withOutbound.has(n.nodeId),
  );
  return {
    graph,
    rootSources,
    terminalSurfaces,
    deterministicSeed: true,
  };
}

/**
 * Returns a single DataLineageNode by nodeId within a tenant, or null if not
 * found.
 */
export function getLineageNode(
  nodeId: string,
  tenantKey: string,
): DataLineageNode | null {
  const nodes = getTenantNodes(tenantKey);
  for (const node of nodes) {
    if (node.nodeId === nodeId) return node;
  }
  return null;
}

/**
 * Returns a concise prose description of a DataLineageGraph.
 * Example: "6 nodes (0 live) · 5 edges · Apex Retail"
 */
export function describeLineageGraph(graph: DataLineageGraph): string {
  // Derive tenant label from node tenantKey; fall back to generic label.
  const tenantKey =
    graph.nodes.length > 0 ? graph.nodes[0].tenantKey : 'unknown';
  const tenantLabel = getTenantLabel(tenantKey);
  return (
    graph.totalNodes +
    ' nodes (' +
    graph.liveNodeCount +
    ' live) · ' +
    graph.edges.length +
    ' edges · ' +
    tenantLabel
  );
}
