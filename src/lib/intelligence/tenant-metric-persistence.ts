import "server-only";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import {
  getTenantMetricPrivatePlane,
  tenantMetricTableRef,
  type TenantMetricPrivatePlane,
} from "./tenant-metric-private-plane";
import type {
  ParsedTenantMetricUpload,
  TenantMetricUploadRejection,
} from "./tenant-metric-upload";
import type { TenantMetricObservation } from "./tenant-metric-fixtures";

export type TenantMetricPersistenceStatus =
  | "persisted"
  | "skipped_no_database_url"
  | "skipped_no_private_plane"
  | "skipped_empty_upload";

export interface PersistTenantMetricObservationsInput {
  tenantKey: string;
  clientId: string;
  documentName: string;
  fileName: string;
  storageUrl?: string | null;
  observations: readonly TenantMetricObservation[];
  rejectedRows?: readonly TenantMetricUploadRejection[];
  uploadBatchId?: string;
  uploadedBy?: string;
  sourcePayload?: Record<string, unknown>;
}

export interface TenantMetricPersistenceRow {
  observation_id: string;
  upload_batch_id: string;
  tenant_key: string;
  client_id: string;
  metric_id: string;
  metric_name: string;
  industry: string;
  current_value: number | null;
  unit: string;
  as_of: string;
  source: string;
  source_detail: string;
  measurement_status: string;
  direction: string;
  confidence: number;
  owner_role: string;
  notes: string;
  program_ids: readonly string[];
  source_event_ids: readonly string[];
  raw_payload: Record<string, unknown>;
}

export interface TenantMetricPersistenceResult {
  status: TenantMetricPersistenceStatus;
  tenantKey: string;
  privateSchema: string | null;
  uploadBatchId: string | null;
  acceptedCount: number;
  rejectedCount: number;
  persistedObservationIds: readonly string[];
}

let cachedPool: Pool | null | undefined;

function getPool(): Pool | null {
  if (cachedPool !== undefined) return cachedPool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    cachedPool = null;
    return cachedPool;
  }
  cachedPool = new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  return cachedPool;
}

export function buildTenantMetricPersistenceRows(
  input: PersistTenantMetricObservationsInput,
  plane: TenantMetricPrivatePlane,
  uploadBatchId: string,
): TenantMetricPersistenceRow[] {
  return input.observations.map((observation) => ({
    observation_id: `${uploadBatchId}:${observation.id}`,
    upload_batch_id: uploadBatchId,
    tenant_key: plane.tenantKey,
    client_id: input.clientId,
    metric_id: observation.metricId,
    metric_name: observation.metricName,
    industry: observation.industry,
    current_value: observation.currentValue,
    unit: observation.unit,
    as_of: observation.asOf,
    source: observation.source,
    source_detail: observation.sourceDetail,
    measurement_status: observation.measurementStatus,
    direction: observation.direction,
    confidence: observation.confidence,
    owner_role: observation.ownerRole,
    notes: observation.notes,
    program_ids: [...(observation.programIds ?? [])],
    source_event_ids: [...(observation.sourceEventIds ?? [])],
    raw_payload: {
      ...input.sourcePayload,
      originalObservationId: observation.id,
      sourceClientId: observation.clientId,
    },
  }));
}

export async function persistTenantMetricUpload(input: {
  clientId: string;
  documentName: string;
  fileName: string;
  storageUrl?: string | null;
  parsed: ParsedTenantMetricUpload;
  uploadedBy?: string;
}): Promise<TenantMetricPersistenceResult> {
  return persistTenantMetricObservations({
    tenantKey: input.parsed.tenantKey,
    clientId: input.clientId,
    documentName: input.documentName,
    fileName: input.fileName,
    storageUrl: input.storageUrl,
    observations: input.parsed.accepted,
    rejectedRows: input.parsed.rejected,
    uploadedBy: input.uploadedBy,
    sourcePayload: { ingestionSource: "setup_upload" },
  });
}

