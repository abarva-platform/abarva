// Tower Command Center v2 — the shape the design consumes.
//
// This is the *presentation* contract for
// `docs/design/tower/command-center-2026-07-23/tower-command-center-design.html`.
// It deliberately mirrors that file's `data()` shape (CC / PROG / AI / CAND /
// LENS / GAPS / ACT) so the views can be transcribed from the design without
// reinterpreting them — but every field is populated from the governed
// governed Tower read models, never from the design file's mock content.
//
// Money is carried in **whole USD**, exactly as the mart stores it. The
// design's `$M` rendering is a formatting concern and lives in `format.ts`;
// no layer below the components divides by 1e6.

/** The four decision lanes the mart already carries, plus the mart-absent
 *  "watch" bucket the design renders for run-and-sustain programs. */
export type TowerLaneKey = "fund" | "fix" | "freeze" | "stop" | "watch";

/** Usage-evidence strength. Derived — see `derive.ts`. */
export type TowerUsageStatus = "strong" | "weak" | "none";

/** Finance-validation strength. Derived — see `derive.ts`. */
export type TowerFinanceStatus = "validated" | "partial" | "none";

/** The design's five AI spend types. Mapped from `itemKind` / `aiSpendType`. */
export type TowerAiKind =
  | "funded"
  | "embedded"
  | "candidate"
  | "governance"
  | "platform";

export type TowerAiDisplayBucketBasis =
  | "ai_spend_category"
  | "item_kind"
  | "fallback_keyword"
  | "fallback_default";

export type TowerSemanticSource = "tower_mart" | "derived_compatibility";

export type TowerProofSequenceStatus =
  | "ordered"
  | "finance_validation_ahead_of_usage_evidence";

export type TowerAiSpendAttributionStatus =
  | "item_attributed"
  | "category_attributed"
  | "shared_platform"
  | "portfolio_only"
  | "unattributed";

export interface TowerPortfolioCountReconciliation {
  sourceItemCount: number | null;
  canonicalItemCount: number | null;
  martItemCount: number;
  eligibleItemCount: number;
  displayCandidateCount: number;
  totalCandidateCount: number;
  plottedItemCount: number;
  excludedItemCount: number;
  exclusionReasons: readonly string[];
}

/**
 * Posture-tile / week-read aggregates. One per tenant.
 *
 * `usageSupportedUsd`, `claimableUsd` and `blockedUsd` are derived (§2.8 of the
 * handoff prompt); everything else is a mart column read straight through.
 */
export interface TowerCommandSummary {
  tenantKey: string;
  tenantName: string;
  /** Mart provenance, surfaced in the header + evidence tab. */
  martVersion: string;
  formulaVersion: string;
  sourceStandard: string;
  sourceFiles: readonly string[];
  /** Reporting period the numbers cover. Null means the source did not record one. */
  asOfPeriod: string | null;
  /** When the underlying posture row was built. Null means the source did not record one. */
  refreshTimestamp: string | null;

  budgetUsd: number | null;
  runUsd: number | null;
  changeUsd: number | null;
  approvedInvestmentUsd: number | null;
  aiTaggedUsd: number;

  promisedBenefitUsd: number | null;
  promisedBenefitLoaded: boolean;
  promisedUsd: number;
  usageSupportedUsd: number;
  financeValidatedUsd: number;
  claimableUsd: number;
  blockedUsd: number;
  valueClaimCount: number;
  knownValueClaimCount: number;
  financeValidatedBlockedUsd: number;
  promisedValueExposureUsd: number;
  unknownValueClaimCount: number;
  knownZeroValueClaimCount: number;
  knownValueAmountUsd: number;
  financeAttestedClaimCount: number;
  businessAttestedClaimCount: number;
  claimableClaimCount: number;
  usageSupportedClaimCount: number;
  fundedNoBaselineClaimCount: number;
  staleClaimCount: number;
  disputedClaimCount: number;
  baselineLinkedClaimCount: number;
  targetLinkedClaimCount: number;
  actualLinkedClaimCount: number;
  outcomeMeasuredClaimCount: number;
  claimableProgramCount: number;
  blockedProgramCount: number;
  conflictedProgramCount: number;
  unmeasuredProgramCount: number;

  programCount: number;
  totalProgramSubjectCount: number;
  activeProgramSubjectCount: number;
  materialProgramCount: number;
  boardScopeProgramCount: number;
  economicReviewQueueCount: number;
  aiInitiativeCount: number;
  candidateAiCount: number;
  watchPressureSignals: number;

