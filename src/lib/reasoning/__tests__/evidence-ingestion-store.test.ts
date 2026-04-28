/**
 * Evidence ingestion store tests.
 *
 * Deterministic: no network, no LLM, no randomness. Each case calls
 * `_resetForTests()` to clear the in-memory map between tests.
 */

import {
  addEvidence,
  getEvidenceFor,
  clearEvidenceFor,
  _resetForTests,
} from '@/lib/reasoning/evidence-ingestion-store';

beforeEach(() => {
  _resetForTests();
});

describe('evidence-ingestion-store', () => {
  it('returns an empty array for an instance with no contributions', () => {
    expect(getEvidenceFor('ams-vendor-consolidation-2026')).toEqual([]);
  });

  it('addEvidence then getEvidenceFor returns the stored item', () => {
    const item = { id: 'ev-1', field: 'soc2', value: 'true', source: 'manual' };
    addEvidence('ams-vendor-consolidation-2026', item);
    const out = getEvidenceFor('ams-vendor-consolidation-2026');
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(item);
  });

  it('preserves insertion order across multiple addEvidence calls', () => {
    addEvidence('inst-A', { id: 'a' });
    addEvidence('inst-A', { id: 'b' });
    addEvidence('inst-A', { id: 'c' });
    expect(getEvidenceFor('inst-A').map(i => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('keeps contributions for different instances isolated', () => {
    addEvidence('inst-A', { id: 'a-1' });
    addEvidence('inst-B', { id: 'b-1' });
    addEvidence('inst-B', { id: 'b-2' });
    expect(getEvidenceFor('inst-A')).toHaveLength(1);
    expect(getEvidenceFor('inst-B')).toHaveLength(2);
  });

  it('clearEvidenceFor removes only the targeted instance', () => {
    addEvidence('inst-A', { id: 'a-1' });
    addEvidence('inst-B', { id: 'b-1' });
    clearEvidenceFor('inst-A');
    expect(getEvidenceFor('inst-A')).toEqual([]);
    expect(getEvidenceFor('inst-B')).toHaveLength(1);
  });

  it('getEvidenceFor returns a fresh copy — mutating it does not affect the store', () => {
    addEvidence('inst-A', { id: 'a-1' });
    const snap = getEvidenceFor('inst-A');
    snap.push({ id: 'rogue' });
    expect(getEvidenceFor('inst-A')).toHaveLength(1);
  });

  it('addEvidence rejects empty instanceId', () => {
    expect(() => addEvidence('', { id: 'a' })).toThrow();
  });

  it('addEvidence rejects non-object item', () => {
    // @ts-expect-error — runtime guard test
    expect(() => addEvidence('inst-A', null)).toThrow();
  });
});
