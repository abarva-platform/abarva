/**
 * Wave 30 PAT3 — Vertical Pack: Retail
 *
 * Verifies the retail vertical pattern pack:
 * - 2 patterns present (retail data platform sourcing, retail AI failure modes)
 * - Critical criteria are flagged correctly
 * - Sentinel signals are well-formed
 * - BAFO readiness signals are present
 * - Registry entries conform to PatternRegistryEntry format
 * - Summary counts are accurate
 */

import {
  getRetailVerticalPatterns,
  getRetailPatternsBySubsector,
  getRetailRegistryEntries,
  getAllRetailSentinelSignals,
  getCriticalRetailCriteria,
  getAllRetailBafoSignals,
  summarizeRetailVerticalPack,
  RETAIL_VERTICAL_PATTERNS,
  RETAIL_REGISTRY_ENTRIES,
} from '@/lib/solutions/vertical-pack-retail';

import { evaluatePatternReadinessGate } from '@/lib/solutions/pattern-registry-format';

// ---------------------------------------------------------------------------
// getRetailVerticalPatterns()
// ---------------------------------------------------------------------------

describe('PAT3 — getRetailVerticalPatterns()', () => {
  it('returns a non-empty array', () => {
    const patterns = getRetailVerticalPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('returns at least 2 patterns', () => {
    const patterns = getRetailVerticalPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(2);
  });

  it('every pattern has required fields', () => {
    const patterns = getRetailVerticalPatterns();
    for (const p of patterns) {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.slug).toBe('string');
      expect(p.slug.length).toBeGreaterThan(0);
      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);
      expect(typeof p.shortDescription).toBe('string');
      expect(p.shortDescription.length).toBeGreaterThan(0);
      expect(typeof p.primaryQuestion).toBe('string');
      expect(p.primaryQuestion.length).toBeGreaterThan(0);
      expect(Array.isArray(p.criteria)).toBe(true);
      expect(Array.isArray(p.failureModes)).toBe(true);
      expect(Array.isArray(p.bafoReadinessSignals)).toBe(true);
      expect(Array.isArray(p.sentinelSignals)).toBe(true);
      expect(Array.isArray(p.retailSubsector)).toBe(true);
      expect(p.retailSubsector.length).toBeGreaterThan(0);
      expect(p.createdFrom).toBe('pat3_w30_vertical_pack_retail');
    }
  });

  it('all pattern IDs are unique', () => {
    const patterns = getRetailVerticalPatterns();
    const ids = patterns.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all pattern slugs are unique', () => {
    const patterns = getRetailVerticalPatterns();
    const slugs = patterns.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });
});

// ---------------------------------------------------------------------------
// Retail data platform pattern
// ---------------------------------------------------------------------------

