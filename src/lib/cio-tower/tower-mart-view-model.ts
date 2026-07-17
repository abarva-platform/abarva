import { azureRead } from '@/lib/data-plane/azureRead';
import {
  canonicalCioTowerTenantKey,
  formatCioTowerMoney,
} from '@/lib/cio-tower/metric-packet';

export interface TowerMartCommandCenter {
  commandCenterKey: string;
  tenantKey: string;
  tenantName: string;
  martVersion: string;
  sourceStandard: string;
  formulaVersion: string;
  totalItBudgetFy26: number;
  runBudgetFy26: number;
  changeBudgetFy26: number;
  approvedProgramBudgetFy26: number;
  aiTaggedSpendFy26NonAdditive: number;
  promisedValueFy26: number;
  partialFinanceValidatedValueYtd: number;
  realizedValueYtdAllowed: number;
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
  denominatorStageKey: string | null;
  conversionRatio: number | null;
  claimStatus: string;
  caveat: string;
  sourceFile: string | null;
  sourceRow: string | null;
}

export interface TowerMartProgramLane {
  laneKey: string;
  programCode: string | null;
  programName: string;
  ownerRole: string | null;
  financeOwnerRole: string | null;
  decisionLane: 'fund' | 'fix' | 'freeze' | 'stop';
  decisionRationale: string;
  approvedFundingUsd: number;
  aiTaggedSpendUsd: number;
  promisedValueUsd: number;
  financeValidatedValueUsd: number;
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
  decisionLane: 'fund' | 'fix' | 'freeze' | 'stop';
  approvedFundingUsd: number;
  aiTaggedSpendUsd: number;
  promisedValueUsd: number;
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
}

