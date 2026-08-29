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
  realizedValueYtdAllowed: number;
  valueClaimCount?: number;
  knownValueClaimCount?: number;
  claimableValue?: number;
  financeValidatedBlockedValue?: number;
  promisedValueExposure?: number | null;
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
  valueNumeric: number;
  claimCount?: number;
  knownValueClaimCount?: number;
  unknownValueClaimCount?: number;
  knownValueAmount?: number;
  blockedClaimCount?: number;
  blockedKnownValueAmount?: number;
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
  financeOwnerRole: string | null;
  decisionLane: "fund" | "fix" | "freeze" | "stop";
  decisionRationale: string;
  approvedFundingUsd: number;
  fundedAmount?: number;
  aiTaggedSpendUsd: number;
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  knownSupportedValue?: number | null;
  proofMaturityScore?: number | null;
  riskPressureScore?: number | null;
  usageStrengthScore?: number | null;
  lineageTrustState?: string | null;
  decisionReasonCode?: string | null;
  amountBlocked?: number | null;
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

export interface TowerMartAiPortfolioItem {
  aiPortfolioKey: string;
  itemName: string;
  itemKind: string;
  vendorName: string | null;
  systemName: string | null;
  aiSpendType: string | null;
  aiSpendCategory: string | null;
  fundingStatus: string | null;
  decisionLane: "fund" | "fix" | "freeze" | "stop";
  approvedFundingUsd: number;
  aiTaggedSpendUsd: number;
  promisedValueUsd: number | null;
  financeValidatedValueUsd: number;
  usageMetric: string | null;
  usageActual: number | null;
  adoptionRatePct: number | null;
  /** The rollout's own adoption target. Written by the loader as `adoption_target_pct`. */
  adoptionTargetPct: number | null;
  /** Cases this rollout supports, asserted by the source row — not inferred from a shared vendor. */
  linkedBusinessCaseCount: number | null;
  valueScore: number;
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
  sponsorRole?: string | null;
  duplicateRisk: string | null;
  valueClaimStatus: string;
  towerClaimAllowed: string;
  caveat: string;
  sourceFile: string | null;
  sourceRow: string | null;
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
  amountExposed?: number;
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
}
