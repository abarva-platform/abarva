import "server-only";

import crypto from "node:crypto";

import Papa from "papaparse";

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";
import {
  recordEvidence,
  type RecordEvidenceInput,
} from "@/lib/evidence/ledger";

import {
  promoteAdminStructuredRowsToEnterpriseContext,
  type AdminStructuredContextPromotionResult,
} from "./admin-structured-context-promotion";
import { proposeCsvColumnMapping } from "./csv-column-mapping";
import { classifyUploadedFile } from "./file-classifier";
import { computeStableChunkId } from "./fact-identity";
import { buildPHSEvidenceLedgerInputs } from "./phs-evidence-ledger-binding";
import {
  getTemplateById,
  getTemplateForDimension,
  type ContextTemplateDefinition,
} from "./template-registry";
import {
  inferDomainSegment,
  VALID_BUSINESS_FUNCTIONS,
  VALID_DOMAIN_SEGMENTS,
} from "./validation-engine";
import type { ContextDimension } from "./types";
import type { PilotUploadAttestation } from "./upload-attestation";
import type { SegmentKey } from "@/lib/ingestion/azure-landing-zone-types";

type CsvRow = Record<string, string>;

export interface CsvSchemaMapping {
  templateId?: string;
  sourceRecordIdColumn?: string | null;
  titleColumn?: string | null;
  textColumns?: string[];
  fieldMappings?: Record<string, string>;
  dataClassification?: string | null;
}

export interface CsvUploadInput {
  clientId: string;
  tenantKey: string;
  fileName: string;
  csvText: string;
  uploadedBy: string;
  sourceBlob?: {
    bucket: string;
    path: string;
    sha256: string;
    url?: string | null;
    byteSize?: number | null;
  } | null;
  mapping?: CsvSchemaMapping;
  attestation?: PilotUploadAttestation;
  uploadedAt?: string;
  db?: PostgresCompatClient;
  recordEvidenceFn?: (input: RecordEvidenceInput) => Promise<string>;
  classificationOverrides?: {
    domainSegment?: string;
    businessFunction?: string;
    criticality?: string;
  };
  loadOrder?: number | null;
}

export interface CsvParseResult {
  headers: string[];
  rows: CsvRow[];
}

export type ClassificationSource =
  | "OPERATOR_CONFIRMED"
  | "AUTO_INFERRED"
  | "NEEDS_CLASSIFICATION";

export interface RowClassificationResult {
  domainSegment: string | null;
  businessFunction: string | null;
  criticality: string | null;
  classificationSource: ClassificationSource;
}

export type StructuredUploadFormat = "csv" | "json" | "jsonl" | "yaml";

export interface CsvMappingSuggestion {
  templateId: string;
  dimension: ContextDimension;
  sourceRecordIdColumn: string | null;
  titleColumn: string | null;
  textColumns: string[];
  fieldMappings: Record<string, string>;
}

export interface PreparedCsvContextChunk {
  client_id: string;
  tenant_key: string;
  chunk_id: string;
  source_system: string;
  source_segment_id: string;
  source_record_id: string;
  source_doc: string;
  source_path: string;
  chunk_index: number;
  chunk_text: string;
  token_count: number;
  embedding_status: "pending";
  embedding_model: null;
  embedding_error: null;
  lifecycle_state: "active";
  load_batch_id: string;
  provenance: Record<string, unknown>;
  chunk_metadata: Record<string, unknown>;
}

export interface CsvUploadPreparedBatch {
  uploadId: string;
  fileHash: string;
  template: ContextTemplateDefinition;
  mapping: CsvMappingSuggestion;
  headers: string[];
  rowsParsed: number;
  chunks: PreparedCsvContextChunk[];
  embeddingHandoff: {
    status: "pending_embed_job";
    command: string;
    searchableWhen: string;
  };
}

export interface CsvUploadLoadResult extends Omit<
  CsvUploadPreparedBatch,
  "chunks"
> {
  chunksQueued: number;
  needsClassificationCount: number;
  autoInferredCount: number;
  evidenceLedger: {
    status: "not_applicable" | "inserted";
    rowsRecorded: number;
    evidenceIds: string[];
    detail: string;
  };
  enterpriseContextPromotion: AdminStructuredContextPromotionResult;
  persistence: {
    status: "inserted" | "skipped_no_database_url";
    chunkRowsInserted: number;
    ingestionRunRecorded: boolean;
    detail: string;
  };
}

