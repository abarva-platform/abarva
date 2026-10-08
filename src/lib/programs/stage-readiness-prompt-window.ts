/**
 * Which phases read the PRECEDING transition's accepted readiness-workbook
 * answers into their generation prompt.
 *
 * Why this is a decision worth naming rather than an inline comparison.
 *
 * A phase's transition workbook is filled in and reviewed on the phase BEFORE
 * the one it feeds: the `P<n> to P<n+1>` workbook is offered on P<n>, its review
 * artifact is stored at `sourcePhase: n` / `targetPhase: n + 1`, and the answers
 * a human accepted there are what the NEXT phase should be written from. So the
 * phase doing the generating reads the review whose `targetPhase` is its own
 * number — `loadStageReadinessPromptContext(ctx, moveId, phase)`.
 *
 * The window therefore has to start at the first phase that HAS a preceding
 * transition, and that is P1, not P2. The P0 to P1 workbook is a first-class
 * artifact: `GET .../stage-readiness-workbook` accepts `phase` in [0,4] and
 * serves it, the P0 screen offers the download, the sample pack and the
 * parse/review control (`shouldOfferStageReadinessWorkbook` with a non-null
 * href, which is every phase below 5), and the review persists at
 * `sourcePhase: 0`. `findStageReadinessReviewArtifact` supports it too — it
 * refuses only `sourcePhase < 0`.
 *
 * Starting the window at P2 therefore dropped the whole P0 to P1 review from the
 * P1 Charter build, which is the FIRST deliverable-generating phase: an operator
 * filled the workbook in, uploaded it and accepted its answers, and the charter
 * was then written without one of them. Nothing reported the drop, because the
 * block is additive — an empty string reads exactly like a transition with no
 * accepted answers.
 *
 * The premium artifact path did not have this gap: `createMovesGenerateArtifactDeps`
 * reads the same context with no phase floor at all, so a premium P1 build saw
 * the answers an orchestrated P1 build could not. The orchestrated path is what
 * the phase workspace's Approve & Build control enqueues, so the gap was on the
 * live path and not on the one that already worked.
 *
 * This loosens no gate. The prompt reading is deliberately NOT a forward-control
 * policy (see `stage-readiness-workbooks/prompt-context.ts`): nothing here is
 * consulted by `applyStageReadinessToEvidencePackets`, the phase-gate approval
 * route, or `assessStageReadinessGate`. Widening it can only add accepted,
 * human-sourced answers to a prompt; it cannot make a phase closable that was
 * not already closable.
 */

/**
 * The first phase with a preceding transition to read. P0 has none — its review
 * would sit at `sourcePhase: -1`, which the artifact lookup refuses.
 */
export const FIRST_PHASE_READING_PRECEDING_TRANSITION = 1;

/** The last Moves phase, and so the last one that reads a transition review. */
export const LAST_PHASE_READING_PRECEDING_TRANSITION = 5;

/**
 * True when this phase's generation prompt should be given the accepted answers
 * from the `P<phase-1> to P<phase>` readiness workbook review.
 *
 * Callers pass the phase being generated; the review to load is keyed by that
 * same number as its `targetPhase`.
 */
export function phaseReadsPrecedingTransitionReview(phase: number): boolean {
  return (
    Number.isInteger(phase) &&
    phase >= FIRST_PHASE_READING_PRECEDING_TRANSITION &&
    phase <= LAST_PHASE_READING_PRECEDING_TRANSITION
  );
}
