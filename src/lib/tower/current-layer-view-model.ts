// Shared Tower current-layer view-model contract.
//
// This file intentionally contains types only. The old cio_tower mart reader
// remains isolated under src/lib/cio-tower while current Tower routes read the
// ECL-backed consumption/serving path.

export interface TowerMartCommandCenter {
  commandCenterKey: string;
  tenantKey: string;
  tenantName: string;
  martVersion: string;
  sourceStandard: string;
  formulaVersion: string;
  /** Reporting period the posture row covers. Absent or null when the source did not record one. */
  asOfPeriod?: string | null;
  /** When the posture row was last built. Absent or null when the source did not record one. */
  refreshTimestamp?: string | null;
  totalItBudgetFy26: number | null;
  runBudgetFy26: number | null;
  changeBudgetFy26: number | null;
  approvedProgramBudgetFy26: number | null;
  aiTaggedSpendFy26NonAdditive: number | null;
  promisedValueFy26: number | null;
  partialFinanceValidatedValueYtd: number;
  /** At least one approved Finance row carried an explicit amount. */
  financeValidatedAmountLoaded?: boolean;
  realizedValueYtdAllowed: number;
  /** At least one claim carried an explicit amount and a valid reporting period. */
  claimableAmountLoaded?: boolean;
  valueClaimCount?: number;
  /** Outcome-measure source records kept separate from benefit claims. */
  valueProofOutcomeRecordCount?: number;
  knownValueClaimCount?: number;
  claimableValue?: number;
  financeValidatedBlockedValue?: number;
  promisedValueExposure?: number | null;
  /** True only when a blocked amount and cleared amount cover the same period. */
  blockedValueComparable?: boolean;
  comparableBlockedValue?: number | null;
  totalProgramSubjectCount?: number;
  activeProgramSubjectCount?: number;
  materialProgramCount?: number;
  boardScopeProgramCount?: number;
  economicReviewQueueCount?: number;
  unknownValueClaimCount?: number;
  knownZeroValueClaimCount?: number;
  knownValueAmountUsd?: number;
  financeAttestedClaimCount?: number;
  businessAttestedClaimCount?: number;
  claimableClaimCount?: number;
  usageSupportedClaimCount?: number;
  fundedNoBaselineClaimCount?: number;
  staleClaimCount?: number;
  disputedClaimCount?: number;
  baselineLinkedClaimCount?: number;
  targetLinkedClaimCount?: number;
  actualLinkedClaimCount?: number;
  outcomeMeasuredClaimCount?: number;
  claimableProgramCount?: number;
  blockedProgramCount?: number;
  conflictedProgramCount?: number;
  unmeasuredProgramCount?: number;
  aiInitiativeCount?: number;
  candidateAiOpportunities: number;
  watchPressureSignals: number;
  runRatio: number | null;
  changeRatio: number | null;
  financeValidationRatio: number | null;
  decisionQuestion: string;
  executiveSummary: string;
  sourceFiles: string[];
}

export interface TowerMartValueFunnelStage {
  funnelKey: string;
  sequence: number;
  stageKey: string;
  stageLabel: string;
  valueNumeric: number | null;
  claimCount?: number;
  knownValueClaimCount?: number;
  unknownValueClaimCount?: number;
  knownValueAmount?: number | null;
  blockedClaimCount?: number;
  blockedKnownValueAmount?: number | null;
  primaryBlocker?: string | null;
  primaryOwnerRole?: string | null;
  denominatorStageKey: string | null;
  conversionRatio: number | null;
  claimStatus: string;
  caveat: string;
  sourceFile: string | null;
  sourceRow: string | null;
}

export interface TowerMartValueTrajectoryPoint {
  tenantKey: string;
  valueCaseId: string;
  programId: string | null;
  initiativeId: string | null;
  valueCaseName: string;
  valueArchetype: string | null;
  periodStart: string;
  periodEnd: string;
  fiscalQuarter: string;
  scenario: string;
  plannedInvestmentUsd: number | null;
  actualSpendUsd: number | null;
  remainingCommitmentUsd: number | null;
  businessCaseValueUsd: number | null;
  businessCaseBenefitUsd: number | null;
  riskAdjustedForecastUsd: number | null;
  financeValidatedRunRateUsd: number | null;
  realizedPAndLUsd: number | null;
  realizedCashUsd: number | null;
  forecastAtCompletionUsd: number | null;
  financialConversionUsd: number | null;
  usageEvidenceState: string | null;
  operationalOutcomeEvidenceState: string | null;
  financeAttestationState: string | null;
  sourceTrustState: string | null;
  claimState: string | null;
  datasetVersion: string | null;
  sourceRunId: string | null;
  sourceRefs: Array<Record<string, unknown>>;
  economicClassification: string | null;
  boardScopeState: string | null;
  materialScopeState: string | null;
  sourceCount: number;
}

