import {
  orchestratorDeliverableType,
  prescribedFormatForDeliverableType,
} from "../orchestrated-deliverable-map";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { PHASE_CANONICAL_KEYS } from "../deliverable-registry";

describe("orchestrated deliverable map", () => {
  it("routes P3 Target State Architecture to the exact canonical architecture brief and quality profile", () => {
    const orchestratorType = orchestratorDeliverableType(
      "target_state_architecture",
    );
    expect(orchestratorType).toBe("target_state_architecture");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "target_state_architecture",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
  });

  it("routes the P2 root-cause worksheet to its own orchestrator and quality profile", () => {
    const orchestratorType = orchestratorDeliverableType(
      "root_cause_worksheet",
    );
    expect(orchestratorType).toBe("root_cause_worksheet");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "root_cause_worksheet",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
  });

  it("routes the P5 value measurement contract to its own quality profile", () => {
    const orchestratorType = orchestratorDeliverableType(
      "value_measurement_contract",
    );
    expect(orchestratorType).toBe("value_measurement_contract");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "value_measurement_contract",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
  });

  it("routes the P4 readiness and change plan to its own quality profile", () => {
    const orchestratorType = orchestratorDeliverableType(
      "readiness_and_change_plan",
    );
    expect(orchestratorType).toBe("readiness_and_change_plan");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "readiness_and_change_plan",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
  });

  it("routes P3 Solution Design to its own workflow-exhibit profile", () => {
    const orchestratorType = orchestratorDeliverableType("solution_design");
    expect(orchestratorType).toBe("solution_design");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "solution_design",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
  });

  it("routes P3 Operating Model Design to the canonical fixed operating-model brief", () => {
    const orchestratorType = orchestratorDeliverableType(
      "operating_model_design",
    );
    expect(orchestratorType).toBe("operating_model");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "operating_model_design",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
  });

  it("keeps every active P1-P5 canonical deliverable off the generic quality fallback", () => {
    const canonicalKeys = Object.values(PHASE_CANONICAL_KEYS).flat();

    for (const registryKey of canonicalKeys) {
      const orchestratorType = orchestratorDeliverableType(registryKey);
      const qualityBar = resolveQualityBar("moves", orchestratorType);

      expect({
        registryKey,
        orchestratorType,
        minSections: qualityBar.minSections,
        minBodyWords: qualityBar.minBodyWords,
      }).not.toMatchObject({
        minSections: 6,
        minBodyWords: 600,
      });
    }
  });
});