export interface TowerMartEvidenceLineage {
  lineageKey: string;
  surfaceSection: string;
  displayedFact: string;
  displayedValueText: string | null;
  displayedValueNumeric: number | null;
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

export interface TowerMartCommandViewModel {
  generatedFrom: 'cio_tower_mart';
  headline: string;
  command: TowerMartCommandCenter;
  valueFunnel: TowerMartValueFunnelStage[];
  programLanes: TowerMartProgramLane[];
  aiPortfolio: TowerMartAiPortfolioItem[];
  cxoActions: TowerMartCxoAction[];
  evidenceLineage: TowerMartEvidenceLineage[];
  requiredFieldGaps: TowerMartRequiredFieldGap[];
}

interface CommandRow {
  command_center_key: string;
  tenant_key: string;
  tenant_name: string;
  mart_version: string;
  source_standard: string;
  formula_version: string;
  total_it_budget_fy26: string | number;
  run_budget_fy26: string | number;
  change_budget_fy26: string | number;
  approved_program_budget_fy26: string | number;
  ai_tagged_spend_fy26_non_additive: string | number;
  promised_value_fy26: string | number;
  partial_finance_validated_value_ytd: string | number;
  realized_value_ytd_allowed: string | number;
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

export function towerMartMoney(value: number): string {
  return formatCioTowerMoney(value);
}

export async function loadTowerMartCommandView(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
}): Promise<TowerMartCommandViewModel | null> {
  const tenantKeys = Array.from(
    new Set(
      args.tenantKeyCandidates
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
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
      { missingTable: 'empty' },
    );
    if (!command) continue;

    const [valueFunnel, programLanes, aiPortfolio, cxoActions, evidenceLineage, requiredFieldGaps] =
      await Promise.all([
        azureRead.query<Record<string, unknown>>(
          `select * from cio_tower.mart_value_funnel where tenant_key = $1 order by sequence`,
          [tenantKey],
          { missingTable: 'empty' },
        ),
        azureRead.query<Record<string, unknown>>(
          `select * from cio_tower.mart_program_decision_lanes where tenant_key = $1 order by decision_lane, approved_funding_usd desc, program_name`,
          [tenantKey],
          { missingTable: 'empty' },
        ),
        azureRead.query<Record<string, unknown>>(
          `select * from cio_tower.mart_ai_portfolio where tenant_key = $1 order by item_kind, value_score desc, readiness_score desc, item_name limit 80`,
          [tenantKey],
          { missingTable: 'empty' },
        ),
        azureRead.query<Record<string, unknown>>(
          `select * from cio_tower.mart_cxo_actions where tenant_key = $1 order by sequence`,
          [tenantKey],
          { missingTable: 'empty' },
        ),
        azureRead.query<Record<string, unknown>>(
          `select * from cio_tower.mart_evidence_lineage where tenant_key = $1 order by surface_section, displayed_fact`,
          [tenantKey],
          { missingTable: 'empty' },
        ),
        azureRead.query<Record<string, unknown>>(
          `select * from cio_tower.mart_required_field_gaps where tenant_key = $1 order by blocking desc, severity, source_template, required_field`,
          [tenantKey],
          { missingTable: 'empty' },
        ),
      ]);

    const mappedCommand: TowerMartCommandCenter = {
      commandCenterKey: command.command_center_key,
      tenantKey: command.tenant_key,
      tenantName: command.tenant_name,
      martVersion: command.mart_version,
      sourceStandard: command.source_standard,
      formulaVersion: command.formula_version,
      totalItBudgetFy26: num(command.total_it_budget_fy26),
      runBudgetFy26: num(command.run_budget_fy26),
      changeBudgetFy26: num(command.change_budget_fy26),
      approvedProgramBudgetFy26: num(command.approved_program_budget_fy26),
      aiTaggedSpendFy26NonAdditive: num(command.ai_tagged_spend_fy26_non_additive),
      promisedValueFy26: num(command.promised_value_fy26),
      partialFinanceValidatedValueYtd: num(command.partial_finance_validated_value_ytd),
      realizedValueYtdAllowed: num(command.realized_value_ytd_allowed),
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
      generatedFrom: 'cio_tower_mart',
      headline: `${mappedCommand.tenantName} Tower mart shows ${towerMartMoney(mappedCommand.totalItBudgetFy26)} FY26 technology budget, ${towerMartMoney(mappedCommand.aiTaggedSpendFy26NonAdditive)} AI-tagged spend, and ${towerMartMoney(mappedCommand.partialFinanceValidatedValueYtd)} partial finance-validated value. Realized value remains blocked at ${towerMartMoney(mappedCommand.realizedValueYtdAllowed)}.`,
      command: mappedCommand,
      valueFunnel: valueFunnel.map((row) => ({
        funnelKey: String(row.funnel_key),
        sequence: Number(row.sequence ?? 0),
        stageKey: String(row.stage_key),
        stageLabel: String(row.stage_label),
        valueNumeric: num(row.value_numeric as string | number | null),
        denominatorStageKey: row.denominator_stage_key ? String(row.denominator_stage_key) : null,
        conversionRatio: nullableNum(row.conversion_ratio as string | number | null),
        claimStatus: String(row.claim_status),
        caveat: String(row.caveat ?? ''),
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceRow: row.source_row ? String(row.source_row) : null,
      })),
      programLanes: programLanes.map((row) => ({
        laneKey: String(row.lane_key),
        programCode: row.program_code ? String(row.program_code) : null,
        programName: String(row.program_name),
        ownerRole: row.owner_role ? String(row.owner_role) : null,
        financeOwnerRole: row.finance_owner_role ? String(row.finance_owner_role) : null,
        decisionLane: String(row.decision_lane) as TowerMartProgramLane['decisionLane'],
        decisionRationale: String(row.decision_rationale),
        approvedFundingUsd: num(row.approved_funding_usd as string | number | null),
        aiTaggedSpendUsd: num(row.ai_tagged_spend_usd as string | number | null),
        promisedValueUsd: num(row.promised_value_usd as string | number | null),
        financeValidatedValueUsd: num(row.finance_validated_value_usd as string | number | null),
        usageMetric: row.usage_metric ? String(row.usage_metric) : null,
        usageActual: nullableNum(row.usage_actual as string | number | null),
        adoptionRatePct: nullableNum(row.adoption_rate_pct as string | number | null),
        valueClaimStatus: String(row.value_claim_status),
        towerClaimAllowed: String(row.tower_claim_allowed),
        requiredGates: Array.isArray(row.required_gates) ? row.required_gates as Array<Record<string, unknown>> : [],
        caveat: String(row.caveat ?? ''),
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
        aiSpendCategory: row.ai_spend_category ? String(row.ai_spend_category) : null,
        fundingStatus: row.funding_status ? String(row.funding_status) : null,
        decisionLane: String(row.decision_lane) as TowerMartAiPortfolioItem['decisionLane'],
        approvedFundingUsd: num(row.approved_funding_usd as string | number | null),
        aiTaggedSpendUsd: num(row.ai_tagged_spend_usd as string | number | null),
        promisedValueUsd: num(row.promised_value_usd as string | number | null),
        financeValidatedValueUsd: num(row.finance_validated_value_usd as string | number | null),
        usageMetric: row.usage_metric ? String(row.usage_metric) : null,
        usageActual: nullableNum(row.usage_actual as string | number | null),
        adoptionRatePct: nullableNum(row.adoption_rate_pct as string | number | null),
        valueScore: Number(row.value_score ?? 0),
        readinessScore: Number(row.readiness_score ?? 0),
        riskScore: Number(row.risk_score ?? 0),
        duplicateRisk: row.duplicate_risk ? String(row.duplicate_risk) : null,
        valueClaimStatus: String(row.value_claim_status),
        towerClaimAllowed: String(row.tower_claim_allowed),
        caveat: String(row.caveat ?? ''),
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
      })),
      evidenceLineage: evidenceLineage.map((row) => ({
        lineageKey: String(row.lineage_key),
        surfaceSection: String(row.surface_section),
        displayedFact: String(row.displayed_fact),
        displayedValueText: row.displayed_value_text ? String(row.displayed_value_text) : null,
        displayedValueNumeric: nullableNum(row.displayed_value_numeric as string | number | null),
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceRow: row.source_row ? String(row.source_row) : null,
        sourceSystem: row.source_system ? String(row.source_system) : null,
        caveat: String(row.caveat ?? ''),
      })),
      requiredFieldGaps: requiredFieldGaps.map((row) => ({
        gapKey: String(row.gap_key),
        martTable: String(row.mart_table),
        martRecordKey: String(row.mart_record_key),
        requiredField: String(row.required_field),
        sourceTemplate: String(row.source_template),
        sourceRecordId: row.source_record_id ? String(row.source_record_id) : null,
        severity: String(row.severity),
        ownerHint: row.owner_hint ? String(row.owner_hint) : null,
        remediationAction: String(row.remediation_action),
        blocking: Boolean(row.blocking),
      })),
    };
  }

  return null;
}
