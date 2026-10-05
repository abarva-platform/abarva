/**
 * How a `SynthesisContext.gatesSummary` got its numbers — and how a surface
 * should word them.
 *
 * The program synthesis context has two construction paths. The pattern-aware
 * path runs the gate evaluator and counts real criteria, so `met`/`total` are a
 * measurement. The shape-only fallback (no typed pattern available) has no
 * criteria to count at all; it reports the phase gate's own standing as
 * `total: 1, met: gateApproved ? 1 : 0`. Those are the same two fields, so a
 * surface that formats them as `met / total` renders a single boolean with the
 * authority of a ratio — "0 / 1 gates met" reads as one criterion assessed and
 * failed, when nothing was assessed.
 *
 * The counts themselves are left alone: downstream readers that ask *can this
 * advance?* are right to treat an approved gate as cleared. What was missing is
 * the basis, so a surface can say which question its number answers.
 */

/** Whether a gates summary counts evaluated criteria, or only gate standing. */
export type GateSummaryBasis = 'criteria' | 'gate-standing';

type GateSummaryShape = {
  total: number;
  met: number;
  basis?: GateSummaryBasis;
};

/**
 * The basis of a gates summary. The shape-only path stamps `gate-standing`
 * explicitly, so an absent basis reads as `criteria`. Deliberately NOT inferred
 * from `total === 1`: a pattern can declare exactly one criterion for a stage,
 * and guessing would relabel that real measurement as unmeasured.
 */
export function gateSummaryBasis(summary: GateSummaryShape): GateSummaryBasis {
  return summary.basis ?? 'criteria';
}

/** True when `met`/`total` are a count of evaluated gate criteria. */
export function isCriteriaMeasured(summary: GateSummaryShape): boolean {
  return gateSummaryBasis(summary) === 'criteria';
}

/**
 * A phrase for `met`/`total` that states what was counted. Criteria-measured
 * summaries keep the familiar ratio wording; a gate-standing summary says the
 * gate's state and that no criteria were evaluated, rather than formatting the
 * boolean as a ratio.
 */
export function describeGateSummary(summary: GateSummaryShape): string {
  if (isCriteriaMeasured(summary)) {
    return `${summary.met} of ${summary.total} gate criteria met`;
  }
  return summary.met > 0
    ? 'Gate approved — no criteria evaluated'
    : 'Gate not approved — no criteria evaluated';
}
