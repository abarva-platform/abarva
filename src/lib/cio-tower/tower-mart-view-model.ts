import { azureRead } from "@/lib/data-plane/azureRead";
import {
  canonicalCioTowerTenantKey,
  formatCioTowerMoney,
} from "@/lib/cio-tower/metric-packet";

export interface TowerMartCommandCenter {
  commandCenterKey: string;
  tenantKey: string;
  tenantName: string;
  martVersion: string;
  sourceStandard: string;
  formulaVersion: string;
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
  valueScore: number;
  readinessScore: number;
  riskScore: number;
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
  generatedFrom: "cio_tower_mart" | "tower_schema";
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

interface CommandRow {
  command_center_key: string;
  tenant_key: string;
  tenant_name: string;
  mart_version: string;
  source_standard: string;
  formula_version: string;
  total_it_budget_fy26: string | number | null;
  run_budget_fy26: string | number | null;
  change_budget_fy26: string | number | null;
  approved_program_budget_fy26: string | number | null;
  ai_tagged_spend_fy26_non_additive: string | number | null;
  promised_value_fy26: string | number | null;
  partial_finance_validated_value_ytd: string | number;
  realized_value_ytd_allowed: string | number;
  claimable_value?: string | number | null;
  finance_validated_blocked_value?: string | number | null;
  promised_value_exposure?: string | number | null;
  value_claim_count?: number | null;
  known_value_claim_count?: number | null;
  unknown_value_claim_count?: number | null;
  known_zero_value_claim_count?: number | null;
  known_value_amount_usd?: string | number | null;
  finance_attested_claim_count?: number | null;
  business_attested_claim_count?: number | null;
  claimable_claim_count?: number | null;
  usage_supported_claim_count?: number | null;
  funded_no_baseline_claim_count?: number | null;
  stale_claim_count?: number | null;
  disputed_claim_count?: number | null;
  baseline_linked_claim_count?: number | null;
  target_linked_claim_count?: number | null;
  actual_linked_claim_count?: number | null;
  outcome_measured_claim_count?: number | null;
  claimable_program_count?: number | null;
  blocked_program_count?: number | null;
  conflicted_program_count?: number | null;
  unmeasured_program_count?: number | null;
  candidate_ai_opportunities: number;
  watch_pressure_signals: number;
  run_ratio: string | number | null;
  change_ratio: string | number | null;
  finance_validation_ratio: string | number | null;
  decision_question: string;
  executive_summary: string;
  source_files: string[] | null;
}

function num(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNum(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function towerMartStageLabel(value: string | null | undefined): string {
  const label = String(value ?? "");
  return label.toLowerCase() === "realized value allowed"
    ? "Claimable value allowed"
    : label;
}

export function towerMartMoney(value: number): string {
  return formatCioTowerMoney(value);
}

function towerMartNullableMoney(value: number | null): string {
  return value === null ? "not loaded" : towerMartMoney(value);
}

export async function loadTowerMartCommandView(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
}): Promise<TowerMartCommandViewModel | null> {
  const tenantKeys = Array.from(
    new Set(
      args.tenantKeyCandidates
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => canonicalCioTowerTenantKey(value)),
    ),
  );
  if (tenantKeys.length === 0) return null;

  for (const tenantKey of tenantKeys) {
    const [command] = await azureRead.query<CommandRow>(
      `select *
         from cio_tower.mart_command_center
        where tenant_key = $1
        order by updated_at desc
        limit 1`,
      [tenantKey],
      { missingTable: "empty" },
    );
    if (!command) continue;

    const [
      valueFunnel,
      programLanes,
      aiPortfolio,
      aiPortfolioCountRows,
      cxoActions,
      evidenceLineage,
      requiredFieldGaps,
    ] = await Promise.all([
      azureRead.query<Record<string, unknown>>(
        `select * from cio_tower.mart_value_funnel where tenant_key = $1 order by sequence`,
        [tenantKey],
        { missingTable: "empty" },
      ),
      azureRead.query<Record<string, unknown>>(
        `select * from cio_tower.mart_program_decision_lanes where tenant_key = $1 order by decision_lane, approved_funding_usd desc, program_name`,
        [tenantKey],
        { missingTable: "empty" },
      ),
      azureRead.query<Record<string, unknown>>(
        `select *
           from cio_tower.mart_ai_portfolio
          where tenant_key = $1
          order by
            case item_kind
              when 'funded_program' then 0
              when 'embedded_platform' then 1
              when 'usage_benefit' then 2
              when 'candidate_opportunity' then 3
              else 4
            end,
            value_score desc,
            readiness_score desc,
            item_name`,
        [tenantKey],
        { missingTable: "empty" },
      ),
      azureRead.query<Record<string, unknown>>(
        `select
              count(*)::int as total,
              count(*) filter (where item_kind = 'candidate_opportunity')::int as candidate,
              count(*) filter (where item_kind <> 'candidate_opportunity')::int as active,
              count(*) filter (where item_kind = 'funded_program')::int as funded,
              count(*) filter (where item_kind in ('embedded_platform', 'usage_benefit'))::int as embedded_or_usage,
              coalesce(sum(ai_tagged_spend_usd), 0) as attributed_spend_usd
             from cio_tower.mart_ai_portfolio
            where tenant_key = $1`,
        [tenantKey],
        { missingTable: "empty" },
      ),
      azureRead.query<Record<string, unknown>>(
        `select * from cio_tower.mart_cxo_actions where tenant_key = $1 order by sequence`,
        [tenantKey],
        { missingTable: "empty" },
      ),
      azureRead.query<Record<string, unknown>>(
        `select * from cio_tower.mart_evidence_lineage where tenant_key = $1 order by surface_section, displayed_fact`,
        [tenantKey],
        { missingTable: "empty" },
      ),
      azureRead.query<Record<string, unknown>>(
        `select * from cio_tower.mart_required_field_gaps where tenant_key = $1 order by blocking desc, severity, source_template, required_field`,
        [tenantKey],
        { missingTable: "empty" },
      ),
    ]);

    const mappedCommand: TowerMartCommandCenter = {
      commandCenterKey: command.command_center_key,
      tenantKey: command.tenant_key,
      tenantName: command.tenant_name,
      martVersion: command.mart_version,
      sourceStandard: command.source_standard,
      formulaVersion: command.formula_version,
      totalItBudgetFy26: nullableNum(command.total_it_budget_fy26),
      runBudgetFy26: nullableNum(command.run_budget_fy26),
      changeBudgetFy26: nullableNum(command.change_budget_fy26),
      approvedProgramBudgetFy26: nullableNum(
        command.approved_program_budget_fy26,
      ),
      aiTaggedSpendFy26NonAdditive: nullableNum(
        command.ai_tagged_spend_fy26_non_additive,
      ),
      promisedValueFy26: nullableNum(command.promised_value_fy26),
      partialFinanceValidatedValueYtd: num(
        command.partial_finance_validated_value_ytd,
      ),
      realizedValueYtdAllowed: num(command.realized_value_ytd_allowed),
      claimableValue: num(
        command.claimable_value ?? command.realized_value_ytd_allowed,
      ),
      financeValidatedBlockedValue: num(
        command.finance_validated_blocked_value,
      ),
      promisedValueExposure: nullableNum(command.promised_value_exposure),
      valueClaimCount: Number(command.value_claim_count ?? 0),
      knownValueClaimCount: Number(command.known_value_claim_count ?? 0),
      unknownValueClaimCount: Number(command.unknown_value_claim_count ?? 0),
      knownZeroValueClaimCount: Number(
        command.known_zero_value_claim_count ?? 0,
      ),
      knownValueAmountUsd: num(
        command.known_value_amount_usd as string | number | null,
      ),
      financeAttestedClaimCount: Number(
        command.finance_attested_claim_count ?? 0,
      ),
      businessAttestedClaimCount: Number(
        command.business_attested_claim_count ?? 0,
      ),
      claimableClaimCount: Number(command.claimable_claim_count ?? 0),
      usageSupportedClaimCount: Number(
        command.usage_supported_claim_count ?? 0,
      ),
      fundedNoBaselineClaimCount: Number(
        command.funded_no_baseline_claim_count ?? 0,
      ),
      staleClaimCount: Number(command.stale_claim_count ?? 0),
      disputedClaimCount: Number(command.disputed_claim_count ?? 0),
      baselineLinkedClaimCount: Number(
        command.baseline_linked_claim_count ?? 0,
      ),
      targetLinkedClaimCount: Number(command.target_linked_claim_count ?? 0),
      actualLinkedClaimCount: Number(command.actual_linked_claim_count ?? 0),
      outcomeMeasuredClaimCount: Number(
        command.outcome_measured_claim_count ?? 0,
      ),
      claimableProgramCount: Number(command.claimable_program_count ?? 0),
      blockedProgramCount: Number(command.blocked_program_count ?? 0),
      conflictedProgramCount: Number(command.conflicted_program_count ?? 0),
      unmeasuredProgramCount: Number(command.unmeasured_program_count ?? 0),
      candidateAiOpportunities: Number(command.candidate_ai_opportunities ?? 0),
      watchPressureSignals: Number(command.watch_pressure_signals ?? 0),
      runRatio: nullableNum(command.run_ratio),
      changeRatio: nullableNum(command.change_ratio),
      financeValidationRatio: nullableNum(command.finance_validation_ratio),
      decisionQuestion: command.decision_question,
      executiveSummary: command.executive_summary,
      sourceFiles: command.source_files ?? [],
    };

    return {
      generatedFrom: "cio_tower_mart",
      headline: `${mappedCommand.tenantName} Tower mart shows ${towerMartNullableMoney(mappedCommand.totalItBudgetFy26)} FY26 technology budget, ${towerMartNullableMoney(mappedCommand.aiTaggedSpendFy26NonAdditive)} AI-tagged spend, and ${towerMartMoney(mappedCommand.partialFinanceValidatedValueYtd)} partial finance-validated value. Claimable value remains blocked at ${towerMartMoney(mappedCommand.realizedValueYtdAllowed)}.`,
      command: mappedCommand,
      aiPortfolioCounts: (() => {
        const [row] = aiPortfolioCountRows;
        if (!row) return undefined;
        return {
          total: Number(row.total ?? 0),
          candidate: Number(row.candidate ?? 0),
          active: Number(row.active ?? 0),
          funded: Number(row.funded ?? 0),
          embeddedOrUsage: Number(row.embedded_or_usage ?? 0),
          attributedSpendUsd: num(
            row.attributed_spend_usd as string | number | null,
          ),
        };
      })(),
      valueFunnel: valueFunnel.map((row) => ({
        funnelKey: String(row.funnel_key),
        sequence: Number(row.sequence ?? 0),
        stageKey: String(row.stage_key),
        stageLabel: towerMartStageLabel(
          row.stage_label ? String(row.stage_label) : null,
        ),
        valueNumeric: num(row.value_numeric as string | number | null),
        claimCount: Number(row.claim_count ?? 0),
        knownValueClaimCount: Number(row.known_value_claim_count ?? 0),
        unknownValueClaimCount: Number(row.unknown_value_claim_count ?? 0),
        knownValueAmount: num(row.known_value_amount as string | number | null),
        blockedClaimCount: Number(row.blocked_claim_count ?? 0),
        blockedKnownValueAmount: num(
          row.blocked_known_value_amount as string | number | null,
        ),
        primaryBlocker: row.primary_blocker
          ? String(row.primary_blocker)
          : null,
        primaryOwnerRole: row.primary_owner_role
          ? String(row.primary_owner_role)
          : null,
        denominatorStageKey: row.denominator_stage_key
          ? String(row.denominator_stage_key)
          : null,
        conversionRatio: nullableNum(
          row.conversion_ratio as string | number | null,
        ),
        claimStatus: String(row.claim_status),
        caveat: String(row.caveat ?? ""),
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceRow: row.source_row ? String(row.source_row) : null,
      })),
      programLanes: programLanes.map((row) => ({
        laneKey: String(row.lane_key),
        programCode: row.program_code ? String(row.program_code) : null,
        programName: String(row.program_name),
        ownerRole: row.owner_role ? String(row.owner_role) : null,
        financeOwnerRole: row.finance_owner_role
          ? String(row.finance_owner_role)
          : null,
        decisionLane: String(
          row.decision_lane,
        ) as TowerMartProgramLane["decisionLane"],
        decisionRationale: String(row.decision_rationale),
        approvedFundingUsd: num(
          row.approved_funding_usd as string | number | null,
        ),
        fundedAmount: num(row.funded_amount as string | number | null),
        aiTaggedSpendUsd: num(
          row.ai_tagged_spend_usd as string | number | null,
        ),
        promisedValueUsd: nullableNum(
          row.promised_value_usd as string | number | null,
        ),
        financeValidatedValueUsd: num(
          row.finance_validated_value_usd as string | number | null,
        ),
        knownSupportedValue: nullableNum(
          row.known_supported_value as string | number | null,
        ),
        proofMaturityScore: nullableNum(
          row.proof_maturity_score as string | number | null,
        ),
        riskPressureScore: nullableNum(
          row.risk_pressure_score as string | number | null,
        ),
        usageStrengthScore: nullableNum(
          row.usage_strength_score as string | number | null,
        ),
        lineageTrustState: row.lineage_trust_state
          ? String(row.lineage_trust_state)
          : null,
        decisionReasonCode: row.decision_reason_code
          ? String(row.decision_reason_code)
          : null,
        amountBlocked: nullableNum(
          row.amount_blocked as string | number | null,
        ),
        nextGate: row.next_gate ? String(row.next_gate) : null,
        usageMetric: row.usage_metric ? String(row.usage_metric) : null,
        usageActual: nullableNum(row.usage_actual as string | number | null),
        adoptionRatePct: nullableNum(
          row.adoption_rate_pct as string | number | null,
        ),
        valueClaimStatus: String(row.value_claim_status),
        towerClaimAllowed: String(row.tower_claim_allowed),
        requiredGates: Array.isArray(row.required_gates)
          ? (row.required_gates as Array<Record<string, unknown>>)
          : [],
        caveat: String(row.caveat ?? ""),
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceRow: row.source_row ? String(row.source_row) : null,
      })),
      aiPortfolio: aiPortfolio.map((row) => ({
        aiPortfolioKey: String(row.ai_portfolio_key),
        itemName: String(row.item_name),
        itemKind: String(row.item_kind),
        vendorName: row.vendor_name ? String(row.vendor_name) : null,
        systemName: row.system_name ? String(row.system_name) : null,
        aiSpendType: row.ai_spend_type ? String(row.ai_spend_type) : null,
        aiSpendCategory: row.ai_spend_category
          ? String(row.ai_spend_category)
          : null,
        fundingStatus: row.funding_status ? String(row.funding_status) : null,
        decisionLane: String(
          row.decision_lane,
        ) as TowerMartAiPortfolioItem["decisionLane"],
        approvedFundingUsd: num(
          row.approved_funding_usd as string | number | null,
        ),
        aiTaggedSpendUsd: num(
          row.ai_tagged_spend_usd as string | number | null,
        ),
        promisedValueUsd: nullableNum(
          row.promised_value_usd as string | number | null,
        ),
        financeValidatedValueUsd: num(
          row.finance_validated_value_usd as string | number | null,
        ),
        usageMetric: row.usage_metric ? String(row.usage_metric) : null,
        usageActual: nullableNum(row.usage_actual as string | number | null),
        adoptionRatePct: nullableNum(
          row.adoption_rate_pct as string | number | null,
        ),
        valueScore: Number(row.value_score ?? 0),
        readinessScore: Number(row.readiness_score ?? 0),
        riskScore: Number(row.risk_score ?? 0),
        duplicateRisk: row.duplicate_risk ? String(row.duplicate_risk) : null,
        valueClaimStatus: String(row.value_claim_status),
        towerClaimAllowed: String(row.tower_claim_allowed),
        caveat: String(row.caveat ?? ""),
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceRow: row.source_row ? String(row.source_row) : null,
      })),
      cxoActions: cxoActions.map((row) => ({
        actionKey: String(row.action_key),
        sequence: Number(row.sequence ?? 0),
        actionLane: String(row.action_lane),
        title: String(row.title),
        actionBody: String(row.action_body),
        ownerHint: row.owner_hint ? String(row.owner_hint) : null,
        moduleHandoff: row.module_handoff ? String(row.module_handoff) : null,
        programId: row.program_id ? String(row.program_id) : null,
        claimId: row.claim_id ? String(row.claim_id) : null,
        proofStage: row.proof_stage ? String(row.proof_stage) : null,
        blockedDecision: row.blocked_decision
          ? String(row.blocked_decision)
          : null,
        amountExposed: num(row.amount_exposed as string | number | null),
        evidenceRequirement: row.evidence_requirement
          ? String(row.evidence_requirement)
          : null,
        expectedSourceSystem: row.expected_source_system
          ? String(row.expected_source_system)
          : null,
        evidencePackageId: row.evidence_package_id
          ? String(row.evidence_package_id)
          : null,
        ownerRole: row.owner_role ? String(row.owner_role) : null,
        secondaryOwnerRole: row.secondary_owner_role
          ? String(row.secondary_owner_role)
          : null,
        dueWindow: row.due_window ? String(row.due_window) : null,
        dueDate: row.due_date ? String(row.due_date) : null,
        handoffModule: row.handoff_module ? String(row.handoff_module) : null,
        handoffEntityId: row.handoff_entity_id
          ? String(row.handoff_entity_id)
          : null,
        handoffReadiness: String(row.handoff_readiness ?? "not_ready"),
        actionState: String(row.action_state ?? "open"),
        priority: String(row.priority ?? "medium"),
      })),
      evidenceLineage: evidenceLineage.map((row) => ({
        lineageKey: String(row.lineage_key),
        surfaceSection: String(row.surface_section),
        displayedFact: String(row.displayed_fact),
        displayedValueText: row.displayed_value_text
          ? String(row.displayed_value_text)
          : null,
        displayedValueNumeric: nullableNum(
          row.displayed_value_numeric as string | number | null,
        ),
        metricOrFactKey: row.metric_or_fact_key
          ? String(row.metric_or_fact_key)
          : null,
        boardVisibleLabel: row.board_visible_label
          ? String(row.board_visible_label)
          : null,
        lineageState: row.lineage_state ? String(row.lineage_state) : null,
        sourceCount: Number(row.source_count ?? 0),
        sourceRefs: Array.isArray(row.source_refs)
          ? (row.source_refs as Array<Record<string, unknown>>)
          : [],
        conflictingValues: Array.isArray(row.conflicting_values)
          ? (row.conflicting_values as Array<Record<string, unknown>>)
          : [],
        authoritativeValue: row.authoritative_value
          ? String(row.authoritative_value)
          : null,
        resolutionOwnerRole: row.resolution_owner_role
          ? String(row.resolution_owner_role)
          : null,
        resolutionState: row.resolution_state
          ? String(row.resolution_state)
          : null,
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceRow: row.source_row ? String(row.source_row) : null,
        sourceSystem: row.source_system ? String(row.source_system) : null,
        caveat: String(row.caveat ?? ""),
      })),
      requiredFieldGaps: requiredFieldGaps.map((row) => ({
        gapKey: String(row.gap_key),
        martTable: String(row.mart_table),
        martRecordKey: String(row.mart_record_key),
        requiredField: String(row.required_field),
        sourceTemplate: String(row.source_template),
        sourceRecordId: row.source_record_id
          ? String(row.source_record_id)
          : null,
        severity: String(row.severity),
        ownerHint: row.owner_hint ? String(row.owner_hint) : null,
        remediationAction: String(row.remediation_action),
        blocking: Boolean(row.blocking),
      })),
    };
  }

  return null;
}
