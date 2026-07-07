import crypto from "node:crypto";

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";

import type { ContextApprovalItem } from "./approval-queue";
import { segmentKeyForContextDimension } from "./csv-upload-connector";
import { buildEvidenceRows } from "./evidence-writer";
import {
  DIMENSION_FAMILY_MAP,
  type ContextDimension,
  type ContextDimensionFamily,
  type ContextDimensionUniversal,
  type ContextEvidenceRow,
  type ExtractedContextFact,
} from "./types";

export interface ParsedContextRecord {
  canonicalRecordId: string;
  recordType: string;
  title: string;
  sourceRecordId: string;
  sourceRowNumber?: number | null;
  payload: Record<string, unknown>;
  owner?: string | null;
  domainSegment?: string | null;
  businessFunction?: string | null;
  confidence?: number | null;
}

export interface ParsedContextFact {
  canonicalRecordId: string;
  factKey: string;
  factType: string;
  factValue: Record<string, unknown>;
  factText: string;
  sourceRecordId: string;
  sourceRowNumber?: number | null;
  owner?: string | null;
  confidence?: number | null;
}

export interface ContextCommitBatchInput {
  clientId: string;
  tenantKey: string;
  dimension: ContextDimension;
  dimensionFamily?: ContextDimensionFamily;
  templateId: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt?: string;
  sourceFileHash?: string | null;
  sourcePathBase?: string | null;
  blobUrl?: string | null;
  blobContainer?: string | null;
  blobObjectKey?: string | null;
  byteSize?: number | null;
  loadOrder?: number | null;
  records: ParsedContextRecord[];
  facts?: ParsedContextFact[];
}

export interface ContextCommitReceipt {
  sourceFileId: string;
  tenantKey: string;
  dimension: string;
  dimensionFamily: string;
  recordsUpserted: number;
  factsUpserted: number;
  chunksUpserted: number;
  blobUrl: string | null;
  committedAt: string;
}

export interface CommittedContextLayer {
  tenantKey: string;
  committedFacts: ExtractedContextFact[];
  evidenceRows: ContextEvidenceRow[];
  availableToAgents: boolean;
  unlockedSurfaces: string[];
}

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "context"
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

function evidencePointer(sourcePathBase: string, row?: number | null): string {
  return row ? `${sourcePathBase}#row=${row}` : sourcePathBase;
}

function normalizeFactValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

function factsForRecords(input: ContextCommitBatchInput): ParsedContextFact[] {
  if (input.facts) return input.facts;
  return input.records.flatMap((record) =>
    Object.entries(record.payload)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      )
      .map(([key, value]) => ({
        canonicalRecordId: record.canonicalRecordId,
        factKey: `${record.canonicalRecordId}:${safeSlug(key)}`,
        factType: `${record.recordType}.${key}`,
        factValue: normalizeFactValue(value),
        factText: `${record.title} - ${key}: ${
          typeof value === "string" ? value : JSON.stringify(value)
        }`,
        sourceRecordId: record.sourceRecordId,
        sourceRowNumber: record.sourceRowNumber,
        owner: record.owner,
        confidence: record.confidence,
      })),
  );
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

function isMissingOptionalIngestionRunTable(error: { message: string } | null) {
  return (
    Boolean(error) &&
    /relation ["']?data_ingestion_runs["']? does not exist/i.test(
      error?.message ?? "",
    )
  );
}

