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
 * WHO CAN PRODUCE THE DOCUMENT changes what those arms may prescribe. Every
 * sentence above names a build — "Run Approve & Build", "Regenerate" — or warns
 * that a rebuild would clear the sign-off. That is only true of a document some
 * phase's Approve & Build set actually produces. Three SOFT sign-off criteria
 * wait on documents that NO build set contains: `funding_approval_recorded`
 * (`funding_approval` / `capacity_approval` / `approval_memo`),
 * `sponsor_alignment_confirmed` (`stakeholder_alignment` / `sponsor_alignment`)
 * and `tower_handoff_plan_accepted` (`tower_handoff_plan` /
 * `execution_monitoring_plan` / `control_tower_handoff`). All eight of those
 * keys are absent from `DELIVERABLE_REGISTRY` entirely; they are saved by the
 * workspace assistant's `complete_deliverable(s)`, which the agent's own
 * instructions name as the producer for exactly these documents. Prescribing
 * Approve & Build to a reader whose gate waits on one of them names an action
 * that cannot succeed — the same defect class as
 * `a-refusals-prescribed-remedy-can-be-refused-by-the-same-cause`.
 *
 * So the producer is DERIVED, not passed: `resolveDeliverableProducer` asks
 * whether the key appears in any phase build set, and the two arms that can
 * reach an authorship-only document take a second form. The derivation lives
 * here rather than at the call sites so a document later added to a build set
 * gets the build sentence with no edit, and so no caller can forget to supply
 * it.
 *
 * Only `absent` and `not_signed_off` need that second form. The other two
 * causes are UNREACHABLE for an authorship-only document: `signOffVerdict`
 * consults `resolveDeliverableApprovalCurrencyScope` before either of them, and
 * an unregistered key resolves to no phase, so the verdict returns `pass`
 * first. Their sentences therefore keep their single build-shaped form.
 */

import {
  PHASE_CANONICAL_KEYS,
  getDeliverableSpec,
} from "@/lib/programs/deliverable-registry";

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
 * Who can create the document a sign-off criterion waits on.
 *
 * `phase_build` — some phase's Approve & Build set produces it, so the build
 * sentences apply and a rebuild really would replace a signed document.
 * `authorship_only` — no build set produces it; it exists only because someone
 * (today, the workspace assistant on a user's instruction) saved it.
 */
export type DeliverableProducer = "phase_build" | "authorship_only";

/** Both producers, so a test can assert the branch below is exhaustive. */
export const DELIVERABLE_PRODUCERS: readonly DeliverableProducer[] = [
  "phase_build",
  "authorship_only",
];

/**
 * Whether Approve & Build can produce this document, derived from the phase
 * build sets rather than declared.
 *
 * Membership is exact, matching `deliverableLabel`/`getDeliverableSpec` above:
 * an alias spelling that no build set carries answers `authorship_only`, which
 * is the honest answer for the action being prescribed — Approve & Build builds
 * the keys in the set, not their aliases.
 *
 * `phaseBuildSets` is injectable so the branch can be exercised against a
 * constructed set, including the case the shipped registry does not contain
 * (a document that moves INTO a build set and must stop being told to go
 * through authorship).
 */
export function resolveDeliverableProducer(args: {
  deliverableTypeKey: string;
  phaseBuildSets?: Readonly<Record<number, readonly string[]>>;
}): DeliverableProducer {
  const sets = args.phaseBuildSets ?? PHASE_CANONICAL_KEYS;
  for (const keys of Object.values(sets)) {
    if (keys.includes(args.deliverableTypeKey)) return "phase_build";
  }
  return "authorship_only";
}

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
  /**
   * Overrides the build sets the producer is derived from. Tests only — callers
   * pass nothing and get the shipped registry, so no call site can disagree
   * with the registry about who produces a document.
   */
  phaseBuildSets?: Readonly<Record<number, readonly string[]>>;
}): string {
  const label = deliverableLabel(input.deliverableTypeKey);
  const producer = resolveDeliverableProducer({
    deliverableTypeKey: input.deliverableTypeKey,
    phaseBuildSets: input.phaseBuildSets,
  });
  switch (input.cause) {
    case "absent":
      return producer === "authorship_only"
        ? `No ${label} exists on this Move yet, and Approve & Build does not produce one — no phase build set includes it. Ask aVa to save the ${label} for this Move, then record the sign-off on it.`
        : `No ${label} exists on this Move yet. Run Approve & Build for this phase to generate it, then record the sign-off on the generated document.`;
    case "not_signed_off": {
      const recorded =
        typeof input.status === "string" && input.status.trim().length > 0
          ? input.status.trim()
          : "not recorded";
      const opening = `${label} exists but its status is "${recorded}", not signed off. Record the sign-off on the existing document.`;
      // The rebuild warning is a claim about a mechanism, so it is only said
      // where the mechanism exists. Approve & Build does not build an
      // authorship-only document, so it would neither replace this one nor
      // clear its sign-off, and saying otherwise would warn a reader off an
      // action that was never a risk here.
      return producer === "authorship_only"
        ? opening
        : `${opening} Do not re-run Approve & Build for this: it replaces the document with a fresh unapproved draft and clears the sign-off this gate is waiting for.`;
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