  runRatio: number | null;
  changeRatio: number | null;
  financeValidationRatio: number | null;

  /** Governed narrative already written by the mart — never re-generated here. */
  decisionQuestion: string;
  executiveSummary: string;

  /**
   * Share of AI-tagged spend held by the top three vendors, 0–100. `null` when
   * the AI portfolio carries no vendor attribution — the design's tile then
   * renders an honest unknown rather than a fabricated percentage.
   */
  vendorConcentrationPct: number | null;

  aiAttributedInitiativeSpendUsd: number;
  aiSharedPlatformSpendUsd: number;
  aiUnallocatedSpendUsd: number;
  aiSpendAttributionStatus: TowerAiSpendAttributionStatus;

  /**
   * True when the command centre reports AI-tagged spend but no AI portfolio row
   * carries any. The spend lens and bubble sizing then have nothing to encode,
   * and the page says so instead of drawing an empty chart under a headline
   * figure it cannot substantiate.
   */
  aiSpendUnattributed: boolean;
}

/** One row of the value waterfall, straight from `mart_value_funnel`. */
export interface TowerFunnelStage {
  key: string;
  label: string;
  sequence: number;
  valueUsd: number;
  claimStatus: string;
  caveat: string;
  sourceFile: string | null;
  claimCount: number;
  knownValueClaimCount: number;
  unknownValueClaimCount: number;
  knownValueAmount: number;
  blockedClaimCount: number;
  blockedKnownValueAmount: number;
  primaryBlocker: string | null;
  primaryOwnerRole: string | null;
}

export type TowerConversionBridgeStageKey =
  | "investment"
  | "adoption"
  | "workflow_change"
  | "operating_outcome"
  | "economic_conversion"
  | "finance_validation"
  | "realized";

export interface TowerConversionBridgeStage {
  key: TowerConversionBridgeStageKey;
  label: string;
  valueUsd: number | null;
  count: number | null;
  note: string;
  source: string;
  tone: "teal" | "amber" | "red" | "gray";
}

export interface TowerTrajectoryPoint {
  fiscalQuarter: string;
  periodStart: string;
  periodEnd: string;
  plannedInvestmentUsd: number | null;
  actualSpendUsd: number | null;
  businessCaseBenefitUsd: number | null;
  riskAdjustedForecastUsd: number | null;
  financeValidatedRunRateUsd: number | null;
  realizedPAndLUsd: number | null;
  realizedCashUsd: number | null;
  financialConversionUsd: number | null;
  boardScopeCaseCount: number;
  sourceTrustState: string | null;
}

/** One program — the Decision Lanes table, Kanban card and heatmap point. */
export interface TowerProgramView {
  /** Stable id used for drawer routing and E2E selectors. */
  id: string;
  name: string;
  ownerRole: string | null;
  financeOwnerRole: string | null;
  functionLabel: string | null;
  lane: TowerLaneKey;

  fundedUsd: number;
  promisedUsd: number;
  promisedBenefitLoaded: boolean;
  usageSupportedUsd: number;
  financeValidatedUsd: number;
  claimableUsd: number;
  blockedUsd: number;
  fundedAmountUsd: number;
  knownSupportedValueUsd: number;
  proofMaturityScore: number;
  riskPressureScore: number;
  usageStrengthScore: number;
  lineageTrustState: string | null;
  decisionReasonCode: string | null;

  usageStatus: TowerUsageStatus;
  financeStatus: TowerFinanceStatus;
  usageMetric: string | null;
  usageActual: number | null;
  adoptionRatePct: number | null;

  /** 0–100. Heatmap X axis. Derived — see `derive.ts`. */
  evidenceMaturity: number;
  /** 0–3. The `.pips` control. Derived — see `derive.ts`. */
  proofLevel: number;
  /** Bridge diagnostic until Layer 5 persists proof-sequence semantics. */
  proofSequenceStatus: TowerProofSequenceStatus;
  proofSequenceExplanation: string | null;
  semanticSource: TowerSemanticSource;
  /** Matrix exposure: source-backed benefit when present, otherwise approved capital. */
  valueAtStakeUsd: number;

  /** The next required gate, or null when the mart records none. */
  nextGate: string | null;
  /** Why this program sits in its lane — mart `decision_rationale`. */
  blocker: string | null;
  /** Mart caveat, rendered as "The read" in the drawer. */
  note: string | null;
  sourceFile: string | null;
}