export async function commitContextBatch(
  input: ContextCommitBatchInput,
  db: PostgresCompatClient = getAzureWriteFluentClient(),
): Promise<ContextCommitReceipt> {
  const committedAt = input.uploadedAt ?? new Date().toISOString();
  const dimensionFamily =
    input.dimensionFamily ??
    DIMENSION_FAMILY_MAP[input.dimension as ContextDimensionUniversal];
  const sourceFileId = `manifest-load:${safeSlug(input.tenantKey)}:${safeSlug(
    input.fileName,
  )}`;
  const sourcePathBase =
    input.sourcePathBase ??
    input.blobUrl ??
    `manifest-load://${input.tenantKey}/${encodeURIComponent(input.fileName)}`;
  const fileHash =
    input.sourceFileHash ??
    hashJson({
      tenantKey: input.tenantKey,
      fileName: input.fileName,
      records: input.records.length,
    });
  const sourceId = stableUuid([
    "enterprise_context_sources",
    input.tenantKey,
    "manifest_context_load",
    sourceFileId,
  ]);
  const sourceFileRowId = stableUuid([
    "enterprise_context_source_files",
    input.tenantKey,
    sourceFileId,
  ]);

  const runInsert = await db
    .from("data_ingestion_runs")
    .insert({
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      source_label: `Manifest load: ${input.fileName}`,
      source_root: "admin/context-layer/manifest-load",
      status: "started",
      records_loaded: 0,
      chunks_loaded: 0,
      nodes_loaded: 0,
      edges_loaded: 0,
      summary: {
        loader: "context-commit",
        template_id: input.templateId,
        context_dimension: input.dimension,
        dimension_family: dimensionFamily,
        load_order: input.loadOrder ?? null,
      },
    })
    .select("id");
  if (runInsert.error && !isMissingOptionalIngestionRunTable(runInsert.error)) {
    throw new Error(`data_ingestion_runs insert: ${runInsert.error.message}`);
  }
  const ingestionRunId =
    !runInsert.error && Array.isArray(runInsert.data)
      ? (runInsert.data[0] as { id?: string } | undefined)?.id
      : null;

  async function updateIngestionRun(args: {
    status: "completed" | "failed";
    recordsLoaded?: number;
    chunksLoaded?: number;
    errorMessage?: string;
  }) {
    if (!ingestionRunId) return;
    const result = await db
      .from("data_ingestion_runs")
      .update({
        status: args.status,
        records_loaded: args.recordsLoaded ?? 0,
        chunks_loaded: args.chunksLoaded ?? 0,
        nodes_loaded: args.recordsLoaded ?? 0,
        completed_at: new Date().toISOString(),
        error_message: args.errorMessage ?? null,
      })
      .eq("id", ingestionRunId);
    if (result.error && !isMissingOptionalIngestionRunTable(result.error)) {
      throw new Error(`data_ingestion_runs update: ${result.error.message}`);
    }
  }

  try {
    await throwOnError(
      "enterprise_context_sources upsert",
      await db
        .from("enterprise_context_sources")
        .upsert(
          {
            id: sourceId,
            client_id: input.clientId,
            tenant_key: input.tenantKey,
            source_system: "manifest_context_load",
            source_key: sourceFileId,
            source_type: "manifest_structured_upload",
            display_name: `Manifest structured upload: ${input.fileName}`,
            system_of_record: false,
            source_owner: input.uploadedBy,
            steward_owner: input.uploadedBy,
            sync_cadence: "manual",
            tenant_aliases: [input.tenantKey],
            source_status: "active",
            last_synced_at: committedAt,
            last_validated_at: committedAt.slice(0, 10),
            confidence: 0.86,
            freshness_status: "fresh",
            evidence_pointer: sourcePathBase,
            metadata: {
              loader: "context-commit",
              template_id: input.templateId,
              dimension: input.dimension,
              dimension_family: dimensionFamily,
            },
          },
          { onConflict: "tenant_key,source_system,source_key" },
        )
        .select("id"),
    );

    await throwOnError(
      "enterprise_context_source_files upsert",
      await db
        .from("enterprise_context_source_files")
        .upsert(
          {
            id: sourceFileRowId,
            client_id: input.clientId,
            tenant_key: input.tenantKey,
            source_id: sourceId,
            source_file_id: sourceFileId,
            source_system: "manifest_context_load",
            source_file: input.fileName,
            source_path: sourcePathBase,
            workbook_name: null,
            sheet_names: [],
            file_hash: fileHash,
            row_count: input.records.length,
            imported_by: input.uploadedBy,
            last_synced_at: committedAt,
            last_validated_at: committedAt.slice(0, 10),
            confidence: 0.86,
            freshness_status: "fresh",
            evidence_pointer: sourcePathBase,
            blob_container: input.blobContainer ?? null,
            blob_object_key: input.blobObjectKey ?? null,
            blob_url: input.blobUrl ?? null,
            byte_size: input.byteSize ?? null,
            metadata: {
              loader: "context-commit",
              template_id: input.templateId,
              dimension: input.dimension,
              dimension_family: dimensionFamily,
              load_order: input.loadOrder ?? null,
            },
          },
          { onConflict: "tenant_key,source_file_id" },
        )
        .select("id"),
    );

    const recordRows = input.records.map((record) => {
      const payload = {
        ...record.payload,
        _abarva: {
          loader: "context-commit",
          template_id: input.templateId,
          dimension: input.dimension,
          dimension_family: dimensionFamily,
          source_file_id: sourceFileId,
          load_order: input.loadOrder ?? null,
        },
      };
      return {
        client_id: input.clientId,
        tenant_key: input.tenantKey,
        canonical_record_id: record.canonicalRecordId,
        record_type: record.recordType,
        record_subtype: input.templateId,
        title: record.title,
        source_id: sourceId,
        source_file_id: sourceFileRowId,
        source_system: "manifest_context_load",
        source_record_id: record.sourceRecordId,
        source_file: input.fileName,
        source_sheet: null,
        source_row_number: record.sourceRowNumber ?? null,
        owner: record.owner ?? null,
        steward_owner: input.uploadedBy,
        last_synced_at: committedAt,
        last_validated_at: committedAt.slice(0, 10),
        confidence: record.confidence ?? 0.86,
        freshness_status: "fresh",
        evidence_pointer: evidencePointer(
          sourcePathBase,
          record.sourceRowNumber,
        ),
        lifecycle_state: "active",
        domain_segment: record.domainSegment ?? null,
        business_function: record.businessFunction ?? null,
        dimension_family: dimensionFamily,
        load_order: input.loadOrder ?? null,
        payload_hash: hashJson(payload),
        payload,
      };
    });

    for (let index = 0; index < recordRows.length; index += 100) {
      await throwOnError(
        "enterprise_context_records upsert",
        await db
          .from("enterprise_context_records")
          .upsert(recordRows.slice(index, index + 100), {
            onConflict: "tenant_key,canonical_record_id",
          })
          .select("id"),
      );
    }

    const idResult = await db
      .from("enterprise_context_records")
      .select("id,canonical_record_id")
      .eq("tenant_key", input.tenantKey)
      .in(
        "canonical_record_id",
        input.records.map((record) => record.canonicalRecordId),
      );
    const idRows =
      (await throwOnError<Array<{ id: string; canonical_record_id: string }>>(
        "enterprise_context_records id map",
        idResult,
      )) ?? [];
    const idMap = new Map(
      idRows.map((row) => [row.canonical_record_id, row.id]),
    );

    const factRows = factsForRecords(input).flatMap((fact) => {
      const recordId = idMap.get(fact.canonicalRecordId);
      if (!recordId) return [];
      return [
        {
          client_id: input.clientId,
          tenant_key: input.tenantKey,
          record_id: recordId,
          fact_key: fact.factKey,
          fact_type: fact.factType,
          fact_value: fact.factValue,
          fact_text: fact.factText,
          source_system: "manifest_context_load",
          source_record_id: fact.sourceRecordId,
          source_file: input.fileName,
          source_sheet: null,
          source_row_number: fact.sourceRowNumber ?? null,
          owner: fact.owner ?? null,
          last_synced_at: committedAt,
          last_validated_at: committedAt.slice(0, 10),
          confidence: fact.confidence ?? 0.86,
          freshness_status: "fresh",
          evidence_pointer: evidencePointer(
            sourcePathBase,
            fact.sourceRowNumber,
          ),
          lifecycle_state: "active",
          valid_from: null,
          valid_through: null,
          dimension_family: dimensionFamily,
          domain_segment: null,
          value_hash: hashJson({
            factKey: fact.factKey,
            value: fact.factValue,
          }),
        },
      ];
    });

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

    const sourceSegmentId = segmentKeyForContextDimension(input.dimension);
    const chunkRows = input.records.map((record, index) => {
      const chunkText = [
        `Template: ${input.templateId}`,
        `Dimension: ${input.dimension}`,
        `Title: ${record.title}`,
        ...Object.entries(record.payload).map(([key, value]) => {
          const text =
            typeof value === "string" ? value : JSON.stringify(value);
          return `${key}: ${text}`;
        }),
      ].join("\n");
      return {
        client_id: input.clientId,
        tenant_key: input.tenantKey,
        chunk_id: [
          "manifest",
          safeSlug(input.tenantKey),
          safeSlug(input.dimension),
          safeSlug(record.sourceRecordId),
        ].join(":"),
        source_system: "manifest_context_load",
        source_segment_id: sourceSegmentId,
        source_record_id: record.sourceRecordId,
        source_doc: input.fileName,
        source_path: evidencePointer(sourcePathBase, record.sourceRowNumber),
        chunk_index: index,
        chunk_text: chunkText,
        token_count: Math.max(1, Math.ceil(chunkText.length / 4)),
        embedding_status: "pending",
        embedding_model: null,
        embedding_error: null,
        lifecycle_state: "active",
        load_batch_id: sourceFileId,
        provenance: {
          loader: "context-commit",
          template_id: input.templateId,
          dimension: input.dimension,
          dimension_family: dimensionFamily,
          source_blob_url: input.blobUrl ?? null,
        },
        chunk_metadata: {
          record_kind: "manifest_context_record",
          template_id: input.templateId,
          context_dimension: input.dimension,
          dimension_family: dimensionFamily,
          title: record.title,
        },
      };
    });

    for (let index = 0; index < chunkRows.length; index += 100) {
      await throwOnError(
        "enterprise_context_chunks upsert",
        await db
          .from("enterprise_context_chunks")
          .upsert(chunkRows.slice(index, index + 100), {
            onConflict: "tenant_key,chunk_id",
          })
          .select("chunk_id"),
      );
    }

    await updateIngestionRun({
      status: "completed",
      recordsLoaded: recordRows.length,
      chunksLoaded: chunkRows.length,
    });

    return {
      sourceFileId,
      tenantKey: input.tenantKey,
      dimension: input.dimension,
      dimensionFamily,
      recordsUpserted: recordRows.length,
      factsUpserted: factRows.length,
      chunksUpserted: chunkRows.length,
      blobUrl: input.blobUrl ?? null,
      committedAt,
    };
  } catch (error) {
    await updateIngestionRun({
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function commitApprovedFacts(
  items: ContextApprovalItem[],
): CommittedContextLayer {
  const committedFacts = items
    .filter((item) => item.state === "approved")
    .map((item) => item.fact);
  return {
    tenantKey: committedFacts[0]?.tenantKey ?? "northstar",
    committedFacts,
    evidenceRows: buildEvidenceRows(committedFacts),
    availableToAgents: committedFacts.length > 0,
    unlockedSurfaces: ["Sentinel", "Source", "Moves", "Tower"],
  };
}
