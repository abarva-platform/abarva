/**
 * Alert acknowledgment state tests
 *
 * Deterministic: no randomness, no time dependency on absolute values
 * (timestamp shape only), no network.
 */

import {
  _resetForTests,
  clearAlertState,
  getAlertState,
  getRecentAlertStates,
  setAlertState,
  setAlertAcknowledgmentBackend,
  getAlertAcknowledgmentBackend,
  type AlertAcknowledgmentBackend,
} from '@/lib/reasoning/alert-acknowledgment-state';

describe('alert-acknowledgment-state', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('getAlertState returns null for an unmarked id', () => {
    expect(getAlertState('health::AMS-INSTANCE-1')).toBeNull();
  });

  it('setAlertState + getAlertState round-trip works for "acknowledged"', () => {
    setAlertState('health::inst-A', 'acknowledged');
    const state = getAlertState('health::inst-A');
    expect(state).not.toBeNull();
    expect(state?.status).toBe('acknowledged');
    expect(typeof state?.timestamp).toBe('string');
    expect(new Date(state!.timestamp).toISOString()).toBe(state!.timestamp);
    expect(state?.note).toBeUndefined();
  });

  it('setAlertState + getAlertState round-trip works for "dismissed" with note', () => {
    setAlertState('contradiction::inst-B::tpl-9', 'dismissed', 'duplicate');
    const state = getAlertState('contradiction::inst-B::tpl-9');
    expect(state).not.toBeNull();
    expect(state?.status).toBe('dismissed');
    expect(state?.note).toBe('duplicate');
  });

  it('setAlertState with same status is idempotent — timestamp preserved', () => {
    setAlertState('id-A', 'acknowledged');
    const first = getAlertState('id-A');
    setAlertState('id-A', 'acknowledged');
    const second = getAlertState('id-A');
    expect(second?.timestamp).toBe(first?.timestamp);
    expect(second?.status).toBe('acknowledged');
  });

  it('setAlertState with a different status overwrites timestamp + status', async () => {
    setAlertState('id-flip', 'acknowledged');
    const first = getAlertState('id-flip');
    // Tiny wait so the timestamp can differ; if the host clock is too coarse
    // we still assert status flipped.
    await new Promise((r) => setTimeout(r, 2));
    setAlertState('id-flip', 'dismissed');
    const second = getAlertState('id-flip');
    expect(second?.status).toBe('dismissed');
    expect((second?.timestamp ?? '') >= (first?.timestamp ?? '')).toBe(true);
  });

  it('setAlertState ignores empty-string ids and unknown status values', () => {
    setAlertState('', 'acknowledged');
    // @ts-expect-error — exercising defensive guard against bad input
    setAlertState('id-x', 'bogus');
    expect(getAlertState('')).toBeNull();
    expect(getAlertState('id-x')).toBeNull();
  });

  it('clearAlertState removes the entry', () => {
    setAlertState('id-A', 'acknowledged');
    expect(getAlertState('id-A')).not.toBeNull();
    clearAlertState('id-A');
    expect(getAlertState('id-A')).toBeNull();
  });

  it('clearAlertState is a no-op for an unknown id', () => {
    expect(() => clearAlertState('id-missing')).not.toThrow();
    expect(getAlertState('id-missing')).toBeNull();
  });

  it('idempotent same-status mark refreshes the note when a new non-empty note is supplied', () => {
    setAlertState('id-noted', 'acknowledged', 'first note');
    const first = getAlertState('id-noted');
    setAlertState('id-noted', 'acknowledged', 'updated note');
    const second = getAlertState('id-noted');
    // Timestamp preserved (idempotent), but note refreshed.
    expect(second?.timestamp).toBe(first?.timestamp);
    expect(second?.note).toBe('updated note');
  });

  it('getRecentAlertStates returns entries sorted newest-first up to the limit', async () => {
    setAlertState('a', 'acknowledged');
    await new Promise((r) => setTimeout(r, 2));
    setAlertState('b', 'dismissed');
    await new Promise((r) => setTimeout(r, 2));
    setAlertState('c', 'acknowledged');

    const recent = getRecentAlertStates(3);
    expect(recent.map((r) => r.id)).toEqual(['c', 'b', 'a']);
    const onlyTwo = getRecentAlertStates(2);
    expect(onlyTwo.map((r) => r.id)).toEqual(['c', 'b']);
    expect(getRecentAlertStates(0)).toEqual([]);
  });

  it('_resetForTests wipes the state and clears any installed backend', () => {
    setAlertState('id-A', 'acknowledged');
    const fakeBackend: AlertAcknowledgmentBackend = {
      async write() {},
      async clear() {},
    };
    setAlertAcknowledgmentBackend(fakeBackend);
    expect(getAlertAcknowledgmentBackend()).toBe(fakeBackend);
    _resetForTests();
    expect(getAlertState('id-A')).toBeNull();
    expect(getAlertAcknowledgmentBackend()).toBeNull();
  });

  it('write-through backend is invoked on setAlertState + clearAlertState', async () => {
    const writes: Array<{
      id: string;
      status: string;
      timestamp: string;
      note?: string;
    }> = [];
    const clears: string[] = [];
    const backend: AlertAcknowledgmentBackend = {
      async write(state) {
        writes.push(state);
      },
      async clear(id) {
        clears.push(id);
      },
    };
    setAlertAcknowledgmentBackend(backend);

    setAlertState('id-A', 'acknowledged', 'hello');
    clearAlertState('id-A');

    // Allow the fire-and-forget promises a tick to resolve.
    await Promise.resolve();
    await Promise.resolve();

    expect(writes).toHaveLength(1);
    expect(writes[0].id).toBe('id-A');
    expect(writes[0].status).toBe('acknowledged');
    expect(writes[0].note).toBe('hello');
    expect(clears).toEqual(['id-A']);
  });
});
