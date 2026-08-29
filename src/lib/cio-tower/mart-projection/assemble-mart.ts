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
  claimable_value: number;
  finance_validated_blocked_value: number;
  promised_value_exposure: number;
  unknown_value_claim_count: number;
  claimable_program_count: number;
  blocked_program_count: number;
  conflicted_program_count: number;
  unmeasured_program_count: number;
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
  claim_count: number;
  known_value_claim_count: number;
  unknown_value_claim_count: number;
  known_value_amount: number;
  blocked_claim_count: number;
  blocked_known_value_amount: number;
  primary_blocker: string | null;
  primary_owner_role: string | null;
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
  funded_amount: number;
  ai_tagged_spend_usd: number;
  promised_value_usd: number;
  finance_validated_value_usd: number;
  known_supported_value: number;
  proof_maturity_score: number;
  risk_pressure_score: number;
  usage_strength_score: number;
  lineage_trust_state: "AGREE" | "ONE_SOURCE" | "CONFLICT" | "ABSENT";
  decision_reason_code:
    | "SCALE"
    | "FIX_PROOF"
    | "WATCH"
    | "FREEZE"
    | "STOP_REDESIGN";
  amount_blocked: number;
  next_gate: string | null;
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
  action_id: string;
  tenant_key: string;
  sequence: number;
  action_lane: "fund" | "fix" | "freeze" | "stop" | "govern";
  title: string;
  action_body: string;
  owner_hint: string | null;
  module_handoff: string | null;
  program_id: string | null;
  claim_id: string | null;
  proof_stage: string | null;
  blocked_decision: string | null;
  amount_exposed: number;
  evidence_requirement: string | null;
  expected_source_system: string | null;
  evidence_package_id: string | null;
  owner_role: string | null;
  secondary_owner_role: string | null;
  due_window: string | null;
  due_date: string | null;
  handoff_module: string | null;
  handoff_entity_id: string | null;
  handoff_readiness: "ready" | "needs_evidence" | "not_ready";
  action_state: "open" | "in_progress" | "closed" | "waived";
  priority: "high" | "medium" | "low";
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
  metric_or_fact_key: string | null;
  board_visible_label: string | null;
  lineage_state: "AGREE" | "ONE_SOURCE" | "CONFLICT" | "ABSENT";
  source_count: number;
  source_refs: Array<{
    file: string | null;
    row: string | null;
    system: string | null;
  }>;
  conflicting_values: unknown[];
  authoritative_value: string | null;
  resolution_owner_role: string | null;
  resolution_state: "not_required" | "open" | "resolved" | "waived";
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
  ownerRole: string | null;
  financeOwnerRole: string | null;
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
  sourceContractId: string | null;
  sourceOpportunityId: string | null;
}

