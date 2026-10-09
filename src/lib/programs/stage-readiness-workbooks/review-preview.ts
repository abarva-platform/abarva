/**
 * What the phase workspace should already show a reviewer about decisions
 * that are still standing.
 *
 * The review surface seeds a stored review onto the screen only when that
 * review belongs to the proposal set being reviewed now. That reading is
 * correct for the set it was written about and wrong about everything else: a
 * corrected workbook mints a new `proposalSetId`, so the moment a reviewer
 * fixes one cell and uploads again, the review they already completed stops
 * belonging to the current set and the page falls back to showing every
 * response awaiting a decision.
 *
 * The server does not lose those decisions — `carryForwardStageReadinessDecisions`
 * restores each one whose question, response, context and source are unchanged
 * when the next batch is submitted. But a reviewer cannot see a restoration
 * that only happens on submit. They see 60 undecided rows, and the rational
 * response to that screen is to judge all 60 again. A decision the product
 * holds but never shows is, to the person doing the work, a decision it lost.
 *
 * So the page needs the same reading the route performs, computed before the
 * reviewer acts rather than after. This module is that reading, and it is
 * deliberately not a second implementation of the rules: it asks the two
 * existing mergers what they would carry forward for a batch that decides
 * nothing. Whatever the route would restore on submit is exactly what the
 * screen now shows, including the refusals — a restored acceptance of a
 * response this set reports blank is withheld in both places, because it is
 * the same code withholding it.
 *
 * Nothing here decides anything. Every disposition it returns was recorded by
 * a human against identical text, and the count it reports lets the surface
 * say so rather than present restored work as fresh.
 */

import type {
  StageReadinessProposalDecision,
  StageReadinessWorkbookProposal,
} from "./proposals";
import {
  mergeStageReadinessReviewDecisions,
  type StageReadinessStoredReview,
} from "./review-accumulation";
import { carryForwardStageReadinessDecisions } from "./review-carry-forward";

/**
 * The fields both mergers read. `context` is in this list because the
 * superseded reading keys on it: it is a column a human fills in, so a
 * caller that drops it would quietly match nothing on every row that has one.
 */
export type StageReadinessPreviewProposal = Pick<
  StageReadinessWorkbookProposal,
  | "proposalId"
  | "questionId"
  | "response"
  | "context"
  | "evidenceOrSource"
  | "answerState"
>;

/** Where the dispositions on screen came from. */
export type StageReadinessReviewPreviewSource =
  | "none"
  | "current_set"
  | "prior_upload";

export interface StageReadinessReviewPreview {
  /** Disposition to show per proposal id; absent means undecided. */
  dispositionByProposalId: Record<string, string>;
  /**
   * How many of those were recorded against an EARLIER upload and restored by
   * answer text. Zero for a review of the current set, whose decisions the
   * surface has always shown. This is the number worth telling the reviewer,
   * because it is the work they would otherwise redo.
   */
  restoredFromPriorUploadCount: number;
  source: StageReadinessReviewPreviewSource;
}

const EMPTY_PREVIEW: StageReadinessReviewPreview = {
  dispositionByProposalId: {},
  restoredFromPriorUploadCount: 0,
  source: "none",
};

function dispositionsOf(
  decisions: readonly StageReadinessProposalDecision[],
): Record<string, string> {
  const byProposalId: Record<string, string> = {};
  for (const decision of decisions) {
    if (decision.proposalId) {
      byProposalId[decision.proposalId] = decision.disposition;
    }
  }
  return byProposalId;
}

/**
 * The dispositions a reviewer should see standing against the current
 * proposal set, before they decide anything in this batch.
 *
 * Both branches pass `decisions: []` — the question being asked is precisely
 * "what would the route carry forward if this batch submitted nothing", so
 * the answer cannot drift from what submitting actually does.
 */
export function previewStageReadinessStoredReview(input: {
  proposals: readonly StageReadinessPreviewProposal[];
  /**
   * Narrowed to the two fields this reading uses, so the artifact plumbing the
   * loader also returns (status, metadata, stored summary) stays the caller's
   * business and a fixture here need not invent any of it.
   */
  storedReview:
    | Pick<StageReadinessStoredReview, "kind" | "proposals">
    | null
    | undefined;
}): StageReadinessReviewPreview {
  const stored = input.storedReview;
  if (!stored || stored.proposals.length === 0) return EMPTY_PREVIEW;

  if (stored.kind === "current_set") {
    return {
      dispositionByProposalId: dispositionsOf(
        mergeStageReadinessReviewDecisions({
          proposals: input.proposals,
          priorReviewProposals: stored.proposals,
          decisions: [],
        }),
      ),
      restoredFromPriorUploadCount: 0,
      source: "current_set",
    };
  }

  const carried = carryForwardStageReadinessDecisions({
    proposals: input.proposals,
    priorReviewProposals: stored.proposals,
    decisions: [],
  });
  if (carried.carriedForwardCount === 0) return EMPTY_PREVIEW;
  return {
    dispositionByProposalId: dispositionsOf(carried.decisions),
    restoredFromPriorUploadCount: carried.carriedForwardCount,
    source: "prior_upload",
  };
}
