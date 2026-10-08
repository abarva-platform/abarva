/**
 * The sentence a Moves walk step owes the reader when it fails for a reason the
 * route did not anticipate.
 *
 * Every mutation on the P0 -> P5 walk ends in a catch-all arm that answers
 * `{ error: "internal_error", message: <raw error text> }` with a 500. Two
 * things are wrong with that body, and they pull in opposite directions.
 *
 * **The raw text reaches nobody.** No client on the walk reads `message`. Each
 * reader falls through a ladder that ends `detail || error`, and
 * `PhaseApproveAndBuild`'s response type does not even declare a `message`
 * field. So the diagnostic that was put in the body for a human is read by no
 * human; the same text already goes to `console.error`, where an operator can
 * actually find it.
 *
 * **What the reader gets instead is the machine code.** With `detail` absent,
 * the ladder lands on `error` and prints the literal `internal_error`:
 *
 *   - the capture autosave shows it in the per-section error slot, on every
 *     field of every phase (three call sites in `MovesPhaseStandaloneClient`);
 *   - "Approve & Build" shows it in place of the build result;
 *   - the aVa cited-draft panel shows it in place of the drafts;
 *   - the gate submission embeds it in a sentence that **mislabels the
 *     failure**: "Build completed, but the phase gate is blocked:
 *     internal_error." The gate was never evaluated. The client then appends
 *     its standing document remedy, prescribing an approve-or-upload action
 *     that cannot address a crash;
 *   - `PhaseAdvanceButton` reads `detail` with its own fallback, so advance
 *     avoids the token but says only "Failed to advance phase" -- no cause, no
 *     action, and, as the `phase_advance` note below records, **not reliably
 *     true**.
 *
 * Why one sentence per step rather than one shared sentence. The useful half of
 * this is not the apology, it is what the reader should do next, and that
 * differs by step because the steps differ in what they may already have
 * written before the throw. A single template would have to claim either that
 * nothing was recorded (false for three of the five) or that something might
 * have been (needlessly alarming for the two read-only steps). Each sentence
 * below states only what its own step can honestly say.
 *
 * `error: "internal_error"` and the 500 are unchanged. This module adds the
 * `detail` the readers already consume and drops the `message` none of them do;
 * it does not introduce named refusals, and a reader cannot use it to tell one
 * internal failure from another.
 */

/**
 * The walk steps whose catch-all arm has a product reader.
 *
 * `GET .../phase-capture` is deliberately absent. Its 500 arm carries no
 * `detail` either, but no client fetches it -- the phase page preloads capture
 * values server-side -- so giving it a sentence would change no screen.
 */
export type MovesWalkStep =
  | "phase_capture_save"
  | "phase_input_draft"
  | "phase_deliverable_build"
  | "phase_gate_submission"
  | "phase_advance";

/**
 * What each step may have completed before an unanticipated throw, and the one
 * action that helps.
 *
 * The write-state claims are derived from where each route's catch-all sits
 * relative to its writes, not assumed:
 *
 * - `phase_capture_save` wraps the section upsert, so a throw can land either
 *   side of it. The sentence commits to neither and sends the reader to the
 *   only thing that settles it.
 * - `phase_input_draft` returns proposals and writes no capture value, so
 *   nothing the reader was looking at changed.
 * - `phase_deliverable_build` catches around the whole enqueue loop, which
 *   queues runs one at a time; a later throw leaves the earlier runs queued.
 * - `phase_gate_submission` must say the gate was not evaluated. Without that,
 *   the client's own framing reports a crash as a gate refusal.
 * - `phase_advance` sits in the same `try` as `advancePhase`, and two awaited
 *   calls follow it -- the gate decision record and the progress notification.
 *   Neither has a local catch, so a throw in either answers 500 **after the
 *   phase has already moved**. The sentence must not say the advance failed.
 */
const WALK_STEP_DETAIL: Record<MovesWalkStep, string> = {
  phase_capture_save:
    "Saving this phase's capture did not finish, for a reason this surface " +
    "cannot name. Some sections may have been recorded and some may not. " +
    "Reload this phase to see what was saved, then re-enter anything missing.",
  phase_input_draft:
    "Preparing aVa's cited drafts did not finish, for a reason this surface " +
    "cannot name. Nothing in your capture was changed. Request drafts again, " +
    "and fill the sections in directly if it keeps failing.",
  phase_deliverable_build:
    "Starting this phase's build did not finish, for a reason this surface " +
    "cannot name. Some documents may already have been queued. Check this " +
    "phase's document list before requesting another build, so a second " +
    "request does not duplicate work already running.",
  phase_gate_submission:
    "Submitting the gate did not finish, for a reason this surface cannot " +
    "name. The gate was not evaluated, so this is not a gate refusal and " +
    "nothing about its verdict changed. Reload this phase and submit again.",
  phase_advance:
    "Advancing the phase did not finish cleanly, for a reason this surface " +
    "cannot name. The phase itself may already have moved, and the gate " +
    "decision record for the crossing may not have been written. Reload the " +
    "Move to see which phase it is on before advancing again.",
};

/** The sentence for one step. */
export function unexpectedWalkStepDetail(step: MovesWalkStep): string {
  return WALK_STEP_DETAIL[step];
}

/** The part of the 500 body a client reads. */
export interface UnexpectedWalkStepFailureBody {
  error: "internal_error";
  detail: string;
}

/**
 * Build the 500 body for a walk step that failed unexpectedly.
 *
 * The raw error text is not included by design -- see the module comment. Log
 * it at the call site; `console.error` is where an operator looks.
 */
export function unexpectedWalkStepFailureBody(
  step: MovesWalkStep,
): UnexpectedWalkStepFailureBody {
  return { error: "internal_error", detail: unexpectedWalkStepDetail(step) };
}

/**
 * Read an unexpected-step failure back off a response, for a client whose own
 * framing would otherwise misdescribe it.
 *
 * The gate submission is the one reader that needs this. Its ladder wraps
 * whatever it finds in "Build completed, but the phase gate is blocked: ...",
 * and appends a standing remedy -- approve the draft or upload an edited
 * version -- whenever the body does not rule a re-submission out. Both are
 * right for a gate refusal and wrong for a crash: the gate produced no verdict
 * to be blocked by, and no document action can clear a failure in the route.
 * So the client has to recognise this body rather than treat it as one more
 * refusal, and `detail` alone is not enough to recognise it by -- every named
 * refusal carries one too.
 *
 * Returns the sentence to show on its own, or `null` when the response is some
 * other outcome and the caller's normal ladder should run.
 */
export function readUnexpectedWalkStepFailure(
  status: number,
  body: { error?: string; detail?: string } | null | undefined,
): string | null {
  if (status !== 500) return null;
  if (body?.error !== "internal_error") return null;
  return body.detail ?? null;
}
