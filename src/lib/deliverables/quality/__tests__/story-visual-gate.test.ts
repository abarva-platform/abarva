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
    outputFormat: "html",
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
      evaluateDeliverableQuality(archInput({ exhibitsRenderedAsVisual: false })).state,
    ).toBe("blocked_missing_visuals");
  });

  it("fails when current state is not drawn", () => {
    expect(
      evaluateDeliverableQuality(archInput({ currentStateVisualPresent: false })).state,
    ).toBe("blocked_missing_current_state");
  });

  it("fails when an architecture level is missing", () => {
    expect(
      evaluateDeliverableQuality(archInput({ conceptualArchPresent: false })).state,
    ).toBe("blocked_missing_architecture_level");
    expect(
      evaluateDeliverableQuality(archInput({ physicalArchPresent: false })).state,
    ).toBe("blocked_missing_architecture_level");
  });

  it("fails when there is no visible story spine", () => {
    expect(
      evaluateDeliverableQuality(archInput({ hasStorySpine: false })).state,
    ).toBe("blocked_storyline");
  });

  it("fails when the gap-to-target reasoning bridge is missing", () => {
    const r = evaluateDeliverableQuality(archInput({ gapToTargetBridgePresent: false }));
    expect(r.clientReady).toBe(false);
    expect(r.findings.some((f) => f.dimension === "gap_to_target_reasoning")).toBe(true);
  });

  it("does NOT reject a long artifact for length", () => {
    const longText =
      "We recommend a governed AI-assisted recovery decision system. " +
      "This is genuine client-specific judgment. ".repeat(400); // very long, no machinery/filler
    expect(evaluateDeliverableQuality(archInput({ narrativeText: longText })).state).toBe(
      "client_ready",
    );
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
});
