// What a refused artifact review decision tells the reviewer to do.
//
// `GET/POST /api/v1/programs/<moveId>/artifacts/<artifactId>/review-decision`
// is the only path by which a reviewer records the P2 -> P3 decision
// (`approve_for_p3_draft` / `request_revisions` / `require_missing_evidence`),
// and `moves-generate-deps.ts` reads the recorded decision back through
// `hasPriorPhaseDraftApproval` to decide whether a P3 deliverable may be
// generated. A refusal the reviewer cannot act on therefore stops P3
// generation with no stated next step.
//
// Its one product reader is `FileCabinetPanel`, which makes two calls:
//
//   GET  — loads the review packet. On failure it clears `workspaceReview` to
//          null, which hides the packet AND every decision control, so the
//          reviewer is left with no explanation for the missing controls.
//   POST — records the decision. On failure nothing is written.
//
// The same code means different things across those two calls, because the
// state consequence differs: a reviewer whose POST failed needs to know their
// decision was NOT saved, while a failed GET left the artifact untouched and
// only cost them the packet view. That is why every sentence here is chosen
// per `action`, not per code alone.
//
// `detail` is authored prose for every code on this route that carries one
// (`forbidden`, `rationale_required`, and the tenancy route's
// `tenant_lookup_unavailable` / `no_client`), and the route emits no machine
// values into it — no raw MIME, no byte count, no form-field name. So
// detail-first is the right precedence HERE, and this module keeps it. Do not
// copy that precedence to a route whose `detail` carries machine values; see
// `move-upload-refusal`'s `DETAIL_IS_REVIEWER_PROSE` for the contrasting case.

/**
 * The refusal codes this reader can reach.
 *
 * `not_found` and `invalid_decision` come from the route itself;
 * `unauthenticated`, `tenant_lookup_unavailable` and `no_client` come from the
 * shared `tenancyErrorResponse` that answers every `/api/v1/programs/**`
 * route; `forbidden` and `rationale_required` come from the route and carry
 * their own prose.
 *
 * `tenancyErrorResponse`'s own `forbidden` arm is NOT reachable here: it fires
 * only when `requireTenancy` is given a `requestedClientKey`, and this route
 * calls `requireTenancy()` with no argument. The `forbidden` named below is
 * the route's own gate-approval refusal.
 */
export const MOVE_REVIEW_DECISION_REFUSAL_CODES = [
  "not_found",
  "forbidden",
  "invalid_decision",
  "rationale_required",
  "unauthenticated",
  "tenant_lookup_unavailable",
  "no_client",
] as const;

export type MoveReviewDecisionRefusalCode =
  (typeof MOVE_REVIEW_DECISION_REFUSAL_CODES)[number];

/** Which of the reader's two calls was refused. */
export type MoveReviewDecisionAction = "load" | "record";

const LOAD_SENTENCES: Record<MoveReviewDecisionRefusalCode, string> = {
  not_found:
    "The review packet for this document could not be read, so the decision " +
    "controls are hidden. The document and any decision already recorded on " +
    "it are unchanged. Reload the workspace and open Review again.",
  forbidden:
    "Reading this review packet needs gate-approval permission on this Move. " +
    "Ask a workspace user who has it to review this document.",
  invalid_decision:
    "The review packet could not be read, so the decision controls are " +
    "hidden. Nothing about this document changed. Reload the workspace and " +
    "open Review again.",
  rationale_required:
    "The review packet could not be read, so the decision controls are " +
    "hidden. Nothing about this document changed. Reload the workspace and " +
    "open Review again.",
  unauthenticated:
    "Your session has expired, so the review packet could not be read. Sign " +
    "in again and open Review; nothing about this document changed.",
  tenant_lookup_unavailable:
    "The review packet could not be read because the workspace lookup is " +
    "temporarily unavailable. Nothing about this document changed. Wait a " +
    "moment and open Review again.",
  no_client:
    "No active client workspace is selected, so the review packet could not " +
    "be read. Choose a workspace and open Review again.",
};

const RECORD_SENTENCES: Record<MoveReviewDecisionRefusalCode, string> = {
  not_found:
    "This document could not be read, so your review decision was NOT " +
    "recorded and the phase is unchanged. Reload the workspace and record it " +
    "again.",
  forbidden:
    "Recording a review decision needs gate-approval permission on this " +
    "Move. Your decision was not recorded. Ask a workspace user who has it " +
    "to record it.",
  invalid_decision:
    "That review decision is not one this Move accepts, so nothing was " +
    "recorded. Choose approve for draft shaping, request revisions, or hold " +
    "for missing evidence.",
  rationale_required:
    "A review decision needs a rationale, so nothing was recorded. Write why " +
    "you are approving, requesting revisions, or holding, then record it " +
    "again.",
  unauthenticated:
    "Your session has expired, so your review decision was NOT recorded. " +
    "Sign in again and record it; the phase is unchanged.",
  tenant_lookup_unavailable:
    "Your review decision was NOT recorded because the workspace lookup is " +
    "temporarily unavailable. The phase is unchanged. Wait a moment and " +
    "record it again.",
  no_client:
    "No active client workspace is selected, so your review decision was NOT " +
    "recorded. Choose a workspace and record it again.",
};

const UNNAMED: Record<MoveReviewDecisionAction, string> = {
  // Says nothing about what WAS read, because the catch-all also covers a
  // crash and a non-JSON body, where the packet may be partly built.
  load:
    "The review packet could not be read, so the decision controls are " +
    "hidden. Reload the workspace and open Review again; if it keeps " +
    "failing, no decision has been recorded from here.",
  // Deliberately does NOT claim the decision was not recorded: this arm also
  // fires on a 5xx thrown after the row was written, so a reload is the only
  // honest instruction.
  record:
    "The review decision could not be confirmed. Reload the workspace to see " +
    "whether it was recorded before deciding again.",
};

/** True for a refusal code this module names. */
export function isMoveReviewDecisionRefusalCode(
  code: unknown,
): code is MoveReviewDecisionRefusalCode {
  return (
    typeof code === "string" &&
    (MOVE_REVIEW_DECISION_REFUSAL_CODES as readonly string[]).includes(code)
  );
}

/**
 * Say, in product language, why loading or recording a review decision was
 * refused.
 *
 * A server-supplied `detail` sentence wins when there is one — every `detail`
 * this route emits is authored prose, so preferring it cannot surface a
 * machine value. Otherwise a named code gets the sentence written for THIS
 * action, and anything else gets the action's default. The raw code is never
 * returned: it is not an instruction a reviewer can act on, and it stays
 * visible to an engineer in the response itself.
 */
export function describeMoveReviewDecisionRefusal(input: {
  action: MoveReviewDecisionAction;
  code?: unknown;
  detail?: unknown;
}): string {
  const detail = typeof input.detail === "string" ? input.detail.trim() : "";
  if (detail) return detail;
  if (isMoveReviewDecisionRefusalCode(input.code)) {
    return input.action === "load"
      ? LOAD_SENTENCES[input.code]
      : RECORD_SENTENCES[input.code];
  }
  return UNNAMED[input.action];
}
