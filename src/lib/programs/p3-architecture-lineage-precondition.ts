// Before either interactive approval path can check a P3 architecture document's
// recorded lineage, it needs two facts: the Move's approved solution option, and
// the Move's current P3 Context Extract. Both routes read them and then refused
// with ONE sentence over the whole set:
//
//   if (!approved || !freshness?.evidenceFingerprint)                  // sign-off
//   if (!approved || !freshness?.evidenceFingerprint ||
//       freshness.freshnessStatus !== "fresh")                         // client-approval
//
//   detail: "The current approved option or P3 context snapshot is unavailable."
//           (+ " Rebuild the architecture chain before approval." on client-approval)
//
// The operands are independent facts with different remedies, and `detail` is the
// one field both clients render (`DeliverableApprovalAction.tsx` and
// `FileCabinetPanel.tsx` each read `body.detail` and fall back to `error`), so the
// collapse is what the reader sees:
//
//   * No approved P3 solution option. The commonest reading, and the one with a
//     real in-app control: approve a solution option. Regenerating the options
//     document un-signs it (`completeDeliverable(..., { signOff: false })` writes
//     `draft`, and `loadApprovedSolutionApproach` requires `signed_off`), so a
//     Move that HAD an approved option returns to this state by an ordinary
//     action. `/api/v1/deliverables/generate-phase` already names this fact
//     exactly — "Select and approve a P3 solution option before building..." —
//     so the same fact was named on the build path and unnamed on both approval
//     paths. "Rebuild the architecture chain" cannot clear it: a rebuild of the
//     architecture documents does not approve an option.
//   * No current P3 Context Extract, or one whose currency could not be
//     established. `move-context-freshness-refusal.ts` already separates these
//     for the queue worker, including the one that must NOT prescribe a rebuild
//     (`basis_unevaluable` — the rebuild re-reads the same unreadable basis).
//     That classifier is reused here for the condition; only the operator-facing
//     register changes, because the reader is approving a document rather than
//     watching a batch.
//   * No tenant scope. Neither read was issued, so nothing was compared. Not a
//     report that the lineage is stale, and no rebuild clears it.
//
// NO refusal is relaxed or added. `staleRefuses` carries each caller's own
// condition, so the set of inputs that refuses is byte-for-byte what it was:
// the sign-off path requires only that an extract exist, the client-approval path
// additionally requires `freshnessStatus === "fresh"`. Only what the refusal
// CLAIMS changes, plus whether it prescribes an action its own cause rules out.

import type { ApprovedEvidenceCurrencyBasisReason } from "@/lib/programs/approved-evidence-currency-basis";
import {
  classifyMoveContextFreshnessRefusal,
  describeUnevaluableApprovedEvidenceBasis,
  type MoveContextFreshnessForRefusal,
} from "@/lib/programs/move-context-freshness-refusal";

export type P3ArchitectureLineagePreconditionCondition =
  /** No tenant key, so neither the option nor the extract was read. */
  | "tenant_scope_unresolved"
  /** No signed-off solution-options document, so there is no approved basis. */
  | "approved_option_absent"
  /** No current P3 Context Extract row, so there is nothing to compare. */
  | "context_extract_absent"
  /** The approved-evidence basis could not be read. No comparison ran. */
  | "context_basis_unevaluable"
  /** The comparison ran; the extract carries no revision to compare. */
  | "context_recorded_basis_absent"
  /** The extract is marked as needing a rebuild, with a readable basis. */
  | "context_extract_rebuild_required"
  /** The comparison ran and the extract's recorded revision is not current. */
  | "context_superseded";

export interface P3ArchitectureLineagePreconditionRefusal {
  condition: P3ArchitectureLineagePreconditionCondition;
  /** Set only for `context_basis_unevaluable`; names which read failed. */
  reason: ApprovedEvidenceCurrencyBasisReason | null;
  /**
   * Whether rebuilding the architecture chain can satisfy this refusal. False
   * for the three causes a rebuild re-encounters unchanged: an unreadable
   * approved-evidence basis, an absent approved option, and an unresolved
   * tenant scope (which issued neither read). A refusal that
   * prescribes an action it has already determined cannot succeed is the defect
   * this module exists to prevent.
   */
  rebuildCanSatisfy: boolean;
  /** The field both clients render. States the fact, then the action. */
  detail: string;
}

