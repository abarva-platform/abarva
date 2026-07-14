import type { EvidenceRef, KnowledgeTruthStatus } from "./evidence-ref";

export type ContextGapSeverity = "info" | "warning" | "blocker";

export type ContextGapCategory =
  | "missing_evidence"
  | "missing_owner"
  | "missing_metric"
  | "missing_relationship"
  | "candidate_only"
  | "stale_source"
  | "unsupported_claim_risk"
  | "privacy_or_control";

export interface ContextGap {
  gapId: string;
  tenantKey: string;
  category: ContextGapCategory;
  severity: ContextGapSeverity;
  title: string;
  description: string;
  affectedEntityIds: string[];
  requiredEvidence: string[];
  truthStatus: KnowledgeTruthStatus;
  evidenceRefs: EvidenceRef[];
  blocksActivePromotion: boolean;
  blocksModuleAnswer?: boolean;
}