export interface TowerMartProgramLane {
  laneKey: string;
  programCode: string | null;
  programName: string;
  ownerRole: string | null;
  /** The business domain, from the loader's `domain_name`. Not the sponsor. */
  domainName?: string | null;
  /** Functions explicitly marked as affected by this program; not a funding-domain classification. */
  affectedFunctions?: Array<{ functionId: string; functionName: string }>;
  technologyOwnerRole?: string | null;
  sourceProgramStatus?: string | null;
  sourceProgramPhase?: string | null;
  financeOwnerRole: string | null;
  decisionLane: "fund" | "fix" | "freeze" | "stop" | "unclassified";
  decisionRationale: string;
  approvedFundingUsd: number;
  /** Source-listed program plan, with fiscal period and approval unverified. */
  planningBudgetUsd?: number | null;
  /** Source planning assertion; never an approved or earned return. */
  sourceExpectedValueUsd?: number | null;
  sourceStartDate?: string | null;
  sourceEndDate?: string | null;
  sourcePctComplete?: number | null;
  sourceStageGate?: string | null;
  sourceBenefitRealizationStart?: string | null;
  sourceBlockedReason?: string | null;
  sourceObjective?: string | null;
  sourceTargetOutcomes?: string | null;
  fundedAmount?: number;
  /** The source explicitly records an approved FY26 amount for this program. */
  fundingAmountLoaded?: boolean;
  aiTaggedSpendUsd: number;
  /** Whether any spend was recorded. The value above is coerced to 0 when nothing was. */
  aiSpendLoaded?: boolean;
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  /** True only when an approved Finance record carries an explicit amount. */
  financeValidatedAmountLoaded?: boolean;
  /** Explicit claimable amount with approved evidence and a valid reporting period. */
  reportableClaimableValueUsd?: number | null;
  knownSupportedValue?: number | null;
  proofMaturityScore?: number | null;
  riskPressureScore?: number | null;
  usageStrengthScore?: number | null;
  lineageTrustState?: string | null;
  decisionReasonCode?: string | null;
  amountBlocked?: number | null;
  blockedAmountComparable?: boolean;
  nextGate?: string | null;
  usageMetric: string | null;
  usageActual: number | null;
  adoptionRatePct: number | null;
  valueClaimStatus: string;
  towerClaimAllowed: string;
  requiredGates: Array<Record<string, unknown>>;
  caveat: string;
  sourceFile: string | null;
  sourceRow: string | null;
}

/** One dated finance event on a case, as the source recorded it. */
export interface TowerMartFinanceApprovalEvent {
  eventDate: string | null;
  eventType: string | null;
  approvalState: string | null;
  approverRole: string | null;
  amountUsd: number;
  amountBasis: string | null;
  note: string | null;
}

/** One evidence item on file against a case. */
export interface TowerMartEvidenceItem {
  evidenceName: string | null;
  evidenceType: string | null;
  ownerRole: string | null;
  freshnessState: string | null;
  confidence: string | null;
}

/** One month of the value waterfall, as the source recorded it. */
export interface TowerMartValueObservationMonth {
  month: string;
  actualValue: number | null;
  reviewerRole: string | null;
  sponsorClaimedUsd: number;
  financeReviewedUsd: number;
  financeValidatedUsd: number;
  boardClaimableUsd: number;
  validationState: string | null;
}

export type TowerAiAmountBasis =
  | "approved_funding"
  | "annualized_tool_cost"
  | "unknown";

export type TowerAiPopulationKind =
  | "ai_case"
  | "tool_rollout"
  | "usage_observation"
  | "unknown";

