import type { StageTaskView } from "@/components/source/canvas/analytics/view-model";
import { requirementIdForFactTemplate } from "@/lib/source/facts/template-requirements";

export const FACT_TEMPLATE_BY_TASK_ID: Record<string, string> = {
  "scope.volumetrics": "VOLUMETRICS_V1",
  "scope.app-inventory": "APP_INVENTORY_V1",
  "scope.vendor-commercials": "CONTRACT_TERMS_V1",
  "rfp.clause-coverage": "RFP_CLAUSES_V1",
  "responses.coverage": "RESPONSE_COVERAGE_V1",
  "evaluation.vendor-bids": "VENDOR_BIDS_V1",
  "selection.committed-value": "COMMITTED_VALUE_V1",
  "bafo.concession-actuals": "BAFO_CONCESSIONS_V1",
  "value.realized-actuals": "VALUE_REALIZATION_V1",
};

const EVIDENCE_REQUIREMENT_BY_TASK_ID: Record<string, string> = {
  "executive-decision.recommendation-packet":
    "EVID-SRC-DEC-STAKEHOLDER-ENDORSEMENT",
};

export function factTemplateCodeForTask(task: {
  id: string;
  factTemplateCode?: string | null;
}): string | undefined {
  return task.factTemplateCode ?? FACT_TEMPLATE_BY_TASK_ID[task.id];
}

export function evidenceRequirementIdForTask(
  task: Pick<StageTaskView, "id" | "factTemplateCode">,
): string | null {
  const factTemplateCode = factTemplateCodeForTask(task);
  if (factTemplateCode) return requirementIdForFactTemplate(factTemplateCode);
  return EVIDENCE_REQUIREMENT_BY_TASK_ID[task.id] ?? null;
}
