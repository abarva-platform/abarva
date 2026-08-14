export type SourceEvidenceMode =
  | "evidence_rich"
  | "evidence_partial"
  | "evidence_light";

export type SourceConfidence = "high" | "medium" | "low";

export type SourceEvidenceType =
  | "contract_msa"
  | "statement_of_work"
  | "pricing_schedule"
  | "rate_card"
  | "invoice_history"
  | "sla_report"
  | "ticket_history"
  | "staffing_model"
  | "change_order_ledger"
  | "renewal_notice"
  | "vendor_response_narrative"
  | "vendor_claim_register"
  | "pricing_workbook"
  | "staffing_location_model"
  | "sla_commitment_table"
  | "assumptions_exclusions_log"
  | "commercial_exceptions_table"
  | "transition_plan"
  | "governance_minutes"
  | "other";

export interface SourceEvidenceReference {
  evidenceId: string;
  evidenceType: SourceEvidenceType;
  fileName: string;
  sourceLabel: string;
  sourceSection?: string | null;
  dateRange?: string | null;
  confidence: SourceConfidence;
  syntheticDemoFlag?: boolean;
}

export interface SourceEvidenceReadiness {
  mode: SourceEvidenceMode;
  completenessScore: number;
  requiredEvidencePresent: SourceEvidenceType[];
  requiredEvidenceMissing: SourceEvidenceType[];
  optionalEvidencePresent: SourceEvidenceType[];
  assumptions: string[];
  cannotQuantify: string[];
  recommendedDataRequests: string[];
  confidence: SourceConfidence;
  proofBoundaryScore: number;
  stageReadiness: "ready" | "conditional" | "not_ready";
}

export type SourceBusinessImpact =
  | "cost"
  | "risk"
  | "speed"
  | "service_customer"
  | "compliance_governance"
  | "vendor_accountability";

export interface SourceAnalyticFinding {
  id: string;
  title: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  finding: string;
  evidenceUsed: SourceEvidenceReference[];
  evidenceMissing: SourceEvidenceType[];
  quantifiedImpactLowUsd?: number | null;
  quantifiedImpactHighUsd?: number | null;
  directionalImpact?: string | null;
  confidence: SourceConfidence;
  assumptions: string[];
  recommendedAction: string;
  sourcingStage:
    | "strategy"
    | "scope"
    | "rfp"
    | "responses"
    | "evaluation"
    | "pricing"
    | "bafo"
    | "executive_decision"
    | "contract_optimization"
    | "transition";
  businessImpact: SourceBusinessImpact[];
}

export interface SourceExecutiveStoryPayload {
  executiveMessage: string[];
  decisionRequired: string;
  commercialOpportunityMap: Array<{
    theme:
      | "recover_cash"
      | "reduce_future_spend"
      | "reduce_risk"
      | "increase_vendor_accountability";
    label: string;
    findings: string[];
    action: string;
  }>;
  exposureDrivers: Array<{
    driver: string;
    lowUsd: number | null;
    highUsd: number | null;
    confidence: SourceConfidence;
    caveat: string;
  }>;
  doNothingScenario: string[];
  decisionTimeline: Array<{
    step: string;
    timing: string;
    decisionOwner: string;
    exitCriteria: string;
  }>;
  businessImpactMapping: Array<{
    impact: SourceBusinessImpact;
    readout: string;
    linkedFindings: string[];
  }>;
  evidenceCaveats: string[];
  recommendedNextActions: string[];
  suggestedAvaAnswerFrame: {
    directAnswer: string;
    evidence: string[];
    implication: string;
    action: string;
  };
}

export interface ContractOptimizationAnalyticsInput {
  currentAnnualRunRateUsd: number;
  renewalNoticeDate: string;
  termEnd: string;
  evidenceRefs: SourceEvidenceReference[];
  invoiceLines: Array<{
    month: string;
    contractedAmountUsd: number;
    invoicedAmountUsd: number;
    evidenceId: string;
  }>;
  staffingCommitments: Array<{
    tower: string;
    committedFte: number;
    observedFte: number;
    evidenceId: string;
  }>;
  changeOrders: Array<{
    requestId: string;
    amountUsd: number;
    recurring: boolean;
    catalogMapped: boolean;
    approvalEvidence: "complete" | "partial" | "missing";
    evidenceId: string;
  }>;
  slas: Array<{
    serviceLevel: string;
    target: string;
    actual: string;
    creditCap: string;
    chronicMissLanguage: string;
    evidenceId: string;
  }>;
  operationalBaselines: Array<{
    metric: string;
    baseline: number;
    current: number;
    unit: string;
    evidenceId: string;
  }>;
}

