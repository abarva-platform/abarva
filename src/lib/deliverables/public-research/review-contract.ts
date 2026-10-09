/**
 * The review queue's wire contract for outside public sources on a Move: what
 * the list route returns per source, and the sentence each refusal carries.
 *
 * Pure and client-safe (no I/O, no server-only imports), so the routes that
 * write these bodies and the panel that reads them share one vocabulary.
 *
 * Every refusal states what did and did not land. The review route has one
 * write (the decision); a refusal before it says "no decision was recorded",
 * and the two that can fire on either side of it (`review_decision_unconfirmed`)
 * claim neither direction and send the reviewer to reload.
 */

import type {
  PublicSource,
  PublicSourceConfidence,
  PublicSourceDecision,
  PublicSourceReviewDecision,
} from "./types";

/**
 * A reviewer's note on a decision is short (DB CHECK, 1 to 500 characters).
 * Declared here rather than in `types.ts` so the client panel can read it
 * without pulling the governance policy module into the browser bundle.
 */
export const PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS = 500;

/** One source as the review queue receives it. Every field is untrusted text. */
export interface PublicSourceReviewItem {
  id: string;
  decision: PublicSourceDecision;
  url: string;
  title: string;
  publisher: string | null;
  /** YYYY-MM-DD when the page states one. */
  publishedAt: string | null;
  retrievedAt: string;
  /** At most 300 characters, verbatim from the page. Never more of the page. */
  excerpt: string;
  claim: string | null;
  confidence: PublicSourceConfidence | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

/**
 * The list route's projection. Tenant key, Move id, run id and reviewer id
 * are deliberately not sent: the panel needs none of them.
 */
export function toPublicSourceReviewItem(
  source: PublicSource,
): PublicSourceReviewItem {
  return {
    id: source.id,
    decision: source.decision,
    url: source.url,
    title: source.title,
    publisher: source.publisher,
    publishedAt: source.publishedAt,
    retrievedAt: source.retrievedAt,
    excerpt: source.excerpt,
    claim: source.claim,
    confidence: source.confidence,
    reviewedAt: source.reviewedAt,
    reviewNote: source.reviewNote,
  };
}

/**
 * The citation number of each approved source on a Move: an approved source
 * is cited as `[S:n]`. The store keeps no number, so it is derived here, in
 * one place, from approval order: approved sources sorted by `reviewedAt`,
 * oldest first, ties broken by id. A decision is made once and never changed,
 * so a source's number never moves once given; a later approval only appends.
 * Pending and rejected sources get no number — they are never cited.
 *
 * The derivation reads the list it is handed, so it is exact only when that
 * list holds every approved source on the Move (the review list's limit is
 * far above any Move's research yield; a deliverable that cites must number
 * from the same full approved set).
 */
export function publicSourceCiteNumbers(
  sources: ReadonlyArray<
    Pick<PublicSourceReviewItem, "id" | "decision" | "reviewedAt">
  >,
): Map<string, number> {
  const approved = sources
    .filter((source) => source.decision === "approved")
    .slice()
    .sort((a, b) => {
      const at = a.reviewedAt ?? "";
      const bt = b.reviewedAt ?? "";
      if (at !== bt) {
        // A missing stamp sorts last: it cannot claim an earlier number.
        if (!at) return 1;
        if (!bt) return -1;
        return at < bt ? -1 : 1;
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  return new Map(approved.map((source, index) => [source.id, index + 1]));
}

export type PublicSourceReviewRefusalCode =
  | "not_enabled"
  | "forbidden"
  | "invalid_decision"
  | "invalid_note"
  | "invalid_filter"
  | "invalid_scope"
  | "source_not_found"
  | "already_decided"
  | "decided_by_another_reviewer"
  | "sources_unreadable"
  | "review_read_failed"
  | "review_decision_unconfirmed";

const NOTHING_RECORDED = "No decision was recorded.";

/**
 * The sentence for each refusal. `currentDecision` names the decision that
 * stands when the source was already decided.
 */
export function describePublicSourceReviewRefusal(
  code: PublicSourceReviewRefusalCode,
  opts: { currentDecision?: PublicSourceReviewDecision } = {},
): string {
  switch (code) {
    case "not_enabled":
      return "Outside public-source review is not turned on for this workspace. Nothing was read and no decision was recorded.";
    case "forbidden":
      return `Only an authorized workspace user can approve or reject outside sources on this Move. ${NOTHING_RECORDED}`;
    case "invalid_decision":
      return `Choose Approve or Reject. ${NOTHING_RECORDED}`;
    case "invalid_note":
      return `The note could not be stored as written: keep it to ${PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS} characters of text. ${NOTHING_RECORDED}`;
    case "invalid_filter":
      return "Filter by pending, approved or rejected, or leave the filter off. Nothing was read.";
    case "invalid_scope":
      return `This Move or workspace could not be identified for outside-source review. ${NOTHING_RECORDED}`;
    case "source_not_found":
      return `This outside source is not on this Move. ${NOTHING_RECORDED} Reload the list to see the sources that are.`;
    case "already_decided":
      return opts.currentDecision
        ? `This outside source was already ${opts.currentDecision}. That decision stands and nothing was changed.`
        : "This outside source was already decided. That decision stands and nothing was changed.";
    case "decided_by_another_reviewer":
      return "Another reviewer decided this outside source first. Their decision stands and yours was not recorded. Reload the list to see it.";
    case "sources_unreadable":
      return "Outside sources could not be read just now. That is not the same as having none; try again.";
    case "review_read_failed":
      return `This outside source could not be read, so ${NOTHING_RECORDED.toLowerCase()} Try again.`;
    case "review_decision_unconfirmed":
      return "The decision could not be confirmed: it may or may not have been recorded. Reload the list to see this source's current decision before deciding again.";
  }
}

/**
 * What the panel says when a refusal arrives with no sentence of its own (a
 * proxy error page, a dropped connection). It cannot know whether the write
 * landed, so it claims neither direction.
 */
export const PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE =
  describePublicSourceReviewRefusal("review_decision_unconfirmed");

/** The same, for a list read that came back with no sentence. */
export const PUBLIC_SOURCE_LIST_UNNAMED_FAILURE =
  describePublicSourceReviewRefusal("sources_unreadable");
