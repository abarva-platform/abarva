import { azureRead } from "@/lib/data-plane/azureRead";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  canonicalCioTowerTenantKey,
  formatCioTowerMoney,
} from "@/lib/tower/metric-packet";
import type {
  TowerMartAiPortfolioItem,
  TowerMartEvidenceItem,
  TowerMartFinanceApprovalEvent,
  TowerMartValueObservationMonth,
  TowerMartCommandViewModel,
  TowerMartCostDetail,
  TowerMartCostLens,
  TowerMartCxoAction,
  TowerMartEvidenceLineage,
  TowerMartFoundationInventory,
  TowerMartFoundationRecord,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
  TowerMartSourceValueRow,
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
  return "unclassified";
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

function payloadField(row: TowerServingRow, key: string): unknown {
  return payload(row)[key] ?? displayPayload(row)[key];
}

function costSourceRef(row: TowerServingRow, expectedFile: string): TowerMartCostDetail["sourceFile"] | null {
  const refs = sourceRefs(row);
  if (refs.length !== 1 || nullableText(refs[0].source_file) !== expectedFile) return null;
  const sourceRow = nullableNum(refs[0].source_row as Numeric);
  const sourceSha256 = nullableText(refs[0].source_sha256);
  if (!Number.isSafeInteger(sourceRow) || sourceRow === null || sourceRow < 2 || !sourceSha256) return null;
  return expectedFile;
}

function costDetail(row: TowerServingRow, expectedFile: string): TowerMartCostDetail | null {
  const sourceFile = costSourceRef(row, expectedFile);
  const ref = sourceRefs(row)[0];
  const amountUsd = payloadNullableNumber(row, "value");
  const label = payloadText(row, "title") ?? nullableText(row.title);
  const sourceRow = nullableNum(ref?.source_row as Numeric);
  const sourceSha256 = nullableText(ref?.source_sha256);
  if (!sourceFile || !Number.isSafeInteger(amountUsd) || amountUsd === null || amountUsd < 0 ||
      !label || sourceRow === null || !sourceSha256 ||
      !payloadText(row, "canonical_measure_id") ||
      payloadText(row, "measure_id") !== payloadText(row, "canonical_measure_id") ||
      payloadNullableNumber(row, "measure_value_number") !== amountUsd ||
      row.row_type !== "cost_exposure" ||
      row.value_state !== "estimated") return null;
  return {
    id: row.row_key, label, amountUsd, sourceFile, sourceRow, sourceSha256,
    sourcePriorYearActualUsd: displayNullableNumberFrom(row, ["source_prior_year_actual_usd"]),
    sourceForecastNextYearUsd: displayNullableNumberFrom(row, ["source_forecast_next_year_usd"]),
    sourceSavingsOpportunityUsd: displayNullableNumberFrom(row, ["source_savings_opportunity_usd"]),
    sourceCalculationBasis: payloadTextFrom(row, ["source_calculation_basis"]),
    sourceBudgetOwnerRole: payloadTextFrom(row, ["source_budget_owner_role"]),
  };
}

function activeCostLens(rows: readonly TowerServingRow[]): TowerMartCostLens | null {
  const aggregates = rows.filter((row) => row.row_key === "modeled_annual_spend");
  const categoryRows = rows.filter((row) => row.row_key.startsWith("spend:"));
  const contractRows = rows.filter((row) => row.row_key.startsWith("contract:"));
  const demoRows = rows.filter((row) => row.row_key === "synthetic_demo_fy26_budget");
  if (aggregates.length !== 1 || categoryRows.length === 0 || contractRows.length === 0 ||
      demoRows.length > 1 ||
      rows.length !== 1 + categoryRows.length + contractRows.length + demoRows.length) return null;
  if (demoRows.length === 1) {
    const demo = demoRows[0];
    const value = payloadNullableNumber(demo, "value");
    if (demo.row_type !== "cost_exposure" || demo.value_state !== "estimated" ||
        value === null || value < 0 ||
        !payloadText(demo, "measure_id") || !payloadText(demo, "canonical_measure_id") ||
        payloadText(demo, "measure_id") !== payloadText(demo, "canonical_measure_id") ||
        payloadNullableNumber(demo, "measure_value_number") !== value ||
        payloadField(demo, "additive_to_aggregate_spend") !== false ||
        payloadField(demo, "independent_finance_attestation") !== false ||
        sourceRefs(demo).filter((ref) => ref.source_file === "SA02_IT_Finance_Budget_Spend_Extract.csv").length !== 70) return null;
  }
  const aggregate = aggregates[0];
  const modeledAnnualSpendUsd = payloadNullableNumber(aggregate, "value");
  const aggregateRefs = sourceRefs(aggregate);
  if (!Number.isSafeInteger(modeledAnnualSpendUsd) || modeledAnnualSpendUsd === null ||
      modeledAnnualSpendUsd < 0 || aggregate.row_type !== "cost_exposure" ||
      aggregate.value_state !== "estimated" ||
      !payloadText(aggregate, "canonical_measure_id") ||
      payloadText(aggregate, "measure_id") !== payloadText(aggregate, "canonical_measure_id") ||
      payloadNullableNumber(aggregate, "measure_value_number") !== modeledAnnualSpendUsd ||
      payloadText(aggregate, "money_population") !== "modeled_it_spend" ||
      payloadText(aggregate, "amount_role") !== "aggregate" ||
      payloadText(aggregate, "period_basis") !== "annual_unspecified_year" ||
      payloadField(aggregate, "additive_to_category_rows") !== false ||
      payloadField(aggregate, "additive_to_contract_spend") !== false) return null;

  const categories = categoryRows.map((row) => {
    if (payloadField(row, "source_row_identity_only") !== true ||
        payloadField(row, "category_business_id") !== null ||
        payloadField(row, "additive_to_aggregate_spend") !== false ||
        payloadField(row, "additive_to_contract_spend") !== false ||
        payloadText(row, "period_basis") !== "annual_unspecified_year") return null;
    return costDetail(row, "08_spend_value.csv");
  });
  const contracts = contractRows.map((row) => {
    if (payloadField(row, "additive_to_it_spend") !== false) return null;
    return costDetail(row, "07_vendors_contracts.csv");
  });
  if (categories.some((row) => row === null) || contracts.some((row) => row === null)) return null;
  const completeCategories = categories as TowerMartCostDetail[];
  const completeContracts = contracts as TowerMartCostDetail[];
  const refKey = (ref: { sourceFile: string; sourceRow: number; sourceSha256: string }) =>
    `${ref.sourceFile}:${ref.sourceRow}:${ref.sourceSha256}`;
  const aggregateKeys = aggregateRefs.map((ref) => refKey({
    sourceFile: String(ref.source_file ?? ""),
    sourceRow: Number(ref.source_row),
    sourceSha256: String(ref.source_sha256 ?? ""),
  }));
  const categoryKeys = completeCategories.map(refKey);
  if (new Set(categoryRows.map((row) => row.row_key)).size !== categoryRows.length ||
      new Set(contractRows.map((row) => row.row_key)).size !== contractRows.length ||
      new Set(categoryKeys).size !== categoryKeys.length ||
      new Set(completeContracts.map(refKey)).size !== completeContracts.length ||
      aggregateKeys.length !== categoryKeys.length ||
      aggregateKeys.some((key) => !categoryKeys.includes(key)) ||
      completeCategories.reduce((sum, row) => sum + row.amountUsd, 0) !== modeledAnnualSpendUsd) return null;
  return {
    modeledAnnualSpendUsd,
    sourceNarrativeDifferenceUsd: payloadNullableNumber(aggregate, "source_narrative_difference_usd"),
    categories: completeCategories.sort((a, b) => b.amountUsd - a.amountUsd || a.label.localeCompare(b.label)),
    contractExposure: completeContracts.sort((a, b) => b.amountUsd - a.amountUsd || a.label.localeCompare(b.label)),
  };
}

/**
 * A recorded dollar value cannot become "usage supported" just because another
 * review stage recorded money. Its source reference must identify this exact
 * field. Adoption on its own can feed the separately declared estimate formula
 * in derive.ts, but it cannot validate an arbitrary persisted dollar amount.
 */
function hasUsageValueSource(row: TowerServingRow): boolean {
  return sourceRefs(row).some((ref) =>
    ["usage_supported_value_usd", "measured_usage_value_usd"].includes(
      nullableText(ref.source_field)?.toLowerCase() ?? "",
    ),
  );
}

function recordedUsageSupportedValue(row: TowerServingRow): number | null {
  const amount = payloadNullableNumber(row, "usage_supported_value_usd");
  return amount !== null && hasUsageValueSource(row) ? amount : null;
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

function displayScalarTextFrom(
  row: TowerServingRow,
  keys: readonly string[],
): string | null {
  const display = displayPayload(row);
  for (const key of keys) {
    const value = display[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    const text = nullableText(value);
    if (text !== null) return text;
  }
  return null;
}

/** A planning amount is never an approved FY26 budget by implication. */
function approvedFy26Budget(
  row: TowerServingRow | undefined,
  amountKey: string,
): number | null {
  if (!row) return null;
  const displayed = displayPayload(row);
  const fiscalYear = nullableText(displayed.budget_fiscal_year ?? displayed.fiscal_year);
  const approval = nullableText(displayed.budget_approval_status);
  if (!fiscalYear || !["FY26", "FY2026", "2026"].includes(fiscalYear.toUpperCase())) return null;
  if (approval?.toLowerCase() !== "approved") return null;
  return nullableNum(displayed[amountKey] as Numeric);
}

function syntheticDemoFy26Budget(row: TowerServingRow | undefined): number | null {
  if (!row) return null;
  const displayed = displayPayload(row);
  if (nullableText(displayed.budget_fiscal_year)?.toUpperCase() !== "FY26" ||
      nullableText(displayed.budget_approval_status) !== "approved_for_synthetic_demo" ||
      nullableText(displayed.budget_approval_basis) !== "user_selected_synthetic_source_not_finance_attestation" ||
      displayed.independent_finance_attestation !== false ||
      !nullableText(displayed.synthetic_demo_budget_measure_id) ||
      sourceRefs(row).filter((ref) => ref.source_file === "SA02_IT_Finance_Budget_Spend_Extract.csv").length !== 70) {
    return null;
  }
  return nullableNum(displayed.synthetic_demo_fy26_budget_usd as Numeric);
}

function syntheticDemoFy26Split(row: TowerServingRow | undefined, total: number | null):
  { run: number; change: number } | null {
  if (!row || total === null) return null;
  const displayed = displayPayload(row);
  const run = nullableNum(displayed.synthetic_demo_fy26_run_usd as Numeric);
  const change = nullableNum(displayed.synthetic_demo_fy26_change_usd as Numeric);
  if (run === null || change === null || run < 0 || change < 0 || run + change !== total ||
      displayed.synthetic_demo_fy26_run_row_count !== 31 ||
      displayed.synthetic_demo_fy26_change_row_count !== 39 ||
      !nullableText(displayed.synthetic_demo_run_measure_id) ||
      !nullableText(displayed.synthetic_demo_change_measure_id)) return null;
  return { run, change };
}

function reconciledAnnualBenefit(row: TowerServingRow | undefined): number | null {
  if (!row) return null;
  const displayed = displayPayload(row);
  if (nullableText(displayed.benefit_reconciliation_status)?.toLowerCase() !== "reconciled") return null;
  if (nullableText(displayed.benefit_period)?.toLowerCase() !== "annual") return null;
  return nullableNum(
    (displayed.projected_annual_value_low_usd ?? displayed.promised_value_usd) as Numeric,
  );
}

function approvedFinanceEvidence(row: TowerServingRow): boolean {
  const displayed = displayPayload(row);
  return (
    nullableText(displayed.evidence_approval_status)?.toLowerCase() === "approved" &&
    nullableText(displayed.finance_validation_status)?.toLowerCase() === "finance_validated"
  );
}

function recordedFinanceValidatedValue(row: TowerServingRow): number | null {
  return approvedFinanceEvidence(row)
    ? displayNullableNumberFrom(row, ["finance_validated_value_usd"])
    : null;
}

function isIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function reportableClaimAmount(row: TowerServingRow): number | null {
  if (!approvedFinanceEvidence(row)) return null;
  if (payloadText(row, "claim_gate_status") !== "claimable") return null;
  const displayed = displayPayload(row);
  const periodStart = nullableText(displayed.claimable_value_period_start);
  const periodEnd = nullableText(displayed.claimable_value_period_end);
  if (!isIsoDate(periodStart) || !isIsoDate(periodEnd) || periodEnd < periodStart) return null;
  const amount = displayNullableNumberFrom(row, ["claimable_value_usd"]);
  return amount !== null && amount >= 0 ? amount : null;
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

function quoteSqlIdentifier(value: string): string {
  const clean = value.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean)) {
    throw new Error(`tower_invalid_runtime_read_role: ${value}`);
  }
  return `"${clean}"`;
}

function towerRuntimeReadRole(): string {
  return process.env.TOWER_RUNTIME_READ_ROLE?.trim() || "tower_projection_reader";
}

async function withTowerTenantRead<T>(
  tenantKey: string,
  fn: (query: TowerSqlQuery) => Promise<T>,
): Promise<T> {
  return azureRead.withSession(async (run) => {
    let transactionOpen = false;
    await run("BEGIN READ ONLY", []);
    transactionOpen = true;
    try {
      await run(`SET LOCAL ROLE ${quoteSqlIdentifier(towerRuntimeReadRole())}`, []);
      await run("SELECT set_config('app.tenant_key', $1, true)", [tenantKey]);
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
      const result = await fn(query);
      await run("COMMIT", []);
      transactionOpen = false;
      return result;
    } catch (error) {
      if (transactionOpen) await run("ROLLBACK", []).catch(() => []);
      throw error;
    }
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
        ${viewName === "tower_command_center" ? "and page_key <> 'foundations'" : ""}
      order by page_key, row_key`,
    [tenantKey],
    { missingTable: "empty" },
  );
  return rows;
}

const FOUNDATION_PAGE_SIZE = 40;
const FOUNDATION_FILTER_TYPES: Record<string, readonly string[]> = {
  profile: ["enterprise_profile", "organization"],
  functions: ["business_function"],
  workforce: ["workforce_role"],
  operations: ["application", "data_flow", "infrastructure", "process"],
  services: ["managed_service_scope"],
};

interface FoundationBrowseRequest {
  page: number;
  filter: string;
  search: string;
}

async function readFoundationServingRows(
  query: TowerSqlQuery,
  tenantKey: string,
  request: FoundationBrowseRequest,
): Promise<{ rows: TowerServingRow[]; totalRecords: number; matchingRecords: number; page: number }> {
  const types = request.filter === "all" ? null : (FOUNDATION_FILTER_TYPES[request.filter] ?? null);
  const search = request.search.trim().toLowerCase();
  const where = `tenant_key = $1 and page_key = 'foundations' and row_type = 'foundation_record'
    and ($2::text[] is null or payload_json->'display_payload_json'->>'object_type' = any($2::text[]))
    and ($3 = '' or strpos(lower(coalesce(payload_json->'display_payload_json'->>'title', '') || ' ' ||
      coalesce(payload_json->'display_payload_json'->>'source_object_id', '')), $3) > 0)`;
  const [totalRows, matchingRows] = await Promise.all([
    query<{ count: number | string }>(
      `select count(*)::int as count from serving.tower_command_center
        where tenant_key = $1 and page_key = 'foundations' and row_type = 'foundation_record'`,
      [tenantKey], { missingTable: "empty" },
    ),
    query<{ count: number | string }>(
      `select count(*)::int as count from serving.tower_command_center where ${where}`,
      [tenantKey, types, search], { missingTable: "empty" },
    ),
  ]);
  const totalRecords = Number(totalRows[0]?.count ?? 0);
  const matchingRecords = Number(matchingRows[0]?.count ?? 0);
  const page = Math.min(request.page, Math.max(1, Math.ceil(matchingRecords / FOUNDATION_PAGE_SIZE)));
  const rows = matchingRecords === 0 ? [] : await query<TowerServingRow>(
    `select *
       from serving.tower_command_center
      where ${where}
      order by row_key limit $4 offset $5`,
      [tenantKey, types, search, FOUNDATION_PAGE_SIZE, (page - 1) * FOUNDATION_PAGE_SIZE],
      { missingTable: "empty" },
    );
  return {
    rows,
    totalRecords,
    matchingRecords,
    page,
  };
}

function countByGate(rows: readonly TowerServingRow[], status: string): number {
  return rows.filter((row) => payloadText(row, "claim_gate_status") === status)
    .length;
}

function isSourceOpportunityValueRow(row: TowerServingRow): boolean {
  return (
    row.row_type === "source_cloud_value_gate" ||
    row.row_type === "source_contract_depth_value_gate"
  );
}

function hasKnownBenefitValue(row: TowerServingRow): boolean {
  return !isSourceOpportunityValueRow(row) && reconciledAnnualBenefit(row) !== null;
}

function comparableBlockedAmount(row: TowerServingRow): number | null {
  // Older projections subtracted a yearly plan from Finance value in loaded
  // months. A stored number or a basis label alone does not prove alignment.
  if (payloadText(row, "blocked_value_basis") !== "same_period_claim_gap") {
    return null;
  }
  const planStart = payloadText(row, "blocked_value_period_start");
  const planEnd = payloadText(row, "blocked_value_period_end");
  const clearedStart = payloadText(row, "claimable_value_period_start");
  const clearedEnd = payloadText(row, "claimable_value_period_end");
  if (
    !planStart ||
    !planEnd ||
    planStart !== clearedStart ||
    planEnd !== clearedEnd
  ) {
    return null;
  }
  return payloadNullableNumber(row, "blocked_value_usd");
}

function annualPotentialAmount(row: TowerServingRow): number | null {
  return payloadNullableNumberFrom(row, [
    "annual_value_exposed",
    "projected_annual_value_low_usd",
  ]);
}

function isSourceOpportunityRow(row: TowerServingRow): boolean {
  return (
    row.row_type.startsWith("source_cloud_") ||
    row.row_type.startsWith("source_contract_depth_")
  );
}

function buildFunnel(
  rows: readonly TowerServingRow[],
): TowerMartValueFunnelStage[] {
  const benefitRows = rows.filter((row) => !isSourceOpportunityValueRow(row));
  const promised = benefitRows.reduce(
    (sum, row) => sum + (reconciledAnnualBenefit(row) ?? 0), 0,
  );
  const measuredUsageRows = rows.map(recordedUsageSupportedValue);
  const usageSupportedTotal = measuredUsageRows.reduce<number>(
    (sum, amount) => sum + (amount ?? 0),
    0,
  );
  const usageSupported = measuredUsageRows.some((amount) => amount !== null)
    ? usageSupportedTotal
    : null;
  const financeRows = rows.filter(approvedFinanceEvidence);
  const financeValidated = financeRows.reduce(
    (sum, row) => sum + (displayNullableNumberFrom(row, ["finance_validated_value_usd"]) ?? 0), 0,
  );
  const reportableAmounts = rows.map(reportableClaimAmount);
  const claimable = reportableAmounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  const claimRows = rows.filter((row) => payloadText(row, "claim_id"));
  const claimCount = claimRows.length;
  const knownValueClaimCount = claimRows.filter(hasKnownBenefitValue).length;
  const promisedAmount = benefitRows.some(hasKnownBenefitValue)
    ? promised
    : null;
  const gatedCount = countByGate(rows, "gated") + countByGate(rows, "blocked");
  const sources = uniqueSourceFiles(rows).join("; ");

  const stage = (
    sequence: number,
    stageKey: string,
    stageLabel: string,
    valueNumeric: number | null,
    caveat: string,
  ): TowerMartValueFunnelStage => ({
    funnelKey: `tower:ecl:funnel:${stageKey}`,
    sequence,
    stageKey,
    stageLabel,
    valueNumeric,
    claimCount,
    knownValueClaimCount,
    unknownValueClaimCount: claimCount - knownValueClaimCount,
    knownValueAmount: valueNumeric,
    blockedClaimCount: gatedCount,
    blockedKnownValueAmount: null,
    primaryBlocker: gatedCount > 0 ? "Evidence gates remain open" : null,
    primaryOwnerRole: gatedCount > 0 ? "Tower evidence owner" : null,
    denominatorStageKey: sequence === 1 ? null : "promised",
    // The annual plan and values from loaded months do not share a period.
    conversionRatio: null,
    claimStatus: valueNumeric === null ? "not_loaded" : gatedCount > 0 ? "gated" : "claimable",
    caveat,
    sourceFile: sources,
    sourceRow: null,
  });

  return [
    stage(
      1,
      "promised",
      "Reconciled yearly estimate",
      promisedAmount,
      "Shown only when the annual benefit and its source reconciliation are recorded.",
    ),
    stage(
      2,
      "usage_supported",
      "Usage supported",
      usageSupported,
      usageSupported !== null
        ? "Usage-supported value has a field-level source reference."
        : "No independently measured usage-supported amount is recorded.",
    ),
    stage(
      3,
      "finance_validated",
      "Finance validated",
      financeRows.length > 0 ? financeValidated : null,
      "Finance validation remains separate from adoption and planning values.",
    ),
    stage(
      4,
      "claimable",
      "Claimable",
      reportableAmounts.some((amount) => amount !== null) ? claimable : null,
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
  const approvedFunding = approvedFy26Budget(row, "approved_fy_budget_usd");
  return {
    laneKey: row.row_key,
    programCode:
      payloadText(row, "claim_id") ?? nullableText(display.program_id),
    programName: title,
    ownerRole:
      payloadText(row, "owner_role") ??
      nullableText(display.business_sponsor_role),
    // The business domain the program sits in. Distinct from who sponsors it: a domain groups
    // work by where it happens, an owner groups it by who answers for it.
    domainName: nullableText(display.domain_name),
    affectedFunctions: jsonArray(display.affected_functions).flatMap((value) => {
      const functionRow = asRecord(value);
      const functionId = nullableText(functionRow.function_id);
      const functionName = nullableText(functionRow.function_name);
      return functionId && functionName ? [{ functionId, functionName }] : [];
    }),
    technologyOwnerRole: nullableText(display.technology_owner_role),
    sourceProgramStatus: nullableText(display.source_program_status),
    sourceProgramPhase: nullableText(display.source_program_phase),
    financeOwnerRole: nullableText(display.finance_owner_role),
    decisionLane: decisionLane(display.decision_lane as string | null),
    decisionRationale:
      payloadText(row, "claim_gate_reason_detail", row.summary) ??
      "ECL serving row requires evidence review before the claim can advance.",
    approvedFundingUsd: approvedFunding ?? 0,
    planningBudgetUsd: payloadNullableNumberFrom(row, ["planning_budget_usd"]),
    sourceExpectedValueUsd: displayNullableNumberFrom(row, ["source_stated_expected_value_usd"]),
    sourceStartDate: payloadTextFrom(row, ["source_start_date"]),
    sourceEndDate: payloadTextFrom(row, ["source_end_date"]),
    sourcePctComplete: displayNullableNumberFrom(row, ["source_pct_complete"]),
    sourceStageGate: payloadTextFrom(row, ["source_stage_gate"]),
    sourceBenefitRealizationStart: payloadTextFrom(row, ["source_benefit_realization_start"]),
    sourceBlockedReason: payloadTextFrom(row, ["source_blocked_reason"]),
    sourceObjective: payloadTextFrom(row, ["source_objective"]),
    sourceTargetOutcomes: payloadTextFrom(row, ["source_target_outcomes"]),
    fundedAmount: payloadNumber(row, "funded_amount_usd"),
    fundingAmountLoaded: approvedFunding !== null,
    aiTaggedSpendUsd:
      row.page_key === "ai_portfolio"
        ? payloadNumber(row, "funded_amount_usd")
        : 0,
    aiSpendLoaded:
      row.page_key === "ai_portfolio" &&
      payloadNullableNumber(row, "funded_amount_usd") !== null,
    promisedValueUsd: reconciledAnnualBenefit(row),
    financeValidatedValueUsd: recordedFinanceValidatedValue(row) ?? 0,
    financeValidatedAmountLoaded: recordedFinanceValidatedValue(row) !== null,
    reportableClaimableValueUsd: reportableClaimAmount(row),
    knownSupportedValue: recordedUsageSupportedValue(row),
    proofMaturityScore: payloadNullableNumber(row, "proof_maturity_score"),
    riskPressureScore: payloadNullableNumber(row, "risk_pressure_score"),
    usageStrengthScore: payloadNullableNumber(row, "usage_strength_score"),
    lineageTrustState: row.basis,
    decisionReasonCode: payloadText(row, "claim_gate_reason_code"),
    amountBlocked: comparableBlockedAmount(row),
    blockedAmountComparable: comparableBlockedAmount(row) !== null,
    nextGate,
    usageMetric: nullableText(display.usage_metric),
    usageActual: nullableNum(display.usage_actual as Numeric),
    // A proof-strength score is not an adoption percentage. In the earlier
    // projection it was derived from Finance review, not observed usage.
    adoptionRatePct: displayNullableNumberFrom(row, [
      "adoption_rate_pct",
      "adoption_rate_percent",
      "adoption_actual_pct",
    ]),
    valueClaimStatus: gateStatus,
    towerClaimAllowed: reportableClaimAmount(row) !== null ? "allowed" : "blocked",
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
 * The dated finance trail on a case. Amounts are carried as recorded: 28 of the 84 events in the
 * canonical file record a literal 0, which is a stated amount and not a missing one.
 */
function financeApprovalEvents(
  row: TowerServingRow,
): TowerMartFinanceApprovalEvent[] {
  if (!approvedFinanceEvidence(row)) return [];
  const raw = displayPayload(row).finance_approval_events;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const e = asRecord(entry);
    return {
      eventDate: nullableText(e.event_date),
      eventType: nullableText(e.event_type),
      approvalState: nullableText(e.approval_state),
      approverRole: nullableText(e.approver_role),
      amountUsd: nullableNum(e.amount_usd as Numeric) ?? 0,
      amountBasis: nullableText(e.amount_basis),
      note: nullableText(e.note),
    };
  });
}

/** The evidence on file against a case, with its freshness and stated confidence. */
function evidenceItems(row: TowerServingRow): TowerMartEvidenceItem[] {
  const raw = displayPayload(row).evidence_items;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const e = asRecord(entry);
    return {
      evidenceName: nullableText(e.evidence_name),
      evidenceType: nullableText(e.evidence_type),
      ownerRole: nullableText(e.owner_role),
      freshnessState: nullableText(e.freshness_state),
      confidence: nullableText(e.confidence),
    };
  });
}

/**
 * The monthly value observations behind the waterfall, so a drawer can show when each step
 * happened rather than only its total. Rows without a month are dropped: an observation that
 * cannot be placed in time cannot be read as a sequence.
 */
function valueObservationMonths(
  row: TowerServingRow,
): TowerMartValueObservationMonth[] {
  if (!approvedFinanceEvidence(row)) return [];
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
        actualValue: nullableNum(o.actual_value as Numeric),
        reviewerRole: nullableText(o.reviewer_role),
      };
    })
    .filter((entry): entry is TowerMartValueObservationMonth => entry !== null);
}

function isActiveSourceCaseStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ["active", "live", "in_use", "production", "production_enterprise_wide"].includes(normalized);
}

function mapAiItem(row: TowerServingRow): TowerMartAiPortfolioItem {
  const refs = sourceRefs(row);
  const declaredPage = nullableText(displayPayload(row).page_key);
  const canonicalUseCaseId = nullableText(payload(row).use_case_object_id);
  const canonicalToolId = nullableText(payload(row).tool_object_id);
  const populationKind =
    declaredPage === "ai_portfolio" && canonicalUseCaseId
      ? "ai_case"
      : declaredPage === "adoption_lens" && canonicalUseCaseId
        ? "usage_observation"
        : declaredPage === "adoption_lens" && canonicalToolId
          ? "tool_rollout"
          : "unknown";
  const licensedUsersRaw = payloadNullableNumberFrom(row, [
    "licensed_users",
    "rollout_target_users",
  ]);
  const activeUsersRaw = payloadNullableNumberFrom(row, [
    "active_users",
    "monthly_active_users",
  ]);
  const enabledUsersRaw = payloadNullableNumberFrom(row, ["enabled_users"]);
  const approvedFundingRaw = approvedFy26Budget(row, "approved_fy_budget_usd");
  const monthlyCostRaw = displayNullableNumberFrom(row, ["monthly_cost_usd"]);
  const aiAmountBasis =
    approvedFundingRaw !== null
      ? "approved_funding"
      : monthlyCostRaw !== null
        ? "annualized_tool_cost"
        : "unknown";
  const approvedFundingUsd = approvedFundingRaw ?? 0;
  const aiTaggedSpendUsd =
    approvedFundingRaw ?? (monthlyCostRaw !== null ? monthlyCostRaw * 12 : 0);
  const aiSpendLoaded = aiAmountBasis !== "unknown";
  const promisedValueUsd = reconciledAnnualBenefit(row);
  const recordedValueScore = payloadNullableNumberFrom(row, ["value_score"]);
  const valueScoreLoaded = recordedValueScore !== null && recordedValueScore >= 0 && recordedValueScore <= 100;
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
  const usageRecorded = activeUsersRaw !== null || adoptionRatePct !== null;
  const rolloutTargetUsersRaw = payloadNullableNumberFrom(row, [
    "rollout_target_users",
  ]);
  return {
    aiPortfolioKey: row.row_key,
    itemName: payloadText(row, "use_case_name", row.title) ?? row.row_key,
    itemKind:
      payloadTextFrom(row, ["item_kind", "itemKind"]) ?? "unknown",
    populationKind,
    vendorName: payloadTextFrom(row, ["vendor_name"]),
    systemName: payloadTextFrom(row, ["system_name"]) ??
      (populationKind === "tool_rollout" ? payloadTextFrom(row, ["tool_name"]) : null),
    aiSpendType: payloadTextFrom(row, ["ai_spend_type"]),
    aiSpendCategory:
      payloadTextFrom(row, ["ai_spend_category", "business_value_type"]),
    fundingStatus:
      payloadTextFrom(row, ["funding_status", "finance_status"]),
    decisionLane: decisionLane(payloadTextFrom(row, ["decision_lane"])),
    approvedFundingUsd,
    aiTaggedSpendUsd,
    aiAmountBasis,
    aiSpendLoaded,
    // Initiative-detail fields. Each reads its own key; none falls back to another.
    projectName: payloadTextFrom(row, ["project_name"]),
    lifecycleStage: payloadTextFrom(row, ["lifecycle_stage"]),
    financePartnerRole: payloadTextFrom(row, ["finance_partner_role"]),
    successMetric: payloadTextFrom(row, ["success_metric"]),
    paybackMonthsTarget: payloadNullableNumberFrom(row, ["payback_months_target"]),
    valueObservationMonths: valueObservationMonths(row),
    actualSpendYtdUsd: payloadNullableNumberFrom(row, ["actual_spend_ytd_usd"]),
    forecastSpendUsd: payloadNullableNumberFrom(row, ["forecast_spend_usd"]),
    technologyOwnerRole: payloadTextFrom(row, ["technology_owner_role"]),
    targetGoLiveDate: payloadTextFrom(row, ["target_go_live_date"]),
    realizationStartMonth: payloadTextFrom(row, ["realization_start_month"]),
    metricBaselineValue: payloadNullableNumberFrom(row, ["metric_baseline_value"]),
    metricTargetValue: payloadNullableNumberFrom(row, ["metric_target_value"]),
    metricUnit: payloadTextFrom(row, ["metric_unit"]),
    benefitRealizationLagMonths: payloadNullableNumberFrom(row, [
      "benefit_realization_lag_months",
    ]),
    financeApprovalEvents: financeApprovalEvents(row),
    evidenceItems: evidenceItems(row),
    promisedValueUsd,
    financeValidatedValueUsd: recordedFinanceValidatedValue(row) ?? 0,
    financeValidatedAmountLoaded: recordedFinanceValidatedValue(row) !== null,
    usageMetric,
    rolloutGoal: payloadTextFrom(row, ["rollout_goal"]),
    rolloutStage: payloadTextFrom(row, ["rollout_stage", "funding_status"]),
    rolloutTargetUsers: rolloutTargetUsersRaw,
    enabledUsers: enabledUsersRaw,
    usageActual: activeUsersRaw,
    adoptionRatePct,
    adoptionTargetPct: payloadNullableNumberFrom(row, ["adoption_target_pct"]),
    linkedBusinessCaseCount: payloadNullableNumberFrom(row, [
      "linked_business_case_count",
    ]),
    valueScore: valueScoreLoaded ? recordedValueScore : 0,
    valueScoreLoaded,
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
    businessFunction: payloadTextFrom(row, ["business_function"]),
    businessSegmentKey: payloadTextFrom(row, ["business_segment_key"]),
    sourceCaseStatus: payloadTextFrom(row, ["source_case_status"]),
    operationalOwnerRole: payloadTextFrom(row, ["operational_owner_role"]),
    expectedValueArchetype: payloadTextFrom(row, ["expected_value_archetype"]),
    sourceValueHypothesis: payloadTextFrom(row, ["source_value_hypothesis"]),
    sourceApprovalPath: payloadTextFrom(row, ["source_approval_path"]),
    sourceRiskControls: payloadTextFrom(row, ["source_risk_controls"]),
    sourceRequiredSystems: payloadTextFrom(row, ["source_required_systems"]),
    duplicateRisk: null,
    valueClaimStatus: usageRecorded ? "usage_recorded" : "usage_not_recorded",
    towerClaimAllowed: "blocked",
    caveat: usageRecorded
      ? populationKind === "usage_observation"
        ? "Usage is recorded in a separate source feed. It is not linked to an intake AI case and does not establish a dollar benefit."
        : "Usage is recorded for this row. Value remains blocked until outcome and Finance evidence are linked."
      : "No usage measure is recorded for this row. Value remains blocked until usage, outcome, and Finance evidence are linked.",
    sourceFile: firstSourceLabel(refs),
    sourceRow: nullableText(refs[0]?.source_record_id),
    sourceSystem: payloadTextFrom(row, ["source_system"]),
    sourceRecordId: payloadTextFrom(row, ["source_record_id"]),
    extractDate: payloadTextFrom(row, ["extract_date"]),
    sourceAsOfDate: payloadTextFrom(row, ["as_of_date"]),
    refreshCadence: payloadTextFrom(row, ["refresh_cadence"]),
    sourceQualityState: payloadTextFrom(row, [
      "source_quality_state",
      "quality_state",
    ]),
  };
}

function mapAction(row: TowerServingRow, index: number): TowerMartCxoAction {
  const refs = sourceRefs(row);
  return {
    actionKey: row.row_key,
    sequence: index + 1,
    actionLane: decisionLane(payloadTextFrom(row, ["decision_lane"])),
    title: payloadText(row, "title", row.title) ?? row.row_key,
    actionBody:
      payloadText(row, "claim_gate_reason_detail", row.summary) ??
      "Review the ECL evidence gate before advancing this Tower claim.",
    ownerHint: payloadText(row, "owner_role"),
    moduleHandoff: payloadText(row, "handoff_module"),
    claimId: payloadText(row, "claim_id"),
    proofStage: payloadText(row, "claim_gate_status"),
    blockedDecision: payloadText(row, "claim_gate_reason_code"),
    amountExposed: annualPotentialAmount(row),
    evidenceRequirement: jsonArray(payload(row).evidence_needed_json).join(
      ", ",
    ),
    expectedSourceSystem: firstSourceLabel(refs),
    evidencePackageId: nullableText(refs[0]?.source_record_id),
    ownerRole: payloadText(row, "owner_role"),
    dueWindow: payloadText(row, "next_gate"),
    handoffModule: payloadText(row, "handoff_module"),
    handoffEntityId: payloadTextFrom(row, ["primary_object_id", "contract_id"]),
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
  const displayedAmount = isSourceOpportunityRow(row)
    ? annualPotentialAmount(row)
    : comparableBlockedAmount(row);
  const metric =
    payloadText(row, "metric_key") ??
    nullableText(jsonArray(payload(row).metric_keys_json)[0]);
  return {
    lineageKey: row.row_key,
    surfaceSection: row.page_key,
    displayedFact: payloadText(row, "title", row.title) ?? row.row_type,
    displayedValueText:
      displayedAmount !== null ? formatCioTowerMoney(displayedAmount) : null,
    displayedValueNumeric: displayedAmount,
    metricOrFactKey: metric,
    boardVisibleLabel: isSourceOpportunityRow(row)
      ? "Potential annual saving"
      : payloadText(row, "claim_gate_reason_code") ?? row.row_type,
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
  if (isSourceOpportunityValueRow(row)) return null;
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

/** The shared value-chain serving view can also return cost-lens rows. */
function isValueProofRow(row: TowerServingRow): boolean {
  return row.page_key === "value_proof" && row.row_type !== "cost_exposure";
}

/** Registered outcome measures use a declared metric row key, not a benefit claim identity. */
function isOutcomeMeasureRow(row: TowerServingRow): boolean {
  return isValueProofRow(row) && row.row_key.startsWith("metric:") &&
    !isSourceOpportunityValueRow(row);
}

function isBenefitClaimRow(row: TowerServingRow): boolean {
  return isValueProofRow(row) && !isOutcomeMeasureRow(row) && !isTrajectoryOnlyRow(row);
}

function mapSourceValueRow(row: TowerServingRow): TowerMartSourceValueRow | null {
  if (!isOutcomeMeasureRow(row) && !isBenefitClaimRow(row)) return null;
  const display = displayPayload(row);
  // v6 marks these as source assertions. Older serving rows have no marker and
  // continue to use their existing proof story until this candidate is selected.
  if (nullableText(display.source_assertion_caveat) === null) return null;
  const outcome = isOutcomeMeasureRow(row);
  const moneyFields = [
    ["source_asserted_finance_value_usd", outcome ? "Outcome source: Finance amount stated" : "Benefit feed: Finance amount stated"],
    ["benefit_feed_source_funded_spend_usd", "Benefit feed: funded spend stated"],
    ["benefit_feed_source_actual_spend_ytd_usd", "Benefit feed: year-to-date spend stated"],
    ["usage_feed_source_promised_value_usd", "Usage feed: promised value stated"],
    ["usage_feed_source_finance_assertion_usd", "Usage feed: Finance amount stated"],
    ["outcome_feed_source_finance_assertion_usd", "KPI feed: Finance amount stated"],
  ] as const;
  const statusFields = [
    ["source_value_claim_status", "Source claim status"],
    ["source_claim_readiness", "Source claim readiness"],
    ["source_finance_validation_status", "Benefit feed Finance status"],
    ["source_tower_claim_allowed", "Benefit feed claim flag"],
    ["source_realized_value_allowed", "Benefit feed realized-value flag"],
    ["source_owner_attestation_status", "Benefit feed owner attestation"],
    ["usage_feed_source_claim_status", "Usage feed claim status"],
    ["outcome_feed_claim_status", "KPI feed claim status"],
    ["outcome_feed_claim_allowed", "KPI feed claim flag"],
  ] as const;
  return {
    id: row.row_key,
    kind: outcome ? "outcome_measure" : "ai_feed_claim",
    title: nullableText(display.title) ?? row.title ?? row.row_key,
    sourceFiles: [...new Set(sourceRefs(row).map((ref) =>
      nullableText(ref.source_file) ?? nullableText(ref.source_family),
    ).filter((value): value is string => value !== null))],
    baseline: displayScalarTextFrom(row, [outcome ? "baseline" : "outcome_feed_baseline"]),
    target: displayScalarTextFrom(row, [outcome ? "target" : "outcome_feed_target"]),
    observed: displayScalarTextFrom(row, [outcome ? "observed" : "outcome_feed_actual"]),
    baselinePeriod: payloadTextFrom(row, ["baseline_period"]),
    observedPeriod: payloadTextFrom(row, ["observed_period"]),
    kpiName: payloadTextFrom(row, ["outcome_feed_kpi_name"]),
    kpiUnit: payloadTextFrom(row, ["outcome_feed_unit"]),
    kpiPeriodStart: payloadTextFrom(row, ["outcome_feed_period_start"]),
    kpiPeriodEnd: payloadTextFrom(row, ["outcome_feed_period_end"]),
    sourceDataSource: payloadTextFrom(row, ["source_data_source"]),
    sourceCalculationBasis: payloadTextFrom(row, ["source_calculation_basis"]),
    moneyAssertions: moneyFields.flatMap(([sourceField, label]) => {
      const amountUsd = displayNullableNumberFrom(row, [sourceField]);
      return amountUsd === null ? [] : [{ sourceField, label, amountUsd }];
    }),
    statusAssertions: statusFields.flatMap(([sourceField, label]) => {
      const code = payloadTextFrom(row, [sourceField]);
      return code === null ? [] : [{ sourceField, label, code }];
    }),
  };
}

function mapFoundationRecord(row: TowerServingRow): TowerMartFoundationRecord | null {
  if (row.page_key !== "foundations" || row.row_type !== "foundation_record") return null;
  const display = displayPayload(row);
  const objectType = nullableText(display.object_type);
  const sourceObjectId = nullableText(display.source_object_id);
  const sourceRecordId = nullableText(display.canonical_source_record_id);
  const name = nullableText(display.title) ?? nullableText(row.title);
  const qualityLabel = nullableText(display.source_quality_label);
  const reviewState = nullableText(display.source_review_state);
  const canonicalObjectId = nullableText(row.primary_object_id);
  const [ref] = sourceRefs(row);
  const sourceFile = nullableText(ref?.source_file);
  const sourceSha256 = nullableText(ref?.source_sha256);
  const sourceRow = nullableNum(ref?.source_row as Numeric);
  if (!objectType || !sourceObjectId || !sourceRecordId || !name || !qualityLabel ||
      !reviewState || !canonicalObjectId || !sourceFile || !sourceSha256 ||
      sourceRow === null || sourceRow <= 0 || sourceRefs(row).length !== 1 ||
      display.source_recorded !== true ||
      row.row_key !== `foundation:${objectType}:${sourceObjectId}`) return null;
  const sourceFields: Record<string, string | number> = {};
  for (const [field, value] of Object.entries(asRecord(display.source_fields))) {
    if (typeof value === "number" && Number.isFinite(value)) sourceFields[field] = value;
    else {
      const text = nullableText(value);
      if (text !== null) sourceFields[field] = text;
    }
  }
  return {
    id: row.row_key,
    objectType,
    sourceObjectId,
    canonicalObjectId,
    sourceRecordId,
    name,
    sourceFields,
    sourceFile,
    sourceRow,
    sourceSha256,
    qualityLabel,
    reviewState,
    segmentIdentityStatus: nullableText(display.segment_identity_status),
  };
}

function mapFoundationInventory(
  foundationRows: readonly TowerServingRow[],
  summaryRow: TowerServingRow | undefined,
  request: FoundationBrowseRequest,
  totalRecords: number,
  matchingRecords: number,
): TowerMartFoundationInventory | null {
  if (totalRecords === 0) return null;
  const records = foundationRows.flatMap((row) => {
    const record = mapFoundationRecord(row);
    return record ? [record] : [];
  });
  const summary = asRecord(displayPayload(summaryRow ?? foundationRows[0]).foundations);
  const noDeclaredId = asRecord(summary.no_declared_row_id);
  return {
    records,
    totalRecords,
    matchingRecords,
    page: request.page,
    pageSize: FOUNDATION_PAGE_SIZE,
    filter: request.filter,
    search: request.search,
    unreadableRowCount: foundationRows.length - records.length,
    rawMaturityRowsWithoutId: nullableNum(noDeclaredId.row_count as Numeric),
    rawRelationshipRows: nullableNum(summary.relationship_rows as Numeric),
    segmentRowsMappingPending: nullableNum(summary.segment_source_rows_mapping_pending as Numeric),
    itsmExtractAvailable: typeof summary.itsm_extract_available === "boolean"
      ? summary.itsm_extract_available : null,
  };
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
  gatedRows: number,
  valueClaims: number,
): string {
  if (claimable > 0) {
    return `${tenantName} has ${formatCioTowerMoney(claimable)} cleared in loaded months. ${valueClaims} claims need review across ${gatedRows} evidence rows.`;
  }
  if (valueClaims === 0) {
    return `${tenantName} has no loaded value claims. A cleared benefit amount is unknown.`;
  }
  const claimWord = valueClaims === 1 ? "claim" : "claims";
  const claimVerb = valueClaims === 1 ? "remains" : "remain";
  return `${tenantName} has no benefit amount cleared for reporting. ${valueClaims} value ${claimWord} ${claimVerb} behind evidence gates; ${gatedRows} separate review rows describe the supporting backlog.`;
}

export async function readTowerCommandCenter(args: {
  tenantKeyCandidates: readonly (string | null | undefined)[];
  tenantDisplayName?: string | null;
  includeFoundationInventory?: boolean;
  foundationPage?: number;
  foundationFilter?: string;
  foundationSearch?: string;
}): Promise<TowerMartCommandViewModel | null> {
  const foundationRequest: FoundationBrowseRequest = {
    page: Number.isSafeInteger(args.foundationPage) && (args.foundationPage ?? 0) > 0
      ? Math.min(args.foundationPage as number, 10000) : 1,
    filter: args.foundationFilter && Object.hasOwn(FOUNDATION_FILTER_TYPES, args.foundationFilter)
      ? args.foundationFilter : "all",
    search: (args.foundationSearch ?? "").trim().slice(0, 100),
  };
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

      const foundationResult = args.includeFoundationInventory
        ? await readFoundationServingRows(query, tenantKey, foundationRequest)
        : { rows: [], totalRecords: 0, matchingRecords: 0, page: 1 };
      const activeFoundationRows = rowsForActiveServingIdentity(
        foundationResult.rows,
        activeIdentity,
      );

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
        ["tower_foundations_page", activeFoundationRows],
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
      const valueRowsForTotals = activeValueRows.filter(isBenefitClaimRow);
      const outcomeMeasureRows = activeValueRows.filter(isOutcomeMeasureRow);
      const summaryRow =
        activeCommandRows.find((row) => row.row_key === "executive_summary") ??
        activeCommandRows.find((row) => row.page_key === "command_center");
      const benefitRows = valueRowsForTotals.filter(
        (row) => !isSourceOpportunityValueRow(row),
      );
      const promised = benefitRows.reduce(
        (sum, row) => sum + (reconciledAnnualBenefit(row) ?? 0), 0,
      );
      const financeValidated = valueRowsForTotals
        .filter(approvedFinanceEvidence)
        .reduce(
          (sum, row) => sum + (displayNullableNumberFrom(row, ["finance_validated_value_usd"]) ?? 0),
          0,
        );
      const claimable = valueRowsForTotals.reduce(
        (sum, row) => sum + (reportableClaimAmount(row) ?? 0), 0,
      );
      const executiveApproved = approvedFy26Budget(
        summaryRow,
        "approved_project_fy_budget_usd",
      );
      const executiveTotalIt = approvedFy26Budget(
        summaryRow,
        "approved_fy_budget_usd",
      );
      const executiveSyntheticDemoBudget = syntheticDemoFy26Budget(summaryRow);
      const executiveSyntheticDemoSplit = syntheticDemoFy26Split(summaryRow, executiveSyntheticDemoBudget);
      const executiveReviewedProjectCount =
        summaryRow === undefined
          ? null
          : payloadNullableNumber(summaryRow, "reviewed_project_count");
      const executiveAiInvestment =
        summaryRow === undefined
          ? null
          : payloadNullableNumber(summaryRow, "ai_related_investment_usd");
      const executivePromised = reconciledAnnualBenefit(summaryRow);
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
      const aiAssets = aiPortfolio.filter(
        (row) => row.populationKind === "ai_case" || row.populationKind === "tool_rollout",
      );
      const aiCandidates = aiAssets.filter((row) => /candidate/i.test(row.itemKind));
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
      const knownValueClaimRows = claimRows.filter(hasKnownBenefitValue);
      const unknownValueClaimRows = claimRows.filter(
        (row) => !knownValueClaimRows.includes(row),
      );

      return {
        generatedFrom: "ecl_serving" as const,
        headline: buildHeadline(
          tenantDisplayName,
          claimable,
          gatedRows,
          claimRows.length,
        ),
        costLens: activeCostLens(activeCostRows),
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
          syntheticDemoBudgetFy26: executiveSyntheticDemoBudget,
          syntheticDemoRunBudgetFy26: executiveSyntheticDemoSplit?.run ?? null,
          syntheticDemoChangeBudgetFy26: executiveSyntheticDemoSplit?.change ?? null,
          runBudgetFy26: null,
          changeBudgetFy26: null,
          approvedProgramBudgetFy26: executiveApproved,
          aiTaggedSpendFy26NonAdditive:
            executiveAiInvestment ??
            aiPortfolio.reduce((sum, row) => sum + row.aiTaggedSpendUsd, 0),
          promisedValueFy26: executivePromised,
          partialFinanceValidatedValueYtd: financeValidated,
          financeValidatedAmountLoaded: valueRowsForTotals.some((row) => recordedFinanceValidatedValue(row) !== null),
          realizedValueYtdAllowed: claimable,
          claimableAmountLoaded: valueRowsForTotals.some((row) => reportableClaimAmount(row) !== null),
          claimableValue: claimable,
          financeValidatedBlockedValue: Math.max(
            0,
            financeValidated - claimable,
          ),
          promisedValueExposure: executivePromised,
          blockedValueComparable: false,
          comparableBlockedValue: null,
          totalProgramSubjectCount:
            executiveReviewedProjectCount ?? activeDecisionRows.length,
          activeProgramSubjectCount: activeDecisionRows.length,
          materialProgramCount: activeDecisionRows.length,
          boardScopeProgramCount: activeDecisionRows.length,
          economicReviewQueueCount: gatedRows,
          valueClaimCount: claimRows.length,
          valueProofOutcomeRecordCount: outcomeMeasureRows.length,
          knownValueClaimCount: knownValueClaimRows.length,
          unknownValueClaimCount: unknownValueClaimRows.length,
          knownZeroValueClaimCount: knownValueClaimRows.filter((row) => {
            const amount = reportableClaimAmount(row);
            return amount !== null && amount === 0;
          }).length,
          knownValueAmountUsd: promised,
          financeAttestedClaimCount: claimRows.filter(
            (row) => approvedFinanceEvidence(row) && (displayNullableNumberFrom(row, ["finance_validated_value_usd"]) ?? 0) > 0,
          ).length,
          businessAttestedClaimCount: 0,
          claimableClaimCount: claimRows.filter(
            (row) => (reportableClaimAmount(row) ?? 0) > 0,
          ).length,
          usageSupportedClaimCount: claimRows.filter(
            (row) => (recordedUsageSupportedValue(row) ?? 0) > 0,
          ).length,
          fundedNoBaselineClaimCount: claimRows.filter(
            (row) =>
              payloadNumber(row, "funded_amount_usd") > 0 &&
              payloadNumber(row, "baseline_value") === 0,
          ).length,
          staleClaimCount: 0,
          disputedClaimCount: 0,
          baselineLinkedClaimCount: claimRows.filter(
            (row) =>
              !isSourceOpportunityValueRow(row) &&
              payloadNullableNumber(row, "baseline_value") !== null,
          ).length,
          targetLinkedClaimCount: claimRows.filter(
            (row) =>
              !isSourceOpportunityValueRow(row) &&
              payloadNullableNumber(row, "target_value") !== null,
          ).length,
          actualLinkedClaimCount: claimRows.filter(
            (row) =>
              !isSourceOpportunityValueRow(row) &&
              payloadNullableNumber(row, "current_value") !== null,
          ).length,
          outcomeMeasuredClaimCount: claimRows.filter(
            (row) =>
              !isSourceOpportunityValueRow(row) &&
              payloadNullableNumber(row, "current_value") !== null,
          ).length,
          claimableProgramCount: 0,
          blockedProgramCount: activeDecisionRows.filter(
            (row) => payloadText(row, "claim_gate_status") === "blocked",
          ).length,
          conflictedProgramCount: 0,
          unmeasuredProgramCount: activeDecisionRows.filter(
            (row) => payloadText(row, "claim_gate_status") !== "claimable",
          ).length,
          aiInitiativeCount: aiAssets.length,
          candidateAiOpportunities: aiCandidates.length,
          watchPressureSignals: activeRiskRows.length + activeEvidenceRows.length,
          runRatio: null,
          changeRatio: null,
          financeValidationRatio: null,
          decisionQuestion:
            "Which funded work can Tower prove, and which value claims remain gated by missing evidence?",
          executiveSummary: buildHeadline(
            tenantDisplayName,
            claimable,
            gatedRows,
            claimRows.length,
          ),
          sourceFiles,
        },
        valueFunnel: buildFunnel(valueRowsForTotals),
        valueTrajectory: mapValueTrajectory(activeValueRows.filter(
          (row) => isValueProofRow(row) && !isOutcomeMeasureRow(row),
        )),
        programLanes: activeDecisionRows.map(mapProgramLane),
        aiPortfolio,
        sourceValueRows: activeValueRows.flatMap((row) => {
          const mapped = mapSourceValueRow(row);
          return mapped ? [mapped] : [];
        }),
        foundationInventory: mapFoundationInventory(
          activeFoundationRows, summaryRow,
          { ...foundationRequest, page: foundationResult.page },
          foundationResult.totalRecords, foundationResult.matchingRecords,
        ),
        aiPortfolioCounts: {
          total: aiPortfolio.length,
          candidate: aiCandidates.length,
          active: aiAssets.filter((row) =>
            row.populationKind === "ai_case" &&
            isActiveSourceCaseStatus(row.sourceCaseStatus),
          ).length,
          funded: aiAssets.filter(
            (row) =>
              row.aiAmountBasis === "approved_funding" &&
              row.approvedFundingUsd > 0,
          )
            .length,
          embeddedOrUsage: aiPortfolio.filter(
            (row) => row.usageActual !== null || row.adoptionRatePct !== null,
          ).length,
          attributedSpendUsd: aiAssets.reduce(
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
