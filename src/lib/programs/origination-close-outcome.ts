// Why the P0 close did not advance — named, not left to the server log.
//
// `closeP0OnApproval` is the ONLY path that closes P0, the first step of a
// Move. It has five structurally different ways to stop, and before this
// module four of them returned the same shape: `advanced: false` with an
// EMPTY `blockedBy`. The approval route rendered that emptiness to the
// signed-in user as "P0 gate approval could not advance the Move. Check
// server logs for the phase close helper." — a product surface telling a
// product user to read a server log they cannot open, for four causes that
// need four different responses:
//
//   • the Move row was not readable at all,
//   • the Move had ALREADY left P0 (benign — nothing was owed),
//   • the origination brief could not be created (so nothing could be signed),
//   • the close threw and was swallowed to keep the approval write intact.
//
// Reporting "already past P0" as a gate block is the worst of the four: the
// Move advanced, and the user is told it did not. Only ONE of the five is a
// gate verdict, and only that one should say "gate".
//
// Two of the stops were later found to be TWO causes each, because the close
// helper's two reads both dropped their `error` and the compat client reports
// a failed read as `{ data: null, error }` rather than throwing:
//
//   • `move_not_readable` was reached both when the `engagements` row genuinely
//     does not exist AND when the read failed. Its sentence describes only the
//     first ("may have been archived"), which tells a reader hitting a read
//     outage that the Move is gone and steers them away from the one action
//     that would work. The read failure is now `move_state_unreadable`.
//   • The origination brief's existing-brief read is a DEDUPE read whose two
//     writes are reached only when it finds nothing, so a failed read did not
//     stop at all: it CREATED a second origination brief, the close signed
//     that one, and the result reported `advanced` — a duplicate signed
//     document reported as a clean success, with no control that removes
//     either copy. That refusal is now `brief_not_readable`.
//
// An unreadable state is a different claim from an absent one, and the two
// have opposite remedies: wait and retry versus stop and look elsewhere. A
// stop that cannot tell them apart cannot name either.
//
// This module is deliberately NOT `server-only`: the close helper it serves
// is, so the naming has to live somewhere a suite can reach directly rather
// than being pinned only through a mocked route.

/** Every way `closeP0OnApproval` can finish. Exactly one is success. */
export type OriginationCloseOutcome =
  | "advanced"
  | "move_state_unreadable"
  | "move_not_readable"
  | "already_past_p0"
  | "brief_not_readable"
  | "brief_not_created"
  | "gate_hard_blocked"
  | "close_errored";

/**
 * What KIND of thing each outcome is. One classification, not a set of
 * parallel lists:
 *
 * `success`    — the Move advanced.
 * `unreadable` — a state the close had to read could not be read. Nothing was
 *                written, the remedy is to retry now, and the wording may
 *                never assert anything about the Move itself.
 * `absent`     — the Move genuinely is not there. The remedy is to look
 *                elsewhere, which is the OPPOSITE of `unreadable`'s.
 * `no_op`      — the close was owed nothing. Not a failure; must not be
 *                logged or counted as one.
 * `verdict`    — a real gate decision. The only kind allowed the word "gate".
 * `failure`    — something the close attempted did not work.
 *
 * A `Record` keyed by the union is exhaustive-checked by the compiler, so an
 * outcome added to the type without a kind here does not compile — and a kind
 * is all it takes to join every sweep that iterates its group. The two
 * exported rosters below are DERIVED from this map for that reason: a
 * hand-typed list closed with `satisfies readonly Outcome[]` is satisfied by
 * any SUBSET, so it can silently stop growing while every sweep over it stays
 * green and stops covering the newest member. Both of this module's lists were
 * written that way, and both stopped covering a new outcome.
 */
const OUTCOME_KIND: Record<OriginationCloseOutcome, OriginationCloseKind> = {
  advanced: "success",
  move_state_unreadable: "unreadable",
  move_not_readable: "absent",
  already_past_p0: "no_op",
  brief_not_readable: "unreadable",
  brief_not_created: "failure",
  gate_hard_blocked: "verdict",
  close_errored: "failure",
};

/** See {@link OUTCOME_KIND}. */
export type OriginationCloseKind =
  | "success"
  | "unreadable"
  | "absent"
  | "no_op"
  | "verdict"
  | "failure";

/** Every outcome, derived from the compiler-checked classification above. */
export const ORIGINATION_CLOSE_OUTCOMES: readonly OriginationCloseOutcome[] =
  Object.freeze(Object.keys(OUTCOME_KIND) as OriginationCloseOutcome[]);

