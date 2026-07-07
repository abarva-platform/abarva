// Expert Kernel — value-forecast.
//
// Produces an adoption-adjusted value curve for a Move. The defining feature
// is the VALUE-HAIRCUT MODEL: gross value is never claimed. Six discount
// factors — adoption risk, data readiness, process dependency, integration
// complexity, control burden, sponsor strength — compound to a haircut that
// is applied to the gross value range. The forecast is the net.
//
// This module NEVER returns raw optimism. The haircut is mandatory and the
// gross figure is surfaced alongside the net so a reviewer can see the
// discount that was taken.
//
// Pure module: deterministic, no I/O.

import { rangeOf, round2, type Range } from './types';
import {
  buildValueForecastDistributions,
  type ProbabilisticInputs,
  type ValueForecastDistributions,
} from './probabilistic';

/** The six haircut dimensions. Each score is 0..1, where 1 = full confidence. */
export interface HaircutScores {
  /** Will the target users actually adopt it? 1 = high adoption confidence. */
  adoptionRisk: number;
  /** Is the data ready? 1 = data is unified, clean, instrumented. */
  dataReadiness: number;
  /** Does value depend on a process redesign landing? 1 = independent. */
  processDependency: number;
  /** How hard is the integration? 1 = simple, well-understood connectors. */
  integrationComplexity: number;
  /** Control / governance burden. 1 = light controls, no blockers. */
  controlBurden: number;
  /** Sponsor strength. 1 = strong, engaged, empowered sponsor. */
  sponsorStrength: number;
}

/** Weighting of each dimension in the compounded haircut. Must sum to 1. */
export interface HaircutWeights {
  adoptionRisk: number;
  dataReadiness: number;
  processDependency: number;
  integrationComplexity: number;
  controlBurden: number;
  sponsorStrength: number;
}

export const DEFAULT_HAIRCUT_WEIGHTS: HaircutWeights = {
  adoptionRisk: 0.28,
  dataReadiness: 0.2,
  processDependency: 0.16,
  integrationComplexity: 0.12,
  controlBurden: 0.12,
  sponsorStrength: 0.12,
};

export interface ValueForecastInput {
  moveName: string;
  /**
   * Gross annual value if everything goes perfectly — a range. This is the
   * optimistic ceiling; the haircut model discounts it to a forecast.
   */
  grossAnnualValue: Range;
  /** Number of years the value curve is projected over. */
  horizonYears: number;
  /**
   * Per-year adoption ramp as fractions (0..1). Length must equal horizonYears.
   * E.g. [0.3, 0.7, 1.0] = 30% of steady-state value in year 1.
   */
  adoptionCurve: number[];
  haircutScores: HaircutScores;
  /** Optional weight override; defaults to DEFAULT_HAIRCUT_WEIGHTS. */
  weights?: HaircutWeights;
  /**
   * True when the gross value range itself rests on a seed-gap proxy (e.g.
   * a missing cost-per-contact baseline). Forces `monetisationBlocked`.
   */
  grossValueIsProxy?: boolean;
  /** Optional probabilistic wrapper inputs. Omitted preserves deterministic output. */
  probabilistic?: ProbabilisticInputs | null;
}

export interface HaircutFactor {
  dimension: keyof HaircutScores;
  score: number;
  weight: number;
  /** Contribution to the total discount (weight * (1 - score)). */
  discountContribution: number;
}

export interface ValueForecastYear {
  year: number;
  adoptionFraction: number;
  /** Gross value for the year (gross steady-state * adoption). */
  grossValue: Range;
  /** Net value after the haircut. */
  netValue: Range;
}

export interface ValueForecast {
  moveName: string;
  factors: HaircutFactor[];
  /** Compounded haircut (0..1) — the fraction of gross value discounted. */
  totalHaircut: number;
  /** The retained fraction (1 - totalHaircut). */
  retainedFraction: number;
  /** Per-year value curve. */
  curve: ValueForecastYear[];
  /** Total net value over the horizon. */
  totalNetValue: Range;
  /** Total gross value over the horizon (for transparency). */
  totalGrossValue: Range;
  /**
   * True when the value cannot be honestly monetised because the gross figure
   * rests on a seed gap. The compiler must surface this, not paper over it.
   */
  monetisationBlocked: boolean;
  /** Optional distribution wrappers for a later Monte Carlo sampler. */
  probabilistic?: ValueForecastDistributions | null;
}