export interface TowerMartAiPortfolioItem {
  aiPortfolioKey: string;
  itemName: string;
  itemKind: string;
  /** Declared serving page and canonical object relationship, not a source filename. */
  populationKind?: TowerAiPopulationKind;
  vendorName: string | null;
  systemName: string | null;
  aiSpendType: string | null;
  aiSpendCategory: string | null;
  fundingStatus: string | null;
  decisionLane: "fund" | "fix" | "freeze" | "stop" | "unclassified";
  approvedFundingUsd: number;
  aiTaggedSpendUsd: number;
  /** Distinguishes an approved allocation from a yearly tool-cost estimate. */
  aiAmountBasis?: TowerAiAmountBasis;
  /** Whether any spend was recorded. The value above is coerced to 0 when nothing was. */
  aiSpendLoaded?: boolean;
  /** Initiative-detail fields, each carried from its own canonical column. */
  projectName?: string | null;
  lifecycleStage?: string | null;
  financePartnerRole?: string | null;
  successMetric?: string | null;
  paybackMonthsTarget?: number | null;
  valueObservationMonths?: TowerMartValueObservationMonth[];
  actualSpendYtdUsd?: number | null;
  forecastSpendUsd?: number | null;
  technologyOwnerRole?: string | null;
  targetGoLiveDate?: string | null;
  realizationStartMonth?: string | null;
  metricBaselineValue?: number | null;
  metricTargetValue?: number | null;
  metricUnit?: string | null;
  benefitRealizationLagMonths?: number | null;
  financeApprovalEvents?: TowerMartFinanceApprovalEvent[];
  evidenceItems?: TowerMartEvidenceItem[];
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  /** True only when an approved Finance record carries an explicit amount. */
  financeValidatedAmountLoaded?: boolean;
  usageMetric: string | null;
  rolloutGoal?: string | null;
  rolloutStage?: string | null;
  rolloutTargetUsers?: number | null;
  /** Provisioned or enabled users for a tool rollout. Null when the source did not record it. */
  enabledUsers?: number | null;
  usageActual: number | null;
  adoptionRatePct: number | null;
  /** The rollout's own adoption target. Written by the loader as `adoption_target_pct`. */
  adoptionTargetPct: number | null;
  /** Cases this rollout supports, asserted by the source row — not inferred from a shared vendor. */
  linkedBusinessCaseCount: number | null;
  valueScore: number;
  /** False when the source has no valid 0-100 value score. */
  valueScoreLoaded?: boolean;
  /** Declared 0-100 score. Null when the source did not record one — never substituted. */
  readinessScore: number | null;
  /** Written upstream as (100 - readinessScore); carries no independent signal. */
  riskScore: number | null;
  /** Finance pipeline stage. Written on case payloads only, so it is also what separates a
   *  business case from a tool rollout. Distinct from `fundingStatus`, which is a fallback chain. */
  financeStatus?: string | null;
  /** The named obstacle. Across the portfolio this, not readiness, separates validated from blocked. */
  gatingConstraint?: string | null;
  confidenceLevel?: string | null;
  businessValueType?: string | null;
  costToBuildLowUsd?: number | null;
  costToBuildHighUsd?: number | null;
  controlBlocker?: string | null;
  /** Whether the source asserted anything for the blocker — `none` included. */
  controlBlockerReviewed?: boolean;
  sponsorRole?: string | null;
  businessFunction?: string | null;
  businessSegmentKey?: string | null;
  sourceCaseStatus?: string | null;
  operationalOwnerRole?: string | null;
  expectedValueArchetype?: string | null;
  sourceValueHypothesis?: string | null;
  sourceApprovalPath?: string | null;
  sourceRiskControls?: string | null;
  sourceRequiredSystems?: string | null;
  duplicateRisk: string | null;
  valueClaimStatus: string;
  towerClaimAllowed: string;
  caveat: string;
  sourceFile: string | null;
  sourceRow: string | null;
  sourceSystem?: string | null;
  sourceRecordId?: string | null;
  extractDate?: string | null;
  sourceAsOfDate?: string | null;
  refreshCadence?: string | null;
  sourceQualityState?: string | null;
}

export interface TowerMartCxoAction {
  actionKey: string;
  sequence: number;
  actionLane: string;
  title: string;
  actionBody: string;
  ownerHint: string | null;
  moduleHandoff: string | null;
  programId?: string | null;
  claimId?: string | null;
  proofStage?: string | null;
  blockedDecision?: string | null;
  amountExposed?: number | null;
  evidenceRequirement?: string | null;
  expectedSourceSystem?: string | null;
  evidencePackageId?: string | null;
  ownerRole?: string | null;
  secondaryOwnerRole?: string | null;
  dueWindow?: string | null;
  dueDate?: string | null;
  handoffModule?: string | null;
  handoffEntityId?: string | null;
  handoffReadiness?: string;
  actionState?: string;
  priority?: string;
}

