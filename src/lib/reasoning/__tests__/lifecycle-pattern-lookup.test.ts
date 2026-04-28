/**
 * lifecycle-pattern-lookup tests
 *
 * Deterministic: no network, no LLM calls, no randomness. Verifies that the
 * union pattern catalogue resolves both source-event and program patterns by
 * ID and rejects unknown IDs.
 */

import {
  findLifecyclePattern,
  getAllLifecyclePatterns,
  getAllLifecyclePatternIds,
  isLifecyclePatternId,
} from '@/lib/reasoning/lifecycle-pattern-lookup';

describe('lifecycle-pattern-lookup', () => {
  it('returns the canonical AMS source-lifecycle pattern by patternId', () => {
    const p = findLifecyclePattern('PAT-SRC-AMS-001');
    expect(p).toBeDefined();
    expect(p?.kind).toBe('lifecycle');
    expect(p?.patternId).toBe('PAT-SRC-AMS-001');
    expect(p?.title).toMatch(/AMS/);
  });

  it('returns the canonical CDP program-lifecycle pattern by patternId', () => {
    const p = findLifecyclePattern('PAT-PRG-CDP-001');
    expect(p).toBeDefined();
    expect(p?.kind).toBe('lifecycle');
    expect(p?.patternId).toBe('PAT-PRG-CDP-001');
  });

  it('returns undefined for unknown pattern IDs', () => {
    expect(findLifecyclePattern('PAT-SRC-NONEXISTENT-999')).toBeUndefined();
    expect(findLifecyclePattern('')).toBeUndefined();
  });

  it('isLifecyclePatternId reflects findLifecyclePattern', () => {
    expect(isLifecyclePatternId('PAT-SRC-AMS-001')).toBe(true);
    expect(isLifecyclePatternId('PAT-PRG-CDP-001')).toBe(true);
    expect(isLifecyclePatternId('PAT-SRC-001')).toBe(false); // knowledge pattern
    expect(isLifecyclePatternId('not-a-real-id')).toBe(false);
  });

  it('getAllLifecyclePatterns returns the full union catalogue with stable IDs', () => {
    const all = getAllLifecyclePatterns();
    expect(all.length).toBeGreaterThanOrEqual(13);
    const ids = getAllLifecyclePatternIds();
    expect(ids).toContain('PAT-SRC-AMS-001');
    expect(ids).toContain('PAT-PRG-CDP-001');
    expect(ids).toContain('PAT-SRC-RFP-001');
    expect(ids).toContain('PAT-PRG-DATA-FAB-001');
    // No duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every returned pattern has a non-empty body and at least one stage', () => {
    for (const p of getAllLifecyclePatterns()) {
      expect(p.body.length).toBeGreaterThan(0);
      expect(p.stages.length).toBeGreaterThan(0);
    }
  });
});
