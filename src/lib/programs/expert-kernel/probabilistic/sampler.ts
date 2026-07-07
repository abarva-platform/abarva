import {
  assertDistribution,
  type Distribution,
  type SampleSummary,
} from './distributions';

export function sample(
  dist: Distribution,
  n: number,
  seed: number,
): number[] {
  assertDistribution(dist);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('sample count must be a positive integer.');
  }
  if (!Number.isInteger(seed)) {
    throw new Error('seed must be an integer.');
  }

  const random = mulberry32(seed);
  const values = new Array<number>(n);
  for (let i = 0; i < n; i += 1) {
    values[i] = sampleOne(dist, random);
  }
  return values;
}

export function summarize(samples: number[], seed = 0): SampleSummary {
  if (samples.length === 0) {
    throw new Error('summarize requires at least one sample.');
  }
  for (const value of samples) {
    if (!Number.isFinite(value)) {
      throw new Error('samples must all be finite numbers.');
    }
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const mean = samples.reduce((sum, value) => sum + value, 0) / count;
  const variance =
    samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;

  return {
    p10: round6(quantile(sorted, 0.1)),
    p25: round6(quantile(sorted, 0.25)),
    p50: round6(quantile(sorted, 0.5)),
    p75: round6(quantile(sorted, 0.75)),
    p90: round6(quantile(sorted, 0.9)),
    mean: round6(mean),
    stdev: round6(Math.sqrt(variance)),
    min: round6(sorted[0]),
    max: round6(sorted[count - 1]),
    samples: count,
    seed,
  };
}

function sampleOne(dist: Distribution, random: () => number): number {
  switch (dist.kind) {
    case 'point':
      return dist.value;
    case 'uniform':
      return dist.min + (dist.max - dist.min) * random();
    case 'triangular':
      return sampleTriangular(dist.min, dist.mode, dist.max, random);
    case 'normal':
      return dist.mean + dist.stdev * normal01(random);
    case 'lognormal':
      return Math.exp(dist.mu + dist.sigma * normal01(random));
    case 'beta_pert':
      return sampleBetaPert(dist, random);
    default: {
      const neverDist: never = dist;
      throw new Error(`Unsupported distribution ${(neverDist as { kind: string }).kind}.`);
    }
  }
}

function sampleTriangular(
  min: number,
  mode: number,
  max: number,
  random: () => number,
): number {
  if (max === min) return min;
  const u = random();
  const c = (mode - min) / (max - min);
  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function sampleBetaPert(
  dist: Extract<Distribution, { kind: 'beta_pert' }>,
  random: () => number,
): number {
  if (dist.max === dist.min) return dist.min;
  const lambda = dist.lambda ?? 4;
  const alpha = 1 + lambda * ((dist.mode - dist.min) / (dist.max - dist.min));
  const beta = 1 + lambda * ((dist.max - dist.mode) / (dist.max - dist.min));
  const x = gamma(alpha, random);
  const y = gamma(beta, random);
  return dist.min + (dist.max - dist.min) * (x / (x + y));
}

function normal01(random: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function gamma(shape: number, random: () => number): number {
  if (shape < 1) {
    return gamma(shape + 1, random) * random() ** (1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = normal01(random);
    const v = (1 + c * x) ** 3;
    if (v <= 0) continue;
    const u = random();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const weight = pos - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4_294_967_296;
  };
}
