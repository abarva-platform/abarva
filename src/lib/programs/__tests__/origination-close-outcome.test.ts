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
  originationCloseErrorCode,
  type OriginationCloseOutcome,
} from "../origination-close-outcome";

/**
 * Every member of the union, listed for the runtime sweeps below. The
 * `satisfies` keeps this list honest: adding an outcome to the type without
 * adding it here is a compile error, so no outcome can be added and left
 * unexercised.
 */
const ALL_OUTCOMES = [
  "advanced",
  "move_not_readable",
  "already_past_p0",
  "brief_not_created",
  "gate_hard_blocked",
  "close_errored",
] as const satisfies readonly OriginationCloseOutcome[];

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
      // Either the Move stayed at P0, or the sentence says where it went.
      expect(sentence).toMatch(/stayed at P0|already|P\d/);
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
