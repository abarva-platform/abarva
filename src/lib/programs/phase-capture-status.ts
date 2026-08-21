// Phase-capture save status — the state machine behind the per-section badge.
//
// The badge has one meaning, and it is the invariant this module exists to
// enforce:
//
//   DONE means the value currently visible in the control is reproducible from
//   authoritative server state after a no-store reload.
//
// Anything weaker makes the badge a completeness decoration rather than a
// statement about durability. A reviewer who sees DONE and navigates away must
// be right to do so.
//
// The transitions:
//
//   server value ──user types──▶ EDITING ──save starts──▶ SAVING
//                                   ▲                        │
//                                   │                    200 + value
//                                   └──── save fails ◀───┐   │
//                                        (UNSAVED)       │   ▼
//                                                        └── DONE
//
// Pure module: no I/O, no React. Extracted from the phase page specifically so
// the invariant can be asserted deterministically — a browser test proves the
// machine works today, a unit test stops it regressing.

export type PhaseCaptureSaveStatus = "editing" | "saving" | "saved" | "error";

export type PhaseCaptureStatusTone = PhaseCaptureSaveStatus | "open";

export interface PhaseCaptureStatusView {
  label: string;
  /** True ONLY when the displayed value is known to be durable. */
  complete: boolean;
  tone: PhaseCaptureStatusTone;
}

export interface PhaseCaptureStatusInput {
  /** What the user currently sees in the control. */
  draft: string;
  /** The value the server has acknowledged, as returned by a read. */
  persisted: string;
  /** In-flight/failed signal for this section, if any. */
  saveStatus?: PhaseCaptureSaveStatus;
}

/**
 * Resolve the badge for one capture section.
 *
 * Order matters. An in-flight save and a failed save are both reported before
 * the value comparison, because both mean "not durable yet" regardless of
 * whether the strings happen to match — a save can be in flight for a value
 * that coincidentally equals the last persisted one.
 */
export function resolvePhaseCaptureStatus(
  input: PhaseCaptureStatusInput,
): PhaseCaptureStatusView {
  const draft = String(input.draft ?? "");
  const persisted = String(input.persisted ?? "");

  if (input.saveStatus === "saving") {
    return { label: "Saving", complete: false, tone: "saving" };
  }
  // A failed save is reported as UNSAVED, never as an error the user can
  // ignore: their text exists only in the browser at this point.
  if (input.saveStatus === "error") {
    return { label: "Unsaved", complete: false, tone: "error" };
  }
  // THE INVARIANT. Any divergence between what is shown and what the server
  // acknowledged means the badge cannot claim Done, whatever else is true.
  if (draft !== persisted) {
    return { label: "Editing", complete: false, tone: "editing" };
  }
  // Matching an empty server value is not completion — it is "not captured".
  if (persisted.trim().length === 0) {
    return { label: "Open", complete: false, tone: "open" };
  }
  return { label: "Done", complete: true, tone: "saved" };
}

/**
 * The invariant, stated as a predicate so it can be asserted directly rather
 * than inferred from the label. `complete` may only be true when the displayed
 * value equals the acknowledged value and no save is outstanding.
 */
export function statusSatisfiesDurabilityInvariant(
  input: PhaseCaptureStatusInput,
  view: PhaseCaptureStatusView,
): boolean {
  if (!view.complete) return true;
  const draft = String(input.draft ?? "");
  const persisted = String(input.persisted ?? "");
  return (
    draft === persisted &&
    draft.trim().length > 0 &&
    input.saveStatus !== "saving" &&
    input.saveStatus !== "error"
  );
}
