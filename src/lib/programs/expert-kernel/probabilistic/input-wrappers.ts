import type { Range } from '../types';
import type { Distribution } from './distributions';

export interface ProbabilisticInputs {
  /** Cost inputs become Triangular(low=upside, mode=base, high=conservative). */
  effortCostDist?: 'triangular_from_range';
  /** Adoption ramp becomes BetaPert per year. */
  adoptionRampDist?: {
    yearly: Array<{ min: number; mode: number; max: number }>;
  };
  /** Realized-value-per-unit becomes Lognormal (right-skewed). */
  valuePerUnitDist?: { mu: number; sigma: number };
  /** Churn rate becomes Beta-PERT. */
  churnRateDist?: { min: number; mode: number; max: number };
  /** Vendor reprice probability + magnitude as a joint distribution. */
  vendorRepriceDist?: {
    probability: number;
    magnitudeDist: { min: number; mode: number; max: number };
  };
  /** Sampling config. Defaults to 10,000 trials when omitted by a wrapper. */
  trials?: number;
  /** Seed for reproducible sampling. Defaults to 1 when omitted by a wrapper. */
  seed?: number;
}

export interface ProbabilisticConfig {
  trials: number;
  seed: number;
}

export interface EffortCostDistribution {
  source: 'effort.totalCost';
  distribution: Distribution;
  config: ProbabilisticConfig;
}

export interface AdoptionRampDistribution {
  year: number;
  distribution: Distribution;
}

export interface VendorRepriceDistribution {
  probability: number;
  magnitudeDistribution: Distribution;
}

export interface ValueForecastDistributions {
  adoptionRamp: AdoptionRampDistribution[];
  valuePerUnit: Distribution | null;
  churnRate: Distribution | null;
  vendorReprice: VendorRepriceDistribution | null;
  config: ProbabilisticConfig;
}

const DEFAULT_TRIALS = 10_000;
const DEFAULT_SEED = 1;

export function buildProbabilisticConfig(
  input: ProbabilisticInputs | null | undefined,
): ProbabilisticConfig {
  const trials = input?.trials ?? DEFAULT_TRIALS;
  const seed = input?.seed ?? DEFAULT_SEED;
  if (!Number.isInteger(trials) || trials <= 0) {
    throw new Error('probabilistic.trials must be a positive integer.');
  }
  if (!Number.isInteger(seed)) {
    throw new Error('probabilistic.seed must be an integer.');
  }
  return { trials, seed };
}

export function buildEffortCostDistribution(
  totalCost: Range,
  input: ProbabilisticInputs | null | undefined,
): EffortCostDistribution | null {
  if (input?.effortCostDist !== 'triangular_from_range') return null;
  assertRange(totalCost);
  return {
    source: 'effort.totalCost',
    distribution: {
      kind: 'triangular',
      min: totalCost.low,
      mode: totalCost.point,
      max: totalCost.high,
    },
    config: buildProbabilisticConfig(input),
  };
}

export function buildValueForecastDistributions(
  adoptionCurve: number[],
  input: ProbabilisticInputs | null | undefined,
): ValueForecastDistributions | null {
  if (!input) return null;
  const hasValueInput =
    Boolean(input.adoptionRampDist) ||
    Boolean(input.valuePerUnitDist) ||
    Boolean(input.churnRateDist) ||
    Boolean(input.vendorRepriceDist);
  if (!hasValueInput) return null;

  return {
    adoptionRamp: buildAdoptionRamp(adoptionCurve, input),
    valuePerUnit: input.valuePerUnitDist
      ? { kind: 'lognormal', ...input.valuePerUnitDist }
      : null,
    churnRate: input.churnRateDist
      ? { kind: 'beta_pert', ...input.churnRateDist }
      : null,
    vendorReprice: input.vendorRepriceDist
      ? {
          probability: assertProbability(input.vendorRepriceDist.probability),
          magnitudeDistribution: {
            kind: 'beta_pert',
            ...input.vendorRepriceDist.magnitudeDist,
          },
        }
      : null,
    config: buildProbabilisticConfig(input),
  };
}

function buildAdoptionRamp(
  adoptionCurve: number[],
  input: ProbabilisticInputs,
): AdoptionRampDistribution[] {
  if (!input.adoptionRampDist) {
    return adoptionCurve.map((mode, index) => ({
      year: index + 1,
      distribution: { kind: 'point', value: mode },
    }));
  }
  if (input.adoptionRampDist.yearly.length !== adoptionCurve.length) {
    throw new Error(
      'probabilistic.adoptionRampDist.yearly length must match adoptionCurve length.',
    );
  }
  return input.adoptionRampDist.yearly.map((yearly, index) => ({
    year: index + 1,
    distribution: { kind: 'beta_pert', ...yearly },
  }));
}

function assertRange(range: Range): void {
  if (range.low > range.point || range.point > range.high) {
    throw new Error('Range must satisfy low <= point <= high.');
  }
}

function assertProbability(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('vendorRepriceDist.probability must be within 0..1.');
  }
  return value;
}
