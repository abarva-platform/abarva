// Can an approved-evidence currency check run at this deliverable's phase AT ALL?
//
// `isApprovedMoveEvidenceBasisCurrent` opens with
// `if (!snapshot || !recordedRevision || phase < 1 || phase > 5) return false`.
// The phase bound is not a comparison — it is a refusal to compare: outside
// P1-P5 the function answers `false` for every input, because the approved-
// evidence snapshot models no revision for such a phase.
//
// The four Moves write paths that call it therefore have to confine the phase
// themselves before they may read its answer as a comparison. Three do, in
// three different ways; the deliverable sign-off route confines only the LOWER
// bound (`deliverablePhase >= 1`, from an inline `?? 0` registry lookup). An
// out-of-range phase passed that test, so the route handed
// `classifyApprovedEvidenceBasisRefusal` `basisEvaluable: true` together with a
// `false` that nothing had established, and the classifier — correctly, for the
// inputs it was given — answered `recorded_basis_superseded`: "Approved evidence
// changed after this document was generated. Rebuild it from the current
// evidence set before approval.", carrying `rebuildCanSatisfy: true`.
//
// Nothing compared anything. The rebuild re-reads the same out-of-range phase
// and gets the same `false`, so that refusal is unsatisfiable while advertising
// itself as satisfiable. `approved-evidence-basis-refusal.ts` exists to prevent
// exactly that, and its suite proves the property over every condition the
// classifier can build — but evaluability is the CALLER's input, so a caller
// that mis-decides it reintroduces the defect past a green suite.
//
// This module is that decision, taken once and shared. It does not restate the
// bounds: it asks `resolveDeliverableApprovalCurrencyScope`, the read-side
// component that already owns them (and already distinguishes an unregistered
// key from a registered one sitting outside the modelled range, deliberately, so
// that a later registration cannot hide inside the first reason). The two
// reasons are mapped onto the write-side cause union so a refusal names which
// one held.
//
// Scope note, stated plainly: the shipped `DELIVERABLE_REGISTRY` carries phases
// P1-P5 only, so no shipped key reaches the out-of-range arm today. The arm is
// a guard on a registration — a P0 brief, a P6 handoff — not a repair of a live
// break. What it buys now is that such a registration can no longer silently
// turn an unevaluable basis into a stale-document claim; the suite proves the
// arm against a constructed registry, and pins every shipped spec's scope so the
// agreement is measured rather than assumed.

import {
  DELIVERABLE_APPROVAL_CURRENCY_PHASES,
  resolveDeliverableApprovalCurrencyScope,
  type DeliverableApprovalCurrencyDeps,
} from "@/lib/programs/deliverable-approval-currency";
import type { UnevaluableApprovedEvidenceBasisCause } from "@/lib/programs/approved-evidence-basis-refusal";

export { DELIVERABLE_APPROVAL_CURRENCY_PHASES };

export type ApprovedEvidenceBasisPhaseScope =
  /** A currency comparison may run, at this phase. */
  | { readonly evaluable: true; readonly phase: number }
  /** No comparison may run; `cause` is the refusal cause that says why. */
  | {
      readonly evaluable: false;
      readonly phase: null;
      readonly cause: UnevaluableApprovedEvidenceBasisCause;
    };

/**
 * Whether an approved-evidence currency check can run for this deliverable
 * type, and the phase it would run at.
 *
 * A write path must gate `basisEvaluable` on this rather than on a bound of its
 * own, because `isApprovedMoveEvidenceBasisCurrent` returns `false` for every
 * input outside the modelled range and that `false` carries no information.
 */
export function resolveApprovedEvidenceBasisPhaseScope(
  deliverableTypeKey: string,
  deps: DeliverableApprovalCurrencyDeps = {},
): ApprovedEvidenceBasisPhaseScope {
  const scope = resolveDeliverableApprovalCurrencyScope(
    deliverableTypeKey,
    deps,
  );
  if (scope.evaluable) {
    return { evaluable: true, phase: scope.phase };
  }
  if (scope.reason === "phase_outside_evidence_basis_range") {
    return {
      evaluable: false,
      phase: null,
      cause: "deliverable_phase_outside_evidence_basis_range",
    };
  }
  // Last arm is the refusing one on purpose. Every other unevaluable reason —
  // including one added to the read-side union after this was written — reports
  // an unresolved phase, which refuses. A reason this function does not
  // recognise must never arrive as `evaluable: true`.
  return {
    evaluable: false,
    phase: null,
    cause: "deliverable_phase_unresolved",
  };
}
