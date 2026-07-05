import { createDefaultSession, type SessionRunner, type SqlRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { appClientKeyForTenant, tenantProfileForClientKey } from "@/lib/tenant/aliases";
import type {
  HomeV6BrowserColumn,
  HomeV6BrowserSourceRow,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";

type JsonRecord = Record<string, unknown>;

interface V7RunRow {
  tenant_key: string;
  tenant_name: string;
  contract_version: string;
  source_dataset: string;
  load_status: string;
  file_count: number;
  row_count: number;
  field_count: number;
  graph_node_count: number;
  relationship_edge_count: number;
  chunk_count: number;
  loaded_at: string;
}

interface V7DimensionRow {
  dimension_key: string;
  dimension_file: string;
  dimension_label: string;
  column_count: number;
  record_count: number;
  source_files: number;
}

interface V7ColumnRow {
  dimension_key: string;
  column_name: string;
  client_field: string | null;
  client_instruction: string | null;
  module_use: string | null;
}

interface V7RecordRow {
  dimension_key: string;
  record_key?: string | null;
  record_name: string | null;
  source_file: string;
  source_row_number: number;
  source_artifact_name: string | null;
  source_validation_status: string | null;
  values_json: JsonRecord;
}

const DEFAULT_CONTRACT_VERSION = "v7.0.0-synthetic-depth-v2-20260703";

const V7_TENANT_BY_APP_CLIENT: Record<string, string> = {
  apexretail: "apex-retail",
  firstcapital: "first-capital-financial",
  arcturus: "first-capital-financial",
  lakeshore: "lakeshore-industries",
  meridian: "meridian-health",
  skyharbor: "skyharbor-air",
};

const PREVIEW_COLUMNS: Record<string, string[]> = {
  v7_01_enterprise_profile: ["company_name", "industry", "revenue_usd", "employee_count", "total_direct_technology_budget_usd"],
  v7_02_business_functions: ["entity_name", "function_name", "executive_owner", "business_capability", "critical_processes_structured"],
  v7_03_org_ownership: ["entity_name", "org_unit", "leader_role", "reports_to_role", "decision_rights"],
  v7_04_workforce_personas: ["entity_name", "persona_name", "business_area", "population_count", "ai_relevance"],
  v7_05_applications_systems: ["entity_name", "system_name", "system_category", "system_owner", "criticality"],
  v7_06_data_assets_integrations: ["entity_name", "data_asset_name", "system_of_record", "integration_type", "data_owner"],
  v7_07_vendors_contracts: ["entity_name", "vendor_name", "service_category", "renewal_date", "contract_risk"],
  v7_08_spend_value: ["entity_name", "amount_usd", "amount_type", "owner", "value_linkage"],
  v7_09_programs_initiatives_business_priorities: ["entity_name", "program_name", "business_priority", "sponsor", "status"],
  v7_10_ai_initiatives: ["entity_name", "use_case", "tool_or_model", "active_users", "data_readiness"],
  v7_11_operations_risk_controls: ["entity_name", "process", "risk_name", "status", "control_owner"],
  v7_12_relationships_graph_edges: ["from_object_ref", "relationship_type", "to_object_ref", "relationship_strength", "evidence_basis"],
  v7_13_source_evidence_registry: ["evidence_title", "evidence_type", "source_location", "evidence_owner", "evidence_confidence"],
  v7_14_metric_definitions: ["metric_name", "metric_definition", "metric_owner", "cadence", "source_basis"],
  v7_15_industry_market_knowledge_patterns: ["pattern_name", "industry_segment", "recommended_actions", "source_basis", "recommended_use"],
  v7_16_expert_lenses: ["lens_name", "expertise_area", "recommended_actions", "claim_boundary", "module_use"],
  v7_17_client_rate_card_cost_basis: ["tower", "role", "location", "rate_basis", "blended_rate_usd"],
  v7_18_function_system_data_vendor_bridge: ["entity_name", "business_function", "system_name", "data_asset_name", "vendor_name"],
  v7_19_service_tower_managed_services_scope: ["tower_name", "scope_area", "delivery_model", "service_owner", "pricing_basis"],
  v7_20_chunk_retrieval_registry: ["source_artifact_ref", "dimension", "semantic_tags", "retrieval_eligibility", "chunk_purpose"],
  v7_21_graph_registry_relationship_dictionary: ["relationship_type", "from_type", "to_type", "client_friendly_definition", "module_use"],
  v7_22_operational_evidence_process_intelligence: ["process_name", "event_source", "volume_metric", "bottleneck_signal", "process_owner"],
  v7_23_external_benchmark_market_corpus: ["benchmark_name", "industry_segment", "source_basis", "recommended_use", "caveat"],
  v7_24_infrastructure_cloud_estate: ["entity_name", "platform_name", "hosting_model", "provider", "volumetric_summary"],
};

const defaultSession = createDefaultSession("home-v7-context-browser");

export async function getHomeV7ContextBrowser(args: {
  tenantKey: string | null | undefined;
  session?: SessionRunner;
  contractVersion?: string;
}): Promise<HomeV6ContextBrowser | null> {
  const appClientKey = appClientKeyForTenant(args.tenantKey) ?? null;
  if (!appClientKey) return null;
  const profile = tenantProfileForClientKey(appClientKey);
  const tenantKey = V7_TENANT_BY_APP_CLIENT[profile.appClientKey];
  if (!tenantKey) return null;
  const contractVersion = args.contractVersion ?? DEFAULT_CONTRACT_VERSION;
  const session = args.session ?? defaultSession;

  return session(async (run) => {
    await run("select set_config('app.tenant_key', $1, false)", [tenantKey]);

    const runs = await run<V7RunRow>(
      `select tenant_key, tenant_name, contract_version, source_dataset, load_status,
        file_count::int, row_count::int, field_count::int, graph_node_count::int,
        relationship_edge_count::int, chunk_count::int, loaded_at::text
       from intelligence_v7.tenant_pack_runs
       where tenant_key = $1 and contract_version = $2 and load_status in ('loaded', 'validated')
       order by loaded_at desc
       limit 1`,
      [tenantKey, contractVersion],
    );
    const runRow = runs[0];
    if (!runRow) return null;

    const dimensionRows = await run<V7DimensionRow>(
      `select d.dimension_key, d.dimension_file, d.dimension_label, d.column_count::int,
        count(r.record_key)::int as record_count,
        count(distinct r.source_file_key)::int as source_files
       from intelligence_v7.dimension_registry d
       left join intelligence_v7.business_records r
        on r.dimension_key = d.dimension_key
       and r.contract_version = d.contract_version
       and r.tenant_key = $1
       where d.contract_version = $2
       group by d.dimension_key, d.dimension_file, d.dimension_label, d.column_count
       order by d.dimension_key`,
      [tenantKey, contractVersion],
    );

    const dimensionKeys = dimensionRows.map((dimension) => dimension.dimension_key);
    const allColumns = dimensionKeys.length
      ? await run<V7ColumnRow>(
          `select dimension_key, column_name, client_field, client_instruction, module_use
           from intelligence_v7.column_registry
           where contract_version = $1 and dimension_key = any($2::text[])
           order by dimension_key, column_ordinal asc`,
          [contractVersion, dimensionKeys],
        )
      : [];
    const allRecords = dimensionKeys.length
      ? await run<V7RecordRow>(
          `select dimension_key, record_key, record_name, source_file, source_row_number::int,
            source_artifact_name, source_validation_status, values_json
           from (
            select r.*,
              row_number() over (partition by r.dimension_key order by r.source_row_number asc) as preview_rank
            from intelligence_v7.business_records r
            where r.tenant_key = $1
              and r.contract_version = $2
              and r.dimension_key = any($3::text[])
           ) ranked
           where preview_rank <= 12
           order by dimension_key, source_row_number asc`,
          [tenantKey, contractVersion, dimensionKeys],
        )
      : [];
    // Evidence-gap posture is computed over the FULL dimension, not the capped
    // preview window. It is also scoped to the fields that actually represent
    // missing business evidence, so structural blanks (a top-level entity with
    // no parent) and provenance/lineage columns (validated_by = "not client
    // validated" on every synthetic row) do not inflate the count.
    //
    // Preference order, self-configured from the live schema:
    //   1. Required-field contract — count gaps only on columns the
    //      column_registry marks required_level ~ 'required*'. This is the
    //      authored per-dimension "required" set.
    //   2. Provenance denylist — when the contract column is absent or
    //      unpopulated, count content-field gaps but exclude internal,
    //      provenance/lineage, and relationship-reference columns.
    const gapRows = dimensionKeys.length
      ? await loadGapRows(run, { tenantKey, contractVersion, dimensionKeys })
      : [];

    const columnsByDimension = groupBy(allColumns, (column) => column.dimension_key);
    const recordsByDimension = groupBy(allRecords, (record) => record.dimension_key);
    const gapStatsByDimension = buildGapStats(gapRows);

    const dimensions: HomeV6ContextBrowser["dimensions"] = {};
    const bindingContext: NonNullable<HomeV6ContextBrowser["bindingContext"]> = [];

    for (const dimension of dimensionRows) {
      const columns = columnsByDimension.get(dimension.dimension_key) ?? [];
      const records = recordsByDimension.get(dimension.dimension_key) ?? [];

      const label = dimension.dimension_label;
      const displayColumns = previewColumns(dimension, columns, records);
      const sourceRows = records.map((row) =>
        toSourceRow(dimension, row, displayColumns),
      );
      // Prefer full-dimension gap stats; fall back to the preview sample only
      // if the aggregate query returned nothing for this dimension.
      const gapStats = gapStatsByDimension.get(dimension.dimension_key) ?? null;
      const knownGaps = gapStats
        ? knownGapsFromStats(gapStats.perColumn, columns)
        : topKnownGaps(records, columns);
      dimensions[label] = {
        dimension: label,
        title: `${label} loaded records`,
        fileNames: [dimension.dimension_file],
        rowCount: dimension.record_count,
        dataThinCells: gapStats ? gapStats.total : countDataThinCells(records),
        sourceCount: Math.max(1, dimension.source_files),
        columns: displayColumns,
        rows: records
          .slice(0, 8)
          .map((row) =>
            displayColumns.map((column) => display(row.values_json[column.key])),
          ),
        sourceRows,
        knownGaps,
      };
      bindingContext.push({
        dimension: label,
        status: dimension.record_count > 0 ? "loaded" : "not loaded",
        description: `${label} records with client-friendly fields, readable preview values, source support, and relationship coverage.`,
        evidence: dimension.record_count,
        sources: Math.max(1, dimension.source_files),
        trust: scoreFromCount(dimension.record_count),
        flag: knownGaps.length ? `${knownGaps.length} field groups need evidence` : undefined,
      });
    }

    return {
      tenantKey,
      displayName: runRow.tenant_name || profile.displayName,
      datasetDir: runRow.source_dataset,
      generatedAt: runRow.loaded_at,
      contractLabel: "V7",
      bindingContext,
      dimensions,
    };
  });
}

function previewColumns(
  dimension: V7DimensionRow,
  columns: V7ColumnRow[],
  records: V7RecordRow[],
): HomeV6BrowserColumn[] {
  const preferred = PREVIEW_COLUMNS[dimension.dimension_key] ?? [];
  const available = new Set(columns.map((column) => column.column_name));
  const selected = [
    ...preferred.filter(
      (column) =>
        available.has(column) ||
        records.some((record) => record.values_json[column] !== undefined),
    ),
    ...columns
      .map((column) => column.column_name)
      .filter((column) => !preferred.includes(column)),
  ]
    .filter((column) => !isInternalOnlyColumn(column))
    .slice(0, 6);
  return selected.map((column) => ({
    key: column,
    label: clientLabel(columns, column),
  }));
}

function toSourceRow(
  dimension: V7DimensionRow,
  row: V7RecordRow,
  columns: HomeV6BrowserColumn[],
): HomeV6BrowserSourceRow {
  return {
    v6File: dimension.dimension_file,
    rowNumber: row.source_row_number,
    rowId: `Source row ${row.source_row_number}`,
    label:
      display(row.record_name) ||
      display(firstMeaningfulValue(row.values_json)) ||
      `${dimension.dimension_label} source row ${row.source_row_number}`,
    values: Object.fromEntries(
      columns.map((column) => [
        column.label,
        display(row.values_json[column.key]),
      ]),
    ),
    knownGaps: collectKnownGaps(row.values_json),
  };
}

function countDataThinCells(rows: V7RecordRow[]): number {
  return rows.reduce(
    (sum, row) => sum + collectKnownGaps(row.values_json).length,
    0,
  );
}

function topKnownGaps(
  rows: V7RecordRow[],
  columns: V7ColumnRow[],
): HomeV6ContextBrowser["dimensions"][string]["knownGaps"] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const key of collectKnownGapKeys(row.values_json)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([columnName, count]) => {
      const meta = columns.find((column) => column.column_name === columnName);
      const label = humanize(meta?.client_field || columnName);
      return {
        label,
        count,
        instruction: cleanMetadata(meta?.client_instruction),
        moduleUse: cleanMetadata(meta?.module_use),
        whyItMatters: gapWhyItMatters(label, meta?.module_use),
        howItHelps: gapHowItHelps(label, meta?.module_use),
      };
    });
}