const MAX_ROWS = 50_000;
const MAX_TEXT_COLUMNS = 12;

const SEGMENT_BY_DIMENSION: Partial<Record<ContextDimension, string>> = {
  enterprise_profile: 'enterprise_profile',
  financial_kpis: 'it_financials',
  annual_quarterly_reports: 'enterprise_profile',
  market_competitor_intel: 'program_inventory',
  c_suite_strategy: 'enterprise_profile',
  business_units_segment_pnl: 'it_financials',
  product_portfolio: 'program_inventory',
  manufacturing_sites: 'it_landscape',
  erp_landscape: 'it_landscape',
  application_portfolio: 'it_landscape',
  ehr_platform: 'it_landscape',
  integration_topology: 'it_landscape',
  interoperability_topology: 'it_landscape',
  prior_authorization: 'program_inventory',
  revenue_cycle_denials: 'it_financials',
  ambient_clinical_documentation: 'program_inventory',
  clinical_ai_model_inventory: 'it_landscape',
  hipaa_ai_controls: 'it_landscape',
  vendor_baa_contracts: 'it_financials',
  service_line_pnl: 'it_financials',
  workforce_scheduling: 'org_structure',
  patient_access: 'program_inventory',
  imaging_ai_triage: 'program_inventory',
  cms_interoperability: 'program_inventory',
  vendor_contracts: 'it_financials',
  transformation_initiatives: 'program_inventory',
  org_roles_teams: 'org_structure',
  delivery_dora_devex: 'program_inventory',
  regulatory_qms_risk: 'program_inventory',
  value_based_care: 'program_inventory',
  population_health: 'program_inventory',
  data_platform_lineage: 'it_landscape',
  digital_front_door: 'it_landscape',
  supply_chain_pharmacy: 'it_financials',
  ai_governance_decisions: 'program_inventory',
  clinical_downtime_cyber: 'it_landscape',
  nursing_workload_acuity: 'org_structure',
  ai_tooling_model_inventory: 'it_landscape',
  incidents_ops_telemetry: 'it_landscape',
};

export function segmentKeyForContextDimension(
  dimension: ContextDimension,
): SegmentKey {
  return SEGMENT_BY_DIMENSION[dimension];
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "csv"
  );
}

function compactTimestamp(value: string): string {
  return value.replace(/[^0-9a-z]/gi, "").slice(0, 15);
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function sourcePathBase(
  input: Pick<CsvUploadInput, "tenantKey" | "fileName" | "sourceBlob">,
): string {
  if (input.sourceBlob) {
    return `azure-blob://${input.sourceBlob.bucket}/${input.sourceBlob.path}`;
  }
  return `csv-upload://${input.tenantKey}/${encodeURIComponent(input.fileName)}`;
}

function findHeader(headers: string[], candidates: string[]): string | null {
  const byNormalized = new Map(
    headers.map((header) => [normalizeHeader(header), header]),
  );
  for (const candidate of candidates) {
    const found = byNormalized.get(normalizeHeader(candidate));
    if (found) return found;
  }
  return null;
}

function resolveTemplate(
  fileName: string,
  templateId?: string | null,
  tenantKey?: string | null,
): ContextTemplateDefinition {
  const explicit = templateId ? getTemplateById(templateId, { tenantKey }) : null;
  if (explicit) return explicit;
  const classification = classifyUploadedFile({ fileName, text: '' });
  return getTemplateForDimension(classification.dimension, { tenantKey })
    ?? getTemplateById('application-portfolio', { tenantKey })!;
}

function parseJsonObject(raw: unknown): Record<string, string> | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return undefined;
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string" && value.trim() !== "")
        .map(([key, value]) => [key, String(value).trim()]),
    );
  } catch {
    return undefined;
  }
}

export function parseCsvUpload(csvText: string): CsvParseResult {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });
  const errors = parsed.errors.filter((error) => error.code !== "TooFewFields");
  if (errors.length > 0) {
    throw new Error(`csv_parse_failed: ${errors[0]?.message ?? "invalid CSV"}`);
  }
  const headers = (parsed.meta.fields ?? []).filter(
    (header) => header.trim() !== "",
  );
  if (headers.length === 0) throw new Error("csv_missing_headers");
  const rows = (parsed.data ?? []).filter((row) =>
    headers.some((header) => String(row[header] ?? "").trim() !== ""),
  );
  if (rows.length === 0) throw new Error("csv_missing_rows");
  if (rows.length > MAX_ROWS)
    throw new Error(`csv_too_many_rows: max ${MAX_ROWS}`);
  return { headers, rows };
}

