import { readFileSync } from 'fs';
import { join } from 'path';

import { buildKnowledgeFabricHealthView } from '@/lib/intelligence/knowledge-fabric-health';
import { corpusToPrimitives } from '@/lib/intelligence/indexer';
import { loadCorpus } from '@/lib/intelligence/loader';

describe('Knowledge Fabric health read model', () => {
  const corpus = loadCorpus({ loadedAt: '2026-04-28T00:00:00.000Z' });

  it('builds deterministic primitive counts from the loaded corpus', () => {
    const view = buildKnowledgeFabricHealthView(corpus);
    const primitives = corpusToPrimitives(corpus);

    expect(view.createdFrom).toBe('deterministic_knowledge_fabric_health_seed');
    expect(view.corpusLoadedAt).toBe('2026-04-28T00:00:00.000Z');
    expect(view.totalPrimitives).toBe(primitives.length);
    expect(view.primitiveCounts.pattern).toBe(corpus.patterns.length);
    expect(view.primitiveCounts.signal).toBe(corpus.signals.length);
    expect(view.primitiveCounts.solution).toBe(corpus.solutions.length);
    expect(view.primitiveCounts.contradiction).toBe(corpus.contradictions.length);
  });

  it('reports source, citation, and contradiction coverage without live writes', () => {
    const view = buildKnowledgeFabricHealthView(corpus);
    const primitives = corpusToPrimitives(corpus);

    expect(view.sourceCoverage.total).toBe(primitives.length);
    expect(view.sourceCoverage.backed).toBe(primitives.filter((primitive) => primitive.sourceId).length);
    expect(view.citationCoverage.total).toBe(primitives.length);
    expect(view.contradictionCoverage.corpusContradictions).toBe(corpus.contradictions.length);
    expect(view.contradictionCoverage.detectedFindings).toBeGreaterThanOrEqual(0);
    expect(view.storeWriteStatus).toBe('not_live');
    expect(view.disclaimer).toMatch(/does not index, persist, or mutate/i);
    expect(view.caveats.join(' ')).toMatch(/no graph, vector, object, or ledger writes/i);
  });

  it('is stable for repeated reads of the same corpus', () => {
    const first = buildKnowledgeFabricHealthView(corpus);
    const second = buildKnowledgeFabricHealthView(corpus);

    expect(second).toEqual(first);
  });

  it('keeps the health module isolated from graph/vector/store writers and runtime IO', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/intelligence/knowledge-fabric-health.ts'),
      'utf8',
    );

    expect(source).not.toMatch(/indexCorpus|createKnowledgeFabric|resolveKnowledgeFabricWriteMode/);
    expect(source).not.toMatch(/KnowledgeFabricStores|architecture\/knowledge-fabric/);
    expect(source).not.toMatch(/fetch\(|supabase|openai|anthropic|claude/i);
    expect(source).not.toMatch(/Date\.now|Math\.random/);
  });
});
