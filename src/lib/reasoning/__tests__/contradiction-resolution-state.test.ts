/**
 * Contradiction resolution state tests
 *
 * Deterministic: no randomness, no time dependency, no network.
 */

import {
  _resetForTests,
  getResolved,
  getResolvedAt,
  getResolvedEntries,
  isResolved,
  markResolved,
} from '@/lib/reasoning/contradiction-resolution-state';

describe('contradiction-resolution-state', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('isResolved returns false for an unmarked id', () => {
    expect(isResolved('AMS-INSTANCE-1::CON-AMS-001')).toBe(false);
    expect(getResolved()).toEqual([]);
  });

  it('markResolved + isResolved round-trip works for a single id', () => {
    markResolved('AMS-INSTANCE-1::CON-AMS-001');
    expect(isResolved('AMS-INSTANCE-1::CON-AMS-001')).toBe(true);
    expect(isResolved('AMS-INSTANCE-1::CON-AMS-002')).toBe(false);
    expect(getResolved()).toEqual(['AMS-INSTANCE-1::CON-AMS-001']);
  });

  it('markResolved is idempotent — calling twice with the same id keeps the set size at 1', () => {
    markResolved('id-A');
    markResolved('id-A');
    markResolved('id-A');
    expect(getResolved()).toHaveLength(1);
    expect(isResolved('id-A')).toBe(true);
  });

  it('multiple distinct ids accumulate and getResolved returns them in insertion order', () => {
    markResolved('id-A');
    markResolved('id-B');
    markResolved('id-C');
    expect(getResolved()).toEqual(['id-A', 'id-B', 'id-C']);
    expect(isResolved('id-A')).toBe(true);
    expect(isResolved('id-B')).toBe(true);
    expect(isResolved('id-C')).toBe(true);
    expect(isResolved('id-D')).toBe(false);
  });

  it('_resetForTests wipes the set', () => {
    markResolved('id-A');
    markResolved('id-B');
    _resetForTests();
    expect(getResolved()).toEqual([]);
    expect(isResolved('id-A')).toBe(false);
  });

  it('markResolved ignores empty-string and non-string ids', () => {
    markResolved('');
    // @ts-expect-error — exercising defensive guard against bad input
    markResolved(undefined);
    // @ts-expect-error — exercising defensive guard against bad input
    markResolved(null);
    expect(getResolved()).toEqual([]);
  });

  it('getResolvedAt returns an ISO timestamp for a marked id', () => {
    markResolved('id-A');
    const ts = getResolvedAt('id-A');
    expect(typeof ts).toBe('string');
    expect(new Date(ts as string).toISOString()).toBe(ts);
  });

  it('getResolvedAt returns undefined for an unmarked id', () => {
    expect(getResolvedAt('id-missing')).toBeUndefined();
  });

  it('re-marking the same id preserves the original resolution timestamp', () => {
    markResolved('id-A');
    const first = getResolvedAt('id-A');
    // Re-mark with the same id; timestamp should be the same.
    markResolved('id-A');
    expect(getResolvedAt('id-A')).toBe(first);
  });

  it('getResolvedEntries returns id+timestamp pairs in insertion order', () => {
    markResolved('id-A');
    markResolved('id-B');
    const entries = getResolvedEntries();
    expect(entries.map(e => e.id)).toEqual(['id-A', 'id-B']);
    for (const e of entries) {
      expect(typeof e.resolvedAt).toBe('string');
      expect(new Date(e.resolvedAt).toISOString()).toBe(e.resolvedAt);
    }
  });
});
