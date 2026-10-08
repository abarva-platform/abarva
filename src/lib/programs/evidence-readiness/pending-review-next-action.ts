/**
 * Why this module exists
 * ----------------------
 * `loadDiscoveryEvidenceReadiness` grades a Move's evidence against the
 * approved rows only (`program_evidence_reviews.decision = 'approved'`), and
 * `DiscoveryFamilyCoverage.status` is binary — `covered | missing`. So an
 * evidence family in which EVERYTHING has been provided and is sitting in the
 * reviewer's queue is indistinguishable, downstream, from one in which nothing
 * was ever provided: both report `status: "missing"` and both carry the
 * authored `nextAction`, which is a sentence of the form *"Upload a … from …"*.
 *
 * That sentence reaches the live aVa prompt (`formatMoveEvidenceNeedForAva`
 * emits `Next: <nextAction>`), the phase-gate approval route, the phase
 * deliverable generator and `PhaseDocumentsPanel`. The consequence is a
 * product lie with a human cost: the moment an evidence package is loaded for
 * review, the assistant asks the reviewer to go and upload the very documents
 * that are already waiting in their own review queue.
 *
 * What this module changes, and what it must NOT change
 * -----------------------------------------------------
 * It rewrites `nextAction` ALONE. Pending evidence is not approved evidence, so
 * everything the gate layer reads stays byte-identical: `status` remains
 * `missing`, `priority` remains `required`, and `canDraftBoundary`,
 * `preliminaryGenerationCaveat` and `waiverOption` are untouched. A family with
 * pending rows must never read as covered — the point is to name the correct
 * next action (record a review decision), not to relax a gate.
 *
 * A family that is already `covered` keeps its authored wording: approved
 * evidence exists, so nothing is blocked on the reviewer, and extra pending
 * rows are not the next action.
 */

/** A family with evidence loaded and awaiting a human review decision. */
export interface FamilyAwaitingReview {
  familyId: string;
  /** How many `decision = 'pending'` review rows name this family. */
  pendingCount: number;
}

/**
 * The review queue is rendered by `FileCabinetPanel` on the Moves **Files &
 * Evidence** tab, which `MovesPhaseStandaloneClient` reaches through
 * `surfaceTabRow` on every view. Name that surface, because a next action the
 * reader has no control for is the defect this module exists to remove.
 */
const REVIEW_SURFACE = "the Files & Evidence tab";

/**
 * How many pending review rows name `familyId`, or 0 when none do.
 *
 * Tolerates a missing/undefined list so a readiness object built before this
 * field existed reads as "nothing pending" rather than throwing.
 */
export function pendingReviewCountForFamily(
  familyId: string,
  familiesAwaitingReview: readonly FamilyAwaitingReview[] | null | undefined,
): number {
  if (!Array.isArray(familiesAwaitingReview)) return 0;
  let total = 0;
  for (const entry of familiesAwaitingReview) {
    if (!entry || entry.familyId !== familyId) continue;
    const count = Number(entry.pendingCount);
    // A row whose count is unusable still proves the family has SOMETHING
    // pending, so it counts as one rather than being dropped.
    total += Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  }
  return total;
}

/** The sentence presented in place of an upload request. */
export function awaitingReviewNextActionSentence(pendingCount: number): string {
  const items = pendingCount === 1 ? "1 item" : `${pendingCount} items`;
  const verb = pendingCount === 1 ? "is" : "are";
  return (
    `${items} for this evidence slot ${verb} loaded and awaiting your review on ` +
    `${REVIEW_SURFACE} — approve or reject ${pendingCount === 1 ? "it" : "them"} there. ` +
    `This slot stays uncovered until a review decision is recorded, so upload more only ` +
    `if the loaded evidence turns out to be insufficient.`
  );
}

/**
 * The next action to present for one evidence family.
 *
 * Returns the authored sentence unchanged unless the family is uncovered AND
 * has at least one pending review row — the only state in which "upload" is
 * the wrong instruction.
 */
export function resolvePendingAwareNextAction(args: {
  familyId: string;
  /** `DiscoveryFamilyCoverage.status` for this family. */
  familyStatus: "covered" | "missing";
  /** The authored `nextAction` this family would otherwise present. */
  authoredNextAction: string;
  familiesAwaitingReview?: readonly FamilyAwaitingReview[] | null;
}): string {
  if (args.familyStatus === "covered") return args.authoredNextAction;
  const pending = pendingReviewCountForFamily(
    args.familyId,
    args.familiesAwaitingReview,
  );
  if (pending < 1) return args.authoredNextAction;
  return awaitingReviewNextActionSentence(pending);
}
