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
    if (canonical === "skyharbor-air" || value === "skyharbor_global") {
      out.add("skyharbor_global");
    }
  }
  return [...out];
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
