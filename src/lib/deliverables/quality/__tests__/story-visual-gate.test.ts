import {
  evaluateDeliverableQuality,
  type ContractInput,
} from "../deliverable-quality-contract";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";

const ARCH_EXHIBITS = [
  "current_state_architecture",
  "target_state_architecture",
  "data_flow",
  "ai_decision_flow",
  "agentic_overlay",
  "integration_pattern",
  "control_points",
  "implementation_waves",
] as const;

function archInput(over: Partial<ContractInput> = {}): ContractInput {
  return {
    profile: getDeliverableProfile("target_state_architecture"),
    narrativeText:
      "We recommend a governed AI-assisted recovery decision system for the client's operation.",
    renderedExhibits: [...ARCH_EXHIBITS],
    outputFormat: "pptx",
    hasStorySpine: true,
    currentStateVisualPresent: true,
    gapToTargetBridgePresent: true,
    conceptualArchPresent: true,
    logicalArchPresent: true,
    physicalArchPresent: true,
    exhibitsRenderedAsVisual: true,
    ...over,
  };
}

describe("story-led / exhibit-led quality gate (v2 redo)", () => {
  it("passes a fully story-led, visual, three-level architecture artifact", () => {
    expect(evaluateDeliverableQuality(archInput()).state).toBe("client_ready");
  });

  it("fails prose-only architecture (exhibits not rendered as visuals)", () => {
    expect(
      evaluateDeliverableQuality(archInput({ exhibitsRenderedAsVisual: false }))
        .state,
    ).toBe("blocked_missing_visuals");
  });

  it("fails when current state is not drawn", () => {
    expect(
      evaluateDeliverableQuality(
        archInput({ currentStateVisualPresent: false }),
      ).state,
    ).toBe("blocked_missing_current_state");
  });

  it("fails when an architecture level is missing", () => {
    expect(
      evaluateDeliverableQuality(archInput({ conceptualArchPresent: false }))
        .state,
    ).toBe("blocked_missing_architecture_level");
    expect(
      evaluateDeliverableQuality(archInput({ physicalArchPresent: false }))
        .state,
    ).toBe("blocked_missing_architecture_level");
  });

  it("fails when there is no visible story spine", () => {
    expect(
      evaluateDeliverableQuality(archInput({ hasStorySpine: false })).state,
    ).toBe("blocked_storyline");
  });

  it("fails when the gap-to-target reasoning bridge is missing", () => {
    const r = evaluateDeliverableQuality(
      archInput({ gapToTargetBridgePresent: false }),
    );
    expect(r.clientReady).toBe(false);
    expect(
      r.findings.some((f) => f.dimension === "gap_to_target_reasoning"),
    ).toBe(true);
  });

  it("does NOT reject a long artifact for length", () => {
    const longText =
      "We recommend a governed AI-assisted recovery decision system. " +
      "This is genuine client-specific judgment. ".repeat(400); // very long, no machinery/filler
    expect(
      evaluateDeliverableQuality(archInput({ narrativeText: longText })).state,
    ).toBe("client_ready");
  });

  it("does not apply story/architecture checks to a non-adopting profile (charter)", () => {
    const charter = getDeliverableProfile("charter");
    const r = evaluateDeliverableQuality({
      profile: charter,
      narrativeText: "We recommend approving a focused discovery gate.",
      renderedExhibits: [
        "decision_box",
        "known_unknown_table",
        "proceed_hold_stop_gate",
        "open_inputs_required",
      ],
    });
    expect(r.state).toBe("client_ready"); // charter has no storyArc/arch flags yet
  });

  it("blocks a prose-only business case even when exhibit ids are present", () => {
    const businessCase = getDeliverableProfile("business_case");
    const r = evaluateDeliverableQuality({
      profile: businessCase,
      narrativeText:
        "We recommend funding the SkyHarbor recovery transformation. Business Case",
      renderedExhibits: ["value_tree", "decision_box", "open_inputs_required"],
      outputFormat: "docx",
      financialInputs: {
        hasBaseline: true,
        hasCost: true,
        hasBenefit: true,
        hasSensitivity: true,
      },
      exhibitsRenderedAsVisual: false,
    });
    expect(r.state).toBe("blocked_missing_visuals");
    expect(
      r.findings.find((f) => f.dimension === "visual_exhibit_quality")?.detail,
    ).toContain("Value waterfall");
  });

  it("blocks a prose-only roadmap under the executive visual standard", () => {
    const roadmap = getDeliverableProfile("execution_roadmap");
    const r = evaluateDeliverableQuality({
      profile: roadmap,
      narrativeText: "We recommend approving mobilisation against the roadmap.",
      renderedExhibits: [
        "roadmap_lanes",
        "dependency_map",
        "decision_calendar",
      ],
      outputFormat: "pptx",
      exhibitsRenderedAsVisual: false,
    });
    expect(r.state).toBe("blocked_missing_visuals");
    expect(
      r.findings.find((f) => f.dimension === "visual_exhibit_quality")?.detail,
    ).toContain("30/60/90-day action plan");
  });

  it("blocks a prose-only Source decision brief so aVa renders decision visuals", () => {
    const sourceDecision = getDeliverableProfile("source_atlas_decision_brief");
    const r = evaluateDeliverableQuality({
      profile: sourceDecision,
      narrativeText:
        "We recommend selecting the preferred sourcing path and approving negotiation guardrails.",
      renderedExhibits: [
        "decision_headline",
        "risks_and_mitigations",
        "value_story",
      ],
      outputFormat: "pptx",
      exhibitsRenderedAsVisual: false,
    });
    expect(r.state).toBe("blocked_missing_visuals");
    expect(
      r.findings.find((f) => f.dimension === "visual_exhibit_quality")?.detail,
    ).toContain("One-page executive storyline");
  });

  it("allows visual-standard artifacts when final output contains rendered visuals or tables", () => {
    const sourceDecision = getDeliverableProfile("source_atlas_decision_brief");
    const r = evaluateDeliverableQuality({
      profile: sourceDecision,
      narrativeText:
        "We recommend selecting the preferred sourcing path and approving negotiation guardrails.",
      renderedExhibits: [
        "decision_headline",
        "risks_and_mitigations",
        "value_story",
      ],
      outputFormat: "pptx",
      exhibitsRenderedAsVisual: true,
    });
    expect(r.state).toBe("client_ready");
  });
});