function normalizeScalar(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

function rowsFromJsonValue(value: unknown): CsvRow[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .map((item) =>
        Object.fromEntries(
          Object.entries(item).map(([key, cell]) => [
            key,
            normalizeScalar(cell),
          ]),
        ),
      );
  }
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  const arrayEntries = Object.entries(object).filter(([, cell]) =>
    Array.isArray(cell),
  );
  if (arrayEntries.length === 1) return rowsFromJsonValue(arrayEntries[0]![1]);
  if (arrayEntries.length > 1) {
    return arrayEntries.flatMap(([path, cell]) =>
      rowsFromJsonValue(cell).map((row) => ({ _record_path: path, ...row })),
    );
  }
  return [
    Object.fromEntries(
      Object.entries(object).map(([key, cell]) => [key, normalizeScalar(cell)]),
    ),
  ];
}

function parseJsonUpload(jsonText: string): CsvParseResult {
  const rows = rowsFromJsonValue(JSON.parse(jsonText) as unknown);
  if (rows.length === 0) throw new Error("csv_missing_rows");
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (headers.length === 0) throw new Error("csv_missing_headers");
  return { headers, rows };
}

function parseJsonlUpload(jsonlText: string): CsvParseResult {
  const rows = jsonlText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown)
    .flatMap(rowsFromJsonValue);
  if (rows.length === 0) throw new Error("csv_missing_rows");
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (headers.length === 0) throw new Error("csv_missing_headers");
  return { headers, rows };
}

function parseYamlScalar(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseYamlUpload(yamlText: string): CsvParseResult {
  const rows: CsvRow[] = [];
  let current: CsvRow | null = null;
  for (const rawLine of yamlText.split(/\r?\n/)) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (
      withoutComment.trim() === "" ||
      /^[A-Za-z0-9_-]+:\s*$/.test(withoutComment.trim())
    )
      continue;
    const itemMatch = withoutComment.match(/^\s*-\s+([^:]+):\s*(.*)$/);
    if (itemMatch) {
      if (current) rows.push(current);
      current = { [itemMatch[1]!.trim()]: parseYamlScalar(itemMatch[2] ?? "") };
      continue;
    }
    const fieldMatch = withoutComment.match(/^\s+([^:]+):\s*(.*)$/);
    if (fieldMatch && current) {
      current[fieldMatch[1]!.trim()] = parseYamlScalar(fieldMatch[2] ?? "");
    }
  }
  if (current) rows.push(current);
  if (rows.length === 0) throw new Error("csv_missing_rows");
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (headers.length === 0) throw new Error("csv_missing_headers");
  return { headers, rows };
}

export function detectStructuredUploadFormat(
  fileName: string,
): StructuredUploadFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".jsonl")) return "jsonl";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  return null;
}

export function parseStructuredUpload(
  text: string,
  fileName: string,
): CsvParseResult {
  const format = detectStructuredUploadFormat(fileName);
  if (format === "csv") return parseCsvUpload(text);
  if (format === "json") return parseJsonUpload(text);
  if (format === "jsonl") return parseJsonlUpload(text);
  if (format === "yaml") return parseYamlUpload(text);
  throw new Error("csv_unsupported_file_type");
}

