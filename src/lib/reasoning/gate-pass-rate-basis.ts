/**
 * The basis of the portfolio gate-pass-rate figure.
 *
 * The figure on the Home reasoning row used to be labelled "avg across all
 * instances". It is not an average of per-instance rates: it is a single
 * pooled ratio of criteria. Two further properties of the underlying count
 * were invisible to the reader:
 *
 *  - it counts only the criteria of each instance's CURRENT stage, because
 *    the synthesis context is built with `evaluateStage(currentStage, ...)`,
 *    not `evaluateAllStages(...)`;
 *  - a criterion excused by a waiver is counted as cleared, which is correct
 *    for the question "can this advance?" that the upstream count answers,
 *    but is not the same as "this was established".
 *
 * This module keeps the number exactly as it was and gives the surface a
 * description derived from the same counts, so the figure names the set it
 * measures instead of claiming a set it never counted.
 */

export interface GatePassRateBasis {
  /**
   * Criteria counted as cleared. Includes criteria cleared by waiver rather
   * than satisfied by evidence.
   */
  cleared: number;
  /** Criteria evaluated — the denominator of the figure. */
  evaluated: number;
  /** Instances that contributed at least one evaluated criterion. */
  instances: number;
}

/**
 * The pooled percentage, rounded. Returns `null` when nothing was evaluated,
 * so a caller never renders a percentage over an empty denominator.
 */
export function gatePassRatePct(basis: GatePassRateBasis): number | null {
  if (basis.evaluated <= 0) return null;
  return Math.round((basis.cleared / basis.evaluated) * 100);
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * One line stating what the figure counted. Derived from the same counts that
 * produce the percentage, never from the rendered percentage or from display
 * copy, so a wording change cannot make the two disagree.
 */
export function describeGatePassRateBasis(basis: GatePassRateBasis): string {
  if (basis.evaluated <= 0) {
    return 'no current-stage gates evaluated';
  }
  return `${basis.cleared} of ${plural(basis.evaluated, 'current-stage gate')} cleared · ${plural(basis.instances, 'instance')}`;
}

/**
 * The caveat a reader needs to not over-read the figure: a waived criterion is
 * inside the numerator. Stated unconditionally, because the count cannot
 * distinguish a satisfied criterion from an excused one.
 */
export const GATE_PASS_RATE_WAIVER_CAVEAT =
  'Counts a gate cleared by waiver as cleared.';
