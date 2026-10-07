import "server-only";

import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
  type StageReadinessAcceptedWorkbookResponse,
  type StageReadinessWorkbookProposal,
  type StageReadinessProposalReview,
} from "./proposals";

export interface AcceptedStageReadinessContext {
  moveId: string;
  sourcePhase: number;
  targetPhase: number;
  reviewArtifactId: string;
  reviewArtifactVersion: number;
  proposals: StageReadinessWorkbookProposal[];
  acceptedResponses: StageReadinessAcceptedWorkbookResponse[];
  readiness: StageReadinessProposalReview["summary"]["readiness"];
}

/**
 * The stored transition review exactly as it stands, with no judgement about
 * whether the review is finished.
 *
 * Two different questions are asked of this artifact and they are not the same
 * question. A forward control asks "is this transition reviewed enough to
 * proceed", which is a policy over the review's counts. The next phase's
 * generation prompt asks "which workbook answers did a human accept", which
 * the review already answers by construction: `acceptedResponses` is built
 * only from proposals whose disposition is `accepted`, so pending, rejected
 * and needs-validation responses are excluded before any reader sees them.
 *
 * Keeping one read here, with each policy applied by its own caller, is what
 * stops the strict reading from being borrowed for the question it never
 * answered. See `loadStageReadinessPromptContext` for the prompt policy.
 */
export interface StoredStageReadinessReview {
  moveId: string;
  sourcePhase: number;
  targetPhase: number;
  reviewArtifactId: string;
  reviewArtifactVersion: number;
  summary: StageReadinessProposalReview["summary"];
  proposals: StageReadinessWorkbookProposal[];
  acceptedResponses: StageReadinessAcceptedWorkbookResponse[];
  readiness: StageReadinessProposalReview["summary"]["readiness"];
}

interface StageReadinessReviewArtifactRef {
  sourcePhase: number;
  targetPhase: number;
  artifactId: string;
  version: number;
  /**
   * The counts as recorded on the artifact row. The row and the body are
   * written from one summary, so they agree by construction; the finished-review
   * policy asserts the row first so it can refuse without downloading bytes it
   * will discard.
   */
  metadataCounts: {
    pendingCount: number;
    needsValidationCount: number;
    acceptedCount: number;
  };
}

async function findStageReadinessReviewArtifact(
  ctx: TenancyCtx,
  moveId: string,
  targetPhase: number,
): Promise<StageReadinessReviewArtifactRef | null> {
  const sourcePhase = targetPhase - 1;
  if (sourcePhase < 0) return null;
  const artifacts = await listMoveArtifacts(ctx, moveId, {
    family: "approval_artifact",
    currentOnly: true,
  });
  const reviewArtifact = artifacts.find(
    (artifact) =>
      artifact.phase === sourcePhase &&
      artifact.artifact_type === STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
  );
  if (!reviewArtifact) return null;
  const metadata = reviewArtifact.metadata ?? {};
  return {
    sourcePhase,
    targetPhase,
    artifactId: reviewArtifact.artifact_id,
    version: reviewArtifact.version,
    metadataCounts: {
      pendingCount: numberFrom(metadata.pendingCount),
      needsValidationCount: numberFrom(metadata.needsValidationCount),
      acceptedCount: numberFrom(metadata.acceptedCount),
    },
  };
}

async function readStageReadinessReviewBody(
  ctx: TenancyCtx,
  moveId: string,
  ref: StageReadinessReviewArtifactRef,
): Promise<StoredStageReadinessReview | null> {
  const downloaded = await downloadArtifactBytes(ctx, ref.artifactId);
  if (!downloaded) return null;
  let review: StageReadinessProposalReview;
  try {
    review = JSON.parse(
      downloaded.bytes.toString("utf-8"),
    ) as StageReadinessProposalReview;
  } catch {
    return null;
  }
  // Identity, not readiness: a review body belonging to another Move or
  // another transition is not this transition's review at all.
  if (
    review.moveId !== moveId ||
    review.transition?.fromPhase !== ref.sourcePhase ||
    review.transition?.toPhase !== ref.targetPhase
  ) {
    return null;
  }

  return {
    moveId,
    sourcePhase: ref.sourcePhase,
    targetPhase: ref.targetPhase,
    reviewArtifactId: ref.artifactId,
    reviewArtifactVersion: ref.version,
    summary: review.summary,
    proposals: review.proposals ?? [],
    acceptedResponses: review.acceptedResponses ?? [],
    readiness: review.summary?.readiness,
  };
}