/** One usage-evidence bar inside a drawer. */
export interface TowerUsageBar {
  label: string;
  valueText: string;
  /** 0–100 bar fill. */
  pct: number;
  tone: "teal" | "amber" | "red";
}

/** One AI portfolio item — bubble point, table row and drawer. */
export interface TowerAiView {
  /** 1-based ordinal shown inside the bubble and in the legend list. */
  n: number;
  id: string;
  name: string;
  /** Original mart business meaning; never overwritten by visual grouping. */
  originalItemKind: string;
  kind: TowerAiKind;
  displayBucket: TowerAiKind;
  displayBucketBasis: TowerAiDisplayBucketBasis;
  mappingPolicyVersion: string;
  category: string | null;
  vendor: string | null;
  system: string | null;
  /** 0–100, mart `value_score`. Bubble Y axis. */
  valueScore: number;
  /** 0–100, mart `readiness_score`. Bubble X axis. */
  readinessScore: number;
  /** 0–100, mart `risk_score`. Candidate pipeline diagnostic. */
  riskScore: number;
  /** Bubble size. */
  aiSpendUsd: number;
  promisedUsd: number;
  promisedBenefitLoaded: boolean;
  financeValidatedUsd: number;
  /** Recommended posture — mart-derived, never invented. */
  posture: string;
  usageHeadline: string | null;
  usageBars: readonly TowerUsageBar[];
  note: string | null;
  sourceFile: string | null;
}

/** A not-funded candidate, listed separately from approved spend. */
export interface TowerCandidateView {
  n: number;
  id: string;
  name: string;
  reason: string;
  strategicAttractiveness: number;
  executionFeasibility: number;
  evidenceStrength: number;
  dependencyRisk: number;
  classification: string;
  reasonSelected: string;
}

/** One bar of the AI spend lens. */
export interface TowerSpendLensRow {
  category: string;
  valueUsd: number;
  kind: TowerAiKind;
}

/**
 * What kind of gap this is.
 *
 * `usage` / `finance` / `claim_gate` are **business evidence gaps** — proof a
 * CXO needs before value can be claimed. `pipeline` is a data-quality gap from
 * `mart_required_field_gaps` ("this mart column is unpopulated; rerun the
 * projection"), which is an ops backlog item owned by the data team and is NOT
 * shown on the executive Evidence tab.
 */
export type TowerEvidenceGapKind =
  | "usage"
  | "finance"
  | "claim_gate"
  | "pipeline";

/** One evidence gap — the Evidence tab and its drawer. */
export interface TowerEvidenceGapView {
  id: string;
  kind: TowerEvidenceGapKind;
  gapStage: TowerEvidenceGapKind;
  primaryBlockingGap: boolean;
  /** Human-readable grouping, e.g. "Usage evidence" or "Value attestation". */
  area: string;
  linkedProgram: string | null;
  missing: string;
  why: string;
  /** The decision held until this arrives. */
  blockedDecision: string;
  owner: string | null;
  priority: "high" | "medium" | "low";
  blocking: boolean;
  sourceTemplate: string | null;
  /** Promised value that cannot be claimed until this gap closes. */
  valueAtStakeUsd: number | null;
  promisedValueExposedUsd: number;
  validatedValueHeldUsd: number;
  claimableValueBlockedUsd: number;
  sourceProgramId: string | null;
  sourceEvidenceRefs: readonly string[];
  gapPolicyVersion: string;
}

/** One proven evidence item — the Evidence tab's "what exists" answer. */
export interface TowerEvidenceFactView {
  id: string;
  name: string;
  detail: string;
  metricText: string;
  unit: string;
  tone: "teal" | "amber" | "red";
  tag: string;
  sourceSystem: string | null;
  sourceFile: string | null;
  sourceRow: string | null;
  lineageState: string | null;
  sourceCount: number;
  resolutionOwnerRole: string | null;
  resolutionState: string | null;
}

export type TowerEvidenceMaturityStageKey =
  | "funded"
  | "baseline"
  | "usage"
  | "outcome"
  | "finance"
  | "claimable"
  | "realized";

export type TowerEvidenceMaturityTone = "teal" | "amber" | "red" | "gray";

export interface TowerEvidenceMaturityStage {
  key: TowerEvidenceMaturityStageKey;
  label: string;
  claimCount: number;
  knownValueUsd: number;
  unknownValueCount: number;
  missingGate: string;
  ownerRole: string;
  nextAction: string;
  tone: TowerEvidenceMaturityTone;
}

