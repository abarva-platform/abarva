// Source Proposal Intelligence — core contracts.
//
// Post-RFP capability: vendor response intake → health assessment → normalization →
// governed scoring (AI suggests, human decides) → commercial levers → BAFO. Extends the
// existing machinery (pricing-submissions, proposal-normalization, trap-log, BAFO pack,
// scorecard renderer) rather than duplicating it; see
// docs/source/SOURCE_VENDOR_RESPONSE_AND_PROPOSAL_INTELLIGENCE_STRATEGY.md.
//
// Hard rules carried in types: vendor isolation is structural (everything is keyed by
// event+vendor+version, and traces assert isolation); AI scores are never final; value
// claims without evidence are 'opportunity_to_test', never quantified savings.

import type { EvaluationScoreEligibility } from "../analytics/types";

// ── Vendor response intake ──────────────────────────────────────────────────

export type VendorResponseFileRole =
  | "response_package"
  | "pricing_workbook"
  | "exceptions_redlines"
  | "assumptions"
  | "exhibits"
  | "compliance_matrix"
  | "security_questionnaire"
  | "signed_forms"
  | "other";

export interface VendorResponseFile {
  role: VendorResponseFileRole;
  fileName: string;
  artifactId: string; // source_artifacts registry id
  blobPath: string;
}

export interface VendorResponseSubmission {
  sourceEventId: string;
  tenantKey: string;
  /** vendor display name — the stable key used across the existing pricing tables. */
  vendorName: string;
  responseVersion: number;
  submittedAt: string;
  submittedBy: string;
  rfpVersion: string | null;
  files: VendorResponseFile[];
  late: boolean;
  notes: string | null;
}

// ── Proposal health assessment ──────────────────────────────────────────────

export type HealthDimensionKey =
  | "completeness"
  | "instruction_compliance"
  | "answer_quality"
  | "exceptions_assumptions"
  | "pricing"
  | "sla"
  | "transition"
  | "staffing"
  | "security_compliance"
  | "delivery_model"
  | "automation_claims"
  | "subcontractors"
  | "risk_transfer"
  | "evidence_quality";

export interface HealthFinding {
  dimension: HealthDimensionKey;
  severity: "red" | "amber" | "info";
  finding: string;
  /** citation into THIS vendor's documents; null when the finding is an absence. */
  evidenceReference: string | null;
  clarificationQuestion: string | null;
}

export type ScoreReadiness =
  | "ready_to_score"
  | "score_with_caveats"
  | "not_ready";

export interface ProposalHealthAssessment {
  sourceEventId: string;
  vendorName: string;
  responseVersion: number;
  /** 0..1 — share of required RFP sections substantively answered. */
  completeness: number;
  missingSections: string[];
  findings: HealthFinding[];
  strengths: string[];
  weaknesses: string[];
  clarificationQuestions: string[];
  evaluatorFocusAreas: string[];
  scoreReadiness: ScoreReadiness;
}

// ── Minimum viable extraction profile ───────────────────────────────────────

export type VendorResponseSectionStatus =
  | "complete"
  | "partial"
  | "missing"
  | "exception";

export interface VendorResponseSectionMapRow {
  sectionNumber: number;
  rfpSection: string;
  responseReference: string;
  status: VendorResponseSectionStatus;
  notes: string;
}

export type VendorResponseExhibitKind =
  | "claim_register"
  | "productivity_commitments"
  | "pricing_workbook"
  | "staffing_location_model"
  | "sla_commitments"
  | "assumptions_exclusions"
  | "transition_milestones"
  | "commercial_exceptions"
  | "evidence_index";

export interface VendorResponseExhibitStatus {
  kind: VendorResponseExhibitKind;
  label: string;
  status: "complete" | "partial" | "missing";
  evidenceReference: string | null;
  issue: string | null;
}

export type VendorExtractionCardType =
  | "claim"
  | "pricing"
  | "productivity"
  | "staffing"
  | "sla"
  | "assumption"
  | "exception"
  | "transition";

export interface VendorExtractionCard {
  cardId: string;
  type: VendorExtractionCardType;
  title: string;
  extractedValue: string;
  evidenceReference: string | null;
  confidence: "high" | "medium" | "low";
  structuredExhibitStatus: "supported" | "partial" | "missing";
  missingFields: string[];
  finding: string;
  recommendedAction: string;
}

export interface VendorResponsePricingSummary {
  yearOneRunCostUsd: number | null;
  transitionCostUsd: number | null;
  oneTimeCostUsd: number | null;
  optionalCostUsd: number | null;
  fiveYearTcoUsd: number | null;
  pricingBasis: string;
}

