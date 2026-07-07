import type { EffortEstimate } from '../effort-estimator';
import type { ValueForecast } from '../value-forecast';
import { sample, summarize } from './sampler';
import type { Distribution, SampleSummary } from './distributions';

export interface ProbabilisticValueForecastInput {
  value: ValueForecast;
  effort: EffortEstimate;
  /** Defaults to the deterministic 3-year net-return point. */
  lockedProjectedTarget?: number;
  /** Annual discount rate for NPV. Defaults to 10%. */
  discountRate?: number;
  /** Override sampling trials; otherwise uses wrapper config or 10,000. */
  trials?: number;
  /** Override seed; otherwise uses wrapper config or 1. */
  seed?: number;
}

export interface ProbabilisticValueForecast {
  yearly: Array<{
    year: number;
    revenueDist: SampleSummary;
    costDist: SampleSummary;
    netDist: SampleSummary;
  }>;
  threeYearNpv: SampleSummary;
  fiveYearNpv: SampleSummary;
  /** Probability of net-positive across the 3-year horizon. */
  probNetPositive3yr: number;
  /** Probability of hitting the locked projected target. */
  probHitTarget: number;
  /** Top 3 input drivers of variance, ranked by elasticity. */
  topVarianceDrivers: Array<{ input: string; elasticity: number; note: string }>;
}

interface TrialInputs {
  adoptionByYear: number[][];
  effortCost: number[];
  valuePerUnitFactor: number[];
  churnRate: number[];
  vendorRepriceFactor: number[];
}

export function buildProbabilisticValueForecast(
  input: ProbabilisticValueForecastInput,
): ProbabilisticValueForecast {
  const years = Math.max(1, input.value.curve.length);
  const trials = input.trials ?? input.value.probabilistic?.config.trials
    ?? input.effort.probabilistic?.config.trials
    ?? 10_000;
  const seed = input.seed ?? input.value.probabilistic?.config.seed
    ?? input.effort.probabilistic?.config.seed
    ?? 1;
  if (!Number.isInteger(trials) || trials <= 0) {
    throw new Error('trials must be a positive integer.');
  }
  if (!Number.isInteger(seed)) {
    throw new Error('seed must be an integer.');
  }

  const trialInputs = buildTrialInputs(input, trials, seed);
  const yearly = Array.from({ length: years }, (_, yearIndex) => {
    const revenue = new Array<number>(trials);
    const cost = new Array<number>(trials);
    const net = new Array<number>(trials);
    for (let i = 0; i < trials; i += 1) {
      revenue[i] = revenueForYear(input.value, trialInputs, yearIndex, i);
      cost[i] = costForYear(trialInputs, years, i);
      net[i] = revenue[i] - cost[i];
    }
    return {
      year: yearIndex + 1,
      revenueDist: summarize(revenue, seed + 100 + yearIndex),
      costDist: summarize(cost, seed + 200 + yearIndex),
      netDist: summarize(net, seed + 300 + yearIndex),
    };
  });

  const threeYearNpvSamples = npvSamples(input, trialInputs, 3);
  const fiveYearNpvSamples = npvSamples(input, trialInputs, 5);
  const deterministicTarget =
    input.value.totalNetValue.point -
    (input.effort.totalCost.point + (input.effort.aiOpsCost?.threeYearTotal ?? 0));
  const target = input.lockedProjectedTarget ?? deterministicTarget;

  return {
    yearly,
    threeYearNpv: summarize(threeYearNpvSamples, seed + 400),
    fiveYearNpv: summarize(fiveYearNpvSamples, seed + 500),
    probNetPositive3yr: probability(threeYearNpvSamples, (value) => value > 0),
    probHitTarget: probability(threeYearNpvSamples, (value) => value >= target),
    topVarianceDrivers: topDrivers(threeYearNpvSamples, trialInputs),
  };
}

