import { azureRead } from "@/lib/data-plane/azureRead";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  canonicalCioTowerTenantKey,
  formatCioTowerMoney,
} from "@/lib/tower/metric-packet";
import type {
  TowerMartAiPortfolioItem,
  TowerMartValueObservationMonth,
  TowerMartCommandViewModel,
  TowerMartCxoAction,
  TowerMartEvidenceLineage,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
  TowerMartValueTrajectoryPoint,
  TowerMartValueFunnelStage,
} from "@/lib/tower/current-layer-view-model";

type Numeric = string | number | null | undefined;
type JsonRecord = Record<string, unknown>;
type TowerDecisionLane = TowerMartProgramLane["decisionLane"];
type TowerSqlQuery = <R = Record<string, unknown>>(
  sql: string,
  params?: readonly unknown[],
  opts?: { missingTable?: "empty" | "throw" },
) => Promise<R[]>;
type TowerServingIdentity = {
  assessmentId: string;
  projectionVersion: number;
};

interface TowerServingRow {
  tenant_key: string;
  assessment_id: string;
  projection_version: number;
  source_hash: string;
  basis: string | null;
  value_state: string | null;
  review_state: string | null;
  origin: string | null;
  gap_flags_json: unknown;
  projection_row_id: string;
  page_key: string;
  row_key: string;
  row_type: string;
  title: string | null;
  summary: string | null;
  primary_object_id: string | null;
  source_refs_json: unknown;
  payload_json: unknown;
}

const TOWER_SERVING_VIEWS = [
  "tower_command_center",
  "tower_value_proof",
  "tower_decision_lanes",
  "tower_evidence",
  "tower_recommended_actions",
  "tower_ai_portfolio",
  "tower_cost_lens",
  "tower_risk_lens",
  "tower_adoption_lens",
] as const;

type TowerServingViewName = (typeof TOWER_SERVING_VIEWS)[number];

function isTowerServingViewName(value: string): value is TowerServingViewName {
  return (TOWER_SERVING_VIEWS as readonly string[]).includes(value);
}

function num(value: Numeric): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNum(value: Numeric): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function jsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function payload(row: TowerServingRow): JsonRecord {
  return asRecord(row.payload_json);
}

function displayPayload(row: TowerServingRow): JsonRecord {
  return asRecord(payload(row).display_payload_json);
}

function sourceRefs(row: TowerServingRow): Array<Record<string, unknown>> {
  return jsonArray(row.source_refs_json).filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
  );
}

function payloadText(
  row: TowerServingRow,
  key: string,
  fallback?: unknown,
): string | null {
  return (
    nullableText(payload(row)[key]) ??
    nullableText(displayPayload(row)[key]) ??
    nullableText(fallback)
  );
}

function payloadNumber(row: TowerServingRow, key: string): number {
  const body = payload(row);
  const display = displayPayload(row);
  return num((body[key] ?? display[key]) as Numeric);
}

function payloadNullableNumber(
  row: TowerServingRow,
  key: string,
): number | null {
  const body = payload(row);
  const display = displayPayload(row);
  return nullableNum((body[key] ?? display[key]) as Numeric);
}

/**
 * Reads only what Layer 4 asserted, ignoring the projection row's own columns.
 *
 * `payload_json` is `to_jsonb(p)` over the projection table, so it carries every column whether or
 * not the loader meant anything by it. `display_payload_json` carries only what the loader chose
 * to write. For "did this row record a value at all", the second is the only honest source: a
 * column can be present-and-zero for reasons that have nothing to do with the row.
 */
function displayNullableNumberFrom(
  row: TowerServingRow,
  keys: readonly string[],
): number | null {
  const display = displayPayload(row);
  for (const key of keys) {
    const value = nullableNum(display[key] as Numeric);
    if (value !== null) return value;
  }
  return null;
}

function payloadNullableNumberFrom(
  row: TowerServingRow,
  keys: readonly string[],
): number | null {
  const body = payload(row);
  const display = displayPayload(row);
  for (const key of keys) {
    const value =
      nullableNum(body[key] as Numeric) ?? nullableNum(display[key] as Numeric);
    if (value !== null) return value;
  }
  return null;
}

function payloadTextFrom(
  row: TowerServingRow,
  keys: readonly string[],
): string | null {
  const body = payload(row);
  const display = displayPayload(row);
  for (const key of keys) {
    const value = nullableText(body[key]) ?? nullableText(display[key]);
    if (value !== null) return value;
  }
  return null;
}

function firstSourceLabel(
  refs: readonly Record<string, unknown>[],
): string | null {
  const ref = refs[0];
  if (!ref) return null;
  return (
    nullableText(ref.source_family) ??
    nullableText(ref.file_path) ??
    nullableText(ref.source_file) ??
    nullableText(ref.source_record_id)
  );
}

function uniqueSourceFiles(rows: readonly TowerServingRow[]): string[] {
  const out = new Set<string>();
  for (const row of rows) {
    for (const ref of sourceRefs(row)) {
      const label = firstSourceLabel([ref]);
      if (label) out.add(label);
    }
  }
  return [...out].sort();
}

function uniqueRows(rows: readonly TowerServingRow[]): TowerServingRow[] {
  const out = new Map<string, TowerServingRow>();
  for (const row of rows) {
    out.set(row.projection_row_id ?? `${row.page_key}/${row.row_key}`, row);
  }
  return [...out.values()];
}

function towerServingBuildPriority(row: TowerServingRow): number {
  if (
    row.row_key === "executive_summary" &&
    payloadText(row, "layer4_build_version")
  ) {
    return 3;
  }
  if (row.row_key === "executive_summary") return 2;
  if (payloadText(row, "layer4_build_version")) return 1;
  return 0;
}

