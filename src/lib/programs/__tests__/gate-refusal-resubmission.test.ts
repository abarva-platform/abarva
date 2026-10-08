import { gateRefusalAllowsResubmission } from "@/lib/programs/gate-refusal-resubmission";
import {
  classifyTransitionEvidenceBasisRefusal,
  type TransitionEvidenceBasisCause,
} from "@/lib/programs/transition-evidence-basis";

describe("gateRefusalAllowsResubmission", () => {
  it("withholds the remedy only for an explicit false", () => {
    expect(gateRefusalAllowsResubmission({ resubmitCanSatisfy: false })).toBe(
      false,
    );
    expect(gateRefusalAllowsResubmission({ resubmitCanSatisfy: true })).toBe(
      true,
    );
  });

  // Most refusal codes on this route carry no `resubmitCanSatisfy` at all: a
  // hard-gate block, an incomplete capture and an open evidence slot are each
  // answerable by doing the named work and submitting again. Every one of
  // those must keep the remedy it has today, so the absent field defaults to
  // allowing a re-submission rather than suppressing it.
  it("defaults to allowing a re-submission when the field is absent", () => {
    expect(gateRefusalAllowsResubmission({})).toBe(true);
    expect(
      gateRefusalAllowsResubmission({ resubmitCanSatisfy: undefined }),
    ).toBe(true);
    expect(
      gateRefusalAllowsResubmission({
        error: "gate_blocked",
        gate: {
          failedChecks: [{ severity: "hard", check: "charter_signed_off" }],
        },
      } as never),
    ).toBe(true);
  });

  // A body that did not parse, or that arrived with a shape nobody declared,
  // must not be read as a refusal nobody can clear: that would hide the one
  // instruction a reader can act on.
  it("allows a re-submission for an unreadable or absent body", () => {
    expect(gateRefusalAllowsResubmission(null)).toBe(true);
    expect(gateRefusalAllowsResubmission(undefined)).toBe(true);
    for (const value of ["false", 0, "", null, [], {}, NaN]) {
      expect(gateRefusalAllowsResubmission({ resubmitCanSatisfy: value })).toBe(
        true,
      );
    }
  });

  // The field is not invented here: the route already classifies the
  // transition-evidence basis failure per cause and sends this exact field.
  // Tie the reader to that producer so a cause whose retriability changes is
  // read the way the route meant it, not the way this suite once hardcoded.
  describe("against the route's own classifier", () => {
    const causes: TransitionEvidenceBasisCause[] = [
      "discovery_readiness_unreadable",
      "workbook_review_unreadable",
      "gap_assessment_failed",
    ];

    it.each(causes)("agrees with the classified refusal for %s", (cause) => {
      const refusal = classifyTransitionEvidenceBasisRefusal(cause);
      expect(gateRefusalAllowsResubmission(refusal)).toBe(
        refusal.resubmitCanSatisfy,
      );
    });

    // Non-vacuity: the three causes must not all answer the same way, or the
    // case above would hold for a reader that ignored the field entirely.
    it("covers both answers across the declared causes", () => {
      const answers = causes.map(
        (cause) =>
          classifyTransitionEvidenceBasisRefusal(cause).resubmitCanSatisfy,
      );
      expect(answers).toContain(true);
      expect(answers).toContain(false);
    });

    // The one cause the route rules out states so in its own words. A reader
    // that showed the remedy here would contradict the sentence beside it.
    it("withholds the remedy for the cause whose detail rules it out", () => {
      const refusal = classifyTransitionEvidenceBasisRefusal(
        "gap_assessment_failed",
      );
      expect(refusal.detail).toMatch(
        /Submitting the gate again will not change the answer/i,
      );
      expect(gateRefusalAllowsResubmission(refusal)).toBe(false);
    });

    // ...and the causes it does allow say the opposite, so the remedy they
    // keep is the action their own text asks for.
    it.each([
      "discovery_readiness_unreadable",
      "workbook_review_unreadable",
    ] as const)(
      "keeps the remedy for %s, whose detail asks for it",
      (cause) => {
        const refusal = classifyTransitionEvidenceBasisRefusal(cause);
        expect(refusal.detail).toMatch(/Submit the gate again/i);
        expect(gateRefusalAllowsResubmission(refusal)).toBe(true);
      },
    );
  });
});
