/**
 * Moves value engine — formula terms.
 *
 * Mirrors the ROM engine's contract (`src/lib/pricing/effort-engine/
 * formula-terms.ts`): every money figure carries an ordered term list from
 * which the figure is recomputed EXACTLY, so a workbook can write real
 * formulas instead of pasted values.
 *
 * Two shapes, never mixed:
 *  - a PRODUCT figure (a lever's annual cents): Math.round(Π of every
 *    multiplied term, in list order). The engine computes the figure with
 *    the same product in the same order, so it reconciles by construction.
 *  - a SUM figure (a total, or NPV): Math.round(Σ of every `addend`, in list
 *    order).
 * The `result` term holds the figure and is never read by the evaluator.
 *
 * Pure, no I/O.
 */
import type { ValueFormulaCellRole, ValueFormulaTerm } from "./types";

const MULTIPLIED_ROLES: ReadonlySet<ValueFormulaCellRole> =
  new Set<ValueFormulaCellRole>([
    "driver_delta",
    "base",
    "unit_value",
    "margin",
    "refill_share",
    "share",
    "attribution",
    "probability",
    "unit_conversion",
    "overlap_exclusion",
    "release_gate",
  ]);

export class ValueFormulaReconciliationError extends Error {
  constructor(message: string) {
    super(`value_formula_reconciliation: ${message}`);
    this.name = "ValueFormulaReconciliationError";
  }
}

/** Round once to a whole number, never returning negative zero. */
export function roundWhole(value: number): number {
  const rounded = Math.round(value);
  return rounded === 0 ? 0 : rounded;
}

export function isMultipliedRole(role: ValueFormulaCellRole): boolean {
  return MULTIPLIED_ROLES.has(role);
}

/** Π of the multiplied terms in list order (1 for none). */
export function productOfTerms(terms: readonly ValueFormulaTerm[]): number {
  let product = 1;
  for (const term of terms) {
    if (MULTIPLIED_ROLES.has(term.cellRole)) product *= term.value;
  }
  return product;
}

/** Σ of the addend terms in list order (0 for none). */
export function sumOfAddends(terms: readonly ValueFormulaTerm[]): number {
  let sum = 0;
  for (const term of terms) {
    if (term.cellRole === "addend") sum += term.value;
  }
  return sum;
}

/**
 * Recompute a figure from its terms alone (never reading the `result`).
 * Null for an empty list. Throws when a list mixes products and addends.
 */
export function evaluateValueFormulaTerms(
  terms: readonly ValueFormulaTerm[],
): number | null {
  const inputs = terms.filter((term) => term.cellRole !== "result");
  if (inputs.length === 0) return null;
  const addends = inputs.filter((term) => term.cellRole === "addend");
  if (addends.length > 0 && addends.length !== inputs.length) {
    throw new ValueFormulaReconciliationError(
      "a term list mixes addends with multiplied terms",
    );
  }
  return addends.length > 0
    ? roundWhole(sumOfAddends(inputs))
    : roundWhole(productOfTerms(inputs));
}

function close(
  inputs: readonly ValueFormulaTerm[],
  figure: number,
  label: string,
): ValueFormulaTerm[] {
  const terms: ValueFormulaTerm[] = [
    ...inputs,
    { label, value: figure, source: "engine", cellRole: "result" },
  ];
  // An empty sum (no in-cash levers) is 0 with only its result term.
  const check = inputs.length === 0 ? 0 : evaluateValueFormulaTerms(terms);
  if (check !== figure) {
    throw new ValueFormulaReconciliationError(
      `${label}: terms evaluate to ${check ?? "nothing"}, figure is ${figure}`,
    );
  }
  return terms;
}

/** Compute a product figure from its terms and close the list with it. */
export function closeProductTerms(
  inputs: readonly ValueFormulaTerm[],
  label: string,
): { figure: number; terms: ValueFormulaTerm[] } {
  const figure = roundWhole(productOfTerms(inputs));
  return { figure, terms: close(inputs, figure, label) };
}

/** Compute a sum figure from its addends and close the list with it. */
export function closeSumTerms(
  addends: readonly ValueFormulaTerm[],
  label: string,
): { figure: number; terms: ValueFormulaTerm[] } {
  const figure = roundWhole(sumOfAddends(addends));
  return { figure, terms: close(addends, figure, label) };
}