/**
 * Which assessment is current.
 *
 * `serving.tower_active_assessment_keys()` already answers this in SQL, and the `serving.tower_*`
 * views join it — so in a healthy database these rows arrive pre-filtered. This stays as a defence
 * for the case they do not (an unmigrated database, a view without the join), which is what
 * `readTowerCommandCenter.test.ts` exercises.
 *
 * It must therefore rank **identically** to the SQL, which orders by build priority, then
 * projection version, then `created_at desc` — newest load wins — with `assessment_id` only as a
 * last-resort tiebreak. This previously omitted the recency term entirely and fell through to
 * `assessment_id.localeCompare`, so a superseded assessment could beat a newer one on alphabetical
 * order alone. `created_at` is not a column on the view, but `payload_json` is `to_jsonb(p)` of the
 * projection row, so it is carried there.
 */
function servingRowCreatedAt(row: TowerServingRow): number {
  const raw = payload(row).created_at;
  if (typeof raw !== "string" && typeof raw !== "number") return 0;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function activeServingIdentity(
  commandRows: readonly TowerServingRow[],
): TowerServingIdentity | null {
  const candidates = commandRows
    .map((row) => ({
      assessmentId: row.assessment_id,
      projectionVersion: Number(row.projection_version ?? 0),
      priority: towerServingBuildPriority(row),
      createdAt: servingRowCreatedAt(row),
    }))
    .filter(
      (candidate) =>
        candidate.assessmentId.trim().length > 0 &&
        Number.isFinite(candidate.projectionVersion),
    )
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        b.projectionVersion - a.projectionVersion ||
        b.createdAt - a.createdAt ||
        b.assessmentId.localeCompare(a.assessmentId),
    );

  const winner = candidates[0];
  if (!winner) return null;
  return {
    assessmentId: winner.assessmentId,
    projectionVersion: winner.projectionVersion,
  };
}

function rowsForActiveServingIdentity(
  rows: readonly TowerServingRow[],
  identity: TowerServingIdentity,
): TowerServingRow[] {
  return rows.filter(
    (row) =>
      row.assessment_id === identity.assessmentId &&
      Number(row.projection_version ?? 0) === identity.projectionVersion,
  );
}

function requireSourceTruth(
  viewName: string,
  rows: readonly TowerServingRow[],
): void {
  const missing = rows
    .filter((row) => sourceRefs(row).length === 0)
    .map((row) => `${row.page_key}/${row.row_key}`)
    .slice(0, 8);
  if (missing.length > 0) {
    throw new Error(
      `tower_ecl_serving_source_refs_missing: ${viewName} ${missing.join(", ")}`,
    );
  }
}

