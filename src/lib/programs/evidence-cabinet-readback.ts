// Whether the document cabinet's evidence-review lists can be trusted, and
// what a refused review decision tells the reviewer to do.
//
// The cabinet renders three lists from one read of `GET .../artifacts`: the
// pending review queue, the approved list and the rejected list. That route
// reports the review sub-read's own health as
// `evidenceReviewStatus: "available" | "unavailable"`, and the panel carried a
// single boolean for it, initialised `true`.
//
// Two things followed from "initialised true, set only on success".
//
// The panel's own warning — "Evidence review status is unavailable. Do not use
// newly uploaded files for phase decisions until the review state can be
// loaded." — was written for the case where the artifacts read SUCCEEDED and
// only the review sub-read failed. When the artifacts read itself failed, the
// loader threw before any setter ran, so the boolean kept `true` and the
// warning was suppressed in the strictly worse case: the reviewer is told
// nothing is wrong while the review state is not merely degraded but unknown.
//
// Worse, the lists kept their last values too. A reviewer who approves the
// last pending item and whose refresh then fails sees that item STILL listed
// under "N evidence items awaiting review", beneath copy stating that pending
// evidence is excluded from phase generation — so a decision the server did
// record is reported as not taken. The one control on offer, approving it
// again, cannot succeed: the write filters `decision = 'pending'` and the
// route answers 409 `no_pending_review`.
//
// Which is the second half. Every refusal of a review decision is a bare
// snake_case code with no `detail` — `not_found`, `forbidden`,
// `reviewed_extraction_required`, `no_pending_review` — and the panel threw
// `result.detail || result.error || HTTP <status>` straight into its error
// banner. A signed-in reviewer on the discovery step read `no_pending_review`
// as their only next action.
//
// So this module owns two facts: what a readback state asserts about the lists
// beside it, and what each refusal means in product language. Three states,
// not two — a read that failed is `unknown`, which is neither "available" nor
// the route's narrower "unavailable". No database access and no `server-only`,
// so a suite can import it directly.

/**
 * What is known about the evidence-review state behind the cabinet's lists.
 *
 * - `unread` — no read has completed yet. There are no lists to mistrust and
 *   nothing to warn about; the panel's own loading state says this already.
 * - `available` — the route read the review queue and said so.
 * - `unavailable` — the route answered, and reported its review sub-read
 *   failed. The artifact list is current; the review lists are not.
 * - `unknown` — a read ran and did not complete, or answered without saying.
 *   Nothing beside this state is known to be current.
 *
 * `unread` and `unknown` are deliberately separate. Both mean the review state
 * is not known, but only one of them means there is something stale on screen,
 * and only that one has a warning to show.
 */
export type EvidenceReviewReadbackState =
  | "unread"
  | "available"
  | "unavailable"
  | "unknown";

export interface EvidenceCabinetReadback {
  state: EvidenceReviewReadbackState;
  /** The reviewer-facing warning, or null when the state is known-good. */
  warning: string | null;
  /**
   * True only when the review lists rendered beside this state came from a
   * completed read. False means a decision already recorded may still be
   * listed as awaiting review, so the queue must not be presented as current.
   */
  queueIsCurrent: boolean;
}

const UNAVAILABLE_WARNING =
  "Evidence review status is unavailable. Do not use newly uploaded files " +
  "for phase decisions until the review state can be loaded.";

const UNKNOWN_WARNING =
  "The evidence review state could not be loaded, so the lists below may be " +
  "out of date — a decision that was recorded can still appear here as " +
  "awaiting review. Reload before deciding anything, and do not approve an " +
  "item a second time.";

/**
 * Classify what the cabinet knows about its review lists.
 *
 * A failed read outranks whatever the last successful read said: the point of
 * the state is to describe the lists currently on screen, and after a failure
 * those are stale by definition. An absent or unrecognised status is `unknown`
 * rather than available, so a route that stops sending the field cannot make
 * the panel assert health it was never told about.
 *
 * `completed: false` is the un-run read — the state the panel holds before its
 * first fetch resolves. It warns about nothing, because a warning there would
 * fire on every initial paint.
 */
export function describeEvidenceCabinetReadback(input: {
  completed?: boolean;
  loadFailed?: boolean;
  evidenceReviewStatus?: unknown;
}): EvidenceCabinetReadback {
  if (input.completed === false) {
    return { state: "unread", warning: null, queueIsCurrent: false };
  }
  if (input.loadFailed) {
    return {
      state: "unknown",
      warning: UNKNOWN_WARNING,
      queueIsCurrent: false,
    };
  }
  if (input.evidenceReviewStatus === "available") {
    return { state: "available", warning: null, queueIsCurrent: true };
  }
  if (input.evidenceReviewStatus === "unavailable") {
    return {
      state: "unavailable",
      warning: UNAVAILABLE_WARNING,
      queueIsCurrent: true,
    };
  }
  return { state: "unknown", warning: UNKNOWN_WARNING, queueIsCurrent: false };
}

/**
 * The refusal codes `POST .../current-state/evidence/<id>/approve` declares.
 * Enumerated here so a new one cannot quietly fall through to the default
 * sentence without this list being read.
 */
