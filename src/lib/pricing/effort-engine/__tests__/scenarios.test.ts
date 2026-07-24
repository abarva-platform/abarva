import { getScenarioDefinition, scenarioHoursMultiplier, selectAgentCostLinesForScenario } from "../scenarios";
import type { PricingAgentCostRow } from "../types";

describe("scenarios — AI acceleration is explicit and per-activity, default 1.0", () => {
  it("traditional scenario applies the identity factor (1.0) to every activity pack", () => {
    const def = getScenarioDefinition("traditional");
    expect(scenarioHoursMultiplier(def, "AP-TECH-AI-02").factor).toBe(1);
    expect(scenarioHoursMultiplier(def, "AP-TECH-APP-02").factor).toBe(1);
    expect(scenarioHoursMultiplier(def, "AP-SHARED-07").factor).toBe(1);
  });

  it("ai_accelerated scenario changes ONLY the specific activities named in the approved override map", () => {
    const def = getScenarioDefinition("ai_accelerated");
    const overriddenCodes = [
      "AP-TECH-AI-02",
      "AP-TECH-DATA-02",
      "AP-TECH-APP-02",
      "AP-TECH-APP-03",
      "AP-TECH-APP-05",
      "AP-TECH-LEGACY-02",
    ];
    for (const code of overriddenCodes) {
      const { factor, rationale } = scenarioHoursMultiplier(def, code);
      expect(factor).toBeLessThan(1);
      expect(rationale).not.toBeNull();
    }
    // Everything else — including packs from the SAME archetypes as the overridden ones — stays at 1.0.
    const untouchedCodes = ["AP-TECH-AI-01", "AP-TECH-AI-03", "AP-TECH-AI-04", "AP-TECH-AI-05", "AP-TECH-APP-01", "AP-TECH-APP-04", "AP-SHARED-01"];
    for (const code of untouchedCodes) {
      expect(scenarioHoursMultiplier(def, code)).toEqual({ factor: 1, rationale: null });
    }
  });

  it("custom scenario uses only the caller-supplied override map, never a built-in one", () => {
    const def = getScenarioDefinition("custom", { "AP-SHARED-01": { hoursMultiplier: 0.5, rationale: "custom test override" } });
    expect(scenarioHoursMultiplier(def, "AP-SHARED-01")).toEqual({ factor: 0.5, rationale: "custom test override" });
    expect(scenarioHoursMultiplier(def, "AP-TECH-AI-02")).toEqual({ factor: 1, rationale: null });
  });

  it("custom scenario with no override map behaves as pure identity", () => {
    const def = getScenarioDefinition("custom");
    expect(scenarioHoursMultiplier(def, "AP-TECH-AI-02").factor).toBe(1);
  });
});

describe("selectAgentCostLinesForScenario", () => {
  const agentCosts: PricingAgentCostRow[] = [
    { model_version: 1, agent_cost_code: "AGT-001", cost_key: "ai_platform_license_monthly_usd", applies_to_archetype_code: "ARCH-01", cost_value: 8000, unit: "USD/month", description: null, status: "active" },
    { model_version: 1, agent_cost_code: "AGT-003", cost_key: "coding_copilot_seat_monthly_usd", applies_to_archetype_code: null, cost_value: 45, unit: "USD/seat/month", description: null, status: "active" },
    { model_version: 1, agent_cost_code: "AGT-004", cost_key: "data_pipeline_ai_assist_monthly_usd", applies_to_archetype_code: "ARCH-02", cost_value: 2500, unit: "USD/month", description: null, status: "active" },
  ];

  it("adds nothing for non-AI-accelerated scenarios", () => {
    expect(selectAgentCostLinesForScenario("traditional", "ARCH-01", agentCosts)).toEqual([]);
    expect(selectAgentCostLinesForScenario("vendor_led", "ARCH-01", agentCosts)).toEqual([]);
  });

  it("adds archetype-specific plus broadly-applicable (null-archetype) cost lines for ai_accelerated", () => {
    const lines = selectAgentCostLinesForScenario("ai_accelerated", "ARCH-01", agentCosts);
    expect(lines.map((l) => l.agentCostCode).sort()).toEqual(["AGT-001", "AGT-003"]);
  });

  it("does not add a cost line scoped to a different archetype", () => {
    const lines = selectAgentCostLinesForScenario("ai_accelerated", "ARCH-01", agentCosts);
    expect(lines.some((l) => l.agentCostCode === "AGT-004")).toBe(false);
  });
});