interface GapRow {
  dimension_key: string;
  column_name: string;
  gap_count: number;
}

// The predicate for a cell that represents missing business evidence: empty, or
// explicitly marked as needing evidence. Kept identical across both gap queries
// and the row-level `collectKnownGapKeys` fallback so counts stay consistent.
const GAP_VALUE_PREDICATE = `(
  kv.value is null
  or btrim(kv.value) = ''
  or kv.value ~* 'needs evidence|evidence_gap|not client validated'
  or kv.value ~* '^data_thin:'
)`;

// Internal, provenance/lineage, and blanket-caveat columns are not business
// evidence gaps. validated_by / source_validation_status / known_gaps carry the
// same synthetic caveat on every row; excluding them stops that caveat from
// being counted 25x as if 25 business fields were missing.
const NON_EVIDENCE_COLUMNS = [
  "tenant_key",
  "record_key",
  "source_file_key",
  "created_at",
  "updated_at",
  "data_provider_name",
  "data_provider_role",
  "source_artifact_type",
  "source_artifact_name",
  "capture_method",
  "extraction_method",
  "generated_by",
  "validated_by",
  "source_validation_status",
  "source_as_of_date",
  "known_gaps",
  "kpi_source_ref",
];

// Load per-column gap counts over the full dimension. Prefers the authored
// required-field contract; falls back to a provenance denylist; both are safe
// under the autocommit session (a failed probe does not poison the connection).
async function loadGapRows(
  run: SqlRunner,
  args: { tenantKey: string; contractVersion: string; dimensionKeys: string[] },
): Promise<GapRow[]> {
  const { tenantKey, contractVersion, dimensionKeys } = args;

  let requiredContractPopulated = false;
  try {
    const probe = await run<{ n: number }>(
      `select count(*)::int as n
       from intelligence_v7.column_registry
       where contract_version = $1
         and required_level is not null
         and required_level ~* '^required'`,
      [contractVersion],
    );
    requiredContractPopulated = (probe[0]?.n ?? 0) > 0;
  } catch {
    // required_level column is absent in this deployment's schema — fall back.
    requiredContractPopulated = false;
  }

  if (requiredContractPopulated) {
    try {
      return await run<GapRow>(
        `select r.dimension_key, kv.key as column_name, count(*)::int as gap_count
         from intelligence_v7.business_records r
         cross join lateral jsonb_each_text(r.values_json) kv
         join intelligence_v7.column_registry cr
           on cr.contract_version = r.contract_version
          and cr.dimension_key = r.dimension_key
          and cr.column_name = kv.key
         where r.tenant_key = $1
           and r.contract_version = $2
           and r.dimension_key = any($3::text[])
           and cr.required_level ~* '^required'
           and ${GAP_VALUE_PREDICATE}
         group by r.dimension_key, kv.key`,
        [tenantKey, contractVersion, dimensionKeys],
      );
    } catch {
      // Fall through to the denylist query on any unexpected schema mismatch.
    }
  }

  return run<GapRow>(
    `select r.dimension_key, kv.key as column_name, count(*)::int as gap_count
     from intelligence_v7.business_records r
     cross join lateral jsonb_each_text(r.values_json) kv
     where r.tenant_key = $1
       and r.contract_version = $2
       and r.dimension_key = any($3::text[])
       and kv.key <> all($4::text[])
       and kv.key !~* '(_ref|_refs)$'
       and ${GAP_VALUE_PREDICATE}
     group by r.dimension_key, kv.key`,
    [tenantKey, contractVersion, dimensionKeys, NON_EVIDENCE_COLUMNS],
  );
}

