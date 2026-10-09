/**
 * P0 is the first step of a Move, and `closeP0OnApproval` is the only path
 * that closes it. It has five ways to stop and four of them used to return an
 * EMPTY `blockedBy`, which the approval route rendered to the signed-in user
 * as "P0 gate approval could not advance the Move. Check server logs for the
 * phase close helper." — one sentence for four different causes, telling a
 * product user to read a log they cannot open, and reporting an ALREADY
 * ADVANCED Move as a gate block.
 *
 * These cases pin that each stop names itself, that only a real gate verdict
 * is allowed to call itself a gate block, and that no sentence sends the
 * reader to a server log.
 */

import {
  describeOriginationCloseOutcome,
  isOriginationCloseNoOp,
  originationCloseKind,
  ORIGINATION_CLOSE_OUTCOMES,
  ORIGINATION_CLOSE_UNREADABLE_OUTCOMES,
  originationCloseErrorCode,
  type OriginationCloseOutcome,
} from "../origination-close-outcome";

/**
 * Every member of the union, for the runtime sweeps below — DERIVED from the
 * module, not listed here.
 *
 * This was a hand-typed array closed with `satisfies readonly
 * OriginationCloseOutcome[]`, under a comment claiming that adding an outcome
 * to the type without adding it here would not compile. It would: `satisfies`
 * checks that every element IS an outcome, and any SUBSET satisfies that. So
 * the list could silently stop growing while every sweep that iterates it
 * stayed green and stopped covering the newest outcome — which is exactly what
 * happened when two were added. The roster is now built from a
 * `Record<OriginationCloseOutcome, true>` inside the module, which the
 * compiler DOES require to be exhaustive.
 */
const ALL_OUTCOMES: readonly OriginationCloseOutcome[] =
  ORIGINATION_CLOSE_OUTCOMES;

describe("the P0 close reports WHY it stopped", () => {
  it("gives every outcome a non-empty sentence", () => {
    for (const outcome of ALL_OUTCOMES) {
      const sentence = describeOriginationCloseOutcome({ outcome });
      expect(sentence.trim().length).toBeGreaterThan(0);
    }
  });

  it("gives every outcome a DISTINCT sentence", () => {
    const sentences = ALL_OUTCOMES.map((outcome) =>
      describeOriginationCloseOutcome({ outcome }),
    );
    expect(new Set(sentences).size).toBe(ALL_OUTCOMES.length);
  });

  // The regression itself. A product surface must not hand a product user a
  // server log as their next action.
  it("never sends the reader to a server log", () => {
    for (const outcome of ALL_OUTCOMES) {
      const sentence = describeOriginationCloseOutcome({
        outcome,
        blockedBy: [],
      });
      expect(sentence).not.toMatch(/server log/i);
      expect(sentence).not.toMatch(/check .*log/i);
    }
  });

  it("says what state the Move is left in for every stop", () => {
    const stops = ALL_OUTCOMES.filter((o) => o !== "advanced");
    for (const outcome of stops) {
      const sentence = describeOriginationCloseOutcome({
        outcome,
        blockedBy: ["program_seed_recorded"],
        movePhase: 2,
      });
      // Either the Move stayed at P0, or the sentence says where it went, or
      // it says nothing was recorded. The third form exists for the stop
      // where no Move row was found: claiming it "stayed at P0" would assert
      // a phase for a row that is not there. This matcher read only the first
      // two forms, and the derived roster above is what surfaced that — the
      // hand-typed list it replaced never reached this stop's new wording.
      expect(sentence).toMatch(
        /stayed at P0|already|P\d|nothing (was )?recorded/i,
      );
    }
  });
});