function tenantCandidates(values: readonly (string | null | undefined)[]) {
  const out = new Set<string>();
  for (const value of values) {
    if (!value?.trim()) continue;
    const canonical = canonicalCioTowerTenantKey(value);
    out.add(canonical);
    out.add(value.trim());
    if (
      canonical === "meridian-health" ||
      value === "meridian" ||
      value === "meridian_health_global"
    ) {
      out.add("meridian-health");
    }
    if (canonical === "skyharbor_global" || value === "skyharbor-air") {
      out.add("skyharbor_global");
    }
  }
  return [...out];
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

async function readServingView(
  query: TowerSqlQuery,
  viewName: TowerServingViewName,
  tenantKey: string,
): Promise<TowerServingRow[]> {
  if (!isTowerServingViewName(viewName)) {
    throw new Error(`tower_unknown_serving_view: ${viewName}`);
  }
  const rows = await query<TowerServingRow>(
    `select *
       from serving.${viewName}
      where tenant_key = $1
      order by page_key, row_key`,
    [tenantKey],
    { missingTable: "empty" },
  );
  return rows;
}

function sumRows(rows: readonly TowerServingRow[], key: string): number {
  return rows.reduce((sum, row) => sum + payloadNumber(row, key), 0);
}

function countByGate(rows: readonly TowerServingRow[], status: string): number {
  return rows.filter((row) => payloadText(row, "claim_gate_status") === status)
    .length;
}

function buildFunnel(
  rows: readonly TowerServingRow[],
): TowerMartValueFunnelStage[] {
  const promised =
    sumRows(rows, "promised_value_usd") + sumRows(rows, "baseline_value");
  const usageSupported = sumRows(rows, "usage_supported_value_usd");
  const financeValidated = sumRows(rows, "finance_validated_value_usd");
  const claimable = sumRows(rows, "claimable_value_usd");
  const blocked = sumRows(rows, "blocked_value_usd");
  const claimCount = rows.filter((row) => payloadText(row, "claim_id")).length;
  const gatedCount = countByGate(rows, "gated") + countByGate(rows, "blocked");
  const sources = uniqueSourceFiles(rows).join("; ");

  const stage = (
    sequence: number,
    stageKey: string,
    stageLabel: string,
    valueNumeric: number,
    caveat: string,
  ): TowerMartValueFunnelStage => ({
    funnelKey: `tower:ecl:funnel:${stageKey}`,
    sequence,
    stageKey,
    stageLabel,
    valueNumeric,
    claimCount,
    knownValueClaimCount: claimCount - gatedCount,
    unknownValueClaimCount: gatedCount,
    knownValueAmount: valueNumeric,
    blockedClaimCount: gatedCount,
    blockedKnownValueAmount: blocked,
    primaryBlocker: gatedCount > 0 ? "Evidence gates remain open" : null,
    primaryOwnerRole: gatedCount > 0 ? "Tower evidence owner" : null,
    denominatorStageKey: sequence === 1 ? null : "promised",
    conversionRatio: promised > 0 ? valueNumeric / promised : null,
    claimStatus: gatedCount > 0 ? "gated" : "claimable",
    caveat,
    sourceFile: sources,
    sourceRow: null,
  });

  return [
    stage(
      1,
      "promised",
      "Source-backed value",
      promised,
      "Aggregated from ECL serving rows with source-record references.",
    ),
    stage(
      2,
      "usage_supported",
      "Usage supported",
      usageSupported,
      "Usage support is shown only where the ECL row carries a recorded value.",
    ),
    stage(
      3,
      "finance_validated",
      "Finance validated",
      financeValidated,
      "Finance validation remains separate from adoption and planning values.",
    ),
    stage(
      4,
      "claimable",
      "Claimable",
      claimable,
      "Claimable value requires the Tower evidence gate to clear.",
    ),
  ];
}

function mapProgramLane(row: TowerServingRow): TowerMartProgramLane {
  const display = displayPayload(row);
  const refs = sourceRefs(row);
  const title =
    nullableText(display.title) ??
    nullableText(display.program_name) ??
    row.title ??
    row.row_key;
  const gateStatus = payloadText(row, "claim_gate_status") ?? "gated";
  const nextGate = payloadText(row, "next_gate");
  return {
    laneKey: row.row_key,
    programCode:
      payloadText(row, "claim_id") ?? nullableText(display.program_id),
    programName: title,
    ownerRole:
      payloadText(row, "owner_role") ?? nullableText(display.owner_role),
    // The business domain the program sits in. Distinct from who sponsors it: a domain groups
    // work by where it happens, an owner groups it by who answers for it.
    domainName: nullableText(display.domain_name),
    financeOwnerRole: nullableText(display.finance_owner_role),
    decisionLane: decisionLane(
      gateStatus === "blocked"
        ? "fix"
        : (display.decision_lane as string | null),
    ),
    decisionRationale:
      payloadText(row, "claim_gate_reason_detail", row.summary) ??
      "ECL serving row requires evidence review before the claim can advance.",
    approvedFundingUsd: payloadNumber(row, "funded_amount_usd"),
    fundedAmount: payloadNumber(row, "funded_amount_usd"),
    aiTaggedSpendUsd:
      row.page_key === "ai_portfolio"
        ? payloadNumber(row, "funded_amount_usd")
        : 0,
    aiSpendLoaded:
      row.page_key === "ai_portfolio" &&
      payloadNullableNumber(row, "funded_amount_usd") !== null,
    promisedValueUsd: payloadNullableNumber(row, "promised_value_usd"),
    financeValidatedValueUsd: payloadNumber(row, "finance_validated_value_usd"),
    knownSupportedValue: payloadNullableNumber(
      row,
      "usage_supported_value_usd",
    ),
    proofMaturityScore: payloadNullableNumber(row, "proof_maturity_score"),
    riskPressureScore: payloadNullableNumber(row, "risk_pressure_score"),
    usageStrengthScore: payloadNullableNumber(row, "usage_strength_score"),
    lineageTrustState: row.basis,
    decisionReasonCode: payloadText(row, "claim_gate_reason_code"),
    amountBlocked: payloadNullableNumber(row, "blocked_value_usd"),
    nextGate,
    usageMetric: nullableText(display.usage_metric),
    usageActual: nullableNum(display.usage_actual as Numeric),
    adoptionRatePct: payloadNullableNumber(row, "usage_strength_score"),
    valueClaimStatus: gateStatus,
    towerClaimAllowed: gateStatus === "claimable" ? "allowed" : "blocked",
    requiredGates: jsonArray(payload(row).evidence_needed_json).map((ask) => ({
      ask,
      status: gateStatus,
    })) as Array<Record<string, unknown>>,
    caveat:
      payloadText(row, "claim_gate_reason_detail", row.summary) ??
      "ECL serving row has no additional caveat.",
    sourceFile: firstSourceLabel(refs),
    sourceRow: nullableText(refs[0]?.source_record_id),
  };
}

/**
 * `control_blocker` carries `none` as a real value: the rollout was reviewed and nothing was
 * found. That is not the same as the field being absent, and it is the opposite of a blocker —
 * but every truthy check reads the string `none` as one, which put two cleared rollouts in alarm
 * red and overstated the blocked count in the vendor headline.
 *
 * So the name drops to null when nothing is named, which makes the common `blocker ? ... : ...`
 * check correct by default, and `controlBlockerReviewed` carries whether the source said anything
 * at all — the difference between "clear" and "never looked".
 */
function controlBlockerFields(row: TowerServingRow): {
  controlBlocker: string | null;
  controlBlockerReviewed: boolean;
} {
  const raw = payloadTextFrom(row, ["control_blocker"]);
  if (raw === null) return { controlBlocker: null, controlBlockerReviewed: false };
  const named = raw.trim().toLowerCase() === "none" ? null : raw;
  return { controlBlocker: named, controlBlockerReviewed: true };
}

/**
 * The monthly value observations behind the waterfall, so a drawer can show when each step
 * happened rather than only its total. Rows without a month are dropped: an observation that
 * cannot be placed in time cannot be read as a sequence.
 */
function valueObservationMonths(
  row: TowerServingRow,
): TowerMartValueObservationMonth[] {
  const raw = displayPayload(row).value_observation_months;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const o = asRecord(entry);
      const month = nullableText(o.month);
      if (month === null) return null;
      return {
        month,
        sponsorClaimedUsd: nullableNum(o.sponsor_claimed_usd as Numeric) ?? 0,
        financeReviewedUsd: nullableNum(o.finance_reviewed_usd as Numeric) ?? 0,
        financeValidatedUsd: nullableNum(o.finance_validated_usd as Numeric) ?? 0,
        boardClaimableUsd: nullableNum(o.board_claimable_usd as Numeric) ?? 0,
        validationState: nullableText(o.validation_state),
      };
    })
    .filter((entry): entry is TowerMartValueObservationMonth => entry !== null);
}

