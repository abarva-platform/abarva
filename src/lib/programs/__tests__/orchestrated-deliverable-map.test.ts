import {
  orchestratorDeliverableType,
  prescribedFormatForDeliverableType,
} from "../orchestrated-deliverable-map";
import { deliverableKeyForOrchestratorType } from "@/lib/deliverables/quality/deliverable-key-map";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { getDeliverableStructure } from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";
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
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("pptx");
  });

  it("routes the P2 root-cause worksheet to its own orchestrator and quality profile", () => {
    const orchestratorType = orchestratorDeliverableType(
      "root_cause_worksheet",
    );
    expect(orchestratorType).toBe("root_cause_worksheet");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "root_cause_worksheet",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("pptx");
  });

  it("persists P2 Discovery as a PPTX deck, matching its slide contract", () => {
    const orchestratorType = orchestratorDeliverableType("discovery_report");
    expect(orchestratorType).toBe("discovery_report");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "discovery_report",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("pptx");
  });

  it("routes the P1 Discovery Workshop Guide separately from the Charter", () => {
    const orchestratorType = orchestratorDeliverableType("discovery_plan");
    expect(orchestratorType).toBe("discovery_plan");
    expect(deliverableKeyForOrchestratorType(orchestratorType)).toBe(
      "discovery_plan",
    );
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("docx");
    expect(
      getDeliverableStructure("moves", orchestratorType)?.fixedStructure,
    ).toBe(true);
  });

  it("gives the P2 design guide its own brief without aliasing later-phase guides", () => {
    const designGuide = orchestratorDeliverableType("design_workshop_guide");
    expect(designGuide).toBe("design_workshop_guide");
    expect(designGuide).not.toBe("discovery_plan");
    expect(getDeliverableStructure("moves", designGuide)?.fixedStructure).toBe(
      true,
    );

    // The claim is that each later guide keeps its OWN orchestrator type, so
    // none of them inherits the P1 discovery guide's or the P2 design guide's
    // scope. Whether a guide has a structure is a separate question, asserted
    // below per guide.
    for (const registryKey of [
      "planning_workshop_guide",
      "mobilization_workshop_guide",
      "execution_kickoff_guide",
    ]) {
      const orchestratorType = orchestratorDeliverableType(registryKey);
      expect(orchestratorType).toBe(registryKey);
      expect(orchestratorType).not.toBe("discovery_plan");
      expect(orchestratorType).not.toBe(designGuide);
    }

    // The P4 and P5 guides have their own structures
    // (structure-phase-session-guides.ts), each distinct from the P2 guide's.
    for (const registryKey of [
      "mobilization_workshop_guide",
      "execution_kickoff_guide",
    ]) {
      const structure = getDeliverableStructure(
        "moves",
        orchestratorDeliverableType(registryKey),
      );
      expect(structure?.deliverableType).toBe(registryKey);
      expect(structure?.fixedStructure).toBe(true);
    }

    // The P3 planning guide is structureless under a stated product decision,
    // not by omission — see moves-process-change-estimate-brief-structure.
    expect(
      getDeliverableStructure(
        "moves",
        orchestratorDeliverableType("planning_workshop_guide"),
      ),
    ).toBeUndefined();
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
    expect(prescribedFormatForDeliverableType(orchestratorType)).toBe("pptx");
  });

  it("persists solution approach options as a PPTX final when generated directly", () => {
    expect(
      prescribedFormatForDeliverableType("solution_approach_options"),
    ).toBe("pptx");
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
