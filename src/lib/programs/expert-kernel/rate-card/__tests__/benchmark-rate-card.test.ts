// Benchmark SI rate card — shape & integrity tests.
//
// These assert the data asset's structural honesty: every band is a valid
// range, every entry is sourced/confidence-noted, dimensions are well-formed,
// and the lookup behaves. They do NOT assert exact rate figures — those are
// researched benchmarks, expected to drift on each refresh.

import {
  BENCHMARK_RATE_CARD,
  RATE_CARD_AS_OF,
  lookupBenchmarkRate,
  type RateCardEntry,
  type SiArchetype,
  type DeliveryLocation,
  type WorkSpecialization,
} from '../benchmark-rate-card';

const ARCHETYPES: SiArchetype[] = [
  'us_tier1',
  'india_tier1',
  'big4_advisory',
  'boutique_specialist',
];
const LOCATIONS: DeliveryLocation[] = ['onshore', 'nearshore', 'offshore'];
const SPECIALIZATIONS: WorkSpecialization[] = [
  'strategy_advisory',
  'solution_architecture',
  'ai_ml_engineering',
  'data_engineering',
  'integration',
  'process_redesign',
  'change_management',
  'program_management',
  'run_ams',
];

describe('benchmark rate card — card metadata', () => {
  it('declares USD blended-hourly basis', () => {
    expect(BENCHMARK_RATE_CARD.currency).toBe('USD');
    expect(BENCHMARK_RATE_CARD.basis).toBe('blended_hourly');
  });

  it('carries the research vintage', () => {
    expect(BENCHMARK_RATE_CARD.asOf).toBe(RATE_CARD_AS_OF);
    expect(BENCHMARK_RATE_CARD.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('carries a "not a quote" disclaimer and a refresh cadence', () => {
    expect(BENCHMARK_RATE_CARD.disclaimer.toLowerCase()).toContain('not a quote');
    expect(BENCHMARK_RATE_CARD.disclaimer.toLowerCase()).toContain('override');
    expect(BENCHMARK_RATE_CARD.refreshCadence.length).toBeGreaterThan(0);
  });

  it('populates a meaningful number of cells', () => {
    expect(BENCHMARK_RATE_CARD.entries.length).toBeGreaterThanOrEqual(30);
  });
});

describe('benchmark rate card — entry integrity', () => {
  const entries = BENCHMARK_RATE_CARD.entries;

  it('every entry uses a valid dimension value', () => {
    for (const e of entries) {
      expect(ARCHETYPES).toContain(e.archetype);
      expect(LOCATIONS).toContain(e.location);
      expect(SPECIALIZATIONS).toContain(e.specialization);
    }
  });

  it('every band is a valid positive low <= point <= high range', () => {
    for (const e of entries) {
      const { lowUsdPerHour: lo, pointUsdPerHour: pt, highUsdPerHour: hi } = e.band;
      expect(lo).toBeGreaterThan(0);
      expect(lo).toBeLessThanOrEqual(pt);
      expect(pt).toBeLessThanOrEqual(hi);
    }
  });

  it('point is the midpoint of low and high', () => {
    for (const e of entries) {
      const expected = Math.round(
        (e.band.lowUsdPerHour + e.band.highUsdPerHour) / 2,
      );
      expect(e.band.pointUsdPerHour).toBe(expected);
    }
  });

  it('every entry has a confidence rung and a non-trivial source note', () => {
    for (const e of entries) {
      expect(['high', 'medium', 'low']).toContain(e.confidence);
      expect(e.note.trim().length).toBeGreaterThan(15);
    }
  });

  it('every band is internally a range, never false precision (low < high)', () => {
    for (const e of entries) {
      expect(e.band.highUsdPerHour).toBeGreaterThan(e.band.lowUsdPerHour);
    }
  });

  it('has no duplicate archetype x location x specialization cells', () => {
    const keys = entries.map(
      (e) => `${e.archetype}|${e.location}|${e.specialization}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers all four SI archetypes', () => {
    const present = new Set(entries.map((e) => e.archetype));
    for (const a of ARCHETYPES) expect(present).toContain(a);
  });

  it('covers all three delivery locations', () => {
    const present = new Set(entries.map((e) => e.location));
    for (const l of LOCATIONS) expect(present).toContain(l);
  });

  it('covers a broad spread of work specializations', () => {
    const present = new Set(entries.map((e) => e.specialization));
    expect(present.size).toBeGreaterThanOrEqual(7);
  });
});

describe('benchmark rate card — economic sanity', () => {
  const byKey = (e: RateCardEntry) => e;

  it('offshore is cheaper than onshore for the same archetype/specialization', () => {
    for (const a of ARCHETYPES) {
      for (const s of SPECIALIZATIONS) {
        const on = lookupBenchmarkRate(a, 'onshore', s);
        const off = lookupBenchmarkRate(a, 'offshore', s);
        if (on && off) {
          expect(off.band.pointUsdPerHour).toBeLessThan(
            on.band.pointUsdPerHour,
          );
        }
      }
    }
  });

  it('thinly-researched cells are marked low confidence, not high', () => {
    // Any cell whose note flags thin research must not claim high confidence.
    for (const e of BENCHMARK_RATE_CARD.entries.map(byKey)) {
      if (/thin|sparse|characterized|inferred|interpolated/i.test(e.note)) {
        expect(e.confidence).not.toBe('high');
      }
    }
  });
});

describe('benchmark rate card — lookup', () => {
  it('returns a populated cell by its three dimensions', () => {
    const hit = lookupBenchmarkRate('india_tier1', 'offshore', 'integration');
    expect(hit).not.toBeNull();
    expect(hit?.archetype).toBe('india_tier1');
    expect(hit?.location).toBe('offshore');
    expect(hit?.specialization).toBe('integration');
  });

  it('returns null for an unpopulated cell rather than fabricating a rate', () => {
    const miss = lookupBenchmarkRate(
      'boutique_specialist',
      'offshore',
      'run_ams',
    );
    expect(miss).toBeNull();
  });
});
