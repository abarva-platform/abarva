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

/** The two fields a carried-forward disposition needs; read off stored JSON. */
export interface PriorReviewedProposal {
  proposalId?: string | null;
  disposition?: string | null;
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
 * The dispositions already recorded for this exact proposal set, or null when
 * no current review belongs to it. Both the artifact metadata and the stored
 * review body must reference the set, which is the same pair of checks the
 * phase workspace uses before it seeds a stored review onto the screen.
 */
export async function loadPriorStageReadinessReviewProposals(
  ctx: TenancyCtx,
  moveId: string,
  phase: number,
  proposalSet: StageReadinessProposalSetReference,
): Promise<PriorReviewedProposal[] | null> {
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
  if (
    !isReviewForStageReadinessProposalSet({
      proposalSet,
      review: asReviewReference(reviewArtifact.metadata),
    })
  ) {
    return null;
  }

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
  if (
    !isReviewForStageReadinessProposalSet({
      proposalSet,
      review: asReviewReference(review),
    })
  ) {
    return null;
  }
  const proposals = (review as { proposals?: unknown }).proposals;
  if (!Array.isArray(proposals)) return null;
  return proposals.filter(
    (proposal): proposal is PriorReviewedProposal =>
      typeof proposal === "object" && proposal !== null,
  );
}
