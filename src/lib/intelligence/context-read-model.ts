import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

export type ContextFreshnessStatus =
  | "fresh"
  | "attention"
  | "stale"
  | "review"
  | "unknown"
  | "missing";

export interface ContextEntitySummary {
  recordId: string;
  title: string;
  recordType: string;
  recordSubtype: string | null;
  domainSegment: string | null;
  businessFunction: string | null;
  criticality: string | null;
  freshnessStatus: ContextFreshnessStatus;
  lifecycleState: string;
  classificationSource: string | null;
  sourceSystem: string | null;
  sourceFile: string | null;
  owner: string | null;
  payload: Record<string, unknown>;
}

export interface ContextDimensionCoverage {
  recordType: string;
  domainSegment: string | null;
  recordCount: number;
  freshCount: number;
  staleCount: number;
  needsClassificationCount: number;
  lastUpdatedAt: string | null;
}

export interface ContextSourceHealthRow {
  sourceId: string;
  sourceSystem: string;
  sourceType: string;
  displayName: string;
  lastSyncedAt: string | null;
  freshnessStatus: ContextFreshnessStatus;
  recordCount: number;
  chunkCount: number;
  furthestTruthState: number;
  firstUnmetTruthState: number | null;
}

export interface ContextReadModelResult {
  tenantKey: string;
  entitySummaries: ContextEntitySummary[];
  dimensionCoverage: ContextDimensionCoverage[];
  sourceHealth: ContextSourceHealthRow[];
  insightCount: number;
  dimensionsLoaded: number;
  factsActive: number;
  evidenceCoverage: number;
  latestUpdatedAt: string | null;
  errors: string[];
}

interface ApplicationInventoryRow {
  tenant_key: string;
  record_id: string;
  system_name: string;
  domain_segment: string | null;
  business_function: string | null;
  criticality: string | null;
  vendor_name: string | null;
  hosting_model: string | null;
  active_users: string | null;
  contract_end_date: string | null;
  annual_cost_usd: string | null;
  cmdb_ci_id: string | null;
  freshness_status: string | null;
  lifecycle_state: string | null;
  classification_source: string | null;
}

interface DimensionCoverageRow {
  record_type: string;
  domain_segment: string | null;
  record_count: number | string | null;
  fresh_count: number | string | null;
  stale_count: number | string | null;
  needs_classification_count: number | string | null;
  last_updated_at: string | null;
}

interface SourceRow {
  id: string;
  source_system: string;
  source_type: string;
  display_name: string;
  last_synced_at: string | null;
  freshness_status: string | null;
}

interface CountBySourceRow {
  source_system: string;
  source_record_id?: string | null;
}

