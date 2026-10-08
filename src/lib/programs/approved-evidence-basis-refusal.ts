// When a currency check refuses, WHICH fact did it establish?
//
// Four Moves write paths compare a document's recorded approved-evidence
// revision against the Move's current one and refuse on mismatch: the
// deliverable sign-off route, the artifact client-approval route, and both
// Moves branches of the deliverable queue worker. Each refusal was written as a
// single `if` over three independent operands —
//
//   * the snapshot could not be read (`loadApprovedMoveEvidenceSnapshot`
//     answered `null`, or no tenant key was resolved, or the deliverable's
//     phase did not resolve, so no comparison was issued at all);
//   * the document recorded NO evidence revision, so there is nothing to
//     compare;
//   * a readable revision differs from the current one.
//
// — and answered all three with one `stale_*` code whose text asserts the third:
// that approved evidence CHANGED after the document was generated, and that the
// remedy is to rebuild. Only the third reading makes that assertion true.
//
// The first reading makes the prescription a closed loop. `blocked` and `failed`
// are both terminal in `deliverable_runs` (`sweepStaleDeliverableRuns` requeues
// neither) and `blockRunsWithFailedDependencies` cascades every queued
// descendant of the batch to `dependency_not_satisfied`, so one unreadable
// snapshot ends an entire Approve & Build batch — while telling the operator to
// re-run the build, which re-reads the same unreadable snapshot. For the
// structural causes (an approved-review or review-activity row cap exceeded, an
// approved review whose evidence item the tenant-scoped read did not return) no
// number of re-runs can change the answer.
//
// The second reading is genuinely rebuild-shaped: a document generated before
// its writer stamped a lineage carries no revision, and regenerating it stamps
// one. That one keeps its text.
//
// This module is the write-side counterpart of
// `approved-evidence-currency-basis.ts`, which applied the same rule to the READ
// side (`evaluateGate`'s `isSignedOff`), and of
// `deliverable-approval-currency.ts`, which states the rule itself: only an
// evaluable check may assert what it did not establish. It deliberately does NOT
// relax any refusal — all four paths need the snapshot to stamp the lineage they
// record, so none of them can proceed without it. It changes only what the
// refusal CLAIMS.
//
// The queue worker already distinguishes one of these causes by its own code
// (`moves_deliverable_phase_unresolved`, with text that says unscoped evidence
// was not sent rather than that evidence changed). This extends that existing
// treatment to the rest.

/** Why no comparison against approved evidence could be made at all. */
export type UnevaluableApprovedEvidenceBasisCause =
  /** No tenant key was resolved, so the tenant-scoped reads were never issued. */
  | "tenant_scope_unresolved"
  /** The snapshot loader answered `null` or threw: one of its unevaluable paths. */
  | "snapshot_unreadable"
  /** The deliverable's canonical phase did not resolve, so no phase basis exists. */
  | "deliverable_phase_unresolved";

export type ApprovedEvidenceBasisCondition =
  /** No comparison ran. Rebuilding cannot change the answer. */
  | "basis_unevaluable"
  /** The comparison ran; the document carries no revision to compare. */
  | "recorded_basis_absent"
  /** The comparison ran and the recorded revision is not the current one. */
  | "recorded_basis_superseded";

export interface ApprovedEvidenceBasisRefusal {
  condition: ApprovedEvidenceBasisCondition;
  /** Set only for `basis_unevaluable`. */
  cause: UnevaluableApprovedEvidenceBasisCause | null;
  /**
   * Whether regenerating the document can satisfy this refusal. False for
   * `basis_unevaluable`: the rebuild re-reads the same basis. A refusal that
   * prescribes an action it marks unsatisfiable is the defect this module exists
   * to prevent.
   */
  rebuildCanSatisfy: boolean;
}

/**
 * The refusal an unevaluable basis yields. Exported because a caller that must
 * narrow a nullable snapshot for later use keeps its own `!snapshot` disjunct in
 * the guard, and TypeScript cannot then infer that the classifier already
 * answered. Such a caller falls back to THIS value, which is the same one the
 * classifier builds, so the fallback cannot diverge from the classified answer.
 */
