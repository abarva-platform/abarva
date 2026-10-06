/**
 * The four display strings in the portfolio landing's "Reconciled with client inventory" strip.
 *
 * These were derived inline in the landing's server component, which made them untestable: the host
 * is an async server component (module access, tenancy, DB reads), so it cannot be rendered in
 * jsdom to pin what it produces. Three defects lived there as a result.
 *
 * 1. The count and its noun never agreed. `${declaredCount} programmes` renders "1 programmes" for
 *    a single-programme inventory, and `${trackedCount} records` renders "1 records" for a
 *    single-move portfolio. Both are reachable: the reconciliation builder returns `null` only when
 *    the declared inventory is empty, so a declared count of exactly 1 reaches this strip, and the
 *    tracked count is just the portfolio length.
 *
 * 2. A non-finite total rendered as a currency. The declared totals come from a projection
 *    (`programs.money?.total`), and the host's `!= null` test admits `NaN`, which `Intl` formats as
 *    "$NaN" — a figure-shaped string in a slot an executive reads as money.
 *
 * 3. Copy and predicate could drift apart, the failure this workstream has now hit twice. The
 *    undeclared token is a constant here and the formatter chooses it *via* the predicate, so there
 *    is no second derivation to disagree with the first.
 *
 * A declared zero is NOT undeclared. `0` is a figure the client inventory asserted and is rendered
 * as such; only the absence of a figure (`null`/`undefined`) or a non-finite one reads as undeclared.
 */

/** The governed reconciliation fields this strip is allowed to read. */
export interface PortfolioReconciliationFacts {
  readonly declaredCount: number;
  readonly trackedCount: number;
  readonly declaredBudgetUsd: number | null;
  readonly declaredValueUsd: number | null;
}

export interface PortfolioReconciliationSummary {
  readonly declaredPrograms: string;
  readonly trackedRecords: string;
  readonly declaredBudget: string;
  readonly declaredValue: string;
}

/** What the strip renders for an amount the client inventory does not declare. */
export const UNDECLARED_AMOUNT = "—";

/**
 * True only when the inventory declares a usable figure. `null`/`undefined` is an absent figure and
 * `NaN`/`Infinity` is an unusable one; a declared `0` is a figure and passes.
 */
export function hasDeclaredAmount(
  amountUsd: number | null | undefined,
): amountUsd is number {
  return typeof amountUsd === "number" && Number.isFinite(amountUsd);
}

/**
 * `count` with a noun that agrees with it. English plurals here are regular, so the plural is the
 * singular plus "s" and callers pass the singular only — one spelling, no pair to keep in step.
 */
export function countOf(count: number, singularNoun: string): string {
  return `${count} ${count === 1 ? singularNoun : `${singularNoun}s`}`;
}

/** Formats a declared amount, or the undeclared token. The predicate picks; the copy follows. */
export function formatDeclaredAmount(
  amountUsd: number | null | undefined,
  formatUsd: (amount: number) => string,
): string {
  return hasDeclaredAmount(amountUsd)
    ? formatUsd(amountUsd)
    : UNDECLARED_AMOUNT;
}

/**
 * Builds the strip, or `null` when there is nothing to reconcile against. `formatUsd` is injected so
 * this module stays free of the host's currency formatting and remains pure.
 */
export function buildPortfolioReconciliationSummary(
  facts: PortfolioReconciliationFacts | null | undefined,
  formatUsd: (amount: number) => string,
): PortfolioReconciliationSummary | null {
  if (!facts) return null;
  return {
    declaredPrograms: countOf(facts.declaredCount, "programme"),
    trackedRecords: countOf(facts.trackedCount, "record"),
    declaredBudget: formatDeclaredAmount(facts.declaredBudgetUsd, formatUsd),
    declaredValue: formatDeclaredAmount(facts.declaredValueUsd, formatUsd),
  };
}