export function inferCsvSchemaMapping(args: {
  headers: string[];
  fileName: string;
  templateId?: string | null;
  tenantKey?: string | null;
  mapping?: CsvSchemaMapping;
}): CsvMappingSuggestion {
  const template = resolveTemplate(args.fileName, args.templateId ?? args.mapping?.templateId, args.tenantKey);
  const fieldMappings: Record<string, string> = {};
  const providedFieldMappings = args.mapping?.fieldMappings ?? {};
  const proposed = proposeCsvColumnMapping({ headers: args.headers, template });

  for (const field of [
    ...template.requiredFields,
    ...template.optionalFields,
  ]) {
    const provided = providedFieldMappings[field];
    if (provided && args.headers.includes(provided)) {
      fieldMappings[field] = provided;
      continue;
    }
    const exact = findHeader(args.headers, [field]);
    if (exact) fieldMappings[field] = exact;
    const inferred = proposed.fieldMappings[field];
    if (inferred) fieldMappings[field] = inferred;
  }

  const sourceRecordIdColumn =
    args.mapping?.sourceRecordIdColumn &&
    args.headers.includes(args.mapping.sourceRecordIdColumn)
      ? args.mapping.sourceRecordIdColumn
      : (proposed.sourceRecordIdColumn ??
        findHeader(args.headers, [
          ...template.requiredFields.filter((field) => /(^|_)id$/.test(field)),
          "id",
          "record_id",
          "source_record_id",
          "app_id",
          "vendor_id",
          "initiative_id",
          "tool_id",
        ]));

  const titleColumn =
    args.mapping?.titleColumn && args.headers.includes(args.mapping.titleColumn)
      ? args.mapping.titleColumn
      : (proposed.titleColumn ??
        findHeader(args.headers, [
          "title",
          "name",
          "vendor_name",
          "tool_name",
          "metric",
          "priority",
        ]));

  const providedTextColumns =
    args.mapping?.textColumns?.filter((header) =>
      args.headers.includes(header),
    ) ?? [];
  const mappedColumns = [...new Set(Object.values(fieldMappings))];
  const textColumns = (
    providedTextColumns.length > 0
      ? providedTextColumns
      : proposed.textColumns.length > 0
        ? proposed.textColumns
        : [
            ...mappedColumns,
            ...args.headers.filter((header) => !mappedColumns.includes(header)),
          ]
  ).slice(0, MAX_TEXT_COLUMNS);

  return {
    templateId: template.id,
    dimension: template.dimension,
    sourceRecordIdColumn,
    titleColumn,
    textColumns,
    fieldMappings,
  };
}

function buildChunkText(args: {
  template: ContextTemplateDefinition;
  mapping: CsvMappingSuggestion;
  row: CsvRow;
  rowNumber: number;
}): string {
  const lines = [`Template: ${args.template.label}`, `Row: ${args.rowNumber}`];
  if (args.mapping.titleColumn) {
    const title = args.row[args.mapping.titleColumn];
    if (title) lines.push(`Title: ${title}`);
  }
  for (const [field, column] of Object.entries(args.mapping.fieldMappings)) {
    const value = args.row[column];
    if (value) lines.push(`${field}: ${value}`);
  }
  for (const column of args.mapping.textColumns) {
    if (Object.values(args.mapping.fieldMappings).includes(column)) continue;
    const value = args.row[column];
    if (value) lines.push(`${column}: ${value}`);
  }
  return lines.join("\n");
}

