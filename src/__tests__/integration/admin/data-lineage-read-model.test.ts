/**
 * DATA1 — data-lineage-read-model integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildDataLineageGraph() shape for apexretail and unknown tenant
 *   - buildDataLineageSummary() root sources and terminal surfaces
 *   - getLineageNode() for known and unknown node ids
 *   - isLive: false invariant on all nodes
 *   - honestNote presence and content
 *   - describeLineageGraph() prose format
 *   - Module hygiene
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildDataLineageGraph,
  buildDataLineageSummary,
  getLineageNode,
  describeLineageGraph,
  type DataLineageGraph,
  type DataLineageSummary,
  type DataLineageNode,
} from '@/lib/admin/data-lineage-read-model';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/admin/data-lineage-read-model.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

// ---------------------------------------------------------------------------
// buildDataLineageGraph — apexretail
// ---------------------------------------------------------------------------

describe('DATA1 — buildDataLineageGraph apexretail shape', () => {
  let graph: DataLineageGraph;

  beforeAll(() => {
    graph = buildDataLineageGraph('apexretail');
  });

  it('totalNodes is 6', () => {
    expect(graph.totalNodes).toBe(6);
  });

  it('edges.length is 5', () => {
    expect(graph.edges.length).toBe(5);
  });

  it('liveNodeCount is 0', () => {
    expect(graph.liveNodeCount).toBe(0);
  });

  it('stubNodeCount equals totalNodes', () => {
    expect(graph.stubNodeCount).toBe(graph.totalNodes);
  });

  it('nodes array length equals totalNodes', () => {
    expect(graph.nodes.length).toBe(graph.totalNodes);
  });

  it('deterministicSeed is true', () => {
    expect(graph.deterministicSeed).toBe(true);
  });

  it('all nodes have isLive: false', () => {
    for (const node of graph.nodes) {
      expect(node.isLive).toBe(false);
    }
  });

  it('all edges have isLive: false', () => {
    for (const edge of graph.edges) {
      expect(edge.isLive).toBe(false);
    }
  });

  it('all nodes have deterministicSeed: true', () => {
    for (const node of graph.nodes) {
      expect(node.deterministicSeed).toBe(true);
    }
  });

  it('all edges have deterministicSeed: true', () => {
    for (const edge of graph.edges) {
      expect(edge.deterministicSeed).toBe(true);
    }
  });

  it('all nodes have a non-empty nodeId', () => {
    for (const node of graph.nodes) {
      expect(typeof node.nodeId).toBe('string');
      expect(node.nodeId.length).toBeGreaterThan(0);
    }
  });

  it('all nodes have a non-empty label', () => {
    for (const node of graph.nodes) {
      expect(typeof node.label).toBe('string');
      expect(node.label.length).toBeGreaterThan(0);
    }
  });

  it('all nodes have a non-empty stubNote', () => {
    for (const node of graph.nodes) {
      expect(typeof node.stubNote).toBe('string');
      expect(node.stubNote.length).toBeGreaterThan(0);
    }
  });

  it('all edges reference node ids that exist in the graph', () => {
    const nodeIds = new Set(graph.nodes.map((n) => n.nodeId));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.fromNodeId)).toBe(true);
      expect(nodeIds.has(edge.toNodeId)).toBe(true);
    }
  });

  it('honestNote is present and mentions "stubs"', () => {
    expect(typeof graph.honestNote).toBe('string');
    expect(graph.honestNote.length).toBeGreaterThan(0);
    expect(graph.honestNote.toLowerCase()).toContain('stub');
  });

  it('all nodes have tenantKey: apexretail', () => {
    for (const node of graph.nodes) {
      expect(node.tenantKey).toBe('apexretail');
    }
  });
});

// ---------------------------------------------------------------------------
// buildDataLineageGraph — unknown tenant
// ---------------------------------------------------------------------------

describe('DATA1 — buildDataLineageGraph unknown tenant', () => {
  it('does not throw for unknown-tenant', () => {
    expect(() => buildDataLineageGraph('unknown-tenant')).not.toThrow();
  });

  it('returns a graph object with deterministicSeed: true', () => {
    const g = buildDataLineageGraph('unknown-tenant');
    expect(g.deterministicSeed).toBe(true);
  });

  it('returns a graph with honestNote present', () => {
    const g = buildDataLineageGraph('unknown-tenant');
    expect(typeof g.honestNote).toBe('string');
    expect(g.honestNote.length).toBeGreaterThan(0);
  });

  it('totalNodes and nodes array are consistent', () => {
    const g = buildDataLineageGraph('unknown-tenant');
    expect(g.totalNodes).toBe(g.nodes.length);
  });
});

// ---------------------------------------------------------------------------
// buildDataLineageSummary — apexretail
// ---------------------------------------------------------------------------

describe('DATA1 — buildDataLineageSummary apexretail', () => {
  let summary: DataLineageSummary;

  beforeAll(() => {
    summary = buildDataLineageSummary('apexretail');
  });

  it('deterministicSeed is true', () => {
    expect(summary.deterministicSeed).toBe(true);
  });

  it('rootSources.length is >= 1', () => {
    expect(summary.rootSources.length).toBeGreaterThanOrEqual(1);
  });

  it('terminalSurfaces.length is >= 1', () => {
    expect(summary.terminalSurfaces.length).toBeGreaterThanOrEqual(1);
  });

  it('root sources are source_system nodes', () => {
    for (const node of summary.rootSources) {
      expect(node.kind).toBe('source_system');
    }
  });

  it('root sources have no inbound edges', () => {
    const inboundIds = new Set(summary.graph.edges.map((e) => e.toNodeId));
    for (const node of summary.rootSources) {
      expect(inboundIds.has(node.nodeId)).toBe(false);
    }
  });

  it('terminal surfaces are analytics_surface nodes', () => {
    for (const node of summary.terminalSurfaces) {
      expect(node.kind).toBe('analytics_surface');
    }
  });

  it('terminal surfaces have no outbound edges', () => {
    const outboundIds = new Set(summary.graph.edges.map((e) => e.fromNodeId));
    for (const node of summary.terminalSurfaces) {
      expect(outboundIds.has(node.nodeId)).toBe(false);
    }
  });

  it('includes lineage-src-erp as a root source', () => {
    const ids = summary.rootSources.map((n) => n.nodeId);
    expect(ids).toContain('lineage-src-erp');
  });

  it('includes lineage-src-spend as a root source', () => {
    const ids = summary.rootSources.map((n) => n.nodeId);
    expect(ids).toContain('lineage-src-spend');
  });

  it('includes lineage-surface-programs as a terminal surface', () => {
    const ids = summary.terminalSurfaces.map((n) => n.nodeId);
    expect(ids).toContain('lineage-surface-programs');
  });
});

// ---------------------------------------------------------------------------
// getLineageNode
// ---------------------------------------------------------------------------

describe('DATA1 — getLineageNode', () => {
  it('returns a node for lineage-src-erp in apexretail', () => {
    const node = getLineageNode('lineage-src-erp', 'apexretail');
    expect(node).not.toBeNull();
  });

  it('lineage-src-erp has kind: source_system', () => {
    const node = getLineageNode('lineage-src-erp', 'apexretail') as DataLineageNode;
    expect(node.kind).toBe('source_system');
  });

  it('lineage-src-erp has isLive: false', () => {
    const node = getLineageNode('lineage-src-erp', 'apexretail') as DataLineageNode;
    expect(node.isLive).toBe(false);
  });

  it('lineage-src-erp has deterministicSeed: true', () => {
    const node = getLineageNode('lineage-src-erp', 'apexretail') as DataLineageNode;
    expect(node.deterministicSeed).toBe(true);
  });

  it('returns null for nonexistent nodeId in apexretail', () => {
    expect(getLineageNode('nonexistent', 'apexretail')).toBeNull();
  });

  it('returns null for valid nodeId in unknown tenant', () => {
    expect(getLineageNode('lineage-src-erp', 'unknown-tenant')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describeLineageGraph
// ---------------------------------------------------------------------------

describe('DATA1 — describeLineageGraph', () => {
  let graph: DataLineageGraph;

  beforeAll(() => {
    graph = buildDataLineageGraph('apexretail');
  });

  it('returns a non-empty string', () => {
    const desc = describeLineageGraph(graph);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('mentions "nodes"', () => {
    expect(describeLineageGraph(graph)).toContain('nodes');
  });

  it('mentions "edges"', () => {
    expect(describeLineageGraph(graph)).toContain('edges');
  });

  it('includes total node count "6"', () => {
    expect(describeLineageGraph(graph)).toContain('6');
  });

  it('includes edge count "5"', () => {
    expect(describeLineageGraph(graph)).toContain('5');
  });

  it('includes "0 live"', () => {
    expect(describeLineageGraph(graph)).toContain('0 live');
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('DATA1 — module hygiene', () => {
  let src: string;

  beforeAll(() => {
    src = readSource();
  });

  it('does not call Date.now()', () => {
    expect(src).not.toContain('Date.now(');
  });

  it('does not call Math.random()', () => {
    expect(src).not.toContain('Math.random(');
  });

  it('does not construct new Date(', () => {
    expect(src).not.toContain('new Date(');
  });

  it('does not call fetch(', () => {
    expect(src).not.toContain('fetch(');
  });

  it('does not import useState', () => {
    expect(src).not.toContain('useState');
  });

  it('does not import useEffect', () => {
    expect(src).not.toContain('useEffect');
  });

  it('does not contain "Coming soon"', () => {
    expect(src).not.toContain('Coming soon');
  });

  it('does not contain "TBD"', () => {
    expect(src).not.toContain('TBD');
  });

  it('does not contain "Lorem ipsum"', () => {
    expect(src).not.toContain('Lorem ipsum');
  });

  it('does not import from supabase', () => {
    expect(src).not.toContain('@supabase/supabase-js');
  });

  it('does not import from @clerk/nextjs', () => {
    expect(src).not.toContain('@clerk/nextjs');
  });
});
