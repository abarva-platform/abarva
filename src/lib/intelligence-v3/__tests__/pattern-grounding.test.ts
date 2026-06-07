import {
  classifyPatternNamespace,
  requiredGroundingForText,
  isPatternBindable,
  selectGroundedPattern,
  filterCitationsToGrounding,
} from '@/lib/intelligence-v3/pattern-grounding';

describe('pattern-grounding namespace validation', () => {
  describe('classifyPatternNamespace', () => {
    it('classifies the treasury registry namespace (LSH-TMS-*)', () => {
      expect(classifyPatternNamespace('LSH-TMS-002')).toBe('treasury');
      expect(classifyPatternNamespace('lsh-tms-009')).toBe('treasury');
    });
    it('classifies the general Lakeshore corpus namespace (PAT-LSH-*)', () => {
      expect(classifyPatternNamespace('PAT-LSH-D18-00479')).toBe('lakeshore-corpus');
      expect(classifyPatternNamespace('pat-lsh-d18-00479')).toBe('lakeshore-corpus');
    });
    it('fails closed on unknown / empty ids', () => {
      expect(classifyPatternNamespace('NOPE-1')).toBe('unknown');
      expect(classifyPatternNamespace('')).toBe('unknown');
      expect(classifyPatternNamespace(null)).toBe('unknown');
    });
  });

  describe('requiredGroundingForText', () => {
    it('routes treasury/Kyriba use cases to the treasury namespace', () => {
      expect(requiredGroundingForText('Kyriba global treasury rollout')).toBe('treasury');
      expect(requiredGroundingForText('Bank connectivity and cash liquidity')).toBe('treasury');
    });
    it('routes non-treasury use cases to the corpus namespace', () => {
      expect(requiredGroundingForText('City and state procurement bid timing')).toBe('lakeshore-corpus');
    });
  });

  // Acceptance #1: known (in-namespace) pattern id passes through.
  it('accepts a known in-namespace pattern id', () => {
    expect(isPatternBindable('LSH-TMS-002', 'treasury')).toBe(true);
    expect(isPatternBindable('PAT-LSH-D01-00095', 'lakeshore-corpus')).toBe(true);
  });

  // Acceptance #2: unknown / cross-namespace pattern id is rejected.
  it('rejects cross-namespace and unknown pattern ids (fail closed)', () => {
    // PAT-LSH-D18-00479 is a real corpus slug but WRONG for a treasury card.
    expect(isPatternBindable('PAT-LSH-D18-00479', 'treasury')).toBe(false);
    expect(isPatternBindable('NOPE-1', 'treasury')).toBe(false);
    expect(isPatternBindable('LSH-TMS-002', 'unknown')).toBe(false);
  });

  // Acceptance #3: a Kyriba/treasury query binds a real LSH-TMS-* pattern, never
  // the off-namespace procurement corpus pattern.
  it('binds a real LSH-TMS-* pattern for a Kyriba treasury card', () => {
    const required = requiredGroundingForText('Kyriba global treasury rollout');
    const candidates = [
      { slug: 'pat-lsh-d18-00479', title: 'Prioritize City and State Procurement Calendars' },
      { slug: 'lsh-tms-002', title: 'Bank connectivity matrix clears before rollout' },
      { slug: 'lsh-tms-009', title: 'Payment approval and BEC controls' },
    ];
    const decision = selectGroundedPattern({ required, candidates, idOf: (r) => r.slug });
    expect(decision.bound?.slug).toBe('lsh-tms-002');
    expect(decision.boundNamespace).toBe('treasury');
    expect(decision.dropped.map((d) => d.id)).toContain('pat-lsh-d18-00479');
  });

  it('fails closed (binds nothing) when only off-namespace candidates exist', () => {
    const decision = selectGroundedPattern({
      required: 'treasury',
      candidates: [{ slug: 'pat-lsh-d18-00479' }],
      idOf: (r) => r.slug,
    });
    expect(decision.bound).toBeNull();
    expect(decision.dropped).toHaveLength(1);
  });

  // Acceptance #4: emitted citations cannot reference absent/cross-namespace ids.
  it('filters citations to the required grounding namespace', () => {
    const citations = [
      { id: 'PAT-LSH-D18-00479' },
      { id: 'LSH-TMS-002' },
      { id: 'BOGUS-XYZ' },
    ];
    const kept = filterCitationsToGrounding(citations, 'treasury', (c) => c.id);
    expect(kept.map((c) => c.id)).toEqual(['LSH-TMS-002']);
    expect(kept.some((c) => c.id === 'PAT-LSH-D18-00479')).toBe(false);
  });
});