interface ChunkSourceRow {
  source_record_id: string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeFreshness(
  value: string | null | undefined,
): ContextFreshnessStatus {
  if (
    value === "fresh" ||
    value === "attention" ||
    value === "stale" ||
    value === "review" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

function countRowsBySourceSystem(
  rows: CountBySourceRow[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row.source_system;
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function countChunksByRecordSourceSystem(
  chunks: ChunkSourceRow[],
  records: CountBySourceRow[],
): Map<string, number> {
  const sourceByRecordId = new Map<string, string>();
  for (const row of records) {
    if (row.source_record_id && row.source_system) {
      sourceByRecordId.set(row.source_record_id, row.source_system);
    }
  }

  const counts = new Map<string, number>();
  for (const chunk of chunks) {
    const sourceSystem = chunk.source_record_id
      ? sourceByRecordId.get(chunk.source_record_id)
      : null;
    if (!sourceSystem) continue;
    counts.set(sourceSystem, (counts.get(sourceSystem) ?? 0) + 1);
  }
  return counts;
}

async function safeQuery<T>(
  label: string,
  errors: string[],
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const result = await query;
  if (result.error) {
    errors.push(`${label}: ${result.error.message}`);
    return [];
  }
  return result.data ?? [];
}

async function safeCount(
  table: string,
  tenantKey: string,
  errors: string[],
  filter?: { column: string; value: string | boolean },
): Promise<number> {
  const db = getAzureReadFluentClient();
  let query = db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_key", tenantKey);
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  const result = await query;
  if (result.error) {
    errors.push(`${table}: ${result.error.message}`);
    return 0;
  }
  return result.count ?? 0;
}

function mapApplicationRow(row: ApplicationInventoryRow): ContextEntitySummary {
  return {
    recordId: row.record_id,
    title: row.system_name,
    recordType: "system",
    recordSubtype: row.hosting_model,
    domainSegment: row.domain_segment,
    businessFunction: row.business_function,
    criticality: row.criticality,
    freshnessStatus: normalizeFreshness(row.freshness_status),
    lifecycleState: row.lifecycle_state ?? "unknown",
    classificationSource: row.classification_source,
    sourceSystem: null,
    sourceFile: null,
    owner: null,
    payload: {
      vendor_name: row.vendor_name,
      hosting_model: row.hosting_model,
      active_users: row.active_users,
      contract_end_date: row.contract_end_date,
      annual_cost_usd: row.annual_cost_usd,
      cmdb_ci_id: row.cmdb_ci_id,
    },
  };
}

function truthStateForSource(args: {
  source: SourceRow;
  recordCount: number;
  chunkCount: number;
}): { furthestTruthState: number; firstUnmetTruthState: number | null } {
  let furthest = 1;
  if (args.source.source_type) furthest = 2;
  if (args.chunkCount > 0) furthest = 3;
  if (args.recordCount > 0) furthest = 5;
  if (args.chunkCount > 0 && args.recordCount > 0) furthest = 7;
  return {
    furthestTruthState: furthest,
    firstUnmetTruthState: furthest >= 8 ? null : furthest + 1,
  };
}

export async function getContextReadModelForTenant(
  tenantKey: string,
): Promise<ContextReadModelResult> {
  const db = getAzureReadFluentClient();
  const errors: string[] = [];

  const [
    applicationRows,
    dimensionRows,
    sources,
    recordSourceRows,
    chunkSourceRows,
    insightCount,
    factsActive,
    evidenceUsable,
  ] = await Promise.all([
    safeQuery<ApplicationInventoryRow>(
      "v_context_application_inventory",
      errors,
      db
        .from<ApplicationInventoryRow[]>("v_context_application_inventory")
        .select("*")
        .eq("tenant_key", tenantKey)
        .limit(500),
    ),
    safeQuery<DimensionCoverageRow>(
      "v_context_dimension_coverage",
      errors,
      db
        .from<DimensionCoverageRow[]>("v_context_dimension_coverage")
        .select("*")
        .eq("tenant_key", tenantKey)
        .limit(500),
    ),
    safeQuery<SourceRow>(
      "enterprise_context_sources",
      errors,
      db
        .from<SourceRow[]>("enterprise_context_sources")
        .select(
          "id,source_system,source_type,display_name,last_synced_at,freshness_status",
        )
        .eq("tenant_key", tenantKey)
        .order("last_synced_at", { ascending: false, nullsFirst: false })
        .limit(200),
    ),
    safeQuery<CountBySourceRow>(
      "enterprise_context_records.source_system",
      errors,
      db
        .from<CountBySourceRow[]>("enterprise_context_records")
        .select("source_system,source_record_id")
        .eq("tenant_key", tenantKey)
        .eq("lifecycle_state", "active")
        .limit(5000),
    ),
    safeQuery<ChunkSourceRow>(
      "enterprise_context_chunks.source_record_id",
      errors,
      db
        .from<ChunkSourceRow[]>("enterprise_context_chunks")
        .select("source_record_id")
        .eq("tenant_key", tenantKey)
        .eq("lifecycle_state", "active")
        .limit(5000),
    ),
    safeCount("context_insights", tenantKey, errors, {
      column: "lifecycle_state",
      value: "active",
    }),
    safeCount("enterprise_context_facts", tenantKey, errors, {
      column: "lifecycle_state",
      value: "active",
    }),
    safeCount("enterprise_context_evidence", tenantKey, errors, {
      column: "evidence_usable",
      value: true,
    }),
  ]);

  const recordsBySource = countRowsBySourceSystem(recordSourceRows);
  const chunksBySource = countChunksByRecordSourceSystem(
    chunkSourceRows,
    recordSourceRows,
  );
  const entitySummaries = applicationRows.map(mapApplicationRow);
  const dimensionCoverage = dimensionRows.map((row) => ({
    recordType: row.record_type,
    domainSegment: row.domain_segment,
    recordCount: toNumber(row.record_count),
    freshCount: toNumber(row.fresh_count),
    staleCount: toNumber(row.stale_count),
    needsClassificationCount: toNumber(row.needs_classification_count),
    lastUpdatedAt: row.last_updated_at,
  }));

  const sourceHealth = sources.map((source) => {
    const recordCount = recordsBySource.get(source.source_system) ?? 0;
    const chunkCount = chunksBySource.get(source.source_system) ?? 0;
    return {
      sourceId: source.id,
      sourceSystem: source.source_system,
      sourceType: source.source_type,
      displayName: source.display_name,
      lastSyncedAt: source.last_synced_at,
      freshnessStatus: normalizeFreshness(source.freshness_status),
      recordCount,
      chunkCount,
      ...truthStateForSource({ source, recordCount, chunkCount }),
    };
  });

  const latestUpdatedAt =
    [
      ...dimensionCoverage.map((row) => row.lastUpdatedAt),
      ...sourceHealth.map((row) => row.lastSyncedAt),
    ]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  const activeRecords = dimensionCoverage.reduce(
    (sum, row) => sum + row.recordCount,
    0,
  );
  const evidenceCoverage =
    activeRecords > 0 ? Math.round((evidenceUsable / activeRecords) * 100) : 0;

  return {
    tenantKey,
    entitySummaries,
    dimensionCoverage,
    sourceHealth,
    insightCount,
    dimensionsLoaded: dimensionCoverage.filter((row) => row.recordCount > 0)
      .length,
    factsActive,
    evidenceCoverage,
    latestUpdatedAt,
    errors,
  };
}