export async function loadStoredStageReadinessReview(
  ctx: TenancyCtx,
  moveId: string,
  targetPhase: number,
): Promise<StoredStageReadinessReview | null> {
  const ref = await findStageReadinessReviewArtifact(ctx, moveId, targetPhase);
  if (!ref) return null;
  return readStageReadinessReviewBody(ctx, moveId, ref);
}

/**
 * The transition review only once it is FINISHED: nothing pending, nothing
 * awaiting validation, and at least one acceptance. This is a forward-control
 * policy — it answers "has this review been completed", not "what did a human
 * accept". Do not reuse it to decide what may feed a prompt.
 */
export async function loadAcceptedStageReadinessContext(
  ctx: TenancyCtx,
  moveId: string,
  targetPhase: number,
): Promise<AcceptedStageReadinessContext | null> {
  const ref = await findStageReadinessReviewArtifact(ctx, moveId, targetPhase);
  if (!ref) return null;
  if (
    ref.metadataCounts.pendingCount > 0 ||
    ref.metadataCounts.needsValidationCount > 0 ||
    ref.metadataCounts.acceptedCount <= 0
  ) {
    return null;
  }

  const stored = await readStageReadinessReviewBody(ctx, moveId, ref);
  if (!stored) return null;
  if (
    numberFrom(stored.summary?.pendingCount) > 0 ||
    numberFrom(stored.summary?.needsValidationCount) > 0 ||
    numberFrom(stored.summary?.acceptedCount) <= 0
  ) {
    return null;
  }

  return {
    moveId: stored.moveId,
    sourcePhase: stored.sourcePhase,
    targetPhase: stored.targetPhase,
    reviewArtifactId: stored.reviewArtifactId,
    reviewArtifactVersion: stored.reviewArtifactVersion,
    proposals: stored.proposals,
    acceptedResponses: stored.acceptedResponses,
    readiness: stored.readiness,
  };
}

export function formatAcceptedStageReadinessContextForPrompt(
  context: AcceptedStageReadinessContext | null,
  options: {
    /**
     * Workbook responses that still carry no decision. When this is above
     * zero the review is genuinely unfinished, and the prompt says so rather
     * than presenting a partial set as the whole transition.
     */
    openResponseCount?: number;
  } = {},
): string {
  if (!context || context.acceptedResponses.length === 0) return "";
  const openResponseCount =
    typeof options.openResponseCount === "number" &&
    Number.isFinite(options.openResponseCount)
      ? Math.max(0, Math.trunc(options.openResponseCount))
      : 0;
  const lines = context.acceptedResponses.map((response) => {
    const value = response.response.trim() || "(blank accepted response)";
    const evidence = response.evidenceOrSource.trim()
      ? ` Evidence/source: ${response.evidenceOrSource.trim()}`
      : "";
    const note =
      response.answerState === "insufficient_evidence"
        ? " Readiness: insufficient evidence; do not infer the missing fact."
        : response.answerState === "unknown"
          ? " Readiness: unknown; preserve as an explicit unknown."
          : "";
    return `- ${response.dimensionId}/${response.questionId}: ${value}.${evidence}${note}`;
  });

  return [
    `## Accepted Stage Readiness Workbook Responses (P${context.sourcePhase} to P${context.targetPhase})`,
    `Source review artifact: ${context.reviewArtifactId} v${context.reviewArtifactVersion}.`,
    `Assessment readiness: ${numberFrom(context.readiness?.ready)} ready; ${numberFrom(context.readiness?.insufficientEvidence)} insufficient evidence; ${numberFrom(context.readiness?.unknown)} unknown.`,
    "Only these accepted responses are eligible for next-phase context. Pending, rejected, and needs-validation workbook proposals are excluded.",
    ...(openResponseCount > 0
      ? [
          `This review is still open: ${openResponseCount} workbook response(s) carry no decision yet and are excluded. Treat the transition as reviewed only for the responses listed below.`,
        ]
      : []),
    ...lines,
  ].join("\n");
}

function numberFrom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
