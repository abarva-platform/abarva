/**
 * The phase gate's transition-evidence refusal, per cause.
 *
 * The property under test is the one the module exists for: a refusal may not
 * prescribe an action it has already ruled out. `gap_assessment_failed` is a
 * pure reduction over records both reads already returned, so a re-submission
 * recomputes it identically — that cause must not be sent as a retry, and the
 * two read faults must not be sent as permanent.
 *
 * Every assertion is driven from the cause union rather than a hand-typed list,
 * so a cause added without a refusal fails here instead of silently inheriting
 * another cause's status.
 */

import {
  classifyTransitionEvidenceBasisRefusal,
  describeTransitionEvidenceBasisFault,
  type TransitionEvidenceBasisCause,
} from "@/lib/programs/transition-evidence-basis";

const ALL_CAUSES: TransitionEvidenceBasisCause[] = [
  "discovery_readiness_unreadable",
  "workbook_review_unreadable",
  "gap_assessment_failed",
];

/** The causes a re-submission can plausibly answer, and the one it cannot. */
const RETRYABLE: TransitionEvidenceBasisCause[] = [
  "discovery_readiness_unreadable",
  "workbook_review_unreadable",
];
const NOT_RETRYABLE: TransitionEvidenceBasisCause[] = ["gap_assessment_failed"];

describe("transition evidence basis refusal", () => {
  it("covers every cause in the union", () => {
    // Guards the whole file from going vacuous: a new cause with no refusal
    // would otherwise just not be exercised.
    expect(RETRYABLE.length + NOT_RETRYABLE.length).toBe(ALL_CAUSES.length);
    expect([...RETRYABLE, ...NOT_RETRYABLE].sort()).toEqual(
      [...ALL_CAUSES].sort(),
    );
  });

  it.each(ALL_CAUSES)("classifies %s and echoes the cause back", (cause) => {
    const refusal = classifyTransitionEvidenceBasisRefusal(cause);
    expect(refusal.cause).toBe(cause);
  });

  it("gives every cause its own machine code", () => {
    const codes = ALL_CAUSES.map(
      (cause) => classifyTransitionEvidenceBasisRefusal(cause).code,
    );
    expect(new Set(codes).size).toBe(ALL_CAUSES.length);
    for (const code of codes) expect(code).not.toHaveLength(0);
  });

  it.each(RETRYABLE)("sends %s as a retryable 503", (cause) => {
    const refusal = classifyTransitionEvidenceBasisRefusal(cause);
    expect(refusal.status).toBe(503);
    expect(refusal.resubmitCanSatisfy).toBe(true);
  });

  it.each(NOT_RETRYABLE)(
    "sends %s as a non-retryable 422 that says so",
    (cause) => {
      const refusal = classifyTransitionEvidenceBasisRefusal(cause);
      expect(refusal.status).toBe(422);
      expect(refusal.resubmitCanSatisfy).toBe(false);
      // The whole point: the text must not tell the operator to try again.
      expect(refusal.detail).toContain(
        "Submitting the gate again will not change the answer",
      );
    },
  );

  it("never prescribes a re-submission it has ruled out", () => {
    for (const cause of ALL_CAUSES) {
      const refusal = classifyTransitionEvidenceBasisRefusal(cause);
      const invitesRetry = /submit the gate again/i.test(refusal.detail);
      const forbidsRetry =
        /submitting the gate again will not change the answer/i.test(
          refusal.detail,
        );
      expect(invitesRetry && forbidsRetry).toBe(false);
      expect(invitesRetry).toBe(refusal.resubmitCanSatisfy);
      expect(forbidsRetry).toBe(!refusal.resubmitCanSatisfy);
      // A 503 is itself a retry instruction, so the two must agree.
      expect(refusal.status === 503).toBe(refusal.resubmitCanSatisfy);
    }
  });

  it("states in every cause that nothing was waived and the gate did not pass", () => {
    for (const cause of ALL_CAUSES) {
      const { detail } = classifyTransitionEvidenceBasisRefusal(cause);
      expect(detail).toContain("The phase gate was not submitted");
      expect(detail).toContain("no evidence requirement was waived");
    }
  });

  it("does not report the workbook review as unverified when it was never reached", () => {
    // The old single refusal claimed both reads failed whichever one did. Step 1
    // failing means the workbook read never ran, so its text must say that
    // rather than asserting the workbook could not be verified.
    const refusal = classifyTransitionEvidenceBasisRefusal(
      "discovery_readiness_unreadable",
    );
    expect(refusal.detail).toContain("was not reached");
    expect(refusal.detail).not.toMatch(
      /workbook review could not be (read|verified)/i,
    );
  });

  it("reports what the workbook-read fault did establish", () => {
    // The mirror: discovery readiness DID answer here, so the refusal must not
    // claim nothing was measured.
    const refusal = classifyTransitionEvidenceBasisRefusal(
      "workbook_review_unreadable",
    );
    expect(refusal.detail).toContain(
      "discovery evidence readiness was read, but",
    );
    expect(refusal.detail).not.toContain("none of its transition");
  });

  it("reports the assessment fault as downstream of two successful reads", () => {
    const refusal = classifyTransitionEvidenceBasisRefusal(
      "gap_assessment_failed",
    );
    expect(refusal.detail).toContain("were both");
    expect(refusal.detail).toContain("operational fault");
  });

  it("never offers the refusal as an open evidence item", () => {
    for (const cause of ALL_CAUSES) {
      const { detail } = classifyTransitionEvidenceBasisRefusal(cause);
      expect(detail).toContain("not an open evidence item");
    }
  });

  describe("fault log line", () => {
    it("names the cause, the Move, the phase and the error message", () => {
      const line = describeTransitionEvidenceBasisFault({
        cause: "gap_assessment_failed",
        programId: "move-77",
        phase: 2,
        error: new Error("packet overlay exploded"),
      });
      expect(line).toContain("cause=gap_assessment_failed");
      expect(line).toContain("program=move-77");
      expect(line).toContain("phase=2");
      expect(line).toContain("packet overlay exploded");
    });

    it("carries a non-Error throw rather than dropping it", () => {
      const line = describeTransitionEvidenceBasisFault({
        cause: "workbook_review_unreadable",
        programId: "move-1",
        phase: 3,
        error: "plain string rejection",
      });
      expect(line).toContain("plain string rejection");
    });

    it("keeps the error message out of the operator-facing detail", () => {
      // The log carries the error; the refusal must not, or an internal message
      // reaches the screen.
      for (const cause of ALL_CAUSES) {
        const { detail } = classifyTransitionEvidenceBasisRefusal(cause);
        expect(detail).not.toContain("error=");
      }
    });
  });
});