export interface VendorResponseProfile {
  sourceEventId: string;
  tenantKey: string;
  vendorId: string;
  vendorName: string;
  responseVersion: number;
  syntheticDemo: boolean;
  packageSummary: string;
  narrativePageEquivalent: string;
  responseCompleteness: {
    percent: number;
    completeSections: number;
    totalSections: number;
    missingSections: string[];
    partialSections: string[];
  };
  majorClaims: string[];
  evidenceProvided: string[];
  pricingSummary: VendorResponsePricingSummary;
  productivityCommitment: string;
  staffingModelSummary: string;
  slaCommitments: string;
  assumptionsExclusions: string[];
  commercialExceptions: string[];
  transitionCommitments: string;
  unsupportedClaims: string[];
  clarificationQuestions: string[];
  negotiationLevers: string[];
  readyForEvaluation: "yes" | "no" | "conditional";
  readyReason: string;
  sectionMap: VendorResponseSectionMapRow[];
  exhibits: VendorResponseExhibitStatus[];
  extractionCards: VendorExtractionCard[];
}

// ── Challenge log + commercial leverage seeds ──────────────────────────────

export type VendorChallengeIssueCategory =
  | "unsupported_claim"
  | "pricing_gap"
  | "productivity_gap"
  | "sla_gap"
  | "staffing_coverage_gap"
  | "transition_gap"
  | "assumption_exclusion_risk"
  | "commercial_exception"
  | "scope_coverage_gap"
  | "evidence_missing";

export interface VendorChallengeLogEntry {
  challengeId: string;
  vendorId: string;
  vendorName: string;
  issueCategory: VendorChallengeIssueCategory;
  finding: string;
  evidenceLabel: string;
  severity: "high" | "medium" | "low";
  whyItMatters: string;
  clarificationQuestion: string;
  scoringImplication: string;
  readyForEvaluation: "yes" | "no" | "conditional";
}

export type CommercialLeverageType =
  | "productivity_not_priced_back"
  | "transition_fee_not_milestone_based"
  | "weak_sla_credit_economics"
  | "vague_exclusions_change_order_exposure"
  | "rate_card_or_staffing_mix_issue"
  | "outcome_claim_not_committed"
  | "support_not_staffed"
  | "pricing_not_comparable"
  | "proposal_claim_not_supported"
  | "commercial_exception_buyer_risk";

export interface CommercialLeverageSeed {
  seedId: string;
  vendorId: string;
  vendorName: string;
  leverType: CommercialLeverageType;
  finding: string;
  evidenceLabel: string;
  buyerRisk: string;
  recommendedAsk: string;
  bafoLanguage: string;
  confidence: "high" | "medium" | "low";
  estimatedImpact: string;
}

export interface VendorChallengeIntelligence {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  challengeCount: number;
  leverageSeedCount: number;
  challengeLog: VendorChallengeLogEntry[];
  leverageSeeds: CommercialLeverageSeed[];
}

// ── BAFO instruction pack ──────────────────────────────────────────────────

export type VendorBafoQuestionPriority = "must_resolve" | "should_improve";

export interface VendorBafoQuestion {
  questionId: string;
  vendorId: string;
  vendorName: string;
  priority: VendorBafoQuestionPriority;
  category: string;
  question: string;
  requiredResponseFormat: string;
  evidenceLabel: string;
  buyerRisk: string;
  scoringDisposition: string;
  sourceChallengeId: string;
  sourceLeverageSeedId: string;
}

export interface VendorBafoVendorInstruction {
  vendorId: string;
  vendorName: string;
  readyForEvaluation: "yes" | "no" | "conditional";
  priority: "high" | "medium" | "low";
  instructionCount: number;
  mustResolveBeforeScoring: string[];
  questions: VendorBafoQuestion[];
}

export interface VendorBafoInstructionPack {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  roundLabel: string;
  executiveSummary: string;
  vendorCount: number;
  questionCount: number;
  commonResponseRequirements: string[];
  completenessCriteria: string[];
  scoringHoldbacks: string[];
  vendorInstructions: VendorBafoVendorInstruction[];
}

// ── Evaluation scorecard decision view ─────────────────────────────────────

export type VendorEvaluationRecommendation =
  | "advance_to_bafo"
  | "advance_with_conditions"
  | "hold_until_clarified";

export interface VendorEvaluationValue {
  vendorId: string;
  vendorName: string;
  value: string;
  posture: "strength" | "watch" | "risk";
  caveat: string;
  evidenceLabel: string;
}

export interface VendorEvaluationComparisonRow {
  comparisonId: string;
  label: string;
  decisionUse: string;
  values: VendorEvaluationValue[];
}

export interface VendorEvaluationScoreValue {
  vendorId: string;
  vendorName: string;
  score: number;
  weightedContribution: number;
  rationale: string;
  evidenceLabel: string;
  confidence: "high" | "medium" | "low";
  scoreEligibility: EvaluationScoreEligibility;
  scoreReadinessLabel: string;
  scoreReadinessAction: string;
}

export interface VendorEvaluationScorecardRow {
  criterionId: string;
  label: string;
  weight: number;
  guidance: string;
  scores: VendorEvaluationScoreValue[];
}

export interface VendorEvaluationVendorSummary {
  vendorId: string;
  vendorName: string;
  rank: number;
  weightedScore: number;
  readiness: VendorResponseProfile["readyForEvaluation"];
  recommendation: VendorEvaluationRecommendation;
  decisionRationale: string;
  tradeoffs: string[];
  conditions: string[];
  finalistPosture: string;
}

