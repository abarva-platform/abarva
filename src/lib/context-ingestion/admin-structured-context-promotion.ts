import crypto from "node:crypto";

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";

import type { ContextTemplateDefinition } from "./template-registry";
import type {
  CsvMappingSuggestion,
  RowClassificationResult,
} from "./csv-upload-connector";
import { DIMENSION_FAMILY_MAP } from "./types";
import type {
  ContextDimension,
  ContextDimensionFamily,
  ContextDimensionUniversal,
} from "./types";

type CsvRow = Record<string, string>;

export interface AdminStructuredContextPromotionInput {
  clientId: string;
  tenantKey: string;
  fileName: string;
  sourceFileHash?: string | null;
  uploadedBy: string;
  uploadedAt: string;
  uploadId: string;
  sourcePathBase?: string | null;
  sourceBlob?: {
    bucket: string;
    path: string;
    sha256: string;
    url?: string | null;
    byteSize?: number | null;
  } | null;
  template: ContextTemplateDefinition;
  mapping: CsvMappingSuggestion;
  rows: CsvRow[];
  rowClassifications?: RowClassificationResult[];
  loadOrder?: number | null;
}

export interface EnterpriseContextRecordPromotionRow {
  client_id: string;
  tenant_key: string;
  canonical_record_id: string;
  record_type: string;
  record_subtype: string;
  title: string;
  source_system: string;
  source_record_id: string;
  source_file: string;
  source_row_number: number;
  owner: string | null;
  steward_owner: string | null;
  source_id?: string | null;
  source_file_id?: string | null;
  last_synced_at: string;
  last_validated_at: string | null;
  confidence: number | null;
  freshness_status: "fresh" | "attention" | "stale" | "unknown";
  evidence_pointer: string;
  lifecycle_state: "active" | "review";
  domain_segment: string | null;
  business_function: string | null;
  criticality: string | null;
  classification_source:
    | "AUTO_INFERRED"
    | "NEEDS_CLASSIFICATION"
    | "OPERATOR_CONFIRMED";
  dimension_family: ContextDimensionFamily;
  load_order: number | null;
  payload_hash: string;
  payload: Record<string, unknown>;
}

export interface EnterpriseContextFactPromotionDraft {
  canonical_record_id: string;
  fact_key: string;
  fact_type: string;
  fact_value: Record<string, unknown>;
  fact_text: string;
  source_system: string;
  source_record_id: string;
  source_file: string;
  source_row_number: number;
  owner: string | null;
  last_synced_at: string;
  last_validated_at: string | null;
  confidence: number | null;
  freshness_status: "fresh" | "attention" | "stale" | "unknown";
  evidence_pointer: string;
  lifecycle_state: "active";
  dimension_family: ContextDimensionFamily;
  domain_segment: string | null;
  value_hash: string;
}

const DEFAULT_ROW_CLASSIFICATION: RowClassificationResult = {
  domainSegment: null,
  businessFunction: null,
  criticality: null,
  classificationSource: "OPERATOR_CONFIRMED",
};

export interface EnterpriseContextFactPromotionRow extends Omit<
  EnterpriseContextFactPromotionDraft,
  "canonical_record_id"
> {
  client_id: string;
  tenant_key: string;
  record_id: string;
}

export interface AdminStructuredContextPromotionPlan {
  source: {
    id: string;
    client_id: string;
    tenant_key: string;
    source_system: string;
    source_key: string;
    source_type: string;
    display_name: string;
    system_of_record: boolean;
    source_owner: string | null;
    steward_owner: string | null;
    sync_cadence: string;
    tenant_aliases: string[];
    source_status: "active";
    last_synced_at: string;
    last_validated_at: string | null;
    confidence: number;
    freshness_status: "fresh";
    evidence_pointer: string;
    metadata: Record<string, unknown>;
  };
  sourceFile: {
    id: string;
    client_id: string;
    tenant_key: string;
    source_id: string;
    source_file_id: string;
    source_system: string;
    source_file: string;
    source_path: string;
    workbook_name: string | null;
    sheet_names: string[];
    file_hash: string;
    row_count: number;
    imported_by: string;
    last_synced_at: string;
    last_validated_at: string | null;
    confidence: number;
    freshness_status: "fresh";
    evidence_pointer: string;
    metadata: Record<string, unknown>;
    blob_container?: string | null;
    blob_object_key?: string | null;
    blob_url?: string | null;
    byte_size?: number | null;
  };
  records: EnterpriseContextRecordPromotionRow[];
  factDrafts: EnterpriseContextFactPromotionDraft[];
}

