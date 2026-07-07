import { nextStepNeeds } from "../next-step-needs";

describe("nextStepNeeds", () => {
  it("looks one stage forward and returns the next stage's required evidence", () => {
    const result = nextStepNeeds("strategy");
    expect(result.nextStage).toBe("scope");
    expect(result.nextStageLabel).toBe("Scope");
    expect(result.needs.length).toBeGreaterThan(0);
    // every returned need is required (recommended ones are excluded)
    expect(result.needs.every((n) => n.level === "required")).toBe(true);
    // and every need belongs to the next stage
    expect(result.needs.every((n) => n.stage === "scope")).toBe(true);
  });

  it("returns no next stage at the end of the lifecycle", () => {
    const result = nextStepNeeds("value");
    expect(result.nextStage).toBeNull();
    expect(result.nextStageLabel).toBeNull();
    expect(result.needs).toHaveLength(0);
  });
});
