import "server-only";

/**
 * A workbook review recorded in more than one batch has to accumulate.
 *
 * The stored proposal SET is written once, at upload, with every proposal
 * `pending` — `buildProposal` hardcodes that disposition and the set artifact is
 * never rewritten. The review PATCH loads that set and applies only the
 * decisions in its own request body, so a second batch recomputed the review
 * from all-pending and silently discarded the first batch's dispositions.
 *
 * That made the transition unreachable for any review that is not uniform.
 * Accepting 30 responses and then rejecting 3 produced `acceptedCount: 0`,
 * `pendingCount: 30` — and `loadAcceptedStageReadinessContext` requires
 * `acceptedCount > 0` with `pendingCount === 0`, so the required
 * `stage_readiness_p<n>_p<n+1>` evidence packet stayed `missing` and both
 * forward controls kept refusing. Re-accepting the 30 then dropped the 3
 * rejections, so the counts oscillated and never both cleared.
 *
 * The phase workspace made this worse by reading correctly: the page seeds each
 * proposal with the current review's disposition, so the screen showed the 30
 * acceptances right up until the next batch threw them away. One stored
 * disposition, two readings, and only the reader accumulated.
 *
 * Carrying the current review's dispositions forward as the baseline for the
 * next batch is the fix. The incoming decisions are passed through first and
 * unchanged, so an unknown proposal id still reaches
 * `buildStageReadinessProposalReview`'s existing refusal rather than being
 * quietly dropped here.
 */

import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";

import {
  isReviewForStageReadinessProposalSet,
  STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
  type StageReadinessProposalDecision,
  type StageReadinessWorkbookProposal,
} from "./proposals";
import { isWorkbookProposalAcceptable } from "./review-selection";

/**
 * A reviewed proposal as it sits in stored JSON.
 *
 * `proposalId` + `disposition` are what a same-set carry-forward needs. The
 * four answer fields are what `review-carry-forward` matches on when the
 * stored review belongs to an EARLIER upload, whose proposal ids are all
 * different by construction. They are read off the same stored objects, which
 * are whole proposals, so nothing new has to be persisted for that reading.
 */
export interface PriorReviewedProposal {
  proposalId?: string | null;
  disposition?: string | null;
  questionId?: string | null;
  response?: string | null;
  context?: string | null;
  evidenceOrSource?: string | null;
}

export interface StageReadinessProposalSetReference {
  proposalSetId: string;
  artifactId: string;
  artifactVersion: number | null;
}

const CARRYABLE_DISPOSITIONS = new Set([
  "accepted",
  "rejected",
  "needs_validation",
]);

function isCarryableDisposition(
  value: string | null | undefined,
): value is StageReadinessProposalDecision["disposition"] {
  return typeof value === "string" && CARRYABLE_DISPOSITIONS.has(value);
}

/**
 * This batch's decisions, plus the current review's disposition for every
 * proposal this batch left alone. Incoming decisions always win.
 */
export function mergeStageReadinessReviewDecisions(input: {
  proposals: readonly Pick<
    StageReadinessWorkbookProposal,
    "proposalId" | "answerState" | "response"
  >[];
  priorReviewProposals: readonly PriorReviewedProposal[] | null | undefined;
  decisions: readonly StageReadinessProposalDecision[];
}): StageReadinessProposalDecision[] {
  const decidedNow = new Set(
    input.decisions.map((decision) => decision.proposalId),
  );
  const priorByProposalId = new Map<string, string>();
  for (const prior of input.priorReviewProposals ?? []) {
    if (typeof prior?.proposalId === "string" && prior.proposalId) {
      if (typeof prior.disposition === "string") {
        priorByProposalId.set(prior.proposalId, prior.disposition);
      }
    }
  }

  const carriedForward: StageReadinessProposalDecision[] = [];
  for (const proposal of input.proposals) {
    if (decidedNow.has(proposal.proposalId)) continue;
    const prior = priorByProposalId.get(proposal.proposalId);
    if (!isCarryableDisposition(prior)) continue;
    // A carried-forward acceptance of a blank response would make
    // `buildStageReadinessProposalReview` throw, which would hard-block the
    // transition. The same proposal set cannot gain blanks, so this only
    // guards against a review stored before that refusal existed.
    if (prior === "accepted" && !isWorkbookProposalAcceptable(proposal)) {
      continue;
    }
    carriedForward.push({
      proposalId: proposal.proposalId,
      disposition: prior,
      note: "Carried forward from the previous review batch.",
    });
  }

  return [...input.decisions, ...carriedForward];
}

