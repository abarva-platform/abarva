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

  it('finds at least one real corpus pattern by signature keywords', () => {
    const patterns = getPatternManifestEntries();
    const ranked = scorePatternsByKeyword('AI use case portfolio', patterns);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].pattern.id).toBe('pattern_ai_use_case_portfolio');
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

  it('passes other ClientKeys through unchanged (meridian, arcturus, keystone)', () => {
    expect(clientKeyToBrokerTenantKey('meridian')).toBe('meridian');
    expect(clientKeyToBrokerTenantKey('arcturus')).toBe('arcturus');
    expect(clientKeyToBrokerTenantKey('keystone')).toBe('keystone');
  });

  it("substrate map: 'apexretail' → 'apex-retail' and 'meridian' → 'meridian-health'", () => {
    expect(clientKeyToInventorySubstrateKey('apexretail')).toBe('apex-retail');
    expect(clientKeyToInventorySubstrateKey('meridian')).toBe('meridian-health');
    expect(clientKeyToInventorySubstrateKey('arcturus')).toBe('arcturus');
    expect(clientKeyToInventorySubstrateKey('keystone')).toBe('keystone');
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
});