interface DimensionGapStats {
  total: number;
  perColumn: Map<string, number>;
}

function buildGapStats(
  rows: Array<{ dimension_key?: string; column_name?: string; gap_count?: number }>,
): Map<string, DimensionGapStats> {
  const stats = new Map<string, DimensionGapStats>();
  for (const row of rows) {
    // Defensive: a stubbed/mismatched session may return rows without the
    // aggregate shape. Skip anything that is not a real gap-count row.
    if (
      !row ||
      typeof row.dimension_key !== "string" ||
      typeof row.column_name !== "string" ||
      typeof row.gap_count !== "number" ||
      !Number.isFinite(row.gap_count)
    ) {
      continue;
    }
    const entry =
      stats.get(row.dimension_key) ?? { total: 0, perColumn: new Map() };
    entry.total += row.gap_count;
    entry.perColumn.set(
      row.column_name,
      (entry.perColumn.get(row.column_name) ?? 0) + row.gap_count,
    );
    stats.set(row.dimension_key, entry);
  }
  return stats;
}

function knownGapsFromStats(
  perColumn: Map<string, number>,
  columns: V7ColumnRow[],
): HomeV6ContextBrowser["dimensions"][string]["knownGaps"] {
  return [...perColumn.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([columnName, count]) => {
      const meta = columns.find((column) => column.column_name === columnName);
      const label = humanize(meta?.client_field || columnName);
      return {
        label,
        count,
        instruction: cleanMetadata(meta?.client_instruction),
        moduleUse: cleanMetadata(meta?.module_use),
        whyItMatters: gapWhyItMatters(label, meta?.module_use),
        howItHelps: gapHowItHelps(label, meta?.module_use),
      };
    });
}

