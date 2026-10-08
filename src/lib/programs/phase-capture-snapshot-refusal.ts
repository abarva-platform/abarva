/**
 * The refusal `POST .../phase-capture` owes the reader when the saved answers
 * cannot be read.
 *
 * The capture autosave is the most-used control on the phase walk: every field
 * of every phase is persisted through it, on a debounce, while the reader
 * types. Before this module the route loaded the authoritative snapshot behind
 * a swallowing catch:
 *
 *     const currentSnapshot = await loadCaptureSnapshot(ctx, programId, phase)
 *       .catch(() => ({ modules: [], values: {}, ... }));
 *
 * `loadCaptureSnapshot` performs three data-plane reads — `getModuleState` and
 * `listApprovedPhaseEvidence` for P1 and P2 — and has no legitimate throw: a
 * Move with no modules and no approved evidence reads as empty rows, not as an
 * error. So every throw it can raise is a read failure, and the catch replaced
 * it with a snapshot asserting that this Move has **no saved answers at all**.
 * That substitution reached the reader down two different paths, and the route
 * reported neither of them as a read failure.
 *
 * **The 409 path.** A client that loaded revision R sends it as
 * `expectedRevision` on every save. Against the substituted snapshot the
 * current revision is the hash of `{}`, which cannot equal R, so the write was
 * refused as `stale_revision` — carrying `values: {}`, `revision: <hash of {}>`
 * and a capture evaluation reporting every required section missing. Both
 * autosave call sites in `MovesPhaseStandaloneClient` adopt that body as
 * authoritative (`setPersistedPhaseCaptureValues(body.values)` plus
 * `setPhaseCaptureRevision(body.revision)`), so a transient read failure blanked
 * the reader's persisted view of answers the database still held — under the
 * sentence *"This page was loaded before the capture state changed"*, which was
 * not true: nothing had changed and nothing could be read.
 *
 * **The 200 path.** `expectedRevision` is optional, so a caller that omits it
 * skipped the fence entirely. `diffCaptureValues({}, incoming)` then reported
 * every submitted field as changed, the audit log recorded that count as a real
 * edit, and the success body's `values` — derived from the evaluation, so one
 * entry per declared section — carried an empty string for every section the
 * request did not contain. The same client adopts `values` on success too. The
 * untouched rows were never written, so the database stayed correct while the
 * screen reported the reader's earlier answers as unanswered: a success
 * response that contradicted the stored state.
 *
 * The fix is to stop substituting. A read failure is answered as a read
 * failure, before any write, with a sentence and **no authoritative state** —
 * the absence of `values` and `revision` is what makes the body unable to blank
 * a reader's page, so it is part of the contract, not an omission. Both client
 * call sites already reach the generic `!res.ok` branch and surface `detail`
 * against the field, which leaves the typed text on screen and the section
 * dirty, so the debounce retries the save on the next keystroke.
 */

/** The machine-readable cause. Distinct from `stale_revision` by design. */
export const PHASE_CAPTURE_SNAPSHOT_UNREADABLE_ERROR =
  "capture_snapshot_unreadable" as const;

/**
 * The one sentence. It states what failed (the saved answers could not be
 * read), what did NOT happen (nothing was written), and the action that helps
 * (the edit is still on screen, so it can be saved again) — and it deliberately
 * does not claim the state changed, because a read failure cannot know that.
 */
export const PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL =
  "This Move's saved answers could not be read just now, so this edit was not " +
  "saved and nothing already saved was changed. Your text is still here — try " +
  "saving again in a moment.";

/**
 * The refusal body. Carries a cause and a sentence and nothing a client could
 * mistake for authoritative capture state: no `values`, no `revision`, no
 * `capture` evaluation.
 */
export interface PhaseCaptureSnapshotUnreadableBody {
  error: typeof PHASE_CAPTURE_SNAPSHOT_UNREADABLE_ERROR;
  detail: string;
  /** The phase the refused write was addressed to, for the audit trail. */
  phase: number;
}

/** 503: the read may succeed on the next attempt, and the client retries. */
export const PHASE_CAPTURE_SNAPSHOT_UNREADABLE_STATUS = 503;

export function phaseCaptureSnapshotUnreadableBody(
  phase: number,
): PhaseCaptureSnapshotUnreadableBody {
  return {
    error: PHASE_CAPTURE_SNAPSHOT_UNREADABLE_ERROR,
    detail: PHASE_CAPTURE_SNAPSHOT_UNREADABLE_DETAIL,
    phase,
  };
}
