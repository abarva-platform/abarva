import "server-only";

import {
  downloadArtifactBytes,
  listMoveArtifacts,
} from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  findCurrentStageReadinessProposalSetArtifact,
  toStageReadinessGateProposal,
  undecidedStageReadinessGateProposals,
} from "./current-proposal-set";
import type { StageReadinessGateProposal } from "./gate-readiness";
import type { StageReadinessWorkbookProposalSet } from "./proposals";
import { loadStageReadinessStoredReview } from "./review-accumulation";

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

  // The upload under review, chosen exactly as the phase page chooses it. A
  // review is judged against THIS set: one recorded against an earlier upload
  // holds decisions about answers this upload may have changed or emptied.
  // See `./current-proposal-set`.
  const artifacts = await listMoveArtifacts(ctx, moveId, {
    family: "approval_artifact",
    currentOnly: true,
  });
  const proposalSetArtifact = findCurrentStageReadinessProposalSetArtifact(
    artifacts,
    sourcePhase,
  );
  if (!proposalSetArtifact) return null;

  const setBytes = await downloadArtifactBytes(
    ctx,
    proposalSetArtifact.artifact_id,
  );
  if (!setBytes) return null;
  let proposalSet: StageReadinessWorkbookProposalSet;
  try {
    proposalSet = JSON.parse(
      setBytes.bytes.toString("utf-8"),
    ) as StageReadinessWorkbookProposalSet;
  } catch {
    // An unreadable upload is not a reviewed workbook. Returning null leaves
    // the gate on its wholly-unreviewed reading, which is the safe one.
    return null;
  }

  // A set stored against another Move or another transition says nothing
  // about this one.
  if (
    proposalSet.moveId !== moveId ||
    proposalSet.transition?.fromPhase !== sourcePhase ||
    proposalSet.transition?.toPhase !== targetPhase
  ) {
    return null;
  }

  const storedReview = await loadStageReadinessStoredReview(
    ctx,
    moveId,
    sourcePhase,
    {
      proposalSetId: proposalSet.proposalSetId ?? "",
      artifactId: proposalSetArtifact.artifact_id,
      artifactVersion: proposalSetArtifact.version,
    },
  );

  // Only a review of this set carries decisions the gate may honour. With none
  // on record — never reviewed, or reviewed only on an earlier upload — every
  // response of this upload is undecided, which is what the page shows.
  const proposals =
    storedReview?.kind === "current_set"
      ? storedReview.proposals.map(toStageReadinessGateProposal)
      : undecidedStageReadinessGateProposals(proposalSet.proposals ?? []);

  // An empty review is indistinguishable from no review for gate purposes, and
  // the callers' `?? null` already means "no workbook".
  return proposals.length > 0 ? proposals : null;
}