export function prepareCsvUploadForTenantContext(input: CsvUploadInput): CsvUploadPreparedBatch {
  const parsed = parseCsvUpload(input.csvText);
  const template = resolveTemplate(input.fileName, input.mapping?.templateId, input.tenantKey);
  const mapping = inferCsvSchemaMapping({
    headers: parsed.headers,
    fileName: input.fileName,
    templateId: template.id,
    tenantKey: input.tenantKey,
    mapping: input.mapping,
  });
  assertRequiredFieldsMapped(template, mapping);
  const uploadedAt = input.uploadedAt ?? new Date().toISOString();
  const fileHash = crypto
    .createHash("sha256")
    .update(input.csvText)
    .digest("hex");
  const uploadId = [
    "csv",
    safeSlug(input.tenantKey),
    safeSlug(input.fileName),
    fileHash.slice(0, 12),
    compactTimestamp(uploadedAt),
  ].join(':');
  const sourceSegmentId = SEGMENT_BY_DIMENSION[template.dimension] ?? 'program_inventory';

  const chunks = parsed.rows.map((row, index): PreparedCsvContextChunk => {
    const rowNumber = index + 2;
    const mappedRecordId = mapping.sourceRecordIdColumn
      ? row[mapping.sourceRecordIdColumn]
      : "";
    const sourceRecordId = mappedRecordId?.trim() || `row-${rowNumber}`;
    // WS-B: content+location-stable chunk id (NOT the per-upload uploadId), so a
    // re-upload of the same logical row upserts the same chunk instead of
    // inserting a fresh duplicate set every time. See fact-identity.ts.
    const chunkId = computeStableChunkId({
      tenantKey: input.tenantKey,
      sourceSegmentId,
      sourceRecordId,
      chunkIndex: index,
    });
    const chunkText = buildChunkText({ template, mapping, row, rowNumber });
    return {
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      chunk_id: chunkId,
      source_system: sourceSystem,
      source_segment_id: sourceSegmentId,
      source_record_id: sourceRecordId,
      source_doc: input.fileName,
      source_path: `${sourceBase}#row=${rowNumber}`,
      chunk_index: index,
      chunk_text: chunkText,
      token_count: estimateTokens(chunkText),
      embedding_status: "pending",
      embedding_model: null,
      embedding_error: null,
      lifecycle_state: "active",
      load_batch_id: uploadId,
      provenance: {
        loader: "c5-csv-upload-connector",
        upload_id: uploadId,
        tenant_key: input.tenantKey,
        client_id: input.clientId,
        source_doc: input.fileName,
        source_path: sourceBase,
        source_basis: sourceBasis,
        source_citation: `${sourceBase}#row=${rowNumber}`,
        source_row: rowNumber,
        uploaded_by: input.uploadedBy,
        uploaded_at: uploadedAt,
        data_classification: dataClassification,
        classification: dataClassification,
        confidence: 0.86,
        lifecycle_state: "active",
        source_blob: input.sourceBlob ?? null,
        schema_mapping: mapping,
        upload_attestation: input.attestation ?? null,
      },
      chunk_metadata: {
        record_kind: "csv_upload_row",
        template_id: template.id,
        context_dimension: template.dimension,
        source_record_id: sourceRecordId,
        source_basis: sourceBasis,
        source_citation: `${sourceBase}#row=${rowNumber}`,
        classification: dataClassification,
        sensitivity: dataClassification,
        confidence: 0.86,
        lifecycle_state: "active",
        source_blob: input.sourceBlob ?? null,
        load_batch_id: uploadId,
        title: mapping.titleColumn ? row[mapping.titleColumn] : null,
        csv_headers: parsed.headers,
      },
    };
  });

  return {
    uploadId,
    fileHash,
    template,
    mapping,
    headers: parsed.headers,
    rowsParsed: parsed.rows.length,
    chunks,
    embeddingHandoff: {
      status: "pending_embed_job",
      command: `npm run embed:pending-chunks -- --tenant ${input.tenantKey}`,
      searchableWhen:
        "after the pending chunk embedding worker marks these rows embedded and upserts vectors",
    },
  };
}

function databaseConfigured(): boolean {
  return Boolean(
    process.env.ABARVA_AZURE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim(),
  );
}

/**
 * Resolves classification fields for a single CSV row.
 * Priority order:
 *  1. classificationOverrides from the caller (OPERATOR_CONFIRMED)
 *  2. Explicit columns in the row data if valid (OPERATOR_CONFIRMED)
 *  3. Auto-inference from vendor/system name (AUTO_INFERRED when high confidence)
 *  4. NEEDS_CLASSIFICATION otherwise
 */
function resolveRowClassification(
  row: CsvRow,
  classificationOverrides?: CsvUploadInput["classificationOverrides"],
): RowClassificationResult {
  const normalizeCriticality = (value?: string | null): string | null => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const upper = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    if (["TIER_1", "TIER_2", "TIER_3"].includes(upper)) return upper;
    if (["CRITICAL", "HIGH"].includes(upper)) return "TIER_1";
    if (["IMPORTANT", "MEDIUM", "MODERATE"].includes(upper)) return "TIER_2";
    if (["LOW", "NON_CRITICAL"].includes(upper)) return "TIER_3";
    return null;
  };
  const normalizeBusinessFunction = (value?: string | null): string | null => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    return VALID_BUSINESS_FUNCTIONS.has(trimmed) ? trimmed : null;
  };
  // If the caller provides overrides, they win unconditionally.
  if (
    classificationOverrides?.domainSegment ||
    classificationOverrides?.businessFunction ||
    classificationOverrides?.criticality
  ) {
    return {
      domainSegment: classificationOverrides.domainSegment ?? null,
      businessFunction: normalizeBusinessFunction(
        classificationOverrides.businessFunction,
      ),
      criticality: normalizeCriticality(classificationOverrides.criticality),
      classificationSource: "OPERATOR_CONFIRMED",
    };
  }

  // Check for explicit columns in the row.
  const rowDomainSegment = (row["domain_segment"] ?? "").trim();
  const rowBusinessFunction = (row["business_function"] ?? "").trim();
  const rowCriticality = (row["criticality"] ?? "").trim();

  if (rowDomainSegment && VALID_DOMAIN_SEGMENTS.has(rowDomainSegment)) {
    return {
      domainSegment: rowDomainSegment,
      businessFunction: normalizeBusinessFunction(rowBusinessFunction),
      criticality: normalizeCriticality(rowCriticality),
      classificationSource: "OPERATOR_CONFIRMED",
    };
  }

  // Try auto-inference from vendor_name or system_name columns.
  const nameHint = (
    row["vendor_name"] ??
    row["system_name"] ??
    row["name"] ??
    ""
  ).trim();
  const inferred = inferDomainSegment(nameHint);
  if (inferred.confidence === "high" && inferred.segment) {
    return {
      domainSegment: inferred.segment,
      businessFunction: normalizeBusinessFunction(rowBusinessFunction),
      criticality: normalizeCriticality(rowCriticality),
      classificationSource: "AUTO_INFERRED",
    };
  }

  // Could not classify — route to review.
  return {
    domainSegment: rowDomainSegment || null,
    businessFunction: normalizeBusinessFunction(rowBusinessFunction),
    criticality: normalizeCriticality(rowCriticality),
    classificationSource: "NEEDS_CLASSIFICATION",
  };
}

