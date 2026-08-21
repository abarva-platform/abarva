import "server-only";

import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
  type StageReadinessAcceptedWorkbookResponse,
  type StageReadinessProposalReview,
} from "./proposals";

export interface AcceptedStageReadinessContext {
  moveId: string;
  sourcePhase: number;
  targetPhase: number;
  reviewArtifactId: string;
  reviewArtifactVersion: number;
  acceptedResponses: StageReadinessAcceptedWorkbookResponse[];
  readiness: StageReadinessProposalReview["summary"]["readiness"];
}

export async function loadAcceptedStageReadinessContext(
  ctx: TenancyCtx,
  moveId: string,
  targetPhase: number,
): Promise<AcceptedStageReadinessContext | null> {
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
  if (
    numberFrom(metadata.pendingCount) > 0 ||
    numberFrom(metadata.needsValidationCount) > 0 ||
    numberFrom(metadata.acceptedCount) <= 0
  ) {
    return null;
  }

  const downloaded = await downloadArtifactBytes(
    ctx,
    reviewArtifact.artifact_id,
  );
  if (!downloaded) return null;
  const review = JSON.parse(
    downloaded.bytes.toString("utf-8"),
  ) as StageReadinessProposalReview;
  if (
    review.moveId !== moveId ||
    review.transition.fromPhase !== sourcePhase ||
    review.transition.toPhase !== targetPhase ||
    review.summary.pendingCount > 0 ||
    review.summary.needsValidationCount > 0 ||
    review.summary.acceptedCount <= 0
  ) {
    return null;
  }

  return {
    moveId,
    sourcePhase,
    targetPhase,
    reviewArtifactId: reviewArtifact.artifact_id,
    reviewArtifactVersion: reviewArtifact.version,
    acceptedResponses: review.acceptedResponses,
    readiness: review.summary.readiness,
  };
}

export function formatAcceptedStageReadinessContextForPrompt(
  context: AcceptedStageReadinessContext | null,
): string {
  if (!context || context.acceptedResponses.length === 0) return "";
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
    `Assessment readiness: ${context.readiness.ready} ready; ${context.readiness.insufficientEvidence} insufficient evidence; ${context.readiness.unknown} unknown.`,
    "Only these accepted responses are eligible for next-phase context. Pending, rejected, and needs-validation workbook proposals are excluded.",
    ...lines,
  ].join("\n");
}

function numberFrom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