describe("only a real gate verdict calls itself a gate block", () => {
  it("maps gate_hard_blocked, and ONLY that, to gate_blocked", () => {
    const asGateBlocked = ALL_OUTCOMES.filter(
      (outcome) => originationCloseErrorCode(outcome) === "gate_blocked",
    );
    expect(asGateBlocked).toEqual(["gate_hard_blocked"]);
  });

  it("reports no error code for the success outcome", () => {
    expect(originationCloseErrorCode("advanced")).toBeNull();
  });

  it("gives every stop a distinct, non-null error code", () => {
    const stops = ALL_OUTCOMES.filter((o) => o !== "advanced");
    const codes = stops.map((outcome) => originationCloseErrorCode(outcome));
    expect(codes.every((code) => typeof code === "string" && code.length > 0)).toBe(
      true,
    );
    expect(new Set(codes).size).toBe(stops.length);
  });

  it("does not let an already-advanced Move be reported as a gate block", () => {
    expect(originationCloseErrorCode("already_past_p0")).toBe("already_advanced");
    const sentence = describeOriginationCloseOutcome({
      outcome: "already_past_p0",
      movePhase: 1,
    });
    expect(sentence).not.toMatch(/gate/i);
    expect(sentence).not.toMatch(/blocked/i);
  });
});

describe("the sentences carry the facts the reader needs", () => {
  it("names the hard checks a gate block is held by", () => {
    const sentence = describeOriginationCloseOutcome({
      outcome: "gate_hard_blocked",
      blockedBy: ["program_seed_recorded", "sponsor_assigned"],
    });
    expect(sentence).toContain("program_seed_recorded");
    expect(sentence).toContain("sponsor_assigned");
  });

  it("does not claim a named check when the gate named none", () => {
    const sentence = describeOriginationCloseOutcome({
      outcome: "gate_hard_blocked",
      blockedBy: [],
    });
    expect(sentence).toMatch(/without naming a check/i);
    expect(sentence).not.toMatch(/blocked by: \./);
  });

  it("names the phase an already-advanced Move is actually on", () => {
    expect(
      describeOriginationCloseOutcome({
        outcome: "already_past_p0",
        movePhase: 3,
      }),
    ).toContain("P3");
  });

  it("omits the phase claim when the phase is not known", () => {
    const sentence = describeOriginationCloseOutcome({
      outcome: "already_past_p0",
      movePhase: null,
    });
    expect(sentence).toMatch(/already left P0/);
    expect(sentence).not.toMatch(/already on P/);
    // No double space left behind by the omitted clause.
    expect(sentence).not.toMatch(/ {2}/);
  });

  it("points brief_not_created at the capture the brief is built from", () => {
    const sentence = describeOriginationCloseOutcome({
      outcome: "brief_not_created",
    });
    expect(sentence).toMatch(/problem statement/i);
    expect(sentence).toMatch(/sponsor/i);
    expect(sentence).toMatch(/scope/i);
  });

  it("tells the reader a retry is safe when the close errored", () => {
    const sentence = describeOriginationCloseOutcome({
      outcome: "close_errored",
    });
    expect(sentence).toMatch(/approval .*recorded/i);
    expect(sentence).toMatch(/safe|retry|re-submit/i);
  });
});

