import { azureRead } from "@/lib/data-plane/azureRead";
import {
  canonicalCioTowerTenantKey,
  formatCioTowerMoney,
} from "@/lib/cio-tower/metric-packet";
import type {
  TowerMartAiPortfolioItem,
  TowerMartCommandCenter,
  TowerMartCommandViewModel,
  TowerMartCxoAction,
  TowerMartEvidenceLineage,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
  TowerMartValueFunnelStage,
  TowerMartValueTrajectoryPoint,
} from "@/lib/cio-tower/tower-mart-view-model";

type Numeric = string | number | null | undefined;
type TowerDecisionLane = TowerMartProgramLane["decisionLane"];
type TowerSqlQuery = <R = Record<string, unknown>>(
  sql: string,
  params?: readonly unknown[],
  opts?: { missingTable?: "empty" | "throw" },
) => Promise<R[]>;

interface BoardPostureRow {
  command_center_key: string;
  tenant_key: string;
  tenant_name: string | null;
  mart_version: string;
  source_standard: string;
  formula_version: string;
  source_contract_version: string;
  dataset_version: string | null;
  source_run_id: string | null;
  as_of_period: string | null;
  refresh_timestamp: string | null;
  total_it_budget_fy26: Numeric;
  run_budget_fy26: Numeric;
  change_budget_fy26: Numeric;
  approved_program_budget_fy26: Numeric;
  ai_tagged_spend_fy26_non_additive: Numeric;
  promised_value_fy26: Numeric;
  partial_finance_validated_value_ytd: Numeric;
  realized_value_ytd_allowed: Numeric;
  value_claim_count: number | null;
  known_value_claim_count: number | null;
  unknown_value_claim_count: number | null;
  known_zero_value_claim_count: number | null;
  known_value_amount_usd: Numeric;
  finance_attested_claim_count: number | null;
  business_attested_claim_count: number | null;
  claimable_claim_count: number | null;
  usage_supported_claim_count: number | null;
  funded_no_baseline_claim_count: number | null;
  stale_claim_count: number | null;
  disputed_claim_count: number | null;
  baseline_linked_claim_count: number | null;
  target_linked_claim_count: number | null;
  actual_linked_claim_count: number | null;
  outcome_measured_claim_count: number | null;
  claimable_program_count: number | null;
  blocked_program_count: number | null;
  conflicted_program_count: number | null;
  unmeasured_program_count: number | null;
  program_count: number | null;
  ai_initiative_count: number | null;
  candidate_ai_opportunities: number | null;
  watch_pressure_signals: number | null;
  finance_validated_blocked_value: Numeric;
  promised_value_exposure: Numeric;
  run_ratio: Numeric;
  change_ratio: Numeric;
  finance_validation_ratio: Numeric;
  decision_question: string;
  executive_summary: string;
  promised_value_board_status: string | null;
  promised_value_trust_state: string | null;
  source_files: string[] | null;
  total_program_subject_count?: number | null;
  active_program_subject_count?: number | null;
  material_program_count?: number | null;
  board_scope_program_count?: number | null;
  economic_review_queue_count?: number | null;
}

interface ValueFunnelRow {
  funnel_key: string;
  sequence: number | null;
  stage_key: string;
  stage_label: string;
  value_numeric: Numeric;
  claim_count: number | null;
  known_value_claim_count: number | null;
  unknown_value_claim_count: number | null;
  known_value_amount: Numeric;
  blocked_claim_count: number | null;
  blocked_known_value_amount: Numeric;
  primary_blocker: string | null;
  primary_owner_role: string | null;
  denominator_stage_key: string | null;
  conversion_ratio: Numeric;
  claim_status: string;
  caveat: string | null;
  source_file: string | null;
  source_row: string | null;
}

