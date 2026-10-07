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
}

/**
 * Build the spine for the current view. The returned list is always the capture
 * stages followed by a single GENERATE, OUTCOME and GATE stage.
 */
export function movesWorkspaceV2Spine({
  captureTitles,
  view,
  handoffReachable,
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
    targetView: null,
  });

  stages.push({
    kind: "outcome",
    label: "Review",
    position: position++,
    state: atRecap ? "current" : "upcoming",
    targetView: handoffReachable ? 3 : null,
  });

  stages.push({
    kind: "gate",
    label: "Attest",
    position: position++,
    state: atRecap ? "current" : "upcoming",
    targetView: null,
  });

  return stages;
}