export const EVIDENCE_DECISION_REFUSAL_CODES = [
  "not_found",
  "forbidden",
  "reviewed_extraction_required",
  "no_pending_review",
  "evidence_not_in_move",
  "review_decision_unconfirmed",
] as const;

export type EvidenceDecisionRefusalCode =
  (typeof EVIDENCE_DECISION_REFUSAL_CODES)[number];

const REFUSAL_SENTENCES: Record<EvidenceDecisionRefusalCode, string> = {
  not_found:
    "This Move could not be read, so the review decision was not recorded. " +
    "Reload the workspace and try again.",
  forbidden:
    "Recording a review decision needs gate-approval permission on this " +
    "Move. Ask a workspace user who has it to review this evidence.",
  reviewed_extraction_required:
    "Approving evidence needs the corrected extraction. Review the parsed " +
    "facts above, then approve the reviewed version.",
  no_pending_review:
    "This evidence has no review awaiting a decision — it was already " +
    "decided, here or in another session. Reload to see its recorded " +
    "decision; deciding it again is refused and will not change it.",
  evidence_not_in_move:
    "This evidence is not on this Move, so there is no review to decide and " +
    "nothing was recorded. It is most likely a file whose evidence was never " +
    "captured from the upload — reload the cabinet, and upload the source " +
    "again if the item is still missing.",
  review_decision_unconfirmed:
    "The server could not confirm this review decision. It may or may not " +
    "have been recorded, so do not assume either — reload the cabinet and " +
    "read the evidence's own state before deciding it again.",
};

/**
 * What each refusal lets a reviewer conclude about the recorded state, kept as
 * DATA so the sentences can be asserted against it rather than read.
 *
 * - `nothing` — the refusal happens before any write, so the reviewer may be
 *   told plainly that nothing was recorded.
 * - `recorded` — a decision exists already; the refusal is the server declining
 *   to change it.
 * - `unknown` — the refusal is reachable on either side of the one write, so no
 *   sentence may claim a direction. The governed promotion's write is a single
 *   filtered update whose own error is what throws; the route never re-reads
 *   the row to settle whether it applied, so neither does its reader.
 */
export const EVIDENCE_DECISION_REFUSAL_STATE: Record<
  EvidenceDecisionRefusalCode,
  "nothing" | "recorded" | "unknown"
> = {
  not_found: "nothing",
  forbidden: "nothing",
  reviewed_extraction_required: "nothing",
  no_pending_review: "recorded",
  evidence_not_in_move: "nothing",
  review_decision_unconfirmed: "unknown",
};

/**
 * Reached when the response carries no code this module names — and, above
 * all, when it carries no readable body at all. That is the case in which the
 * client knows LEAST, so it is the one sentence that must not settle the
 * reviewer's real question for them. It used to end "the evidence state is
 * unchanged and nothing was approved", which is a claim about a write whose
 * outcome nobody read back.
 */
const UNNAMED_REFUSAL =
  "The review decision was not confirmed, and this screen cannot tell " +
  "whether it was recorded. Reload the cabinet and read the evidence's own " +
  "state before deciding it again.";

/**
 * Say that this evidence was already decided, NAMING the decision on record.
 *
 * The `no_pending_review` sentence sends the reviewer to reload and read the
 * recorded decision. The promotion already knows it, so when it is known this
 * says it outright — a reviewer whose approval was refused because the item is
 * on record as REJECTED is looking at a different problem from one whose
 * approval simply landed twice, and "reload to see it" leaves them to guess
 * which. Falls back to the unnamed-decision sentence when it is not known.
 */
export function describeAlreadyDecidedEvidenceReview(
  recordedDecision: unknown,
): string {
  if (recordedDecision === "approved" || recordedDecision === "rejected") {
    return (
      `This evidence is already on record as ${recordedDecision}, decided ` +
      "here or in another session, and nothing was recorded now. Reload the " +
      "cabinet; deciding it again is refused and will not change it."
    );
  }
  return REFUSAL_SENTENCES.no_pending_review;
}

/** True for a refusal code this module names. */
export function isEvidenceDecisionRefusalCode(
  code: unknown,
): code is EvidenceDecisionRefusalCode {
  return (
    typeof code === "string" &&
    (EVIDENCE_DECISION_REFUSAL_CODES as readonly string[]).includes(code)
  );
}

/**
 * Say, in product language, why a review decision was refused.
 *
 * A server-supplied `detail` sentence wins when there is one — the route emits
 * none today, so this is what a future one would reach. Otherwise a named code
 * gets its sentence and anything else gets the default. The raw code is never
 * returned: it is not an instruction a reviewer can act on, and it stays
 * visible to an engineer in the response itself.
 */
export function describeEvidenceDecisionRefusal(input: {
  code?: unknown;
  detail?: unknown;
}): string {
  const detail = typeof input.detail === "string" ? input.detail.trim() : "";
  if (detail) return detail;
  if (isEvidenceDecisionRefusalCode(input.code)) {
    return REFUSAL_SENTENCES[input.code];
  }
  return UNNAMED_REFUSAL;
}
