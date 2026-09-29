import {
  SAMPLE_BAFO_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_SCOPE_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
} from "@/components/source/canvas/analytics/sample-view-model";
import { SAMPLE_STRATEGY_STAGE } from "@/components/source/canvas/analytics/strategy-sample-view-model";
import { evidenceForStage } from "@/lib/source/canonical-specs/evidence-requirements";
import type { SourceStageKey } from "@/lib/source/types";
import { requiredEvidenceRequirementIdsForTask } from "../task-evidence-requirements";

const stages = [
  SAMPLE_STRATEGY_STAGE,
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
];

it.each(stages)("assigns every required $stageKey evidence item to exactly one task", (stage) => {
  const stageKey = stage.stageKey as SourceStageKey;
  const expected = evidenceForStage(stageKey)
    .filter((requirement) => requirement.level === "required")
    .map((requirement) => requirement.requirementId)
    .sort();
  const assigned = stage.tasks
    .flatMap((task) => requiredEvidenceRequirementIdsForTask(task, stageKey))
    .sort();

  expect(assigned).toEqual(expected);
});

it("keeps ticket history and SLA baseline visible on their own Scope steps", () => {
  expect(requiredEvidenceRequirementIdsForTask({ id: "scope.volumetrics", factTemplateCode: "TICKET_HISTORY_V1" }, "scope"))
    .toEqual(["EVID-SRC-SCOPE-TICKET-HISTORY"]);
  expect(requiredEvidenceRequirementIdsForTask({ id: "scope.matrix" }, "scope"))
    .toEqual(["EVID-SRC-SCOPE-WORKFORCE", "EVID-SRC-SCOPE-SLA-BASELINE"]);
});

it("does not infer a binding for an unknown task", () => {
  expect(requiredEvidenceRequirementIdsForTask({ id: "scope.unknown" }, "scope"))
    .toEqual([]);
});
