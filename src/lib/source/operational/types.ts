import type { SourceEventShellView } from "@/lib/source/source-event-shell-v2";

export const AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID =
  "airline-demo-new-source-operational-demo-v1.0.0";

export const AIRLINE_SOURCE_OPERATIONAL_EVENT_ID =
  "srcop-airdn-ops-crew-platform-2026";

export const AIRLINE_SOURCE_OPERATIONAL_RELEASE_HASH_SHA256 =
  "1d86dc440b8d88e314a1f3d354ecec1c552a400b0585d6bba98c6da4b73d496e";

export type SourceOperationalSyntheticLabel =
  "synthetic_source_operational_demo";

export interface SourceOperationalKnowledgeContext {
  provider: "KnowledgeConsumptionProvider";
  tenantKey: string;
  frozenV1Status: string;
  baselineRef: string;
  limitation: string;
}

export interface SourceOperationalEventRecord {
  eventId: string;
  eventCode: string;
  tenantKey: string;
  releaseId: string;
  scenario: string;
  name: string;
  currentStage: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  knowledgeContext: SourceOperationalKnowledgeContext;
}

export interface SourceOperationalRequirementRecord {
  id: string;
  eventId: string;
  category: string;
  statement: string;
  weight: number;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  evidenceRefs: string[];
}

export interface SourceOperationalVendorRecord {
  id: string;
  eventId: string;
  displayName: string;
  name?: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalProposalRecord {
  id: string;
  eventId: string;
  vendorId: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalProposalResponseRecord {
  id: string;
  eventId: string;
  proposalId: string;
  requirementId: string;
  vendorId: string;
  response: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalCriterionRecord {
  id: string;
  eventId: string;
  label: string;
  weight: number;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalEvaluationRecord {
  id: string;
  eventId: string;
  proposalId: string;
  vendorId: string;
  scores: Record<string, number>;
  weightedScore: number;
  evaluatorComment: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
}

export interface SourceOperationalPricingLine {
  type: string;
  amountUsd: number;
}

export interface SourceOperationalPricingRecord {
  id: string;
  eventId: string;
  proposalId: string;
  vendorId: string;
  currency: "USD";
  lines: SourceOperationalPricingLine[];
  totalYearOneUsd: number;
  serviceCreditCapPct: number;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
}

export interface SourceOperationalBafoRecord {
  id: string;
  eventId: string;
  proposalId: string;
  vendorId: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalFinalScore {
  vendorId: string;
  proposalId: string;
  evaluationScore: number;
  priceScore: number;
  finalScore: number;
  yearOneUsd: number;
  bafoYearOneUsd: number;
  riskPenalty: number;
}

export interface SourceOperationalRecommendationRecord {
  id: string;
  eventId: string;
  recommendedVendorId: string;
  decision: string;
  rationale: string;
  finalScores: SourceOperationalFinalScore[];
  evidenceRefs: string[];
  syntheticDataLabel: SourceOperationalSyntheticLabel;
}

export interface SourceOperationalTransitionCommitmentRecord {
  id: string;
  eventId: string;
  recommendationId: string;
  vendorId: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalValueScorecardRecord {
  id: string;
  eventId: string;
  metrics: Array<{
    id: string;
    label: string;
    annualValueUsd: number;
    confidence: string;
  }>;
  totalAnnualValueUsd: number;
  caveat: string;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalDecisionBriefRecord {
  id: string;
  eventId: string;
  title: string;
  sections: string[];
  exportProofRequired: boolean;
  syntheticDataLabel: SourceOperationalSyntheticLabel;
  [key: string]: unknown;
}

export interface SourceOperationalRelease {
  event: SourceOperationalEventRecord;
  requirements: SourceOperationalRequirementRecord[];
  vendors: SourceOperationalVendorRecord[];
  proposals: SourceOperationalProposalRecord[];
  proposalResponses: SourceOperationalProposalResponseRecord[];
  criteria: SourceOperationalCriterionRecord[];
  evaluations: SourceOperationalEvaluationRecord[];
  pricing: SourceOperationalPricingRecord[];
  bafo: SourceOperationalBafoRecord[];
  recommendation: SourceOperationalRecommendationRecord;
  transitionCommitments: SourceOperationalTransitionCommitmentRecord[];
  valueScorecard: SourceOperationalValueScorecardRecord;
  decisionBrief: SourceOperationalDecisionBriefRecord;
}

export interface SourceOperationalReleaseManifest {
  releaseId: string;
  tenantKey: string;
  generatedAt: string;
  sourceBasis: SourceOperationalSyntheticLabel;
  knowledgeContext: SourceOperationalKnowledgeContext;
  releaseHashSha256: string;
  objectCounts: Record<string, number>;
  loadPolicy: {
    allowed: "lab_only_source_operational_schema";
    forbidden: string[];
  };
  expectedUiConsumers: string[];
}

export interface SourceOperationalValidationSummary {
  releaseId: string;
  ok: boolean;
  checks: Record<string, boolean>;
}

export interface SourceOperationalPackage {
  release: SourceOperationalRelease;
  manifest: SourceOperationalReleaseManifest;
  validation: SourceOperationalValidationSummary;
}

export interface SourceOperationalProviderIdentity {
  provider: "SourceOperationalProvider";
  mode: "file_release_package" | "lab_data_plane";
  releaseId: string;
  releaseHashSha256: string;
  tenantKey: string;
  eventId: string;
}

export interface SourceOperationalProvider {
  readonly identity: SourceOperationalProviderIdentity;
  getRelease(): Promise<SourceOperationalPackage>;
}

export interface SourceOperationalWorkflowStep {
  key:
    | "event"
    | "requirements"
    | "vendor_participation"
    | "proposals"
    | "evaluation"
    | "pricing"
    | "bafo"
    | "recommendation"
    | "decision_brief"
    | "transition"
    | "evidence";
  label: string;
  status: "ready" | "blocked";
  count: number;
  sourceBasis:
    | SourceOperationalSyntheticLabel
    | "governed_v1_knowledge_context";
}

export interface SourceOperationalProofViewModel {
  releaseId: string;
  releaseHashSha256: string;
  tenantKey: string;
  eventId: string;
  eventCode: string;
  scenario: string;
  sourceBasis: SourceOperationalSyntheticLabel;
  providerIdentity: SourceOperationalProviderIdentity;
  knowledgeContext: SourceOperationalKnowledgeContext;
  objectCounts: Record<string, number>;
  validationChecks: Record<string, boolean>;
  workflow: SourceOperationalWorkflowStep[];
  recommendation: {
    recommendedVendorId: string;
    decision: string;
    rationale: string;
    finalScores: SourceOperationalFinalScore[];
  };
  limitations: string[];
  shellView: SourceEventShellView;
}