interface ValueTrajectoryRow {
  tenant_key: string;
  value_case_id: string;
  program_id: string | null;
  initiative_id: string | null;
  value_case_name: string;
  value_archetype: string | null;
  period_start: unknown;
  period_end: unknown;
  fiscal_quarter: string;
  scenario: string;
  planned_investment_usd: Numeric;
  actual_spend_usd: Numeric;
  remaining_commitment_usd: Numeric;
  business_case_value_usd: Numeric;
  business_case_benefit_usd: Numeric;
  risk_adjusted_forecast_usd: Numeric;
  finance_validated_run_rate_usd: Numeric;
  realized_p_and_l_usd: Numeric;
  realized_cash_usd: Numeric;
  forecast_at_completion_usd: Numeric;
  financial_conversion_usd: Numeric;
  usage_evidence_state: string | null;
  operational_outcome_evidence_state: string | null;
  finance_attestation_state: string | null;
  source_trust_state: string | null;
  claim_state: string | null;
  dataset_version: string | null;
  source_run_id: string | null;
  source_refs: Array<Record<string, unknown>> | null;
  economic_classification: string | null;
  board_scope_state: string | null;
  material_scope_state: string | null;
  source_count: number | null;
}

interface PortfolioDecisionRow {
  decision_ref: string;
  value_case_id: string;
  program_id: string | null;
  initiative_id: string | null;
  program_name: string;
  owner_role: string | null;
  finance_owner_role: string | null;
  decision_lane: string | null;
  decision_rationale: string | null;
  approved_funding_usd: Numeric;
  funded_amount: Numeric;
  ai_tagged_spend_usd: Numeric;
  promised_value_usd: Numeric;
  finance_validated_value_usd: Numeric;
  known_supported_value: Numeric;
  proof_maturity_score: Numeric;
  risk_pressure_score: Numeric;
  usage_strength_score: Numeric;
  lineage_trust_state: string | null;
  decision_reason_code: string | null;
  amount_blocked: Numeric;
  next_gate: string | null;
  usage_metric: string | null;
  usage_actual: Numeric;
  adoption_rate_pct: Numeric;
  value_claim_status: string | null;
  tower_claim_allowed: string | null;
  required_gates: Array<Record<string, unknown>> | null;
  caveat: string | null;
  source_file: string | null;
  source_row: string | null;
}

interface AiPortfolioRow {
  ai_portfolio_key: string;
  item_name: string;
  item_kind: string | null;
  vendor_name: string | null;
  system_name: string | null;
  ai_spend_type: string | null;
  ai_spend_category: string | null;
  funding_status: string | null;
  decision_lane: string | null;
  approved_funding_usd: Numeric;
  ai_tagged_spend_usd: Numeric;
  promised_value_usd: Numeric;
  finance_validated_value_usd: Numeric;
  usage_metric: string | null;
  usage_actual: Numeric;
  adoption_rate_pct: Numeric;
  value_score: Numeric;
  readiness_score: Numeric;
  risk_score: Numeric;
  duplicate_risk: string | null;
  value_claim_status: string | null;
  tower_claim_allowed: string | null;
  caveat: string | null;
  source_file: string | null;
  source_row: string | null;
}

interface ActionQueueRow {
  action_key: string;
  sequence: number | null;
  action_lane: string | null;
  title: string;
  action_body: string;
  owner_hint: string | null;
  module_handoff: string | null;
  program_id: string | null;
  claim_id: string | null;
  proof_stage: string | null;
  blocked_decision: string | null;
  amount_exposed: Numeric;
  evidence_requirement: string | null;
  expected_source_system: string | null;
  evidence_package_id: string | null;
  owner_role: string | null;
  secondary_owner_role: string | null;
  due_window: string | null;
  due_date: unknown;
  handoff_module: string | null;
  handoff_entity_id: string | null;
  handoff_readiness: string | null;
  action_state: string | null;
  priority: string | null;
}

interface SourceTrustRow {
  lineage_key: string;
  surface_section: string;
  displayed_fact: string;
  displayed_value_text: string | null;
  displayed_value_numeric: Numeric;
  metric_or_fact_key: string | null;
  board_visible_label: string | null;
  lineage_state: string | null;
  source_count: number | null;
  source_refs: Array<Record<string, unknown>> | null;
  conflicting_values: Array<Record<string, unknown>> | null;
  authoritative_value: string | null;
  resolution_owner_role: string | null;
  resolution_state: string | null;
  source_file: string | null;
  source_row: string | null;
  source_system: string | null;
  caveat: string | null;
}

function num(value: Numeric): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNum(value: Numeric): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function count(value: number | null | undefined): number {
  return Number(value ?? 0);
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function dateText(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).slice(0, 10);
}

