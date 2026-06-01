import { performance } from 'node:perf_hooks';

import { sample, summarize } from '../sampler';

describe('probabilistic sampler', () => {
  it('is deterministic for a fixed seed', () => {
    const first = sample({ kind: 'uniform', min: 10, max: 20 }, 5, 42);
    const second = sample({ kind: 'uniform', min: 10, max: 20 }, 5, 42);

    expect(second).toEqual(first);
  });

  it('summarizes percentiles and moments', () => {
    const summary = summarize([1, 2, 3, 4, 5], 7);

    expect(summary).toMatchObject({
      p10: 1.4,
      p25: 2,
      p50: 3,
      p75: 4,
      p90: 4.6,
      mean: 3,
      min: 1,
      max: 5,
      samples: 5,
      seed: 7,
    });
    expect(summary.stdev).toBeCloseTo(Math.sqrt(2), 6);
  });

  it('matches the uniform distribution mean', () => {
    const summary = summarize(sample({ kind: 'uniform', min: 0, max: 10 }, 50_000, 11), 11);

    expect(summary.mean).toBeGreaterThan(4.94);
    expect(summary.mean).toBeLessThan(5.06);
  });

  it('matches the triangular distribution mean', () => {
    const summary = summarize(
      sample({ kind: 'triangular', min: 0, mode: 3, max: 12 }, 50_000, 12),
      12,
    );

    expect(summary.mean).toBeGreaterThan(4.92);
    expect(summary.mean).toBeLessThan(5.08);
  });

  it('matches the normal distribution mean and standard deviation', () => {
    const summary = summarize(
      sample({ kind: 'normal', mean: 100, stdev: 15 }, 80_000, 13),
      13,
    );

    expect(summary.mean).toBeGreaterThan(99.7);
    expect(summary.mean).toBeLessThan(100.3);
    expect(summary.stdev).toBeGreaterThan(14.7);
    expect(summary.stdev).toBeLessThan(15.3);
  });

  it('matches the lognormal distribution mean', () => {
    const mu = 2;
    const sigma = 0.25;
    const expectedMean = Math.exp(mu + (sigma ** 2) / 2);
    const summary = summarize(
      sample({ kind: 'lognormal', mu, sigma }, 80_000, 14),
      14,
    );

    expect(summary.mean).toBeGreaterThan(expectedMean * 0.985);
    expect(summary.mean).toBeLessThan(expectedMean * 1.015);
  });

  it('matches the beta-pert expected mean', () => {
    const min = 0;
    const mode = 0.4;
    const max = 1;
    const lambda = 4;
    const expectedMean = (min + lambda * mode + max) / (lambda + 2);
    const summary = summarize(
      sample({ kind: 'beta_pert', min, mode, max, lambda }, 80_000, 15),
      15,
    );

    expect(summary.mean).toBeGreaterThan(expectedMean - 0.01);
    expect(summary.mean).toBeLessThan(expectedMean + 0.01);
  });

  it('keeps point distributions exact', () => {
    const summary = summarize(sample({ kind: 'point', value: 123 }, 1_000, 16), 16);

    expect(summary.mean).toBe(123);
    expect(summary.stdev).toBe(0);
    expect(summary.p10).toBe(123);
    expect(summary.p90).toBe(123);
  });

  it('samples 100k simple trials quickly enough for CI use', () => {
    const start = performance.now();
    const values = sample({ kind: 'uniform', min: 0, max: 1 }, 100_000, 17);
    const elapsedMs = performance.now() - start;

    expect(values).toHaveLength(100_000);
    expect(elapsedMs).toBeLessThan(100);
  });

  it('rejects invalid distributions and sample requests', () => {
    expect(() => sample({ kind: 'uniform', min: 2, max: 1 }, 1, 1)).toThrow('max');
    expect(() => sample({ kind: 'normal', mean: 0, stdev: 0 }, 1, 1)).toThrow(
      'positive',
    );
    expect(() => sample({ kind: 'point', value: 1 }, 0, 1)).toThrow(
      'positive integer',
    );
  });
});