function mapAiItem(row: TowerServingRow): TowerMartAiPortfolioItem {
  const refs = sourceRefs(row);
  const licensedUsersRaw = payloadNullableNumberFrom(row, [
    "licensed_users",
    "rollout_target_users",
  ]);
  const activeUsersRaw = payloadNullableNumberFrom(row, [
    "active_users",
    "monthly_active_users",
  ]);
  const approvedFundingRaw = payloadNullableNumberFrom(row, [
    "approved_funding_usd",
    "approved_investment_usd",
    "funded_amount_usd",
  ]);
  const monthlyCostRaw = payloadNullableNumberFrom(row, ["monthly_cost_usd"]);
  // The value stays coerced — portfolio totals sum it — but whether anything was *recorded* comes
  // from the display payload, not from the row's columns. A business case's payload carries
  // `approved_funding_usd`; a tool rollout's carries no cost key at all. Reading the row instead
  // picked up the projection table's own `monthly_cost_usd` column, which every row has, so every
  // rollout looked funded and rendered "$0" — a claim about price, where the truth is that
  // nothing was loaded.
  const aiSpendLoaded =
    displayNullableNumberFrom(row, [
      "approved_funding_usd",
      "approved_investment_usd",
      "funded_amount_usd",
      "monthly_cost_usd",
    ]) !== null;
  const approvedFundingUsd = approvedFundingRaw ?? (monthlyCostRaw ?? 0) * 12;
  const promisedValueUsd = payloadNullableNumberFrom(row, [
    "promised_value_usd",
    "projected_annual_value_low_usd",
  ]);
  const adoptionRatePct =
    payloadNullableNumberFrom(row, [
      "adoption_rate_percent",
      "adoption_actual_pct",
    ]) ??
    (licensedUsersRaw !== null &&
    activeUsersRaw !== null &&
    licensedUsersRaw > 0
      ? (activeUsersRaw / licensedUsersRaw) * 100
      : null);
  const usageMetric =
    payloadTextFrom(row, ["usage_metric", "success_metric"]) ??
    (activeUsersRaw !== null ? "active users" : null);
  return {
    aiPortfolioKey: row.row_key,
    itemName: payloadText(row, "use_case_name", row.title) ?? row.row_key,
    itemKind:
      payloadTextFrom(row, ["item_kind", "itemKind"]) ?? "usage_benefit",
    vendorName: payloadText(row, "tool_name", row.summary),
    systemName: payloadText(row, "tool_name", row.summary),
    aiSpendType: payloadTextFrom(row, ["ai_spend_type"]) ?? "usage",
    aiSpendCategory:
      payloadTextFrom(row, ["ai_spend_category", "business_value_type"]) ??
      "tool",
    fundingStatus:
      payloadTextFrom(row, ["funding_status", "finance_status"]) ??
      row.review_state,
    decisionLane: decisionLane(payloadTextFrom(row, ["decision_lane"])),
    approvedFundingUsd,
    aiTaggedSpendUsd: approvedFundingUsd,
    aiSpendLoaded,
    // Initiative-detail fields. Each reads its own key; none falls back to another.
    projectName: payloadTextFrom(row, ["project_name"]),
    lifecycleStage: payloadTextFrom(row, ["lifecycle_stage"]),
    financePartnerRole: payloadTextFrom(row, ["finance_partner_role"]),
    successMetric: payloadTextFrom(row, ["success_metric"]),
    paybackMonthsTarget: payloadNullableNumberFrom(row, ["payback_months_target"]),
    valueObservationMonths: valueObservationMonths(row),
    promisedValueUsd,
    financeValidatedValueUsd: payloadNumber(row, "finance_validated_value_usd"),
    usageMetric,
    usageActual: activeUsersRaw,
    adoptionRatePct,
    adoptionTargetPct: payloadNullableNumberFrom(row, ["adoption_target_pct"]),
    linkedBusinessCaseCount: payloadNullableNumberFrom(row, [
      "linked_business_case_count",
    ]),
    valueScore:
      promisedValueUsd !== null && promisedValueUsd > 0
        ? 70
        : payloadNumber(row, "usage_events") > 0
          ? 55
          : 20,
    // Readiness is a declared 0-100 score. It previously fell back to the adoption rate and then
    // to a literal 25 — substituting a different metric, and then an invented one, for a missing
    // value. Both are the "missing rendered as a number" failure this product exists to prevent.
    readinessScore: payloadNullableNumberFrom(row, ["readiness_score"]),
    // risk_pressure_score is written upstream as (100 - readiness_score), so it carries no
    // information readiness does not already carry. Kept for compatibility, never defaulted.
    riskScore: payloadNullableNumberFrom(row, [
      "risk_score",
      "risk_pressure_score",
    ]),
    // The Finance pipeline stage, read from its own key only.
    //
    // This must not come through `fundingStatus`, which resolves
    // `funding_status ?? finance_status ?? review_state` — three different things behind one name.
    // On a case `funding_status` is the committee decision (fund / challenge / defer); on a tool
    // rollout it is the rollout stage (pilot / scale). So that chain never yields a finance status
    // for a case, and yields a non-null value for every row, which also makes it useless for
    // telling cases and tools apart. `finance_status` is written on case payloads only.
    financeStatus: payloadTextFrom(row, ["finance_status"]),
    gatingConstraint: payloadTextFrom(row, ["gating_constraint"]),
    confidenceLevel: payloadTextFrom(row, ["confidence_level"]),
    businessValueType: payloadTextFrom(row, ["business_value_type"]),
    costToBuildLowUsd: payloadNullableNumberFrom(row, ["cost_to_build_low_usd"]),
    costToBuildHighUsd: payloadNullableNumberFrom(row, ["cost_to_build_high_usd"]),
    ...controlBlockerFields(row),
    sponsorRole: payloadTextFrom(row, [
      "business_sponsor_role",
      "business_owner_role",
    ]),
    duplicateRisk: null,
    valueClaimStatus: "usage_supported",
    towerClaimAllowed: "blocked",
    caveat:
      "AI usage is source-recorded; value remains blocked until outcome and finance evidence are linked.",
    sourceFile: firstSourceLabel(refs),
    sourceRow: nullableText(refs[0]?.source_record_id),
  };
}