type ReviewSetReference = Parameters<
  typeof isReviewForStageReadinessProposalSet
>[0]["review"];

/** Stored JSON read back off an artifact, narrowed only as far as the guard needs. */
function asReviewReference(value: unknown): ReviewSetReference {
  return typeof value === "object" && value !== null
    ? (value as ReviewSetReference)
    : null;
}

/**
 * The current review artifact stored for this move and transition, and whether
 * it belongs to the proposal set being reviewed now.
 *
 * Two readings need the same artifact and the same body, and they differ only
 * in which set the review has to belong to: a review of THIS set is the
 * multi-batch baseline, and a review of an EARLIER one is a superseded review
 * whose decisions may be restored by answer text. Resolving both from a single
 * lookup keeps them from disagreeing and reads the stored blob once, which is
 * also why the set policy is applied after the download rather than before it.
 */
export type StageReadinessStoredReviewKind = "current_set" | "superseded_set";

export interface StageReadinessStoredReview {
  kind: StageReadinessStoredReviewKind;
  proposals: PriorReviewedProposal[];
}

export async function loadStageReadinessStoredReview(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
  proposalSet: StageReadinessProposalSetReference,
): Promise<StageReadinessStoredReview | null> {
  if (!proposalSet.proposalSetId) return null;
  const artifacts = await listMoveArtifacts(ctx, moveId, {
    family: "approval_artifact",
    currentOnly: true,
  });
  const reviewArtifact = artifacts.find(
    (artifact) =>
      artifact.phase === phase &&
      artifact.artifact_type === STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
  );
  if (!reviewArtifact) return null;

  const downloaded = await downloadArtifactBytes(
    ctx,
    reviewArtifact.artifact_id,
  );
  if (!downloaded) return null;
  let review: unknown;
  try {
    review = JSON.parse(downloaded.bytes.toString("utf-8"));
  } catch {
    return null;
  }
  const storedProposals = (review as { proposals?: unknown }).proposals;
  if (!Array.isArray(storedProposals)) return null;

  // Both the artifact metadata and the stored body must reference the set,
  // which is the same pair of checks the phase workspace uses before it seeds
  // a stored review onto the screen.
  const belongsToThisSet =
    isReviewForStageReadinessProposalSet({
      proposalSet,
      review: asReviewReference(reviewArtifact.metadata),
    }) &&
    isReviewForStageReadinessProposalSet({
      proposalSet,
      review: asReviewReference(review),
    });

  return {
    kind: belongsToThisSet ? "current_set" : "superseded_set",
    proposals: storedProposals.filter(
      (proposal): proposal is PriorReviewedProposal =>
        typeof proposal === "object" && proposal !== null,
    ),
  };
}

/**
 * The dispositions already recorded for this exact proposal set, or null when
 * no current review belongs to it.
 *
 * A caller that also wants the superseded reading should use
 * `loadStageReadinessStoredReview` directly rather than calling this and a
 * sibling, so the stored review is read once.
 */
export async function loadPriorStageReadinessReviewProposals(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
  proposalSet: StageReadinessProposalSetReference,
): Promise<PriorReviewedProposal[] | null> {
  const stored = await loadStageReadinessStoredReview(
    ctx,
    moveId,
    phase,
    proposalSet,
  );
  return stored?.kind === "current_set" ? stored.proposals : null;
}
