// The keystone: assemble all 7 cio_tower.mart_* tables from the unified
// cio_tower.facts layer. This is the SINGLE Tower projection path — the
// assembler reads only facts (real tower_* operational + curated/synthetic V3
// budget & program, already precedence-merged by canonical identity), never a
// CSV or a tower_* table directly.
//
// Discipline baked in, matching the reviewed guardrails:
//   - merge by canonical identity, never display name
//   - realized value is NEVER claimable unless tower_claim_allowed permits
//   - missing budget/program/value fields emit mart_required_field_gaps, never zeros
//   - every Tower-visible value gets a mart_evidence_lineage row
//   - reference/synthetic rows are labeled, never invisible filler
//
// Pure functions, no I/O — the whole CXO story is provable on fact fixtures.

import {
  type CioTowerFactRow,
  type CanonicalIdentity,
  readCanonicalIdentity,
} from "./facts-schema";
import {
  BUDGET_METRIC_KEYS,
  PROGRAM_METRIC_KEYS,
  SPEND_METRIC_KEYS,
  ADOPTION_METRIC_KEYS,
  type ValueClaimStatus,
  type TowerClaimAllowed,
  type DecisionLane,
} from "./mart-metric-keys";
import {
  type ToolProgramCrosswalk,
  emptyCrosswalk,
} from "./tool-identity-crosswalk";

// ---------------------------------------------------------------------------
// Mart output row types — field-for-field write-compatible with
// supabase/migrations/20260717164000_cio_tower_command_mart_v1.sql
// ---------------------------------------------------------------------------

export interface MartCommandCenterRow {
  command_center_key: string;
  tenant_key: string;
  tenant_name: string;
  mart_version: string;
  source_standard: string;
  formula_version: string;
  source_run_id: string | null;
  total_it_budget_fy26: number;
  run_budget_fy26: number;
  change_budget_fy26: number;
  approved_program_budget_fy26: number;
  ai_tagged_spend_fy26_non_additive: number;
  promised_value_fy26: number;
  partial_finance_validated_value_ytd: number;
  realized_value_ytd_allowed: number;
  candidate_ai_opportunities: number;
  watch_pressure_signals: number;
  run_ratio: number | null;
  change_ratio: number | null;
  finance_validation_ratio: number | null;
  decision_question: string;
  executive_summary: string;
  source_fact_keys: string[];
  source_files: string[];
}

export interface MartValueFunnelRow {
  funnel_key: string;
  tenant_key: string;
  sequence: number;
  stage_key: string;
  stage_label: string;
  value_numeric: number;
  denominator_stage_key: string | null;
  conversion_ratio: number | null;
  claim_status: string;
  caveat: string;
  source_fact_keys: string[];
  source_file: string | null;
  source_row: string | null;
  formula_version: string;
}

export interface MartProgramDecisionLaneRow {
  lane_key: string;
  tenant_key: string;
  program_code: string | null;
  program_name: string;
  owner_role: string | null;
  finance_owner_role: string | null;
  decision_lane: DecisionLane;
  decision_rationale: string;
  approved_funding_usd: number;
  ai_tagged_spend_usd: number;
  promised_value_usd: number;
  finance_validated_value_usd: number;
  usage_metric: string | null;
  usage_actual: number | null;
  adoption_rate_pct: number | null;
  value_claim_status: string;
  tower_claim_allowed: string;
  required_gates: unknown[];
  caveat: string;
  evidence_ids: string[];
  source_fact_keys: string[];
  source_file: string | null;
  source_row: string | null;
  formula_version: string;
}

export type MartAiPortfolioItemKind =
  | "funded_program"
  | "embedded_platform"
  | "candidate_opportunity"
  | "usage_benefit";

