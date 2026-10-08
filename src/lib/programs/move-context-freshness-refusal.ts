// When the P3 architecture batch refuses on context freshness, WHICH fact did it
// establish?
//
// `approved-evidence-basis-refusal.ts` states this rule for the four Moves write
// paths that compare a DOCUMENT's recorded approved-evidence revision against the
// Move's current one. A fifth path makes the same comparison about the P3 CONTEXT
// EXTRACT, and it was written as a single `if` over four independent operands:
//
//   if (!freshness ||
//       freshness.freshnessStatus !== "fresh" ||
//       freshness.evidenceFingerprint !== payload.decisionLineage.contextSnapshotHash)
//
// — answered with one `stale_context_snapshot` code whose text asserts the last
// reading: "Move evidence changed after this architecture batch was queued.
// Refresh the Context Extract and rebuild from the approved evidence snapshot."
//
// Only some of the operands make that assertion true.
//
//   * No current extract row parsed at all. Nothing changed; there is nothing to
//     compare. "Refresh the Context Extract" is the right remedy, and it is the
//     only one of the four the existing text gets right by accident.
//   * The approved-evidence basis could not be READ — `loadApprovedMoveEvidenceSnapshot`
//     answered `null` or threw, or no tenant key resolved. The freshness loader
//     folded this into `freshnessStatus: "rebuild_required"`, the same value it
//     uses for "the extract recorded no revision", so the two arrived here
//     indistinguishable. A Move with nothing approved does NOT reach it — that
//     case yields a snapshot with zero rows (see
//     `approved-evidence-currency-basis.ts`) — so the null genuinely means "I
//     cannot tell". Three of the loader's unevaluable causes are structural (a
//     row cap exceeded, an approved review whose evidence item the tenant-scoped
//     read did not return), so refreshing the extract and rebuilding re-reads the
//     same unreadable basis and lands on the same refusal. `blocked` is terminal
//     in `deliverable_runs` — `sweepStaleDeliverableRuns` requeues neither
//     `blocked` nor `failed` — and `blockRunsWithFailedDependencies` cascades
//     every queued descendant to `dependency_not_satisfied`, so one unreadable
//     read ends the whole architecture batch while prescribing the action that
//     cannot end it.
//   * The extract recorded NO evidence revision. The comparison ran and found
//     nothing to compare; regenerating the extract stamps one. Genuinely
//     rebuild-shaped, and it keeps that text.
//   * A readable revision differs from the current one, or the queued batch names
//     a different extract than the current row. Evidence (or the extract) really
//     did move on. This is the only reading the original text stated correctly.
//
// As with the write-side module, NO refusal is relaxed here: the batch needs a
// fresh, matching extract to generate against and cannot proceed without one.
// Only what the refusal CLAIMS changes, plus whether it tells the operator to
// perform an action this code has already determined cannot succeed.

import type { ApprovedEvidenceCurrencyBasisReason } from "@/lib/programs/approved-evidence-currency-basis";

export type MoveContextFreshnessRefusalCondition =
  /** No current context extract parsed, so there is nothing to compare. */
  | "extract_absent"
  /** The approved-evidence basis could not be read. No comparison ran. */
  | "basis_unevaluable"
  /** The comparison ran; the extract carries no revision to compare. */
  | "recorded_basis_absent"
  /** The stored extract is marked as needing a rebuild, with a readable basis. */
  | "extract_marked_rebuild_required"
  /** The comparison ran and the extract's recorded revision is not current. */
  | "context_superseded"
  /** The extract is current, but the queued batch names a different one. */
  | "fingerprint_mismatch";

export interface MoveContextFreshnessRefusal {
  condition: MoveContextFreshnessRefusalCondition;
  /** Set only for `basis_unevaluable`; names which read could not be made. */
  reason: ApprovedEvidenceCurrencyBasisReason | null;
  /**
   * Whether refreshing the extract and rebuilding can satisfy this refusal.
   * False for `basis_unevaluable`: the rebuild re-reads the same basis. A refusal
   * that prescribes an action it has already marked unsatisfiable is the defect
   * this module exists to prevent.
   */
  rebuildCanSatisfy: boolean;
  /** The `error` value the blocked run records. */
  error: string;
  /** Operator-facing text. States the established fact and nothing more. */
  blocker: string;
}

/** The freshness shape this classifier reads. Structural, so the loader's own
 * richer result satisfies it without a cast. */
