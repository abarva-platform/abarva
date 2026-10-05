/**
 * Whether the redesigned phase-capture hand-off recap can be opened, and what
 * it is allowed to claim when it is.
 *
 * `MovesCaptureFlow` keeps `view` in `0..3`, where 3 is the hand-off recap that
 * hosts the charter-basis rollup and the per-question basis marks. Its footer
 * spends its one forward control on the host's governed approve slot
 * (`{view === 2 && approveSlot ? <slot> : <primary>}`), and the primary's
 * `onClick` is the only caller of `go(3)`. The host supplies a non-null approve
 * slot on every path that mounts the flow, so in the configuration the product
 * actually serves the recap has no way in: it is deployed and renders nowhere.
 *
 * The remedy offered here is a REVIEW, not a second submit path. The recap can
 * be opened from the last step before anything is submitted, and when it is
 * opened that way it must not say the phase was submitted — the governed
 * approve control travels with it so the decision still runs through the gate
 * pipeline, never through a reimplementation.
 *
 * Kept as a pure module so the reachability rule and the copy it licenses are
 * testable without rendering, and so one statement of the rule serves the
 * component and its host.
 */

export type CaptureHandoffAccessInput = {
  /** `moves_capture_handoff_recap_v1` (conjoined with `moves_capture_v2`). */
  reviewEnabled: boolean;
  /** True when the host passed a governed approve slot for the last step. */
  hasApproveSlot: boolean;
};

export type CaptureHandoffAccess = {
  /**
   * True when the last step should offer a control that opens the recap
   * without submitting.
   */
  offerReviewBeforeSubmit: boolean;
  /**
   * True when the recap is reachable at all in this configuration. With an
   * approve slot and no review control it is not, which is the pinned defect.
   */
  reachable: boolean;
};

export function captureHandoffAccess({
  reviewEnabled,
  hasApproveSlot,
}: CaptureHandoffAccessInput): CaptureHandoffAccess {
  // Without an approve slot the built-in Submit still reaches the recap on its
  // own, so a review control would only duplicate it.
  const offerReviewBeforeSubmit = reviewEnabled && hasApproveSlot;
  return {
    offerReviewBeforeSubmit,
    reachable: offerReviewBeforeSubmit || !hasApproveSlot,
  };
}

export type CaptureHandoffHeadingInput = {
  phaseName: string;
  /** The next phase's display name, or null when this phase is terminal. */
  nextPhaseName: string | null;
  /** True only once this phase has actually been submitted from the flow. */
  submitted: boolean;
};

export type CaptureHandoffHeading = {
  /** Eyebrow text above the title. */
  eyebrow: string;
  /** Whether the eyebrow may carry the completion tick. */
  showTick: boolean;
  /** The title line. */
  title: string;
};

export function captureHandoffHeading({
  phaseName,
  nextPhaseName,
  submitted,
}: CaptureHandoffHeadingInput): CaptureHandoffHeading {
  if (!submitted) {
    // Opened as a review. Nothing has been submitted, so neither the eyebrow
    // nor the title may say "submitted" or "complete" — the recap would then
    // assert an approval that has not happened, which is exactly the class of
    // claim the basis work exists to stop.
    return {
      eyebrow: `Review · ${phaseName}`,
      showTick: false,
      title: nextPhaseName
        ? `Here's what you captured, before you submit ${phaseName}.`
        : `Here's what you captured, before you submit ${phaseName} for delivery.`,
    };
  }
  return {
    eyebrow: `${phaseName} submitted`,
    showTick: true,
    title: nextPhaseName
      ? `${phaseName} is complete. Here's what you captured.`
      : `${phaseName} is complete. This Move is ready for delivery.`,
  };
}
