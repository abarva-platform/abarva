/**
 * @jest-environment node
 *
 * EXPORT-4 · spec-cache unit tests.
 *
 * The cache holds composed deliverable specs keyed by an ephemeral
 * UUID. The agent stores the spec at the end of `compose_artifact`,
 * passes the id on the artifact, and the export route resolves the
 * id back to the spec when the user clicks the download chip.
 *
 * Tests cover:
 *   - storeSpec returns a non-empty id; getSpec round-trips.
 *   - getSpec returns null for unknown ids and for expired ids.
 *   - 1-hour TTL eviction is honored (we drive the clock with
 *     jest.useFakeTimers / setSystemTime).
 *   - Distinct stores produce distinct ids.
 */

import {
  __resetSpecCacheForTests,
  getSpec,
  storeSpec,
  SPEC_CACHE_TTL_MS,
} from '@/lib/programs/exports/spec-cache';
import type { DeliverableSpec } from '@/lib/programs/exports/types';

function makeSpec(overrides?: Partial<DeliverableSpec>): DeliverableSpec {
  return {
    kind: 'program-charter',
    tenantKey: 'apex-retail',
    programId: 'APX-CDP-2026',
    title: 'Apex CDP Activation 2026 — Charter v1',
    payload: {
      valueHypothesis: { thesis: 'thesis' },
      sponsor: { name: 'Sarah' },
      recommendedPath: { plan: 'plan' },
      architectureReviewAttestation: { reviewer: 'a' },
      killCriterion: { name: 'k' },
      baselineKpis: [],
      signoff: { signer: 's' },
    },
    ...overrides,
  };
}

beforeEach(() => {
  __resetSpecCacheForTests();
  jest.useRealTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('storeSpec / getSpec', () => {
  it('returns an id and round-trips the spec', () => {
    const spec = makeSpec();
    const id = storeSpec(spec);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    const fetched = getSpec(id);
    expect(fetched).toBe(spec);
  });

  it('produces distinct ids for distinct stores even when the spec is identical', () => {
    const spec = makeSpec();
    const id1 = storeSpec(spec);
    const id2 = storeSpec(spec);
    expect(id1).not.toBe(id2);
    expect(getSpec(id1)).toBe(spec);
    expect(getSpec(id2)).toBe(spec);
  });

  it('returns null for an unknown id', () => {
    expect(getSpec('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('returns null after the 1-hour TTL has elapsed (entry auto-evicts)', () => {
    jest.useFakeTimers();
    const start = new Date('2026-04-29T12:00:00Z').getTime();
    jest.setSystemTime(start);

    const id = storeSpec(makeSpec());
    expect(getSpec(id)).not.toBeNull();

    // Just before the TTL — still cached.
    jest.setSystemTime(start + SPEC_CACHE_TTL_MS - 1);
    expect(getSpec(id)).not.toBeNull();

    // At/after the TTL — evicted.
    jest.setSystemTime(start + SPEC_CACHE_TTL_MS);
    expect(getSpec(id)).toBeNull();
  });

  it('does not extend TTL on read', () => {
    jest.useFakeTimers();
    const start = new Date('2026-04-29T12:00:00Z').getTime();
    jest.setSystemTime(start);

    const id = storeSpec(makeSpec());

    // Read at +30 minutes.
    jest.setSystemTime(start + 30 * 60 * 1000);
    expect(getSpec(id)).not.toBeNull();

    // Past the original TTL — should still expire on time.
    jest.setSystemTime(start + SPEC_CACHE_TTL_MS + 1);
    expect(getSpec(id)).toBeNull();
  });

  it('isolates entries — evicting one does not drop another', () => {
    jest.useFakeTimers();
    const start = new Date('2026-04-29T12:00:00Z').getTime();
    jest.setSystemTime(start);

    const id1 = storeSpec(makeSpec({ title: 'first' }));

    // Advance 40 minutes; store a second entry.
    jest.setSystemTime(start + 40 * 60 * 1000);
    const id2 = storeSpec(makeSpec({ title: 'second' }));

    // Past the first entry's TTL but not the second's.
    jest.setSystemTime(start + SPEC_CACHE_TTL_MS + 1);
    expect(getSpec(id1)).toBeNull();
    const spec2 = getSpec(id2);
    expect(spec2).not.toBeNull();
    expect(spec2?.title).toBe('second');
  });
});
