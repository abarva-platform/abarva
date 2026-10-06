/**
 * Classification of the L4 RLS regression suite's precondition outcomes.
 *
 * C-632. This lived inside `scripts/run-rls-regression.ts` as a local function,
 * which meant the only thing any test could say about it was that its name
 * appeared in the file — the gate shape this backlog exists against. It is a
 * module so the classification can be driven by execution.
 *
 * Why the classification matters: the suite raises on an unmet precondition,
 * and the runner has to tell "the suite could not run" (NOT CHECKED, exit 2)
 * apart from "the suite ran and found a leak" (FAILED, exit 1). Reporting a
 * precondition miss as a leak cries wolf; reporting a leak as a precondition
 * miss hides a P0. Both are one regex away from each other.
 */

/** The stable leading token every precondition raise in the suite carries. */
export const PRECONDITION_TOKEN = 'rls-regression precondition:';

/** The causes the suite can distinguish when a canonical tenant row does not resolve. */
export type PreconditionCause = 'absent' | 'invisible' | 'indeterminate';

const CAUSE_PATTERN = /\[cause=(absent|invisible|indeterminate)\]/;

/**
 * True when the raised message says the suite could not run, rather than that
 * it ran and found something. These exit 2 (NOT CHECKED), never 0.
 */
export function isNotCheckedPrecondition(message: string): boolean {
  return (
    message.includes(PRECONDITION_TOKEN) ||
    /RLS regression expected tenants were not supplied/.test(message)
  );
}

/**
 * The cause the suite named, or null when the message is not a canonical-tenant
 * precondition raise at all.
 *
 * `indeterminate` is a real answer, not a failure to answer: it means the suite
 * observed zero visible rows from a vantage row security filters and had no
 * unfiltered read to compare against, so both causes remain open. The remedies
 * are opposite — one mutates the control database, one does not — so a caller
 * must not fold it into either.
 */
export function classifyPreconditionCause(message: string): PreconditionCause | null {
  if (!message.includes(PRECONDITION_TOKEN)) return null;
  const match = CAUSE_PATTERN.exec(message);
  return match ? (match[1] as PreconditionCause) : null;
}

/**
 * True when the operator must NOT act on the suite's message by running the
 * canonicalization migration: either the rows are already there and merely
 * filtered, or the suite could not tell. Both were, before C-632, reported with
 * a message that prescribed that migration.
 */
export function prescribesCanonicalizationMigration(message: string): boolean {
  return classifyPreconditionCause(message) === 'absent';
}