function nullableDateText(value: unknown): string | null {
  const text = dateText(value);
  return text.length > 0 ? text : null;
}

function tenantCandidates(values: readonly (string | null | undefined)[]) {
  const out = new Set<string>();
  for (const value of values) {
    if (!value?.trim()) continue;
    const canonical = canonicalCioTowerTenantKey(value);
    out.add(canonical);
    if (canonical === "skyharbor_global" || value === "skyharbor-air") {
      out.add("skyharbor_global");
    }
    if (
      canonical === "meridian-health" ||
      value === "meridian" ||
      value === "meridian_health_global"
    ) {
      out.add("meridian_health_global");
    }
  }
  return [...out];
}

function decisionLane(value: string | null | undefined): TowerDecisionLane {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    normalized === "fund" ||
    normalized === "fix" ||
    normalized === "freeze" ||
    normalized === "stop"
  ) {
    return normalized;
  }
  return "fix";
}

function sourceFile(row: { source_file: string | null }): string | null {
  return nullableText(row.source_file);
}

function isMissingTableError(error: unknown): boolean {
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record?.code === "string" ? record.code : "";
  const message =
    typeof record?.message === "string" ? record.message : String(error ?? "");
  return code === "42P01" || /relation .* does not exist/i.test(message);
}

async function withTowerTenantRead<T>(
  tenantKey: string,
  fn: (query: TowerSqlQuery) => Promise<T>,
): Promise<T> {
  return azureRead.withSession(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);
    const query: TowerSqlQuery = async (sql, params = [], opts = {}) => {
      try {
        return await run(sql, [...params]);
      } catch (error) {
        if (
          (opts.missingTable ?? "throw") === "empty" &&
          isMissingTableError(error)
        ) {
          return [];
        }
        throw error;
      }
    };
    return fn(query);
  });
}

function mapCommand(row: BoardPostureRow): TowerMartCommandCenter {
  const totalBudget = num(row.total_it_budget_fy26);
  const runBudget = num(row.run_budget_fy26);
  const changeBudget = num(row.change_budget_fy26);
  const valueClaimCount = count(row.value_claim_count);
  const financeAttestedClaimCount = count(row.finance_attested_claim_count);

  return {
    commandCenterKey: row.command_center_key,
    tenantKey: row.tenant_key,
    tenantName: nullableText(row.tenant_name) ?? row.tenant_key,
    martVersion: row.mart_version,
    sourceStandard: row.source_standard,
    formulaVersion: row.formula_version,
    totalItBudgetFy26: nullableNum(row.total_it_budget_fy26),
    runBudgetFy26: nullableNum(row.run_budget_fy26),
    changeBudgetFy26: nullableNum(row.change_budget_fy26),
    approvedProgramBudgetFy26: nullableNum(row.approved_program_budget_fy26),
    aiTaggedSpendFy26NonAdditive: nullableNum(
      row.ai_tagged_spend_fy26_non_additive,
    ),
    promisedValueFy26: nullableNum(row.promised_value_fy26),
    partialFinanceValidatedValueYtd: num(
      row.partial_finance_validated_value_ytd,
    ),
    realizedValueYtdAllowed: num(row.realized_value_ytd_allowed),
    claimableValue: num(row.realized_value_ytd_allowed),
    financeValidatedBlockedValue: num(row.finance_validated_blocked_value),
    promisedValueExposure: nullableNum(row.promised_value_exposure),
    totalProgramSubjectCount:
      row.total_program_subject_count == null
        ? undefined
        : count(row.total_program_subject_count),
    activeProgramSubjectCount:
      row.active_program_subject_count == null
        ? undefined
        : count(row.active_program_subject_count),
    materialProgramCount:
      row.material_program_count == null
        ? undefined
        : count(row.material_program_count),
    boardScopeProgramCount:
      row.board_scope_program_count == null
        ? undefined
        : count(row.board_scope_program_count),
    economicReviewQueueCount:
      row.economic_review_queue_count == null
        ? undefined
        : count(row.economic_review_queue_count),
    valueClaimCount,
    knownValueClaimCount: count(row.known_value_claim_count),
    unknownValueClaimCount: count(row.unknown_value_claim_count),
    knownZeroValueClaimCount: count(row.known_zero_value_claim_count),
    knownValueAmountUsd: num(row.known_value_amount_usd),
    financeAttestedClaimCount,
    businessAttestedClaimCount: count(row.business_attested_claim_count),
    claimableClaimCount: count(row.claimable_claim_count),
    usageSupportedClaimCount: count(row.usage_supported_claim_count),
    fundedNoBaselineClaimCount: count(row.funded_no_baseline_claim_count),
    staleClaimCount: count(row.stale_claim_count),
    disputedClaimCount: count(row.disputed_claim_count),
    baselineLinkedClaimCount: count(row.baseline_linked_claim_count),
    targetLinkedClaimCount: count(row.target_linked_claim_count),
    actualLinkedClaimCount: count(row.actual_linked_claim_count),
    outcomeMeasuredClaimCount: count(row.outcome_measured_claim_count),
    claimableProgramCount: count(row.claimable_program_count),
    blockedProgramCount: count(row.blocked_program_count),
    conflictedProgramCount: count(row.conflicted_program_count),
    unmeasuredProgramCount: count(row.unmeasured_program_count),
    aiInitiativeCount: count(row.ai_initiative_count),
    candidateAiOpportunities: count(row.candidate_ai_opportunities),
    watchPressureSignals: count(row.watch_pressure_signals),
    runRatio:
      nullableNum(row.run_ratio) ??
      (totalBudget > 0 ? runBudget / totalBudget : null),
    changeRatio:
      nullableNum(row.change_ratio) ??
      (totalBudget > 0 ? changeBudget / totalBudget : null),
    financeValidationRatio:
      nullableNum(row.finance_validation_ratio) ??
      (valueClaimCount > 0
        ? financeAttestedClaimCount / valueClaimCount
        : null),
    decisionQuestion: row.decision_question,
    executiveSummary: row.executive_summary,
    sourceFiles: row.source_files ?? [
      "tower.value_case",
      "tower.value_case_period",
      "tower.subject_link",
      "tower.economic_conversion",
      "tower.attestation_event",
      "tower.proof_action",
      "consumption.tower_*_v1",
    ],
  };
}

