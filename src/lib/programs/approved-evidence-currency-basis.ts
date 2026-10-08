// Could the approved-evidence basis a currency check needs be READ at all?
//
// `deliverable-approval-currency.ts` states the rule this module extends: only
// an evaluable check may veto a recorded human approval. It applied that rule to
// ONE source of unevaluability — a deliverable key the registry does not carry,
// which resolves to no phase. The other input to the same comparison is the
// Move's approved-evidence snapshot, and `loadApprovedMoveEvidenceSnapshot`
// answers `null` for FIVE distinct reasons that are all "I cannot tell":
//
//   * either review query returned an error, or a non-array body;
//   * more than `MAX_APPROVED_EVIDENCE_ROWS` approved reviews;
//   * more than `MAX_REVIEW_ACTIVITY_ROWS` review rows;
//   * the evidence-item query returned an error;
//   * an approved review whose `program_evidence_items` row the tenant-scoped
//     read did not return (the strict `rows.length !== new Set(...).size` check).
//
// A Move with no approved evidence at all does NOT come back null — that case
// returns a real snapshot with `approvedEvidenceCount: 0`. So `null` means
// exactly "unevaluable", never "nothing approved".
//
// In `evaluateGate`'s `isSignedOff` both currency legs are written
// `Boolean(currentEvidenceSnapshot && …)`, so a null snapshot sent BOTH legs
// false and the veto `if (linkedArtifactId && !linkedArtifactCurrent) return
// false` fired. Every deliverable carrying an `approved_artifact_id` then read
// as not-signed-off, the whole gate ladder held, and nothing anywhere said why —
// while the sibling check two lines up deliberately PASSES an unevaluable scope
// and reports it. Same veto line, same function, opposite verdict for the same
// class of fact.
//
// A sixth cause sits one level up and is not the loader's: `governance.ts` skips
// the load entirely when `ctx.clientKey` is falsy, which `TenancyCtx` permits
// (`clientKey?: string`) and `assertTenancy` does not require. That one is
// reported apart as `tenant_scope_unresolved`, because with no tenant key the
// `move_artifacts` lookup never ran either — so the linked artifact's INTEGRITY
// is unevaluable too, not failed. For the other reasons the lookup did run, so
// integrity still vetoes and only the evidence comparison is skipped. That
// distinction is what `tenantScopeResolved` carries, declared on the result
// rather than re-derived from the reason string at the call site.

import type { ApprovedMoveEvidenceSnapshot } from "@/lib/programs/approved-move-evidence-snapshot";

export type ApprovedEvidenceCurrencyBasisReason =
  /** No tenant key, so neither the snapshot nor the artifact lookup was issued. */
  | "tenant_scope_unresolved"
  /** The loader threw rather than returning. */
  | "snapshot_load_failed"
  /** The loader returned `null`: one of its five unevaluable paths. */
  | "snapshot_unavailable";

export type ApprovedEvidenceCurrencyBasis =
  | {
      evaluable: true;
      tenantScopeResolved: true;
      snapshot: ApprovedMoveEvidenceSnapshot;
    }
  | {
      evaluable: false;
      /**
       * Whether the tenant-scoped reads were issued at all. False only for
       * `tenant_scope_unresolved`; when true, a linked-artifact integrity check
       * is still meaningful and must keep its veto.
       */
      tenantScopeResolved: boolean;
      reason: ApprovedEvidenceCurrencyBasisReason;
    };

export type ApprovedEvidenceCurrencyBasisInput = {
  tenantKey: string | null | undefined;
  moveId: string;
  /** The snapshot loader. Injected by the suite; product callers pass theirs. */
  load: (args: {
    tenantKey: string;
    moveId: string;
  }) => Promise<ApprovedMoveEvidenceSnapshot | null>;
};

/**
 * Resolve the approved-evidence basis a currency check would compare against,
 * or say why no such comparison can run for this Move.
 */
export async function resolveApprovedEvidenceCurrencyBasis(
  input: ApprovedEvidenceCurrencyBasisInput,
): Promise<ApprovedEvidenceCurrencyBasis> {
  const tenantKey = input.tenantKey?.trim();
  if (!tenantKey || !input.moveId) {
    return {
      evaluable: false,
      tenantScopeResolved: false,
      reason: "tenant_scope_unresolved",
    };
  }
  let snapshot: ApprovedMoveEvidenceSnapshot | null;
  try {
    snapshot = await input.load({ tenantKey, moveId: input.moveId });
  } catch {
    // A throw and a `null` are the same fact to the caller — nothing to compare
    // against — but they are different operational events, so they are named
    // apart rather than folded into one reason.
    return {
      evaluable: false,
      tenantScopeResolved: true,
      reason: "snapshot_load_failed",
    };
  }
  if (!snapshot) {
    return {
      evaluable: false,
      tenantScopeResolved: true,
      reason: "snapshot_unavailable",
    };
  }
  return { evaluable: true, tenantScopeResolved: true, snapshot };
}

/**
 * Why a recorded sign-off was accepted without an evidence-currency check.
 * Written for an operator reading a gate decision: it says what was and was not
 * verified, and never claims the approval was confirmed current.
 */
export function describeUnevaluableApprovedEvidenceBasis(
  reason: ApprovedEvidenceCurrencyBasisReason,
): string {
  const because =
    reason === "tenant_scope_unresolved"
      ? "the gate ran with no tenant key, so neither the approved-evidence snapshot nor the " +
        "linked-artifact lookup was issued"
      : reason === "snapshot_load_failed"
        ? "loading the Move's approved-evidence snapshot threw"
        : "the Move's approved-evidence snapshot could not be built (a query error, a row cap " +
          "exceeded, or an approved review whose evidence item the tenant-scoped read did not " +
          "return)";
  return (
    `The recorded human sign-off stands, but its currency against approved evidence was not ` +
    `checked: ${because}. A Move with nothing approved does NOT reach here — that case yields a ` +
    `snapshot with zero rows — so treating this as a stale approval would refuse every gate that ` +
    `reads a signed-off deliverable, with no user action that could satisfy it.`
  );
}

const reported = new Set<string>();

/**
 * Report an unevaluable basis ONCE per Move per reason per process.
 *
 * Mirrors `reportUnevaluableApprovalCurrencyOnce`: the gate evaluator runs this
 * for every deliverable row on every gate evaluation, so logging per call would
 * bury the event it exists to surface.
 */
export function reportUnevaluableApprovedEvidenceBasisOnce(
  moveId: string,
  reason: ApprovedEvidenceCurrencyBasisReason,
  log: (message: string, detail: Record<string, unknown>) => void = (
    message,
    detail,
  ) => console.warn(message, detail),
): boolean {
  const seen = `${moveId}:${reason}`;
  if (reported.has(seen)) return false;
  reported.add(seen);
  log("[moves] approved-evidence currency basis not evaluable", {
    moveId,
    reason,
    detail: describeUnevaluableApprovedEvidenceBasis(reason),
  });
  return true;
}

/** Test-only: the dedupe set is process-wide, so a suite must be able to clear it. */
export function __resetUnevaluableApprovedEvidenceBasisReports(): void {
  reported.clear();
}
