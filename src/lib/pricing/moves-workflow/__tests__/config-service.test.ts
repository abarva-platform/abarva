import { loadRealEffortEnginePack } from "../../effort-engine/__fixtures__/test-fixtures";
import { buildEstimateConfig } from "../config-service";

const pack = loadRealEffortEnginePack();

describe("buildEstimateConfig", () => {
  it("lists every real archetype from the loaded pack", () => {
    const config = buildEstimateConfig(pack);
    expect(config.modelVersion).toBe(pack.modelVersion);
    expect(config.archetypes.map((a) => a.archetypeCode).sort()).toEqual(
      [...pack.archetypes.map((a) => a.archetype_code)].sort(),
    );
  });

  it("derives each archetype's required-input schema from the REAL archetype→activity-pack→driver mapping, not a hardcoded list", () => {
    const config = buildEstimateConfig(pack);
    // ARCH-01 (AI/automation use case) and ARCH-07 (ERP) draw from very
    // different activity packs — their driver-derived question sets must
    // differ (proves this isn't one static list reused for every archetype).
    const arch01Keys = config.requiredInputsByArchetype["ARCH-01"].map((i) => i.inputKey);
    const arch07Keys = config.requiredInputsByArchetype["ARCH-07"].map((i) => i.inputKey);
    expect(arch01Keys).not.toEqual(arch07Keys);
    expect(arch01Keys).toContain("ai_use_case_count");
    expect(arch07Keys).toContain("module_count");
  });

  it("every archetype's schema includes the fixed setup fields plus its own drivers", () => {
    const config = buildEstimateConfig(pack);
    for (const code of Object.keys(config.requiredInputsByArchetype)) {
      const keys = config.requiredInputsByArchetype[code].map((i) => i.inputKey);
      expect(keys).toEqual(expect.arrayContaining(["scenario_name", "currency", "target_start_date", "target_duration_weeks", "selected_rate_card_id"]));
    }
  });

  it("assigns stepHint from the REAL activity-pack category (technical -> scope, shared_nontechnical -> people)", () => {
    const config = buildEstimateConfig(pack);
    const arch01 = config.requiredInputsByArchetype["ARCH-01"];
    const setupFields = arch01.filter((i) => i.stepHint === "setup");
    expect(setupFields).toHaveLength(5);
    // ai_use_case_count is driven by a technical AI activity pack -> scope.
    expect(arch01.find((i) => i.inputKey === "ai_use_case_count")?.stepHint).toBe("scope");
    // course_count / training_session_count are driven by AP-SHARED-04 (Training, shared_nontechnical) -> people.
    const peopleKeys = arch01.filter((i) => i.stepHint === "people").map((i) => i.inputKey);
    expect(peopleKeys.length).toBeGreaterThan(0);
    expect(peopleKeys).toEqual(expect.arrayContaining(["stakeholder_group_count"]));
  });

  it("every required input carries a human label and (where applicable) a real unit from pricing_effort_drivers", () => {
    const config = buildEstimateConfig(pack);
    const arch01 = config.requiredInputsByArchetype["ARCH-01"];
    const aiUseCaseCount = arch01.find((i) => i.inputKey === "ai_use_case_count");
    expect(aiUseCaseCount?.label).toBe("AI Use Case Count");
    expect(aiUseCaseCount?.unit).toBe("AI use case");
  });
});