export interface MoveContextFreshnessForRefusal {
  freshnessStatus: "fresh" | "stale" | "rebuild_required";
  approvedEvidenceRevision: string | null;
  evidenceFingerprint: string;
  /** Set by the loader when the approved-evidence basis could not be read. */
  basisUnevaluableReason?: ApprovedEvidenceCurrencyBasisReason | null;
}

const UNEVALUABLE_BECAUSE: Readonly<
  Record<ApprovedEvidenceCurrencyBasisReason, string>
> = {
  tenant_scope_unresolved:
    "the freshness check ran with no tenant key, so the approved-evidence snapshot was never read",
  snapshot_load_failed:
    "loading the Move's approved-evidence snapshot threw",
  snapshot_unavailable:
    "the Move's approved-evidence snapshot could not be built (a query error, a row cap exceeded, " +
    "or an approved review whose evidence item the tenant-scoped read did not return)",
};

/**
 * Classify the P3 architecture batch's context-freshness refusal, or return
 * `null` when the extract is current AND matches the queued batch.
 *
 * The basis reason is read BEFORE `freshnessStatus`, because the loader expresses
 * an unevaluable basis as `rebuild_required` — the same value it uses for a
 * missing recorded revision — so the status alone cannot separate them.
 */
export function classifyMoveContextFreshnessRefusal(args: {
  freshness: MoveContextFreshnessForRefusal | null;
  /** `decisionLineage.contextSnapshotHash` from the queued payload. */
  expectedFingerprint: string;
}): MoveContextFreshnessRefusal | null {
  const { freshness } = args;
  if (!freshness) {
    return {
      condition: "extract_absent",
      reason: null,
      rebuildCanSatisfy: true,
      error: "context_extract_absent",
      blocker:
        "No current P3 Context Extract was found for this Move, so this architecture batch has " +
        "nothing to generate against. Refresh the Context Extract and rebuild.",
    };
  }
  const unevaluable = freshness.basisUnevaluableReason;
  if (unevaluable) {
    return {
      condition: "basis_unevaluable",
      reason: unevaluable,
      rebuildCanSatisfy: false,
      error: "context_extract_basis_unevaluable",
      blocker:
        "Whether this Move's P3 Context Extract is still current could not be determined: " +
        `${UNEVALUABLE_BECAUSE[unevaluable]}. No comparison was made, so this is not a report ` +
        "that evidence changed. Rebuilding re-reads the same basis and reaches the same result, " +
        "so it cannot clear this block; the approved-evidence read itself has to be resolved first.",
    };
  }
  if (freshness.freshnessStatus === "rebuild_required") {
    if (!freshness.approvedEvidenceRevision) {
      return {
        condition: "recorded_basis_absent",
        reason: null,
        rebuildCanSatisfy: true,
        error: "context_extract_basis_absent",
        blocker:
          "This Move's P3 Context Extract records no approved-evidence revision, so there is " +
          "nothing to compare against the current one. Refresh the Context Extract — the refreshed " +
          "extract records a revision — and rebuild.",
      };
    }
    return {
      condition: "extract_marked_rebuild_required",
      reason: null,
      rebuildCanSatisfy: true,
      error: "context_extract_rebuild_required",
      blocker:
        "This Move's P3 Context Extract is recorded as needing a rebuild. Refresh the Context " +
        "Extract and rebuild this architecture batch from the refreshed extract.",
    };
  }
  // Anything that is not literally `fresh` refuses, which is what the single `if`
  // this replaces did (`freshnessStatus !== "fresh"`). Narrowing this to `=== "stale"`
  // would let an unrecognised status fall through to the fingerprint check and PASS,
  // so a batch could generate against an extract nothing had certified.
  if (freshness.freshnessStatus !== "fresh") {
    return {
      condition: "context_superseded",
      reason: null,
      rebuildCanSatisfy: true,
      error: "stale_context_snapshot",
      blocker:
        "Move evidence changed after this architecture batch was queued. Refresh the Context " +
        "Extract and rebuild from the approved evidence snapshot.",
    };
  }
  if (freshness.evidenceFingerprint !== args.expectedFingerprint) {
    return {
      condition: "fingerprint_mismatch",
      reason: null,
      rebuildCanSatisfy: true,
      error: "stale_context_snapshot",
      blocker:
        "This architecture batch was queued against a different P3 Context Extract than the " +
        "current one. Rebuild it from the current extract.",
    };
  }
  return null;
}