export function unevaluableApprovedEvidenceBasisRefusal(
  cause: UnevaluableApprovedEvidenceBasisCause = "snapshot_unreadable",
): ApprovedEvidenceBasisRefusal {
  return { condition: "basis_unevaluable", cause, rebuildCanSatisfy: false };
}

export function classifyApprovedEvidenceBasisRefusal(args: {
  /** False when no comparison was issued; `cause` then names why. */
  basisEvaluable: boolean;
  cause?: UnevaluableApprovedEvidenceBasisCause | null;
  /** The revision the document/run recorded when it was generated. */
  recordedRevision: string | null;
  /**
   * The result of `isApprovedMoveEvidenceBasisCurrent`. Read ONLY when the basis
   * is evaluable and a revision was recorded, because that predicate also
   * answers `false` for both of the other conditions and so cannot distinguish
   * them.
   */
  basisIsCurrent: boolean;
}): ApprovedEvidenceBasisRefusal | null {
  if (!args.basisEvaluable) {
    return unevaluableApprovedEvidenceBasisRefusal(
      args.cause ?? "snapshot_unreadable",
    );
  }
  if (!args.recordedRevision) {
    return {
      condition: "recorded_basis_absent",
      cause: null,
      rebuildCanSatisfy: true,
    };
  }
  if (!args.basisIsCurrent) {
    return {
      condition: "recorded_basis_superseded",
      cause: null,
      rebuildCanSatisfy: true,
    };
  }
  return null;
}

function describeCause(cause: UnevaluableApprovedEvidenceBasisCause): string {
  if (cause === "tenant_scope_unresolved") {
    return "no active tenant key was resolved, so the approved-evidence reads were never issued";
  }
  if (cause === "deliverable_phase_unresolved") {
    return "this deliverable's canonical Move phase did not resolve, so it has no phase evidence basis";
  }
  return (
    "the Move's approved-evidence snapshot could not be built — a query error, a row cap " +
    "exceeded, or an approved review whose evidence item the tenant-scoped read did not return"
  );
}

/**
 * Operator-readable text for a refusal. For an unevaluable basis it names the
 * operational fault and says plainly that regenerating will not help, so nobody
 * is sent around the approve-then-rebuild loop.
 */
export function describeApprovedEvidenceBasisRefusal(
  refusal: ApprovedEvidenceBasisRefusal,
  surface: "approval" | "build",
): string {
  if (refusal.condition === "basis_unevaluable") {
    const retry =
      surface === "approval"
        ? "Regenerating this document will not change the answer"
        : "Re-running this build will not change the answer";
    return (
      `Approved evidence was not verified as changed. The check could not run at all: ` +
      `${describeCause(refusal.cause ?? "snapshot_unreadable")}. ${retry} — the same basis is ` +
      `re-read. This is an operational fault to resolve, not a stale document.`
    );
  }
  if (refusal.condition === "recorded_basis_absent") {
    return surface === "approval"
      ? "This version records no approved-evidence revision, so its basis cannot be verified. " +
          "Rebuild it from the current evidence set before approval."
      : "This build records no approved-evidence revision, so its basis cannot be verified. " +
          "Re-run the build from the current evidence set.";
  }
  return surface === "approval"
    ? "Approved evidence changed after this document was generated. Rebuild it from the current " +
        "evidence set before approval."
    : "Approved Move evidence changed after this build was queued. Re-run the build from the " +
        "current evidence set.";
}

/** Stable machine code for the refusal, distinct per condition. */
export function approvedEvidenceBasisRefusalCode(
  refusal: ApprovedEvidenceBasisRefusal,
): string {
  if (refusal.condition === "basis_unevaluable") {
    return "approved_evidence_basis_unevaluable";
  }
  if (refusal.condition === "recorded_basis_absent") {
    return "approved_evidence_basis_not_recorded";
  }
  return "stale_approved_evidence_snapshot";
}
