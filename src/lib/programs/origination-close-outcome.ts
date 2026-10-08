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
// This module is deliberately NOT `server-only`: the close helper it serves
// is, so the naming has to live somewhere a suite can reach directly rather
// than being pinned only through a mocked route.

/** Every way `closeP0OnApproval` can finish. Exactly one is success. */
export type OriginationCloseOutcome =
  | "advanced"
  | "move_not_readable"
  | "already_past_p0"
  | "brief_not_created"
  | "gate_hard_blocked"
  | "close_errored";

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
    case "move_not_readable":
      return "move_not_readable";
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

    case "move_not_readable":
      return "This Move could not be read, so no origination brief was signed and it stayed at P0. It may have been archived or may sit outside this workspace.";

    case "brief_not_created":
      return "The P0 origination brief could not be created, so there was nothing to sign and the Move stayed at P0. The brief is built from the problem statement, target outcome, sponsor and scope boundary recorded at origination — re-check that capture.";

    case "close_errored":
      return "The P0 close did not finish, so the Move stayed at P0. The approval itself was recorded, so re-submitting the P0 gate approval is safe.";
  }
}
