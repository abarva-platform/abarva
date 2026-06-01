export type Distribution =
  | { kind: 'point'; value: number }
  | { kind: 'uniform'; min: number; max: number }
  | { kind: 'triangular'; min: number; mode: number; max: number }
  | { kind: 'lognormal'; mu: number; sigma: number }
  | { kind: 'normal'; mean: number; stdev: number }
  | {
      kind: 'beta_pert';
      min: number;
      mode: number;
      max: number;
      lambda?: number;
    };

export interface SampleSummary {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
  stdev: number;
  min: number;
  max: number;
  samples: number;
  seed: number;
}

export function assertDistribution(dist: Distribution): void {
  switch (dist.kind) {
    case 'point':
      assertFinite(dist.value, 'point.value');
      return;
    case 'uniform':
      assertFiniteRange(dist.min, dist.max, 'uniform');
      return;
    case 'triangular':
      assertFiniteRange(dist.min, dist.max, 'triangular');
      if (dist.mode < dist.min || dist.mode > dist.max) {
        throw new Error('triangular.mode must be within min..max.');
      }
      return;
    case 'normal':
      assertFinite(dist.mean, 'normal.mean');
      assertPositive(dist.stdev, 'normal.stdev');
      return;
    case 'lognormal':
      assertFinite(dist.mu, 'lognormal.mu');
      assertPositive(dist.sigma, 'lognormal.sigma');
      return;
    case 'beta_pert':
      assertFiniteRange(dist.min, dist.max, 'beta_pert');
      if (dist.mode < dist.min || dist.mode > dist.max) {
        throw new Error('beta_pert.mode must be within min..max.');
      }
      if (dist.lambda !== undefined) assertPositive(dist.lambda, 'beta_pert.lambda');
      return;
    default: {
      const neverDist: never = dist;
      throw new Error(`Unsupported distribution ${(neverDist as { kind: string }).kind}.`);
    }
  }
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertPositive(value: number, label: string): void {
  assertFinite(value, label);
  if (value <= 0) {
    throw new Error(`${label} must be positive.`);
  }
}

function assertFiniteRange(min: number, max: number, label: string): void {
  assertFinite(min, `${label}.min`);
  assertFinite(max, `${label}.max`);
  if (max < min) {
    throw new Error(`${label}.max must be >= min.`);
  }
}
