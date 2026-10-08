// Naming for the deliverable sign-off route's refusals.
//
// POST /api/v1/programs/:programId/deliverables/:deliverableId/sign-off is the
// ONLY product path that writes `deliverables_v2.status = 'signed_off'`, and four
// HARD phase-gate criteria can be satisfied no other way:
// `business_case_approved` and `readiness_and_change_plan_signed_off` on the
// P4 -> P5 rule, `handoff_package_signed_off` and
// `value_measurement_contract_signed_off` on the P5 -> 6 rule. None of the four
// has a capture-text fallback, so a sign-off that refuses without saying why
// stops the Move at the gate.
//
// Of that route's responses, every refusal but three carries a `detail`
// sentence. The three exceptions all returned a bare `{ error: "not_found" }`,
// and the approval control renders `body.error` verbatim when no `detail` is
// present — so a signed-in product user saw the literal token `not_found` next
// to a document that was visibly on screen. Three different causes needing
// three different responses arrived as one machine word:
//
//   1. the Move itself could not be read for this session;
//   2. the deliverable id is not in this Move;
//   3. the row was read, but the guarded write matched nothing.
//
// Cause 3 matters most, because its common case is NOT a failure. The write is
// guarded `status IN ('draft','in_review')`, and `status` only ever holds
// `draft`, `in_review` or `signed_off`, so the one reachable ineligible value is
// `signed_off` — the state the user was asking for. The agent tool
// `complete_deliverable` reaches it with no status guard, so a user who accepts
// a document in chat and then clicks Approve on the panel still showing the
// pre-sign-off render was told `not_found` about a document already approved.
//
// This module does the naming only: no database access and no `server-only`, so
// a suite can import it directly. The write layer keeps its boolean.

/** The status values any writer puts in `deliverables_v2.status`. */
export type DeliverableSignOffStatus = "draft" | "in_review" | "signed_off";

export type DeliverableSignOffRefusalCode =
  | "move_not_readable"
  | "deliverable_not_in_move"
  | "deliverable_already_signed_off"
  | "sign_off_not_applied";

export interface DeliverableSignOffRefusal {
  code: DeliverableSignOffRefusalCode;
  /** HTTP status for the response carrying this refusal. */
  httpStatus: number;
  /** A sentence the approval control can render as-is. */
  detail: string;
}

/** The Move could not be read for this session. */
export function refuseMoveNotReadable(): DeliverableSignOffRefusal {
  return {
    code: "move_not_readable",
    httpStatus: 404,
    detail:
      "This Move could not be read for your session, so no document in it can be signed off. Reopen the Move from the Moves list; if it still does not load, your access to it may have changed.",
  };
}

/** The deliverable id is not a row in this Move. */
export function refuseDeliverableNotInMove(): DeliverableSignOffRefusal {
  return {
    code: "deliverable_not_in_move",
    httpStatus: 404,
    detail:
      "This document is no longer part of this Move, so there is nothing to sign off. Reload the phase workspace to pick up the current document list.",
  };
}

/**
 * The row was read but the guarded write matched nothing.
 *
 * `statusAtRead` is the status read BEFORE the write was attempted. When it was
 * already `signed_off` the user's intent is met and the refusal says so. When it
 * was eligible, the row changed between the read and the write, which is a race
 * and not a terminal state — say that instead of naming a cause we cannot
 * observe.
 */
export function refuseSignOffNotApplied(args: {
  statusAtRead: DeliverableSignOffStatus | string | null;
  signedOffVersionAtRead?: number | null;
}): DeliverableSignOffRefusal {
  if (args.statusAtRead === "signed_off") {
    const version = args.signedOffVersionAtRead;
    const versionPhrase =
      typeof version === "number" ? ` at version ${version}` : "";
    return {
      code: "deliverable_already_signed_off",
      httpStatus: 409,
      detail:
        `This document was already signed off${versionPhrase}, so this approval changed nothing — ` +
        "the approval it is asking for is already recorded. Reload the phase workspace to see the " +
        "approved version and its sign-off badge.",
    };
  }
  // 404, not 409, and deliberately so. A `false` from the write layer is ALSO
  // how a deliverable id that does not belong to this Move is denied
  // (`signOffDeliverable` asserts program tenancy and filters the row by
  // `engagement_id`), and `programs-mutation-routes-tenant-guards` pins 404 as
  // that denial's status. Answering 409 here would both break that contract and
  // let a caller tell a foreign id apart from an absent one by status code. The
  // already-signed branch above may depart from 404 only because reaching it
  // requires a row this Move actually holds.
  return {
    code: "sign_off_not_applied",
    httpStatus: 404,
    detail:
      "This approval was not recorded, because the document was no longer in a state this Move could sign off. Reload the phase workspace and approve the version it then shows.",
  };
}
