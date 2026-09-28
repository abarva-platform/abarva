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
  return RECORD_BACKED_CLASSES.has(requirement.evidenceClass);
}

export function hasRecordedSource(evidence: SourceEventEvidence | undefined): boolean {
  return Boolean(evidence?.sourceArtifactId || evidence?.sourceEventFactIds?.length);
}

export function evidenceHasMinimumState(
  requirement: SourceEvidenceRequirement,
  evidence: SourceEventEvidence | undefined,
): boolean {
  return Boolean(evidence && EVIDENCE_RANK[evidence.currentState] >= EVIDENCE_RANK[requirement.minimumState]);
}

export function evidenceMeetsRequirement(
  requirement: SourceEvidenceRequirement,
  evidence: SourceEventEvidence | undefined,
): boolean {
  if (!evidenceHasMinimumState(requirement, evidence)) return false;
  if (requiresRecordedSource(requirement) && !hasRecordedSource(evidence)) return false;
  return true;
}
