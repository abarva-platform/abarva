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
 *
 * The third decision value, and why it needs its own sentence
 * -----------------------------------------------------------
 * `program_evidence_reviews.decision` admits exactly three values
 * (`pending | approved | rejected`, the table's CHECK constraint). Coverage
 * grades on `approved`; the wording above reacts to `pending`. `rejected` was
 * read by NOTHING: it leaves the pending queue, never enters the approved
 * list, and the `decideEvidenceReview` update is itself filtered
 * `decision = 'pending'`, so a rejected review can never be re-decided by any
 * control in the product.
 *
 * The consequence is that rejecting an extraction silently restores the
 * authored *"Upload a … from …"* sentence — the exact instruction this module
 * exists to remove — for a family whose source file is already uploaded and
 * sitting in the cabinet. Re-uploading the same file produces a second pending
 * row carrying the same extraction the reviewer just rejected. So a rejected
 * family gets its own sentence, naming the state and asking for a CORRECTED or
 * DIFFERENT source, which is an action the surface actually offers.
 *
 * Pending outranks rejected: while anything is still in the queue there is a
 * decision to record, and that is the nearer action. And as with pending,
 * nothing gate-bearing reads any of this — a rejected family stays `missing`.
 */

/** A family with evidence loaded and awaiting a human review decision. */
export interface FamilyAwaitingReview {
  familyId: string;
  /** How many `decision = 'pending'` review rows name this family. */
  pendingCount: number;
}

/** A family whose provided evidence was rejected in review. */
export interface FamilyWithRejectedEvidence {
  familyId: string;
  /** How many `decision = 'rejected'` review rows name this family. */
  rejectedCount: number;
}

/** One `GROUP BY family_key, decision` row from the review backlog read. */
export interface FamilyReviewDecisionRow {
  family_key?: string | null;
  decision?: string | null;
  decision_count?: number | string | null;
}

/** Both backlog lists a readiness object carries, derived from one read. */
export interface FamilyReviewBacklog {
  familiesAwaitingReview: FamilyAwaitingReview[];
  familiesWithRejectedEvidence: FamilyWithRejectedEvidence[];
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
 * How many rejected review rows name `familyId`, or 0 when none do.
 *
 * Same tolerance as the pending count: a row with an unusable count still
 * proves the family has something rejected, and a missing list reads as none.
 */
export function rejectedReviewCountForFamily(
  familyId: string,
  familiesWithRejectedEvidence:
    | readonly FamilyWithRejectedEvidence[]
    | null
    | undefined,
): number {
  if (!Array.isArray(familiesWithRejectedEvidence)) return 0;
  let total = 0;
  for (const entry of familiesWithRejectedEvidence) {
    if (!entry || entry.familyId !== familyId) continue;
    const count = Number(entry.rejectedCount);
    total += Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  }
  return total;
}

/**
 * The sentence presented when every source provided for a family was rejected.
 *
 * It must NOT prescribe re-reviewing the rejected row: the only write path
 * (`decideEvidenceReview`) is filtered `decision = 'pending'`, so no control
 * can re-decide it. The action it asks for — upload a corrected or different
 * source — is one the Files & Evidence tab offers.
 */
export function rejectedEvidenceNextActionSentence(
  rejectedCount: number,
): string {
  const items = rejectedCount === 1 ? "1 item" : `${rejectedCount} items`;
  const verb = rejectedCount === 1 ? "was" : "were";
  return (
    `${items} provided for this evidence slot ${verb} rejected in review, so ` +
    `nothing from ${rejectedCount === 1 ? "it" : "them"} counts as evidence. A ` +
    `recorded rejection cannot be re-decided, and re-uploading the same file ` +
    `would carry the same rejected content — upload a CORRECTED or DIFFERENT ` +
    `source on ${REVIEW_SURFACE}.`
  );
}

/**
 * The next action to present for one evidence family.
 *
 * Returns the authored sentence unchanged unless the family is uncovered AND
 * has at least one pending or rejected review row — the only states in which a
 * bare "upload" is the wrong instruction. Pending outranks rejected, because a
 * decision still waiting in the queue is the nearer action.
 */
export function resolvePendingAwareNextAction(args: {
  familyId: string;
  /** `DiscoveryFamilyCoverage.status` for this family. */
  familyStatus: "covered" | "missing";
  /** The authored `nextAction` this family would otherwise present. */
  authoredNextAction: string;
  familiesAwaitingReview?: readonly FamilyAwaitingReview[] | null;
  familiesWithRejectedEvidence?: readonly FamilyWithRejectedEvidence[] | null;
}): string {
  if (args.familyStatus === "covered") return args.authoredNextAction;
  const pending = pendingReviewCountForFamily(
    args.familyId,
    args.familiesAwaitingReview,
  );
  if (pending > 0) return awaitingReviewNextActionSentence(pending);
  const rejected = rejectedReviewCountForFamily(
    args.familyId,
    args.familiesWithRejectedEvidence,
  );
  if (rejected > 0) return rejectedEvidenceNextActionSentence(rejected);
  return args.authoredNextAction;
}

/**
 * Split one `GROUP BY family_key, decision` read into the two backlog lists.
 *
 * The producer reads pending and rejected in a single query, so the shape of
 * that read is declared here with the consumers of its output rather than
 * being re-derived inline at the call site. Any decision value other than
 * `pending`/`rejected` is ignored: `approved` is what coverage already grades
 * on, and a value outside the CHECK constraint belongs to neither list.
 */
export function familyReviewBacklogFromDecisionRows(
  rows: readonly FamilyReviewDecisionRow[] | null | undefined,
): FamilyReviewBacklog {
  const backlog: FamilyReviewBacklog = {
    familiesAwaitingReview: [],
    familiesWithRejectedEvidence: [],
  };
  if (!Array.isArray(rows)) return backlog;
  for (const row of rows) {
    if (!row) continue;
    const familyId =
      typeof row.family_key === "string" ? row.family_key.trim() : "";
    if (!familyId) continue;
    const parsed = Number(row.decision_count);
    const count =
      Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
    if (row.decision === "pending") {
      backlog.familiesAwaitingReview.push({ familyId, pendingCount: count });
    } else if (row.decision === "rejected") {
      backlog.familiesWithRejectedEvidence.push({
        familyId,
        rejectedCount: count,
      });
    }
  }
  return backlog;
}
