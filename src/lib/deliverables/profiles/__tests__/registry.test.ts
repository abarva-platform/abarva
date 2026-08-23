import {
  getDeliverableProfile,
  listDeliverableProfiles,
  CLIENT_NARRATIVE_BANNED_TERMS,
} from "../index";
import type { DeliverableKey } from "../types";

// The 13 canonical PHASE_CANONICAL_KEYS — every one must have a profile.
const CANONICAL_KEYS: DeliverableKey[] = [
  "charter",
  "discovery_report",
  "root_cause_worksheet",
  "target_state_architecture",
  "solution_design",
  "operating_model_design",
  "sourcing_strategy",
  "execution_roadmap",
  "business_case",
  "financial_model",
  "tower_metrics_plan",
  "handoff_package",
  "value_measurement_contract",
];

describe("deliverable profile registry (W0)", () => {
  it("has a profile for every canonical deliverable key", () => {
    for (const key of CANONICAL_KEYS) {
      expect(getDeliverableProfile(key)?.key).toBe(key);
    }
    // Moves keys + the 14 Source artifact profiles all share one registry.
    expect(listDeliverableProfiles().length).toBeGreaterThanOrEqual(
      CANONICAL_KEYS.length + 14,
    );
  });

  it("hides internal phase labels in every client-facing artifact", () => {
    for (const p of listDeliverableProfiles()) {
      if (p.clientFacing) expect(p.allowPhaseLabels).toBe(false);
    }
  });

  it("never enforces a hard word cap — length is advisory only", () => {
    for (const p of listDeliverableProfiles()) {
      // lengthGuidance is prose, not a number; no maxWords field exists.
      expect(typeof (p.lengthGuidance ?? "")).toBe("string");
      expect(p).not.toHaveProperty("maxWords");
    }
  });

  it("requires the as-is and to-be architecture pair on Target Architecture", () => {
    const ta = getDeliverableProfile("target_state_architecture");
    expect(ta.requiredExhibits).toEqual(
      expect.arrayContaining([
        "current_state_architecture",
        "target_state_architecture",
        "data_flow",
        "ai_decision_flow",
        "agentic_overlay",
      ]),
    );
    // Data flow distinct from AI decision/control flow is a hard requirement.
    expect(ta.requiredExhibits).toContain("data_flow");
    expect(ta.requiredExhibits).toContain("ai_decision_flow");
  });

  it("routes board-decision and architecture artifacts to PPTX finals", () => {
    expect(getDeliverableProfile("handoff_package").defaultFormat).toBe("pptx");
    expect(getDeliverableProfile("discovery_report").defaultFormat).toBe(
      "pptx",
    );
    expect(
      getDeliverableProfile("target_state_architecture").defaultFormat,
    ).toBe("pptx");
    expect(
      getDeliverableProfile("solution_approach_options").defaultFormat,
    ).toBe("pptx");
    expect(getDeliverableProfile("solution_design").defaultFormat).toBe("pptx");
  });

  it("marks the business case for mode-downgrade and consolidates missing inputs", () => {
    const bc = getDeliverableProfile("business_case");
    expect(bc.supportsModeDowngrade).toBe(true);
    for (const p of listDeliverableProfiles()) {
      if (p.clientFacing) {
        expect(p.missingInputPolicy).toBe("single_open_inputs_table");
      }
    }
  });

  it("codifies the executive visual standards for major Moves artifacts", () => {
    expect(
      getDeliverableProfile("target_state_architecture").visualStandard
        ?.requiredVisuals,
    ).toEqual(
      expect.arrayContaining([
        "Conceptual architecture diagram",
        "Logical architecture diagram",
        "Physical/deployment architecture diagram",
        "Data flow diagram",
        "Integration flow diagram",
        "Security/trust boundary diagram",
      ]),
    );
    expect(
      getDeliverableProfile("business_case").visualStandard?.requiredVisuals,
    ).toEqual(
      expect.arrayContaining([
        "Value waterfall",
        "Cost baseline bridge",
        "Investment vs benefit timeline",
        "Scenario comparison",
      ]),
    );
    expect(
      getDeliverableProfile("execution_roadmap").visualStandard
        ?.requiredVisuals,
    ).toEqual(
      expect.arrayContaining([
        "30/60/90-day action plan",
        "Multi-wave roadmap",
        "Dependency map",
        "Stage-gate model",
      ]),
    );
    expect(
      getDeliverableProfile("handoff_package").visualStandard?.requiredVisuals,
    ).toEqual(
      expect.arrayContaining([
        "One-page executive storyline",
        "Target-state architecture",
        "Business case waterfall",
        "Risk heatmap",
        "Decision summary page",
      ]),
    );
  });

  it("requires aVa/Source decision and scorecard artifacts to render executive visuals", () => {
    expect(
      getDeliverableProfile("source_atlas_decision_brief")
        .visualRendererRequired,
    ).toBe(true);
    expect(
      getDeliverableProfile("source_atlas_decision_brief").visualStandard
        ?.requiredVisuals,
    ).toEqual(
      expect.arrayContaining([
        "One-page executive storyline",
        "Decision tree",
        "Recommendation scorecard",
      ]),
    );
    expect(
      getDeliverableProfile("source_evaluation_scorecard").visualStandard
        ?.requiredVisuals,
    ).toEqual(
      expect.arrayContaining([
        "Evaluation heatmap",
        "Weighted scorecard",
        "Vendor comparison chart",
      ]),
    );
    expect(
      getDeliverableProfile("source_transition_plan").visualStandard
        ?.requiredVisuals,
    ).toContain("Multi-wave roadmap");
  });

  it("keeps a non-empty client-narrative banned lexicon incl. phase labels", () => {
    expect(CLIENT_NARRATIVE_BANNED_TERMS).toContain("P1");
    expect(CLIENT_NARRATIVE_BANNED_TERMS).toContain("source register");
    expect(CLIENT_NARRATIVE_BANNED_TERMS.length).toBeGreaterThan(10);
  });
});
