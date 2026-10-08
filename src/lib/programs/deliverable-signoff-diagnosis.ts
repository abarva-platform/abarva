/**
 * Why a deliverable sign-off criterion failed — and the one action that answers it.
 *
 * Six HARD gate criteria resolve to a single sign-off call:
 * `charter_signed_off` (P1->P2), `discovery_report_signed_off` (P2->P3),
 * `business_case_approved` and `readiness_and_change_plan_signed_off`
 * (P4->P5), and both `handoff_package_signed_off` /
 * `value_measurement_contract_signed_off` (P5->P6). Five of them call
 * `isSignedOff` directly; `business_case_approved` calls `meetsApprovalBar`,
 * an async wrapper that delegates to the same predicate, which is why a grep
 * for `isSignedOff` does not find it and why it was the last to get a cause.
 * The predicate returns a bare boolean, so four structurally different states
 * arrived at the reader as one sentence — the criterion's own `describe`,
 * which restates the criterion rather than the cause:
 *
 *   1. no such deliverable row exists at all,
 *   2. the row exists but is not recorded as signed off,
 *   3. it is signed off but its linked approved artifact does not belong to
 *      this Move, and
 *   4. it is signed off but its approved evidence basis is older than the
 *      evidence now approved for the phase.
 *
 * Those prescribe different, mutually exclusive actions, and the gate reason
 * reaches the screen: `MovesPhaseStandaloneClient` joins
 * `failedChecks[].reason` into the blocked message, and the advance route puts
 * it in `detail`. State (2) is the one that most needs saying, because the
 * obvious remedy is wrong: re-running Approve & Build replaces the signed
 * document with a fresh unapproved draft and so clears the very sign-off the
 * gate is waiting for. Only states (1), (3) and (4) may mention regenerating.
 *
 * Labels are read from `DELIVERABLE_REGISTRY` rather than typed here, so a
 * renamed document renames itself in these sentences.
 *
 * NOT wired to these sentences, deliberately: the three SOFT single-row
 * sign-off criteria `funding_approval_recorded`, `sponsor_alignment_confirmed`
 * and `tower_handoff_plan_accepted`. The `absent` arm below prescribes Approve
 * & Build, and none of the keys those three resolve (`funding_approval`,
 * `capacity_approval`, `approval_memo`, `stakeholder_alignment`,
 * `sponsor_alignment`, `tower_handoff_plan`, `execution_monitoring_plan`,
 * `control_tower_handoff`) appears in any `PHASE_CANONICAL_KEYS` set, so no
 * phase build produces them — `complete_deliverable` is their only producer.
 * Giving them this sentence would prescribe an action their own generation set
 * rules out. Their reasons are not inert either: both blocked-message readers
 * filter to `severity === "hard"`, but the advance route copies soft failures
 * into the gate decision artifact's `carriedGaps`, so these three need a
 * producer-aware `absent` arm rather than no change at all.
 */

import { getDeliverableSpec } from "@/lib/programs/deliverable-registry";

/**
 * Why `signOffVerdict` reached its answer. `signed_off` is the pass; every
 * other member is a distinct failure with a distinct remedy.
 */
export type DeliverableSignOffCause =
  | "signed_off"
  | "absent"
  | "not_signed_off"
  | "linked_artifact_integrity"
  | "evidence_basis_stale";

export interface DeliverableSignOffVerdict {
  ok: boolean;
  cause: DeliverableSignOffCause;
  /** The row's recorded status, or null when no row exists. */
  status: string | null;
}

/** Every cause, so a test can assert the ladder below is exhaustive. */
export const DELIVERABLE_SIGN_OFF_CAUSES: readonly DeliverableSignOffCause[] = [
  "signed_off",
  "absent",
  "not_signed_off",
  "linked_artifact_integrity",
  "evidence_basis_stale",
];

/**
 * The document's name as the product shows it. Falls back to a humanized key
 * so an unregistered alias still reads as a document name and never as a bare
 * identifier in a sentence aimed at a product user.
 */
export function deliverableLabel(deliverableTypeKey: string): string {
  const spec = getDeliverableSpec(deliverableTypeKey);
  if (spec) return spec.documentTitle;
  const humanized = deliverableTypeKey
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return humanized.length > 0 ? humanized : deliverableTypeKey;
}

/**
 * The sentence a blocked reader gets instead of the criterion's own
 * restatement. Every arm names exactly one next action.
 */
export function describeDeliverableSignOffFailure(input: {
  cause: DeliverableSignOffCause;
  deliverableTypeKey: string;
  status?: string | null;
}): string {
  const label = deliverableLabel(input.deliverableTypeKey);
  switch (input.cause) {
    case "absent":
      return `No ${label} exists on this Move yet. Run Approve & Build for this phase to generate it, then record the sign-off on the generated document.`;
    case "not_signed_off": {
      const recorded =
        typeof input.status === "string" && input.status.trim().length > 0
          ? input.status.trim()
          : "not recorded";
      return `${label} exists but its status is "${recorded}", not signed off. Record the sign-off on the existing document. Do not re-run Approve & Build for this: it replaces the document with a fresh unapproved draft and clears the sign-off this gate is waiting for.`;
    }
    case "linked_artifact_integrity":
      return `${label} is recorded as signed off, but the approved artifact it points at does not belong to this Move — wrong workspace, wrong Move, not a generated deliverable, or superseded. Regenerate the ${label} and sign off the current artifact.`;
    case "evidence_basis_stale":
      return `${label} is recorded as signed off, but it was approved against an older evidence basis than the evidence now approved for this phase. Regenerate the ${label} against the current evidence basis and sign it off again.`;
    case "signed_off":
    default:
      // Defensive. No caller asks for a sentence on a passing verdict today, so
      // this arm is unreachable from the gate evaluator — it exists so that a
      // later caller which does reach it gets a stated cause instead of an
      // empty string. A failed HARD criterion with no sentence is the failure
      // mode this module was written to remove; it must not be reintroduced by
      // a missing arm.
      return `${label} did not satisfy this criterion and no specific cause was recorded. Open the document and check both its sign-off status and its evidence basis.`;
  }
}
