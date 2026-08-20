import {
  EXECUTIVE_STORY_SPINES,
  renderStorySpinePrompt,
  storyBeatsFor,
  storySpineFor,
  type StorySpineId,
} from "../executive-story-contract";

const ALL_SPINES = Object.keys(EXECUTIVE_STORY_SPINES) as StorySpineId[];

describe("EXECUTIVE_STORY_SPINES", () => {
  it("gives every beat a question and a decision role", () => {
    for (const spine of ALL_SPINES) {
      for (const beat of EXECUTIVE_STORY_SPINES[spine]) {
        expect(beat.id).toEqual(expect.stringMatching(/^[a-z][a-z0-9_]*$/));
        expect(beat.label).toEqual(expect.stringMatching(/\S/));
        // A beat is a question the reader needs answered, not a heading.
        expect(beat.question).toEqual(expect.stringContaining("?"));
        expect(beat.decisionRole).toEqual(expect.stringMatching(/\S/));
      }
    }
  });

  it("keeps beat ids unique within a spine", () => {
    for (const spine of ALL_SPINES) {
      const ids = EXECUTIVE_STORY_SPINES[spine].map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("opens every spine with the answer and closes it with the decision", () => {
    // The reader gets the conclusion first and the ask last — in all three.
    expect(EXECUTIVE_STORY_SPINES.p2_discovery[0].id).toBe("executive_answer");
    expect(EXECUTIVE_STORY_SPINES.p2_discovery.at(-1)!.id).toBe(
      "proceed_hold_stop",
    );

    expect(EXECUTIVE_STORY_SPINES.p3_solution_decision[0].id).toBe(
      "decision_required",
    );
    expect(EXECUTIVE_STORY_SPINES.p3_solution_decision.at(-1)!.id).toBe(
      "transition_implications",
    );

    expect(EXECUTIVE_STORY_SPINES.p4_investment_case[0].id).toBe("decision");
    expect(EXECUTIVE_STORY_SPINES.p4_investment_case.at(-1)!.id).toBe(
      "recommendation",
    );
  });

  it("orders the P4 story exactly as agreed", () => {
    expect(EXECUTIVE_STORY_SPINES.p4_investment_case.map((b) => b.id)).toEqual([
      "decision",
      "why_now",
      "what_we_are_funding",
      "investment",
      "value",
      "economics",
      "delivery",
      "roadmap",
      "risk",
      "recommendation",
    ]);
  });

  it("puts what we are funding before what it costs", () => {
    // Costing something before scoping it is a broken argument, not a style
    // preference — this ordering is the reason the spine is not reorderable.
    const ids = EXECUTIVE_STORY_SPINES.p4_investment_case.map((b) => b.id);
    expect(ids.indexOf("what_we_are_funding")).toBeLessThan(
      ids.indexOf("investment"),
    );
    expect(ids.indexOf("investment")).toBeLessThan(ids.indexOf("economics"));
  });

  it("puts alternatives before the recommended approach in P3", () => {
    const ids = EXECUTIVE_STORY_SPINES.p3_solution_decision.map((b) => b.id);
    expect(ids.indexOf("approaches_considered")).toBeLessThan(
      ids.indexOf("recommended_approach"),
    );
    expect(ids.indexOf("tradeoffs")).toBeLessThan(
      ids.indexOf("recommended_approach"),
    );
  });

  it("puts root causes after the problem in P2", () => {
    const ids = EXECUTIVE_STORY_SPINES.p2_discovery.map((b) => b.id);
    expect(ids.indexOf("what_is_not_working")).toBeLessThan(
      ids.indexOf("root_causes"),
    );
  });
});

describe("storySpineFor", () => {
  it("maps each argument artifact to its phase story", () => {
    expect(storySpineFor("discovery_report")).toBe("p2_discovery");
    expect(storySpineFor("solution_design")).toBe("p3_solution_decision");
    expect(storySpineFor("target_state_architecture")).toBe(
      "p3_solution_decision",
    );
    expect(storySpineFor("business_case")).toBe("p4_investment_case");
    expect(storySpineFor("execution_roadmap")).toBe("p4_investment_case");
  });

  it("returns null for instruments that have a job but no narrative arc", () => {
    for (const key of [
      "charter",
      "financial_model",
      "value_measurement_contract",
      "handoff_package",
    ] as const) {
      expect(storySpineFor(key)).toBeNull();
      expect(storyBeatsFor(key)).toEqual([]);
    }
  });
});

describe("renderStorySpinePrompt", () => {
  const prompt = renderStorySpinePrompt("p4_investment_case");

  it("numbers the beats in order so the sequence is unambiguous", () => {
    expect(prompt).toMatch(/1\. Decision —/);
    expect(prompt).toMatch(/10\. Recommendation —/);
    expect(prompt.indexOf("3. What we are funding")).toBeLessThan(
      prompt.indexOf("4. Investment"),
    );
  });

  it("includes each beat's question and decision role", () => {
    for (const beat of EXECUTIVE_STORY_SPINES.p4_investment_case) {
      expect(prompt).toContain(beat.question);
      expect(prompt).toContain(beat.decisionRole);
    }
  });

  it("permits combining beats but forbids reordering them", () => {
    expect(prompt).toMatch(/combined into one section/i);
    expect(prompt).toMatch(/NOT reorder/);
  });

  it("renders every spine without throwing", () => {
    for (const spine of ALL_SPINES) {
      expect(renderStorySpinePrompt(spine)).toEqual(
        expect.stringMatching(/EXECUTIVE STORY SPINE/),
      );
    }
  });
});