describe('PAT3 — Retail data platform sourcing pattern', () => {
  it('retail-data-platform-sourcing pattern is present', () => {
    const patterns = getRetailVerticalPatterns();
    const dp = patterns.find((p) => p.slug === 'retail-data-platform-sourcing');
    expect(dp).toBeDefined();
  });

  it('retail data platform has at least 4 criteria', () => {
    const dp = getRetailVerticalPatterns().find((p) => p.slug === 'retail-data-platform-sourcing');
    expect(dp!.criteria.length).toBeGreaterThanOrEqual(4);
  });

  it('retail data platform has at least one critical criterion', () => {
    const dp = getRetailVerticalPatterns().find((p) => p.slug === 'retail-data-platform-sourcing');
    const critical = dp!.criteria.filter((c) => c.severity === 'critical');
    expect(critical.length).toBeGreaterThan(0);
  });

  it('retail data platform has holiday season considerations', () => {
    const dp = getRetailVerticalPatterns().find((p) => p.slug === 'retail-data-platform-sourcing');
    expect(Array.isArray(dp!.holidaySeasonConsiderations)).toBe(true);
    expect(dp!.holidaySeasonConsiderations.length).toBeGreaterThan(0);
  });

  it('retail data platform has at least one failure mode', () => {
    const dp = getRetailVerticalPatterns().find((p) => p.slug === 'retail-data-platform-sourcing');
    expect(dp!.failureModes.length).toBeGreaterThan(0);
  });

  it('retail data platform has BAFO readiness signals', () => {
    const dp = getRetailVerticalPatterns().find((p) => p.slug === 'retail-data-platform-sourcing');
    expect(dp!.bafoReadinessSignals.length).toBeGreaterThan(0);
  });

  it('every criterion has retailSpecific: true', () => {
    const dp = getRetailVerticalPatterns().find((p) => p.slug === 'retail-data-platform-sourcing');
    expect(dp!.criteria.every((c) => c.retailSpecific === true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Retail AI failure modes pattern
// ---------------------------------------------------------------------------

describe('PAT3 — Retail AI failure modes pattern', () => {
  it('retail-ai-program-failure-modes pattern is present', () => {
    const patterns = getRetailVerticalPatterns();
    const ai = patterns.find((p) => p.slug === 'retail-ai-program-failure-modes');
    expect(ai).toBeDefined();
  });

  it('retail AI pattern has at least 2 failure modes', () => {
    const ai = getRetailVerticalPatterns().find((p) => p.slug === 'retail-ai-program-failure-modes');
    expect(ai!.failureModes.length).toBeGreaterThanOrEqual(2);
  });

  it('every failure mode has retailContext field', () => {
    const ai = getRetailVerticalPatterns().find((p) => p.slug === 'retail-ai-program-failure-modes');
    for (const fm of ai!.failureModes) {
      expect(typeof fm.retailContext).toBe('string');
      expect(fm.retailContext.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getRetailPatternsBySubsector()
// ---------------------------------------------------------------------------

describe('PAT3 — getRetailPatternsBySubsector()', () => {
  it('returns patterns matching grocery subsector', () => {
    const results = getRetailPatternsBySubsector('grocery');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.retailSubsector.includes('grocery'))).toBe(true);
  });

  it('returns empty for unknown subsector', () => {
    const results = getRetailPatternsBySubsector('unknown-subsector-xyz');
    expect(results.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getRetailRegistryEntries()
// ---------------------------------------------------------------------------

describe('PAT3 — getRetailRegistryEntries()', () => {
  it('returns an array of PatternRegistryEntry', () => {
    const entries = getRetailRegistryEntries();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every entry passes the pattern readiness gate', () => {
    const entries = getRetailRegistryEntries();
    for (const entry of entries) {
      const result = evaluatePatternReadinessGate(entry);
      if (!result.isReady) {
        const failed = result.results.filter((r) => !r.passed).map((r) => `${r.gateId}: ${r.detail}`);
        throw new Error(`Entry ${entry.patternId} failed readiness gate:\n${failed.join('\n')}`);
      }
      expect(result.isReady).toBe(true);
    }
  });

  it('all registry entries have createdFrom pat3_w30_vertical_pack_retail', () => {
    const entries = getRetailRegistryEntries();
    expect(entries.every((e) => e.createdFrom === 'pat3_w30_vertical_pack_retail')).toBe(true);
  });

  it('all registry entries have authoredInWave wave-30', () => {
    const entries = getRetailRegistryEntries();
    expect(entries.every((e) => e.authoredInWave === 'wave-30')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('PAT3 — getAllRetailSentinelSignals()', () => {
  it('returns an array of strings', () => {
    const signals = getAllRetailSentinelSignals();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.every((s) => typeof s === 'string')).toBe(true);
  });

  it('returns a non-empty array', () => {
    const signals = getAllRetailSentinelSignals();
    expect(signals.length).toBeGreaterThan(0);
  });
});

describe('PAT3 — getCriticalRetailCriteria()', () => {
  it('returns an array of RetailEvaluationCriterion', () => {
    const criteria = getCriticalRetailCriteria();
    expect(Array.isArray(criteria)).toBe(true);
  });

  it('all returned criteria have severity critical', () => {
    const criteria = getCriticalRetailCriteria();
    expect(criteria.every((c) => c.severity === 'critical')).toBe(true);
  });

  it('returns at least one critical criterion', () => {
    const criteria = getCriticalRetailCriteria();
    expect(criteria.length).toBeGreaterThan(0);
  });
});

describe('PAT3 — getAllRetailBafoSignals()', () => {
  it('returns a non-empty array of strings', () => {
    const signals = getAllRetailBafoSignals();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((s) => typeof s === 'string')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// summarizeRetailVerticalPack()
// ---------------------------------------------------------------------------

describe('PAT3 — summarizeRetailVerticalPack()', () => {
  it('returns a summary with correct totalPatterns', () => {
    const summary = summarizeRetailVerticalPack();
    expect(summary.totalPatterns).toBe(RETAIL_VERTICAL_PATTERNS.length);
  });

  it('totalCriteria equals sum of criteria across all patterns', () => {
    const expected = RETAIL_VERTICAL_PATTERNS.reduce((sum, p) => sum + p.criteria.length, 0);
    const summary = summarizeRetailVerticalPack();
    expect(summary.totalCriteria).toBe(expected);
  });

  it('totalFailureModes equals sum of failureModes across all patterns', () => {
    const expected = RETAIL_VERTICAL_PATTERNS.reduce((sum, p) => sum + p.failureModes.length, 0);
    const summary = summarizeRetailVerticalPack();
    expect(summary.totalFailureModes).toBe(expected);
  });

  it('totalSentinelSignals > 0', () => {
    const summary = summarizeRetailVerticalPack();
    expect(summary.totalSentinelSignals).toBeGreaterThan(0);
  });

  it('totalBafoSignals > 0', () => {
    const summary = summarizeRetailVerticalPack();
    expect(summary.totalBafoSignals).toBeGreaterThan(0);
  });

  it('criticalCriteriaCount > 0', () => {
    const summary = summarizeRetailVerticalPack();
    expect(summary.criticalCriteriaCount).toBeGreaterThan(0);
  });

  it('subsectorsAdressed includes grocery', () => {
    const summary = summarizeRetailVerticalPack();
    expect(summary.subsectorsAdressed).toContain('grocery');
  });

  it('result has deterministicSeed: true', () => {
    const summary = summarizeRetailVerticalPack();
    expect(summary.deterministicSeed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Constant data integrity
// ---------------------------------------------------------------------------

describe('PAT3 — RETAIL_VERTICAL_PATTERNS constant', () => {
  it('is a readonly array', () => {
    expect(Array.isArray(RETAIL_VERTICAL_PATTERNS)).toBe(true);
  });

  it('all patterns have holiday season considerations', () => {
    for (const p of RETAIL_VERTICAL_PATTERNS) {
      expect(Array.isArray(p.holidaySeasonConsiderations)).toBe(true);
    }
  });
});

describe('PAT3 — RETAIL_REGISTRY_ENTRIES constant', () => {
  it('is a readonly array', () => {
    expect(Array.isArray(RETAIL_REGISTRY_ENTRIES)).toBe(true);
  });

  it('count matches RETAIL_VERTICAL_PATTERNS count', () => {
    expect(RETAIL_REGISTRY_ENTRIES.length).toBe(RETAIL_VERTICAL_PATTERNS.length);
  });
});
