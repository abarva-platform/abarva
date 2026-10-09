/**
 * Moves value engine — timing: start, ramp, payment lag, phase-down.
 *
 * A lever's annual figure is a steady-state run rate. In horizon month m
 * (1-based) it EARNS
 *
 *     round( annualCents × ramp(m) × phaseDown(m) / 12 )
 *
 * where ramp(m) = 0 before `startMonth`, then min(1, k / rampMonths) in its
 * k-th earning month (1 at once when rampMonths = 0), and phaseDown(m) is the
 * factor of the latest phase-down entry whose `fromMonth` ≤ m (1 when none).
 * Cash ARRIVES `paymentLagMonths` later; anything earned so late that its
 * cash would land after the horizon is not counted. Each month rounds once.
 *
 * Pure, no I/O.
 */
import type { Cents, LeverTiming } from "./types";

/** Why a timing block cannot be used, or null when it is valid. */
export function timingViolation(
  timing: LeverTiming,
  horizonMonths: number,
): string | null {
  const { startMonth, rampMonths, paymentLagMonths, phaseDown } = timing;
  if (
    !Number.isInteger(startMonth) ||
    startMonth < 1 ||
    startMonth > horizonMonths
  ) {
    return `startMonth must be a whole month from 1 to ${horizonMonths}.`;
  }
  if (!Number.isInteger(rampMonths) || rampMonths < 0) {
    return "rampMonths must be a whole number ≥ 0.";
  }
  if (!Number.isInteger(paymentLagMonths) || paymentLagMonths < 0) {
    return "paymentLagMonths must be a whole number ≥ 0.";
  }
  let previous = 0;
  for (const entry of phaseDown ?? []) {
    if (!Number.isInteger(entry.fromMonth) || entry.fromMonth <= previous) {
      return "phaseDown months must be whole and strictly increasing.";
    }
    if (
      !Number.isFinite(entry.factor) ||
      entry.factor < 0 ||
      entry.factor > 1
    ) {
      return "phaseDown factors must be within 0..1.";
    }
    previous = entry.fromMonth;
  }
  return null;
}

/** The fraction of the annual run rate earned in 1-based month `month`. */
export function earnedFraction(timing: LeverTiming, month: number): number {
  if (month < timing.startMonth) return 0;
  const k = month - timing.startMonth + 1;
  const ramp = timing.rampMonths > 0 ? Math.min(1, k / timing.rampMonths) : 1;
  let phase = 1;
  for (const entry of timing.phaseDown ?? []) {
    if (entry.fromMonth <= month) phase = entry.factor;
  }
  return ramp * phase;
}

/** Cents earned in each horizon month (index 0 = month 1). */
export function monthlyEarnedCents(
  annualCents: Cents,
  timing: LeverTiming,
  horizonMonths: number,
): Cents[] {
  const out: Cents[] = [];
  for (let month = 1; month <= horizonMonths; month += 1) {
    out.push(Math.round((annualCents * earnedFraction(timing, month)) / 12));
  }
  return out;
}

/** Cents of cash arriving in each horizon month, after the payment lag. */
export function monthlyCashCents(
  annualCents: Cents,
  timing: LeverTiming,
  horizonMonths: number,
): Cents[] {
  const earned = monthlyEarnedCents(annualCents, timing, horizonMonths);
  const out: Cents[] = [];
  for (let month = 1; month <= horizonMonths; month += 1) {
    const earnedMonth = month - timing.paymentLagMonths;
    out.push(earnedMonth >= 1 ? earned[earnedMonth - 1] : 0);
  }
  return out;
}
