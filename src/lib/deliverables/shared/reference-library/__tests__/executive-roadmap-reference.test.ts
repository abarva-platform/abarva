import { EXECUTIVE_ROADMAP_REFERENCE } from "../executive-roadmap-reference";

describe("EXECUTIVE_ROADMAP_REFERENCE — REF_EXECUTIVE_ROADMAP contract shape", () => {
  it("defines exactly 4 horizons in the specified order", () => {
    expect(EXECUTIVE_ROADMAP_REFERENCE.horizons).toEqual([
      "Mobilize",
      "Establish Foundation",
      "Deliver Priority Outcomes",
      "Scale and Optimize",
    ]);
    expect(EXECUTIVE_ROADMAP_REFERENCE.maxHorizons).toBe(4);
  });

  it("defines at most 6 workstreams", () => {
    expect(EXECUTIVE_ROADMAP_REFERENCE.workstreams.length).toBeLessThanOrEqual(
      EXECUTIVE_ROADMAP_REFERENCE.maxWorkstreams,
    );
    expect(EXECUTIVE_ROADMAP_REFERENCE.maxWorkstreams).toBe(6);
  });

  it("requires every roadmap item to carry outcome/activity/dependency/gate/owner/timing/measure/evidenceStatus", () => {
    expect(EXECUTIVE_ROADMAP_REFERENCE.requiredItemFields).toEqual([
      "outcome",
      "majorActivity",
      "dependency",
      "decisionOrGate",
      "ownerRole",
      "timing",
      "successMeasure",
      "evidenceStatus",
    ]);
  });

  it("leads every horizon with the outcome achieved, not the activity", () => {
    for (const horizon of EXECUTIVE_ROADMAP_REFERENCE.horizons) {
      expect(EXECUTIVE_ROADMAP_REFERENCE.horizonOutcomes[horizon]).toBeTruthy();
    }
  });

  it("defines canonical decision gates and value milestones", () => {
    expect(EXECUTIVE_ROADMAP_REFERENCE.decisionGates.length).toBeGreaterThan(0);
    expect(EXECUTIVE_ROADMAP_REFERENCE.valueMilestones.length).toBeGreaterThan(
      0,
    );
  });

  it("rejects a bare category-label title and requires a message-led one", () => {
    const rule = EXECUTIVE_ROADMAP_REFERENCE.titleRule;
    expect(
      rule.genericTitleForbiddenPatterns.some((re) =>
        re.test("Execution Roadmap"),
      ),
    ).toBe(true);
    expect(
      rule.genericTitleForbiddenPatterns.some((re) => re.test(rule.example)),
    ).toBe(false);
    expect(rule.example.split(/\s+/).length).toBeGreaterThanOrEqual(
      rule.minTitleWords,
    );
  });

  it("forbids sprint numbers, Gantt language, day/week counters, and explicit calendar dates", () => {
    const patterns = EXECUTIVE_ROADMAP_REFERENCE.forbiddenPatterns;
    expect(patterns.some((re) => re.test("Sprint 3"))).toBe(true);
    expect(patterns.some((re) => re.test("Gantt chart"))).toBe(true);
    expect(patterns.some((re) => re.test("Day 45"))).toBe(true);
    expect(patterns.some((re) => re.test("Week 6"))).toBe(true);
    expect(patterns.some((re) => re.test("March 15, 2027"))).toBe(true);
  });

  it("does not flag ordinary outcome language as forbidden", () => {
    const patterns = EXECUTIVE_ROADMAP_REFERENCE.forbiddenPatterns;
    const clean =
      "This horizon establishes trusted data and proves value in one function before scaling.";
    expect(patterns.some((re) => re.test(clean))).toBe(false);
  });

  it("carries a story contract with the full narrative arc", () => {
    expect(EXECUTIVE_ROADMAP_REFERENCE.story.narrativeArc).toEqual([
      "context",
      "tension",
      "evidence",
      "implication",
      "decision",
    ]);
    expect(EXECUTIVE_ROADMAP_REFERENCE.story.coreMessage).toBeTruthy();
    expect(EXECUTIVE_ROADMAP_REFERENCE.story.decisionRequired).toBeTruthy();
  });

  it("is scoped to phase 4 and required", () => {
    expect(EXECUTIVE_ROADMAP_REFERENCE.whenToUse).toEqual({
      phase: 4,
      required: true,
    });
  });
});
