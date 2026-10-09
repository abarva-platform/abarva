/**
 * The sentence a Moves mutation owes the reader when the Move cannot be read.
 *
 * `getProgramById` returns `null` for exactly three reasons, and every walk
 * step that reads a Move turned that `null` into a 404 carrying a code and
 * nothing else:
 *
 *   1. per-Move RBAC: `canReadProgram` is false because the caller's grant list
 *      exists and does not include this Move;
 *   2. no row for this id in the active client — the Move was removed, or never
 *      existed;
 *   3. the id belongs to another tenant, which the client-scoped read also
 *      answers as "no row".
 *
 * What the reader saw. The gate-approval refusal ladder in the standalone Moves
 * workspace falls through to `error` when `detail` is absent, so the screen
 * printed the literal `not_found` to a product user and then appended its
 * standing remedy — approve the draft or upload an edited version and submit
 * the gate again — which cannot clear any of the three causes.
 * `PhaseAdvanceButton` reads `body.detail ?? "Failed to advance phase"`, so the
 * advance refusal named nothing at all.
 *
 * **Which steps this covers, enumerated rather than named.** This module first
 * shipped for the two mutation routes above, and its own comment said "the two
 * live Moves mutation routes" — a count, which went stale the moment the walk's
 * other readers were looked at. The walk's five steps are the ones
 * `MovesWalkStep` in `walk-step-unexpected-failure` lists, and of those five:
 *
 *   - `POST .../advance` and `POST .../phase-gate-approval` were named here
 *     from the start;
 *   - `POST .../phase-capture` has **four** reader ladders (both autosave
 *     paths, the aVa draft save, the gate finalize) and every one of them ends
 *     `detail || error`, so the per-section save slot printed `not_found`;
 *   - `POST .../phase-input-draft` has one, the cited-draft panel, which
 *     renders what it is handed into a `role="alert"` paragraph;
 *   - `POST /api/v1/deliverables/generate-phase` has no 404 arm at all, so
 *     there is nothing on it to name.
 *
 * `GET .../phase-capture` keeps its bare body deliberately, for the same reason
 * it is absent from `MovesWalkStep`: no client fetches it, so a sentence there
 * would change no screen. Bare `not_found` arms also remain on roughly thirty
 * non-walk `/api/v1/programs/**` routes; they are a separate sweep, and each
 * needs its own reader checked before it earns a sentence.
 *
 * Why one sentence for all three causes, and why it stays that way. Telling the
 * three apart would answer "does this Move exist?" to a caller who may not read
 * it, and the cross-tenant denial contract that other suites pin is the 404
 * itself: status **404** and `error: "not_found"` are byte-identical for an
 * absent Move, a foreign Move, and a Move outside the caller's grants. This
 * module adds a sentence to that body; it does not split it into named
 * refusals, and a reader cannot use it to distinguish the causes.
 *
 * Reachability is a mid-session window, not a first load. The page fences with
 * the same loader, so a reader who got the workspace open could read the Move
 * then — the refusal needs the grants to narrow, or the Move to be archived,
 * between that load and the submission.
 */

/**
 * The one sentence. Cause-blind by construction: it states only that the Move
 * is not readable for this account, offers both innocent explanations without
 * committing to either, and ends on the control that actually helps.
 */
export const MOVE_UNREADABLE_REFUSAL_DETAIL =
  "This Move could not be opened for your account. It may have been removed, " +
  "or your workspace access may no longer include it. Reopen the Moves list to " +
  "see the Moves you can work on.";

/** The part of the refusal body a client reads to decide whether to retry. */
export interface MoveUnreadableRefusalBody {
  error: "not_found";
  detail: string;
  /**
   * Present only where a reader consumes it. Submitting again cannot change
   * the answer for any of the three causes: the same loader refuses the same
   * way until a grant, the row, or the tenant changes, and none of those is
   * something the submit control touches.
   */
  resubmitCanSatisfy?: false;
}

/**
 * Build the 404 body for a Move that cannot be read.
 *
 * `error` and the 404 the caller pairs it with are fixed. Set
 * `withResubmitSignal` only on a route whose reader consumes
 * `resubmitCanSatisfy` — emitting the field where nothing reads it would claim
 * a behaviour change that does not happen.
 */
export function moveUnreadableRefusalBody(
  opts: { withResubmitSignal?: boolean } = {},
): MoveUnreadableRefusalBody {
  return {
    error: "not_found",
    detail: MOVE_UNREADABLE_REFUSAL_DETAIL,
    ...(opts.withResubmitSignal ? { resubmitCanSatisfy: false as const } : {}),
  };
}