export async function loadCsvUploadToTenantContext(
  input: CsvUploadInput,
): Promise<CsvUploadLoadResult> {
  const prepared = prepareCsvUploadForTenantContext(input);
  const { chunks, ...publicPrepared } = prepared;

  // Compute per-row classification before any DB writes so we can annotate
  // chunks and tally the classification outcome counts.
  const parsedForClassification = parseStructuredUpload(
    input.csvText,
    input.fileName,
  );
  const rowClassifications = parsedForClassification.rows.map((row) =>
    resolveRowClassification(row, input.classificationOverrides),
  );
  let needsClassificationCount = 0;
  let autoInferredCount = 0;
  for (const cls of rowClassifications) {
    if (cls.classificationSource === "NEEDS_CLASSIFICATION")
      needsClassificationCount++;
    else if (cls.classificationSource === "AUTO_INFERRED") autoInferredCount++;
  }

  // Annotate chunks with classification fields. Chunks are ordered the same as
  // parsedForClassification.rows (both derived from the same CSV parse).
  const annotatedChunks = chunks.map((chunk, index) => {
    const cls = rowClassifications[index] ?? {
      domainSegment: null,
      businessFunction: null,
      criticality: null,
      classificationSource: "NEEDS_CLASSIFICATION" as ClassificationSource,
    };
    return {
      ...chunk,
      domain_segment: cls.domainSegment,
      business_function: cls.businessFunction,
      criticality: cls.criticality,
      classification_source: cls.classificationSource,
      // Route unclassified rows to 'review' lifecycle state.
      lifecycle_state:
        cls.classificationSource === "NEEDS_CLASSIFICATION"
          ? ("review" as const)
          : chunk.lifecycle_state,
    };
  });

  if (!databaseConfigured() && !input.db) {
    return {
      ...publicPrepared,
      chunksQueued: chunks.length,
      needsClassificationCount,
      autoInferredCount,
      evidenceLedger: {
        status: "not_applicable",
        rowsRecorded: 0,
        evidenceIds: [],
        detail:
          "No database is configured; evidence ledger writes were not attempted.",
      },
      enterpriseContextPromotion: {
        status: "skipped_no_rows",
        recordsPromoted: 0,
        factsPromoted: 0,
        factsSuperseded: 0,
        sourceFileId: null,
        detail:
          "No database is configured; structured enterprise context promotion was not attempted.",
      },
      persistence: {
        status: "skipped_no_database_url",
        chunkRowsInserted: 0,
        ingestionRunRecorded: false,
        detail:
          "No ABARVA_AZURE_DATABASE_URL or DATABASE_URL is configured; upload was parsed and mapped but not written.",
      },
    };
  }

  const db = input.db ?? getAzureWriteFluentClient();
  const runInsert = await db
    .from("data_ingestion_runs")
    .insert({
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      source_label: `CSV upload: ${input.fileName}`,
      source_root: "admin/context-layer/csv-upload",
      status: "started",
      records_loaded: 0,
      chunks_loaded: 0,
      nodes_loaded: 0,
      edges_loaded: 0,
      summary: {
        loader: "c5-csv-upload-connector",
        upload_id: prepared.uploadId,
        template_id: prepared.template.id,
        context_dimension: prepared.template.dimension,
        embedding_status: "pending",
        upload_attestation: input.attestation ?? null,
      },
    })
    .select("id");
  const ingestionRunRecorded = !runInsert.error;
  const ingestionRunId = Array.isArray(runInsert.data)
    ? (runInsert.data[0] as { id?: string } | undefined)?.id
    : null;

  async function updateIngestionRun(status: "completed" | "failed") {
    if (!ingestionRunId) return;
    await db
      .from("data_ingestion_runs")
      .update({
        status,
        records_loaded: status === "completed" ? prepared.rowsParsed : 0,
        chunks_loaded: status === "completed" ? prepared.chunks.length : 0,
        completed_at: new Date().toISOString(),
      })
      .eq("id", ingestionRunId);
  }

  let inserted = 0;
  let enterpriseContextPromotion: AdminStructuredContextPromotionResult;
  const evidenceIds: string[] = [];
  try {
    for (let index = 0; index < annotatedChunks.length; index += 100) {
      const batch = annotatedChunks.slice(index, index + 100);
      // WS-B: upsert on the stable chunk id so re-uploading the same logical
      // content updates the chunk in place instead of failing on a duplicate key
      // or accumulating orphaned duplicate chunks across uploads.
      const { data, error, count } = await db
        .from("enterprise_context_chunks")
        .upsert(batch, { onConflict: "tenant_key,chunk_id" })
        .select("chunk_id");
      if (error) throw new Error(`csv_chunk_upsert_failed: ${error.message}`);
      inserted += Array.isArray(data) ? data.length : (count ?? batch.length);
    }

    if (prepared.template.id === "phs-evidence-register") {
      const parsed = parseCsvUpload(input.csvText);
      const evidenceInputs = buildPHSEvidenceLedgerInputs({
        clientId: input.clientId,
        uploadedBy: input.uploadedBy,
        uploadId: prepared.uploadId,
        fileName: input.fileName,
        rows: parsed.rows,
      });
      const writeEvidence = input.recordEvidenceFn ?? recordEvidence;
      for (const evidenceInput of evidenceInputs) {
        evidenceIds.push(await writeEvidence(evidenceInput));
      }
    }

    const parsedForPromotion = parseStructuredUpload(
      input.csvText,
      input.fileName,
    );
    enterpriseContextPromotion =
      await promoteAdminStructuredRowsToEnterpriseContext({
        clientId: input.clientId,
        tenantKey: input.tenantKey,
        fileName: input.fileName,
        sourceFileHash: prepared.fileHash,
        uploadedBy: input.uploadedBy,
        uploadedAt: input.uploadedAt ?? new Date().toISOString(),
        uploadId: prepared.uploadId,
        sourcePathBase: sourcePathBase(input),
        template: prepared.template,
        mapping: prepared.mapping,
        rows: parsedForPromotion.rows,
        rowClassifications,
        sourceBlob: input.sourceBlob,
        loadOrder: input.loadOrder,
        db,
      });
    await updateIngestionRun("completed");
  } catch (error) {
    await updateIngestionRun("failed");
    throw error;
  }

  return {
    ...publicPrepared,
    chunksQueued: chunks.length,
    needsClassificationCount,
    autoInferredCount,
    evidenceLedger:
      evidenceIds.length > 0
        ? {
            status: "inserted",
            rowsRecorded: evidenceIds.length,
            evidenceIds,
            detail:
              "PHS evidence register rows were appended to the evidence ledger.",
          }
        : {
            status: "not_applicable",
            rowsRecorded: 0,
            evidenceIds: [],
            detail: "Selected template does not create evidence ledger rows.",
          },
    enterpriseContextPromotion,
    persistence: {
      status: "inserted",
      chunkRowsInserted: inserted,
      ingestionRunRecorded,
      detail: ingestionRunRecorded
        ? "CSV rows were written as pending tenant context chunks and promoted into structured Enterprise Context records/facts."
        : "CSV chunks were inserted and promoted; ingestion run audit row was skipped because the table write failed.",
    },
  };
}

export function parseFieldMappings(
  raw: unknown,
): Record<string, string> | undefined {
  return parseJsonObject(raw);
}

export function parseTextColumns(raw: unknown): string[] | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter(
      (value): value is string =>
        typeof value === "string" && value.trim() !== "",
    );
  } catch {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
}
