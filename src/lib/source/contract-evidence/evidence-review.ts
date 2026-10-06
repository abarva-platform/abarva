import { evidenceById } from "@/lib/source/canonical-specs";
import type { SourceEventEvidenceCurrentState } from "@/lib/source/canvas-substrate/types";
import type { SourceContractEvidenceFamily } from "./types";

export interface ContractEvidenceReviewTarget {
  requirementId: string;
  family: SourceContractEvidenceFamily;
  targetState: SourceEventEvidenceCurrentState;
}

const REVIEW_TARGETS: Record<string, Omit<ContractEvidenceReviewTarget, "requirementId">> = {
  "EVID-SRC-SCOPE-APP-INV": {
    family: "application_inventory",
    targetState: "Usable Evidence",
  },
  "EVID-SRC-SCOPE-TICKET-HISTORY": {
    family: "ticket_volume",
    targetState: "Available",
  },
  "EVID-SRC-SCOPE-WORKFORCE": {
    family: "staffing_model",
    targetState: "Available",
  },
  "EVID-SRC-SCOPE-CURRENT-SOW": {
    family: "change_order",
    targetState: "Available",
  },
  "EVID-SRC-SCOPE-FY-CONTRACT": {
    family: "invoice_summary",
    targetState: "Available",
  },
  "EVID-SRC-SCOPE-SLA-BASELINE": {
    family: "sla_performance",
    targetState: "Parsed",
  },
};

export function contractEvidenceReviewTarget(
  requirementId: string,
): ContractEvidenceReviewTarget | null {
  const target = REVIEW_TARGETS[requirementId];
  const requirement = evidenceById(requirementId);
  if (!target || !requirement || requirement.stage !== "scope") return null;
  return { requirementId, ...target };
}

export function normalizeEvidenceReviewReason(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const reason = value.trim();
  return reason.length >= 20 ? reason.slice(0, 4_000) : null;
}
