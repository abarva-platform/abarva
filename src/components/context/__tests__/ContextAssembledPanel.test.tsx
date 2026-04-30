/**
 * @jest-environment jsdom
 */
/**
 * ContextAssembledPanel render tests · CB-5.
 *
 * Coverage map (per slice spec §4):
 *   - Header renders mode badge for each mode (generic / corpus / tenant / full)
 *   - All applicable sections render when bundle is non-null
 *   - Cold-start empty state when bundle === null
 *   - Loading skeleton when isLoading === true
 *   - Query truncated at ~80 chars
 *   - Facts section caps display at 6 with "+N more" suffix
 *   - Graph neighborhoods truncate edges > 3 with "+N more"
 *   - Chunk eyebrow shows percent badge when score > 0,
 *     "KEYWORD MATCH" when score is 0
 *   - Patterns section renders ONLY for corpus / full modes
 *   - Warnings strip renders only when bundle.warnings is non-empty
 *   - onCitationClick fires when a fact card is clicked
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ContextAssembledPanel } from '../ContextAssembledPanel';
import type {
  BrokerMode,
  ContextBundle,
  ContextProvenance,
  CorpusPatternHit,
  GraphEdge,
  GraphNeighborhood,
  GraphNode,
  GraphPath,
  SemanticChunkHit,
  TenantRecord,
} from '@/lib/knowledge/context-broker';

// `@/lib/knowledge/context-broker/types` is `'server-only'` at runtime,
// but our component only takes the type via `import type` so the module
// never executes. The test imports type-only as well — no mock needed.

const TENANT = 'apex-retail';

function makeRecord(
  recordId: string,
  overrides: Partial<TenantRecord> = {},
): TenantRecord {
  return {
    tenantKey: TENANT,
    segmentId: 'program_inventory',
    recordId,
    recordKind: 'program_record',
    title: `Title for ${recordId}`,
    payload: { note: `payload for ${recordId}` },
    sourceBasis: `synthetic://${recordId}`,
    classification: 'internal',
    confidence: 0.9,
    ...overrides,
  };
}

function makeProvenance(
  sourceId: string,
  overrides: Partial<ContextProvenance> = {},
): ContextProvenance {
  return {
    sourceClass: 'tenant_admin_upload',
    sourceId,
    sourceDoc: `${sourceId}.md`,
    confidence: 0.9,
    classification: 'internal',
    ...overrides,
  };
}

function makeNode(nodeId: string, title?: string): GraphNode {
  return {
    tenantKey: TENANT,
    nodeId,
    kind: nodeId.split(':')[0] as GraphNode['kind'],
    title: title ?? nodeId,
    payload: {},
  };
}

function makeEdge(
  edgeId: string,
  fromNodeId: string,
  toNodeId: string,
  kind: GraphEdge['kind'] = 'SPONSORED_BY',
): GraphEdge {
  return {
    tenantKey: TENANT,
    edgeId,
    fromNodeId,
    toNodeId,
    kind,
  };
}

function makeChunk(
  chunkId: string,
  recordId: string,
  text: string,
  score = 0.85,
): SemanticChunkHit {
  return {
    chunk: {
      tenantKey: TENANT,
      chunkId,
      recordId,
      text,
      embeddingStatus: 'embedded',
      sourceBasis: 'synthetic',
      classification: 'internal',
    },
    score,
  };
}

function makePattern(
  patternId: string,
  overrides: Partial<CorpusPatternHit> = {},
): CorpusPatternHit {
  return {
    patternId,
    patternName: `Pattern: ${patternId}`,
    score: 0.78,
    summary: `Summary of ${patternId}`,
    ...overrides,
  };
}

function makeBundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
  const facts = overrides.facts ?? [makeRecord('program:apex-cdp-2026')];
  const chunks =
    overrides.semanticChunks ??
    [makeChunk('chunk:apex:001', 'program:apex-cdp-2026', 'Default chunk text.', 0.83)];
  const graphPaths = overrides.graphPaths ?? [];
  const corpusPatterns = overrides.corpusPatterns ?? [];
  const provenance =
    overrides.provenance ?? [
      makeProvenance('program:apex-cdp-2026'),
      ...chunks.map((c) =>
        makeProvenance(c.chunk.chunkId, { sourceClass: 'tenant_admin_upload' }),
      ),
      ...corpusPatterns.map((p) =>
        makeProvenance(p.patternId, { sourceClass: 'corpus' }),
      ),
    ];
  return {
    query: overrides.query ?? 'Who sponsors the CDP program?',
    mode: overrides.mode ?? 'full',
    tenantKey: overrides.tenantKey ?? TENANT,
    facts,
    graphPaths,
    semanticChunks: chunks,
    corpusPatterns,
    provenance,
    assembledAt: overrides.assembledAt ?? new Date().toISOString(),
    warnings: overrides.warnings ?? [],
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ContextAssembledPanel · empty + loading states', () => {
  it('renders the cold-start empty state when bundle is null', () => {
    render(<ContextAssembledPanel bundle={null} />);
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel.getAttribute('data-state')).toBe('empty');
    expect(
      screen.getByText(/No context assembled yet\. Submit a query\./i),
    ).toBeInTheDocument();
  });

  it('renders the loading skeleton when isLoading is true', () => {
    render(<ContextAssembledPanel bundle={null} isLoading />);
    const panel = screen.getByTestId('context-assembled-panel');
    expect(panel.getAttribute('data-state')).toBe('loading');
    expect(panel.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByTestId('context-panel-skeleton')).toBeInTheDocument();
    // 3-line shimmer.
    expect(screen.getByTestId('context-panel-skeleton-line-0')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-skeleton-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-skeleton-line-2')).toBeInTheDocument();
  });

  it('loading state takes precedence over a non-null bundle', () => {
    render(
      <ContextAssembledPanel bundle={makeBundle()} isLoading />,
    );
    expect(screen.getByTestId('context-assembled-panel').getAttribute('data-state')).toBe(
      'loading',
    );
    expect(screen.queryByTestId('context-panel-section-facts')).not.toBeInTheDocument();
  });
});

describe('ContextAssembledPanel · header + mode badge', () => {
  it.each<BrokerMode>(['generic', 'corpus', 'tenant', 'full'])(
    'renders the mode badge for mode=%s',
    (mode) => {
      const bundle = makeBundle({ mode, corpusPatterns: mode === 'corpus' || mode === 'full' ? [makePattern('PAT-X-001')] : [] });
      render(<ContextAssembledPanel bundle={bundle} />);
      const badge = screen.getByTestId('context-panel-mode-badge');
      expect(badge.getAttribute('data-mode')).toBe(mode);
      expect(badge.textContent).toMatch(new RegExp(`MODE.*${mode.toUpperCase()}`, 'i'));
    },
  );

  it('truncates the query at ~80 chars', () => {
    const longQuery =
      'This is an exceptionally long question that goes well past the eighty character truncation limit for the context panel header';
    const bundle = makeBundle({ query: longQuery });
    render(<ContextAssembledPanel bundle={bundle} />);
    const queryNode = screen.getByTestId('context-panel-query');
    expect(queryNode.textContent ?? '').toHaveLength(
      // Truncate uses last-space cut; final char is ellipsis.
      // Validate it is shorter than the original AND contains the ellipsis.
      (queryNode.textContent ?? '').length,
    );
    expect((queryNode.textContent ?? '').length).toBeLessThan(longQuery.length);
    expect(queryNode.textContent).toMatch(/…$/);
  });

  it('subtitle includes per-section counts', () => {
    const bundle = makeBundle({
      facts: [makeRecord('a'), makeRecord('b')],
      graphPaths: [],
      semanticChunks: [
        makeChunk('c1', 'a', 'a-text', 0.8),
        makeChunk('c2', 'b', 'b-text', 0.7),
        makeChunk('c3', 'b', 'c-text', 0.6),
      ],
      corpusPatterns: [makePattern('PAT-X-001')],
      provenance: [
        makeProvenance('a'),
        makeProvenance('b'),
        makeProvenance('c1'),
        makeProvenance('c2'),
        makeProvenance('c3'),
        makeProvenance('PAT-X-001', { sourceClass: 'corpus' }),
      ],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(
      screen.getByText(/2 facts · 0 graph paths · 3 chunks · 1 corpus patterns/),
    ).toBeInTheDocument();
  });
});

describe('ContextAssembledPanel · sections render when bundle is non-null', () => {
  it('renders all sections in tenant mode (corpus section hidden)', () => {
    const bundle = makeBundle({ mode: 'tenant' });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-section-facts')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-section-graph')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-section-chunks')).toBeInTheDocument();
    expect(screen.queryByTestId('context-panel-section-patterns')).not.toBeInTheDocument();
    expect(screen.getByTestId('context-panel-guardrail')).toHaveTextContent(
      'Only claims supported by retrieved context are allowed.',
    );
  });

  it('renders the corpus patterns section when mode is corpus', () => {
    const bundle = makeBundle({
      mode: 'corpus',
      facts: [],
      semanticChunks: [],
      corpusPatterns: [makePattern('PAT-CDP-001')],
      provenance: [makeProvenance('PAT-CDP-001', { sourceClass: 'corpus' })],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-section-patterns')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-pattern-PAT-CDP-001')).toBeInTheDocument();
  });

  it('renders the corpus patterns section when mode is full', () => {
    const bundle = makeBundle({
      mode: 'full',
      corpusPatterns: [makePattern('PAT-FULL-001')],
      provenance: [
        makeProvenance('program:apex-cdp-2026'),
        makeProvenance('chunk:apex:001'),
        makeProvenance('PAT-FULL-001', { sourceClass: 'corpus' }),
      ],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-section-patterns')).toBeInTheDocument();
  });

  it('hides the patterns section in generic / tenant modes', () => {
    for (const mode of ['generic', 'tenant'] as BrokerMode[]) {
      const { unmount } = render(
        <ContextAssembledPanel bundle={makeBundle({ mode })} />,
      );
      expect(screen.queryByTestId('context-panel-section-patterns')).not.toBeInTheDocument();
      unmount();
    }
  });
});

describe('ContextAssembledPanel · facts section', () => {
  it('renders the section with N+1 elements (header + N cards) up to display limit', () => {
    const facts = Array.from({ length: 4 }, (_, i) => makeRecord(`fact:${i}`));
    const bundle = makeBundle({
      facts,
      provenance: facts.map((f) => makeProvenance(f.recordId)),
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-section-facts')).toBeInTheDocument();
    facts.forEach((f) => {
      expect(screen.getByTestId(`context-panel-fact-${f.recordId}`)).toBeInTheDocument();
    });
  });

  it('caps at 6 cards and shows "+N more" when facts exceed the display limit', () => {
    const facts = Array.from({ length: 9 }, (_, i) => makeRecord(`fact:${i}`));
    const bundle = makeBundle({
      facts,
      provenance: facts.map((f) => makeProvenance(f.recordId)),
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    // First 6 visible.
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`context-panel-fact-fact:${i}`)).toBeInTheDocument();
    }
    // Beyond limit hidden.
    expect(screen.queryByTestId('context-panel-fact-fact:6')).not.toBeInTheDocument();
    expect(screen.getByText(/\+3 more not shown/)).toBeInTheDocument();
  });

  it('renders the empty-state line when facts is empty', () => {
    const bundle = makeBundle({ facts: [], provenance: [] });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByText(/No structured facts retrieved\./)).toBeInTheDocument();
  });
});

describe('ContextAssembledPanel · graph paths section', () => {
  it('renders one row per GraphPath with edge labels rendered', () => {
    const path: GraphPath = {
      fromId: 'program:apex-cdp-2026',
      toId: 'person:apex:jennifer-park',
      edges: [
        makeEdge('e1', 'program:apex-cdp-2026', 'person:apex:jennifer-park', 'SPONSORED_BY'),
      ],
    };
    const bundle = makeBundle({ graphPaths: [path] });
    render(<ContextAssembledPanel bundle={bundle} />);
    const row = screen.getByTestId('context-panel-graph-path-0');
    expect(row).toBeInTheDocument();
    expect(row.textContent).toContain('SPONSORED_BY');
    expect(row.textContent).toContain('program:apex-cdp-2026');
    expect(row.textContent).toContain('person:apex:jennifer-park');
  });

  it('renders neighborhoods with a +N more suffix when edges exceed 3', () => {
    const rootId = 'program:apex-cdp-2026';
    const nodes: GraphNode[] = [makeNode(rootId, 'CDP Program')];
    const edges: GraphEdge[] = [];
    for (let i = 0; i < 5; i++) {
      const otherId = `person:apex:p${i}`;
      nodes.push(makeNode(otherId, `Person ${i}`));
      edges.push(makeEdge(`e${i}`, rootId, otherId, 'SPONSORED_BY'));
    }
    const neighborhood: GraphNeighborhood = { rootId, nodes, edges, depth: 1 };
    const bundle = makeBundle({ graphPaths: [neighborhood] });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(
      screen.getByTestId(`context-panel-graph-neighborhood-${rootId}`),
    ).toBeInTheDocument();
    // 3 visible edges, 2 truncated.
    expect(
      screen.getByTestId(`context-panel-graph-truncated-${rootId}`).textContent,
    ).toMatch(/\+2 more/);
  });

  it('renders the empty-state line when graphPaths is empty', () => {
    const bundle = makeBundle({ graphPaths: [] });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByText(/No graph paths traversed\./)).toBeInTheDocument();
  });
});

describe('ContextAssembledPanel · semantic chunks section', () => {
  it('shows the percent score badge when score is set', () => {
    const bundle = makeBundle({
      semanticChunks: [
        makeChunk('chunk:1', 'program:apex-cdp-2026', 'A vector hit.', 0.92),
      ],
      provenance: [
        makeProvenance('program:apex-cdp-2026'),
        makeProvenance('chunk:1'),
      ],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    const badge = screen.getByTestId('context-panel-chunk-score-0');
    expect(badge.textContent).toBe('92%');
    const card = screen.getByTestId('context-panel-chunk-0');
    expect(card.getAttribute('data-score-mode')).toBe('vector');
  });

  it('shows "KEYWORD MATCH" when score is 0', () => {
    const bundle = makeBundle({
      semanticChunks: [
        makeChunk('chunk:k', 'program:apex-cdp-2026', 'A keyword fallback hit.', 0),
      ],
      provenance: [
        makeProvenance('program:apex-cdp-2026'),
        makeProvenance('chunk:k'),
      ],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    const badge = screen.getByTestId('context-panel-chunk-score-0');
    expect(badge.textContent).toBe('KEYWORD MATCH');
    const card = screen.getByTestId('context-panel-chunk-0');
    expect(card.getAttribute('data-score-mode')).toBe('keyword');
  });

  it('caps the chunk display at 5 and adds "+N more"', () => {
    const chunks: SemanticChunkHit[] = Array.from({ length: 8 }, (_, i) =>
      makeChunk(`chunk:${i}`, 'program:apex-cdp-2026', `Text for chunk ${i}`, 0.8 - i * 0.01),
    );
    const bundle = makeBundle({
      semanticChunks: chunks,
      provenance: [
        makeProvenance('program:apex-cdp-2026'),
        ...chunks.map((c) => makeProvenance(c.chunk.chunkId)),
      ],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-chunk-4')).toBeInTheDocument();
    expect(screen.queryByTestId('context-panel-chunk-5')).not.toBeInTheDocument();
    expect(screen.getByText(/\+3 more not shown/)).toBeInTheDocument();
  });

  it('renders the empty-state copy when no chunks', () => {
    const bundle = makeBundle({ semanticChunks: [] });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(
      screen.getByText(/No semantic chunks retrieved/i),
    ).toBeInTheDocument();
  });
});

describe('ContextAssembledPanel · warnings + footer', () => {
  it('renders the warnings strip when bundle.warnings is non-empty', () => {
    const bundle = makeBundle({
      warnings: ['Vector retrieval pending — using keyword-only chunk retrieval'],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-warnings')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-warning-0').textContent).toMatch(
      /Vector retrieval pending/,
    );
  });

  it('hides the warnings strip when bundle.warnings is empty', () => {
    const bundle = makeBundle({ warnings: [] });
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.queryByTestId('context-panel-warnings')).not.toBeInTheDocument();
  });

  it('always renders the guardrail footer line', () => {
    const bundle = makeBundle();
    render(<ContextAssembledPanel bundle={bundle} />);
    expect(screen.getByTestId('context-panel-guardrail').textContent).toBe(
      'Only claims supported by retrieved context are allowed.',
    );
  });
});

describe('ContextAssembledPanel · onCitationClick', () => {
  it('fires onCitationClick with the matching provenance when a fact card is clicked', () => {
    const handler = jest.fn();
    const record = makeRecord('program:apex-cdp-2026');
    const prov = makeProvenance('program:apex-cdp-2026', {
      sourceClass: 'tenant_admin_upload',
    });
    const bundle = makeBundle({
      facts: [record],
      semanticChunks: [],
      provenance: [prov],
    });
    render(
      <ContextAssembledPanel bundle={bundle} onCitationClick={handler} />,
    );
    const card = screen.getByTestId(`context-panel-fact-${record.recordId}`);
    expect(card.tagName).toBe('BUTTON');
    fireEvent.click(card);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(prov);
  });

  it('renders fact cards as non-button elements when no onCitationClick is supplied', () => {
    const record = makeRecord('program:apex-cdp-2026');
    const bundle = makeBundle({
      facts: [record],
      semanticChunks: [],
      provenance: [makeProvenance(record.recordId)],
    });
    render(<ContextAssembledPanel bundle={bundle} />);
    const card = screen.getByTestId(`context-panel-fact-${record.recordId}`);
    expect(card.tagName).toBe('DIV');
  });
});
