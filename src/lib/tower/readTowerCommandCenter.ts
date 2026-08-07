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
  TowerMartValueFunnelStage,
} from "@/lib/cio-tower/tower-mart-view-model";

type Numeric = string | number | null;

interface ClaimSummaryRow {
  tenant_key: string;
  claim_count: number;
  known_value_claim_count: number;
  unknown_value_claim_count: number;
  known_zero_value_claim_count: number;
  known_value_amount_usd: Numeric;
  promised_value_amount_usd: Numeric;
  finance_validated_value_usd: Numeric;
  claimable_value_usd: Numeric;
  finance_attested_claim_count: number;
  business_attested_claim_count: number;
  claimable_count: number;
  usage_supported_count: number;
  funded_no_baseline_count: number;
  stale_count: number;
  disputed_count: number;
  baseline_linked_claim_count: number;
  target_linked_claim_count: number;
  actual_linked_claim_count: number;
  outcome_measured_claim_count: number;
}

interface BudgetRow {
  total_budget_usd: Numeric;
  target_budget_usd: Numeric;
  actual_spend_usd: Numeric;
  run_budget_usd: Numeric;
  change_budget_usd: Numeric;
  ai_tagged_spend_usd: Numeric;
}

interface ProgramRow {
  claim_id: string;
  subject_ref: string;
  title: string;
  owner_role: string | null;
  funding_status: string | null;
  status: string | null;
  priority: string | null;
  source_file: string | null;
  source_row: string | null;
  claim_state: string;
  blocked_reason: string | null;
  next_gate: string | null;
  next_gate_owner_role: string | null;
  quality_guardrail_state: string;
  risk_guardrail_state: string;
  promised_value: Numeric;
  calculated_value: Numeric;
  baseline_observation_id: string | null;
  target_observation_id: string | null;
  actual_observation_id: string | null;
  caveat: string | null;
  approved_budget_usd: Numeric;
  actual_to_date_usd: Numeric;
  forecast_at_completion_usd: Numeric;
}

interface AiRow {
  subject_ref: string;
  title: string;
  subject_kind: string;
  vendor_ref: string | null;
  vendor_name: string | null;
  owner_role: string | null;
  active_users: Numeric;
  seats_purchased: Numeric;
  estimated_use_cost: Numeric;
  active_user_rate: Numeric;
  claim_state: string | null;
  blocked_reason: string | null;
  source_file: string | null;
  source_row: string | null;
}

interface EvidenceRow {
  provenance_id: string;
  source_system: string;
  source_report: string | null;
  source_schema: string | null;
  source_table: string | null;
  source_file_id: string | null;
  source_row_pointer: string | null;
  formula: string;
  formula_version: string;
  attestation_status: string;
  observation_count: number;
  result_hashes: string[];
}

interface MeridianTowerSummaryRow {
  baseline_rows: number;
  outcome_count: number;
  supplier_count: number;
  recommendation_input_count: number;
  automation_commitment_count: number;
  service_credit_count: number;
  annualized_current_state_cost: Numeric;
  five_year_current_state_baseline_cost: Numeric;
  headline_price: Numeric;
  normalized_five_year_tco: Numeric;
  risk_adjustment: Numeric;
  service_credit_eligible_amount: Numeric;
  service_credit_claimed_amount: Numeric;
  retained_org_annual_cost: Numeric;
}

interface MeridianOutcomeRow {
  health_plan_outcome_snapshot_id: string;
  outcome_name: string;
  outcome_category: string | null;
  trend_state: string | null;
  measurement_period: string | null;
  evidence_status: string | null;
  attestation_status: string | null;
}

interface MeridianRecommendationRow {
  event_id: string;
  supplier_id: string;
  scenario: string;
  headline_price: Numeric;
  normalized_five_year_tco: Numeric;
  risk_adjustment: Numeric;
  recommendation_state: string | null;
  recommendation_basis: string | null;
}

interface MeridianAutomationRow {
  automation_commitment_id: string;
  supplier_id: string;
  process_name: string;
  ai_rpa_use_case: string;
  current_manual_volume: Numeric;
  target_automation_percentage: Numeric;
  productivity_commitment_pct: Numeric;
  contracted_benefit_amount: Numeric;
  commitment_state: string | null;
  automation_basis: string | null;
}

