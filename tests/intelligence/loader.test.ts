import { performance } from 'node:perf_hooks';

import { corpus, loadCorpus } from '../../src/lib/intelligence';
import type { PatternSeed } from '../../src/lib/intelligence/seed-types';
import type { SolutionSeed } from '../../src/lib/intelligence/seed-solutions';

describe('intelligence corpus loader', () => {
  it('loads the shipped Phase 1 corpus counts', () => {
    expect(corpus.patterns).toHaveLength(510);
    expect(corpus.signals).toHaveLength(30);
    expect(corpus.solutions).toHaveLength(9);
    expect(corpus.contradictions).toHaveLength(10);
  });

  it('loads Source pricing, BAFO, and retail overlay pilot patterns', () => {
    expect(corpus.patternsById.get('PAT-SRC-PNG-001')).toMatchObject({
      slug: 'ams-transition-cost-burial',
      category: 'pricing_intelligence',
      vendorClass: 'service',
    });
    expect(corpus.patternsById.get('PAT-SRC-PNG-007')?.industryVariants?.[0]).toMatchObject({
      industry: 'retail_cpg',
    });
    expect(corpus.patternsById.get('PAT-SRC-PNG-009')?.negotiationLevers?.[0]).toMatchObject({
      lever: 'Price for term',
    });
    expect(corpus.patternsById.get('PAT-SRC-PNG-011')?.standardClauses?.[0]).toMatchObject({
      clauseArea: 'Benchmarking and exit',
    });
    expect(corpus.patternsById.get('PAT-SRC-BAFO-003')).toMatchObject({
      slug: 'transition-holdback-and-warranty',
      category: 'contract_intelligence',
      vendorClass: 'service',
    });
    expect(corpus.patternsById.get('PAT-SRC-BAFO-008')?.standardClauses?.[0]).toMatchObject({
      clauseArea: 'Benchmarking',
    });
    expect(corpus.patternsById.get('PAT-SRC-LEV-008')).toMatchObject({
      slug: 'benchmark-remedy-envelope',
      category: 'contract_intelligence',
      vendorClass: 'service',
    });
    expect(corpus.patternsById.get('PAT-SRC-LEV-018')?.negotiationLevers?.[0]).toMatchObject({
      lever: 'Redline value control',
    });
    expect(corpus.patternsById.get('PAT-SRC-RIT-001')).toMatchObject({
      slug: 'pos-peak-freeze-readiness',
      vertical: 'retail-cpg',
      category: 'customer_facing',
    });
    expect(corpus.patternsById.get('PAT-SRC-RIT-005')?.riskFactors?.[0]).toMatchObject({
      id: 'risk-inventory-authority-ambiguity',
    });
    expect(corpus.patternsById.get('PAT-SRC-AFM-001')).toMatchObject({
      slug: 'incumbent-renegotiation-fact-base',
      category: 'process_methodology',
    });
    expect(corpus.patternsById.get('PAT-SRC-AFM-012')?.riskFactors?.[0]).toMatchObject({
      id: 'risk-benchmark-theater',
    });
    expect(corpus.patternsById.get('PAT-SRC-VPR-WIPRO')).toMatchObject({
      slug: 'wipro-profile-evidence-requirements',
      category: 'services',
    });
    expect(corpus.patternsById.get('PAT-SRC-VPR-WIPRO')?.pricingBenchmarks?.[0].sourceBasis[0]).toMatchObject({
      type: 'founder-data-gap',
    });
    expect(corpus.patternsById.get('PAT-SRC-BEN-AMS-FTE-RATE-CARD')).toMatchObject({
      slug: 'ams-fte-rate-card-benchmark-governance',
      category: 'pricing_intelligence',
    });
    const amsRateCardBenchmark = corpus.patternsById.get('PAT-SRC-BEN-AMS-FTE-RATE-CARD')?.pricingBenchmarks?.[0];
    expect(amsRateCardBenchmark).toMatchObject({
      sourceBasis: [expect.objectContaining({ type: 'founder-data-gap' })],
    });
    expect(amsRateCardBenchmark).not.toHaveProperty('rangeLow');
    expect(amsRateCardBenchmark).not.toHaveProperty('rangeHigh');
    expect(amsRateCardBenchmark).not.toHaveProperty('median');
    expect(corpus.patternsById.get('PAT-SRC-CGV-TENANT-EVIDENCE-SCOPING')).toMatchObject({
      slug: 'tenant-evidence-scoping',
      category: 'process_methodology',
    });
    expect(corpus.patternsById.get('PAT-SRC-CGV-SAVINGS-CLAIM-GATE')?.riskFactors?.[0]).toMatchObject({
      id: 'risk-pattern-generated-savings',
    });
    expect(corpus.patternsById.get('PAT-SRC-VPF-NO-EVIDENCE-NO-NUMBER')).toMatchObject({
      slug: 'no-evidence-no-number',
      category: 'pricing_intelligence',
    });
    expect(corpus.patternsById.get('PAT-SRC-VPF-BAFO-DELTA-LEDGER')?.negotiationLevers?.[0]).toMatchObject({
      lever: 'Evidence-backed value proof',
    });
    expect(corpus.patternsById.get('PAT-SRC-RFP-EVAL-018')).toMatchObject({
      slug: 'weight-set-governance',
      category: 'process_methodology',
    });
    expect(corpus.patternsById.get('PAT-SRC-RFP-EVAL-023')?.negotiationLevers?.[0]).toMatchObject({
      lever: 'Tradeoff clarity before BAFO',
    });
    expect(corpus.patternsById.get('PAT-SRC-ART-PRICING-WORKBOOK')).toMatchObject({
      slug: 'pricing-normalization-workbook-quality-gate',
      category: 'pricing_intelligence',
    });
    expect(corpus.patternsById.get('PAT-SRC-ART-DEAL-PACK')?.riskFactors?.[0]).toMatchObject({
      id: 'risk-deal-pack-caveat-loss',
    });
  });

  it('indexes every loaded entity by id', () => {
    const allEntities = [
      ...corpus.patterns,
      ...corpus.signals,
      ...corpus.solutions,
      ...corpus.contradictions,
      ...corpus.metrics,
    ];

    expect(corpus.byId.size).toBe(allEntities.length);

    for (const entity of allEntities) {
      expect(corpus.byId.get(entity.id)).toBe(entity);
    }
  });

  it('groups patterns by domain and tier', () => {
    expect(corpus.byDomain.get('ai_programs')).toHaveLength(27);
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

  it('keeps pattern graph references closed over loaded corpus ids', () => {
    for (const pattern of corpus.patterns) {
      for (const patternId of pattern.relatedPatternIds) {
        expect(corpus.patternsById.has(patternId)).toBe(true);
      }

      for (const patternId of pattern.derivedFromPatternIds) {
        expect(corpus.patternsById.has(patternId)).toBe(true);
      }

      for (const contradictionId of pattern.taggedContradictionIds) {
        expect(corpus.contradictionsById.has(contradictionId)).toBe(true);
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