function mapValueFunnel(row: ValueFunnelRow): TowerMartValueFunnelStage {
  return {
    funnelKey: row.funnel_key,
    sequence: Number(row.sequence ?? 0),
    stageKey: row.stage_key,
    stageLabel: row.stage_label,
    valueNumeric: num(row.value_numeric),
    claimCount: count(row.claim_count),
    knownValueClaimCount: count(row.known_value_claim_count),
    unknownValueClaimCount: count(row.unknown_value_claim_count),
    knownValueAmount: num(row.known_value_amount),
    blockedClaimCount: count(row.blocked_claim_count),
    blockedKnownValueAmount: num(row.blocked_known_value_amount),
    primaryBlocker: nullableText(row.primary_blocker),
    primaryOwnerRole: nullableText(row.primary_owner_role),
    denominatorStageKey: nullableText(row.denominator_stage_key),
    conversionRatio: nullableNum(row.conversion_ratio),
    claimStatus: row.claim_status,
    caveat: nullableText(row.caveat) ?? "",
    sourceFile: sourceFile(row),
    sourceRow: nullableText(row.source_row),
  };
}

function mapValueTrajectory(
  row: ValueTrajectoryRow,
): TowerMartValueTrajectoryPoint {
  return {
    tenantKey: row.tenant_key,
    valueCaseId: row.value_case_id,
    programId: nullableText(row.program_id),
    initiativeId: nullableText(row.initiative_id),
    valueCaseName: row.value_case_name,
    valueArchetype: nullableText(row.value_archetype),
    periodStart: dateText(row.period_start),
    periodEnd: dateText(row.period_end),
    fiscalQuarter: row.fiscal_quarter,
    scenario: row.scenario,
    plannedInvestmentUsd: nullableNum(row.planned_investment_usd),
    actualSpendUsd: nullableNum(row.actual_spend_usd),
    remainingCommitmentUsd: nullableNum(row.remaining_commitment_usd),
    businessCaseValueUsd: nullableNum(row.business_case_value_usd),
    businessCaseBenefitUsd: nullableNum(row.business_case_benefit_usd),
    riskAdjustedForecastUsd: nullableNum(row.risk_adjusted_forecast_usd),
    financeValidatedRunRateUsd: nullableNum(row.finance_validated_run_rate_usd),
    realizedPAndLUsd: nullableNum(row.realized_p_and_l_usd),
    realizedCashUsd: nullableNum(row.realized_cash_usd),
    forecastAtCompletionUsd: nullableNum(row.forecast_at_completion_usd),
    financialConversionUsd: nullableNum(row.financial_conversion_usd),
    usageEvidenceState: nullableText(row.usage_evidence_state),
    operationalOutcomeEvidenceState: nullableText(
      row.operational_outcome_evidence_state,
    ),
    financeAttestationState: nullableText(row.finance_attestation_state),
    sourceTrustState: nullableText(row.source_trust_state),
    claimState: nullableText(row.claim_state),
    datasetVersion: nullableText(row.dataset_version),
    sourceRunId: nullableText(row.source_run_id),
    sourceRefs: Array.isArray(row.source_refs) ? row.source_refs : [],
    economicClassification: nullableText(row.economic_classification),
    boardScopeState: nullableText(row.board_scope_state),
    materialScopeState: nullableText(row.material_scope_state),
    sourceCount: count(row.source_count),
  };
}