function collectKnownGaps(record: JsonRecord): string[] {
  return collectKnownGapKeys(record).map(humanize);
}

function collectKnownGapKeys(record: JsonRecord): string[] {
  const gaps: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const text = String(value ?? "").trim();
    if (
      !text ||
      /^needs evidence$/i.test(text) ||
      /^data_thin:/i.test(text) ||
      /needs evidence|evidence_gap|not client validated/i.test(text)
    ) {
      gaps.push(key);
    }
  }
  return [...new Set(gaps)];
}

function cleanMetadata(value: string | null | undefined): string | null {
  const text = display(value);
  return text === "Needs evidence" ? null : text;
}

function gapWhyItMatters(label: string, moduleUse: string | null | undefined): string {
  const use = cleanMetadata(moduleUse);
  if (use) {
    return `${label} is part of the ${use.toLowerCase()} evidence contract. Without it, aVa can show that the row exists but should qualify conclusions that depend on this field.`;
  }
  return `${label} is needed to turn the loaded row from inventory context into decision-ready evidence. Without it, aVa should keep the answer caveated.`;
}

function gapHowItHelps(label: string, moduleUse: string | null | undefined): string {
  const use = cleanMetadata(moduleUse);
  if (use) {
    return `Once supplied, ${label.toLowerCase()} helps ${use.toLowerCase()} answer more precise questions, route follow-ups, and separate confirmed facts from assumptions.`;
  }
  return `Once supplied, ${label.toLowerCase()} helps Home answer more precisely and helps downstream modules use the row without guessing.`;
}