function num(value: Numeric | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
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

function includesMeridianTenant(
  values: readonly (string | null | undefined)[],
) {
  return values.some((value) => {
    const normalized = value?.trim().toLowerCase();
    return (
      normalized === "meridian" ||
      normalized === "meridian-health" ||
      normalized === "meridian_health_global"
    );
  });
}

function decisionLaneFor(
  row: ProgramRow,
): TowerMartProgramLane["decisionLane"] {
  const status =
    `${row.status ?? ""} ${row.funding_status ?? ""}`.toLowerCase();
  if (status.includes("unfunded")) return "stop";
  if (status.includes("on hold") || status.includes("pending")) return "freeze";
  if (status.includes("at risk") || status.includes("constraint")) return "fix";
  return "fix";
}

function claimAllowedFor(claimState: string): string {
  const state = claimState.trim().toLowerCase();
  if (state === "claimable") return "allowed";
  if (state === "finance_validated") return "partial";
  return "blocked";
}

function programLane(row: ProgramRow): TowerMartProgramLane {
  const gate =
    nullableText(row.next_gate) ??
    "Load governed baseline, target, actual, and attestation evidence.";
  const approvedFundingUsd = num(row.approved_budget_usd);
  const promisedValueUsd = num(row.promised_value);
  const financeValidatedValueUsd =
    row.claim_state.toLowerCase() === "finance_validated" ||
    row.claim_state.toLowerCase() === "claimable"
      ? num(row.calculated_value)
      : 0;
  const hasLinkedOutcome =
    Boolean(row.baseline_observation_id) &&
    Boolean(row.target_observation_id) &&
    Boolean(row.actual_observation_id);
  const caveat = [
    nullableText(row.caveat),
    `Claim state: ${row.claim_state}.`,
    `Quality guardrail: ${row.quality_guardrail_state}.`,
    `Risk guardrail: ${row.risk_guardrail_state}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    laneKey: `tower:${row.claim_id}`,
    programCode: row.subject_ref,
    programName: row.title,
    ownerRole: nullableText(row.owner_role),
    financeOwnerRole: nullableText(row.next_gate_owner_role),
    decisionLane: decisionLaneFor(row),
    decisionRationale:
      nullableText(row.blocked_reason) ??
      "Governed value evidence is not complete enough to claim outcomes.",
    approvedFundingUsd,
    aiTaggedSpendUsd: 0,
    promisedValueUsd,
    financeValidatedValueUsd,
    usageMetric: hasLinkedOutcome ? "linked outcome metric" : null,
    usageActual: hasLinkedOutcome ? 1 : null,
    adoptionRatePct: null,
    valueClaimStatus: row.claim_state,
    towerClaimAllowed: claimAllowedFor(row.claim_state),
    requiredGates: [{ ask: gate, status: "blocked" }],
    caveat,
    sourceFile: nullableText(row.source_file),
    sourceRow: nullableText(row.source_row),
  };
}

function aiPortfolioItem(row: AiRow, index: number): TowerMartAiPortfolioItem {
  const activeUsers = num(row.active_users);
  const seats = num(row.seats_purchased);
  const sourceRatePct = num(row.active_user_rate) * 100;
  const fallbackRatePct = seats > 0 ? (activeUsers / seats) * 100 : 0;
  const adoptionPct = clampPct(
    sourceRatePct > 0 ? sourceRatePct : fallbackRatePct,
  );
  const readinessScore = Math.max(0, Math.min(100, Math.round(adoptionPct)));
  const valueScore =
    activeUsers > 0 ? Math.min(100, Math.round(activeUsers / 40)) : 0;
  return {
    aiPortfolioKey: `tower:${row.subject_ref}`,
    itemName: row.title,
    itemKind:
      row.subject_kind === "developer_ai_tool"
        ? "funded_program"
        : "embedded_platform",
    vendorName: nullableText(row.vendor_name) ?? nullableText(row.vendor_ref),
    systemName: row.subject_ref,
    aiSpendType: "usage-supported evidence",
    aiSpendCategory:
      row.subject_kind === "developer_ai_tool"
        ? "Developer AI"
        : "Service/workflow agents",
    fundingStatus: "usage_supported",
    decisionLane: "fix",
    approvedFundingUsd: 0,
    aiTaggedSpendUsd: num(row.estimated_use_cost),
    promisedValueUsd: 0,
    financeValidatedValueUsd: 0,
    usageMetric: "active users",
    usageActual: activeUsers,
    adoptionRatePct: seats > 0 ? adoptionPct : null,
    valueScore,
    readinessScore,
    riskScore: row.claim_state === "usage_supported" ? 55 : 70,
    duplicateRisk: null,
    valueClaimStatus: row.claim_state ?? "usage_supported",
    towerClaimAllowed: "blocked",
    caveat:
      nullableText(row.blocked_reason) ??
      "Usage/adoption evidence exists, but business outcome and attestation evidence is not complete.",
    sourceFile: nullableText(row.source_file),
    sourceRow: nullableText(row.source_row) ?? String(index + 1),
  };
}

function valueFunnelRows(
  summary: ClaimSummaryRow,
): TowerMartCommandViewModel["valueFunnel"] {
  const promisedValue = num(summary.promised_value_amount_usd);
  const financeValidatedValue = num(summary.finance_validated_value_usd);
  const claimableValue = num(summary.claimable_value_usd);
  const caveat =
    summary.unknown_value_claim_count > 0
      ? `${summary.unknown_value_claim_count} claims have unknown financial amount; unknown value is not converted to zero.`
      : "Known value amount is traceable through tower.value_claim.";
  const stages = [
    ["potential", "Potential", summary.claim_count, "portfolio", promisedValue],
    [
      "promised",
      "Promised",
      summary.known_value_claim_count,
      "promised",
      promisedValue,
    ],
    [
      "usage_supported",
      "Usage-supported",
      summary.usage_supported_count,
      "usage_supported",
      0,
    ],
    [
      "finance_validated",
      "Finance-validated",
      summary.finance_attested_claim_count,
      "finance_validated",
      financeValidatedValue,
    ],
    [
      "claimable",
      "Claimable",
      summary.claimable_count,
      "claimable",
      claimableValue,
    ],
    ["realized", "Realized", 0, "not_realized", 0],
  ] as const;
  return stages.map(
    ([stageKey, stageLabel, count, claimStatus, valueNumeric], index) => ({
      funnelKey: `tower:${summary.tenant_key}:funnel:${stageKey}`,
      sequence: index + 1,
      stageKey,
      stageLabel,
      valueNumeric,
      denominatorStageKey: index === 0 ? null : stages[0][0],
      conversionRatio:
        summary.claim_count > 0 ? count / summary.claim_count : null,
      claimStatus,
      caveat,
      sourceFile: "tower.value_claim",
      sourceRow: null,
    }),
  );
}

function actionRows(summary: ClaimSummaryRow): TowerMartCxoAction[] {
  return [
    {
      actionKey: "tower-action-baselines",
      sequence: 1,
      actionLane: "fix",
      title: "Capture baselines for funded claims",
      actionBody: `${summary.funded_no_baseline_count} funded claims do not have governed baseline/target/actual evidence. Establish comparable measurement periods before scaling.`,
      ownerHint: "Transformation owner",
      moduleHandoff: "Moves",
    },
    {
      actionKey: "tower-action-attestation",
      sequence: 2,
      actionLane: "fix",
      title: "Require Finance and business attestation",
      actionBody: `${summary.finance_attested_claim_count} claims have Finance attestation and ${summary.business_attested_claim_count} have business attestation. No claim should become claimable without both gates.`,
      ownerHint: "Finance partner",
      moduleHandoff: "Moves",
    },
    {
      actionKey: "tower-action-unknown-value",
      sequence: 3,
      actionLane: "freeze",
      title: "Keep unknown value out of executive totals",
      actionBody: `${summary.unknown_value_claim_count} claims have unknown financial value. Treat them as evidence gaps, not zero-dollar outcomes.`,
      ownerHint: "Tower data steward",
      moduleHandoff: "Intelligence",
    },
  ];
}

export async function readTowerCommandCenter(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
}): Promise<TowerMartCommandViewModel | null> {
  if (includesMeridianTenant(args.tenantKeyCandidates)) {
    const meridian = await readMeridianCanaryTowerCommandCenter();
    if (meridian) return meridian;
  }

  for (const tenantKey of tenantCandidates(args.tenantKeyCandidates)) {
    const [summary] = await azureRead.query<ClaimSummaryRow>(
      `select
          tenant_key,
          count(*)::int as claim_count,
          count(*) filter (where calculated_value is not null)::int as known_value_claim_count,
          count(*) filter (where calculated_value is null)::int as unknown_value_claim_count,
          count(*) filter (where calculated_value = 0)::int as known_zero_value_claim_count,
          coalesce(sum(calculated_value) filter (where calculated_value is not null), 0) as known_value_amount_usd,
          coalesce(sum(promised_value) filter (where promised_value is not null), 0) as promised_value_amount_usd,
          coalesce(sum(calculated_value) filter (where lower(claim_state) in ('finance_validated','claimable')), 0) as finance_validated_value_usd,
          coalesce(sum(calculated_value) filter (where lower(claim_state) = 'claimable'), 0) as claimable_value_usd,
          count(*) filter (where lower(quality_guardrail_state) in ('finance_attested','finance_validated'))::int as finance_attested_claim_count,
          count(*) filter (where lower(risk_guardrail_state) in ('business_attested','business_validated'))::int as business_attested_claim_count,
          count(*) filter (where lower(claim_state) = 'claimable')::int as claimable_count,
          count(*) filter (where lower(claim_state) = 'usage_supported')::int as usage_supported_count,
          count(*) filter (where lower(claim_state) = 'funded_no_baseline')::int as funded_no_baseline_count,
          count(*) filter (where stale_at is not null)::int as stale_count,
          count(*) filter (where lower(claim_state) = 'disputed')::int as disputed_count,
          count(*) filter (where baseline_observation_id is not null)::int as baseline_linked_claim_count,
          count(*) filter (where target_observation_id is not null)::int as target_linked_claim_count,
          count(*) filter (where actual_observation_id is not null)::int as actual_linked_claim_count,
          count(*) filter (
            where baseline_observation_id is not null
              and target_observation_id is not null
              and actual_observation_id is not null
          )::int as outcome_measured_claim_count
         from tower.value_claim
        where tenant_key = $1
        group by tenant_key`,
      [tenantKey],
      { missingTable: "empty" },
    );
    if (!summary) continue;

    const [budget] = await azureRead.query<BudgetRow>(
      `with obs as (
          select
            sum(value_num) filter (where metric_ref = 'finance.total_it_budget' and scenario = 'actual') as total_budget_usd,
            sum(value_num) filter (where metric_ref = 'finance.total_it_budget' and scenario = 'target') as target_budget_usd,
            sum(value_num) filter (where metric_ref = 'finance.actual_spend' and scenario = 'actual') as actual_spend_usd,
            sum(value_num) filter (where metric_ref = 'ai.estimated_use_cost' and scenario = 'actual') as ai_tagged_spend_usd
          from tower.metric_observation
          where tenant_key = $1
        ),
        raw_budget as (
          select
            sum(nullif(regexp_replace(budget_amount, '[^0-9.-]', '', 'g'), '')::numeric)
              filter (where fiscal_year = '2027' and run_change = 'Run') as run_budget_usd,
            sum(nullif(regexp_replace(budget_amount, '[^0-9.-]', '', 'g'), '')::numeric)
              filter (where fiscal_year = '2027' and run_change = 'Change') as change_budget_usd
          from raw_enterprise_it.it_budget_allocations
          where _tenant_key = $1
        )
        select * from obs cross join raw_budget`,
      [tenantKey],
      { missingTable: "empty" },
    );

    const [programs, aiRows, evidenceRows] = await Promise.all([
      azureRead.query<ProgramRow>(
        `with project_obs as (
           select
             subject_ref,
             max(value_num) filter (where metric_ref = 'project.approved_budget') as approved_budget_usd,
             max(value_num) filter (where metric_ref = 'project.actual_to_date') as actual_to_date_usd,
             max(value_num) filter (where metric_ref = 'project.forecast_at_completion') as forecast_at_completion_usd
           from tower.metric_observation
           where tenant_key = $1
             and metric_ref in (
               'project.approved_budget',
               'project.actual_to_date',
               'project.forecast_at_completion'
             )
           group by subject_ref
         )
         select
            c.claim_id,
            c.subject_ref,
            s.title,
            s.owner_role,
            s.funding_status,
            s.metadata_json->>'status' as status,
            s.metadata_json->>'priority' as priority,
            s.metadata_json->>'source_file' as source_file,
            s.metadata_json->>'source_row' as source_row,
            c.claim_state,
            c.blocked_reason,
            c.next_gate,
            c.next_gate_owner_role,
            c.quality_guardrail_state,
            c.risk_guardrail_state,
            c.promised_value,
            c.calculated_value,
            c.baseline_observation_id,
            c.target_observation_id,
            c.actual_observation_id,
            c.caveat,
            po.approved_budget_usd,
            po.actual_to_date_usd,
            po.forecast_at_completion_usd
           from tower.value_claim c
           join tower.tracked_subject s
             on s.tenant_key = c.tenant_key
            and s.subject_ref = c.subject_ref
           left join project_obs po on po.subject_ref = c.subject_ref
          where c.tenant_key = $1
            and s.subject_kind = 'initiative'
          order by
            case lower(s.metadata_json->>'priority')
              when 'critical' then 0
              when 'high' then 1
              when 'medium' then 2
              else 3
            end,
            po.approved_budget_usd desc nulls last,
            c.promised_value desc nulls last,
            s.title
          limit 40`,
        [tenantKey],
      ),
      azureRead.query<AiRow>(
        `with latest_ai as (
           select distinct on (subject_ref, metric_ref)
             subject_ref,
             metric_ref,
             value_num,
             period_end
           from tower.metric_observation
           where tenant_key = $1
             and metric_ref in (
               'ai.active_users',
               'ai.seats_purchased',
               'ai.estimated_use_cost',
               'ai.active_user_rate'
             )
           order by subject_ref, metric_ref, period_end desc
         )
         select
           s.subject_ref,
           s.title,
           s.subject_kind,
           s.vendor_ref,
           coalesce(s.metadata_json->>'vendor_provider', s.vendor_ref) as vendor_name,
           s.owner_role,
           max(value_num) filter (where metric_ref = 'ai.active_users') as active_users,
           max(value_num) filter (where metric_ref = 'ai.seats_purchased') as seats_purchased,
           max(value_num) filter (where metric_ref = 'ai.estimated_use_cost') as estimated_use_cost,
           max(value_num) filter (where metric_ref = 'ai.active_user_rate') as active_user_rate,
           c.claim_state,
           c.blocked_reason,
           s.metadata_json->>'source_file' as source_file,
           s.metadata_json->>'source_row' as source_row
          from tower.tracked_subject s
          left join latest_ai ai on ai.subject_ref = s.subject_ref
          left join tower.value_claim c
            on c.tenant_key = s.tenant_key
           and c.subject_ref = s.subject_ref
         where s.tenant_key = $1
           and s.subject_kind in ('developer_ai_tool', 'service_agent')
         group by
           s.subject_ref,
           s.title,
           s.subject_kind,
           s.vendor_ref,
           s.owner_role,
           c.claim_state,
           c.blocked_reason,
           s.metadata_json
         order by estimated_use_cost desc nulls last, s.title`,
        [tenantKey],
      ),
      azureRead.query<EvidenceRow>(
        `select
            p.provenance_id,
            p.source_system,
            p.source_report,
            p.source_schema,
            p.source_table,
            p.source_file_id,
            p.source_row_pointer,
            p.formula,
            p.formula_version,
            p.attestation_status,
            count(o.observation_id)::int as observation_count,
            array_agg(distinct o.source_result_hash order by o.source_result_hash) filter (where o.source_result_hash is not null) as result_hashes
           from tower.metric_provenance p
           left join tower.metric_observation o
             on o.tenant_key = p.tenant_key
            and o.provenance_id = p.provenance_id
          where p.tenant_key = $1
          group by p.provenance_id
          order by p.source_system`,
        [tenantKey],
      ),
    ]);

    const totalBudget = num(
      budget?.target_budget_usd || budget?.total_budget_usd,
    );
    const knownAmount = num(summary.known_value_amount_usd);
    const promisedAmount = num(summary.promised_value_amount_usd);
    const financeValidatedAmount = num(summary.finance_validated_value_usd);
    const claimableAmount = num(summary.claimable_value_usd);
    const approvedProgramBudget = programs.reduce(
      (sum, row) => sum + num(row.approved_budget_usd),
      0,
    );
    const candidateAiOpportunities = aiRows.filter(
      (row) => row.subject_kind === "candidate_ai_opportunity",
    ).length;
    const command: TowerMartCommandCenter = {
      commandCenterKey: `tower:${tenantKey}:command-center`,
      tenantKey,
      tenantName:
        tenantKey === "skyharbor_global" ? "SkyHarbor Air" : tenantKey,
      martVersion: "tower-schema-v1",
      sourceStandard: "tower.metric_observation/value_claim",
      formulaVersion: "tower_claim_state_v1",
      totalItBudgetFy26: totalBudget,
      runBudgetFy26: num(budget?.run_budget_usd),
      changeBudgetFy26: num(budget?.change_budget_usd),
      approvedProgramBudgetFy26: approvedProgramBudget,
      aiTaggedSpendFy26NonAdditive: num(budget?.ai_tagged_spend_usd),
      promisedValueFy26: promisedAmount,
      partialFinanceValidatedValueYtd: financeValidatedAmount,
      realizedValueYtdAllowed: claimableAmount,
      valueClaimCount: summary.claim_count,
      knownValueClaimCount: summary.known_value_claim_count,
      unknownValueClaimCount: summary.unknown_value_claim_count,
      knownZeroValueClaimCount: summary.known_zero_value_claim_count,
      knownValueAmountUsd: knownAmount,
      financeAttestedClaimCount: summary.finance_attested_claim_count,
      businessAttestedClaimCount: summary.business_attested_claim_count,
      claimableClaimCount: summary.claimable_count,
      usageSupportedClaimCount: summary.usage_supported_count,
      fundedNoBaselineClaimCount: summary.funded_no_baseline_count,
      staleClaimCount: summary.stale_count,
      disputedClaimCount: summary.disputed_count,
      baselineLinkedClaimCount: summary.baseline_linked_claim_count,
      targetLinkedClaimCount: summary.target_linked_claim_count,
      actualLinkedClaimCount: summary.actual_linked_claim_count,
      outcomeMeasuredClaimCount: summary.outcome_measured_claim_count,
      candidateAiOpportunities,
      watchPressureSignals:
        summary.funded_no_baseline_count +
        summary.stale_count +
        summary.disputed_count,
      runRatio:
        totalBudget > 0 ? num(budget?.run_budget_usd) / totalBudget : null,
      changeRatio:
        totalBudget > 0 ? num(budget?.change_budget_usd) / totalBudget : null,
      financeValidationRatio:
        summary.claim_count > 0
          ? summary.finance_attested_claim_count / summary.claim_count
          : null,
      decisionQuestion:
        "Are AI and transformation investments producing claimable outcomes?",
      executiveSummary:
        summary.unknown_value_claim_count > 0
          ? `${summary.claim_count} governed value claims are loaded against ${formatCioTowerMoney(promisedAmount)} of promised value. ${summary.outcome_measured_claim_count} have baseline/current/target outcome links, ${formatCioTowerMoney(financeValidatedAmount)} is partial finance-validated value, and ${summary.unknown_value_claim_count} claims still have unknown financial amount. Leadership should treat deployment and usage as evidence to investigate, not realized value.`
          : `${summary.claim_count} governed value claims are loaded with ${formatCioTowerMoney(knownAmount)} of known value. Claimability still depends on attestation and guardrail gates.`,
      sourceFiles: [
        "tower.value_claim",
        "tower.metric_observation",
        "tower.metric_provenance",
        "tower.tracked_subject",
      ],
    };

    const evidenceLineage: TowerMartEvidenceLineage[] = evidenceRows.map(
      (row) => ({
        lineageKey: `tower:${row.provenance_id}`,
        surfaceSection: "metric_observation",
        displayedFact: `${row.source_system} · ${row.source_schema ?? "unknown"}.${row.source_table ?? "unknown"}`,
        displayedValueText: `${row.observation_count} observations`,
        displayedValueNumeric: row.observation_count,
        sourceFile: row.source_file_id,
        sourceRow: row.source_row_pointer,
        sourceSystem: row.source_system,
        caveat: `${row.attestation_status}; formula ${row.formula_version}; ${row.result_hashes?.length ?? 0} result hashes.`,
      }),
    );

    return {
      generatedFrom: "tower_schema",
      headline: command.executiveSummary,
      command,
      valueFunnel: valueFunnelRows(summary),
      programLanes: programs.map(programLane),
      aiPortfolio: aiRows.map(aiPortfolioItem),
      aiPortfolioCounts: {
        total: aiRows.length,
        candidate: candidateAiOpportunities,
        active: aiRows.length,
        funded: aiRows.filter((row) => row.subject_kind === "developer_ai_tool")
          .length,
        embeddedOrUsage: aiRows.filter(
          (row) => row.subject_kind === "service_agent",
        ).length,
        attributedSpendUsd: aiRows.reduce(
          (sum, row) => sum + num(row.estimated_use_cost),
          0,
        ),
      },
      cxoActions: actionRows(summary),
      evidenceLineage,
      requiredFieldGaps: [],
    };
  }

  return null;
}

async function readMeridianCanaryTowerCommandCenter(): Promise<TowerMartCommandViewModel | null> {
  const tenantKey = "meridian_health_global";
  const [summary] = await azureRead.query<MeridianTowerSummaryRow>(
    `select
       (select count(*)::int from foundation_v2_meridian_health_cube_canary.meridian_health_bpo_baseline_v1 where tenant_key=$1) as baseline_rows,
       (select count(*)::int from foundation_v2_meridian_health_cube_canary.meridian_health_enterprise_outcome_v1 where tenant_key=$1) as outcome_count,
       (select count(distinct supplier_id)::int from foundation_v2_meridian_health_cube_canary.meridian_health_supplier_proposal_bafo_v1 where tenant_key=$1) as supplier_count,
       (select count(*)::int from foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1 where tenant_key=$1) as recommendation_input_count,
       (select count(*)::int from foundation_v2_meridian_health_cube_canary.meridian_health_ai_automation_commitment_v1 where tenant_key=$1) as automation_commitment_count,
       (select count(*)::int from foundation_v2_meridian_health_cube_canary.meridian_health_service_credit_v1 where tenant_key=$1) as service_credit_count,
       (select coalesce(sum(annualized_current_state_cost),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_bpo_baseline_v1 where tenant_key=$1) as annualized_current_state_cost,
       (select coalesce(sum(five_year_current_state_baseline_cost),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_bpo_baseline_v1 where tenant_key=$1) as five_year_current_state_baseline_cost,
       (select coalesce(sum(headline_price),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1 where tenant_key=$1) as headline_price,
       (select coalesce(sum(normalized_five_year_tco),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1 where tenant_key=$1) as normalized_five_year_tco,
       (select coalesce(sum(risk_adjustment),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1 where tenant_key=$1) as risk_adjustment,
       (select coalesce(sum(eligible_amount),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_service_credit_v1 where tenant_key=$1) as service_credit_eligible_amount,
       (select coalesce(sum(claimed_amount),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_service_credit_v1 where tenant_key=$1) as service_credit_claimed_amount,
       (select coalesce(sum(annual_cost),0)::numeric from foundation_v2_meridian_health_cube_canary.meridian_health_retained_org_scenario_v1 where tenant_key=$1) as retained_org_annual_cost`,
    [tenantKey],
    { missingTable: "empty" },
  );
  if (!summary || Number(summary.baseline_rows) === 0) return null;

  const [outcomes, recommendations, automations] = await Promise.all([
    azureRead.query<MeridianOutcomeRow>(
      `select
         health_plan_outcome_snapshot_id,
         outcome_name,
         outcome_category,
         trend_state,
         measurement_period,
         evidence_status,
         attestation_status
        from foundation_v2_meridian_health_cube_canary.meridian_health_enterprise_outcome_v1
       where tenant_key=$1
       order by outcome_category, outcome_name
       limit 12`,
      [tenantKey],
      { missingTable: "empty" },
    ),
    azureRead.query<MeridianRecommendationRow>(
      `select
         event_id,
         supplier_id,
         scenario,
         headline_price,
         normalized_five_year_tco,
         risk_adjustment,
         recommendation_state,
         recommendation_basis
        from foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1
       where tenant_key=$1
       order by normalized_five_year_tco asc nulls last, supplier_id, scenario
       limit 12`,
      [tenantKey],
      { missingTable: "empty" },
    ),
    azureRead.query<MeridianAutomationRow>(
      `select
         automation_commitment_id,
         supplier_id,
         process_name,
         ai_rpa_use_case,
         current_manual_volume,
         target_automation_percentage,
         productivity_commitment_pct,
         contracted_benefit_amount,
         commitment_state,
         automation_basis
        from foundation_v2_meridian_health_cube_canary.meridian_health_ai_automation_commitment_v1
       where tenant_key=$1
       order by contracted_benefit_amount desc nulls last, process_name
       limit 16`,
      [tenantKey],
      { missingTable: "empty" },
    ),
  ]);

  const claimCount =
    Number(summary.outcome_count) +
    Number(summary.recommendation_input_count) +
    Number(summary.service_credit_count);
  const normalizedTco = num(summary.normalized_five_year_tco);
  const baselineCost = num(summary.five_year_current_state_baseline_cost);
  const unclaimedCredits =
    num(summary.service_credit_eligible_amount) -
    num(summary.service_credit_claimed_amount);
  const command: TowerMartCommandCenter = {
    commandCenterKey: `tower:${tenantKey}:meridian-canary-command-center`,
    tenantKey,
    tenantName: "Meridian Health",
    martVersion: "meridian-health-layer5-cube-canary-v1",
    sourceStandard:
      "foundation_v2_meridian_health_cube_canary typed projections",
    formulaVersion: "meridian_health_governed_projection_v1",
    totalItBudgetFy26: baselineCost,
    runBudgetFy26: num(summary.annualized_current_state_cost),
    changeBudgetFy26: normalizedTco,
    approvedProgramBudgetFy26: normalizedTco,
    aiTaggedSpendFy26NonAdditive: 0,
    promisedValueFy26: 0,
    partialFinanceValidatedValueYtd: 0,
    realizedValueYtdAllowed: 0,
    valueClaimCount: claimCount,
    knownValueClaimCount: 0,
    unknownValueClaimCount: claimCount,
    knownZeroValueClaimCount: 0,
    knownValueAmountUsd: 0,
    financeAttestedClaimCount: outcomes.filter((row) =>
      (row.attestation_status ?? "").toLowerCase().includes("attest"),
    ).length,
    businessAttestedClaimCount: outcomes.filter((row) =>
      (row.evidence_status ?? "").toLowerCase().includes("accepted"),
    ).length,
    claimableClaimCount: 0,
    usageSupportedClaimCount: Number(summary.automation_commitment_count),
    fundedNoBaselineClaimCount: Number(summary.recommendation_input_count),
    staleClaimCount: 0,
    disputedClaimCount: 0,
    baselineLinkedClaimCount: Number(summary.baseline_rows),
    targetLinkedClaimCount: Number(summary.recommendation_input_count),
    actualLinkedClaimCount: 0,
    outcomeMeasuredClaimCount: Number(summary.outcome_count),
    candidateAiOpportunities: Number(summary.automation_commitment_count),
    watchPressureSignals:
      Number(summary.recommendation_input_count) +
      Number(summary.service_credit_count),
    runRatio:
      baselineCost > 0
        ? num(summary.annualized_current_state_cost) / baselineCost
        : null,
    changeRatio: baselineCost > 0 ? normalizedTco / baselineCost : null,
    financeValidationRatio: null,
    decisionQuestion:
      "Which governed Meridian exposures are ready for recommendation, and which remain evidence gaps?",
    executiveSummary: `${claimCount} governed Meridian decision records are loaded from typed projections. The view shows ${formatCioTowerMoney(baselineCost)} of five-year current-state baseline exposure and ${formatCioTowerMoney(normalizedTco)} of normalized TCO inputs, with realized value held at ${formatCioTowerMoney(0)} until finance-attested claim evidence is loaded.`,
    sourceFiles: [
      "foundation_v2_meridian_health_cube_canary.meridian_health_bpo_baseline_v1",
      "foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1",
      "foundation_v2_meridian_health_cube_canary.meridian_health_enterprise_outcome_v1",
      "foundation_v2_meridian_health_cube_canary.meridian_health_service_credit_v1",
    ],
  };

  const valueFunnel: TowerMartValueFunnelStage[] = [
    {
      funnelKey: `tower:${tenantKey}:funnel:baseline_exposure`,
      sequence: 1,
      stageKey: "baseline_exposure",
      stageLabel: "Baseline exposure",
      valueNumeric: baselineCost,
      denominatorStageKey: null,
      conversionRatio: null,
      claimStatus: "not_a_savings_claim",
      caveat: "Baseline cost is exposure context, not realized value.",
      sourceFile: command.sourceFiles[0] ?? null,
      sourceRow: null,
    },
    {
      funnelKey: `tower:${tenantKey}:funnel:normalized_tco`,
      sequence: 2,
      stageKey: "normalized_tco",
      stageLabel: "Normalized TCO",
      valueNumeric: normalizedTco,
      denominatorStageKey: "baseline_exposure",
      conversionRatio: baselineCost > 0 ? normalizedTco / baselineCost : null,
      claimStatus: "recommendation_input",
      caveat:
        "Normalized TCO supports supplier comparison; it is not booked savings.",
      sourceFile: command.sourceFiles[1] ?? null,
      sourceRow: null,
    },
    {
      funnelKey: `tower:${tenantKey}:funnel:service_credits`,
      sequence: 3,
      stageKey: "service_credits",
      stageLabel: "Service-credit exposure",
      valueNumeric: Math.max(0, unclaimedCredits),
      denominatorStageKey: "baseline_exposure",
      conversionRatio:
        baselineCost > 0 ? Math.max(0, unclaimedCredits) / baselineCost : null,
      claimStatus: "operational_entitlement",
      caveat:
        "Credit eligibility remains separate from collected or realized value.",
      sourceFile: command.sourceFiles[3] ?? null,
      sourceRow: null,
    },
    {
      funnelKey: `tower:${tenantKey}:funnel:claimable`,
      sequence: 4,
      stageKey: "claimable",
      stageLabel: "Claimable value allowed",
      valueNumeric: 0,
      denominatorStageKey: "baseline_exposure",
      conversionRatio: baselineCost > 0 ? 0 : null,
      claimStatus: "blocked",
      caveat:
        "No Meridian projection is promoted into claimable realized value by this reader.",
      sourceFile: null,
      sourceRow: null,
    },
  ];

  return {
    generatedFrom: "tower_schema",
    headline: command.executiveSummary,
    command,
    valueFunnel,
    programLanes: recommendations.map((row, index) => ({
      laneKey: `tower:${tenantKey}:recommendation:${row.supplier_id}:${row.scenario}:${index}`,
      programCode: row.event_id,
      programName: `${row.supplier_id} · ${row.scenario}`,
      ownerRole: "Sourcing decision owner",
      financeOwnerRole: "Finance partner",
      decisionLane: (row.recommendation_state ?? "")
        .toLowerCase()
        .includes("recommended")
        ? "fix"
        : "freeze",
      decisionRationale:
        nullableText(row.recommendation_basis) ??
        "Recommendation input is loaded, but finance claimability is not asserted.",
      approvedFundingUsd: num(row.normalized_five_year_tco),
      aiTaggedSpendUsd: 0,
      promisedValueUsd: 0,
      financeValidatedValueUsd: 0,
      usageMetric: "normalized five-year TCO",
      usageActual: num(row.normalized_five_year_tco),
      adoptionRatePct: null,
      valueClaimStatus: row.recommendation_state ?? "recommendation_input",
      towerClaimAllowed: "blocked",
      requiredGates: [
        {
          ask: "Complete finance and business attestation before treating the recommendation as claimable value.",
          status: "blocked",
        },
      ],
      caveat: `Risk adjustment: ${formatCioTowerMoney(num(row.risk_adjustment))}.`,
      sourceFile: command.sourceFiles[1] ?? null,
      sourceRow: row.supplier_id,
    })),
    aiPortfolio: automations.map((row) => ({
      aiPortfolioKey: `tower:${tenantKey}:automation:${row.automation_commitment_id}`,
      itemName: row.ai_rpa_use_case,
      itemKind: "service_agent",
      vendorName: row.supplier_id,
      systemName: row.process_name,
      aiSpendType: "contractual commitment state",
      aiSpendCategory: "BPO automation",
      fundingStatus: row.commitment_state ?? "commitment_state_unknown",
      decisionLane: (row.commitment_state ?? "")
        .toLowerCase()
        .includes("contract")
        ? "fix"
        : "freeze",
      approvedFundingUsd: 0,
      aiTaggedSpendUsd: 0,
      promisedValueUsd: 0,
      financeValidatedValueUsd: 0,
      usageMetric: "target automation percentage",
      usageActual: num(row.target_automation_percentage),
      adoptionRatePct: num(row.target_automation_percentage),
      valueScore: Math.min(
        100,
        Math.round(num(row.productivity_commitment_pct)),
      ),
      readinessScore: Math.min(
        100,
        Math.round(num(row.target_automation_percentage)),
      ),
      riskScore: (row.commitment_state ?? "").toLowerCase().includes("contract")
        ? 45
        : 70,
      duplicateRisk: null,
      valueClaimStatus: row.commitment_state ?? "not_attested",
      towerClaimAllowed: "blocked",
      caveat:
        nullableText(row.automation_basis) ??
        "Automation commitment is shown as contract/proposal state, not realized value.",
      sourceFile:
        "foundation_v2_meridian_health_cube_canary.meridian_health_ai_automation_commitment_v1",
      sourceRow: row.automation_commitment_id,
    })),
    aiPortfolioCounts: {
      total: automations.length,
      candidate: automations.filter(
        (row) =>
          !(row.commitment_state ?? "").toLowerCase().includes("contract"),
      ).length,
      active: automations.length,
      funded: automations.filter((row) =>
        (row.commitment_state ?? "").toLowerCase().includes("contract"),
      ).length,
      embeddedOrUsage: automations.length,
      attributedSpendUsd: 0,
    },
    cxoActions: [
      {
        actionKey: "tower-meridian-attestation",
        sequence: 1,
        actionLane: "fix",
        title: "Separate recommendation inputs from realized value",
        actionBody:
          "Keep normalized TCO, service credits and automation commitments in the decision-input lane until finance and business attestations are loaded.",
        ownerHint: "Finance partner",
        moduleHandoff: "Moves",
      },
      {
        actionKey: "tower-meridian-service-credit",
        sequence: 2,
        actionLane: "fix",
        title: "Review service-credit entitlement",
        actionBody: `${formatCioTowerMoney(Math.max(0, unclaimedCredits))} is visible as unclaimed service-credit exposure, not collected value.`,
        ownerHint: "Vendor management",
        moduleHandoff: "Source",
      },
    ],
    evidenceLineage: [
      {
        lineageKey: `tower:${tenantKey}:baseline`,
        surfaceSection: "baseline",
        displayedFact: "BPO baseline projection rows",
        displayedValueText: String(summary.baseline_rows),
        displayedValueNumeric: Number(summary.baseline_rows),
        sourceFile: command.sourceFiles[0] ?? null,
        sourceRow: null,
        sourceSystem: "foundation_v2",
        caveat: "Typed projection; generic observations are not exposed.",
      },
      {
        lineageKey: `tower:${tenantKey}:outcomes`,
        surfaceSection: "outcomes",
        displayedFact: "Enterprise outcome snapshot rows",
        displayedValueText: String(summary.outcome_count),
        displayedValueNumeric: Number(summary.outcome_count),
        sourceFile: command.sourceFiles[2] ?? null,
        sourceRow: outcomes[0]?.health_plan_outcome_snapshot_id ?? null,
        sourceSystem: "foundation_v2",
        caveat:
          "Outcome snapshots inform context; they do not calculate quality measures.",
      },
    ],
    requiredFieldGaps: [],
  };
}
