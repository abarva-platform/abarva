import { performance } from 'node:perf_hooks';

import { corpus, loadCorpus } from '../../src/lib/intelligence';
import type { PatternSeed } from '../../src/lib/intelligence/seed-types';
import type { SolutionSeed } from '../../src/lib/intelligence/seed-solutions';

describe('intelligence corpus loader', () => {
  it('loads the shipped Phase 1 corpus counts', () => {
    expect(corpus.patterns).toHaveLength(145);
    expect(corpus.signals).toHaveLength(30);
    expect(corpus.solutions).toHaveLength(9);
    expect(corpus.contradictions).toHaveLength(10);
  });

  it('indexes every loaded entity by id', () => {
    const allEntities = [
      ...corpus.patterns,
      ...corpus.signals,
      ...corpus.solutions,
      ...corpus.contradictions,
    ];

    expect(corpus.byId.size).toBe(allEntities.length);

    for (const entity of allEntities) {
      expect(corpus.byId.get(entity.id)).toBe(entity);
    }
  });

  it('groups patterns by domain and tier', () => {
    expect(corpus.byDomain.get('ai_programs')).toHaveLength(14);
    expect(corpus.byDomain.get('meta')).toHaveLength(6);
    expect(corpus.byTier.get('M')).toHaveLength(6);
    expect(corpus.loadedAt).toEqual(expect.any(String));
  });

  it('keeps solution pattern, signal, and composition references closed over loaded ids', () => {
    for (const solution of corpus.solutions) {
      for (const patternId of solution.patternIds) {
        expect(corpus.patternsById.has(patternId)).toBe(true);
      }

      for (const signalId of solution.signalIds) {
        expect(corpus.signalsById.has(signalId)).toBe(true);
      }

      for (const component of solution.compositionManifest) {
        const index = component.componentKind === 'pattern' ? corpus.patternsById : corpus.signalsById;
        expect(index.has(component.componentId)).toBe(true);
      }
    }
  });

  it('keeps contradiction affectedPatternIds closed over loaded pattern ids', () => {
    for (const contradiction of corpus.contradictions) {
      for (const patternId of contradiction.affectedPatternIds) {
        expect(corpus.patternsById.has(patternId)).toBe(true);
      }
    }
  });

  it('fails fast on duplicate ids', () => {
    const duplicatePattern = { ...corpus.patterns[0] };

    expect(() =>
      loadCorpus({
        patterns: [corpus.patterns[0], duplicatePattern],
        signals: [],
        solutions: [],
        contradictions: [],
      }),
    ).toThrow(/Duplicate pattern id/);
  });

  it('fails fast on invalid solution references and invalid schema arrays', () => {
    const badSolution: SolutionSeed = {
      ...corpus.solutions[0],
      id: 'SOL-BAD-REF',
      patternIds: ['PAT-DOES-NOT-EXIST'],
      signalIds: [],
      compositionManifest: [],
    };

    expect(() =>
      loadCorpus({
        patterns: corpus.patterns,
        signals: corpus.signals,
        solutions: [badSolution],
        contradictions: [],
      }),
    ).toThrow(/unknown pattern id: PAT-DOES-NOT-EXIST/);

    expect(() =>
      loadCorpus({
        patterns: corpus.patterns,
        signals: corpus.signals,
        solutions: [{ ...badSolution, patternIds: [''] }],
        contradictions: [],
      }),
    ).toThrow(/invalid patternIds/);
  });

  it('fails fast on invalid contradiction references', () => {
    expect(() =>
      loadCorpus({
        patterns: corpus.patterns,
        signals: [],
        solutions: [],
        contradictions: [
          {
            ...corpus.contradictions[0],
            id: 'CON-BAD-REF',
            affectedPatternIds: ['PAT-DOES-NOT-EXIST'],
          },
        ],
      }),
    ).toThrow(/unknown pattern id: PAT-DOES-NOT-EXIST/);
  });

  it('loads under 100ms for the shipped corpus', () => {
    const startedAt = performance.now();
    loadCorpus();
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(100);
  });

  it('accepts optional sourcing extension fields without changing existing seeds', () => {
    const extendedPattern = {
      ...corpus.patterns[0],
      id: 'PAT-SRC-EXTENSION-SMOKE',
      slug: 'sourcing-extension-smoke',
      category: 'services',
      vendorClass: 'service',
      vendorLandscape: [
        {
          vendorName: 'Example Services',
          tier: 'specialist',
          positioning: 'Used only to verify the optional sourcing extension shape.',
          sourceBasis: [
            {
              type: 'founder-data-gap',
              label: 'No public claim; type-shape smoke fixture only',
            },
          ],
        },
      ],
      pricingBenchmarks: [
        {
          label: 'Founder data required',
          model: 'unknown',
          sourceBasis: [
            {
              type: 'founder-data-gap',
              label: 'Pricing intentionally unspecified',
            },
          ],
          confidence: 0.5,
        },
      ],
      standardClauses: [
        {
          clauseArea: 'Exit assistance',
          buyerPosition: 'Buyer requires transition support terms before award.',
        },
      ],
      negotiationLevers: [
        {
          lever: 'Scope boundary',
          whenToUse: 'Use when proposal scope and retained-buyer scope are not separated.',
          buyerAsk: 'Separate base scope, transition scope, and optional advisory scope.',
        },
      ],
      riskFactors: [
        {
          id: 'risk-scope-drift',
          label: 'Scope drift',
          severity: 'medium',
          detectionSignals: ['Proposal relies on undefined retained responsibilities.'],
          mitigations: ['Require a responsibility matrix before BAFO.'],
        },
      ],
      industryVariants: [
        {
          industry: 'cross_industry',
          modifier: 'No industry-specific modifier for the smoke fixture.',
        },
      ],
    } satisfies PatternSeed;

    const loaded = loadCorpus({
      patterns: [extendedPattern],
      signals: [],
      solutions: [],
      contradictions: [],
    });

    expect(loaded.patternsById.get('PAT-SRC-EXTENSION-SMOKE')).toMatchObject({
      category: 'services',
      vendorClass: 'service',
    });
  });
});