export type TowerEvidenceGapLedgerKey =
  | "missing_baseline"
  | "missing_target"
  | "missing_actual"
  | "missing_outcome_metric"
  | "missing_attribution"
  | "missing_quality_guardrail"
  | "missing_risk_guardrail"
  | "missing_finance_attestation"
  | "missing_business_attestation";

export interface TowerEvidenceGapLedgerItem {
  key: TowerEvidenceGapLedgerKey;
  label: string;
  count: number;
  ownerRole: string;
  nextAction: string;
  evidenceBasis: string;
  tone: TowerEvidenceMaturityTone;
}

export type TowerInterventionLaneKey =
  | "establish_baseline"
  | "instrument_outcome"
  | "validate_attribution"
  | "complete_guardrails"
  | "obtain_attestation"
  | "ready_for_decision";

export interface TowerInterventionLane {
  key: TowerInterventionLaneKey;
  label: string;
  count: number;
  description: string;
  nextAction: string;
  tone: TowerEvidenceMaturityTone;
}

export interface TowerEvidenceIntervention {
  id: string;
  title: string;
  ownerRole: string;
  why: string;
  nextAction: string;
}

export interface TowerEvidenceMaturityView {
  headline: string;
  summaryRead: string;
  valueStatus: string;
  stages: readonly TowerEvidenceMaturityStage[];
  gapLedger: readonly TowerEvidenceGapLedgerItem[];
  interventionLanes: readonly TowerInterventionLane[];
  interventions: readonly TowerEvidenceIntervention[];
}

/** One CXO action card. */
export interface TowerActionView {
  id: string;
  sequence: number;
  ownerRole: string;
  lane: Exclude<TowerLaneKey, "watch">;
  title: string;
  decision: string;
  why: string;
  evidence: string;
  due: string | null;
  amountExposedUsd: number;
  evidenceRequirement: string | null;
  expectedSourceSystem: string | null;
  evidencePackageId: string | null;
  proofStage: string | null;
  handoffReadiness: string | null;
  actionState: string | null;
  priority: string | null;
  linkedProgram: string | null;
  /** The Move that approving this action would create. */
  moveTitle: string;
  /** Mart `module_handoff` — the routing target, or null when none is governed. */
  moduleHandoff: string | null;
}

/**
 * Everything the Command Center page renders. Assembled by
 * `buildTowerCommandCenterView()` from `TowerMartCommandViewModel`.
 */
export interface TowerCommandCenterView {
  summary: TowerCommandSummary;
  funnel: readonly TowerFunnelStage[];
  conversionBridge: readonly TowerConversionBridgeStage[];
  valueTrajectory: readonly TowerTrajectoryPoint[];
  programs: readonly TowerProgramView[];
  ai: readonly TowerAiView[];
  candidates: readonly TowerCandidateView[];
  /**
   * Every AI portfolio row the mart carries — funded, embedded, governance,
   * platform AND candidates — uncapped and unsorted by policy.
   *
   * `ai` and `candidates` are the *executive defaults*: the matrix plots the
   * top 10 and the candidate pipeline lists the top 10, so a 232-row portfolio
   * stays readable. Without this collection those caps would make rows 11+
   * unreachable in the UI even though the mart holds them. Table mode reads
   * this so the full portfolio is always available behind search and filters.
   */
  allInitiatives: readonly TowerAiView[];
  portfolioCounts: TowerPortfolioCountReconciliation;
  spendLens: readonly TowerSpendLensRow[];
  /** Business evidence gaps — what proof is missing before value can be claimed. */
  gaps: readonly TowerEvidenceGapView[];
  /** Executive maturity diagnosis for sparse evidence states and reload work. */
  evidenceMaturity: TowerEvidenceMaturityView;
  /**
   * Data-pipeline gaps from `mart_required_field_gaps`. Kept separate and off
   * the executive Evidence tab: "populate this column and rerun the projection"
   * is an ops backlog item, not a CXO evidence answer.
   */
  pipelineGaps: readonly TowerEvidenceGapView[];
  evidenceFacts: readonly TowerEvidenceFactView[];
  actions: readonly TowerActionView[];
  /**
   * Design slots with no governed data behind them for this tenant. The page
   * renders an honest unknown state in each and the PR lists them. Never
   * silently filled with a plausible number.
   */
  unknownSlots: readonly string[];
}