export function classifyP3ArchitectureLineagePrecondition(args: {
  /** `ctx.clientKey` — absent means neither read was issued. */
  clientKey: string | null | undefined;
  /** Whether `loadApprovedSolutionApproach` returned an approved option. */
  approvedOptionPresent: boolean;
  freshness: MoveContextFreshnessForRefusal | null;
  /**
   * True for callers whose own condition also refuses a non-`fresh` extract.
   * False for callers that require only that an extract exist.
   */
  staleRefuses: boolean;
}): P3ArchitectureLineagePreconditionRefusal | null {
  if (!args.clientKey) {
    return {
      condition: "tenant_scope_unresolved",
      reason: null,
      rebuildCanSatisfy: false,
      detail:
        "The active tenant scope could not be resolved for this request, so neither the approved " +
        "solution option nor the P3 Context Extract was read. Nothing was compared, so this is not " +
        "a report that this document's lineage is stale, and rebuilding it cannot clear this. " +
        "Sign in again and retry; if the refusal repeats, the tenant scope has to be resolved first.",
    };
  }
  if (!args.approvedOptionPresent) {
    return {
      condition: "approved_option_absent",
      reason: null,
      rebuildCanSatisfy: false,
      detail:
        "This Move has no approved P3 solution option, so there is no approved basis to check this " +
        "document's lineage against. Rebuilding the architecture documents cannot create one. " +
        "Select and approve a P3 solution option — record the decision rationale and the accepted " +
        "tradeoffs — then approve this document again.",
    };
  }
  // Both callers' original conditions read `!freshness?.evidenceFingerprint`, and
  // `parseMoveContextExtractFreshness` never yields an empty fingerprint, so an
  // empty one is the same refusal as an absent extract rather than a condition of
  // its own.
  const freshness =
    args.freshness && args.freshness.evidenceFingerprint
      ? args.freshness
      : null;
  if (freshness && !args.staleRefuses) {
    // This caller requires only that an extract exist. Its currency is checked
    // by the lineage comparison that follows, not here.
    return null;
  }
  // No queued payload exists on an interactive approval, so there is no expected
  // fingerprint to disagree with; passing the extract's own makes the classifier's
  // `fingerprint_mismatch` leg unreachable from here rather than merely unused.
  const refusal = classifyMoveContextFreshnessRefusal({
    freshness,
    expectedFingerprint: freshness?.evidenceFingerprint ?? "",
  });
  if (!refusal) return null;
  switch (refusal.condition) {
    case "extract_absent":
      return {
        condition: "context_extract_absent",
        reason: null,
        rebuildCanSatisfy: true,
        detail:
          "No current P3 Context Extract was found for this Move, so there is no context snapshot " +
          "to check this document's lineage against. Refresh the Context Extract, rebuild this " +
          "document from it, then approve the version that rebuild produces.",
      };
    case "basis_unevaluable":
      return {
        condition: "context_basis_unevaluable",
        reason: refusal.reason,
        rebuildCanSatisfy: false,
        detail:
          "Whether this Move's P3 Context Extract is still current could not be determined: " +
          `${describeUnevaluableApprovedEvidenceBasis(refusal.reason)}. No comparison was made, so ` +
          "this is not a report that the evidence changed. Refreshing the Context Extract and " +
          "rebuilding re-reads the same basis and reaches the same result, so it cannot clear this; " +
          "the approved-evidence read itself has to be resolved first.",
      };
    case "recorded_basis_absent":
      return {
        condition: "context_recorded_basis_absent",
        reason: null,
        rebuildCanSatisfy: true,
        detail:
          "This Move's P3 Context Extract records no approved-evidence revision, so there is " +
          "nothing to compare against the current one. Refresh the Context Extract — the refreshed " +
          "extract records a revision — rebuild this document, then approve it.",
      };
    case "extract_marked_rebuild_required":
      return {
        condition: "context_extract_rebuild_required",
        reason: null,
        rebuildCanSatisfy: true,
        detail:
          "This Move's P3 Context Extract is recorded as needing a rebuild. Refresh the Context " +
          "Extract, rebuild this document from the refreshed extract, then approve it.",
      };
    // `fingerprint_mismatch` cannot be reached from an interactive approval — the
    // expected fingerprint IS the extract's own — but it is a refusal about the
    // same fact, so it is answered rather than left to fall through.
    case "context_superseded":
    case "fingerprint_mismatch":
    default:
      return {
        condition: "context_superseded",
        reason: null,
        rebuildCanSatisfy: true,
        detail:
          "Move evidence changed after this document was built, so its P3 Context Extract is no " +
          "longer current. Refresh the Context Extract, rebuild this document from the approved " +
          "evidence snapshot, then approve the version that rebuild produces.",
      };
  }
}
