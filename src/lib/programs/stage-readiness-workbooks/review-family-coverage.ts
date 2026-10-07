/**
 * A reviewed workbook can be a complete review of the wrong question set.
 *
 * The workbook's questions are built from `readiness.families` at DOWNLOAD
 * time — `buildStageReadinessWorkbookSpec` maps over that list and nothing
 * else. The gate re-derives the required evidence families at EVALUATION time,
 * from a fresh `loadDiscoveryEvidenceReadiness`, and
 * `buildMoveEvidenceNeedPackets` sets `priority: "required"` straight off
 * `family.required`. Between those two moments the family set can move: a Move
 * whose archetype declaration lands after a workbook was reviewed gets a
 * different blueprint, and so a different list of required families.
 *
 * Nothing detected that. `dimensionPlanVersion` is a build-time constant, not a
 * content hash of the family set, so a stored review of an older set reads as a
 * current review of the current one. The two readings then failed in opposite
 * directions off the same missing check:
 *
 * - Phases 2-4 blocked and could not be unblocked. The per-packet loop asks
 *   `assessStageReadinessGate` about a family the review never covered, which
 *   sees `required.length === 0` and returns `review_required` — reported with
 *   the SAME "Complete the P<n> to P<n+1> readiness workbook" sentence used for
 *   a workbook nobody has opened. But the reviewed workbook has no question for
 *   that family, so completing it, re-reviewing it, and accepting every
 *   response in it all leave the packet exactly where it was. The instruction
 *   named a control that could not satisfy it.
 * - Phase 1 passed when it should not. `reviewComplete` asks only whether the
 *   review's OWN required responses are all accepted, so a review that covered
 *   an earlier, smaller set reported the charter review complete while a newly
 *   required family had never been asked about at all.
 *
 * Coverage is the missing fact, and it is one question: does the reviewed
 * workbook contain a required response for this family? Answering it separates
 * "nobody has reviewed this workbook" from "this workbook does not ask about
 * this family", which are different situations needing different instructions —
 * review the workbook you have, versus download the one that matches the
 * current evidence families.
 *
 * This module only reports coverage. It never decides a family is ready: an
 * uncovered family stays blocked, and a covered one still has to pass
 * `assessStageReadinessGate` on its own merits.
 */

import type { StageReadinessGateProposal } from "./gate-readiness";

/**
 * The family ids the reviewed workbook asked a REQUIRED question about.
 *
 * Required only, matching every other reading in this area: a recommended
 * response is optional by declaration, so its presence cannot stand in for a
 * required one. A family whose questions were all recommended at download time
 * and is required now is therefore uncovered, which is the drift this exists to
 * catch.
 */
function stageReadinessReviewCoveredFamilyIds(
  proposals: readonly StageReadinessGateProposal[] | null | undefined,
): Set<string> {
  const covered = new Set<string>();
  for (const proposal of proposals ?? []) {
    if (proposal.requirement !== "required") continue;
    if (!proposal.dimensionId) continue;
    covered.add(proposal.dimensionId);
  }
  return covered;
}

/**
 * Currently-required families the reviewed workbook asks nothing required
 * about, in the order the packets were given.
 *
 * Duplicate family ids collapse, so a caller cannot be told about one family
 * twice because two packets named it.
 */
export function uncoveredRequiredFamilyIds(input: {
  requiredFamilyIds: readonly string[];
  proposals: readonly StageReadinessGateProposal[] | null | undefined;
}): string[] {
  const covered = stageReadinessReviewCoveredFamilyIds(input.proposals);
  const uncovered: string[] = [];
  const seen = new Set<string>();
  for (const familyId of input.requiredFamilyIds) {
    if (!familyId || covered.has(familyId) || seen.has(familyId)) continue;
    seen.add(familyId);
    uncovered.push(familyId);
  }
  return uncovered;
}

/**
 * Whether a human has acted on any required response in this review.
 *
 * This is the existing "reviewed at all" question, kept here so the two
 * situations are decided side by side: a review nobody has acted on is still
 * reported as one missing workbook, and only a review that HAS been worked can
 * be described as not covering a family.
 */
export function stageReadinessReviewHasDecidedRequiredResponse(
  proposals: readonly StageReadinessGateProposal[] | null | undefined,
): boolean {
  return (proposals ?? []).some(
    (proposal) =>
      proposal.requirement === "required" && proposal.disposition !== "pending",
  );
}

/**
 * What to do about a required family the reviewed workbook does not cover.
 *
 * Deliberately not the "complete the workbook" sentence: the workbook on file
 * has no question to complete for this family. A fresh download is built from
 * the current families, so it will.
 */
export function familyNotInReviewNextAction(
  phase: number,
  evidenceSlot: string,
): string {
  return (
    `The reviewed P${phase} to P${phase + 1} readiness workbook has no required question for ${evidenceSlot}. ` +
    `Download the current workbook, which is built from today's evidence families, and review its responses.`
  );
}

/**
 * What to do when the charter review predates the current required families.
 *
 * Named families, because the review on file looks finished and the reason it
 * does not count is invisible without them.
 */
export function charterReviewMissingFamiliesNextAction(
  evidenceSlots: readonly string[],
): string {
  const named = evidenceSlots.join(", ");
  return (
    `The reviewed P1 to P2 workbook has no required question for ${named}. ` +
    `Download the current workbook and review its responses before closing the Charter phase.`
  );
}
