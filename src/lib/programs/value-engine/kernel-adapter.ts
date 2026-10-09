/**
 * Moves value engine → expert-kernel `ValueForecast`.
 *
 * Lets the CFO pack, the business-case compiler and board-grade readers keep
 * reading the kernel's shape while the numbers come from the engine.
 *
 * DO NOT DISCOUNT RISK TWICE. The engine already prices risk per lever
 * (attribution × probability). When the engine runs, the kernel's six-factor
 * haircut is NOT applied on top: the forecast's net equals the engine's
 * counted cash, `totalHaircut` is 0 and `factors` is empty. If haircut scores
 * are supplied, the kernel's figure is computed and returned beside the
 * forecast in `kernelCrossCheck` with `applied: false` — a cross-check a
 * reviewer can compare, never a number any reader should use.
 *
 * Curve years are the engine's monthly cash (after ramp and payment lag)
 * summed per horizon year, in dollars. A blocked engine result maps to
 * `monetisationBlocked: true` with a zero curve.
 *
 * Pure, no I/O.
 */
import { round2, type Range } from "../expert-kernel/types";
import {
  buildValueForecast,
  type HaircutScores,
  type HaircutWeights,
  type ValueForecast,
  type ValueForecastYear,
} from "../expert-kernel/value-forecast";
import type { Cents, ValueCaseResult } from "./types";

export interface KernelHaircutCrossCheck {
  applied: false;
  totalHaircut: number;
  retainedFraction: number;
  /** What the kernel would have reported as horizon net had its haircut been applied on top. */
  netIfApplied: Range;
}

export interface EngineValueForecast extends ValueForecast {
  source: "value_engine";
  kernelCrossCheck: KernelHaircutCrossCheck | null;
}

function dollars(cents: Cents): number {
  return round2(cents / 100);
}

function yearSum(monthly: readonly Cents[], year: number): Cents {
  let sum = 0;
  for (let m = (year - 1) * 12; m < year * 12; m += 1) sum += monthly[m] ?? 0;
  return sum;
}

export function valueForecastFromEngine(
  result: ValueCaseResult,
  options: {
    moveName: string;
    haircutScores?: HaircutScores;
    weights?: HaircutWeights;
  },
): EngineValueForecast {
  const years = Number.isInteger(result.horizonYears)
    ? Math.max(0, result.horizonYears)
    : 0;
  const economics = result.economics;
  const zero: Range = { low: 0, point: 0, high: 0 };
  if (!economics) {
    return {
      source: "value_engine",
      moveName: options.moveName,
      factors: [],
      totalHaircut: 0,
      retainedFraction: 1,
      curve: Array.from({ length: years }, (_, i) => ({
        year: i + 1,
        adoptionFraction: 0,
        grossValue: zero,
        netValue: zero,
      })),
      totalNetValue: zero,
      totalGrossValue: zero,
      monetisationBlocked: true,
      probabilistic: null,
      kernelCrossCheck: null,
    };
  }

  const annualBase = economics.annualCashCents.base;
  const curve: ValueForecastYear[] = [];
  let totalLow = 0;
  let totalBase = 0;
  let totalHigh = 0;
  for (let year = 1; year <= years; year += 1) {
    const low = yearSum(economics.monthlyCashCents.low, year);
    const base = yearSum(economics.monthlyCashCents.base, year);
    const high = yearSum(economics.monthlyCashCents.high, year);
    totalLow += low;
    totalBase += base;
    totalHigh += high;
    const net: Range = {
      low: dollars(low),
      point: dollars(base),
      high: dollars(high),
    };
    curve.push({
      year,
      adoptionFraction:
        annualBase > 0
          ? Math.min(1, Math.round((base / annualBase) * 10_000) / 10_000)
          : 0,
      grossValue: net,
      netValue: net,
    });
  }
  const totalNet: Range = {
    low: dollars(totalLow),
    point: dollars(totalBase),
    high: dollars(totalHigh),
  };

  let kernelCrossCheck: KernelHaircutCrossCheck | null = null;
  if (options.haircutScores && years > 0) {
    const kernel = buildValueForecast({
      moveName: options.moveName,
      grossAnnualValue: {
        low: dollars(economics.annualCashCents.low),
        point: dollars(economics.annualCashCents.base),
        high: dollars(economics.annualCashCents.high),
      },
      horizonYears: years,
      adoptionCurve: curve.map((year) => year.adoptionFraction),
      haircutScores: options.haircutScores,
      weights: options.weights,
    });
    kernelCrossCheck = {
      applied: false,
      totalHaircut: kernel.totalHaircut,
      retainedFraction: kernel.retainedFraction,
      netIfApplied: kernel.totalNetValue,
    };
  }

  return {
    source: "value_engine",
    moveName: options.moveName,
    factors: [],
    totalHaircut: 0,
    retainedFraction: 1,
    curve,
    totalNetValue: totalNet,
    totalGrossValue: totalNet,
    monetisationBlocked: false,
    probabilistic: null,
    kernelCrossCheck,
  };
}