export async function persistTenantMetricObservations(
  input: PersistTenantMetricObservationsInput,
): Promise<TenantMetricPersistenceResult> {
  const plane = getTenantMetricPrivatePlane(input.tenantKey);
  if (!plane) {
    return {
      status: "skipped_no_private_plane",
      tenantKey: input.tenantKey,
      privateSchema: null,
      uploadBatchId: null,
      acceptedCount: input.observations.length,
      rejectedCount: input.rejectedRows?.length ?? 0,
      persistedObservationIds: [],
    };
  }

  if (
    input.observations.length === 0 &&
    (input.rejectedRows?.length ?? 0) === 0
  ) {
    return {
      status: "skipped_empty_upload",
      tenantKey: plane.tenantKey,
      privateSchema: plane.privateSchema,
      uploadBatchId: null,
      acceptedCount: 0,
      rejectedCount: 0,
      persistedObservationIds: [],
    };
  }

  const pool = getPool();
  if (!pool) {
    return {
      status: "skipped_no_database_url",
      tenantKey: plane.tenantKey,
      privateSchema: plane.privateSchema,
      uploadBatchId: null,
      acceptedCount: input.observations.length,
      rejectedCount: input.rejectedRows?.length ?? 0,
      persistedObservationIds: [],
    };
  }

  const uploadBatchId =
    input.uploadBatchId ?? `metric-upload:${plane.tenantKey}:${randomUUID()}`;
  const rows = buildTenantMetricPersistenceRows(input, plane, uploadBatchId);
  const batchTable = tenantMetricTableRef(plane, plane.uploadBatchTable);
  const observationTable = tenantMetricTableRef(plane, plane.observationTable);
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query(
      `insert into ${batchTable} (
        upload_batch_id, tenant_key, client_id, document_name, file_name,
        uploaded_by, storage_url, accepted_count, rejected_count, rejected_rows, source_payload
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)
      on conflict (upload_batch_id) do update set
        document_name = excluded.document_name,
        file_name = excluded.file_name,
        uploaded_by = excluded.uploaded_by,
        storage_url = excluded.storage_url,
        accepted_count = excluded.accepted_count,
        rejected_count = excluded.rejected_count,
        rejected_rows = excluded.rejected_rows,
        source_payload = excluded.source_payload,
        uploaded_at = now()`,
      [
        uploadBatchId,
        plane.tenantKey,
        input.clientId,
        input.documentName,
        input.fileName,
        input.uploadedBy ?? null,
        input.storageUrl ?? null,
        input.observations.length,
        input.rejectedRows?.length ?? 0,
        JSON.stringify(input.rejectedRows ?? []),
        JSON.stringify(input.sourcePayload ?? {}),
      ],
    );

    for (const row of rows) {
      await client.query(
        `insert into ${observationTable} (
          observation_id, upload_batch_id, tenant_key, client_id, metric_id, metric_name,
          industry, current_value, unit, as_of, source, source_detail, measurement_status,
          direction, confidence, owner_role, notes, program_ids, source_event_ids, raw_payload
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,$11,$12,$13,$14,$15,$16,$17,$18::text[],$19::text[],$20::jsonb
        )
        on conflict (observation_id) do update set
          client_id = excluded.client_id,
          metric_id = excluded.metric_id,
          metric_name = excluded.metric_name,
          industry = excluded.industry,
          current_value = excluded.current_value,
          unit = excluded.unit,
          as_of = excluded.as_of,
          source = excluded.source,
          source_detail = excluded.source_detail,
          measurement_status = excluded.measurement_status,
          direction = excluded.direction,
          confidence = excluded.confidence,
          owner_role = excluded.owner_role,
          notes = excluded.notes,
          program_ids = excluded.program_ids,
          source_event_ids = excluded.source_event_ids,
          raw_payload = excluded.raw_payload,
          ingested_at = now()`,
        [
          row.observation_id,
          row.upload_batch_id,
          row.tenant_key,
          row.client_id,
          row.metric_id,
          row.metric_name,
          row.industry,
          row.current_value,
          row.unit,
          row.as_of,
          row.source,
          row.source_detail,
          row.measurement_status,
          row.direction,
          row.confidence,
          row.owner_role,
          row.notes,
          row.program_ids,
          row.source_event_ids,
          JSON.stringify(row.raw_payload),
        ],
      );
    }

    await client.query("commit");
    return {
      status: "persisted",
      tenantKey: plane.tenantKey,
      privateSchema: plane.privateSchema,
      uploadBatchId,
      acceptedCount: rows.length,
      rejectedCount: input.rejectedRows?.length ?? 0,
      persistedObservationIds: rows.map((row) => row.observation_id),
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