function buildTrialInputs(
  input: ProbabilisticValueForecastInput,
  trials: number,
  seed: number,
): TrialInputs {
  const adoptionByYear = input.value.curve.map((year, index) => {
    const dist =
      input.value.probabilistic?.adoptionRamp[index]?.distribution ??
      ({ kind: 'point', value: year.adoptionFraction } satisfies Distribution);
    return sample(dist, trials, seed + 10 + index);
  });
  const effortCost = sample(
    input.effort.probabilistic?.distribution ?? {
      kind: 'point',
      value: input.effort.totalCost.point + (input.effort.aiOpsCost?.threeYearTotal ?? 0),
    },
    trials,
    seed + 30,
  );

  const valuePerUnitDist = input.value.probabilistic?.valuePerUnit;
  const valuePerUnitRaw = sample(valuePerUnitDist ?? { kind: 'point', value: 1 }, trials, seed + 40);
  const valuePerUnitMean =
    valuePerUnitDist?.kind === 'lognormal'
      ? Math.exp(valuePerUnitDist.mu + (valuePerUnitDist.sigma ** 2) / 2)
      : 1;

  const churnRate = sample(
    input.value.probabilistic?.churnRate ?? { kind: 'point', value: 0 },
    trials,
    seed + 50,
  );
  const reprice = input.value.probabilistic?.vendorReprice;
  const repriceMagnitude = sample(
    reprice?.magnitudeDistribution ?? { kind: 'point', value: 0 },
    trials,
    seed + 60,
  );
  const repriceDraw = sample({ kind: 'uniform', min: 0, max: 1 }, trials, seed + 61);

  return {
    adoptionByYear,
    effortCost,
    valuePerUnitFactor: valuePerUnitRaw.map((value) => value / valuePerUnitMean),
    churnRate,
    vendorRepriceFactor: repriceMagnitude.map((value, index) =>
      reprice && repriceDraw[index] < reprice.probability ? 1 + value : 1,
    ),
  };
}

function revenueForYear(
  value: ValueForecast,
  trialInputs: TrialInputs,
  yearIndex: number,
  trialIndex: number,
): number {
  const curveYear = value.curve[yearIndex] ?? value.curve[value.curve.length - 1];
  const deterministicAdoption = Math.max(curveYear.adoptionFraction, 0.0001);
  const steadyGross = curveYear.grossValue.point / deterministicAdoption;
  return (
    steadyGross *
    trialInputs.adoptionByYear[yearIndex][trialIndex] *
    value.retainedFraction *
    trialInputs.valuePerUnitFactor[trialIndex] *
    (1 - trialInputs.churnRate[trialIndex])
  );
}

function costForYear(
  trialInputs: TrialInputs,
  years: number,
  trialIndex: number,
): number {
  return (
    (trialInputs.effortCost[trialIndex] / Math.min(3, years)) *
    trialInputs.vendorRepriceFactor[trialIndex]
  );
}

function npvSamples(
  input: ProbabilisticValueForecastInput,
  trialInputs: TrialInputs,
  horizonYears: number,
): number[] {
  const discountRate = input.discountRate ?? 0.1;
  const trials = trialInputs.effortCost.length;
  const values = new Array<number>(trials);
  for (let i = 0; i < trials; i += 1) {
    let total = 0;
    for (let year = 0; year < horizonYears; year += 1) {
      const availableYear = Math.min(year, input.value.curve.length - 1);
      const revenue = revenueForYear(input.value, trialInputs, availableYear, i);
      const cost = year < 3 ? costForYear(trialInputs, input.value.curve.length, i) : 0;
      total += (revenue - cost) / ((1 + discountRate) ** (year + 1));
    }
    values[i] = total;
  }
  return values;
}

function probability(samples: number[], predicate: (value: number) => boolean): number {
  const hits = samples.filter(predicate).length;
  return Math.round((hits / samples.length) * 10_000) / 10_000;
}

function topDrivers(
  target: number[],
  inputs: TrialInputs,
): Array<{ input: string; elasticity: number; note: string }> {
  const candidates = [
    {
      input: 'adoption ramp',
      values: meanAcrossYears(inputs.adoptionByYear),
      note: 'Higher adoption raises realized value; low adoption widens the downside tail.',
    },
    {
      input: 'effort cost',
      values: inputs.effortCost,
      note: 'Higher build/change/run cost lowers NPV.',
    },
    {
      input: 'value per unit',
      values: inputs.valuePerUnitFactor,
      note: 'Higher realized value per decision raises NPV.',
    },
    {
      input: 'churn rate',
      values: inputs.churnRate,
      note: 'Higher churn erodes retained value.',
    },
    {
      input: 'vendor reprice',
      values: inputs.vendorRepriceFactor,
      note: 'Pricing-tier repricing raises operating cost in affected trials.',
    },
  ];
  return candidates
    .map((candidate) => ({
      input: candidate.input,
      elasticity: Math.round(Math.abs(correlation(candidate.values, target)) * 10_000) / 10_000,
      note: candidate.note,
    }))
    .sort((a, b) => b.elasticity - a.elasticity)
    .slice(0, 3);
}

function meanAcrossYears(years: number[][]): number[] {
  const trials = years[0]?.length ?? 0;
  return Array.from({ length: trials }, (_, index) => {
    const total = years.reduce((sum, year) => sum + year[index], 0);
    return total / Math.max(1, years.length);
  });
}

function correlation(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length;
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  if (denomA === 0 || denomB === 0) return 0;
  return numerator / Math.sqrt(denomA * denomB);
}
