import {
  EXECUTIVE_STORY_SPINES,
  renderStorySpinePrompt,
  ROADMAP_LANES,
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

    expect(EXECUTIVE_STORY_SPINES.p4_roadmap_commitment[0].id).toBe(
      "commitment_required",
    );
    expect(EXECUTIVE_STORY_SPINES.p4_roadmap_commitment.at(-1)!.id).toBe(
      "commitment",
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

describe("p4_roadmap_commitment", () => {
  const ids = EXECUTIVE_STORY_SPINES.p4_roadmap_commitment.map((b) => b.id);

  it("is a distinct argument from the investment case, not a reordering", () => {
    const investment = new Set(
      EXECUTIVE_STORY_SPINES.p4_investment_case.map((b) => b.id),
    );
    // Only the generic notion of value is shared; the rest is roadmap-specific.
    const overlap = ids.filter((id) => investment.has(id));
    expect(overlap).toEqual([]);
  });

  it("leads with the sequence, which is why it cannot project the investment spine", () => {
    // In the investment case, roadmap comes 8th. Here sequencing is 2nd.
    expect(ids.indexOf("sequencing_logic")).toBeLessThan(3);
  });

  it("establishes lanes before anything that depends on them", () => {
    // Dependencies, critical path and gates are unreadable without the lanes.
    for (const dependent of [
      "lane_milestones",
      "cross_lane_dependencies",
      "critical_path",
    ]) {
      expect(ids.indexOf("workstream_lanes")).toBeLessThan(
        ids.indexOf(dependent),
      );
    }
  });

  it("separates value milestones from delivery milestones", () => {
    expect(ids).toContain("lane_milestones");
    expect(ids).toContain("value_milestones");
    expect(ids.indexOf("lane_milestones")).not.toBe(
      ids.indexOf("value_milestones"),
    );
  });
});

describe("ROADMAP_LANES", () => {
  it("names the canonical delivery lanes with unique ids and real scope", () => {
    const laneIds = ROADMAP_LANES.map((l) => l.id);
    expect(new Set(laneIds).size).toBe(laneIds.length);
    expect(laneIds).toEqual([
      "foundation",
      "ingestion_medallion",
      "governance",
      "analytics_reporting",
      "activation",
    ]);
    for (const lane of ROADMAP_LANES) {
      expect(lane.label).toEqual(expect.stringMatching(/\S/));
      expect(lane.scope.length).toBeGreaterThan(30);
    }
  });

  it("orders lanes so a lane's typical prerequisites precede it", () => {
    const laneIds = ROADMAP_LANES.map((l) => l.id) as string[];
    expect(laneIds.indexOf("foundation")).toBeLessThan(
      laneIds.indexOf("ingestion_medallion"),
    );
    expect(laneIds.indexOf("ingestion_medallion")).toBeLessThan(
      laneIds.indexOf("analytics_reporting"),
    );
    expect(laneIds.indexOf("analytics_reporting")).toBeLessThan(
      laneIds.indexOf("activation"),
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
    // The roadmap argues a commitment to a sequence, not a funding case.
    expect(storySpineFor("execution_roadmap")).toBe("p4_roadmap_commitment");
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

  it("includes framework anchors without inviting generic framework exposition", () => {
    const p3Prompt = renderStorySpinePrompt("p3_solution_decision");
    expect(p3Prompt).toContain("FRAMEWORK ANCHORS");
    expect(p3Prompt).toContain("decision matrix across credible options");
    expect(p3Prompt).toContain("human/AI decision-rights and control matrix");
    expect(p3Prompt).toMatch(
      /use the appropriate consulting \/ architecture frameworks as lenses/i,
    );
    expect(p3Prompt).toMatch(/Do not explain the framework generically/i);
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
