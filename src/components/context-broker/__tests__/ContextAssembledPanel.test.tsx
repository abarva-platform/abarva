/**
 * @jest-environment jsdom
 */
/**
 * ContextAssembledPanel · render tests · CB-5
 *
 * Coverage:
 *   - Generic mode collapses to single-line empty state
 *   - Header shows query + mode badge + tenant + assembled-at
 *   - All 5 sections render with their counts
 *   - Source-class color coding renders the right border/labels
 *   - Empty states per section render the correct empty-line
 *   - Footer shows guardrail badge + telemetry summary
 *   - Warnings array renders as a section
 *   - aria-live and role="list" semantics in place
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ContextAssembledPanel } from '../ContextAssembledPanel';
import type {
  ContextBundle,
  ContextProvenance,
  CorpusPatternHit,
  GraphPath,
  SemanticChunkHit,
  TenantRecord,
} from '@/lib/knowledge/context-broker';

function fact(overrides: Partial<TenantRecord> = {}): TenantRecord {
  return {
    tenantKey: 'apex-retail',
    segmentId: 'program_inventory',
    recordId: 'program:apex-cdp-2026',
    title: 'CDP Activation 2026',
    recordKind: 'program',
    sourceDoc: 'program_inventory.md',
    sourcePath: '/programs/apex-cdp-2026',
    sourceBasis: 'tenant_admin_upload',
    confidence: 0.9,
    classification: 'internal',
    payload: {},
    ...overrides,
  } as TenantRecord;
}

function chunk(overrides: Partial<SemanticChunkHit['chunk']> = {}, score = 0): SemanticChunkHit {
  return {
    chunk: {
      tenantKey: 'apex-retail',
      chunkId: 'chunk:apex:001',
      recordId: 'program:apex-cdp-2026',
      text: 'The CDP rollout depends on legacy CRM extraction; the extraction is currently unfunded with a 2026-05-31 decision target.',
      tokenCount: 32,
      embeddingStatus: 'pending',
      sourceSegmentId: 'program_inventory',
      sourcePath: '/programs/apex-cdp-2026',
      ...overrides,
    },
    score,
  } as SemanticChunkHit;
}

function pattern(overrides: Partial<CorpusPatternHit> = {}): CorpusPatternHit {
  return {
    patternId: 'PAT-PRG-CDP-001',
    patternName: 'CDP activation pattern',
    score: 0.82,
    summary: 'Common architecture and decision-rights template for CDP rollouts.',
    ...overrides,
  };
}

function provenance(overrides: Partial<ContextProvenance> = {}): ContextProvenance {
  return {
    sourceClass: 'tenant_admin_upload',
    sourceId: 'program:apex-cdp-2026',
    sourceDoc: 'program_inventory.md',
    confidence: 0.9,
    classification: 'internal',
    ...overrides,
  };
}

function bundle(overrides: Partial<ContextBundle> = {}): ContextBundle {
  return {
    query: 'why is apex CDP at risk?',
    mode: 'tenant',
    tenantKey: 'apex-retail',
    facts: [],
    graphPaths: [],
    semanticChunks: [],
    corpusPatterns: [],
    provenance: [],
    warnings: [],
    assembledAt: '2026-04-30T14:32:09Z',
    ...overrides,
  };
}

describe('ContextAssembledPanel — generic mode collapse', () => {
  it('renders the single-line empty state for generic mode', () => {
    render(<ContextAssembledPanel bundle={bundle({ mode: 'generic', tenantKey: null })} />);
    expect(screen.getByTestId('context-assembled-panel')).toHaveAttribute(
      'data-mode',
      'generic',
    );
    expect(screen.getByTestId('context-assembled-empty-generic')).toBeInTheDocument();
  });
});

describe('ContextAssembledPanel — header', () => {
  it('echoes the query verbatim', () => {
    render(
      <ContextAssembledPanel
        bundle={bundle({ query: 'apex CDP risk profile' })}
      />,
    );
    expect(screen.getByText('apex CDP risk profile')).toBeInTheDocument();
  });

  it('renders the mode badge', () => {
    render(<ContextAssembledPanel bundle={bundle({ mode: 'tenant' })} />);
    expect(screen.getByTestId('context-panel-mode-tenant')).toBeInTheDocument();
  });

  it('renders the tenant key when present', () => {
    render(<ContextAssembledPanel bundle={bundle({ tenantKey: 'apex-retail' })} />);
    expect(screen.getByTestId('context-panel-tenant-key')).toHaveTextContent(
      /apex-retail/,
    );
  });

  it('omits the tenant key when absent', () => {
    render(<ContextAssembledPanel bundle={bundle({ mode: 'corpus', tenantKey: null })} />);
    expect(screen.queryByTestId('context-panel-tenant-key')).toBeNull();
  });

  it('renders the assembled-at as relative when `now` is provided', () => {
    render(
      <ContextAssembledPanel
        bundle={bundle({ assembledAt: '2026-04-30T14:32:00Z' })}
        now={new Date('2026-04-30T14:32:08Z')}
      />,
    );
    expect(screen.getByTestId('context-panel-assembled-at')).toHaveTextContent(/8s ago/);
  });
});

describe('ContextAssembledPanel — sections', () => {
  it('renders all five sections', () => {
    render(<ContextAssembledPanel bundle={bundle()} />);
    expect(screen.getByTestId('context-panel-section-facts')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-section-graph')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-section-chunks')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-section-patterns')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-footer')).toBeInTheDocument();
  });

  it('marks empty sections with data-empty=true', () => {
    render(<ContextAssembledPanel bundle={bundle()} />);
    expect(screen.getByTestId('context-panel-section-facts')).toHaveAttribute(
      'data-empty',
      'true',
    );
    expect(screen.getByTestId('context-panel-facts-empty')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-graph-empty')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-chunks-empty')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-patterns-empty')).toBeInTheDocument();
  });

  it('renders facts with source-class chip', () => {
    const f = fact();
    const p = provenance({ sourceId: f.recordId });
    render(<ContextAssembledPanel bundle={bundle({ facts: [f], provenance: [p] })} />);
    expect(screen.getByTestId(`context-panel-fact-${f.recordId}`)).toBeInTheDocument();
    expect(
      screen.getByTestId('context-panel-source-class-tenant_admin_upload'),
    ).toBeInTheDocument();
  });

  it('sorts facts by confidence descending', () => {
    const lowConf = fact({ recordId: 'r1', title: 'Low' });
    const highConf = fact({ recordId: 'r2', title: 'High' });
    const provs = [
      provenance({ sourceId: 'r1', confidence: 0.4 }),
      provenance({ sourceId: 'r2', confidence: 0.95 }),
    ];
    render(
      <ContextAssembledPanel
        bundle={bundle({ facts: [lowConf, highConf], provenance: provs })}
      />,
    );
    const factsSection = screen.getByTestId('context-panel-section-facts');
    const items = factsSection.querySelectorAll('[data-testid^="context-panel-fact-r"]');
    expect(items[0]?.getAttribute('data-testid')).toBe('context-panel-fact-r2');
    expect(items[1]?.getAttribute('data-testid')).toBe('context-panel-fact-r1');
  });

  it('renders graph paths', () => {
    const path: GraphPath = {
      fromId: 'program:apex-cdp-2026',
      toId: 'person:apex:jennifer-park',
      edges: [
        {
          tenantKey: 'apex-retail',
          edgeId: 'e1',
          fromNodeId: 'program:apex-cdp-2026',
          toNodeId: 'person:apex:jennifer-park',
          kind: 'sponsored_by',
        } as never,
      ],
    };
    render(<ContextAssembledPanel bundle={bundle({ graphPaths: [path] })} />);
    const path0 = screen.getByTestId('context-panel-graph-path-0');
    expect(path0.textContent).toContain('program:apex-cdp-2026');
    expect(path0.textContent).toContain('sponsored_by');
    expect(path0.textContent).toContain('person:apex:jennifer-park');
  });

  it('renders semantic chunks with score and source', () => {
    const c = chunk({}, 0.87);
    const p = provenance({ sourceId: c.chunk.chunkId, classification: 'confidential' });
    render(
      <ContextAssembledPanel
        bundle={bundle({ semanticChunks: [c], provenance: [p] })}
      />,
    );
    expect(screen.getByTestId('context-panel-chunk-0')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-chunk-score-0')).toHaveTextContent('0.87');
    expect(
      screen.getByTestId('context-panel-chunk-classification-0'),
    ).toHaveTextContent('confidential');
  });

  it("renders a 'keyword' label when chunk score is 0", () => {
    const c = chunk({}, 0);
    render(<ContextAssembledPanel bundle={bundle({ semanticChunks: [c] })} />);
    expect(screen.getByTestId('context-panel-chunk-score-0')).toHaveTextContent('keyword');
  });

  it('renders patterns with click-through link', () => {
    const p = pattern();
    render(<ContextAssembledPanel bundle={bundle({ corpusPatterns: [p] })} />);
    const link = screen.getByTestId('context-panel-pattern-link-PAT-PRG-CDP-001');
    expect(link).toHaveAttribute('href', '/intelligence/patterns/pat-prg-cdp-001');
  });
});

describe('ContextAssembledPanel — warnings', () => {
  it('renders a warnings section when present', () => {
    render(
      <ContextAssembledPanel
        bundle={bundle({
          warnings: [
            'Vector retrieval pending — using keyword-only chunk retrieval',
            'Corpus retrieval pending CB-6.',
          ],
        })}
      />,
    );
    expect(screen.getByTestId('context-panel-warnings')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel-warning-0').textContent).toMatch(/vector/i);
    expect(screen.getByTestId('context-panel-warning-1').textContent).toMatch(/corpus/i);
  });

  it('omits the warnings section when bundle has no warnings', () => {
    render(<ContextAssembledPanel bundle={bundle()} />);
    expect(screen.queryByTestId('context-panel-warnings')).toBeNull();
  });
});

describe('ContextAssembledPanel — footer', () => {
  it('renders the guardrail badge', () => {
    render(<ContextAssembledPanel bundle={bundle()} />);
    expect(screen.getByTestId('context-panel-guardrail').textContent).toMatch(
      /Only claims supported/i,
    );
  });

  it('renders per-section count summary', () => {
    const f = fact();
    const c = chunk();
    const p = pattern();
    const prov = provenance({ sourceId: f.recordId });
    render(
      <ContextAssembledPanel
        bundle={bundle({
          facts: [f],
          semanticChunks: [c],
          corpusPatterns: [p],
          provenance: [prov],
        })}
      />,
    );
    const footer = screen.getByTestId('context-panel-footer');
    expect(footer.textContent).toMatch(/1 facts/);
    expect(footer.textContent).toMatch(/1 chunks/);
    expect(footer.textContent).toMatch(/1 patterns/);
    expect(footer.textContent).toMatch(/1 citations/);
  });
});

describe('ContextAssembledPanel — a11y', () => {
  it('panel root has aria-live=polite and aria-label', () => {
    render(<ContextAssembledPanel bundle={bundle()} />);
    const root = screen.getByTestId('context-assembled-panel');
    expect(root).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveAttribute('aria-label', 'Context Assembled');
  });

  it('confidence dot carries aria-label with confidence percentage', () => {
    const f = fact();
    const p = provenance({ sourceId: f.recordId, confidence: 0.92 });
    render(<ContextAssembledPanel bundle={bundle({ facts: [f], provenance: [p] })} />);
    const dot = screen.getByTestId('context-panel-confidence-dot');
    expect(dot).toHaveAttribute('aria-label', 'Confidence 92 percent');
  });
});
