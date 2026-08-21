// Guarding against a non-answer rendered as substantial work.
//
// The false-negative direction is the dangerous one: missing a deferral
// restores the original defect invisibly. Missing in the other direction only
// suppresses context on a real answer, which someone will notice and report.
// The tests are weighted accordingly.

import {
  assessDeferralOnlyAnswer,
  isDeferralOnlyAnswer,
} from "../deferral-only-answer";

// Verbatim, from the live run that exposed this.
const THE_ACTUAL_NON_ANSWER =
  "Looking at the active program — Predictive Turnaround & Maintenance " +
  "Reliability — I'll draft the P1 inputs from what's confirmed in the " +
  "upstream record. Let me pull the charter and origination brief together now.";

describe("the case this was built for", () => {
  it("catches the exact text that shipped as a drafted answer", () => {
    const assessment = assessDeferralOnlyAnswer(THE_ACTUAL_NON_ANSWER);
    expect(assessment.isDeferralOnly).toBe(true);
    expect(assessment.reason).toBe("promise_without_delivery");
  });
});

describe("deferrals it must catch", () => {
  it.each([
    ["Let me pull the charter together now."],
    ["I'll draft those inputs for you."],
    ["I am going to review the origination brief."],
    ["One moment."],
    ["Let me check the upstream record. I'll come back with the fields."],
    ["Looking at the active Move — let me gather the evidence."],
    ["Sure. I'll prepare the draft."],
  ])("catches %j", (text) => {
    expect(isDeferralOnlyAnswer(text)).toBe(true);
  });

  it("treats an empty answer as a deferral", () => {
    expect(assessDeferralOnlyAnswer("   ").reason).toBe("empty");
  });
});

describe("real answers it must NOT suppress", () => {
  it("passes a short factual answer that opens with scene-setting", () => {
    const assessment = assessDeferralOnlyAnswer(
      "Based on the charter, the sponsor is the SVP Flight Operations.",
    );
    expect(assessment.isDeferralOnly).toBe(false);
    expect(assessment.reason).toBe("contains_substance");
  });

  it("passes an answer that promises and then actually delivers", () => {
    expect(
      isDeferralOnlyAnswer(
        "Let me summarise. The sponsor is the SVP Flight Operations, and " +
          "decision cadence is weekly.",
      ),
    ).toBe(false);
  });

  it("does not match a mid-sentence 'we'll' inside a real finding", () => {
    // The pattern is anchored at sentence start precisely so this survives.
    expect(
      isDeferralOnlyAnswer(
        "To close the gate we'll need a current-state process export.",
      ),
    ).toBe(false);
  });

  it("passes a long answer even when it opens with a promise", () => {
    const long =
      "Let me walk through the blockers. " +
      "The hard criterion is sponsor sign-off on the charter. ".repeat(12);
    expect(long.length).toBeGreaterThan(400);
    expect(assessDeferralOnlyAnswer(long).reason).toBe(
      "too_long_to_be_a_deferral",
    );
  });

  it("passes scene-setting with no promise attached", () => {
    // Nothing was promised, so there is no undelivered work to flag.
    expect(
      assessDeferralOnlyAnswer("Looking at the active program.").reason,
    ).toBe("no_promise_made");
  });

  it("passes a refusal, which is a real and complete answer", () => {
    // Refusing to invent a figure is exactly the behaviour we want, and it
    // must never be mistaken for failing to answer.
    expect(
      isDeferralOnlyAnswer(
        "I cannot propose a funding figure — no approved cost evidence exists " +
          "for this Move.",
      ),
    ).toBe(false);
  });
});

describe("degenerate input", () => {
  it.each([null, undefined])("treats %p as empty rather than throwing", (v) => {
    expect(() =>
      assessDeferralOnlyAnswer(v as unknown as string),
    ).not.toThrow();
    expect(assessDeferralOnlyAnswer(v as unknown as string).reason).toBe(
      "empty",
    );
  });
});
