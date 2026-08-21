import { deliverableBelongsToPhase } from "../phase-deliverables";

describe("deliverableBelongsToPhase", () => {
  it("counts the canonical phase gate deliverable (the eval's missing charter)", () => {
    // P1 gate deliverable typeKey is "charter" (PHASE_WORKFLOW[1]).
    expect(deliverableBelongsToPhase("charter", 1, "charter")).toBe(true);
    expect(deliverableBelongsToPhase("business_case", 4, "business_case")).toBe(
      true,
    );
    expect(
      deliverableBelongsToPhase("discovery_report", 2, "discovery_report"),
    ).toBe(true);
  });

  it("regression: the old p{n}_ filter alone missed the canonical charter", () => {
    // Without the canonical key, "charter" matches neither p1_ nor _p1 → 0.
    expect(deliverableBelongsToPhase("charter", 1, undefined)).toBe(false);
  });

  it("still honors the legacy p{n}_ / _p{n} naming convention", () => {
    expect(deliverableBelongsToPhase("p1_origination_brief", 1)).toBe(true);
    expect(deliverableBelongsToPhase("solution_p3", 3)).toBe(true);
  });

  it("does not count a deliverable from another phase", () => {
    expect(deliverableBelongsToPhase("charter", 2, "discovery_report")).toBe(
      false,
    );
    expect(deliverableBelongsToPhase("business_case", 1, "charter")).toBe(
      false,
    );
  });

  it("handles empty typeKey safely", () => {
    expect(deliverableBelongsToPhase("", 1, "charter")).toBe(false);
  });

  it("accepts the canonical key LIST (PHASE_CANONICAL_KEYS) — multi-deliverable phases", () => {
    // P4 has several canonical deliverables, not just the gate one — all count.
    const p4 = [
      "execution_roadmap",
      "business_case",
      "financial_model",
      "tower_metrics_plan",
      "readiness_and_change_plan",
    ];
    expect(deliverableBelongsToPhase("execution_roadmap", 4, p4)).toBe(true);
    expect(deliverableBelongsToPhase("financial_model", 4, p4)).toBe(true);
    expect(deliverableBelongsToPhase("business_case", 4, p4)).toBe(true);
    expect(deliverableBelongsToPhase("readiness_and_change_plan", 4, p4)).toBe(
      true,
    );
    // a P5 deliverable does not count toward P4
    expect(deliverableBelongsToPhase("handoff_package", 4, p4)).toBe(false);
  });
});