function mapAction(row: TowerServingRow, index: number): TowerMartCxoAction {
  const refs = sourceRefs(row);
  return {
    actionKey: row.row_key,
    sequence: index + 1,
    actionLane: "fix",
    title: payloadText(row, "title", row.title) ?? row.row_key,
    actionBody:
      payloadText(row, "claim_gate_reason_detail", row.summary) ??
      "Review the ECL evidence gate before advancing this Tower claim.",
    ownerHint: payloadText(row, "owner_role"),
    moduleHandoff: payloadText(row, "handoff_module"),
    claimId: payloadText(row, "claim_id"),
    proofStage: payloadText(row, "claim_gate_status"),
    blockedDecision: payloadText(row, "claim_gate_reason_code"),
    amountExposed: payloadNumber(row, "blocked_value_usd"),
    evidenceRequirement: jsonArray(payload(row).evidence_needed_json).join(
      ", ",
    ),
    expectedSourceSystem: firstSourceLabel(refs),
    evidencePackageId: nullableText(refs[0]?.source_record_id),
    ownerRole: payloadText(row, "owner_role"),
    dueWindow: payloadText(row, "next_gate"),
    handoffModule: payloadText(row, "handoff_module"),
    handoffEntityId: payloadText(row, "primary_object_id"),
    handoffReadiness:
      payloadText(row, "claim_gate_status") === "claimable"
        ? "ready"
        : "not_ready",
    actionState: "open",
    priority:
      payloadText(row, "claim_gate_status") === "blocked" ? "high" : "medium",
  };
}

function mapEvidence(row: TowerServingRow): TowerMartEvidenceLineage {
  const refs = sourceRefs(row);
  const metric =
    payloadText(row, "metric_key") ??
    nullableText(jsonArray(payload(row).metric_keys_json)[0]);
  return {
    lineageKey: row.row_key,
    surfaceSection: row.page_key,
    displayedFact: payloadText(row, "title", row.title) ?? row.row_type,
    displayedValueText:
      payloadNullableNumber(row, "blocked_value_usd") !== null
        ? formatCioTowerMoney(payloadNullableNumber(row, "blocked_value_usd"))
        : null,
    displayedValueNumeric: payloadNullableNumber(row, "blocked_value_usd"),
    metricOrFactKey: metric,
    boardVisibleLabel:
      payloadText(row, "claim_gate_reason_code") ?? row.row_type,
    lineageState: row.basis,
    sourceCount: refs.length,
    sourceRefs: refs,
    conflictingValues: [],
    authoritativeValue: null,
    resolutionOwnerRole: payloadText(row, "owner_role"),
    resolutionState: payloadText(row, "claim_gate_status"),
    sourceFile: firstSourceLabel(refs),
    sourceRow: nullableText(refs[0]?.source_record_id),
    sourceSystem: firstSourceLabel(refs),
    caveat:
      payloadText(row, "claim_gate_reason_detail", row.summary) ??
      "Source refs are present; no additional caveat recorded.",
  };
}

function fiscalQuarterFromPeriodEnd(periodEnd: string): string | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(periodEnd);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return `${year}-Q${Math.floor((month - 1) / 3) + 1}`;
}

