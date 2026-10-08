/**
 * Whether a phase screen should offer the stage-readiness workbook actions —
 * the download link, the sample upload pack, and the parse/review control.
 *
 * Why this is a decision worth naming rather than an inline condition.
 *
 * The workbook is not optional reading. `applyStageReadinessToEvidencePackets`
 * (`stage-readiness-workbooks/gate-readiness.ts`) appends a REQUIRED evidence
 * packet — `stage_readiness_p<n>_p<n+1>`, status `missing` — for every phase in
 * 1..4 whose transition workbook has no accepted review, and
 * `currentPhaseRequiredEvidenceGaps` then counts it. Both the gate and the
 * build read that count:
 *
 * - `POST .../phase-gate-approval` refuses with 409 `transition_evidence_incomplete`;
 * - `POST /api/v1/deliverables/generate-phase` refuses with 409 `required_evidence_open`.
 *
 * So on P1..P4 the accepted workbook review is a hard precondition for closing
 * the phase at all, and the control below is the ONLY producer of the artifact
 * `loadAcceptedStageReadinessContext` reads. If it does not render, the phase
 * cannot be closed and no other screen can clear the item.
 *
 * The condition it replaces read `phase < 3 || substep.key === "approve"`:
 * on the two longer phases the workbook stayed hidden until the legacy
 * contract-steps canvas reached its final "Approve & Build" substep. That is a
 * sound reading of WHERE THE USER IS only while the legacy canvas is what
 * renders, because its stepper is what moves `substepIndex`. Under
 * `moves_capture_v2` the redesigned 3-step flow renders instead and keeps its
 * own step state; nothing on the phase view moves `substepIndex`, so it stays
 * at its initial value — 0 for an ordinary visit. On P3 and P4 that made the
 * control permanently absent, and the blocked-phase notice's own next-action
 * button, which scrolls to the review control or to the document root when it
 * is missing, pointed at nothing.
 *
 * Under the redesigned flow the workbook is therefore offered for the whole
 * phase, exactly as P1 and P2 already offer it under both UIs. The legacy
 * canvas keeps its substep rule unchanged.
 */

export type StageReadinessWorkbookOfferInput = {
  /** The phase being viewed. */
  phase: number;
  /**
   * The legacy contract-steps substep key, e.g. `"prepare"` or `"approve"`.
   * Only consulted when the legacy canvas is what renders.
   */
  substepKey: string;
  /**
   * True when the redesigned 3-step capture flow is mounted for this phase
   * (`moves_capture_v2`), so `substepKey` is not a reading of where the user is.
   */
  captureFlowMounted: boolean;
  /**
   * True when the phase has a workbook transition at all. P5 has no P5->P6
   * workbook, and `applyStageReadinessToEvidencePackets` returns early above
   * P4, so there is nothing to offer there.
   */
  hasWorkbookTransition: boolean;
};

/**
 * The phases whose legacy canvas defers the workbook to its final substep. P0,
 * P1 and P2 offer it throughout; P3 and P4 carry more substeps and used to hold
 * it back.
 */
const LEGACY_DEFERRED_PHASES = new Set([3, 4]);

export function shouldOfferStageReadinessWorkbook({
  phase,
  substepKey,
  captureFlowMounted,
  hasWorkbookTransition,
}: StageReadinessWorkbookOfferInput): boolean {
  if (!hasWorkbookTransition) return false;
  if (captureFlowMounted) return true;
  if (!LEGACY_DEFERRED_PHASES.has(phase)) return true;
  return substepKey === "approve";
}
