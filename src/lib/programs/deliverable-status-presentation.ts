// What a `deliverables_v2.status` value means to the reader of a document list,
// and which of its values the sign-off write can act on.
//
// `deliverable-sign-off-outcome.ts` owns the status DOMAIN — the four values the
// CHECK constraint on the column admits — and the sentences the sign-off route
// refuses with AFTER a submission. This module owns the two facts a LIST needs
// BEFORE the reader clicks: what the state is called, and whether approving it
// is an action that can succeed. The domain type is imported rather than
// restated so the column keeps one declaration.
//
// Both facts were implicit on the Files & Evidence Documents list, and a
// `superseded` row got them both wrong. Its dot came from a two-arm ladder that
// named `signed_off` and `in_review` and let everything else fall through to
// `Draft`, so the one other value the constraint admits was reported as the most
// actionable state in the domain. The approve control then rendered beside that
// label whenever the row had never been signed off, and
// `POST .../deliverables/:id/sign-off` refuses every submission against it with
// the `deliverable_superseded` 409 — the guarded write is
// `status IN ('draft','in_review')`. So the list offered the one action that
// could not succeed and named the one that could (regenerate) only in the
// refusal, after the click.
//
// That state is reached by an ORDINARY P3 action, not an edge case:
// `POST .../solution-options/approve` sets every P3 architecture deliverable in
// the Move to `superseded` when the chosen option is approved, because an output
// built on the prior basis may no longer satisfy a gate. It writes `status`
// alone and leaves `signed_off_version` as it found it, so a row superseded
// after being signed off reported `Draft` with its control suppressed — a
// document the reader was told nothing about at all.
//
// No database access and no `server-only`, so a suite can import it directly.

import type { DeliverableSignOffStatus } from "./deliverable-sign-off-outcome";

/**
 * The statuses the sign-off write accepts, and the single declaration of that
 * set. `signOffDeliverable`'s guarded update filters on exactly these; stating
 * them here keeps the write layer's eligible set and the list's "can this
 * approve succeed" question from drifting apart.
 */
export const DELIVERABLE_SIGNABLE_STATUSES: readonly DeliverableSignOffStatus[] =
  ["draft", "in_review"];

export interface DeliverableStatusPresentation {
  /** The state's name, as the document list renders it. */
  label: string;
  /** The status dot's colour. */
  dotColor: string;
  /** Whether the sign-off write can act on a row in this state. */
  signable: boolean;
  /**
   * The action that CAN succeed from this state, when approving cannot and the
   * state is terminal rather than transient. Non-null only where we can name a
   * terminal state; a list renders it in place of the approve control.
   */
  blockedNextAction: string | null;
}

/**
 * Describe one `deliverables_v2.status` value for a document list.
 *
 * `draft` is the LAST arm and the default deliberately. An unrecognised value —
 * a status added to the column later — keeps today's `Draft` label AND keeps the
 * approve control, because the route is the authority on eligibility and now
 * names its own refusals. Failing closed here would hide a legitimate control
 * for a state nobody has taught this module about yet; the only terminal
 * non-approved state the constraint admits is named explicitly above it.
 */
export function describeDeliverableStatus(
  status: DeliverableSignOffStatus | string | null | undefined,
): DeliverableStatusPresentation {
  if (status === "signed_off") {
    return {
      label: "Signed off",
      dotColor: "#16A34A",
      signable: false,
      // Not blocked: the reader's intent is already recorded. The control
      // suppresses itself on `alreadyApproved` and that is the right answer.
      blockedNextAction: null,
    };
  }
  if (status === "in_review") {
    return {
      label: "In review",
      dotColor: "#D97706",
      signable: true,
      blockedNextAction: null,
    };
  }
  if (status === "superseded") {
    return {
      label: "Superseded",
      // The muted tone the Files & Evidence artifact chips already give this
      // state, so one Move reads the same way on both panels.
      dotColor: "#9AA3B2",
      signable: false,
      blockedNextAction:
        "Superseded when the solution option was approved — generate it again to return it to draft, then approve that version.",
    };
  }
  return {
    label: "Draft",
    dotColor: "#9AA3B2",
    signable: true,
    blockedNextAction: null,
  };
}