function mapValueTrajectoryRow(
  row: TowerServingRow,
): TowerMartValueTrajectoryPoint | null {
  const refs = sourceRefs(row);
  if (refs.length === 0) return null;

  const periodStart = payloadTextFrom(row, [
    "period_start",
    "measure_period_start",
    "value_period_start",
  ]);
  const periodEnd = payloadTextFrom(row, [
    "period_end",
    "measure_period_end",
    "value_period_end",
  ]);
  if (!periodStart || !periodEnd) return null;

  const fiscalQuarter =
    payloadTextFrom(row, ["fiscal_quarter", "fiscalQuarter"]) ??
    fiscalQuarterFromPeriodEnd(periodEnd);
  if (!fiscalQuarter) return null;

  return {
    tenantKey: row.tenant_key,
    valueCaseId: payloadText(row, "claim_id") ?? row.row_key,
    programId: payloadTextFrom(row, ["program_id", "programId"]),
    initiativeId: payloadTextFrom(row, ["initiative_id", "initiativeId"]),
    valueCaseName: payloadText(row, "title", row.title) ?? row.row_key,
    valueArchetype: row.row_type,
    periodStart,
    periodEnd,
    fiscalQuarter,
    scenario:
      payloadTextFrom(row, ["scenario", "measure_scenario"]) ?? "current",
    plannedInvestmentUsd: payloadNullableNumberFrom(row, [
      "planned_investment_usd",
      "funded_amount_usd",
    ]),
    actualSpendUsd: payloadNullableNumberFrom(row, [
      "actual_spend_usd",
      "current_value",
    ]),
    remainingCommitmentUsd: payloadNullableNumberFrom(row, [
      "remaining_commitment_usd",
    ]),
    businessCaseValueUsd: payloadNullableNumberFrom(row, [
      "business_case_value_usd",
      "promised_value_usd",
      "baseline_value",
    ]),
    businessCaseBenefitUsd: payloadNullableNumberFrom(row, [
      "business_case_benefit_usd",
      "target_value",
    ]),
    riskAdjustedForecastUsd: payloadNullableNumberFrom(row, [
      "risk_adjusted_forecast_usd",
      "target_value",
    ]),
    financeValidatedRunRateUsd: payloadNullableNumberFrom(row, [
      "finance_validated_run_rate_usd",
      "finance_validated_value_usd",
    ]),
    realizedPAndLUsd: payloadNullableNumberFrom(row, ["realized_p_and_l_usd"]),
    realizedCashUsd: payloadNullableNumberFrom(row, ["realized_cash_usd"]),
    forecastAtCompletionUsd: payloadNullableNumberFrom(row, [
      "forecast_at_completion_usd",
    ]),
    financialConversionUsd: payloadNullableNumberFrom(row, [
      "financial_conversion_usd",
    ]),
    usageEvidenceState: payloadText(row, "evidence_state") ?? row.basis,
    operationalOutcomeEvidenceState: payloadText(row, "quality_state"),
    financeAttestationState:
      payloadText(row, "review_state") ?? row.review_state,
    sourceTrustState: row.basis,
    claimState: payloadText(row, "claim_gate_status"),
    datasetVersion: `ecl-serving-v${row.projection_version}`,
    sourceRunId: row.source_hash,
    sourceRefs: refs,
    economicClassification: payloadTextFrom(row, ["economic_classification"]),
    boardScopeState: payloadTextFrom(row, ["board_scope_state"]),
    materialScopeState: payloadTextFrom(row, ["material_scope_state"]),
    sourceCount: refs.length,
  };
}

function mapValueTrajectory(
  rows: readonly TowerServingRow[],
): TowerMartValueTrajectoryPoint[] {
  return rows
    .map(mapValueTrajectoryRow)
    .filter((row): row is TowerMartValueTrajectoryPoint => row !== null);
}

function isTrajectoryOnlyRow(row: TowerServingRow): boolean {
  const body = payload(row);
  const display = displayPayload(row);
  return (
    body.trajectory_only === true ||
    body.trajectoryOnly === true ||
    display.trajectory_only === true ||
    display.trajectoryOnly === true ||
    payloadTextFrom(row, ["trajectory_only", "trajectoryOnly"]) === "true"
  );
}

function gapsFromRows(
  rows: readonly TowerServingRow[],
): TowerMartRequiredFieldGap[] {
  return rows
    .filter((row) => {
      const gate = payloadText(row, "claim_gate_status");
      return gate === "gated" || gate === "blocked";
    })
    .map((row) => {
      const refs = sourceRefs(row);
      return {
        gapKey: `tower-ecl-gap:${row.page_key}:${row.row_key}`,
        martTable: `serving.tower_${row.page_key}`,
        martRecordKey: row.row_key,
        requiredField: payloadText(row, "next_gate") ?? "evidence_gate",
        sourceTemplate: firstSourceLabel(refs) ?? "ECL source room",
        sourceRecordId: nullableText(refs[0]?.source_record_id),
        severity:
          payloadText(row, "claim_gate_status") === "blocked"
            ? "high"
            : "medium",
        ownerHint: payloadText(row, "owner_role"),
        remediationAction:
          payloadText(row, "claim_gate_reason_detail", row.summary) ??
          "Resolve the evidence gate named on this ECL serving row.",
        blocking: payloadText(row, "claim_gate_status") === "blocked",
      };
    });
}

function buildHeadline(
  tenantName: string,
  claimable: number,
  blocked: number,
  gatedRows: number,
  valueClaims: number,
): string {
  if (claimable > 0) {
    return `${tenantName} has ${formatCioTowerMoney(claimable)} claimable value and ${formatCioTowerMoney(blocked)} still blocked by evidence gates.`;
  }
  const claimWord = valueClaims === 1 ? "claim" : "claims";
  const claimVerb = valueClaims === 1 ? "remains" : "remain";
  return `${tenantName} has $0 board-claimable value. ${valueClaims} value ${claimWord} ${claimVerb} behind evidence gates; ${gatedRows} separate review rows describe the supporting backlog.`;
}