function mapProgramLane(row: PortfolioDecisionRow): TowerMartProgramLane {
  return {
    laneKey: row.decision_ref,
    programCode: nullableText(row.program_id ?? row.initiative_id),
    programName: row.program_name,
    ownerRole: nullableText(row.owner_role),
    financeOwnerRole: nullableText(row.finance_owner_role),
    decisionLane: decisionLane(row.decision_lane),
    decisionRationale:
      nullableText(row.decision_rationale) ??
      "Governed value evidence is not complete enough to claim outcomes.",
    approvedFundingUsd: num(row.approved_funding_usd),
    fundedAmount: num(row.funded_amount),
    aiTaggedSpendUsd: num(row.ai_tagged_spend_usd),
    promisedValueUsd: nullableNum(row.promised_value_usd),
    financeValidatedValueUsd: num(row.finance_validated_value_usd),
    knownSupportedValue: nullableNum(row.known_supported_value),
    proofMaturityScore: nullableNum(row.proof_maturity_score),
    riskPressureScore: nullableNum(row.risk_pressure_score),
    usageStrengthScore: nullableNum(row.usage_strength_score),
    lineageTrustState: nullableText(row.lineage_trust_state),
    decisionReasonCode: nullableText(row.decision_reason_code),
    amountBlocked: nullableNum(row.amount_blocked),
    nextGate: nullableText(row.next_gate),
    usageMetric: nullableText(row.usage_metric),
    usageActual: nullableNum(row.usage_actual),
    adoptionRatePct: nullableNum(row.adoption_rate_pct),
    valueClaimStatus: nullableText(row.value_claim_status) ?? "evidence_gap",
    towerClaimAllowed: nullableText(row.tower_claim_allowed) ?? "blocked",
    requiredGates: Array.isArray(row.required_gates) ? row.required_gates : [],
    caveat: nullableText(row.caveat) ?? "",
    sourceFile: sourceFile(row),
    sourceRow: nullableText(row.source_row),
  };
}

function mapAiItem(row: AiPortfolioRow): TowerMartAiPortfolioItem {
  return {
    aiPortfolioKey: row.ai_portfolio_key,
    itemName: row.item_name,
    itemKind: nullableText(row.item_kind) ?? "usage_benefit",
    vendorName: nullableText(row.vendor_name),
    systemName: nullableText(row.system_name),
    aiSpendType: nullableText(row.ai_spend_type),
    aiSpendCategory: nullableText(row.ai_spend_category),
    fundingStatus: nullableText(row.funding_status),
    decisionLane: decisionLane(row.decision_lane),
    approvedFundingUsd: num(row.approved_funding_usd),
    aiTaggedSpendUsd: num(row.ai_tagged_spend_usd),
    promisedValueUsd: nullableNum(row.promised_value_usd),
    financeValidatedValueUsd: num(row.finance_validated_value_usd),
    usageMetric: nullableText(row.usage_metric),
    usageActual: nullableNum(row.usage_actual),
    adoptionRatePct: nullableNum(row.adoption_rate_pct),
    valueScore: num(row.value_score),
    readinessScore: num(row.readiness_score),
    riskScore: num(row.risk_score),
    duplicateRisk: nullableText(row.duplicate_risk),
    valueClaimStatus: nullableText(row.value_claim_status) ?? "usage_supported",
    towerClaimAllowed: nullableText(row.tower_claim_allowed) ?? "blocked",
    caveat: nullableText(row.caveat) ?? "",
    sourceFile: sourceFile(row),
    sourceRow: nullableText(row.source_row),
  };
}

