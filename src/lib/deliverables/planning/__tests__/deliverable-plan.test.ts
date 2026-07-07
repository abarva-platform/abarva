import {
  validateDeliverablePlan,
  planIsReady,
  type DeliverablePlan,
} from "../deliverable-plan";

function goodPlan(over: Partial<DeliverablePlan> = {}): DeliverablePlan {
  return {
    artifactType: "target_state_architecture",
    audience: "CIO / COO / architecture leadership",
    decisionPurpose: "Align on how the solution works end to end before build.",
    storyline:
      "The client moves from fragmented operational decisions to a governed AI-assisted decision system.",
    currentStateInterpretation:
      "Recovery decisions are made across siloed teams with fragmented signals under time pressure.",
    majorGaps: [
      {
        id: "g1",
        observation: "Each team holds partial context during recovery.",
        gap: "No shared decision context or single traceable recommendation path.",
        designImplication: "A common decision-context + orchestration layer.",
      },
    ],
    targetStateHypothesis:
      "A governed decision system that senses, enriches, recommends, and routes through human approval.",
    requiredDecisions: ["Which recovery decisions may be AI-recommended in the pilot."],
    requiredExhibits: [
      {
        exhibit: "current_state_architecture",
        purpose: "Show how decisions fragment today.",
        soWhat: "Reveals where coordination friction and value leakage occur.",
      },
    ],
    narrativeSequence: [
      { id: "b1", point: "A disruption event triggers recovery." },
      { id: "b2", point: "Teams interpret partial context and decide under pressure." },
      { id: "b3", point: "The target state unifies context and governs the decision." },
    ],
    evidenceNeeded: ["operational event volumes", "decision telemetry"],
    missingInputs: ["per-event recovery cost"],
    assumptions: ["pilot scope is a single hub"],
    risks: ["adoption by controllers"],
    readerTakeaway:
      "I can explain how the client moves from fragmented recovery to a governed AI-assisted decision system.",
    ...over,
  };
}

describe("DeliverablePlan (reason first)", () => {
  it("a complete plan is ready", () => {
    expect(planIsReady(goodPlan(), { requireGapChain: true })).toBe(true);
  });

  it("rejects a plan with a broken gap chain for architecture artifacts", () => {
    const broken = goodPlan({
      majorGaps: [{ id: "g1", observation: "x", gap: "", designImplication: "" }],
    });
    const issues = validateDeliverablePlan(broken, { requireGapChain: true });
    expect(issues.some((i) => i.level === "error")).toBe(true);
  });

  it("rejects an exhibit with no so-what (no decorative visuals)", () => {
    const plan = goodPlan({
      requiredExhibits: [
        { exhibit: "data_flow", purpose: "show data", soWhat: "" },
      ],
    });
    expect(
      validateDeliverablePlan(plan).some((i) => /so-what/i.test(i.message)),
    ).toBe(true);
  });

  it("rejects a stub storyline and a missing decision", () => {
    expect(planIsReady(goodPlan({ storyline: "short" }))).toBe(false);
    expect(planIsReady(goodPlan({ requiredDecisions: [] }))).toBe(false);
  });
});
