/**
 * Which stored workbook proposals a reviewer may act on, in one place.
 *
 * The review API refuses the WHOLE batch when any accepted proposal has a
 * blank response (422 `blank_workbook_response`, and
 * `buildStageReadinessProposalReview` throws on the same condition). So the
 * selection a reviewer submits has to exclude blanks, or nothing is saved.
 *
 * That rule was previously re-expressed at five separate readings in the
 * review control — two selection seeds, the open-work count, the per-row
 * checkbox, and the blank tally — and the two seeds disagreed: the one that
 * ran after an upload selected EVERY proposal, blanks included. A reviewer who
 * uploaded a partly-filled workbook therefore submitted blanks, got the 422,
 * and could not recover, because a blank row's checkbox is disabled (so it
 * cannot be unticked) and only the first few rows are rendered at all.
 *
 * Keeping all five readings on these two predicates is the fix: a partly
 * filled workbook's answered responses can be accepted, and the blanks keep
 * holding the phase exactly as before.
 */

/** The shape every caller shares; fields are optional because the client reads them off an API payload. */
export interface ReviewableWorkbookProposal {
  proposalId?: string | null;
  answerState?: string | null;
  response?: string | null;
  disposition?: string | null;
}

/**
 * A response the reviewer is allowed to accept: the parser classified an
 * answer, and the Response cell actually holds text. Mirrors the server's
 * refusal condition exactly.
 */
export function isWorkbookProposalAcceptable(
  proposal: ReviewableWorkbookProposal | null | undefined,
): boolean {
  if (!proposal) return false;
  if (proposal.answerState === "blank") return false;
  return typeof proposal.response === "string" && proposal.response.trim().length > 0;
}

/** Acceptable AND still awaiting a decision, so a review action would change something. */
export function isWorkbookProposalOpenForReview(
  proposal: ReviewableWorkbookProposal | null | undefined,
): boolean {
  if (!isWorkbookProposalAcceptable(proposal)) return false;
  return (
    proposal?.disposition === "pending" ||
    proposal?.disposition === "needs_validation"
  );
}

/**
 * The proposal ids to pre-select for review. Used by every seed — after an
 * upload, after a reload from the stored set, and after a saved review — so
 * they cannot drift apart again.
 */
export function selectableWorkbookProposalIds(
  proposals: readonly ReviewableWorkbookProposal[] | null | undefined,
): Set<string> {
  const ids = (proposals ?? [])
    .filter(isWorkbookProposalOpenForReview)
    .map((proposal) => proposal.proposalId)
    .filter((proposalId): proposalId is string => Boolean(proposalId));
  return new Set(ids);
}

/**
 * A response whose recorded decision the reviewer is still allowed to CHANGE.
 *
 * This is deliberately wider than `isWorkbookProposalOpenForReview`, and the
 * difference is the whole point of having two predicates.
 *
 * A rejection is not a resting state for a REQUIRED response. Every forward
 * control reads `disposition === "accepted"`: the P1 branch of
 * `applyStageReadinessToEvidencePackets` requires every required proposal
 * accepted, and `assessStageReadinessGate` raises a `review_required` blocker
 * for any required proposal that is not. So a required response that is
 * rejected keeps its evidence family's packet open, the phase gate keeps
 * returning 409 `required_evidence_gaps_open`, and `generate-phase` keeps
 * returning 409 `required_evidence_open` — the transition AND the phase build
 * both stay shut.
 *
 * Treating `rejected` as closed therefore made the review's own Reject button
 * a one-way door onto a dead end. Once every response carried a disposition
 * there was no open work left, so the action row stopped rendering entirely
 * and the rejected row's checkbox was disabled — not one control on the page
 * could revise the single decision that was holding the phase, while the
 * gate's blocker text went on saying "Review and accept each required
 * readiness-workbook response before this phase closes."
 *
 * The server never locked this: `mergeStageReadinessReviewDecisions` states
 * that incoming decisions always win, and neither the route nor
 * `buildStageReadinessProposalReview` guards on the current disposition. Only
 * the client treated a rejection as final.
 *
 * A blank response stays excluded. It cannot be accepted at all, so no
 * decision available here would release it; completing the cell and uploading
 * the workbook again is still its only path, which is what the preview's blank
 * tally says.
 *
 * This predicate must NOT be used to seed the selection. Pre-selecting a
 * decided row would let one "Accept selected" silently reverse a deliberate
 * rejection. Revising a decision is a deliberate act: tick that row, then
 * choose. `selectableWorkbookProposalIds` stays on
 * `isWorkbookProposalOpenForReview`.
 */
export function isWorkbookProposalReviewable(
  proposal: ReviewableWorkbookProposal | null | undefined,
): boolean {
  return isWorkbookProposalAcceptable(proposal);
}