/** How this outcome should be read. */
export function originationCloseKind(
  outcome: OriginationCloseOutcome,
): OriginationCloseKind {
  return OUTCOME_KIND[outcome];
}

/**
 * The stops that mean "a state this close had to read could not be read".
 *
 * Derived, not listed: they share the only remedy a reader can act on — retry
 * now, escalate if it keeps refusing — and none of them may ever be worded as
 * a fact about the Move itself.
 */
export const ORIGINATION_CLOSE_UNREADABLE_OUTCOMES: readonly OriginationCloseOutcome[] =
  Object.freeze(
    ORIGINATION_CLOSE_OUTCOMES.filter(
      (outcome) => OUTCOME_KIND[outcome] === "unreadable",
    ),
  );

/**
 * True when the outcome is a correct no-op rather than a failure: the Move had
 * already left P0, so the close was owed nothing. Callers must not log or
 * count this as a failure.
 */
export function isOriginationCloseNoOp(
  outcome: OriginationCloseOutcome,
): boolean {
  return OUTCOME_KIND[outcome] === "no_op";
}

export type OriginationCloseReport = {
  outcome: OriginationCloseOutcome;
  /** Hard gate check keys. Only ever populated for `gate_hard_blocked`. */
  blockedBy?: readonly string[];
  /** The phase the Move is actually on. Only meaningful for `already_past_p0`. */
  movePhase?: number | null;
};

/**
 * The `error` code the approval route returns. Only a real gate verdict is
 * allowed to call itself `gate_blocked`; the other stops are not gate
 * verdicts and must not borrow the word.
 */
export function originationCloseErrorCode(
  outcome: OriginationCloseOutcome,
): string | null {
  switch (outcome) {
    case "advanced":
      return null;
    case "gate_hard_blocked":
      return "gate_blocked";
    case "already_past_p0":
      return "already_advanced";
    case "move_state_unreadable":
      return "move_state_unreadable";
    case "move_not_readable":
      return "move_not_readable";
    case "brief_not_readable":
      return "brief_not_readable";
    case "brief_not_created":
      return "brief_not_created";
    case "close_errored":
      return "close_errored";
  }
}

/**
 * The sentence the signed-in user reads. Each names what stopped the close,
 * what state the Move is in as a result, and what the reader can do next.
 * None of them asks the reader to consult a server log.
 */
export function describeOriginationCloseOutcome(
  report: OriginationCloseReport,
): string {
  switch (report.outcome) {
    case "advanced":
      return "The origination brief was signed and this Move advanced to P1 Charter.";

    case "gate_hard_blocked": {
      const checks = (report.blockedBy ?? []).filter(Boolean);
      return checks.length
        ? `P0 gate remains blocked by: ${checks.join(", ")}.`
        : "The P0 gate reported a hard block without naming a check, so the Move stayed at P0.";
    }

    case "already_past_p0": {
      const phase = report.movePhase;
      const where =
        typeof phase === "number" ? `It is already on P${phase}.` : "";
      return `This Move has already left P0, so the origination close had nothing to do. ${where} Open the phase it is on now rather than re-approving P0.`.replace(
        /\s+/g,
        " ",
      );
    }

    case "move_state_unreadable":
      return "This Move's own record could not be read just now, so no origination brief was signed and it stayed at P0. Nothing was recorded against the Move, and this is not a change to the Move or to your access. Approve again shortly; if it refuses the same way, the Moves records for this client cannot be read right now and an operator has to clear that first.";

    case "move_not_readable":
      return "No Move with this reference exists for your workspace, so no origination brief was signed and nothing was recorded. It may have been archived or may sit outside this workspace. Reopen the Move from the Moves list rather than approving again here.";

    case "brief_not_readable":
      return "The documents already recorded against this Move could not be read, so an origination brief that is already there could not be ruled out. The close stopped rather than add a second brief, which nothing here can remove, and it stayed at P0 with nothing recorded. Open this Move's documents first: if an origination brief is already there, approve again and that one will be signed.";

    case "brief_not_created":
      return "The P0 origination brief could not be created, so there was nothing to sign and the Move stayed at P0. The brief is built from the problem statement, target outcome, sponsor and scope boundary recorded at origination — re-check that capture.";

    case "close_errored":
      return "The P0 close did not finish, so the Move stayed at P0. The approval itself was recorded, so re-submitting the P0 gate approval is safe.";
  }
}