export interface ContractOptimizationAnalytics {
  readiness: SourceEvidenceReadiness;
  runRateUsd: number;
  exposureLowUsd: number | null;
  exposureHighUsd: number | null;
  exposureLabel: string;
  exposureDrivers: SourceExecutiveStoryPayload["exposureDrivers"];
  findings: SourceAnalyticFinding[];
  recommendedPath: string[];
  doNothingScenario: string[];
  dataRequests: string[];
}

export interface VendorResponseMveInput {
  vendorId: string;
  vendorName: string;
  evidenceRefs: SourceEvidenceReference[];
  sections: Array<{ section: string; answered: boolean; evidenceId?: string }>;
  claims: Array<{
    claimId: string;
    claim: string;
    supported: boolean;
    evidenceId?: string;
    commercialCommitment?: boolean;
  }>;
  pricing: {
    fiveYearTcoUsd?: number | null;
    yearOneRunCostUsd?: number | null;
    transitionCostUsd?: number | null;
    comparable: boolean;
    gaps: string[];
  };
  staffing: {
    rolesProvided: boolean;
    locationMixProvided: boolean;
    coverageModelProvided: boolean;
    riskNotes: string[];
  };
  sla: {
    targetsProvided: boolean;
    creditsProvided: boolean;
    capsProvided: boolean;
    exclusionsProvided: boolean;
    riskNotes: string[];
  };
  transition: {
    milestonesProvided: boolean;
    dependenciesProvided: boolean;
    exitCriteriaProvided: boolean;
    riskNotes: string[];
  };
  assumptions: string[];
  exceptions: string[];
}

export interface VendorResponseAnalytics {
  vendorId: string;
  vendorName: string;
  readiness: SourceEvidenceReadiness;
  responseCompletenessScore: number;
  unsupportedClaims: string[];
  pricingComparabilityScore: number;
  transitionReadinessScore: number;
  slaStrengthScore: number;
  staffingCoverageRiskScore: number;
  readyForEvaluation: "yes" | "conditional" | "no";
  clarificationQuestions: string[];
  findings: SourceAnalyticFinding[];
}

export interface EvaluationCategoryScore {
  category: string;
  weight: number;
  score: number;
  rationale: string;
}

export type EvaluationScoreEligibility =
  | "scoreable"
  | "clarification_required"
  | "not_scoreable";

export interface EvaluationCriterionEvidenceInput {
  vendorId: string;
  vendorName: string;
  category: string;
  weight: number;
  proposedScore: number;
  rationale: string;
  evidenceRefs: SourceEvidenceReference[];
  requiredEvidence: SourceEvidenceType[];
  clarificationPrompt?: string;
}

export interface EvaluationCriterionScoreReadiness {
  vendorId: string;
  vendorName: string;
  category: string;
  eligibility: EvaluationScoreEligibility;
  score: EvaluationCategoryScore | null;
  evidenceCompletenessScore: number;
  evidenceUsed: SourceEvidenceType[];
  evidenceMissing: SourceEvidenceType[];
  blockers: string[];
  nextAction: string;
}

export interface VendorEvaluationInput {
  vendorId: string;
  vendorName: string;
  categoryScores: EvaluationCategoryScore[];
  unresolvedConditions: string[];
  evidenceCompletenessScore: number;
  posture: string;
}

export interface VendorEvaluationResult {
  vendorId: string;
  vendorName: string;
  weightedScore: number;
  riskAdjustedScore: number;
  rank: number;
  readiness: "advance" | "conditional" | "hold";
  unresolvedConditions: string[];
  executiveTradeoff: string;
  postBafoScore: number;
  categoryScores: EvaluationCategoryScore[];
}

export interface BafoLeverInput {
  vendorId: string;
  vendorName: string;
  issue: string;
  severity: "high" | "medium" | "low";
  valueAtStakeUsd?: number | null;
  category: string;
  evidenceBasis: string;
  cureCondition: string;
  scoreImpact: number;
}

export interface BafoLever {
  vendorId: string;
  vendorName: string;
  issue: string;
  rank: number;
  severity: "high" | "medium" | "low";
  estimatedImpactUsd: number | null;
  scoreImpact: number;
  recommendedAsk: string;
  suggestedBafoLanguage: string;
  cureCondition: string;
  decisionImplication: string;
  confidence: SourceConfidence;
  evidenceBasis: string;
}
