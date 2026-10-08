// What a DECIDED program-evidence review is, and what the reader of a document
// cabinet can still do about it.
//
// `program_evidence_reviews.decision` has exactly three values (its CHECK
// constraint admits `pending | approved | rejected`) and the domain is declared
// once, in `current-state-doc-ingest.ts`, so the type is imported here rather
// than restated.
//
// The cabinet asked for two of the three by name — one read filtered
// `decision = 'pending'` for the review queue and another filtered
// `decision = 'approved'` for the reviewed list. A `rejected` row therefore
// appeared in NEITHER list, while the queue's own explainer sentence told the
// reader that "pending and rejected evidence is excluded from phase
// generation" — naming a state the surface then refused to show. So a reviewer
// who rejected a parsed extraction watched the card disappear and had no way to
// see what they had rejected, the rationale they had just recorded, or why the
// file still listed in the cabinet no longer informs generation.
//
// What makes that worse than a missing row: the decision is one-way.
// `decideEvidenceReview`'s guarded update filters `.eq("decision","pending")`,
// and its fallback returns `ok: false` whenever the stored decision differs
// from the one submitted. So `rejected → approved` is refused from every
// control that exists, and re-uploading the same file reproduces the same
// extraction the reviewer just rejected. The only thing that works is a
// corrected or different source, and that was stated nowhere.
//
// This module owns the three facts a decided-review list needs: which decisions
// the cabinet's read asks for, how one grouped read splits into the two lists,
// and what a rejected row is called and tells the reader to do. No database
// access and no `server-only`, so a suite can import it directly.

import type { ReviewDecision } from "./current-state-doc-ingest";

/**
 * The decisions that are DECIDED — the complement of `pending` over the
 * column's domain, and the single declaration of the set the cabinet's
 * decided-review read asks for. One read over both is what keeps a third
 * decision value from going unread the way `rejected` did.
 */
export const DECIDED_EVIDENCE_REVIEW_DECISIONS: readonly Exclude<
  ReviewDecision,
  "pending"
>[] = ["approved", "rejected"];

/** True for a decision a decided-review list is allowed to render. */
export function isDecidedEvidenceReviewDecision(
  decision: unknown,
): decision is Exclude<ReviewDecision, "pending"> {
  return (
    typeof decision === "string" &&
    (DECIDED_EVIDENCE_REVIEW_DECISIONS as readonly string[]).includes(decision)
  );
}

/**
 * Split one read over the decided decisions into the two lists the cabinet
 * renders.
 *
 * A row whose decision is `pending` or unrecognised lands in NEITHER list. The
 * queue is the pending surface and it has its own read; a pending row leaking
 * into the approved list would report evidence as committed before a human
 * accepted it, which is the invariant the whole review ladder exists for.
 */
export function splitDecidedEvidenceReviews<T extends { decision?: unknown }>(
  rows: readonly T[],
): { approved: T[]; rejected: T[] } {
  const approved: T[] = [];
  const rejected: T[] = [];
  for (const row of rows) {
    if (row.decision === "approved") approved.push(row);
    else if (row.decision === "rejected") rejected.push(row);
  }
  return { approved, rejected };
}

export interface RejectedEvidenceReviewPresentation {
  /** What the state is called where the row is listed. */
  label: string;
  /**
   * The action that can still succeed. Deliberately NOT "approve it" or
   * "upload it again": the stored decision cannot be re-decided, and the same
   * file parses to the same extraction that was rejected.
   */
  nextAction: string;
  /** The reviewer's recorded reason, when one was stored. */
  rationale: string | null;
}

const REJECTED_NEXT_ACTION =
  "A rejected review cannot be re-decided, and re-uploading the same file " +
  "produces the same extraction. Upload a corrected file or a different " +
  "source to provide this evidence again.";

/**
 * Describe a rejected review for the cabinet.
 *
 * The rationale is normalised to null when blank so a list never renders an
 * empty reason as if a reviewer had left one; the next action does not depend
 * on it, because it is true whether or not a reason was recorded.
 */
export function describeRejectedEvidenceReview(input: {
  rationale?: string | null;
}): RejectedEvidenceReviewPresentation {
  const rationale = input.rationale?.trim();
  return {
    label: "Rejected",
    nextAction: REJECTED_NEXT_ACTION,
    rationale: rationale ? rationale : null,
  };
}