export interface MartAiPortfolioRow {
  ai_portfolio_key: string;
  tenant_key: string;
  item_name: string;
  item_kind: MartAiPortfolioItemKind;
  vendor_name: string | null;
  system_name: string | null;
  ai_spend_type: string | null;
  ai_spend_category: string | null;
  funding_status: string | null;
  decision_lane: DecisionLane;
  approved_funding_usd: number;
  ai_tagged_spend_usd: number;
  promised_value_usd: number;
  finance_validated_value_usd: number;
  usage_metric: string | null;
  usage_actual: number | null;
  adoption_rate_pct: number | null;
  value_score: number;
  readiness_score: number;
  risk_score: number;
  platform_embedded_ai_flag: boolean;
  duplicate_risk: string | null;
  value_claim_status: string;
  tower_claim_allowed: string;
  caveat: string;
  evidence_ids: string[];
  source_fact_keys: string[];
  source_file: string | null;
  source_row: string | null;
  formula_version: string;
}

export interface MartCxoActionRow {
  action_key: string;
  tenant_key: string;
  sequence: number;
  action_lane: "fund" | "fix" | "freeze" | "stop" | "govern";
  title: string;
  action_body: string;
  owner_hint: string | null;
  module_handoff: string | null;
  evidence_ids: string[];
  source_fact_keys: string[];
  formula_version: string;
}

export interface MartEvidenceLineageRow {
  lineage_key: string;
  tenant_key: string;
  surface_section: string;
  displayed_fact: string;
  displayed_value_text: string | null;
  displayed_value_numeric: number | null;
  source_file: string | null;
  source_row: string | null;
  source_system: string | null;
  source_fact_keys: string[];
  formula_version: string;
  caveat: string;
}

export interface MartRequiredFieldGapRow {
  gap_key: string;
  tenant_key: string;
  mart_table: string;
  mart_record_key: string;
  required_field: string;
  source_template: string;
  source_record_id: string | null;
  severity: "blocking" | "warning" | "info";
  owner_hint: string | null;
  remediation_action: string;
  blocking: boolean;
  formula_version: string;
}

export interface AssembledMart {
  command_center: MartCommandCenterRow[];
  value_funnel: MartValueFunnelRow[];
  program_decision_lanes: MartProgramDecisionLaneRow[];
  ai_portfolio: MartAiPortfolioRow[];
  cxo_actions: MartCxoActionRow[];
  evidence_lineage: MartEvidenceLineageRow[];
  required_field_gaps: MartRequiredFieldGapRow[];
}

export interface AssembleMartOptions {
  tenantKey: string;
  tenantName: string;
  martVersion: string;
  formulaVersion: string;
  sourceStandard: string;
  sourceRunId?: string | null;
  sourceFiles?: string[];
  /** Tool → program crosswalk so real tool telemetry rolls up to the funded
   * program it is evidence for. Omit for no crosswalk (tools stay standalone). */
  crosswalk?: ToolProgramCrosswalk;
}

// ---------------------------------------------------------------------------
// Program aggregate — the pivot of facts into a per-identity record.
// ---------------------------------------------------------------------------

interface ProgramAggregate {
  identityKey: string;
  programCode: string | null;
  programName: string;
  vendorName: string | null;
  systemName: string | null;
  isProgram: boolean; // has a canonical_program_key (a funded bet, not a raw tool)
  approvedFunding: number | null;
  aiTaggedSpend: number;
  promisedValue: number | null;
  financeValidatedValue: number | null;
  usageMetric: string | null;
  usageActual: number | null;
  adoptionRatePct: number | null;
  factKeys: string[];
  sourceRefs: Array<{
    file: string | null;
    row: string | null;
    system: string | null;
  }>;
  anyTenantFile: boolean;
}

