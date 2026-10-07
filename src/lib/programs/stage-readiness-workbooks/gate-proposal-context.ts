import "server-only";

import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type { StageReadinessGateProposal } from "./gate-readiness";
import {
  STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
  type StageReadinessProposalReview,
} from "./proposals";

/**
 * The stored transition review AS IT STANDS, for reading the gate's blockers.
 *
 * This is the partial-review counterpart to `loadAcceptedStageReadinessContext`
 * in `./accepted-context`, and the difference between the two is the point of
 * having both.
 *
 * That loader answers "may these responses feed the next phase's prompt?" and
 * so returns null unless the review is FINISHED — every proposal decided, at
 * least one accepted. The phase gate was reading its proposals too, and a null
 * there means the gate sees no workbook at all. Two consequences, both measured
 * against the gate's own stated contract that only REQUIRED answers gate a
 * transition (`assessStageReadinessGate`):
 *
 * 1. A single undecided RECOMMENDED response held the phase shut permanently.
 *    A blank response is not reviewable from the review surface at all — it
 *    fails `isWorkbookProposalAcceptable`, so its checkbox is disabled and it
 *    can be neither accepted nor rejected — and the workbook declares a
 *    recommended question optional, so leaving its cell empty is the expected
 *    thing to do. Its disposition therefore stayed `pending` forever, the
 *    strict loader kept returning null, and the gate kept returning 409 with
 *    no control anywhere able to clear it.
 * 2. A workbook reviewed down to one held REQUIRED response was reported as a
 *    workbook that had never been reviewed, naming no held response.
 *
 * So the gate reads the review as it stands and lets
 * `applyStageReadinessToEvidencePackets` apply the required-only rule it
 * already owns. Nothing here decides anything: a required response that is not
 * accepted, not answered, or not sourced still holds its evidence family, and a
 * review in which no required response has been decided at all is still
 * reported once, as a missing workbook, rather than once per family.
 */
export async function loadStageReadinessGateProposals(
  ctx: TenancyCtx,
  moveId: string,
  targetPhase: number,
): Promise<StageReadinessGateProposal[] | null> {
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

  const downloaded = await downloadArtifactBytes(
    ctx,
    reviewArtifact.artifact_id,
  );
  if (!downloaded) return null;

  let review: StageReadinessProposalReview;
  try {
    review = JSON.parse(
      downloaded.bytes.toString("utf-8"),
    ) as StageReadinessProposalReview;
  } catch {
    // An unreadable review is not a reviewed workbook. Returning null leaves
    // the gate on its wholly-unreviewed reading, which is the safe one.
    return null;
  }

  // A review stored against another Move or another transition says nothing
  // about this one.
  if (
    review.moveId !== moveId ||
    review.transition?.fromPhase !== sourcePhase ||
    review.transition?.toPhase !== targetPhase
  ) {
    return null;
  }

  const proposals = (review.proposals ?? []).map(
    (proposal): StageReadinessGateProposal => ({
      questionId: proposal.questionId ?? "",
      dimensionId: proposal.dimensionId ?? "",
      requirement:
        proposal.requirement === "recommended" ? "recommended" : "required",
      answerState:
        proposal.answerState === "answered" ||
        proposal.answerState === "unknown" ||
        proposal.answerState === "insufficient_evidence"
          ? proposal.answerState
          : "blank",
      disposition:
        proposal.disposition === "accepted" ||
        proposal.disposition === "rejected" ||
        proposal.disposition === "needs_validation"
          ? proposal.disposition
          : "pending",
      evidenceOrSource: proposal.evidenceOrSource ?? "",
    }),
  );

  // An empty review is indistinguishable from no review for gate purposes, and
  // the callers' `?? null` already means "no workbook".
  return proposals.length > 0 ? proposals : null;
}