export interface VendorEvaluationScoreImpact {
  vendorId: string;
  vendorName: string;
  currentScore: number;
  potentialScore: number;
  scoreDelta: number;
  bafoCure: string;
  requiredEvidence: string;
  decisionImpact: string;
}

export interface VendorEvaluationDecisionView {
  sourceEventId: string;
  tenantKey: string;
  generatedAt: string;
  scoreBasis: string;
  finalistRecommendation: string;
  scoringTransparency: string[];
  vendorCount: number;
  comparisonRows: VendorEvaluationComparisonRow[];
  scorecardRows: VendorEvaluationScorecardRow[];
  vendorSummaries: VendorEvaluationVendorSummary[];
  scoreImprovementScenarios: VendorEvaluationScoreImpact[];
  executiveTradeoffs: string[];
  leadingVendorId: string;
  cheapestVendorId: string;
  highestTransitionRiskVendorId: string;
  recommendedAdvanceVendorIds: string[];
}

// ── Normalization ───────────────────────────────────────────────────────────

export type NormalizedCategory =
  | "scope_coverage"
  | "service_tower_coverage"
  | "sla_commitments"
  | "transition_approach"
  | "staffing_model"
  | "delivery_locations"
  | "solution_architecture"
  | "automation_productivity"
  | "governance_model"
  | "tooling_approach"
  | "security_compliance"
  | "commercial_model"
  | "pricing_structure"
  | "assumptions_dependencies"
  | "exceptions_redlines"
  | "innovation_value_add"
  | "risk_positions";

export interface ProposalNormalizationRow {
  sourceEventId: string;
  vendorName: string;
  responseVersion: number;
  rfpSection: string;
  normalizedCategory: NormalizedCategory;
  vendorResponseSummary: string;
  evidenceReference: string | null;
  /** the comparable value — null when the vendor's answer is non-comparable. */
  normalizedAnswer: string | null;
  confidence: "high" | "medium" | "low";
  completeness: "complete" | "partial" | "missing";
  /** why this is not apples-to-apples, when it isn't. */
  deviations: string[];
  assumptions: string[];
  evaluatorNotes: string | null;
}

// ── Scoring (AI suggests · human decides) ───────────────────────────────────

export interface EvaluationCriterion {
  criteriaId: string;
  category: string;
  description: string;
  /** weights across criteria should sum to ~100. */
  weight: number;
  scoringScale: string; // e.g. '1-5'
  evaluatorRole: string;
  requiredEvidence: string[];
  scoringGuidance: string;
  redFlags: string[];
  /** criteria are usable for final scoring only once a named client user approves. */
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface VendorScore {
  sourceEventId: string;
  vendorName: string;
  responseVersion: number;
  criteriaId: string;
  aiSuggestedScore: number | null;
  aiRationale: string | null;
  evidenceReference: string | null;
  aiConfidence: "high" | "medium" | "low" | null;
  evaluatorScore: number | null;
  evaluatorComment: string | null;
  evaluatorId: string | null;
  overrideReason: string | null;
  /** final = evaluator's decision; never auto-filled from AI alone. */
  finalScore: number | null;
  locked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
}

// ── Negotiation levers / price optimization ─────────────────────────────────

export type LeverType =
  | "pricing_structure"
  | "cola_indexation"
  | "productivity_commitment"
  | "cost_transparency"
  | "transition_risk"
  | "volume_banding"
  | "service_credits"
  | "automation_savings"
  | "location_mix"
  | "subcontractor_terms"
  | "rate_card"
  | "volume_commitment"
  | "termination_assistance"
  | "innovation_fund"
  | "scope_protection"
  | "payment_milestones"
  | "gainshare"
  | "pass_through";

export interface NegotiationLever {
  leverId: string;
  vendorName: string | "all";
  leverType: LeverType;
  currentIssue: string;
  negotiationAsk: string;
  /** quantified ONLY with evidence; otherwise 'opportunity_to_test' with null range. */
  valueBasis: "evidenced" | "opportunity_to_test";
  expectedValueLowUsd: number | null;
  expectedValueHighUsd: number | null;
  confidence: "high" | "medium" | "low";
  evidenceBasis: string[];
  owner: string;
  bafoPriority: "P0" | "P1" | "P2";
}

// ── Context bundle trace (vendor isolation proof) ───────────────────────────

export interface SourceProposalContextBundleTrace {
  trace_id: string;
  source_event_id: string;
  vendor_name: string;
  proposal_version: number;
  tenant_id: string;
  archetype: string;
  evaluation_stage: string;
  rfp_requirements_retrieved: number;
  vendor_response_files_retrieved: string[];
  normalized_categories: string[];
  evidence_used: string[];
  pricing_inputs_used: string[];
  excluded_objects_by_reason: Record<string, number>;
  scoring_criteria_used: string[];
  assumptions: string[];
  missing_inputs: string[];
  model_input_context_hash: string;
  claims_detected: number;
  claims_supported: number;
  claims_unsupported: number;
  citations_emitted: string[];
  tenant_leakage_status: "clean" | "leak_detected";
  vendor_isolation_status: "isolated" | "violation_detected";
}
