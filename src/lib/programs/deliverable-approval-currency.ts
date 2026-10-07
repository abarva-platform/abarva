// Can a signed-off deliverable's approval lineage be checked for currency AT ALL?
//
// `evaluateGate`'s `isSignedOff` does two separate things to a row the product
// recorded as `signed_off`: it reads the human approval, and it then checks that
// the approval still stands against the Move's current approved-evidence
// snapshot. The second check is phase-scoped — `isApprovedMoveEvidenceBasisCurrent`
// takes a phase and compares the row's recorded revision with that phase's
// revision in the snapshot.
//
// The phase came from `DELIVERABLE_REGISTRY`, and a key the registry does not
// carry resolved to `undefined`. The guards then read
// `deliverablePhase && isApprovedMoveEvidenceBasisCurrent(...)` — false — and the
// veto `if (linkedArtifactId && !linkedArtifactCurrent) return false` fired. So
// "I cannot tell whether this approval is still current" was recorded as "this
// approval is stale", which is a different fact and, for an unregistered key, a
// permanent one: no product action can ever make it true.
//
// That was a dead end on the FIRST gate. P0 -> P1 has three HARD criteria
// (`program_seed_recorded`, `value_hypothesis_seed`, and `sponsor_assigned`'s P0
// arm) and all three read one row — the `origination_brief`, which the registry
// does not carry and which has no alternative producer. The deliverable sign-off
// route accepts that key (it is in `ALLOWED_PROGRAM_DELIVERABLE_TYPES`) and its
// file-upload approval path sets `approved_artifact_id`; `signOffDeliverable` only
// acts on a `draft`/`in_review` row, so the P0 close helper cannot re-sign it
// afterwards to clear the link. A Move whose brief was approved that way — the
// very thing the blocked-gate message tells the user to do — reported all three
// hard criteria failed with the brief sitting there signed off.
//
// The rule this module states: currency is EVALUABLE or it is not, and only an
// evaluable check may veto a recorded human approval. Returning the reason rather
// than a bare `null` is deliberate — an unevaluable scope is a registry gap worth
// naming, not a silent allowance, and `phase_outside_evidence_basis_range` keeps
// the second reason from hiding inside the first if a future registration lands a
// deliverable at a phase the snapshot does not model.

import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";

/**
 * The phase range `isApprovedMoveEvidenceBasisCurrent` can answer for. Outside
 * it that function returns `false` for every input, so a comparison against a
 * phase outside the range carries no information either way.
 *
 * Mirrored from `approved-move-evidence-snapshot.ts`'s own `phase < 1 || phase > 5`
 * guard. The suite does not restate these numbers — it calls that function at the
 * edges and asserts this constant agrees with what it actually does, so a change
 * there fails here instead of quietly widening a veto.
 */
export const DELIVERABLE_APPROVAL_CURRENCY_PHASES = {
  min: 1,
  max: 5,
} as const;

export type DeliverableApprovalCurrencyScope =
  | { evaluable: true; phase: number }
  | {
      evaluable: false;
      phase: null;
      reason: "unregistered_deliverable_key" | "phase_outside_evidence_basis_range";
    };

export type DeliverableApprovalCurrencyDeps = {
  /** Injection point for the suite; product callers pass nothing. */
  registry?: readonly { deliverableTypeKey: string; phase: number }[];
};

/**
 * Resolve the phase an approval-currency check would run at, or say why no such
 * check can run for this deliverable type.
 */
export function resolveDeliverableApprovalCurrencyScope(
  deliverableTypeKey: string,
  deps: DeliverableApprovalCurrencyDeps = {},
): DeliverableApprovalCurrencyScope {
  const registry = deps.registry ?? DELIVERABLE_REGISTRY;
  const spec = registry.find(
    (entry) => entry.deliverableTypeKey === deliverableTypeKey,
  );
  if (!spec) {
    return {
      evaluable: false,
      phase: null,
      reason: "unregistered_deliverable_key",
    };
  }
  if (
    spec.phase < DELIVERABLE_APPROVAL_CURRENCY_PHASES.min ||
    spec.phase > DELIVERABLE_APPROVAL_CURRENCY_PHASES.max
  ) {
    return {
      evaluable: false,
      phase: null,
      reason: "phase_outside_evidence_basis_range",
    };
  }
  return { evaluable: true, phase: spec.phase };
}

/**
 * Why a recorded sign-off was accepted without a currency check. Written for an
 * operator reading a gate decision, so it names the key and says what was and
 * was not verified — never "approved and current".
 */
export function describeUnevaluableApprovalCurrency(
  deliverableTypeKey: string,
  reason: Exclude<DeliverableApprovalCurrencyScope, { evaluable: true }>["reason"],
): string {
  const because =
    reason === "unregistered_deliverable_key"
      ? `the deliverable registry does not carry "${deliverableTypeKey}", so it resolves to no phase`
      : `"${deliverableTypeKey}" resolves to a phase the approved-evidence snapshot does not model ` +
        `(outside P${DELIVERABLE_APPROVAL_CURRENCY_PHASES.min}–P${DELIVERABLE_APPROVAL_CURRENCY_PHASES.max})`;
  return (
    `The recorded human sign-off stands, but its currency against approved evidence was not ` +
    `checked: ${because}. Treating an unevaluable check as stale would refuse the gate with no ` +
    `action that could ever satisfy it.`
  );
}

/**
 * Report an unevaluable scope ONCE per deliverable type per process.
 *
 * The gap is static — a key is in the registry or it is not — so the signal is
 * "this type cannot be currency-checked", not "this request hit it again". Gate
 * evaluation runs on readiness reads as well as on approvals, so logging per call
 * would bury it. Returns whether it logged, which is what the suite asserts.
 */
const reported = new Set<string>();

export function reportUnevaluableApprovalCurrencyOnce(
  deliverableTypeKey: string,
  reason: Exclude<DeliverableApprovalCurrencyScope, { evaluable: true }>["reason"],
  log: (message: string, detail: Record<string, unknown>) => void = (
    message,
    detail,
  ) => console.warn(message, detail),
): boolean {
  const seen = `${deliverableTypeKey}:${reason}`;
  if (reported.has(seen)) return false;
  reported.add(seen);
  log("[moves] deliverable approval currency not evaluable", {
    deliverableTypeKey,
    reason,
    detail: describeUnevaluableApprovalCurrency(deliverableTypeKey, reason),
  });
  return true;
}

/** Test-only: the dedupe set is process-wide, so a suite must be able to clear it. */
export function __resetUnevaluableApprovalCurrencyReports(): void {
  reported.clear();
}
