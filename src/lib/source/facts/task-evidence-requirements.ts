import type { StageTaskView } from "@/components/source/canvas/analytics/view-model";
import { requirementIdForFactTemplate } from "@/lib/source/facts/template-requirements";
import type { SourceStageKey } from "@/lib/source/types";

export const FACT_TEMPLATE_BY_TASK_ID: Record<string, string> = {
  "scope.volumetrics": "TICKET_HISTORY_V1",
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

// Explicit ownership prevents a new required item from silently appearing only
// at the final approval gate. The coverage test reconciles this with the catalog.
const REQUIRED_EVIDENCE_BY_TASK_ID: Record<string, readonly string[]> = {
  "strategy.confirm": [
    "EVID-SRC-STR-TRIGGER", "EVID-SRC-STR-INCUMBENT",
    "EVID-SRC-STR-SPEND-BASELINE", "EVID-SRC-STR-SPONSOR-COMMIT",
  ],
  "scope.app-inventory": ["EVID-SRC-SCOPE-APP-INV"],
  "scope.volumetrics": ["EVID-SRC-SCOPE-TICKET-HISTORY"],
  "scope.matrix": ["EVID-SRC-SCOPE-WORKFORCE", "EVID-SRC-SCOPE-SLA-BASELINE"],
  "scope.exclusions": ["EVID-SRC-SCOPE-CURRENT-SOW"],
  "scope.vendor-commercials": ["EVID-SRC-SCOPE-FY-CONTRACT"],
  "rfp.clause-coverage": [
    "EVID-SRC-RFP-REQUIREMENTS", "EVID-SRC-RFP-LEGAL-TEMPLATE",
    "EVID-SRC-RFP-SECURITY-PRIVACY", "EVID-SRC-RFP-SOURCING-RULES",
  ],
  "responses.coverage": [
    "EVID-SRC-RESP-PROPOSALS", "EVID-SRC-RESP-PRICING-SHEETS",
    "EVID-SRC-RESP-CLARIFICATIONS",
  ],
  "evaluation.vendor-bids": [
    "EVID-SRC-EVAL-RATER-SCORES", "EVID-SRC-EVAL-WEIGHT-RATIONALE",
    "EVID-SRC-EVAL-RISK-ASSESSMENT", "EVID-SRC-EVAL-TCO-NORMALIZATION",
  ],
  "pricing.normalized-supplier-pricing": [
    "EVID-SRC-PRICE-VENDOR-PRICING", "EVID-SRC-PRICE-RATE-CARD",
    "EVID-SRC-PRICE-ASSUMPTIONS",
  ],
  "bafo.concession-actuals": [
    "EVID-SRC-BAFO-ISSUE-LOG", "EVID-SRC-BAFO-OFFERS",
    "EVID-SRC-BAFO-RISK-ACCEPTANCE",
  ],
  "executive-decision.recommendation-packet": [
    "EVID-SRC-DEC-FINALIST-PRICING", "EVID-SRC-DEC-RISK-REGISTER",
    "EVID-SRC-DEC-VALUE-LEDGER", "EVID-SRC-DEC-STAKEHOLDER-ENDORSEMENT",
  ],
  "selection.committed-value": [
    "EVID-SRC-SEL-CONTRACT", "EVID-SRC-SEL-FINAL-SOW",
    "EVID-SRC-SEL-OBLIGATION-REGISTER",
  ],
  "transition.go-live-readiness": [
    "EVID-SRC-TRAN-MILESTONES", "EVID-SRC-TRAN-KT-EVIDENCE",
    "EVID-SRC-TRAN-ASSET-ACCESS", "EVID-SRC-TRAN-SERVICE-ACCEPTANCE",
  ],
  "value.realized-actuals": [
    "EVID-SRC-VAL-FINANCE-CONFIRMATION", "EVID-SRC-VAL-INVOICE-TRACKING",
    "EVID-SRC-VAL-OWNER-ATTESTATION",
  ],
};

export function requiredEvidenceRequirementIdsForTask(
  task: Pick<StageTaskView, "id" | "factTemplateCode">,
  stage: SourceStageKey,
): readonly string[] {
  if (!task.id.startsWith(`${stage === "executive_decision" ? "executive-decision" : stage}.`)) {
    return [];
  }
  return REQUIRED_EVIDENCE_BY_TASK_ID[task.id] ?? [];
}

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