describe("an unreadable state is never worded as a fact about the Move", () => {
  // The regression that split these apart: `move_not_readable`'s sentence
  // describes an absent Move ("may have been archived"), and the failed read
  // used to land on it. A reader hitting an outage was told the Move was gone
  // — the one wording that makes retrying look pointless.
  it("never tells the reader an unreadable Move is archived or elsewhere", () => {
    for (const outcome of ORIGINATION_CLOSE_UNREADABLE_OUTCOMES) {
      const sentence = describeOriginationCloseOutcome({ outcome });
      expect(sentence).not.toMatch(/archiv/i);
      expect(sentence).not.toMatch(/outside this workspace/i);
      expect(sentence).not.toMatch(/does not exist|no Move with this/i);
    }
  });

  it("offers the retry on the unreadable stops and not on the absent one", () => {
    for (const outcome of ORIGINATION_CLOSE_UNREADABLE_OUTCOMES) {
      expect(describeOriginationCloseOutcome({ outcome })).toMatch(
        /approve again/i,
      );
    }
    const absent = describeOriginationCloseOutcome({
      outcome: "move_not_readable",
    });
    expect(absent).toMatch(/Moves list/i);
    expect(absent).not.toMatch(/approve again shortly/i);
  });

  it("says nothing was recorded on every unreadable stop", () => {
    for (const outcome of ORIGINATION_CLOSE_UNREADABLE_OUTCOMES) {
      expect(describeOriginationCloseOutcome({ outcome })).toMatch(
        /nothing (was )?recorded/i,
      );
    }
  });

  it("keeps every unreadable stop a real member of the union", () => {
    for (const outcome of ORIGINATION_CLOSE_UNREADABLE_OUTCOMES) {
      expect(ALL_OUTCOMES).toContain(outcome);
      expect(originationCloseErrorCode(outcome)).not.toBeNull();
    }
    // Neither may borrow the gate's word, and neither is the benign no-op.
    expect(
      ORIGINATION_CLOSE_UNREADABLE_OUTCOMES.map(originationCloseErrorCode),
    ).not.toContain("gate_blocked");
    expect(
      ORIGINATION_CLOSE_UNREADABLE_OUTCOMES.some(isOriginationCloseNoOp),
    ).toBe(false);
  });

  it("marks exactly the already-advanced outcome as the no-op", () => {
    expect(ALL_OUTCOMES.filter(isOriginationCloseNoOp)).toEqual([
      "already_past_p0",
    ]);
  });

  // The group is DEFINED by sharing one remedy, so derive the membership from
  // the sentences and require the two to agree. Without this, dropping an
  // outcome from the group silently shrank every sweep above it: the sweeps
  // iterate the group, so an outcome that left it was simply no longer
  // checked, and all of them stayed green. Measured — that mutation survived.
  it("groups exactly the stops that offer a retry and recorded nothing", () => {
    // The group's defining property, stated as the conjunction the module's
    // docstring claims: nothing was written, so approving again is free. It
    // discriminates — `move_not_readable` also recorded nothing but says
    // "rather than approving AGAIN here", and `close_errored` offers a retry
    // but cannot claim nothing was recorded.
    const retryable = ALL_OUTCOMES.filter((outcome) => {
      const sentence = describeOriginationCloseOutcome({ outcome });
      return (
        /approve again/i.test(sentence) &&
        /nothing (was )?recorded/i.test(sentence)
      );
    });
    expect([...retryable].sort()).toEqual(
      [...ORIGINATION_CLOSE_UNREADABLE_OUTCOMES].sort(),
    );
    expect(retryable.length).toBeGreaterThan(1);
  });

  it("classifies every outcome, and only one as the success", () => {
    const kinds = ALL_OUTCOMES.map(originationCloseKind);
    expect(kinds.every(Boolean)).toBe(true);
    expect(
      ALL_OUTCOMES.filter((o) => originationCloseKind(o) === "success"),
    ).toEqual(["advanced"]);
    // Only a real gate decision may be classified as one, and that
    // classification must agree with the error code the route returns.
    const verdicts = ALL_OUTCOMES.filter(
      (o) => originationCloseKind(o) === "verdict",
    );
    expect(verdicts).toEqual(["gate_hard_blocked"]);
    expect(verdicts.map(originationCloseErrorCode)).toEqual(["gate_blocked"]);
  });

  it("refuses the brief duplication in words, not just in the code", () => {
    const sentence = describeOriginationCloseOutcome({
      outcome: "brief_not_readable",
    });
    // Two separate claims, and the REASON is the one that can go missing.
    // An earlier version of this case matched `already there` too, which the
    // remedy clause ("if an origination brief is already there, approve
    // again") satisfies on its own — so deleting the whole reason clause left
    // the case green. Assert the reason and the remedy independently.
    expect(sentence).toMatch(/rather than add a second brief/i);
    expect(sentence).toMatch(/nothing here can remove|cannot be removed/i);
    expect(sentence).toMatch(/already there, approve again/i);
  });
});
