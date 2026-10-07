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