function clientLabel(columns: V7ColumnRow[], column: string): string {
  const meta = columns.find((item) => item.column_name === column);
  return humanize(meta?.client_field || column);
}

function firstMeaningfulValue(record: JsonRecord): string {
  for (const [key, value] of Object.entries(record)) {
    if (isInternalOnlyColumn(key)) continue;
    const displayed = display(value);
    if (displayed && displayed !== "Needs evidence") return displayed;
  }
  return "";
}

function display(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "Needs evidence";
  if (/^data_thin:/i.test(text) || /^needs evidence$/i.test(text)) {
    return "Needs evidence";
  }
  if (/^(synthetic_demo|v4_synthetic_pack|static_snapshot|confidential)$/i.test(text)) {
    return "Needs evidence";
  }
  return text.replace(/_/g, " ").replace(/\|/g, ", ").replace(/\s+/g, " ").trim();
}

function humanize(value: string): string {
  return value
    .replace(/^v7_\d+_/, "")
    .replace(/\.csv$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function isInternalOnlyColumn(column: string): boolean {
  return /^(tenant_key|record_key|source_file_key|created_at|updated_at)$/i.test(column);
}

function scoreFromCount(value: number): number {
  if (value >= 1000) return 92;
  if (value >= 100) return 84;
  if (value >= 25) return 74;
  if (value >= 5) return 64;
  return value > 0 ? 52 : 20;
}

function groupBy<T>(items: T[], keyFor: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFor(item);
    const existing = groups.get(key);
    if (existing) existing.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
