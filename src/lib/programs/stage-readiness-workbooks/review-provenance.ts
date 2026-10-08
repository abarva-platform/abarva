/**
 * A decision shown on screen is not the same thing as a decision on record,
 * and only one of the two may answer a gate.
 *
 * `previewStageReadinessStoredReview` exists so a reviewer who re-uploads a
 * corrected workbook can SEE the decisions the server would restore when they
 * next submit, instead of a screen of sixty undecided rows. It says of itself
 * that it decides nothing, and that is true of the module. It stopped being
 * true of the page: the phase workspace seeds those restored dispositions onto
 * the proposal list, and that same list is projected into
 * `StageReadinessGateProposal`s for `applyStageReadinessToEvidencePackets`.
 * The phase-1 branch there asks whether every required proposal is `accepted`
 * — so a preview of what a human WOULD be asked to confirm was answering
 * whether they already had, and the Charter phase read as having a complete
 * P1-to-P2 workbook review while no review of the current proposal set
 * existed at all.
 *
 * The restoring itself is right and stays. What was missing is that the rows
 * carry no record of where their disposition came from, so a reader that must
 * distinguish the two cannot. The page already withholds the superseded
 * review from `p1ToP2ReviewStatusFromMetadata` and drops its stored readiness
 * split, both for this reason; the gate projection is the caller that reading
 * was never swept to.
 *
 * So provenance is carried per row, and the two readings are stated here once:
 * a restored disposition is shown, and it is not counted as recorded until a
 * human submits it. `keptDecisionsToRecord` is the third reading and the
 * reason the first two do not strand anyone — a re-upload that changes nothing
 * leaves no row pending, so without it the fixed gate would hold the phase and
 * no control on the page could clear it. Recording a kept decision changes no
 * disposition: each row is submitted as the disposition that human already
 * recorded against identical text.
 */

import type { StageReadinessReviewPreview } from "./review-preview";

/** The two fields this reading needs; everything else is the caller's business. */
export interface ProvenancedProposal {
  proposalId?: string | null;
  disposition?: string | null;
  /**
   * The disposition on this row was recorded against an EARLIER upload and
   * restored by answer text. No review of the proposal set under review has
   * recorded it, so it may be shown but may not answer a gate.
   */
  dispositionRestoredFromPriorUpload?: boolean;
}

/** The gate's own word for "no decision". */
const NO_DECISION = "pending";

/**
 * Apply a preview's dispositions to the proposal rows, marking the restored
 * ones as restored.
 *
 * Provenance is set in the same place as the disposition it describes, so a
 * later caller cannot seed one without the other.
 */
export function seedProposalsFromReviewPreview<
  T extends { proposalId?: string | null; disposition?: string | null },
>(input: {
  proposals: readonly T[];
  preview: StageReadinessReviewPreview;
}): Array<T & { dispositionRestoredFromPriorUpload?: boolean }> {
  const restored = input.preview.source === "prior_upload";
  return input.proposals.map((proposal) => {
    const previewed = proposal.proposalId
      ? input.preview.dispositionByProposalId[proposal.proposalId]
      : undefined;
    if (previewed === undefined) return { ...proposal };
    return {
      ...proposal,
      disposition: previewed,
      ...(restored ? { dispositionRestoredFromPriorUpload: true } : {}),
    };
  });
}

/** Whether this row's disposition is shown but not yet on record for this set. */
export function isRestoredDisposition(
  proposal: ProvenancedProposal | null | undefined,
): boolean {
  return proposal?.dispositionRestoredFromPriorUpload === true;
}

/**
 * The same rows with every restored disposition returned to `pending`: what a
 * gate, an evidence packet, or any other reader of recorded human review may
 * see. A row whose decision was recorded against the current set is untouched.
 */
export function recordedDispositionsOnly<T extends ProvenancedProposal>(
  proposals: readonly T[] | null | undefined,
): T[] {
  return (proposals ?? []).map((proposal) =>
    isRestoredDisposition(proposal)
      ? { ...proposal, disposition: NO_DECISION }
      : proposal,
  );
}

/** A decision to submit so a restored disposition becomes a recorded one. */
export interface KeptDecision {
  proposalId: string;
  disposition: string;
}

/**
 * The restored decisions a reviewer can put on record, each as the
 * disposition that was already recorded for it.
 *
 * Nothing here is re-decided: a restored rejection is submitted as a
 * rejection. The route refuses a batch of no decisions, so this is also the
 * only way an unchanged re-upload reaches a recorded review.
 */
export function keptDecisionsToRecord<T extends ProvenancedProposal>(
  proposals: readonly T[] | null | undefined,
): KeptDecision[] {
  const decisions: KeptDecision[] = [];
  for (const proposal of proposals ?? []) {
    if (!isRestoredDisposition(proposal)) continue;
    const proposalId = proposal.proposalId;
    const disposition = proposal.disposition;
    if (!proposalId || !disposition || disposition === NO_DECISION) continue;
    decisions.push({ proposalId, disposition });
  }
  return decisions;
}