export async function readTowerCommandCenter(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
  tenantDisplayName?: string | null;
}): Promise<TowerMartCommandViewModel | null> {
  for (const tenantKey of tenantCandidates(args.tenantKeyCandidates)) {
    const result = await withTowerTenantRead(tenantKey, async (query) => {
      const [
        commandRows,
        valueRows,
        decisionRows,
        evidenceRows,
        actionRows,
        aiRows,
        costRows,
        riskRows,
        adoptionRows,
      ] = await Promise.all([
        readServingView(query, "tower_command_center", tenantKey),
        readServingView(query, "tower_value_proof", tenantKey),
        readServingView(query, "tower_decision_lanes", tenantKey),
        readServingView(query, "tower_evidence", tenantKey),
        readServingView(query, "tower_recommended_actions", tenantKey),
        readServingView(query, "tower_ai_portfolio", tenantKey),
        readServingView(query, "tower_cost_lens", tenantKey),
        readServingView(query, "tower_risk_lens", tenantKey),
        readServingView(query, "tower_adoption_lens", tenantKey),
      ]);

      const activeIdentity = activeServingIdentity(commandRows);
      if (!activeIdentity) return null;

      const activeCommandRows = rowsForActiveServingIdentity(
        commandRows,
        activeIdentity,
      );
      const activeValueRows = rowsForActiveServingIdentity(
        valueRows,
        activeIdentity,
      );
      const activeDecisionRows = rowsForActiveServingIdentity(
        decisionRows,
        activeIdentity,
      );
      const activeEvidenceRows = rowsForActiveServingIdentity(
        evidenceRows,
        activeIdentity,
      );
      const activeActionRows = rowsForActiveServingIdentity(
        actionRows,
        activeIdentity,
      );
      const activeAiRows = rowsForActiveServingIdentity(aiRows, activeIdentity);
      const activeCostRows = rowsForActiveServingIdentity(
        costRows,
        activeIdentity,
      );
      const activeRiskRows = rowsForActiveServingIdentity(
        riskRows,
        activeIdentity,
      );
      const activeAdoptionRows = rowsForActiveServingIdentity(
        adoptionRows,
        activeIdentity,
      );

      const activeRowsByView = [
        ["tower_command_center", activeCommandRows],
        ["tower_value_proof", activeValueRows],
        ["tower_decision_lanes", activeDecisionRows],
        ["tower_evidence", activeEvidenceRows],
        ["tower_recommended_actions", activeActionRows],
        ["tower_ai_portfolio", activeAiRows],
        ["tower_cost_lens", activeCostRows],
        ["tower_risk_lens", activeRiskRows],
        ["tower_adoption_lens", activeAdoptionRows],
      ] as const;
      for (const [activeViewName, activeRows] of activeRowsByView) {
        requireSourceTruth(`serving.${activeViewName}`, activeRows);
      }

      const allRows = uniqueRows([
        ...activeCommandRows,
        ...activeValueRows,
        ...activeDecisionRows,
        ...activeEvidenceRows,
        ...activeActionRows,
        ...activeAiRows,
        ...activeCostRows,
        ...activeRiskRows,
        ...activeAdoptionRows,
      ]);
      if (allRows.length === 0) return null;

      const projectionVersion = Math.max(
        ...allRows.map((row) => Number(row.projection_version ?? 0)),
      );
      const valueRowsForTotals = activeValueRows.filter(
        (row) => !isTrajectoryOnlyRow(row),
      );
      const summaryRow =
        activeCommandRows.find((row) => row.row_key === "executive_summary") ??
        activeCommandRows.find((row) => row.page_key === "command_center");
      const funded =
        sumRows(activeDecisionRows, "funded_amount_usd") +
        sumRows(activeAiRows, "monthly_cost_usd") * 12;
      const promised =
        sumRows(valueRowsForTotals, "promised_value_usd") +
        sumRows(valueRowsForTotals, "baseline_value");
      const financeValidated = sumRows(
        valueRowsForTotals,
        "finance_validated_value_usd",
      );
      const claimable = sumRows(valueRowsForTotals, "claimable_value_usd");
      const blocked = sumRows(valueRowsForTotals, "blocked_value_usd");
      const executiveApproved =
        summaryRow === undefined
          ? null
          : payloadNullableNumberFrom(summaryRow, [
              "reviewed_project_budget_usd",
              "approved_investment_usd",
            ]);
      const executiveTotalIt =
        summaryRow === undefined
          ? null
          : payloadNullableNumber(summaryRow, "total_it_budget_usd");
      const executiveReviewedProjectCount =
        summaryRow === undefined
          ? null
          : payloadNullableNumber(summaryRow, "reviewed_project_count");
      const executiveAiInvestment =
        summaryRow === undefined
          ? null
          : payloadNullableNumber(summaryRow, "ai_related_investment_usd");
      const executivePromised =
        summaryRow === undefined
          ? null
          : payloadNullableNumberFrom(summaryRow, [
              "projected_annual_value_low_usd",
              "promised_value_usd",
            ]);
      const executiveClaimable =
        summaryRow === undefined
          ? null
          : payloadNullableNumberFrom(summaryRow, [
              "board_claimable_ytd_usd",
              "claimable_value_usd",
            ]);
      const asOfPeriod =
        summaryRow === undefined
          ? null
          : payloadTextFrom(summaryRow, ["as_of_period", "asOfPeriod"]);
      const refreshTimestamp =
        summaryRow === undefined
          ? null
          : payloadTextFrom(summaryRow, [
              "refresh_timestamp",
              "refreshTimestamp",
              "build_timestamp",
              "built_at",
            ]);
      const gatedRows = allRows.filter((row) =>
        ["gated", "blocked"].includes(
          payloadText(row, "claim_gate_status") ?? "",
        ),
      ).length;
      const aiPortfolio = uniqueRows([
        ...activeAiRows,
        ...activeAdoptionRows,
      ]).map(
        mapAiItem,
      );
      const sourceFiles = uniqueSourceFiles(allRows);
      const tenantDisplayName =
        canonicalClientDisplayName({
          key: tenantKey,
          name: args.tenantDisplayName,
        }) ??
        args.tenantDisplayName ??
        tenantKey;
      const claimRows = valueRowsForTotals.filter((row) =>
        payloadText(row, "claim_id"),
      );
      const knownValueClaimRows = claimRows.filter(
        (row) =>
          payloadNullableNumber(row, "promised_value_usd") !== null ||
          payloadNullableNumber(row, "baseline_value") !== null,
      );
      const unknownValueClaimRows = claimRows.filter(
        (row) =>
          payloadNullableNumber(row, "promised_value_usd") === null &&
          payloadNullableNumber(row, "baseline_value") === null,
      );

      return {
        generatedFrom: "ecl_serving" as const,
        headline: buildHeadline(
          tenantDisplayName,
          claimable,
          blocked,
          gatedRows,
          claimRows.length,
        ),
        command: {
          commandCenterKey: `tower:ecl:${tenantKey}:command-center`,
          tenantKey,
          tenantName: tenantDisplayName,
          martVersion: `ecl-serving-v${projectionVersion}`,
          sourceStandard:
            "Governed Tower read from finance, program, contract, and control evidence",
          formulaVersion: "tower_ecl_serving_reader_v1",
          asOfPeriod,
          refreshTimestamp,
          totalItBudgetFy26: executiveTotalIt,
          runBudgetFy26: null,
          changeBudgetFy26: null,
          approvedProgramBudgetFy26: executiveApproved ?? (funded || null),
          aiTaggedSpendFy26NonAdditive:
            executiveAiInvestment ??
            aiPortfolio.reduce((sum, row) => sum + row.aiTaggedSpendUsd, 0),
          promisedValueFy26: executivePromised ?? (promised || null),
          partialFinanceValidatedValueYtd: financeValidated,
          realizedValueYtdAllowed: executiveClaimable ?? claimable,
          claimableValue: executiveClaimable ?? claimable,
          financeValidatedBlockedValue: Math.max(
            0,
            financeValidated - claimable,
          ),
          promisedValueExposure:
            executivePromised ?? (promised || blocked || null),
          totalProgramSubjectCount:
            executiveReviewedProjectCount ?? activeDecisionRows.length,
          activeProgramSubjectCount: activeDecisionRows.length,
          materialProgramCount: activeDecisionRows.length,
          boardScopeProgramCount: activeDecisionRows.length,
          economicReviewQueueCount: gatedRows,
          valueClaimCount: claimRows.length,
          knownValueClaimCount: knownValueClaimRows.length,
          unknownValueClaimCount: unknownValueClaimRows.length,
          knownZeroValueClaimCount: claimRows.filter(
            (row) => payloadNumber(row, "claimable_value_usd") === 0,
          ).length,
          knownValueAmountUsd: promised,
          financeAttestedClaimCount: claimRows.filter(
            (row) => payloadNumber(row, "finance_validated_value_usd") > 0,
          ).length,
          businessAttestedClaimCount: 0,
          claimableClaimCount: claimRows.filter(
            (row) => payloadNumber(row, "claimable_value_usd") > 0,
          ).length,
          usageSupportedClaimCount: claimRows.filter(
            (row) => payloadNumber(row, "usage_supported_value_usd") > 0,
          ).length,
          fundedNoBaselineClaimCount: claimRows.filter(
            (row) =>
              payloadNumber(row, "funded_amount_usd") > 0 &&
              payloadNumber(row, "baseline_value") === 0,
          ).length,
          staleClaimCount: 0,
          disputedClaimCount: 0,
          baselineLinkedClaimCount: claimRows.filter(
            (row) => payloadNullableNumber(row, "baseline_value") !== null,
          ).length,
          targetLinkedClaimCount: claimRows.filter(
            (row) => payloadNullableNumber(row, "target_value") !== null,
          ).length,
          actualLinkedClaimCount: claimRows.filter(
            (row) => payloadNullableNumber(row, "current_value") !== null,
          ).length,
          outcomeMeasuredClaimCount: claimRows.filter(
            (row) => payloadNullableNumber(row, "current_value") !== null,
          ).length,
          claimableProgramCount: 0,
          blockedProgramCount: activeDecisionRows.filter(
            (row) => payloadText(row, "claim_gate_status") === "blocked",
          ).length,
          conflictedProgramCount: 0,
          unmeasuredProgramCount: activeDecisionRows.filter(
            (row) => payloadText(row, "claim_gate_status") !== "claimable",
          ).length,
          aiInitiativeCount: aiPortfolio.length,
          candidateAiOpportunities: aiPortfolio.length,
          watchPressureSignals: activeRiskRows.length + activeEvidenceRows.length,
          runRatio: null,
          changeRatio: null,
          financeValidationRatio:
            promised > 0 ? financeValidated / promised : null,
          decisionQuestion:
            "Which funded work can Tower prove, and which value claims remain gated by missing evidence?",
          executiveSummary: buildHeadline(
            tenantDisplayName,
            claimable,
            blocked,
            gatedRows,
            claimRows.length,
          ),
          sourceFiles,
        },
        valueFunnel: buildFunnel(valueRowsForTotals),
        valueTrajectory: mapValueTrajectory(activeValueRows),
        programLanes: activeDecisionRows.map(mapProgramLane),
        aiPortfolio,
        aiPortfolioCounts: {
          total: aiPortfolio.length,
          candidate: aiPortfolio.length,
          active: aiPortfolio.length,
          funded: aiPortfolio.filter((row) => row.approvedFundingUsd > 0)
            .length,
          embeddedOrUsage: aiPortfolio.length,
          attributedSpendUsd: aiPortfolio.reduce(
            (sum, row) => sum + row.aiTaggedSpendUsd,
            0,
          ),
        },
        cxoActions: activeActionRows.map(mapAction),
        evidenceLineage: [
          ...activeEvidenceRows,
          ...activeCostRows,
          ...activeRiskRows,
        ].map(
          mapEvidence,
        ),
        requiredFieldGaps: gapsFromRows([
          ...activeDecisionRows,
          ...activeEvidenceRows,
          ...activeActionRows,
          ...activeCostRows,
          ...activeRiskRows,
        ]),
      };
    });

    if (result) return result;
  }

  return null;
}
