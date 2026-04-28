/**
 * I5 — pattern-graph-read-model integration tests
 *
 * Pure TypeScript Jest tests covering:
 *   - buildPatternGraphView() shape (totalNodes=8, totalEdges=8)
 *   - All nodes have deterministicSeed: true
 *   - getPatternNeighbors() for known and unknown pattern keys
 *   - getHighDegreePatterns() returns nodes with degree >= highDegreeThreshold
 *   - Edge weights in 0–1 range
 *   - Edge kinds from valid set
 *   - honestNote presence
 *   - describePatternGraph() prose format
 *   - Determinism: two calls produce byte-equal JSON
 *   - Module hygiene (source imports limited to pattern-registry-lifecycle)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildPatternGraphView,
  getPatternNeighbors,
  getHighDegreePatterns,
  describePatternGraph,
  type PatternGraphView,
  type PatternGraphNode,
  type PatternGraphEdge,
  type PatternGraphEdgeKind,
} from '@/lib/sentinel/pattern-graph-read-model';

const root = process.cwd();
const SOURCE_PATH = 'src/lib/sentinel/pattern-graph-read-model.ts';

function readSource(): string {
  return readFileSync(resolve(root, SOURCE_PATH), 'utf8');
}

const VALID_EDGE_KINDS: ReadonlySet<PatternGraphEdgeKind> = new Set([
  'implies',
  'contradicts',
  'co_occurs',
  'escalates_to',
]);

// ---------------------------------------------------------------------------
// buildPatternGraphView shape
// ---------------------------------------------------------------------------

describe('I5 — buildPatternGraphView shape', () => {
  let view: PatternGraphView;

  beforeAll(() => {
    view = buildPatternGraphView();
  });

  it('totalNodes is 8', () => {
    expect(view.totalNodes).toBe(8);
  });

  it('totalEdges is 8', () => {
    expect(view.totalEdges).toBe(8);
  });

  it('nodes array length equals totalNodes', () => {
    expect(view.nodes.length).toBe(view.totalNodes);
  });

  it('edges array length equals totalEdges', () => {
    expect(view.edges.length).toBe(view.totalEdges);
  });

  it('deterministicSeed is true on the view', () => {
    expect(view.deterministicSeed).toBe(true);
  });

  it('highDegreeThreshold is 3', () => {
    expect(view.highDegreeThreshold).toBe(3);
  });

  it('all nodes have deterministicSeed: true', () => {
    for (const node of view.nodes) {
      expect(node.deterministicSeed).toBe(true);
    }
  });

  it('all edges have deterministicSeed: true', () => {
    for (const edge of view.edges) {
      expect(edge.deterministicSeed).toBe(true);
    }
  });

  it('all nodes have a non-empty patternKey', () => {
    for (const node of view.nodes) {
      expect(typeof node.patternKey).toBe('string');
      expect(node.patternKey.length).toBeGreaterThan(0);
    }
  });

  it('all nodes have a non-empty name', () => {
    for (const node of view.nodes) {
      expect(typeof node.name).toBe('string');
      expect(node.name.length).toBeGreaterThan(0);
    }
  });

  it('all node patternKeys are unique', () => {
    const keys = view.nodes.map((n) => n.patternKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('all node degrees are non-negative integers', () => {
    for (const node of view.nodes) {
      expect(node.degree).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(node.degree)).toBe(true);
    }
  });

  it('degree equals inboundEdges + outboundEdges for every node', () => {
    for (const node of view.nodes) {
      expect(node.degree).toBe(node.inboundEdges + node.outboundEdges);
    }
  });

  it('honestNote is present', () => {
    expect(typeof view.honestNote).toBe('string');
    expect(view.honestNote.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Edge invariants
// ---------------------------------------------------------------------------

describe('I5 — edge invariants', () => {
  let view: PatternGraphView;

  beforeAll(() => {
    view = buildPatternGraphView();
  });

  it('all edge weights are in the 0–1 range', () => {
    for (const edge of view.edges) {
      expect(edge.weight).toBeGreaterThanOrEqual(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  it('all edge kinds are from the valid set', () => {
    for (const edge of view.edges) {
      expect(VALID_EDGE_KINDS.has(edge.edgeKind)).toBe(true);
    }
  });

  it('all edges have non-empty edgeId', () => {
    for (const edge of view.edges) {
      expect(typeof edge.edgeId).toBe('string');
      expect(edge.edgeId.length).toBeGreaterThan(0);
    }
  });

  it('all edges have non-empty fromPatternKey and toPatternKey', () => {
    for (const edge of view.edges) {
      expect(edge.fromPatternKey.length).toBeGreaterThan(0);
      expect(edge.toPatternKey.length).toBeGreaterThan(0);
    }
  });

  it('all edge edgeIds are unique', () => {
    const ids = view.edges.map((e) => e.edgeId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// getPatternNeighbors
// ---------------------------------------------------------------------------

describe('I5 — getPatternNeighbors', () => {
  it('returns edges for data-silo-fragmentation', () => {
    const edges = getPatternNeighbors('data-silo-fragmentation');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('all returned edges reference data-silo-fragmentation as source or target', () => {
    const edges = getPatternNeighbors('data-silo-fragmentation');
    for (const edge of edges) {
      const references =
        edge.fromPatternKey === 'data-silo-fragmentation' ||
        edge.toPatternKey === 'data-silo-fragmentation';
      expect(references).toBe(true);
    }
  });

  it('returns edges for governance-gap', () => {
    const edges = getPatternNeighbors('governance-gap');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('all returned edges for governance-gap reference governance-gap', () => {
    for (const edge of getPatternNeighbors('governance-gap')) {
      const ref =
        edge.fromPatternKey === 'governance-gap' ||
        edge.toPatternKey === 'governance-gap';
      expect(ref).toBe(true);
    }
  });

  it('returns an empty array for unknown-pattern', () => {
    expect(getPatternNeighbors('unknown-pattern')).toHaveLength(0);
  });

  it('returns an empty array for empty string', () => {
    expect(getPatternNeighbors('')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getHighDegreePatterns
// ---------------------------------------------------------------------------

describe('I5 — getHighDegreePatterns', () => {
  let view: PatternGraphView;
  let highDegree: readonly PatternGraphNode[];

  beforeAll(() => {
    view = buildPatternGraphView();
    highDegree = getHighDegreePatterns(view);
  });

  it('returns at least one high-degree node', () => {
    expect(highDegree.length).toBeGreaterThanOrEqual(1);
  });

  it('all returned nodes have degree >= highDegreeThreshold (3)', () => {
    for (const node of highDegree) {
      expect(node.degree).toBeGreaterThanOrEqual(view.highDegreeThreshold);
    }
  });

  it('governance-gap is a high-degree node with degree >= 3', () => {
    const ggNode = highDegree.find((n) => n.patternKey === 'governance-gap');
    expect(ggNode).toBeDefined();
    expect((ggNode as PatternGraphNode).degree).toBeGreaterThanOrEqual(3);
  });

  it('nodes NOT in high-degree result have degree < highDegreeThreshold', () => {
    const highKeys = new Set(highDegree.map((n) => n.patternKey));
    for (const node of view.nodes) {
      if (!highKeys.has(node.patternKey)) {
        expect(node.degree).toBeLessThan(view.highDegreeThreshold);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// describePatternGraph
// ---------------------------------------------------------------------------

describe('I5 — describePatternGraph', () => {
  let view: PatternGraphView;

  beforeAll(() => {
    view = buildPatternGraphView();
  });

  it('returns a non-empty string', () => {
    const desc = describePatternGraph(view);
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('mentions "patterns"', () => {
    expect(describePatternGraph(view)).toContain('patterns');
  });

  it('mentions "edges"', () => {
    expect(describePatternGraph(view)).toContain('edges');
  });

  it('includes totalNodes count "8"', () => {
    expect(describePatternGraph(view)).toContain('8');
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('I5 — determinism', () => {
  it('calling buildPatternGraphView() twice returns byte-equal JSON', () => {
    const a = buildPatternGraphView();
    const b = buildPatternGraphView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I5 — module hygiene', () => {
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

  it('only imports from pattern-registry-lifecycle (no other local lib imports)', () => {
    // Extract all local import paths from the source file
    const importMatches = src.matchAll(/from\s+'([^']+)'/g);
    for (const match of importMatches) {
      const importPath = match[1];
      // Allow relative imports only if they reference pattern-registry-lifecycle
      if (importPath.startsWith('.') || importPath.startsWith('@/lib/')) {
        expect(importPath).toContain('pattern-registry-lifecycle');
      }
    }
  });
});
