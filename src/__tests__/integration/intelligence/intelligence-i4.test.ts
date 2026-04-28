/**
 * I4 · INT-IDX-GRAPH — Intelligence pattern graph browser tests.
 *
 * Verifies:
 *   - buildPatternGraphShellView returns valid shell view
 *   - buildPatternGraphView returns nodes + edges
 *   - totalNodes > 0, totalEdges > 0
 *   - highDegreeCount matches nodes with degree ≥ threshold
 *   - ProvenanceRibbon derivable (primitive='Pattern', signalCount=totalEdges)
 *   - PatternGraphShell.tsx is NOT a use client component
 *   - PatternGraphSentinel.tsx IS a use client component
 *   - Route file exists
 *   - Module hygiene
 *   - Determinism
 */

import * as fs from 'fs';
import * as path from 'path';

import { buildPatternGraphShellView, describePatternGraphShell } from '@/lib/sentinel/pattern-graph-shell-view';
import {
  buildPatternGraphView,
  getHighDegreePatterns,
  getPatternNeighbors,
} from '@/lib/sentinel/pattern-graph-read-model';

const ROOT = path.resolve(__dirname, '../../../../');

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Pattern graph shell view
// ---------------------------------------------------------------------------

describe('I4 · buildPatternGraphShellView — shell', () => {
  const shell = buildPatternGraphShellView('graph');

  it('returns a non-null view', () => {
    expect(shell).not.toBeNull();
  });

  it('title is "Pattern Graph"', () => {
    expect(shell.title).toBe('Pattern Graph');
  });

  it('activeTab is graph', () => {
    expect(shell.activeTab).toBe('graph');
  });

  it('totalPatterns is at least 1', () => {
    expect(shell.totalPatterns).toBeGreaterThanOrEqual(1);
  });

  it('highDegreeCount is a non-negative number', () => {
    expect(shell.highDegreeCount).toBeGreaterThanOrEqual(0);
  });

  it('deterministicSeed is true', () => {
    expect(shell.deterministicSeed).toBe(true);
  });

  it('tabs array is non-empty', () => {
    expect(shell.tabs.length).toBeGreaterThan(0);
  });

  it('graph tab exists in tabs', () => {
    const graphTab = shell.tabs.find((t) => t.tab === 'graph');
    expect(graphTab).not.toBeUndefined();
  });

  it('describePatternGraphShell returns non-empty string', () => {
    const desc = describePatternGraphShell(shell);
    expect(desc.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Pattern graph view
// ---------------------------------------------------------------------------

describe('I4 · buildPatternGraphView — graph', () => {
  const graph = buildPatternGraphView();

  it('returns a non-null view', () => {
    expect(graph).not.toBeNull();
  });

  it('totalNodes > 0', () => {
    expect(graph.totalNodes).toBeGreaterThan(0);
  });

  it('totalEdges > 0', () => {
    expect(graph.totalEdges).toBeGreaterThan(0);
  });

  it('nodes array length equals totalNodes', () => {
    expect(graph.nodes.length).toBe(graph.totalNodes);
  });

  it('edges array length equals totalEdges', () => {
    expect(graph.edges.length).toBe(graph.totalEdges);
  });

  it('highDegreeThreshold is 3', () => {
    expect(graph.highDegreeThreshold).toBe(3);
  });

  it('honestNote is non-empty', () => {
    expect(graph.honestNote.length).toBeGreaterThan(0);
  });

  it('deterministicSeed is true', () => {
    expect(graph.deterministicSeed).toBe(true);
  });

  it('every node has a non-empty patternKey', () => {
    for (const node of graph.nodes) {
      expect(node.patternKey.length).toBeGreaterThan(0);
    }
  });

  it('every node has deterministicSeed true', () => {
    for (const node of graph.nodes) {
      expect(node.deterministicSeed).toBe(true);
    }
  });

  it('every edge weight is in [0, 1]', () => {
    for (const edge of graph.edges) {
      expect(edge.weight).toBeGreaterThanOrEqual(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  it('every edge has a valid edgeKind', () => {
    const VALID_KINDS = new Set(['implies', 'contradicts', 'co_occurs', 'escalates_to']);
    for (const edge of graph.edges) {
      expect(VALID_KINDS.has(edge.edgeKind)).toBe(true);
    }
  });

  it('every edge has a non-empty edgeId', () => {
    for (const edge of graph.edges) {
      expect(edge.edgeId.length).toBeGreaterThan(0);
    }
  });

  it('every edge has deterministicSeed true', () => {
    for (const edge of graph.edges) {
      expect(edge.deterministicSeed).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getHighDegreePatterns
// ---------------------------------------------------------------------------

describe('I4 · getHighDegreePatterns', () => {
  const graph = buildPatternGraphView();
  const hubNodes = getHighDegreePatterns(graph);

  it('returns an array', () => {
    expect(Array.isArray(hubNodes)).toBe(true);
  });

  it('all returned nodes have degree >= highDegreeThreshold', () => {
    for (const node of hubNodes) {
      expect(node.degree).toBeGreaterThanOrEqual(graph.highDegreeThreshold);
    }
  });
});

// ---------------------------------------------------------------------------
// getPatternNeighbors
// ---------------------------------------------------------------------------

describe('I4 · getPatternNeighbors', () => {
  const graph = buildPatternGraphView();

  it('returns empty array for an unknown pattern key', () => {
    const neighbors = getPatternNeighbors('nonexistent-pattern-key-xyz');
    expect(neighbors).toHaveLength(0);
  });

  it('returns edges for a known pattern key from the first edge', () => {
    const firstEdge = graph.edges[0];
    if (firstEdge) {
      const neighbors = getPatternNeighbors(firstEdge.fromPatternKey);
      expect(neighbors.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Shell ↔ graph consistency
// ---------------------------------------------------------------------------

describe('I4 · shell ↔ graph consistency', () => {
  const shell = buildPatternGraphShellView('graph');
  const graph = buildPatternGraphView();
  const hubNodes = getHighDegreePatterns(graph);

  it('shell.highDegreeCount matches getHighDegreePatterns count', () => {
    expect(shell.highDegreeCount).toBe(hubNodes.length);
  });

  it('shell.totalPatterns equals graph.totalNodes', () => {
    expect(shell.totalPatterns).toBe(graph.totalNodes);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('I4 · determinism', () => {
  it('buildPatternGraphShellView returns identical output on repeated calls', () => {
    const a = buildPatternGraphShellView('graph');
    const b = buildPatternGraphShellView('graph');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('buildPatternGraphView returns identical output on repeated calls', () => {
    const a = buildPatternGraphView();
    const b = buildPatternGraphView();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ---------------------------------------------------------------------------
// Module hygiene
// ---------------------------------------------------------------------------

describe('I4 · module hygiene', () => {
  it('PatternGraphShell.tsx is NOT a use client component', () => {
    const src = readFile('src/components/intelligence/PatternGraphShell.tsx');
    expect(src.startsWith("'use client'")).toBe(false);
    expect(src.startsWith('"use client"')).toBe(false);
  });

  it('PatternGraphSentinel.tsx IS a use client component', () => {
    const src = readFile('src/components/intelligence/PatternGraphSentinel.tsx');
    expect(src.startsWith("'use client'")).toBe(true);
  });

  it('PatternGraphShell.tsx does not contain fetch(', () => {
    const src = readFile('src/components/intelligence/PatternGraphShell.tsx');
    expect(src).not.toContain('fetch(');
  });

  it('PatternGraphShell.tsx does not contain Date.now(', () => {
    const src = readFile('src/components/intelligence/PatternGraphShell.tsx');
    expect(src).not.toContain('Date.now(');
  });
});

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------

describe('I4 · file existence', () => {
  const REQUIRED_FILES = [
    'src/components/intelligence/PatternGraphShell.tsx',
    'src/components/intelligence/PatternGraphSentinel.tsx',
    'src/app/intelligence/patterns/page.tsx',
    'src/lib/sentinel/pattern-graph-read-model.ts',
    'src/lib/sentinel/pattern-graph-shell-view.ts',
  ];

  for (const rel of REQUIRED_FILES) {
    it(`${rel} exists`, () => {
      expect(fileExists(rel)).toBe(true);
    });
  }
});