function attr(fact: CioTowerFactRow): Record<string, unknown> {
  try {
    return JSON.parse(fact.attributes) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function identityGroupKey(
  id: CanonicalIdentity,
  crosswalk: ToolProgramCrosswalk,
): { key: string; programCode: string | null; viaCrosswalk: boolean } {
  // A funded program key always wins as the grouping anchor.
  if (id.canonical_program_key) {
    return {
      key: id.canonical_program_key,
      programCode: id.program_code,
      viaCrosswalk: false,
    };
  }
  // Otherwise, if this tool rolls up to a program via the alias table, group
  // the telemetry UNDER that program so real usage/spend attaches to the bet.
  const link = crosswalk.resolve(id.canonical_tool_key);
  if (link) {
    return {
      key: link.programKey,
      programCode: link.programCode,
      viaCrosswalk: true,
    };
  }
  // Unlinked tool/system — stays as its own row (a candidate/usage_benefit).
  return {
    key: id.canonical_tool_key ?? "__unidentified__",
    programCode: id.program_code,
    viaCrosswalk: false,
  };
}

function aggregatePrograms(
  facts: readonly CioTowerFactRow[],
  crosswalk: ToolProgramCrosswalk,
): ProgramAggregate[] {
  const groups = new Map<string, ProgramAggregate>();
  for (const fact of facts) {
    const id = readCanonicalIdentity(fact);
    if (!id) continue;
    const resolved = identityGroupKey(id, crosswalk);
    const key = resolved.key;
    if (key === "__unidentified__") continue;
    let agg = groups.get(key);
    if (!agg) {
      agg = {
        identityKey: key,
        programCode: resolved.programCode ?? id.program_code,
        programName:
          id.system_name ?? resolved.programCode ?? id.program_code ?? key,
        vendorName: id.vendor_name,
        systemName: id.system_name,
        // A group is a funded program if it is anchored on a program key —
        // either directly or because a tool rolled up into one.
        isProgram: id.canonical_program_key !== null || resolved.viaCrosswalk,
        approvedFunding: null,
        aiTaggedSpend: 0,
        promisedValue: null,
        financeValidatedValue: null,
        usageMetric: null,
        usageActual: null,
        adoptionRatePct: null,
        factKeys: [],
        sourceRefs: [],
        anyTenantFile: false,
      };
      groups.set(key, agg);
    }
    agg.factKeys.push(fact.fact_key);
    if (fact.value_source === "tenant_file") agg.anyTenantFile = true;
    // A program fact is authoritative for the display name/code/vendor of the
    // group — a tool that rolled up should not rename the funded program.
    if (id.canonical_program_key) {
      agg.isProgram = true;
      if (id.system_name) agg.programName = id.system_name;
      if (id.program_code) agg.programCode = id.program_code;
      if (id.vendor_name && !agg.vendorName) agg.vendorName = id.vendor_name;
      if (id.system_name && !agg.systemName) agg.systemName = id.system_name;
    }
    const a = attr(fact);
    agg.sourceRefs.push({
      file: fact.source_key,
      row: fact.source_row,
      system: (a.source_system as string) ?? null,
    });

    const v = fact.value_numeric ?? 0;
    const mk = id.metric_key;
    if (mk === PROGRAM_METRIC_KEYS.approvedFunding) {
      agg.approvedFunding = (agg.approvedFunding ?? 0) + v;
    } else if (mk === PROGRAM_METRIC_KEYS.promisedValue) {
      agg.promisedValue = (agg.promisedValue ?? 0) + v;
    } else if (mk === PROGRAM_METRIC_KEYS.financeValidatedValue) {
      agg.financeValidatedValue = (agg.financeValidatedValue ?? 0) + v;
    } else if (SPEND_METRIC_KEYS.has(mk)) {
      agg.aiTaggedSpend += v;
    } else if (ADOPTION_METRIC_KEYS.has(mk)) {
      // Prefer active_users as the headline usage metric; keep seat
      // utilization as adoption rate.
      if (mk === "ai_tool_active_users") {
        agg.usageMetric = "active_users";
        agg.usageActual = v;
      } else if (mk === "ai_tool_seat_utilization") {
        agg.adoptionRatePct = v * 100;
      } else if (
        mk === "ai_tool_acceptance_rate_pct" &&
        agg.usageMetric === null
      ) {
        agg.usageMetric = "acceptance_rate_pct";
        agg.usageActual = v;
      }
    }
  }
  return [...groups.values()];
}

// ---------------------------------------------------------------------------
// Value-claim + decision-lane semantics — ported faithfully from
// scripts/tower/project-meridian-v3-to-cio-tower.mjs so the mart meaning does
// not change, only the source it is assembled from.
// ---------------------------------------------------------------------------

function valueClaim(agg: ProgramAggregate): {
  status: ValueClaimStatus;
  allowed: TowerClaimAllowed;
} {
  if ((agg.financeValidatedValue ?? 0) > 0) {
    return { status: "partial_validated", allowed: "partial" };
  }
  if ((agg.promisedValue ?? 0) > 0 && agg.usageActual !== null) {
    return { status: "promised_with_usage", allowed: "no" };
  }
  if ((agg.promisedValue ?? 0) > 0) {
    return { status: "promised_only", allowed: "no" };
  }
  if ((agg.approvedFunding ?? 0) > 0) {
    return { status: "funded_no_value_case", allowed: "no" };
  }
  return { status: "not_loaded", allowed: "no" };
}

function decisionLane(
  agg: ProgramAggregate,
  claim: { status: ValueClaimStatus; allowed: TowerClaimAllowed },
): DecisionLane {
  if (claim.allowed === "partial" && (agg.financeValidatedValue ?? 0) > 0)
    return "fund";
  if ((agg.approvedFunding ?? 0) <= 0) {
    // Real, used, but unfunded → it's live spend with no funding case: stop/redesign.
    return agg.aiTaggedSpend > 0 ? "stop" : "freeze";
  }
  if ((agg.promisedValue ?? 0) <= 0) return "freeze";
  return "fix";
}

function decisionRationale(agg: ProgramAggregate, lane: DecisionLane): string {
  switch (lane) {
    case "fund":
      return `${agg.programName} has usage and partial finance validation, but Tower still treats the value as partial, not realized.`;
    case "fix":
      return `${agg.programName} has approved funding or promised value, but baseline, KPI, usage, or finance evidence must be completed before scaling the next tranche.`;
    case "freeze":
      return `${agg.programName} should not receive incremental funding until its funding boundary, readiness gate, or evidence posture is resolved.`;
    default:
      return `${agg.programName} is spending without an approved funding-and-value chain and should be stopped or redesigned until it proves usage and business impact.`;
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return round(numerator / denominator);
}

function sumBudget(
  facts: readonly CioTowerFactRow[],
  metricKey: string,
): number {
  let total = 0;
  for (const fact of facts) {
    const id = readCanonicalIdentity(fact);
    if (id?.metric_key === metricKey) total += fact.value_numeric ?? 0;
  }
  return total;
}

function scoreValue(agg: ProgramAggregate): number {
  if ((agg.financeValidatedValue ?? 0) > 0) return 78;
  if ((agg.promisedValue ?? 0) > 0 && agg.usageActual !== null) return 60;
  if ((agg.promisedValue ?? 0) > 0) return 45;
  return 25;
}

function scoreReadiness(claim: { allowed: TowerClaimAllowed }): number {
  return claim.allowed === "partial" ? 72 : 45;
}

function scoreRisk(claim: { allowed: TowerClaimAllowed }): number {
  return claim.allowed === "partial" ? 42 : 68;
}

/**
 * Assemble the full mart from a precedence-merged fact set for one tenant.
 * Every returned row is write-compatible with cio_tower.mart_*; nothing here
 * touches a DB. Missing required fields become gaps, never fabricated zeros.
 */
export function assembleMartFromFacts(
  facts: readonly CioTowerFactRow[],
  opts: AssembleMartOptions,
): AssembledMart {
  const { tenantKey, tenantName, martVersion, formulaVersion, sourceStandard } =
    opts;
  const sourceRunId = opts.sourceRunId ?? null;
  const evidence: MartEvidenceLineageRow[] = [];
  const gaps: MartRequiredFieldGapRow[] = [];

  const pushEvidence = (
    section: string,
    displayedFact: string,
    valueNumeric: number | null,
    factKeys: string[],
    ref: { file: string | null; row: string | null; system: string | null },
    caveat = "",
  ): void => {
    evidence.push({
      lineage_key: `${tenantKey}::${section}::${displayedFact}`.slice(0, 240),
      tenant_key: tenantKey,
      surface_section: section,
      displayed_fact: displayedFact,
      displayed_value_text: null,
      displayed_value_numeric: valueNumeric,
      source_file: ref.file,
      source_row: ref.row,
      source_system: ref.system,
      source_fact_keys: factKeys,
      formula_version: formulaVersion,
      caveat,
    });
  };

  const pushGap = (
    martTable: string,
    recordKey: string,
    field: string,
    remediation: string,
    severity: MartRequiredFieldGapRow["severity"],
    ownerHint: string | null = null,
  ): void => {
    gaps.push({
      gap_key: `${tenantKey}::${martTable}::${recordKey}::${field}`.slice(
        0,
        240,
      ),
      tenant_key: tenantKey,
      mart_table: martTable,
      mart_record_key: recordKey,
      required_field: field,
      source_template: "unified_facts",
      source_record_id: null,
      severity,
      owner_hint: ownerHint,
      remediation_action: remediation,
      blocking: severity === "blocking",
      formula_version: formulaVersion,
    });
  };

  // --- Budget envelope -----------------------------------------------------
  const totalBudget = sumBudget(facts, BUDGET_METRIC_KEYS.total);
  const runBudget = sumBudget(facts, BUDGET_METRIC_KEYS.run);
  const changeBudget = sumBudget(facts, BUDGET_METRIC_KEYS.change);

  const aggregates = aggregatePrograms(
    facts,
    opts.crosswalk ?? emptyCrosswalk(),
  );

  // --- Program decision lanes + AI portfolio -------------------------------
  const lanes: MartProgramDecisionLaneRow[] = [];
  const portfolio: MartAiPortfolioRow[] = [];
  let approvedProgramBudget = 0;
  let promisedValueTotal = 0;
  let partialValidatedTotal = 0;
  let candidateCount = 0;

  for (const agg of aggregates) {
    const claim = valueClaim(agg);
    const lane = decisionLane(agg, claim);
    const ref = agg.sourceRefs[0] ?? { file: null, row: null, system: null };
    approvedProgramBudget += agg.approvedFunding ?? 0;
    promisedValueTotal += agg.promisedValue ?? 0;
    partialValidatedTotal += agg.financeValidatedValue ?? 0;

    const caveat =
      claim.allowed === "partial"
        ? "Finance has validated only part of this value; Tower shows partial, not realized."
        : claim.status === "not_loaded"
          ? "No value case loaded; treat as spend, not value."
          : "Value is promised, not finance-validated; not claimable as realized.";

    // Only funded bets become decision lanes; raw tools without a funding
    // case are portfolio usage_benefit rows, surfaced but not lane-managed.
    if (agg.isProgram || (agg.approvedFunding ?? 0) > 0) {
      const laneKey = `${tenantKey}::lane::${agg.identityKey}`.slice(0, 240);
      lanes.push({
        lane_key: laneKey,
        tenant_key: tenantKey,
        program_code: agg.programCode,
        program_name: agg.programName,
        owner_role: null,
        finance_owner_role: null,
        decision_lane: lane,
        decision_rationale: decisionRationale(agg, lane),
        approved_funding_usd: round(agg.approvedFunding ?? 0),
        ai_tagged_spend_usd: round(agg.aiTaggedSpend),
        promised_value_usd: round(agg.promisedValue ?? 0),
        finance_validated_value_usd: round(agg.financeValidatedValue ?? 0),
        usage_metric: agg.usageMetric,
        usage_actual: agg.usageActual,
        adoption_rate_pct: agg.adoptionRatePct,
        value_claim_status: claim.status,
        tower_claim_allowed: claim.allowed,
        required_gates: [],
        caveat,
        evidence_ids: [],
        source_fact_keys: agg.factKeys,
        source_file: ref.file,
        source_row: ref.row,
        formula_version: formulaVersion,
      });
      pushEvidence(
        "program_decision_lanes",
        `${agg.programName} decision lane`,
        agg.approvedFunding ?? 0,
        agg.factKeys,
        ref,
        caveat,
      );
      // Gap discipline: a funded program with no promised value / no finance
      // validation is a gap, not a zero.
      if ((agg.promisedValue ?? 0) <= 0) {
        pushGap(
          "cio_tower.mart_program_decision_lanes",
          laneKey,
          "promised_value_usd",
          `Load a promised-value case for ${agg.programName} or mark it mandatory/no-value spend.`,
          "warning",
        );
      }
      if ((agg.financeValidatedValue ?? 0) <= 0) {
        pushGap(
          "cio_tower.mart_program_decision_lanes",
          laneKey,
          "finance_validated_value_usd",
          `Finance validation for ${agg.programName} not loaded; realized value stays blocked until it is.`,
          "warning",
        );
      }
    } else {
      candidateCount += 1;
    }

    const itemKind: MartAiPortfolioItemKind = agg.isProgram
      ? "funded_program"
      : agg.aiTaggedSpend > 0
        ? "usage_benefit"
        : "candidate_opportunity";
    const portfolioKey = `${tenantKey}::ai::${agg.identityKey}`.slice(0, 240);
    portfolio.push({
      ai_portfolio_key: portfolioKey,
      tenant_key: tenantKey,
      item_name: agg.programName,
      item_kind: itemKind,
      vendor_name: agg.vendorName,
      system_name: agg.systemName,
      ai_spend_type: agg.aiTaggedSpend > 0 ? "ai_tagged" : null,
      ai_spend_category: null,
      funding_status: (agg.approvedFunding ?? 0) > 0 ? "approved" : null,
      decision_lane: lane,
      approved_funding_usd: round(agg.approvedFunding ?? 0),
      ai_tagged_spend_usd: round(agg.aiTaggedSpend),
      promised_value_usd: round(agg.promisedValue ?? 0),
      finance_validated_value_usd: round(agg.financeValidatedValue ?? 0),
      usage_metric: agg.usageMetric,
      usage_actual: agg.usageActual,
      adoption_rate_pct: agg.adoptionRatePct,
      value_score: scoreValue(agg),
      readiness_score: scoreReadiness(claim),
      risk_score: scoreRisk(claim),
      platform_embedded_ai_flag: false,
      duplicate_risk: null,
      value_claim_status: claim.status,
      tower_claim_allowed: claim.allowed,
      caveat,
      evidence_ids: [],
      source_fact_keys: agg.factKeys,
      source_file: ref.file,
      source_row: ref.row,
      formula_version: formulaVersion,
    });
    pushEvidence(
      "ai_portfolio",
      `${agg.programName} AI-tagged spend`,
      round(agg.aiTaggedSpend),
      agg.factKeys,
      ref,
      agg.anyTenantFile
        ? ""
        : "Reference/synthetic estimate — no real extract loaded.",
    );
  }

  const aiTaggedSpendTotal = round(
    aggregates.reduce((sum, a) => sum + a.aiTaggedSpend, 0),
  );

  // --- Command center ------------------------------------------------------
  if (totalBudget <= 0) {
    pushGap(
      "cio_tower.mart_command_center",
      `${tenantKey}::${martVersion}::command-center`,
      "total_it_budget_fy26",
      "IT budget envelope not loaded from V3 08/SA02; command-center totals are incomplete.",
      "blocking",
    );
  }
  const commandCenter: MartCommandCenterRow = {
    command_center_key: `${tenantKey}::${martVersion}::command-center`,
    tenant_key: tenantKey,
    tenant_name: tenantName,
    mart_version: martVersion,
    source_standard: sourceStandard,
    formula_version: formulaVersion,
    source_run_id: sourceRunId,
    total_it_budget_fy26: round(totalBudget),
    run_budget_fy26: round(runBudget),
    change_budget_fy26: round(changeBudget),
    approved_program_budget_fy26: round(approvedProgramBudget),
    ai_tagged_spend_fy26_non_additive: aiTaggedSpendTotal,
    promised_value_fy26: round(promisedValueTotal),
    partial_finance_validated_value_ytd: round(partialValidatedTotal),
    // Realized value is NEVER auto-claimed. It is only ever > 0 when a future
    // "validated/realized" state is explicitly loaded — which this assembler
    // does not synthesize.
    realized_value_ytd_allowed: 0,
    candidate_ai_opportunities: candidateCount,
    watch_pressure_signals: gaps.filter((g) => g.blocking).length,
    run_ratio: ratio(runBudget, totalBudget),
    change_ratio: ratio(changeBudget, totalBudget),
    finance_validation_ratio: ratio(partialValidatedTotal, promisedValueTotal),
    decision_question:
      "Which AI/technology bets deserve more capital, which need evidence, which are blocked, and which should stop?",
    executive_summary: buildExecutiveSummary({
      tenantName,
      totalBudget,
      runBudget,
      aiTaggedSpendTotal,
      promisedValueTotal,
      partialValidatedTotal,
      lanes,
    }),
    source_fact_keys: aggregates.flatMap((a) => a.factKeys).slice(0, 200),
    source_files: opts.sourceFiles ?? [],
  };

  // --- Value funnel --------------------------------------------------------
  const funnel = buildValueFunnel({
    tenantKey,
    formulaVersion,
    approvedProgramBudget,
    aiTaggedSpendTotal,
    promisedValueTotal,
    partialValidatedTotal,
    usedProgramCount: lanes.filter((l) => l.usage_actual !== null).length,
    totalProgramCount: lanes.length,
  });

  // --- CXO actions (one per non-empty lane bucket) -------------------------
  const cxoActions = buildCxoActions(tenantKey, formulaVersion, lanes, gaps);

  return {
    command_center: [commandCenter],
    value_funnel: funnel,
    program_decision_lanes: lanes,
    ai_portfolio: portfolio,
    cxo_actions: cxoActions,
    evidence_lineage: evidence,
    required_field_gaps: gaps,
  };
}

function buildExecutiveSummary(args: {
  tenantName: string;
  totalBudget: number;
  runBudget: number;
  aiTaggedSpendTotal: number;
  promisedValueTotal: number;
  partialValidatedTotal: number;
  lanes: MartProgramDecisionLaneRow[];
}): string {
  const usd = (n: number): string =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${Math.round(n).toLocaleString()}`;
  const runPct =
    args.totalBudget > 0
      ? Math.round((args.runBudget / args.totalBudget) * 100)
      : 0;
  const laneCounts = args.lanes.reduce<Record<string, number>>((acc, l) => {
    acc[l.decision_lane] = (acc[l.decision_lane] ?? 0) + 1;
    return acc;
  }, {});
  const lanePhrase = (["fund", "fix", "freeze", "stop"] as const)
    .filter((l) => laneCounts[l])
    .map((l) => `${laneCounts[l]} ${l}`)
    .join(", ");
  const budgetClause =
    args.totalBudget > 0
      ? `Modeled technology spend is ${usd(args.totalBudget)}, about ${runPct}% run/operate.`
      : "Total technology budget is not yet loaded, so the run/change split cannot be shown.";
  return (
    `${budgetClause} AI-tagged spend is ${usd(args.aiTaggedSpendTotal)} against ${usd(args.promisedValueTotal)} promised value, ` +
    `of which finance has partially validated ${usd(args.partialValidatedTotal)}. ` +
    (lanePhrase
      ? `Across funded bets the decision posture is ${lanePhrase}. `
      : "") +
    "Realized value stays blocked until usage, KPI movement, and finance validation line up."
  );
}

function buildValueFunnel(args: {
  tenantKey: string;
  formulaVersion: string;
  approvedProgramBudget: number;
  aiTaggedSpendTotal: number;
  promisedValueTotal: number;
  partialValidatedTotal: number;
  usedProgramCount: number;
  totalProgramCount: number;
}): MartValueFunnelRow[] {
  const stages: Array<{
    key: string;
    label: string;
    value: number;
    denom: string | null;
    claim: string;
    caveat: string;
  }> = [
    {
      key: "approved_funding",
      label: "Approved program funding",
      value: args.approvedProgramBudget,
      denom: null,
      claim: "funded",
      caveat: "",
    },
    {
      key: "ai_tagged_spend",
      label: "AI-tagged spend",
      value: args.aiTaggedSpendTotal,
      denom: "approved_funding",
      claim: "spending",
      caveat: "Non-additive lens on the funded base.",
    },
    {
      key: "promised_value",
      label: "Promised value",
      value: args.promisedValueTotal,
      denom: "approved_funding",
      claim: "promised",
      caveat: "Business-case value, not yet evidenced.",
    },
    {
      key: "finance_validated",
      label: "Finance-validated (partial)",
      value: args.partialValidatedTotal,
      denom: "promised_value",
      claim: "partial",
      caveat: "Only partially validated by finance.",
    },
    {
      key: "realized_claimable",
      label: "Realized / claimable",
      value: 0,
      denom: "finance_validated",
      claim: "blocked",
      caveat: "Realized value is not claimable until validation completes.",
    },
  ];
  return stages.map((s, i) => ({
    funnel_key: `${args.tenantKey}::funnel::${s.key}`,
    tenant_key: args.tenantKey,
    sequence: i + 1,
    stage_key: s.key,
    stage_label: s.label,
    value_numeric: round(s.value),
    denominator_stage_key: s.denom,
    conversion_ratio: null,
    claim_status: s.claim,
    caveat: s.caveat,
    source_fact_keys: [],
    source_file: null,
    source_row: null,
    formula_version: args.formulaVersion,
  }));
}

function buildCxoActions(
  tenantKey: string,
  formulaVersion: string,
  lanes: MartProgramDecisionLaneRow[],
  gaps: MartRequiredFieldGapRow[],
): MartCxoActionRow[] {
  const actions: MartCxoActionRow[] = [];
  let seq = 0;
  const laneGroups: Array<{
    lane: MartCxoActionRow["action_lane"];
    verb: string;
  }> = [
    { lane: "fund", verb: "Protect or scale" },
    { lane: "fix", verb: "Run a 30-day evidence sprint on" },
    { lane: "freeze", verb: "Hold incremental funding on" },
    { lane: "stop", verb: "Stop or redesign" },
  ];
  for (const g of laneGroups) {
    const inLane = lanes.filter((l) => l.decision_lane === g.lane);
    if (inLane.length === 0) continue;
    seq += 1;
    actions.push({
      action_key: `${tenantKey}::action::${g.lane}`,
      tenant_key: tenantKey,
      sequence: seq,
      action_lane: g.lane,
      title: `${g.verb} ${inLane.length} program${inLane.length === 1 ? "" : "s"}`,
      action_body: `${g.verb}: ${inLane.map((l) => l.program_name).join(", ")}.`,
      owner_hint: g.lane === "fund" || g.lane === "stop" ? "CIO + CFO" : "CDAO",
      module_handoff: g.lane === "fix" ? "Moves" : null,
      evidence_ids: [],
      source_fact_keys: inLane.flatMap((l) => l.source_fact_keys).slice(0, 50),
      formula_version: formulaVersion,
    });
  }
  const blockingGaps = gaps.filter((g) => g.blocking);
  if (blockingGaps.length > 0) {
    seq += 1;
    actions.push({
      action_key: `${tenantKey}::action::govern`,
      tenant_key: tenantKey,
      sequence: seq,
      action_lane: "govern",
      title: `Close ${blockingGaps.length} blocking evidence gap${blockingGaps.length === 1 ? "" : "s"}`,
      action_body: blockingGaps.map((g) => g.remediation_action).join(" "),
      owner_hint: "CDAO",
      module_handoff: "Source",
      evidence_ids: [],
      source_fact_keys: [],
      formula_version: formulaVersion,
    });
  }
  return actions;
}
