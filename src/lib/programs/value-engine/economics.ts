/**
 * Moves value engine — economics: totals, NPV, payback.
 *
 * - Annual cash: Σ of the in-cash levers' annual cents (integers, exact).
 * - NPV: the one-time cost is incurred at month 0; the cash arriving in
 *   1-based month m is discounted by (1 + r)^(m / 12). The NPV terms are
 *   −cost then one addend per horizon year (that year's discounted cash,
 *   unrounded, accumulated month by month), and NPV = round(Σ addends) — the
 *   engine computes it from the same addends, so it reconciles exactly.
 * - Payback: the first 1-based month whose cumulative (undiscounted) cash is
 *   at least the cost; 0 when there is no cost; null when the horizon ends
 *   first.
 *
 * Pure, no I/O.
 */
import { closeSumTerms } from "./formula-terms";
import type { Cents, ValueFormulaTerm } from "./types";

/** Element-wise sum of monthly curves of equal length. */
export function sumCurves(curves: readonly Cents[][], months: number): Cents[] {
  const out: Cents[] = new Array<Cents>(months).fill(0);
  for (const curve of curves) {
    for (let i = 0; i < months; i += 1) out[i] += curve[i];
  }
  return out;
}

/** One unrounded discounted-cash addend per horizon year. */
export function discountedYearSums(
  monthlyCash: readonly Cents[],
  discountRate: number,
  horizonYears: number,
): number[] {
  const years: number[] = [];
  for (let year = 1; year <= horizonYears; year += 1) {
    let sum = 0;
    for (let month = (year - 1) * 12 + 1; month <= year * 12; month += 1) {
      sum += monthlyCash[month - 1] / (1 + discountRate) ** (month / 12);
    }
    years.push(sum);
  }
  return years;
}

export function npvWithTerms(
  monthlyCash: readonly Cents[],
  costCents: Cents,
  discountRate: number,
  horizonYears: number,
): { figure: Cents; terms: ValueFormulaTerm[] } {
  const addends: ValueFormulaTerm[] = [
    {
      label: "investment at month 0 (cents)",
      value: -costCents,
      source: "engine",
      cellRole: "addend",
    },
    ...discountedYearSums(monthlyCash, discountRate, horizonYears).map(
      (value, index): ValueFormulaTerm => ({
        label: `year ${index + 1} cash discounted at ${discountRate} (cents)`,
        value,
        source: "engine",
        cellRole: "addend",
      }),
    ),
  ];
  return closeSumTerms(addends, "net present value (cents)");
}

export function paybackMonth(
  monthlyCash: readonly Cents[],
  costCents: Cents,
): number | null {
  if (costCents <= 0) return 0;
  let cumulative = 0;
  for (let i = 0; i < monthlyCash.length; i += 1) {
    cumulative += monthlyCash[i];
    if (cumulative >= costCents) return i + 1;
  }
  return null;
}

export function annualTotalWithTerms(
  levers: readonly { leverId: string; cents: Cents }[],
  label: string,
): { figure: Cents; terms: ValueFormulaTerm[] } {
  return closeSumTerms(
    levers.map(
      (lever): ValueFormulaTerm => ({
        label: lever.leverId,
        value: lever.cents,
        source: "engine",
        cellRole: "addend",
      }),
    ),
    label,
  );
}
