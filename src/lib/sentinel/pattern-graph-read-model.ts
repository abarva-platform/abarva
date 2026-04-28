// pattern-graph-read-model.ts — I5
//
// Deterministic graph read model over the PAT1 pattern registry.
// Represents how intelligence patterns relate to one another: implies,
// contradicts, co_occurs, escalates_to.
//
// No React. No network calls. No model calls. Deterministic seed output only.
//
// I5 explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/atlas/,
//     src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

import {
  buildPatternRegistryView,
  type PatternRegistryEntry,
} from './pattern-registry-lifecycle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PatternGraphEdgeKind =
  | 'implies'
  | 'contradicts'
  | 'co_occurs'
  | 'escalates_to';

export interface PatternGraphEdge {
  edgeId: string;
  fromPatternKey: string;
  toPatternKey: string;
  edgeKind: PatternGraphEdgeKind;
  /** Weight in range 0–1 representing signal confidence on this relationship. */
  weight: number;
  deterministicSeed: true;
}

export interface PatternGraphNode {
  patternKey: string;
  name: string;
  lifecycleStage: PatternRegistryEntry['lifecycleStage'];
  signalStrength: PatternRegistryEntry['signalStrength'];
  /** Total edge count (inbound + outbound). */
  degree: number;
  inboundEdges: number;
  outboundEdges: number;
  deterministicSeed: true;
}

export interface PatternGraphView {
  nodes: readonly PatternGraphNode[];
  edges: readonly PatternGraphEdge[];
  totalNodes: number;
  totalEdges: number;
  /** Nodes with degree >= highDegreeThreshold are considered hub patterns. */
  highDegreeThreshold: 3;
  honestNote: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Seed edges — 8 directed edges across the PAT1 pattern set
// ---------------------------------------------------------------------------

const SEED_EDGES: readonly PatternGraphEdge[] = [
  {
    edgeId: 'edge-dsf-gg',
    fromPatternKey: 'data-silo-fragmentation',
    toPatternKey: 'governance-gap',
    edgeKind: 'implies',
    weight: 0.8,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-dsf-tda',
    fromPatternKey: 'data-silo-fragmentation',
    toPatternKey: 'tech-debt-accumulation',
    edgeKind: 'co_occurs',
    weight: 0.6,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-gg-sip',
    fromPatternKey: 'governance-gap',
    toPatternKey: 'shadow-it-proliferation',
    edgeKind: 'escalates_to',
    weight: 0.7,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-ap-cmd',
    fromPatternKey: 'adoption-plateau',
    toPatternKey: 'change-management-deficit',
    edgeKind: 'implies',
    weight: 0.9,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-vcl-tda',
    fromPatternKey: 'vendor-consolidation-lag',
    toPatternKey: 'tech-debt-accumulation',
    edgeKind: 'co_occurs',
    weight: 0.5,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-tda-gg',
    fromPatternKey: 'tech-debt-accumulation',
    toPatternKey: 'governance-gap',
    edgeKind: 'escalates_to',
    weight: 0.6,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-gg-rmg',
    fromPatternKey: 'governance-gap',
    toPatternKey: 'roi-measurement-gap',
    edgeKind: 'implies',
    weight: 0.4,
    deterministicSeed: true,
  },
  {
    edgeId: 'edge-cmd-ap',
    fromPatternKey: 'change-management-deficit',
    toPatternKey: 'adoption-plateau',
    edgeKind: 'contradicts',
    weight: 0.3,
    deterministicSeed: true,
  },
];

const HONEST_NOTE =
  'Pattern graph edges are deterministic stubs representing anticipated ' +
  'relationships between intelligence patterns. Edge weights are seed values, ' +
  'not computed from live signal data.';

// ---------------------------------------------------------------------------
// Internal graph construction helpers
// ---------------------------------------------------------------------------

function buildDegreeMap(
  edges: readonly PatternGraphEdge[],
): Map<string, { inbound: number; outbound: number }> {
  const map = new Map<string, { inbound: number; outbound: number }>();

  function ensureEntry(key: string): { inbound: number; outbound: number } {
    const existing = map.get(key);
    if (existing !== undefined) return existing;
    const entry = { inbound: 0, outbound: 0 };
    map.set(key, entry);
    return entry;
  }

  for (const edge of edges) {
    ensureEntry(edge.fromPatternKey).outbound += 1;
    ensureEntry(edge.toPatternKey).inbound += 1;
  }
  return map;
}

function buildPatternGraphNodes(
  registryEntries: readonly PatternRegistryEntry[],
  edges: readonly PatternGraphEdge[],
): readonly PatternGraphNode[] {
  const degreeMap = buildDegreeMap(edges);
  const nodes: PatternGraphNode[] = [];

  for (const entry of registryEntries) {
    const degrees = degreeMap.get(entry.patternKey) ?? {
      inbound: 0,
      outbound: 0,
    };
    nodes.push({
      patternKey: entry.patternKey,
      name: entry.name,
      lifecycleStage: entry.lifecycleStage,
      signalStrength: entry.signalStrength,
      degree: degrees.inbound + degrees.outbound,
      inboundEdges: degrees.inbound,
      outboundEdges: degrees.outbound,
      deterministicSeed: true,
    });
  }
  return nodes;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the full PatternGraphView by joining the PAT1 registry with the seed
 * edge set.
 */
export function buildPatternGraphView(): PatternGraphView {
  const registry = buildPatternRegistryView();
  const nodes = buildPatternGraphNodes(registry.entries, SEED_EDGES);
  return {
    nodes,
    edges: SEED_EDGES,
    totalNodes: nodes.length,
    totalEdges: SEED_EDGES.length,
    highDegreeThreshold: 3,
    honestNote: HONEST_NOTE,
    deterministicSeed: true,
  };
}

/**
 * Returns all edges where the given patternKey appears as either the source or
 * target (i.e., the full neighborhood of the node).
 */
export function getPatternNeighbors(
  patternKey: string,
): readonly PatternGraphEdge[] {
  return SEED_EDGES.filter(
    (e) =>
      e.fromPatternKey === patternKey || e.toPatternKey === patternKey,
  );
}

/**
 * Returns all nodes whose degree is >= view.highDegreeThreshold.
 */
export function getHighDegreePatterns(
  view: PatternGraphView,
): readonly PatternGraphNode[] {
  return view.nodes.filter((n) => n.degree >= view.highDegreeThreshold);
}

/**
 * Returns a concise prose description of a PatternGraphView.
 * Example: "8 patterns · 8 edges · 2 high-degree nodes"
 */
export function describePatternGraph(view: PatternGraphView): string {
  const highDegree = getHighDegreePatterns(view).length;
  return (
    view.totalNodes +
    ' patterns · ' +
    view.totalEdges +
    ' edges · ' +
    highDegree +
    ' high-degree node' +
    (highDegree !== 1 ? 's' : '')
  );
}
