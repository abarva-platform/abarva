/**
 * The v2 phase-workspace sub-step SPINE, derived from the capture flow's real
 * step model. It expresses the four-stage shape the redesign fixes on — every
 * phase is one end-to-end workflow: CAPTURE → GENERATE → OUTCOME → GATE — as an
 * ordered list of stages with a position dot, a kind label, and a done/current
 * state, plus the flow view each stage navigates to (or `null` when it is a
 * non-interactive marker, like the mockup's "→ Tower").
 *
 * This is PRESENTATION ONLY. It does not change the capture flow's view-state
 * machine, its gate, its persistence, or what reaches the gate pipeline:
 *
 * - The CAPTURE stages are the phase's real step groups (`resolvePhaseStepGroups`),
 *   one per group, navigable BACKWARD exactly as the legacy step bar allowed
 *   (`i < view`) — never forward, so the save/evidence gating on Continue is
 *   untouched.
 * - GENERATE is the bridge where the flow produces output (the governed
 *   approve/build on the last capture step); it is a marker, not a new view.
 * - OUTCOME is the existing hand-off recap (view 3). It is navigable only when
 *   the host says the recap is reachable (`captureHandoffAccess`), so this
 *   introduces no new path into a recap the product deliberately keeps closed.
 * - GATE is the attest/approve action, which lives on the final step's footer
 *   (or travels onto the recap); a marker here, the real control is unchanged.
 *
 * Two state channels, deliberately distinct: `state` is the VISUAL emphasis
 * (shared by a marker whose control sits on the current screen) and
 * `isCurrentView` is the single navigational stage that may carry
 * `aria-current`. Collapsing them put `aria-current="step"` on two buttons.
 *
 * Kept out of `MovesCaptureFlow` so the state rule is unit-testable on its own.
 */

export type MovesV2SpineKind = "capture" | "generate" | "outcome" | "gate";

export interface MovesV2SpineStage {
  kind: MovesV2SpineKind;
  /** Short label shown under the kind eyebrow. */
  label: string;
  /** 1-based position shown in the dot (or a tick when `state === "done"`). */
  position: number;
  state: "done" | "current" | "upcoming";
  /**
   * Whether this stage is the view the flow is CURRENTLY RENDERING — the one
   * and only stage that may carry `aria-current="step"`.
   *
   * Deliberately separate from `state === "current"`, which is the VISUAL
   * emphasis channel and is shared with a marker whose real control sits on the
   * current screen: GENERATE lights beside the last capture step (the governed
   * approve/build lives in that step's footer) and GATE lights beside OUTCOME
   * (the approve control travels onto the recap). Two accented stages are the
   * shell's intended look, so emphasis is left alone — but `aria-current`
   * identifies a SINGLE item within a set, and with it driven off `state` two
   * buttons in one nav claimed to be the current step, so neither named where
   * the user actually was. At most one stage carries this, and exactly one
   * whenever the view maps to a rendered stage.
   */
  isCurrentView: boolean;
  /**
   * The capture-flow view this stage selects, or `null` for a non-interactive
   * marker. A capture stage carries its own view index; OUTCOME carries 3 only
   * when the recap is reachable; GENERATE and GATE are always markers.
   */
  targetView: number | null;
}

export interface MovesV2SpineInput {
  /** The phase's real step-group titles, in order (the CAPTURE stages). */
  captureTitles: readonly string[];
  /** The capture flow's current view: 0..N-1 capture steps, 3 = hand-off/recap. */
  view: number;
  /** Whether the hand-off recap can be navigated to (host `captureHandoffAccess`). */
  handoffReachable: boolean;
  /**
   * Increment 2: whether this phase's OUTCOME is a findings surface (an
   * intelligence phase with derived findings to review). The findings surface
   * is a read-only review that submits nothing — like the review-before-submit
   * recap — so when present it makes the OUTCOME stage navigable to view 3 even
   * if the plain recap would be closed in this configuration. Defaults false,
   * so a phase without findings behaves exactly as Increment 1.
   */
  outcomeFindingsPresent?: boolean;
}

/**
 * Build the spine for the current view. The returned list is always the capture
 * stages followed by a single GENERATE, OUTCOME and GATE stage.
 */
export function movesWorkspaceV2Spine({
  captureTitles,
  view,
  handoffReachable,
  outcomeFindingsPresent = false,
}: MovesV2SpineInput): MovesV2SpineStage[] {
  const captureCount = captureTitles.length;
  const atRecap = view >= 3;
  // The last capture step is where the flow produces output and the governed
  // gate control lives, so GENERATE lights there.
  const onLastCapture = !atRecap && view === captureCount - 1;

  const stages: MovesV2SpineStage[] = [];
  let position = 1;

  captureTitles.forEach((title, i) => {
    const state: MovesV2SpineStage["state"] = atRecap
      ? "done"
      : i < view
        ? "done"
        : i === view
          ? "current"
          : "upcoming";
    stages.push({
      kind: "capture",
      label: title,
      position: position++,
      state,
      // The rendered panel at a non-recap view is `groups[view]`, so that
      // capture stage is the navigational current one.
      isCurrentView: !atRecap && i === view,
      // Backward-only, mirroring the legacy step bar (`if (i < view) go(i)`);
      // from the recap any capture step is behind you, so it stays selectable.
      targetView: atRecap || i < view ? i : null,
    });
  });

  stages.push({
    kind: "generate",
    label: "Generate",
    position: position++,
    state: atRecap ? "done" : onLastCapture ? "current" : "upcoming",
    // A bridge marker, never a view of its own: it lights beside the last
    // capture step but the user is on that step, not here.
    isCurrentView: false,
    targetView: null,
  });

  stages.push({
    kind: "outcome",
    label: outcomeFindingsPresent ? "Findings" : "Review",
    position: position++,
    state: atRecap ? "current" : "upcoming",
    // At the recap the flow renders this screen, so OUTCOME is the
    // navigational current stage.
    isCurrentView: atRecap,
    // A findings surface is a no-submit review screen, so it opens the OUTCOME
    // path even where the plain recap stays closed (approveSlot + no review).
    targetView: handoffReachable || outcomeFindingsPresent ? 3 : null,
  });

  stages.push({
    kind: "gate",
    label: "Attest",
    position: position++,
    state: atRecap ? "current" : "upcoming",
    // The attest control travels onto the recap, so GATE shares the emphasis
    // there — but OUTCOME is the screen being rendered.
    isCurrentView: false,
    targetView: null,
  });

  return stages;
}