function assertWeightsSumToOne(w: HaircutWeights): void {
  const sum =
    w.adoptionRisk +
    w.dataReadiness +
    w.processDependency +
    w.integrationComplexity +
    w.controlBurden +
    w.sponsorStrength;
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Haircut weights must sum to 1 (got ${sum}).`);
  }
}

function scaleRange(r: Range, f: number): Range {
  return {
    low: round2(r.low * f),
    point: round2(r.point * f),
    high: round2(r.high * f),
  };
}

/**
 * Build a value forecast with a mandatory haircut. Throws if the adoption
 * curve length mismatches the horizon, scores are outside 0..1, or weights do
 * not sum to 1.
 */
export function buildValueForecast(
  input: ValueForecastInput,
): ValueForecast {
  if (input.horizonYears <= 0) {
    throw new Error('horizonYears must be positive.');
  }
  if (input.adoptionCurve.length !== input.horizonYears) {
    throw new Error(
      `adoptionCurve length (${input.adoptionCurve.length}) must equal ` +
        `horizonYears (${input.horizonYears}).`,
    );
  }
  const weights = input.weights ?? DEFAULT_HAIRCUT_WEIGHTS;
  assertWeightsSumToOne(weights);

  const dims = Object.keys(weights) as Array<keyof HaircutScores>;
  // Raw (unrounded) contributions are used for the total so a small but
  // non-zero haircut is never rounded away to a misleading zero.
  let rawHaircut = 0;
  const factors: HaircutFactor[] = dims.map((dimension) => {
    const score = input.haircutScores[dimension];
    if (score < 0 || score > 1) {
      throw new Error(
        `Haircut score '${dimension}' must be within 0..1 (got ${score}).`,
      );
    }
    const weight = weights[dimension];
    const raw = weight * (1 - score);
    rawHaircut += raw;
    return {
      dimension,
      score,
      weight,
      // Reported to 4 dp so sub-1% contributions remain visible.
      discountContribution: Math.round(raw * 10_000) / 10_000,
    };
  });

  // The haircut is the weighted sum of (1 - score) across dimensions. With
  // weights summing to 1 it lands in 0..1: all scores 1 → 0 haircut, all
  // scores 0 → full haircut. This is the explicit anti-optimism mechanism.
  const totalHaircut = Math.round(rawHaircut * 10_000) / 10_000;
  const retainedFraction = Math.round((1 - totalHaircut) * 10_000) / 10_000;

  const curve: ValueForecastYear[] = input.adoptionCurve.map((adoption, i) => {
    if (adoption < 0 || adoption > 1) {
      throw new Error(`adoptionCurve[${i}] must be within 0..1.`);
    }
    const grossValue = scaleRange(input.grossAnnualValue, adoption);
    return {
      year: i + 1,
      adoptionFraction: adoption,
      grossValue,
      netValue: scaleRange(grossValue, retainedFraction),
    };
  });

  const sumRange = (pick: (y: ValueForecastYear) => Range): Range =>
    curve.reduce(
      (acc, y) => {
        const r = pick(y);
        return {
          low: round2(acc.low + r.low),
          point: round2(acc.point + r.point),
          high: round2(acc.high + r.high),
        };
      },
      rangeOf(0, 0),
    );

  return {
    moveName: input.moveName,
    factors,
    totalHaircut,
    retainedFraction,
    curve,
    totalNetValue: sumRange((y) => y.netValue),
    totalGrossValue: sumRange((y) => y.grossValue),
    monetisationBlocked: input.grossValueIsProxy ?? false,
    probabilistic: buildValueForecastDistributions(
      input.adoptionCurve,
      input.probabilistic,
    ),
  };
}