function mapAction(row: ActionQueueRow): TowerMartCxoAction {
  return {
    actionKey: row.action_key,
    sequence: Number(row.sequence ?? 0),
    actionLane: nullableText(row.action_lane) ?? "fix",
    title: row.title,
    actionBody: row.action_body,
    ownerHint: nullableText(row.owner_hint),
    moduleHandoff: nullableText(row.module_handoff),
    programId: nullableText(row.program_id),
    claimId: nullableText(row.claim_id),
    proofStage: nullableText(row.proof_stage),
    blockedDecision: nullableText(row.blocked_decision),
    amountExposed: num(row.amount_exposed),
    evidenceRequirement: nullableText(row.evidence_requirement),
    expectedSourceSystem: nullableText(row.expected_source_system),
    evidencePackageId: nullableText(row.evidence_package_id),
    ownerRole: nullableText(row.owner_role),
    secondaryOwnerRole: nullableText(row.secondary_owner_role),
    dueWindow: nullableText(row.due_window),
    dueDate: nullableDateText(row.due_date),
    handoffModule: nullableText(row.handoff_module),
    handoffEntityId: nullableText(row.handoff_entity_id),
    handoffReadiness: nullableText(row.handoff_readiness) ?? "not_ready",
    actionState: nullableText(row.action_state) ?? "open",
    priority: nullableText(row.priority) ?? "medium",
  };
}

function mapEvidence(row: SourceTrustRow): TowerMartEvidenceLineage {
  return {
    lineageKey: row.lineage_key,
    surfaceSection: row.surface_section,
    displayedFact: row.displayed_fact,
    displayedValueText: row.displayed_value_text,
    displayedValueNumeric: nullableNum(row.displayed_value_numeric),
    metricOrFactKey: nullableText(row.metric_or_fact_key),
    boardVisibleLabel: nullableText(row.board_visible_label),
    lineageState: nullableText(row.lineage_state),
    sourceCount: count(row.source_count),
    sourceRefs: Array.isArray(row.source_refs) ? row.source_refs : [],
    conflictingValues: Array.isArray(row.conflicting_values)
      ? row.conflicting_values
      : [],
    authoritativeValue: nullableText(row.authoritative_value),
    resolutionOwnerRole: nullableText(row.resolution_owner_role),
    resolutionState: nullableText(row.resolution_state),
    sourceFile: sourceFile(row),
    sourceRow: nullableText(row.source_row),
    sourceSystem: nullableText(row.source_system),
    caveat: nullableText(row.caveat) ?? "",
  };
}

function gapsFromActions(
  actions: readonly ActionQueueRow[],
): TowerMartRequiredFieldGap[] {
  return actions
    .filter((row) => (row.action_state ?? "open").toLowerCase() === "open")
    .map((row) => ({
      gapKey: `tower-action-gap:${row.action_key}`,
      martTable: "consumption.tower_action_queue_v1",
      martRecordKey: row.action_key,
      requiredField: nullableText(row.proof_stage) ?? "proof_action",
      sourceTemplate: nullableText(row.expected_source_system) ?? "tower",
      sourceRecordId: nullableText(row.evidence_package_id),
      severity: nullableText(row.priority) ?? "medium",
      ownerHint: nullableText(row.owner_role ?? row.owner_hint),
      remediationAction: row.action_body,
      blocking: true,
    }));
}

