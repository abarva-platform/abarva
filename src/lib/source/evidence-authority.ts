import type { SourceEvidenceClass, SourceEvidenceRequirement } from "./canonical-specs/evidence-requirements";
import type { SourceEventEvidence } from "./canvas-substrate";

const RECORD_BACKED_CLASSES = new Set<SourceEvidenceClass>([
  "approved_agreement",
  "change_order",
  "cloud_consumption",
  "contract_term",
  "finance_value_confirmation",
  "invoice",
  "payment",
  "rate_card",
  "renewal",
  "service_credit",
  "sla",
  "supplier_offer",
  "usage",
  "workforce",
]);

const RECORD_BACKED_REQUIREMENTS = new Set([
  "EVID-SRC-STR-TRIGGER",
]);

const ABSENCE_DECLARATION_REQUIREMENTS = new Set([
  "EVID-SRC-STR-INCUMBENT",
  "EVID-SRC-STR-SPEND-BASELINE",
  "EVID-SRC-SCOPE-FY-CONTRACT",
  "EVID-SRC-SCOPE-CURRENT-SOW",
]);

export type EvidenceAssessment = Pick<SourceEventEvidence, "requirementId" | "currentState"> &
  Partial<Pick<SourceEventEvidence,
    "sourceArtifactId" | "sourceEventFactIds" | "applicabilityStatus" |
    "applicabilityReason" | "applicabilityActorUserId" | "applicabilityDecidedAt"
  >>;

export function permitsAbsenceDeclaration(requirementId: string): boolean {
  return ABSENCE_DECLARATION_REQUIREMENTS.has(requirementId);
}

export function hasAuditedAbsence(
  requirement: SourceEvidenceRequirement,
  evidence: EvidenceAssessment | undefined,
): boolean {
  return Boolean(
    evidence &&
    permitsAbsenceDeclaration(requirement.requirementId) &&
    evidence.requirementId === requirement.requirementId &&
    evidence.applicabilityStatus === "not_applicable" &&
    evidence.currentState === "Not Requested" &&
    !hasRecordedSource(evidence) &&
    (evidence.applicabilityReason?.trim().length ?? 0) >= 24 &&
    evidence.applicabilityActorUserId?.trim() &&
    evidence.applicabilityDecidedAt &&
    !Number.isNaN(Date.parse(evidence.applicabilityDecidedAt)),
  );
}

const EVIDENCE_RANK: Record<SourceEventEvidence["currentState"], number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

export function requiresRecordedSource(requirement: SourceEvidenceRequirement): boolean {
  return (
    RECORD_BACKED_REQUIREMENTS.has(requirement.requirementId) ||
    RECORD_BACKED_CLASSES.has(requirement.evidenceClass)
  );
}

export function hasRecordedSource(evidence: EvidenceAssessment | undefined): boolean {
  return Boolean(evidence?.sourceArtifactId || evidence?.sourceEventFactIds?.length);
}

export function evidenceHasMinimumState(
  requirement: SourceEvidenceRequirement,
  evidence: EvidenceAssessment | undefined,
): boolean {
  return Boolean(evidence && EVIDENCE_RANK[evidence.currentState] >= EVIDENCE_RANK[requirement.minimumState]);
}

export function evidenceMeetsRequirement(
  requirement: SourceEvidenceRequirement,
  evidence: EvidenceAssessment | undefined,
): boolean {
  if (hasAuditedAbsence(requirement, evidence)) return true;
  if (!evidenceHasMinimumState(requirement, evidence)) return false;
  if (requiresRecordedSource(requirement) && !hasRecordedSource(evidence)) return false;
  return true;
}
