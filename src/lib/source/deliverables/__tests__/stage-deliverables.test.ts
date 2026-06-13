import {
  SOURCE_STAGE_DELIVERABLES,
  assertEveryStageDeliverableHasBrief,
} from "../stage-deliverables";
import { getDeliverableStructure } from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";

describe("SOURCE_STAGE_DELIVERABLES", () => {
  it("has 4 entries with unique deliverableTypes and stageKeys", () => {
    expect(SOURCE_STAGE_DELIVERABLES).toHaveLength(4);

    const types = SOURCE_STAGE_DELIVERABLES.map((d) => d.deliverableType);
    expect(new Set(types).size).toBe(types.length);

    const stageKeys = SOURCE_STAGE_DELIVERABLES.map((d) => d.stageKey);
    expect(new Set(stageKeys).size).toBe(stageKeys.length);
  });

  it("every stage deliverable resolves to a real structure or the bespoke rfp brief", () => {
    expect(assertEveryStageDeliverableHasBrief()).toEqual([]);
  });

  it.each([
    "sourcing_strategy_memo",
    "evaluation_workbook",
    "executive_recommendation",
  ])(
    "%s resolves to a structure with non-empty requiredSectionKeys",
    (deliverableType) => {
      const structure = getDeliverableStructure("source", deliverableType);
      expect(structure).toBeDefined();
      expect(structure?.requiredSectionKeys.length).toBeGreaterThan(0);
    },
  );
});