export async function readTowerCommandCenter(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
}): Promise<TowerMartCommandViewModel | null> {
  for (const tenantKey of tenantCandidates(args.tenantKeyCandidates)) {
    const result = await withTowerTenantRead(tenantKey, async (query) => {
      const [commandRow] = await query<BoardPostureRow>(
        `select *
         from consumption.tower_board_posture_v1
        where tenant_key = $1
        order by refresh_timestamp desc nulls last
        limit 1`,
        [tenantKey],
        { missingTable: "empty" },
      );
      if (!commandRow) return null;

      const [
        valueFunnel,
        valueTrajectory,
        programLanes,
        toolRows,
        agentRows,
        cxoActions,
        evidence,
      ] = await Promise.all([
        query<ValueFunnelRow>(
          `with posture as (
             select *
               from consumption.tower_board_posture_v1
              where tenant_key = $1
              limit 1
           ),
           stages as (
             select 1 as sequence, 'promised'::text as stage_key, 'Explicit benefit'::text as stage_label,
                    promised_value_exposure as value_numeric,
                    value_claim_count as claim_count,
                    known_value_claim_count,
                    unknown_value_claim_count,
                    known_value_amount_usd as known_value_amount,
                    blocked_program_count as blocked_claim_count,
                    promised_value_exposure - realized_value_ytd_allowed as blocked_known_value_amount,
                    promised_value_board_status as primary_blocker,
                    'Tower data steward'::text as primary_owner_role,
                    null::text as denominator_stage_key,
                    null::numeric as conversion_ratio,
                    promised_value_trust_state as claim_status,
                    executive_summary as caveat,
                    'consumption.tower_board_posture_v1'::text as source_file,
                    null::text as source_row
               from posture
             union all
             select 2, 'usage_supported', 'Usage supported',
                    coalesce(sum(financial_conversion_usd) filter (where usage_evidence_state = 'present'), 0),
                    count(*) filter (where usage_evidence_state = 'present')::int,
                    count(*) filter (where usage_evidence_state = 'present' and financial_conversion_usd is not null)::int,
                    count(*) filter (where usage_evidence_state <> 'present')::int,
                    coalesce(sum(financial_conversion_usd) filter (where usage_evidence_state = 'present'), 0),
                    count(*) filter (where usage_evidence_state <> 'present')::int,
                    coalesce(sum(business_case_value_usd), 0) - coalesce(sum(financial_conversion_usd), 0),
                    'Usage evidence must be tied to value cases before value can move right.'::text,
                    'Transformation owner'::text,
                    'promised'::text,
                    null::numeric,
                    'usage_supported'::text,
                    'Adoption alone is not outcome proof.'::text,
                    'consumption.tower_value_trajectory_v1'::text,
                    null::text
               from consumption.tower_value_trajectory_v1
              where tenant_key = $1
             union all
             select 3, 'finance_validated', 'Finance validated',
                    partial_finance_validated_value_ytd,
                    finance_attested_claim_count,
                    finance_attested_claim_count,
                    value_claim_count - finance_attested_claim_count,
                    partial_finance_validated_value_ytd,
                    value_claim_count - finance_attested_claim_count,
                    finance_validated_blocked_value,
                    'Finance validation remains blocked until source authority and attestation gates clear.'::text,
                    'Finance partner'::text,
                    'promised'::text,
                    case when promised_value_exposure > 0 then partial_finance_validated_value_ytd / promised_value_exposure else null end,
                    'finance_validated'::text,
                    executive_summary,
                    'consumption.tower_board_posture_v1'::text,
                    null::text
               from posture
             union all
             select 4, 'claimable', 'Claimable',
                    realized_value_ytd_allowed,
                    claimable_claim_count,
                    claimable_claim_count,
                    unknown_value_claim_count,
                    realized_value_ytd_allowed,
                    value_claim_count - claimable_claim_count,
                    promised_value_exposure - realized_value_ytd_allowed,
                    promised_value_board_status,
                    'Finance partner'::text,
                    'promised'::text,
                    case when promised_value_exposure > 0 then realized_value_ytd_allowed / promised_value_exposure else null end,
                    'claimable'::text,
                    'Claimable requires usage, operational outcome, financial conversion, and attestation evidence.'::text,
                    'consumption.tower_board_posture_v1'::text,
                    null::text
               from posture
           )
           select
             concat('tower:', $1, ':funnel:', stage_key) as funnel_key,
             sequence,
             stage_key,
             stage_label,
             value_numeric,
             claim_count,
             known_value_claim_count,
             unknown_value_claim_count,
             known_value_amount,
             blocked_claim_count,
             blocked_known_value_amount,
             primary_blocker,
             primary_owner_role,
             denominator_stage_key,
             conversion_ratio,
             claim_status,
             caveat,
             source_file,
             source_row
           from stages
           order by sequence`,
          [tenantKey],
          { missingTable: "empty" },
        ),
        query<ValueTrajectoryRow>(
          `select *
             from consumption.tower_value_trajectory_v1
            where tenant_key = $1
              and scenario = 'forecast'
            order by period_start, value_case_id
            limit 1600`,
          [tenantKey],
          { missingTable: "empty" },
        ),
        query<PortfolioDecisionRow>(
          `select *
             from consumption.tower_portfolio_decision_v1
            where tenant_key = $1
            order by amount_blocked desc nulls last, proof_maturity_score asc, program_name
            limit 80`,
          [tenantKey],
          { missingTable: "empty" },
        ),
        query<AiPortfolioRow>(
          `select *
             from consumption.tower_tool_productivity_v1
            where tenant_key = $1
            order by ai_tagged_spend_usd desc nulls last, item_name
            limit 80`,
          [tenantKey],
          { missingTable: "empty" },
        ),
        query<AiPortfolioRow>(
          `select *
             from consumption.tower_agent_outcome_v1
            where tenant_key = $1
            order by promised_value_usd desc nulls last, item_name
            limit 80`,
          [tenantKey],
          { missingTable: "empty" },
        ),
        query<ActionQueueRow>(
          `select *
             from consumption.tower_action_queue_v1
            where tenant_key = $1
            order by
              case priority when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,
              due_date nulls last,
              amount_exposed desc nulls last`,
          [tenantKey],
          { missingTable: "empty" },
        ),
        query<SourceTrustRow>(
          `select *
             from consumption.tower_source_trust_v1
            where tenant_key = $1
            order by
              case lineage_state when 'CONFLICT' then 0 when 'ABSENT' then 1 when 'ONE_SOURCE' then 2 else 3 end,
              surface_section,
              displayed_fact`,
          [tenantKey],
          { missingTable: "empty" },
        ),
      ]);

      const command = mapCommand(commandRow);
      const aiPortfolio = [...toolRows, ...agentRows].map(mapAiItem);
      const actions = cxoActions.map(mapAction);
      const attributedSpendUsd = aiPortfolio.reduce(
        (sum, row) => sum + row.aiTaggedSpendUsd,
        0,
      );

      const headline =
        commandRow.promised_value_trust_state === "CONFLICT"
          ? `${command.tenantName} Tower has visible investment and adoption signals, but benefit source authority is CONFLICT - authority unresolved. ${formatCioTowerMoney(command.realizedValueYtdAllowed)} is claimable.`
          : command.promisedValueFy26 === null
            ? `${command.tenantName} Tower separates investment from benefit: approved investment is visible, but no explicit promised benefit assertion is loaded. ${formatCioTowerMoney(command.realizedValueYtdAllowed)} is claimable.`
            : command.executiveSummary;

      return {
        generatedFrom: "tower_schema" as const,
        headline,
        command,
        valueFunnel: valueFunnel.map(mapValueFunnel),
        valueTrajectory: valueTrajectory.map(mapValueTrajectory),
        programLanes: programLanes.map(mapProgramLane),
        aiPortfolio,
        aiPortfolioCounts: {
          total: aiPortfolio.length,
          candidate: aiPortfolio.filter(
            (row) => row.itemKind === "candidate_opportunity",
          ).length,
          active: aiPortfolio.length,
          funded: aiPortfolio.filter((row) => row.itemKind === "funded_program")
            .length,
          embeddedOrUsage: aiPortfolio.filter((row) =>
            ["embedded_platform", "usage_benefit", "service_agent"].includes(
              row.itemKind,
            ),
          ).length,
          attributedSpendUsd,
        },
        cxoActions: actions,
        evidenceLineage: evidence.map(mapEvidence),
        requiredFieldGaps: gapsFromActions(cxoActions),
      };
    });

    if (result) return result;
  }

  return null;
}