function attr(fact: CioTowerFactRow): Record<string, unknown> {
  try {
    return JSON.parse(fact.attributes) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function textAttr(
  attributes: Record<string, unknown>,
  key: string,
): string | null {
  const value = attributes[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
        ownerRole: null,
        financeOwnerRole: null,
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
        sourceContractId: null,
        sourceOpportunityId: null,
      };
      groups.set(key, agg);
    }
    agg.factKeys.push(fact.fact_key);
    if (fact.value_source === "tenant_file") agg.anyTenantFile = true;
    const a = attr(fact);
    const evidenceOwner = textAttr(a, "evidence_owner");
    const executiveOwner = textAttr(a, "executive_owner");
    const financeOwner = textAttr(a, "finance_owner");
    const vendorName = textAttr(a, "vendor_name");
    const toolName = textAttr(a, "tool_name");
    const sourceContractId = textAttr(a, "contract_id");
    const sourceOpportunityId = textAttr(a, "opportunity_id");

    if (!agg.ownerRole) agg.ownerRole = evidenceOwner ?? executiveOwner;
    if (!agg.financeOwnerRole) {
      agg.financeOwnerRole =
        financeOwner ??
        (textAttr(a, "owner_attestation_status")?.includes("finance")
          ? evidenceOwner
          : null);
    }
    if (!agg.vendorName) agg.vendorName = vendorName;
    if (!agg.systemName || agg.systemName === agg.programName) {
      agg.systemName = toolName ?? agg.systemName;
    }
    if (!agg.sourceContractId) agg.sourceContractId = sourceContractId;
    if (!agg.sourceOpportunityId) agg.sourceOpportunityId = sourceOpportunityId;

    // A program fact is authoritative for the display name/code/vendor of the
    // group — a tool that rolled up should not rename the funded program.
    if (id.canonical_program_key) {
      agg.isProgram = true;
      if (id.system_name) agg.programName = id.system_name;
      if (id.program_code) agg.programCode = id.program_code;
      if (id.vendor_name && !agg.vendorName) agg.vendorName = id.vendor_name;
      if (id.system_name && !agg.systemName) agg.systemName = id.system_name;
    }
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
  if (agg.sourceContractId) {
    const vendor = agg.vendorName ? `${agg.vendorName} ` : "";
    switch (lane) {
      case "fix":
        return `${vendor}${agg.sourceContractId} has a sourced optimization opportunity, but finance confirmation and evidence review must close before Tower treats it as realized value.`;
      case "freeze":
        return `${vendor}${agg.sourceContractId} should stay in review until the contract evidence chain and value basis are complete.`;
      case "stop":
        return `${vendor}${agg.sourceContractId} is showing spend without a complete contract-value chain and should be remediated in Source before action.`;
      default:
        return `${vendor}${agg.sourceContractId} has value evidence in Source, but Tower still treats the value as partial until finance confirmation is complete.`;
    }
  }
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

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasUsageEvidence(agg: ProgramAggregate): boolean {
  return agg.usageActual !== null || agg.adoptionRatePct !== null;
}

function adoptionFraction(agg: ProgramAggregate): number {
  return typeof agg.adoptionRatePct === "number" &&
    Number.isFinite(agg.adoptionRatePct)
    ? Math.max(0, Math.min(1, agg.adoptionRatePct / 100))
    : 0;
}

function usageSupportedValue(agg: ProgramAggregate): number {
  return round(Math.max(0, agg.promisedValue ?? 0) * adoptionFraction(agg));
}

function amountBlocked(
  agg: ProgramAggregate,
  claim: { allowed: TowerClaimAllowed },
): number {
  const promised = Math.max(0, agg.promisedValue ?? 0);
  const claimable =
    claim.allowed === "allowed"
      ? Math.max(0, agg.financeValidatedValue ?? 0)
      : 0;
  return round(Math.max(0, promised - claimable));
}

function proofMaturityScore(
  agg: ProgramAggregate,
  claim: { allowed: TowerClaimAllowed },
): number {
  const promised = Math.max(0, agg.promisedValue ?? 0);
  const financeFraction =
    promised > 0
      ? Math.max(0, Math.min(1, (agg.financeValidatedValue ?? 0) / promised))
      : 0;
  const gateFraction =
    claim.allowed === "allowed" ? 1 : claim.allowed === "partial" ? 0.55 : 0;
  return clampScore(
    100 *
      (0.4 * financeFraction +
        0.35 * adoptionFraction(agg) +
        0.25 * gateFraction),
  );
}

function usageStrengthScore(agg: ProgramAggregate): number {
  if (
    typeof agg.adoptionRatePct === "number" &&
    Number.isFinite(agg.adoptionRatePct)
  ) {
    return clampScore(agg.adoptionRatePct);
  }
  return agg.usageActual !== null ? 35 : 0;
}

function decisionReasonCode(
  agg: ProgramAggregate,
  lane: DecisionLane,
  claim: { allowed: TowerClaimAllowed },
): MartProgramDecisionLaneRow["decision_reason_code"] {
  if (claim.allowed === "allowed") return "SCALE";
  if (lane === "stop") return "STOP_REDESIGN";
  if ((agg.promisedValue ?? 0) <= 0 && (agg.approvedFunding ?? 0) > 0)
    return "WATCH";
  if (lane === "freeze") return "FREEZE";
  return "FIX_PROOF";
}

function nextGateForAggregate(
  agg: ProgramAggregate,
  claim: { allowed: TowerClaimAllowed },
): string | null {
  if ((agg.promisedValue ?? 0) <= 0) return "Value case required";
  if (!hasUsageEvidence(agg)) return "Usage evidence required";
  if ((agg.financeValidatedValue ?? 0) <= 0)
    return "Finance validation required";
  if (claim.allowed !== "allowed") return "Claim-gate clearance required";
  return null;
}

function riskPressureScore(
  lane: DecisionLane,
  blockedAmount: number,
  promisedValue: number | null,
  lineageState: MartProgramDecisionLaneRow["lineage_trust_state"],
): number {
  const laneBase: Record<DecisionLane, number> = {
    fund: 18,
    fix: 66,
    freeze: 78,
    stop: 88,
  };
  const blockedRatio =
    (promisedValue ?? 0) > 0
      ? Math.min(1, blockedAmount / (promisedValue ?? 1))
      : 0;
  const conflictPenalty = lineageState === "CONFLICT" ? 16 : 0;
  return clampScore(laneBase[lane] + blockedRatio * 14 + conflictPenalty);
}

function lineageStateFor(
  factKeys: readonly string[],
): MartProgramDecisionLaneRow["lineage_trust_state"] {
  if (factKeys.length === 0) return "ABSENT";
  return new Set(factKeys).size > 1 ? "AGREE" : "ONE_SOURCE";
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
    // Stable, UNIQUE identity for the row this evidence belongs to (the
    // aggregate's identityKey). The lineage_key is built from this, not from
    // the display name: many V3 rows legitimately share a business_name, so
    // keying on the label collides and a batch upsert then fails with
    // "ON CONFLICT DO UPDATE command cannot affect row a second time".
    identityKey: string,
    displayedFact: string,
    valueNumeric: number | null,
    factKeys: string[],
    ref: { file: string | null; row: string | null; system: string | null },
    caveat = "",
    lineageState: MartEvidenceLineageRow["lineage_state"] = lineageStateFor(
      factKeys,
    ),
  ): void => {
    const sourceRefs = [
      {
        file: ref.file,
        row: ref.row,
        system: ref.system,
      },
    ].filter((source) => source.file || source.row || source.system);
    evidence.push({
      lineage_key: `${tenantKey}::${section}::${identityKey}`.slice(0, 240),
      tenant_key: tenantKey,
      surface_section: section,
      displayed_fact: displayedFact,
      displayed_value_text: null,
      displayed_value_numeric: valueNumeric,
      metric_or_fact_key: factKeys[0] ?? identityKey,
      board_visible_label: displayedFact,
      lineage_state: lineageState,
      source_count: Math.max(0, sourceRefs.length || factKeys.length),
      source_refs: sourceRefs,
      conflicting_values: [],
      authoritative_value:
        valueNumeric === null || valueNumeric === undefined
          ? null
          : String(valueNumeric),
      resolution_owner_role: null,
      resolution_state: lineageState === "CONFLICT" ? "open" : "not_required",
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

    // Only bets with real economics become decision lanes — you cannot decide
    // to fund/fix/freeze/stop something that carries no funding, promised, or
    // validated value. A program identity alone is not enough (an AI use case
    // may reference a program code that has no funding row); those surface as
    // portfolio candidates instead, so lanes stay a short, decidable list.
    const hasProgramEconomics =
      (agg.approvedFunding ?? 0) > 0 ||
      (agg.promisedValue ?? 0) > 0 ||
      (agg.financeValidatedValue ?? 0) > 0;
    if (
      (agg.isProgram && hasProgramEconomics) ||
      (agg.approvedFunding ?? 0) > 0
    ) {
      const laneKey = `${tenantKey}::lane::${agg.identityKey}`.slice(0, 240);
      const lineState = lineageStateFor(agg.factKeys);
      const blocked = amountBlocked(agg, claim);
      const reasonCode = decisionReasonCode(agg, lane, claim);
      const nextGate = nextGateForAggregate(agg, claim);
      lanes.push({
        lane_key: laneKey,
        tenant_key: tenantKey,
        program_code: agg.programCode,
        program_name: agg.programName,
        owner_role: agg.ownerRole,
        finance_owner_role: agg.financeOwnerRole,
        decision_lane: lane,
        decision_rationale: decisionRationale(agg, lane),
        approved_funding_usd: round(agg.approvedFunding ?? 0),
        funded_amount: round(agg.approvedFunding ?? 0),
        ai_tagged_spend_usd: round(agg.aiTaggedSpend),
        promised_value_usd: round(agg.promisedValue ?? 0),
        finance_validated_value_usd: round(agg.financeValidatedValue ?? 0),
        known_supported_value: usageSupportedValue(agg),
        proof_maturity_score: proofMaturityScore(agg, claim),
        risk_pressure_score: riskPressureScore(
          lane,
          blocked,
          agg.promisedValue,
          lineState,
        ),
        usage_strength_score: usageStrengthScore(agg),
        lineage_trust_state: lineState,
        decision_reason_code: reasonCode,
        amount_blocked: blocked,
        next_gate: nextGate,
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
        agg.identityKey,
        `${agg.programName} decision lane`,
        agg.approvedFunding ?? 0,
        agg.factKeys,
        ref,
        caveat,
        lineState,
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
      agg.identityKey,
      `${agg.programName} AI-tagged spend`,
      round(agg.aiTaggedSpend),
      agg.factKeys,
      ref,
      agg.anyTenantFile
        ? ""
        : "Reference/synthetic estimate — no real extract loaded.",
    );
  }

  // The command-center AI-tagged spend LENS is the governed annual budget
  // figure (08.ai_tagged_budget_usd), read directly — never the sum of per-tool
  // telemetry, which is monthly actual and would double-count an annual lens.
  // Telemetry rolls up at the program level (agg.aiTaggedSpend) as usage
  // evidence; only if no governed lens fact exists do we fall back to it.
  const governedAiTaggedLens = sumBudget(facts, BUDGET_METRIC_KEYS.aiTagged);
  const telemetryAiSpend = aggregates.reduce(
    (sum, a) => sum + a.aiTaggedSpend,
    0,
  );
  const aiTaggedSpendTotal = round(
    governedAiTaggedLens > 0 ? governedAiTaggedLens : telemetryAiSpend,
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
  const claimableValue = lanes.reduce(
    (sum, lane) =>
      sum +
      (lane.tower_claim_allowed === "allowed"
        ? lane.finance_validated_value_usd
        : 0),
    0,
  );
  const blockedProgramCount = lanes.filter(
    (lane) => lane.amount_blocked > 0,
  ).length;
  const claimableProgramCount = lanes.filter(
    (lane) =>
      lane.tower_claim_allowed === "allowed" &&
      lane.finance_validated_value_usd > 0,
  ).length;
  const unknownValueClaimCount = lanes.filter(
    (lane) => lane.approved_funding_usd > 0 && lane.promised_value_usd <= 0,
  ).length;
  const unmeasuredProgramCount = lanes.filter(
    (lane) => lane.usage_strength_score <= 0,
  ).length;
  const conflictedProgramCount = lanes.filter(
    (lane) => lane.lineage_trust_state === "CONFLICT",
  ).length;
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
    claimable_value: round(claimableValue),
    finance_validated_blocked_value: round(
      Math.max(0, partialValidatedTotal - claimableValue),
    ),
    promised_value_exposure: round(promisedValueTotal),
    unknown_value_claim_count: unknownValueClaimCount,
    claimable_program_count: claimableProgramCount,
    blocked_program_count: blockedProgramCount,
    conflicted_program_count: conflictedProgramCount,
    unmeasured_program_count: unmeasuredProgramCount,
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
    lanes,
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
  lanes: readonly MartProgramDecisionLaneRow[];
}): MartValueFunnelRow[] {
  const claimCount = args.lanes.length;
  const knownValueClaimCount = args.lanes.filter(
    (lane) => lane.promised_value_usd > 0,
  ).length;
  const usageLanes = args.lanes.filter((lane) => lane.usage_strength_score > 0);
  const financeLanes = args.lanes.filter(
    (lane) => lane.finance_validated_value_usd > 0,
  );
  const claimableLanes = args.lanes.filter(
    (lane) =>
      lane.tower_claim_allowed === "allowed" &&
      lane.finance_validated_value_usd > 0,
  );
  const blockedKnownValueAmount = args.lanes.reduce(
    (sum, lane) => sum + lane.amount_blocked,
    0,
  );
  const primaryBlocked = [...args.lanes]
    .filter((lane) => lane.amount_blocked > 0)
    .sort((a, b) => b.amount_blocked - a.amount_blocked)[0];
  const stages: Array<{
    key: string;
    label: string;
    value: number;
    claims: number;
    knownClaims: number;
    unknownClaims: number;
    blockedClaims: number;
    blockedKnownValue: number;
    denom: string | null;
    claim: string;
    caveat: string;
    primaryBlocker: string | null;
    primaryOwnerRole: string | null;
  }> = [
    {
      key: "funded",
      label: "Funded",
      value: args.approvedProgramBudget,
      claims: claimCount,
      knownClaims: args.lanes.filter((lane) => lane.approved_funding_usd > 0)
        .length,
      unknownClaims: 0,
      blockedClaims: 0,
      blockedKnownValue: 0,
      denom: null,
      claim: "funded",
      caveat: "",
      primaryBlocker: null,
      primaryOwnerRole: null,
    },
    {
      key: "baseline_supported",
      label: "Baseline supported",
      value: 0,
      claims: 0,
      knownClaims: 0,
      unknownClaims: claimCount,
      blockedClaims: claimCount,
      blockedKnownValue: args.promisedValueTotal,
      denom: "funded",
      claim: "blocked",
      caveat:
        "Baseline-supported value is not yet loaded as a governed mart amount.",
      primaryBlocker: "Baseline evidence not loaded",
      primaryOwnerRole: "Finance",
    },
    {
      key: "usage_supported",
      label: "Usage supported",
      value: usageLanes.reduce(
        (sum, lane) => sum + lane.known_supported_value,
        0,
      ),
      claims: usageLanes.length,
      knownClaims: usageLanes.filter((lane) => lane.known_supported_value > 0)
        .length,
      unknownClaims: claimCount - usageLanes.length,
      blockedClaims: claimCount - usageLanes.length,
      blockedKnownValue: Math.max(
        0,
        args.promisedValueTotal -
          usageLanes.reduce((sum, lane) => sum + lane.known_supported_value, 0),
      ),
      denom: "baseline_supported",
      claim: "usage_supported",
      caveat: "Usage evidence supports activity, not outcome proof.",
      primaryBlocker: primaryBlocked?.next_gate ?? null,
      primaryOwnerRole: primaryBlocked?.owner_role ?? null,
    },
    {
      key: "outcome_measured",
      label: "Outcome measured",
      value: 0,
      claims: 0,
      knownClaims: 0,
      unknownClaims: knownValueClaimCount,
      blockedClaims: knownValueClaimCount,
      blockedKnownValue: args.promisedValueTotal,
      denom: "usage_supported",
      claim: "blocked",
      caveat:
        "Outcome-measured value requires governed KPI movement; no amount is inferred from usage.",
      primaryBlocker: "Outcome KPI movement not loaded",
      primaryOwnerRole: "Business owner",
    },
    {
      key: "finance_validated",
      label: "Finance validated",
      value: args.partialValidatedTotal,
      claims: financeLanes.length,
      knownClaims: financeLanes.length,
      unknownClaims: claimCount - financeLanes.length,
      blockedClaims: claimCount - financeLanes.length,
      blockedKnownValue: Math.max(
        0,
        args.promisedValueTotal - args.partialValidatedTotal,
      ),
      denom: "outcome_measured",
      claim: "partial",
      caveat: "Only partially validated by finance.",
      primaryBlocker: primaryBlocked?.next_gate ?? null,
      primaryOwnerRole: primaryBlocked?.finance_owner_role ?? null,
    },
    {
      key: "claimable",
      label: "Claimable",
      value: claimableLanes.reduce(
        (sum, lane) => sum + lane.finance_validated_value_usd,
        0,
      ),
      claims: claimableLanes.length,
      knownClaims: claimableLanes.length,
      unknownClaims: claimCount - claimableLanes.length,
      blockedClaims: args.lanes.filter((lane) => lane.amount_blocked > 0)
        .length,
      blockedKnownValue: blockedKnownValueAmount,
      denom: "finance_validated",
      claim: "blocked",
      caveat: "Claimable requires the governed Tower claim gate.",
      primaryBlocker: primaryBlocked?.next_gate ?? null,
      primaryOwnerRole: primaryBlocked?.finance_owner_role ?? null,
    },
    {
      key: "realized",
      label: "Realized",
      value: 0,
      claims: 0,
      knownClaims: 0,
      unknownClaims: claimCount,
      blockedClaims: claimCount,
      blockedKnownValue: blockedKnownValueAmount,
      denom: "claimable",
      claim: "blocked",
      caveat:
        "Realized value is blocked until post-period actuals and finance attestation are reconciled.",
      primaryBlocker: "Realized-value evidence not loaded",
      primaryOwnerRole: "Finance",
    },
  ];
  return stages.map((s, i) => ({
    funnel_key: `${args.tenantKey}::funnel::${s.key}`,
    tenant_key: args.tenantKey,
    sequence: i + 1,
    stage_key: s.key,
    stage_label: s.label,
    value_numeric: round(s.value),
    claim_count: s.claims,
    known_value_claim_count: s.knownClaims,
    unknown_value_claim_count: s.unknownClaims,
    known_value_amount: round(s.value),
    blocked_claim_count: s.blockedClaims,
    blocked_known_value_amount: round(s.blockedKnownValue),
    primary_blocker: s.primaryBlocker,
    primary_owner_role: s.primaryOwnerRole,
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
  const sortedLanes = [...lanes].sort(
    (a, b) => b.amount_blocked - a.amount_blocked,
  );
  for (const lane of sortedLanes) {
    seq += 1;
    const actionKey =
      `${tenantKey}::action::${lane.program_code ?? lane.lane_key}`.slice(
        0,
        240,
      );
    const owner = lane.finance_owner_role ?? lane.owner_role;
    const evidenceRequirement =
      lane.next_gate ??
      (lane.decision_reason_code === "SCALE"
        ? "Maintain claim-gate evidence package"
        : "Complete the next proof gate");
    const isSourceContractLane = lane.source_fact_keys.some((key) =>
      key.includes("source-contract"),
    );
    const handoffModule =
      lane.decision_reason_code === "FIX_PROOF"
        ? isSourceContractLane
          ? "Source"
          : "Moves"
        : lane.decision_reason_code === "STOP_REDESIGN" ||
            lane.decision_reason_code === "FREEZE"
          ? "Source"
          : null;
    actions.push({
      action_key: actionKey,
      action_id: actionKey,
      tenant_key: tenantKey,
      sequence: seq,
      action_lane: lane.decision_lane,
      title: `${lane.decision_reason_code.replace(/_/g, " ")}: ${lane.program_name}`,
      action_body: lane.decision_rationale,
      owner_hint: owner,
      module_handoff: handoffModule,
      program_id: lane.program_code ?? lane.lane_key,
      claim_id: `${lane.lane_key}::claim`,
      proof_stage: lane.next_gate,
      blocked_decision: lane.decision_rationale,
      amount_exposed: lane.amount_blocked,
      evidence_requirement: evidenceRequirement,
      expected_source_system:
        lane.next_gate === null ? null : "Governed Tower evidence package",
      evidence_package_id: null,
      owner_role: owner,
      secondary_owner_role: lane.owner_role === owner ? null : lane.owner_role,
      due_window: null,
      due_date: null,
      handoff_module: handoffModule,
      handoff_entity_id: null,
      handoff_readiness: lane.next_gate === null ? "ready" : "needs_evidence",
      action_state: "open",
      priority:
        lane.amount_blocked >= 5_000_000
          ? "high"
          : lane.amount_blocked > 0
            ? "medium"
            : "low",
      evidence_ids: [],
      source_fact_keys: lane.source_fact_keys.slice(0, 50),
      formula_version: formulaVersion,
    });
  }
  const blockingGaps = gaps.filter((g) => g.blocking);
  if (blockingGaps.length > 0) {
    seq += 1;
    const actionKey = `${tenantKey}::action::govern`;
    actions.push({
      action_key: actionKey,
      action_id: actionKey,
      tenant_key: tenantKey,
      sequence: seq,
      action_lane: "govern",
      title: `Close ${blockingGaps.length} blocking evidence gap${blockingGaps.length === 1 ? "" : "s"}`,
      action_body: blockingGaps.map((g) => g.remediation_action).join(" "),
      owner_hint: "CDAO",
      module_handoff: "Source",
      program_id: null,
      claim_id: null,
      proof_stage: "pipeline",
      blocked_decision: "Promote Tower output as board-grade",
      amount_exposed: 0,
      evidence_requirement: blockingGaps
        .map((g) => g.required_field)
        .join(", "),
      expected_source_system: "Unified Tower facts",
      evidence_package_id: null,
      owner_role: "CDAO",
      secondary_owner_role: null,
      due_window: null,
      due_date: null,
      handoff_module: "Source",
      handoff_entity_id: null,
      handoff_readiness: "needs_evidence",
      action_state: "open",
      priority: "high",
      evidence_ids: [],
      source_fact_keys: [],
      formula_version: formulaVersion,
    });
  }
  return actions;
}
