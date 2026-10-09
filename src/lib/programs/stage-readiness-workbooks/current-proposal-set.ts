import type { StageReadinessGateProposal } from "./gate-readiness";
import { STAGE_READINESS_PROPOSAL_SET_ARTIFACT_TYPE } from "./proposals";

/**
 * Which uploaded workbook a transition is being judged on, and how one of its
 * rows reads to the gate — one definition for the phase page and the server.
 *
 * The phase page has always judged the gate on the CURRENT upload: it reads
 * the proposal set on file, seeds a stored review onto it only when that review
 * was recorded against this exact set, and returns every decision carried over
 * from an earlier upload to `pending` before any gate reading sees it. The
 * server's gate read did not ask which upload a review belonged to, so a
 * workbook re-uploaded after review was judged on the PREVIOUS upload's
 * decisions: a required response changed or emptied in the new upload stayed
 * accepted at the gate while the page beside it showed it pending. The page
 * held the build on the new upload; the gate submit and the build route both
 * passed on the old one.
 *
 * Both readers now pick the upload here and map its rows here, so they cannot
 * disagree about which workbook a transition is waiting on.
 */

export interface StageReadinessArtifactRow {
  artifact_type?: string | null;
  phase?: number | null;
  status?: string | null;
}

/**
 * The upload under review for a source phase. Every set is written once, at
 * upload, as `review_required`, and is never rewritten — a review is its own
 * artifact — so this is the set a reviewer is looking at.
 */
export function findCurrentStageReadinessProposalSetArtifact<
  T extends StageReadinessArtifactRow,
>(artifacts: readonly T[], sourcePhase: number): T | undefined {
  return artifacts.find(
    (artifact) =>
      artifact.phase === sourcePhase &&
      artifact.artifact_type === STAGE_READINESS_PROPOSAL_SET_ARTIFACT_TYPE &&
      artifact.status === "review_required",
  );
}

export interface StageReadinessGateProposalSource {
  questionId?: string | null;
  dimensionId?: string | null;
  requirement?: string | null;
  answerState?: string | null;
  disposition?: string | null;
  evidenceOrSource?: string | null;
}

/** One stored row as the gate reads it. Anything unrecognised is the strict reading. */
export function toStageReadinessGateProposal(
  proposal: StageReadinessGateProposalSource,
): StageReadinessGateProposal {
  return {
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
  };
}

/**
 * The current upload's rows with no decision on record: what the gate reads
 * when no review has been recorded against this set — including when the review
 * on file was recorded against an earlier upload.
 */
export function undecidedStageReadinessGateProposals(
  proposals: readonly StageReadinessGateProposalSource[],
): StageReadinessGateProposal[] {
  return proposals.map((proposal) =>
    toStageReadinessGateProposal({ ...proposal, disposition: "pending" }),
  );
}
