/**
 * Mission state store tests
 *
 * Deterministic: no randomness, no time dependency on absolute values
 * (timestamp shape only), no network.
 */

import {
  _resetForTests,
  clearMissionState,
  getMissionState,
  getRecentMissionStates,
  setMissionState,
} from '@/lib/reasoning/mission-state-store';

describe('mission-state-store', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('getMissionState returns null for an unmarked id', () => {
    expect(getMissionState('SRC-AMS-2026:CR-001')).toBeNull();
  });

  it('setMissionState + getMissionState round-trip works for "complete"', () => {
    setMissionState('inst-A:cr-1', 'complete');
    const state = getMissionState('inst-A:cr-1');
    expect(state).not.toBeNull();
    expect(state?.status).toBe('complete');
    expect(typeof state?.timestamp).toBe('string');
    expect(new Date(state!.timestamp).toISOString()).toBe(state!.timestamp);
    expect(state?.note).toBeUndefined();
  });

  it('setMissionState + getMissionState round-trip works for "dismissed" with note', () => {
    setMissionState('inst-A:cr-2', 'dismissed', 'not applicable to this engagement');
    const state = getMissionState('inst-A:cr-2');
    expect(state).not.toBeNull();
    expect(state?.status).toBe('dismissed');
    expect(state?.note).toBe('not applicable to this engagement');
  });

  it('setMissionState with same status is idempotent — timestamp preserved', () => {
    setMissionState('id-A', 'complete');
    const first = getMissionState('id-A');
    // Re-mark with the same status; timestamp should not change.
    setMissionState('id-A', 'complete');
    const second = getMissionState('id-A');
    expect(second?.timestamp).toBe(first?.timestamp);
    expect(second?.status).toBe('complete');
  });

  it('setMissionState with a different status overwrites the entry', () => {
    setMissionState('id-A', 'complete');
    setMissionState('id-A', 'dismissed', 'changed mind');
    const state = getMissionState('id-A');
    expect(state?.status).toBe('dismissed');
    expect(state?.note).toBe('changed mind');
  });

  it('setMissionState ignores invalid status values', () => {
    // @ts-expect-error — exercising defensive guard against bad input
    setMissionState('id-A', 'bogus');
    expect(getMissionState('id-A')).toBeNull();
  });

  it('setMissionState ignores empty / non-string ids', () => {
    setMissionState('', 'complete');
    // @ts-expect-error — exercising defensive guard against bad input
    setMissionState(undefined, 'complete');
    // @ts-expect-error — exercising defensive guard against bad input
    setMissionState(null, 'complete');
    expect(getRecentMissionStates('inst', 10)).toEqual([]);
  });

  it('clearMissionState removes only the targeted id', () => {
    setMissionState('id-A', 'complete');
    setMissionState('id-B', 'dismissed');
    clearMissionState('id-A');
    expect(getMissionState('id-A')).toBeNull();
    expect(getMissionState('id-B')).not.toBeNull();
  });

  it('_resetForTests wipes every entry', () => {
    setMissionState('id-A', 'complete');
    setMissionState('id-B', 'dismissed');
    _resetForTests();
    expect(getMissionState('id-A')).toBeNull();
    expect(getMissionState('id-B')).toBeNull();
  });

  it('getRecentMissionStates filters by instanceId prefix', () => {
    setMissionState('inst-A:cr-1', 'complete');
    setMissionState('inst-A:cr-2', 'dismissed');
    setMissionState('inst-B:cr-1', 'complete');
    const recentA = getRecentMissionStates('inst-A', 10);
    expect(recentA.map((r) => r.id).sort()).toEqual(['inst-A:cr-1', 'inst-A:cr-2']);
    const recentB = getRecentMissionStates('inst-B', 10);
    expect(recentB.map((r) => r.id)).toEqual(['inst-B:cr-1']);
  });

  it('getRecentMissionStates returns newest first and respects the limit', async () => {
    // Use real time progression: insert with a small wait between calls so
    // ISO timestamps differ deterministically by ordering.
    setMissionState('inst-A:cr-1', 'complete');
    await new Promise((r) => setTimeout(r, 5));
    setMissionState('inst-A:cr-2', 'complete');
    await new Promise((r) => setTimeout(r, 5));
    setMissionState('inst-A:cr-3', 'dismissed');
    const top2 = getRecentMissionStates('inst-A', 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].id).toBe('inst-A:cr-3');
    expect(top2[1].id).toBe('inst-A:cr-2');
  });

  it('getRecentMissionStates default limit is 3', () => {
    setMissionState('inst-A:cr-1', 'complete');
    setMissionState('inst-A:cr-2', 'complete');
    setMissionState('inst-A:cr-3', 'complete');
    setMissionState('inst-A:cr-4', 'complete');
    expect(getRecentMissionStates('inst-A')).toHaveLength(3);
  });

  it('getRecentMissionStates with empty / non-string instanceId returns []', () => {
    setMissionState('inst-A:cr-1', 'complete');
    expect(getRecentMissionStates('', 5)).toEqual([]);
  });
});
