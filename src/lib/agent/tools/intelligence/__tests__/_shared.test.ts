import {
  clientKeyToBrokerTenantKey,
  clientKeyToInventorySubstrateKey,
  filterPatternsByScope,
  scorePatternsByKeyword,
  tokenize,
  type PatternManifestEntry,
} from '../_shared';
import { buildSentinelContextBundle } from '@/lib/intelligence/sentinel-broker-adapter';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';

describe('tokenize', () => {
  it('lowercases and strips stopwords + punctuation', () => {
    expect(tokenize('Show me the AMS Consolidation pattern!')).toEqual([
      'ams',
      'consolidation',
      'pattern',
    ]);
  });

  it('drops single-character tokens', () => {
    expect(tokenize('a b cd')).toEqual(['cd']);
  });

  it('keeps hyphenated terms intact', () => {
    expect(tokenize('vendor-lock-in risk')).toEqual(['vendor-lock-in', 'risk']);
  });

  it('returns empty for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('scorePatternsByKeyword', () => {
  const fakePattern = (overrides: Partial<PatternManifestEntry>): PatternManifestEntry => ({
    id: overrides.id ?? 'pat_test',
    slug: overrides.slug ?? 'test',
    name: overrides.name ?? 'Test',
    version: null,
    status: 'validated',
    category: null,
    crossIndustry: false,
    sectorApplicability: [],
    primarySector: null,
    shortDescription: null,
    longDescription: null,
    confidenceFloor: null,
    nObservationsFloor: null,
    relatedPatternIds: [],
    regulatoryFrameworkIds: [],
    sourceFile: 'test.ts',
    sourceSection: null,
    lastUpdatedAt: '2026-01-01',
    contentHash: 'hash',
    evidenceCount: 0,
    observationCount: 0,
    observations: [],
    demoCritical: false,
    sections: [],
    triggerSymptoms: [],
    detectionSignals: [],
    diagnosticQuestions: [],
    evidenceRequirements: [],
    interventions: [],
    ...overrides,
  });

  it('ranks by token-overlap and drops zero-score entries', () => {
    const patterns: PatternManifestEntry[] = [
      fakePattern({
        id: 'p1',
        name: 'CDP Activation',
        shortDescription: 'Customer data platform programme',
      }),
      fakePattern({
        id: 'p2',
        name: 'Vendor Lock-in Mitigation',
        shortDescription: 'Avoiding vendor concentration',
      }),
      fakePattern({ id: 'p3', name: 'Unrelated Pattern', shortDescription: 'Quartz tiling' }),
    ];
    const out = scorePatternsByKeyword('vendor lock-in concentration', patterns);
    expect(out[0].pattern.id).toBe('p2');
    expect(out.every((entry) => entry.score > 0)).toBe(true);
    expect(out.find((entry) => entry.pattern.id === 'p3')).toBeUndefined();
  });

  it('returns empty when the query is all stopwords', () => {
    const patterns = [fakePattern({ id: 'p1' })];
    expect(scorePatternsByKeyword('show me the', patterns)).toEqual([]);
  });

  /**
   * This case used to assert `ranked[0].pattern.id` was
   * `'pattern_ai_use_case_portfolio'` for the query 'AI use case
   * portfolio'. Two things were wrong with it and only the first made
   * it red:
   *
   * 1. The corpus re-keyed `pattern_*` slugs to `PAT-*` codes, so that
   *    id resolves to nothing. The same pattern is `PAT-AI-004` today.
   * 2. It was never a relevance assertion. Scores are a count of query
   *    tokens present, so this four-token query maxes out at 4 and 72
   *    corpus entries reach it. Rank 1 among them is decided by
   *    manifest insertion order, not by relevance — naming `PAT-AI-004`
   *    instead would still fail, because a different entry is first.
   *
   * What is worth pinning is the scorer's actual contract, stated
   * without naming any entry: a pattern searched for by its own name
   * reaches the top score. That holds for every entry, so it is
   * sampled across the corpus rather than asserted about a favourite.
   */
  it('scores a real corpus pattern at the top score when queried by its own name', () => {
    const patterns = getPatternManifestEntries();
    expect(patterns.length).toBeGreaterThan(0);

    // Deterministic spread over the corpus rather than the first few,
    // which share a source file and would prove less.
    const sampled = patterns.filter((_entry, index) => index % 400 === 0);
    expect(sampled.length).toBeGreaterThan(1);

    for (const target of sampled) {
      const ranked = scorePatternsByKeyword(target.name, patterns);
      expect(ranked.length).toBeGreaterThan(0);
      const scored = ranked.find((entry) => entry.pattern.id === target.id);
      expect(scored).toBeDefined();
      expect(scored?.score).toBe(ranked[0].score);
    }
  });

  /**
   * Documents current behaviour, deliberately — it is not a control.
   *
   * Matching is `haystack.includes(token)`, so a short token matches
   * inside unrelated words: 'ai' hits 'available'. Over the real corpus
   * the four-token query above scores 3,524 of 3,569 entries above zero.
   * That is why the assertion this replaced could not mean what it read
   * like. The property is asserted here rather than the counts, which
   * would go stale with the next corpus load.
   *
   * When the scorer gains word-boundary matching this case must fail.
   * That failure is the intended signal — update it then, with the
   * reason, rather than working around it.
   */
  it('currently matches a short token inside an unrelated word (known weakness)', () => {
    const patterns = [
      fakePattern({
        id: 'p-unrelated',
        name: 'Warehouse Slotting',
        shortDescription: 'Capacity is available across the network',
      }),
    ];
    const out = scorePatternsByKeyword('ai', patterns);
    expect(out).toHaveLength(1);
    expect(out[0].pattern.id).toBe('p-unrelated');
  });
});

describe('filterPatternsByScope', () => {
  const patterns = getPatternManifestEntries();

  it("'all' returns the full corpus", () => {
    expect(filterPatternsByScope(patterns, 'all')).toEqual(patterns);
  });

  it("'evidence' filters to evidence-bearing patterns", () => {
    const filtered = filterPatternsByScope(patterns, 'evidence');
    expect(filtered.length).toBeLessThanOrEqual(patterns.length);
    // The corpus has patterns whose body references evidence — the
    // filter is descriptive, not exclusive, so we just confirm the
    // shape (subset, possibly equal).
    expect(filtered.every((pattern) => patterns.includes(pattern))).toBe(true);
  });

  it('unknown scope passes through (defensive)', () => {
    const filtered = filterPatternsByScope(patterns, 'all');
    expect(filtered).toEqual(patterns);
  });
});

describe('clientKeyToBrokerTenantKey · PR-INT-G Apex tenant key split', () => {
  it("maps 'apexretail' (app ClientKey) to 'apex-retail' (broker tenant key)", () => {
    expect(clientKeyToBrokerTenantKey('apexretail')).toBe('apex-retail');
  });

  it('maps First Capital legacy keys to the broker tenant key', () => {
    expect(clientKeyToBrokerTenantKey('arcturus')).toBe('first-capital');
    expect(clientKeyToBrokerTenantKey('firstcapital')).toBe('first-capital');
  });

  it('passes broker-aligned ClientKeys through unchanged', () => {
    expect(clientKeyToBrokerTenantKey('meridian')).toBe('meridian');
    expect(clientKeyToBrokerTenantKey('skyharbor-air')).toBe('skyharbor-air');
  });

  it("substrate map points app client keys at persisted setup-data tenant keys", () => {
    expect(clientKeyToInventorySubstrateKey('apexretail')).toBe('apex-retail');
    expect(clientKeyToInventorySubstrateKey('meridian')).toBe('meridian-health');
    expect(clientKeyToInventorySubstrateKey('arcturus')).toBe('first-capital');
    expect(clientKeyToInventorySubstrateKey('firstcapital')).toBe('first-capital');
    expect(clientKeyToInventorySubstrateKey('first-capital')).toBe('first-capital');
    // STRESS-P0-010 regression — chunks have tenant_key='northstar-clinical'
    // to match clients.tenant_key; resolver must map app key → that value
    expect(clientKeyToInventorySubstrateKey('northstar')).toBe('northstar-clinical');
    expect(clientKeyToInventorySubstrateKey('northstar-clinical')).toBe('northstar-clinical');
    expect(clientKeyToInventorySubstrateKey('skyharbor')).toBe('skyharbor-air');
    expect(clientKeyToInventorySubstrateKey('skyharbor-air')).toBe('skyharbor-air');
  });

  it('mapped tenant key resolves a non-blocked broker bundle for Apex', () => {
    // Regression guard: before the mapping, resolveSentinelTenant
    // returned `'apexretail'` and the broker treated it as an unknown
    // tenant. With the mapping, the broker finds the rich Apex data
    // room and returns items + citations.
    const blocked = buildSentinelContextBundle({ tenantKey: 'apexretail' });
    expect(blocked.items).toHaveLength(0);
    expect(blocked.blockedItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'unknown_tenant' })]),
    );

    const mapped = buildSentinelContextBundle({
      tenantKey: clientKeyToBrokerTenantKey('apexretail'),
    });
    expect(mapped.items.length).toBeGreaterThan(0);
    expect(mapped.citations.length).toBeGreaterThan(0);
    expect(
      mapped.blockedItems.some((entry) => entry.reason === 'unknown_tenant'),
    ).toBe(false);
  });

  it('mapped tenant key resolves a non-blocked broker bundle for First Capital', () => {
    const blocked = buildSentinelContextBundle({ tenantKey: 'arcturus' });
    expect(blocked.items).toHaveLength(0);
    expect(blocked.blockedItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: 'unknown_tenant' })]),
    );

    const mapped = buildSentinelContextBundle({
      tenantKey: clientKeyToBrokerTenantKey('arcturus'),
    });
    expect(mapped.items.length).toBeGreaterThan(0);
    expect(
      mapped.blockedItems.some((entry) => entry.reason === 'unknown_tenant'),
    ).toBe(false);
  });
});