export interface AdminStructuredContextPromotionResult {
  status: "inserted" | "skipped_no_rows";
  recordsPromoted: number;
  factsPromoted: number;
  factsSuperseded: number;
  sourceFileId: string | null;
  detail: string;
}

const BUSINESS_METADATA_COLUMNS = new Set([
  "source_system",
  "source_record_id",
  "source_owner",
  "last_validated_date",
  "confidence",
  "evidence_usable",
  "notes_gaps",
]);

const SOURCE_SYSTEM = "admin_bulk_context_upload";

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "unknown"
  );
}

function hashJson(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function stableUuid(parts: string[]): string {
  const hex = crypto
    .createHash("sha256")
    .update(parts.join("\u0000"))
    .digest("hex");
  const version = `5${hex.slice(13, 16)}`;
  const variant = (Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80;
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    version,
    variant.toString(16).padStart(2, "0") + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join("-");
}

function normalizeScalar(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstNonEmpty(row: CsvRow, candidates: string[]): string | null {
  for (const key of candidates) {
    const value = row[key];
    if (nonEmpty(value)) return value.trim();
  }
  return null;
}

function rowNumber(index: number): number {
  return index + 2;
}

function sourceRecordIdFor(args: {
  row: CsvRow;
  mapping: CsvMappingSuggestion;
  fileName: string;
  rowIndex: number;
}): string {
  const mapped = args.mapping.sourceRecordIdColumn
    ? args.row[args.mapping.sourceRecordIdColumn]
    : null;
  const fallback = firstNonEmpty(args.row, [
    "source_record_id",
    "person_id",
    "app_id",
    "asset_id",
    "erp_object_id",
    "edge_id",
    "vendor_id",
    "contract_id",
    "initiative_id",
    "event_id",
    "capability_name",
    "segment",
    "metric",
    "data_product",
  ]);
  return nonEmpty(mapped)
    ? mapped.trim()
    : (fallback ??
        `${safeSlug(args.fileName)}-row-${rowNumber(args.rowIndex)}`);
}

function disambiguateDuplicateSourceRecordId(args: {
  sourceRecordId: string;
  duplicateSourceRecordIds: Set<string>;
  rowIndex: number;
}): string {
  if (!args.duplicateSourceRecordIds.has(args.sourceRecordId)) {
    return args.sourceRecordId;
  }
  return `${args.sourceRecordId}-row-${rowNumber(args.rowIndex)}`;
}

function titleFor(args: {
  row: CsvRow;
  mapping: CsvMappingSuggestion;
  fileName: string;
  sourceRecordId: string;
}): string {
  const mapped = args.mapping.titleColumn
    ? args.row[args.mapping.titleColumn]
    : null;
  return (
    (nonEmpty(mapped) ? mapped.trim() : null) ??
    firstNonEmpty(args.row, [
      "name",
      "title",
      "role",
      "asset_name",
      "platform",
      "vendor_name",
      "metric",
      "capability_name",
      "segment",
      "data_product",
      "finding",
    ]) ??
    `${args.fileName} ${args.sourceRecordId}`
  );
}

function trueDimension(
  template: ContextTemplateDefinition,
  fileName: string,
): ContextDimension {
  const lower = fileName.toLowerCase();
  if (lower.includes("infrastructure-estate")) return "infrastructure_estate";
  if (lower.includes("data-platform-lineage")) return "data_platform_lineage";
  if (lower.includes("business-capability-map")) return "business_capability";
  if (lower.includes("risks-controls")) return "regulatory_qms_risk";
  return template.dimension;
}

function recordTypeFor(args: {
  dimension: ContextDimension;
  row: CsvRow;
  fileName: string;
}): string {
  if (args.dimension === "org_roles_teams") return "org_role";
  if (args.dimension === "enterprise_profile") return "enterprise_profile";
  if (args.dimension === "business_units_segment_pnl") return "business_unit";
  if (args.dimension === "financial_kpis") return "kpi_metric";
  if (args.dimension === "vendor_contracts") return "contract";
  if (args.dimension === "transformation_initiatives") return "initiative";
  if (args.dimension === "service_levels") return "service_level";
  if (args.dimension === "integration_topology") return "integration";
  if (args.dimension === "data_platform_lineage") return "data_asset";
  if (args.dimension === "business_capability") return "business_capability";
  if (args.dimension === "regulatory_qms_risk") return "risk";
  if (args.dimension === "infrastructure_estate") {
    const assetClass = String(args.row.asset_class ?? "").toLowerCase();
    if (assetClass.includes("datacenter") || assetClass.includes("site")) {
      return "facility";
    }
    return "configuration_item";
  }
  if (
    args.dimension === "erp_landscape" ||
    args.dimension === "application_portfolio"
  ) {
    return "cmdb_application";
  }
  return safeSlug(args.dimension).replace(/-/g, "_");
}

function ownerFor(
  row: CsvRow,
  template: ContextTemplateDefinition,
): string | null {
  return (
    firstNonEmpty(row, [
      "owner",
      "owner_role",
      "sponsor_role",
      "control_owner",
      "source_owner",
    ]) ??
    template.ownerRole ??
    null
  );
}

function confidenceFor(row: CsvRow): number | null {
  const value = Number.parseFloat(String(row.confidence ?? ""));
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function lastValidatedFor(row: CsvRow, uploadedAt: string): string | null {
  const raw = row.last_validated_date;
  if (nonEmpty(raw) && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim()))
    return raw.trim();
  return uploadedAt.slice(0, 10);
}

function sourceFileIdFor(tenantKey: string, fileName: string): string {
  return `admin-upload:${safeSlug(tenantKey)}:${safeSlug(fileName)}`;
}

function sourcePathBaseFor(input: {
  tenantKey: string;
  fileName: string;
  sourcePathBase?: string | null;
}): string {
  return (
    input.sourcePathBase ??
    `csv-upload://${input.tenantKey}/${encodeURIComponent(input.fileName)}`
  );
}

function evidencePointer(sourcePathBase: string, row: number): string {
  return `${sourcePathBase}#row=${row}`;
}

function canonicalizedRow(row: CsvRow, mapping: CsvMappingSuggestion): CsvRow {
  const canonical = { ...row };
  for (const [field, sourceColumn] of Object.entries(mapping.fieldMappings)) {
    const value = row[sourceColumn];
    if (nonEmpty(value)) canonical[field] = value;
  }
  return canonical;
}

function factColumns(row: CsvRow, mapping: CsvMappingSuggestion): string[] {
  const mappedSourceColumns = new Set(Object.values(mapping.fieldMappings));
  return Object.keys(row).filter((column) => {
    if (!nonEmpty(row[column])) return false;
    if (mapping.fieldMappings[column]) return true;
    return !mappedSourceColumns.has(column);
  });
}

export function buildAdminStructuredContextPromotionPlan(
  input: AdminStructuredContextPromotionInput,
): AdminStructuredContextPromotionPlan {
  const sourceFileId = sourceFileIdFor(input.tenantKey, input.fileName);
  const sourceBase = sourcePathBaseFor(input);
  const fileHash =
    input.sourceFileHash ??
    hashJson({
      fileName: input.fileName,
      uploadId: input.uploadId,
      rows: input.rows.length,
    });
  const dimension = trueDimension(input.template, input.fileName);
  const dimensionFamily =
    DIMENSION_FAMILY_MAP[dimension as ContextDimensionUniversal];
  const sourceId = stableUuid([
    "enterprise_context_sources",
    input.tenantKey,
    SOURCE_SYSTEM,
    sourceFileId,
  ]);
  const sourceFileRowId = stableUuid([
    "enterprise_context_source_files",
    input.tenantKey,
    sourceFileId,
  ]);
  const sourceRecordIds = input.rows.map((row, index) =>
    sourceRecordIdFor({
      row,
      mapping: input.mapping,
      fileName: input.fileName,
      rowIndex: index,
    }),
  );
  const duplicateSourceRecordIds = new Set(
    sourceRecordIds.filter(
      (sourceRecordId, index) =>
        sourceRecordIds.indexOf(sourceRecordId) !== index,
    ),
  );
  const records: EnterpriseContextRecordPromotionRow[] = [];
  const factDrafts: EnterpriseContextFactPromotionDraft[] = [];

  input.rows.forEach((row, index) => {
    const promotedRow = canonicalizedRow(row, input.mapping);
    const sourceRow = rowNumber(index);
    const rowSourceRecordId = disambiguateDuplicateSourceRecordId({
      sourceRecordId: sourceRecordIds[index]!,
      duplicateSourceRecordIds,
      rowIndex: index,
    });
    const canonicalRecordId = `${sourceFileId}:${safeSlug(rowSourceRecordId)}`;
    const title = titleFor({
      row,
      mapping: input.mapping,
      fileName: input.fileName,
      sourceRecordId: rowSourceRecordId,
    });
    const owner = ownerFor(row, input.template);
    const confidence = confidenceFor(row);
    const lastValidatedAt = lastValidatedFor(row, input.uploadedAt);
    const pointer = evidencePointer(sourceBase, sourceRow);
    const recordType = recordTypeFor({
      dimension,
      row,
      fileName: input.fileName,
    });
    const classification =
      input.rowClassifications?.[index] ?? DEFAULT_ROW_CLASSIFICATION;
    const lifecycleState =
      classification.classificationSource === "NEEDS_CLASSIFICATION"
        ? "review"
        : "active";
    const sourceRecordId = `${sourceFileId}:${rowSourceRecordId}`;
    const payload = {
      ...promotedRow,
      _abarva: {
        loader: "admin_structured_context_promotion",
        source_state: "synthetic_admin_loader_backed",
        upload_id: input.uploadId,
        template_id: input.template.id,
        declared_dimension: input.template.dimension,
        promoted_dimension: dimension,
        dimension_family: dimensionFamily,
        source_file_id: sourceFileId,
        source_row_number: sourceRow,
        field_mappings: input.mapping.fieldMappings,
        classification_source: classification.classificationSource,
      },
    };

    records.push({
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      canonical_record_id: canonicalRecordId,
      record_type: recordType,
      record_subtype: input.template.id,
      title,
      source_system: SOURCE_SYSTEM,
      source_record_id: sourceRecordId,
      source_file: input.fileName,
      source_row_number: sourceRow,
      owner,
      steward_owner: input.uploadedBy,
      source_id: null,
      source_file_id: null,
      last_synced_at: input.uploadedAt,
      last_validated_at: lastValidatedAt,
      confidence,
      freshness_status: "fresh",
      evidence_pointer: pointer,
      lifecycle_state: lifecycleState,
      domain_segment: classification.domainSegment,
      business_function: classification.businessFunction,
      criticality: classification.criticality,
      classification_source: classification.classificationSource,
      dimension_family: dimensionFamily,
      load_order: input.loadOrder ?? null,
      payload_hash: hashJson(payload),
      payload,
    });

    if (lifecycleState !== "active") return;

    for (const column of factColumns(promotedRow, input.mapping)) {
      const rawValue = promotedRow[column]!.trim();
      const normalizedValue = normalizeScalar(rawValue);
      const factType = BUSINESS_METADATA_COLUMNS.has(column)
        ? `provenance.${column}`
        : `${recordType}.${column}`;
      const valuePayload = {
        value: normalizedValue,
        raw: rawValue,
        column,
        source_state: "synthetic_admin_loader_backed",
      };
      const factKey = `${canonicalRecordId}:${safeSlug(column)}`;
      const valueHash = hashJson({ factKey, valuePayload });
      factDrafts.push({
        canonical_record_id: canonicalRecordId,
        fact_key: factKey,
        fact_type: factType,
        fact_value: valuePayload,
        fact_text: `${title} — ${column}: ${rawValue}`,
        source_system: SOURCE_SYSTEM,
        source_record_id: sourceRecordId,
        source_file: input.fileName,
        source_row_number: sourceRow,
        owner,
        last_synced_at: input.uploadedAt,
        last_validated_at: lastValidatedAt,
        confidence,
        freshness_status: "fresh",
        evidence_pointer: pointer,
        lifecycle_state: "active",
        dimension_family: dimensionFamily,
        domain_segment: classification.domainSegment,
        value_hash: valueHash,
      });
    }
  });

  return {
    source: {
      id: sourceId,
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      source_system: SOURCE_SYSTEM,
      source_key: sourceFileId,
      source_type: "admin_structured_upload",
      display_name: `Admin structured upload: ${input.fileName}`,
      system_of_record: false,
      source_owner: input.uploadedBy,
      steward_owner: input.uploadedBy,
      sync_cadence: "manual",
      tenant_aliases: [input.tenantKey],
      source_status: "active",
      last_synced_at: input.uploadedAt,
      last_validated_at: input.uploadedAt.slice(0, 10),
      confidence: 0.86,
      freshness_status: "fresh",
      evidence_pointer: sourceBase,
      metadata: {
        loader: "admin_structured_context_promotion",
        upload_id: input.uploadId,
        template_id: input.template.id,
        declared_dimension: input.template.dimension,
        promoted_dimension: dimension,
        dimension_family: dimensionFamily,
        source_state: "synthetic_admin_loader_backed",
      },
    },
    sourceFile: {
      id: sourceFileRowId,
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      source_id: sourceId,
      source_file_id: sourceFileId,
      source_system: SOURCE_SYSTEM,
      source_file: input.fileName,
      source_path: sourceBase,
      workbook_name: null,
      sheet_names: [],
      file_hash: fileHash,
      row_count: input.rows.length,
      imported_by: input.uploadedBy,
      last_synced_at: input.uploadedAt,
      last_validated_at: input.uploadedAt.slice(0, 10),
      confidence: 0.86,
      freshness_status: "fresh",
      evidence_pointer: sourceBase,
      metadata: {
        loader: "admin_structured_context_promotion",
        upload_id: input.uploadId,
        template_id: input.template.id,
        declared_dimension: input.template.dimension,
        promoted_dimension: dimension,
        dimension_family: dimensionFamily,
        source_state: "synthetic_admin_loader_backed",
      },
      blob_container: input.sourceBlob?.bucket ?? null,
      blob_object_key: input.sourceBlob?.path ?? null,
      blob_url:
        input.sourceBlob?.url ??
        (input.sourceBlob
          ? `azure-blob://${input.sourceBlob.bucket}/${input.sourceBlob.path}`
          : null),
      byte_size: input.sourceBlob?.byteSize ?? null,
    },
    records,
    factDrafts,
  };
}

async function throwOnError<T>(
  label: string,
  result: {
    data: T | null;
    error: { message: string } | null;
  },
): Promise<T | null> {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function fetchRecordIdMap(
  db: PostgresCompatClient,
  tenantKey: string,
  canonicalRecordIds: string[],
): Promise<Map<string, string>> {
  if (canonicalRecordIds.length === 0) return new Map();
  const result = await db
    .from("enterprise_context_records")
    .select("id,canonical_record_id")
    .eq("tenant_key", tenantKey)
    .in("canonical_record_id", canonicalRecordIds);
  const rows =
    (await throwOnError<Array<{ id: string; canonical_record_id: string }>>(
      "enterprise_context_records id map",
      result,
    )) ?? [];
  return new Map(rows.map((row) => [row.canonical_record_id, row.id]));
}

export async function promoteAdminStructuredRowsToEnterpriseContext(
  input: AdminStructuredContextPromotionInput & { db?: PostgresCompatClient },
): Promise<AdminStructuredContextPromotionResult> {
  if (input.rows.length === 0) {
    return {
      status: "skipped_no_rows",
      recordsPromoted: 0,
      factsPromoted: 0,
      factsSuperseded: 0,
      sourceFileId: null,
      detail:
        "No structured rows were available for enterprise context promotion.",
    };
  }

  const db = input.db ?? getAzureWriteFluentClient();
  const plan = buildAdminStructuredContextPromotionPlan(input);

  const sourceRows =
    (await throwOnError<Array<{ id: string }>>(
      "enterprise_context_sources upsert",
      await db
        .from("enterprise_context_sources")
        .upsert(plan.source, {
          onConflict: "tenant_key,source_system,source_key",
        })
        .select("id"),
    )) ?? [];
  const sourceId = sourceRows[0]?.id ?? null;

  const sourceFileRows =
    (await throwOnError<Array<{ id: string }>>(
      "enterprise_context_source_files upsert",
      await db
        .from("enterprise_context_source_files")
        .upsert(plan.sourceFile, { onConflict: "tenant_key,source_file_id" })
        .select("id"),
    )) ?? [];
  const sourceFileId = sourceFileRows[0]?.id ?? null;
  const recordsWithSourceLineage = plan.records.map((record) => ({
    ...record,
    source_id: sourceId,
    source_file_id: sourceFileId,
  }));

  for (let index = 0; index < recordsWithSourceLineage.length; index += 100) {
    await throwOnError(
      "enterprise_context_records upsert",
      await db
        .from("enterprise_context_records")
        .upsert(recordsWithSourceLineage.slice(index, index + 100), {
          onConflict: "tenant_key,canonical_record_id",
        })
        .select("id"),
    );
  }

  const idMap = await fetchRecordIdMap(
    db,
    input.tenantKey,
    plan.records.map((record) => record.canonical_record_id),
  );
  const factRows: EnterpriseContextFactPromotionRow[] = plan.factDrafts.flatMap(
    (fact) => {
      const recordId = idMap.get(fact.canonical_record_id);
      if (!recordId) return [];
      const { canonical_record_id: _canonicalRecordId, ...row } = fact;
      void _canonicalRecordId;
      return [
        {
          ...row,
          client_id: input.clientId,
          tenant_key: input.tenantKey,
          record_id: recordId,
        },
      ];
    },
  );

  // WS-B: supersede any currently-active fact for the incoming logical fact
  // keys BEFORE inserting the new values, so a CHANGED value updates the logical
  // fact (exactly one active row per fact_key) instead of leaving a duplicate
  // active row. The upsert below then revives-or-inserts the incoming value as
  // the single active row; a partial unique index on active facts enforces this
  // at the DB level (see the WS-B migration). Identical re-upload is a no-op
  // (the same value_hash row is revived). Live replay is validated on ACA.
  const incomingFactKeys = Array.from(
    new Set(
      factRows.map((row) => String((row as { fact_key: string }).fact_key)),
    ),
  );
  let factsSuperseded = 0;
  for (let index = 0; index < incomingFactKeys.length; index += 200) {
    const supersededRows = await throwOnError<Array<{ id: string }>>(
      "enterprise_context_facts supersede",
      await db
        .from("enterprise_context_facts")
        .update({ lifecycle_state: "superseded", updated_at: input.uploadedAt })
        .eq("tenant_key", input.tenantKey)
        .eq("lifecycle_state", "active")
        .in("fact_key", incomingFactKeys.slice(index, index + 200))
        .select("id"),
    );
    factsSuperseded += supersededRows?.length ?? 0;
  }

  for (let index = 0; index < factRows.length; index += 250) {
    await throwOnError(
      "enterprise_context_facts upsert",
      await db
        .from("enterprise_context_facts")
        .upsert(factRows.slice(index, index + 250), {
          onConflict: "tenant_key,record_id,fact_key,value_hash",
        })
        .select("id"),
    );
  }

  return {
    status: "inserted",
    recordsPromoted: plan.records.length,
    factsPromoted: factRows.length,
    factsSuperseded,
    sourceFileId: plan.sourceFile.source_file_id,
    detail:
      "Structured Admin upload rows were promoted into enterprise_context_records and enterprise_context_facts with source-row provenance.",
  };
}
