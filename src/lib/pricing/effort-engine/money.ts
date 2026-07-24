/**
 * Nexus Pricing Engine — PR4 integer-cents money helpers.
 *
 * See `types.ts`'s file header for why this engine uses integer cents
 * internally rather than the rest of the repo's plain-float convention.
 * Every function here is pure and rounds at most once per call, at the
 * single point a fractional cent value would otherwise arise (hours × a
 * cents-denominated rate). Summing already-integer cents never needs
 * rounding — `sumCents` is plain integer addition.
 */
import type { Cents } from "./types";

/** Round-half-away-from-zero to the nearest whole cent. */
function roundToCent(value: number): Cents {
  return Math.round(value);
}

/** Convert a decimal dollar amount (e.g. 145.5) to integer cents (14550). */
export function dollarsToCents(dollars: number): Cents {
  return roundToCent(dollars * 100);
}

/** Convert integer cents to a decimal dollar amount, for DISPLAY ONLY — never feed back into further cents arithmetic. */
export function centsToDisplayDollars(cents: Cents): number {
  return cents / 100;
}

/** hours × hourlyRateCents, rounded once to the nearest cent. */
export function hoursToCents(hours: number, hourlyRateCents: Cents): Cents {
  return roundToCent(hours * hourlyRateCents);
}

/** Sum of integer cent values — safe, exact, no rounding needed. */
export function sumCents(...values: readonly Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}

/** Apply a decimal multiplier (e.g. a range-policy low/high band) to a cents value, rounded once. */
export function applyMultiplierToCents(cents: Cents, multiplier: number): Cents {
  return roundToCent(cents * multiplier);
}

/**
 * Round an hours value to 4 decimal places (1/100th of a minute). Applied at
 * each defined step of the effort pipeline so chained multiplications
 * (complexity × novelty × assurance × scenario × allocation) don't
 * accumulate IEEE-754 representation noise into the line-item provenance —
 * NOT because JS float math is non-deterministic (it is fully deterministic
 * for a fixed sequence of operations), but so the numbers a human reviews in
 * the provenance drilldown are clean and so repeated runs of the SAME
 * pipeline against the same inputs are trivially, visibly identical.
 */
export function roundHours(value: number): number {
  return Math.round(value * 10000) / 10000;
}