export interface TowerMartEvidenceLineage {
  lineageKey: string;
  surfaceSection: string;
  displayedFact: string;
  displayedValueText: string | null;
  displayedValueNumeric: number | null;
  metricOrFactKey?: string | null;
  boardVisibleLabel?: string | null;
  lineageState?: string | null;
  sourceCount?: number;
  sourceRefs?: Array<Record<string, unknown>>;
  conflictingValues?: Array<Record<string, unknown>>;
  authoritativeValue?: string | null;
  resolutionOwnerRole?: string | null;
  resolutionState?: string | null;
  sourceFile: string | null;
  sourceRow: string | null;
  sourceSystem: string | null;
  caveat: string;
}

export interface TowerMartRequiredFieldGap {
  gapKey: string;
  martTable: string;
  martRecordKey: string;
  requiredField: string;
  sourceTemplate: string;
  sourceRecordId: string | null;
  severity: string;
  ownerHint: string | null;
  remediationAction: string;
  blocking: boolean;
}

export interface TowerMartAiPortfolioCounts {
  total: number;
  candidate: number;
  active: number;
  funded: number;
  embeddedOrUsage: number;
  attributedSpendUsd: number;
}

export interface TowerMartCostDetail {
  id: string;
  label: string;
  amountUsd: number;
  sourceFile: string;
  sourceRow: number;
  sourceSha256: string;
  sourcePriorYearActualUsd?: number | null;
  sourceForecastNextYearUsd?: number | null;
  sourceSavingsOpportunityUsd?: number | null;
  sourceCalculationBasis?: string | null;
  sourceBudgetOwnerRole?: string | null;
}

/** Source assertions stay outside approved funding, benefit and claimable totals. */
export interface TowerMartSourceValueRow {
  id: string;
  kind: "outcome_measure" | "ai_feed_claim";
  title: string;
  sourceFiles: string[];
  baseline: string | null;
  target: string | null;
  observed: string | null;
  baselinePeriod: string | null;
  observedPeriod: string | null;
  kpiName: string | null;
  kpiUnit: string | null;
  kpiPeriodStart: string | null;
  kpiPeriodEnd: string | null;
  sourceDataSource: string | null;
  sourceCalculationBasis: string | null;
  moneyAssertions: Array<{ sourceField: string; label: string; amountUsd: number }>;
  statusAssertions: Array<{ sourceField: string; label: string; code: string }>;
}

/** Declared-ID source inventory; these rows never contribute to Tower money or graph totals. */
export interface TowerMartFoundationRecord {
  id: string;
  objectType: string;
  sourceObjectId: string;
  canonicalObjectId: string;
  sourceRecordId: string;
  name: string;
  sourceFields: Record<string, string | number>;
  sourceFile: string;
  sourceRow: number | null;
  sourceSha256: string;
  qualityLabel: string;
  reviewState: string;
  segmentIdentityStatus: string | null;
}

export interface TowerMartFoundationInventory {
  records: TowerMartFoundationRecord[];
  totalRecords: number;
  matchingRecords: number;
  page: number;
  pageSize: number;
  filter: string;
  search: string;
  /** Projection rows omitted because a declared identity or source reference was incomplete. */
  unreadableRowCount: number;
  rawMaturityRowsWithoutId: number | null;
  rawRelationshipRows: number | null;
  segmentRowsMappingPending: number | null;
  itsmExtractAvailable: boolean | null;
}

export interface TowerMartCostLens {
  modeledAnnualSpendUsd: number;
  sourceNarrativeDifferenceUsd: number | null;
  categories: TowerMartCostDetail[];
  contractExposure: TowerMartCostDetail[];
}

export interface TowerMartCommandViewModel {
  generatedFrom: "cio_tower_mart" | "tower_schema" | "ecl_serving";
  headline: string;
  command: TowerMartCommandCenter;
  valueFunnel: TowerMartValueFunnelStage[];
  valueTrajectory?: TowerMartValueTrajectoryPoint[];
  programLanes: TowerMartProgramLane[];
  aiPortfolio: TowerMartAiPortfolioItem[];
  cxoActions: TowerMartCxoAction[];
  evidenceLineage: TowerMartEvidenceLineage[];
  requiredFieldGaps: TowerMartRequiredFieldGap[];
  aiPortfolioCounts?: TowerMartAiPortfolioCounts;
  costLens?: TowerMartCostLens | null;
  /** v6 source assertions for separate outcome/AI feed records, never headline money. */
  sourceValueRows?: TowerMartSourceValueRow[];
  /** Exact-ID source inventory for the Foundations tab; no derived links or value. */
  foundationInventory?: TowerMartFoundationInventory | null;
}
