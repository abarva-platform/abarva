/**
 * Nexus Pricing Engine — structured formula terms (ROM increment 1).
 *
 * Every hours line `runEffortEngine` emits carries, beside its human-readable
 * `formulaTrace`, an ordered list of `FormulaTerm`s describing the SAME
 * arithmetic as typed cells (count, unit hours, factor, allocation, rate…),
 * so a later workbook builder can write real spreadsheet formulas instead of
 * pasting values.
 *
 * The reconciliation contract (asserted by `evaluateFormulaTerms` and by the
 * tests): the line's hours equal
 *
 *     roundHours( Π(multiplied terms, in list order) + Σ(rounding terms) )
 *
 * and, for a priced line, its labor cost equals `hoursToCents(hours, rate)`.
 * The engine rounds hours to 4 decimals at several pipeline steps (pack
 * expected total, per-rule share, per-role hours); a single product of the
 * inputs can therefore differ from the engine's line hours in the 4th
 * decimal. When it does, the builder appends ONE explicit `rounding` term
 * (the exact difference) rather than hiding it — so the terms reconcile
 * exactly and the carried rounding is visible.
 *
 * Pure, no I/O.
 */
import { hoursToCents, roundHours } from "./money";
import type { Cents, FormulaCellRole, FormulaTerm } from "./types";

const MULTIPLIED_ROLES: ReadonlySet<FormulaCellRole> = new Set<FormulaCellRole>(
  ["count", "unit_hours", "base_hours", "percentage", "factor", "allocation"],
);

export interface FormulaTermsEvaluation {
  hours: number;
  /** Null when the terms carry no `rate` term (an unpriced or hours-only line). */
  costCents: Cents | null;
}

export class FormulaTermsReconciliationError extends Error {
  constructor(message: string) {
    super(`formula_terms_reconciliation: ${message}`);
    this.name = "FormulaTermsReconciliationError";
  }
}

function productOf(terms: readonly FormulaTerm[]): number {
  let product = 1;
  for (const term of terms) {
    if (MULTIPLIED_ROLES.has(term.cellRole)) product *= term.value;
  }
  return product;
}

/**
 * Recompute a line's hours (and cost, when a rate term is present) from its
 * terms alone — never reading the `result` / `cost_result` terms. Returns
 * null for an empty term list (a line with no hours).
 */
export function evaluateFormulaTerms(
  terms: readonly FormulaTerm[],
): FormulaTermsEvaluation | null {
  if (terms.length === 0) return null;
  let rounding = 0;
  let rateCents: number | null = null;
  for (const term of terms) {
    if (term.cellRole === "rounding") rounding += term.value;
    else if (term.cellRole === "rate") rateCents = term.value;
  }
  const hours = roundHours(productOf(terms) + rounding);
  return {
    hours,
    costCents: rateCents === null ? null : hoursToCents(hours, rateCents),
  };
}

/**
 * Close a list of multiplied input terms with the line's actual hours:
 * appends a `rounding` term only when the plain product does not already
 * round to `resultHours`, then the `result` term. Throws if the closed list
 * would not reconcile (a defect in the caller, never a data condition).
 */
export function closeHoursTerms(
  inputs: readonly FormulaTerm[],
  resultHours: number,
  resultLabel: string,
): FormulaTerm[] {
  const terms: FormulaTerm[] = [...inputs];
  const product = productOf(inputs);
  if (roundHours(product) !== resultHours) {
    terms.push({
      label: "engine rounding carried (4 dp per pipeline step)",
      value: resultHours - product,
      source: "engine",
      cellRole: "rounding",
    });
  }
  terms.push({
    label: resultLabel,
    value: resultHours,
    source: "engine",
    cellRole: "result",
  });
  const check = evaluateFormulaTerms(terms);
  if (!check || check.hours !== resultHours) {
    throw new FormulaTermsReconciliationError(
      `terms evaluate to ${check?.hours ?? "nothing"}h, line carries ${resultHours}h`,
    );
  }
  return terms;
}

/** Append the rate and cost cells to an already-closed hours term list. */
export function appendCostTerms(
  terms: FormulaTerm[],
  rateCents: Cents,
  rateSource: string,
  costCents: Cents,
): FormulaTerm[] {
  terms.push({
    label: "hourly rate (cents)",
    value: rateCents,
    source: rateSource,
    cellRole: "rate",
  });
  terms.push({
    label: "labor cost (cents)",
    value: costCents,
    source: "engine",
    cellRole: "cost_result",
  });
  const check = evaluateFormulaTerms(terms);
  if (!check || check.costCents !== costCents) {
    throw new FormulaTermsReconciliationError(
      `terms evaluate to ${check?.costCents ?? "no"} cents, line carries ${costCents}`,
    );
  }
  return terms;
}

/**
 * Recompute an hourly rate from its rate terms: round(Π of every `rate` and
 * `factor` term, in list order) to a whole cent. Returns null for an empty
 * list. Used by the pod pricer to refuse a rate whose provenance does not
 * reconcile.
 */
export function evaluateRateTerms(terms: readonly FormulaTerm[]): Cents | null {
  let product = 1;
  let seen = 0;
  for (const term of terms) {
    if (term.cellRole === "rate" || term.cellRole === "factor") {
      product *= term.value;
      seen += 1;
    }
  }
  return seen === 0 ? null : Math.round(product);
}
