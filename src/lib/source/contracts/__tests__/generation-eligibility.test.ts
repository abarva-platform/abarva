import { evaluateGenerationEligibility } from "../generation-eligibility";

describe("evaluateGenerationEligibility", () => {
  it("is eligible with no blockers for d01_strategy_memo at the strategy stage with no missing upstream", () => {
    const result = evaluateGenerationEligibility({
      artifactCode: "d01_strategy_memo",
      currentStage: "strategy",
      missingRequiredUpstreamCodes: [],
    });
    expect(result).toEqual({ eligible: true, blockers: [] });
  });

  it("blocks with stage_not_eligible when the event's stage precedes the artifact's earliest eligible stage", () => {
    const result = evaluateGenerationEligibility({
      artifactCode: "d24_decision_brief", // earliestEligibleStage = executive_decision
      currentStage: "strategy",
      missingRequiredUpstreamCodes: [],
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: "stage_not_eligible",
        meta: {
          earliestEligibleStage: "executive_decision",
          currentStage: "strategy",
        },
      }),
    ]);
  });

  it("does not block on stage once the event has reached the artifact's eligible stage, or any later stage", () => {
    for (const stage of ["executive_decision", "selection", "transition", "value"] as const) {
      const result = evaluateGenerationEligibility({
        artifactCode: "d24_decision_brief",
        currentStage: stage,
        missingRequiredUpstreamCodes: [],
      });
      expect(result.blockers.some((b) => b.code === "stage_not_eligible")).toBe(
        false,
      );
    }
  });

  it("blocks with missing_required_upstream when the caller reports missing codes, independent of stage eligibility", () => {
    const result = evaluateGenerationEligibility({
      artifactCode: "d09_rfp_pack",
      currentStage: "rfp",
      missingRequiredUpstreamCodes: ["d01_strategy_memo", "d05_scope_memo"],
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual([
      expect.objectContaining({
        code: "missing_required_upstream",
        meta: { missingUpstream: ["d01_strategy_memo", "d05_scope_memo"] },
      }),
    ]);
  });

  it("reports BOTH blockers when stage is ineligible AND upstream is missing", () => {
    const result = evaluateGenerationEligibility({
      artifactCode: "d24_decision_brief",
      currentStage: "strategy",
      missingRequiredUpstreamCodes: ["d16_scorecard", "d19_pricing_workbook"],
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers.map((b) => b.code)).toEqual([
      "stage_not_eligible",
      "missing_required_upstream",
    ]);
  });

  it("passing an empty missingRequiredUpstreamCodes array never produces an upstream blocker, regardless of what the contract actually requires", () => {
    // This is exactly chat-save's deliberate scope decision (ADR-0015):
    // it never resolves upstream presence, so it always passes [].
    const result = evaluateGenerationEligibility({
      artifactCode: "d09_rfp_pack", // really requires d01, d05
      currentStage: "rfp",
      missingRequiredUpstreamCodes: [],
    });
    expect(result.blockers.some((b) => b.code === "missing_required_upstream")).toBe(
      false,
    );
  });

  it("throws for an unknown artifact code rather than silently allowing generation", () => {
    expect(() =>
      evaluateGenerationEligibility({
        artifactCode: "d99_does_not_exist",
        currentStage: "strategy",
        missingRequiredUpstreamCodes: [],
      }),
    ).toThrow(/no contract registered/);
  });
});
