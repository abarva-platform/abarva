import "server-only";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import {
  applySetupAiInitiativeFinancialFirewall,
  type SetupAiInitiativeRecord,
} from "./ai-initiatives";
import {
  getSetupAiInitiativesPrivatePlane,
  setupAiInitiativesTableRef,
  type SetupAiInitiativesPrivatePlane,
} from "./ai-initiatives-private-plane";

export type SetupAiInitiativePersistenceStatus =
  | "persisted"
  | "skipped_no_database_url"
  | "skipped_no_private_plane"
  | "skipped_empty_upload";
export type SetupAiInitiativeReadStatus =
  | "private_db"
  | "skipped_no_database_url"
  | "skipped_no_private_plane";
export interface PersistSetupAiInitiativesInput {
  tenantKey: string;
  clientId: string;
  documentName: string;
  fileName: string;
  initiatives: readonly SetupAiInitiativeRecord[];
  uploadBatchId?: string;
  uploadedBy?: string;
  sourcePayload?: Record<string, unknown>;
}
export interface SetupAiInitiativePersistenceResult {
  status: SetupAiInitiativePersistenceStatus;
  tenantKey: string;
  privateSchema: string | null;
  uploadBatchId: string | null;
  acceptedCount: number;
  persistedInitiativeIds: readonly string[];
}
export interface SetupAiInitiativeReadResult {
  status: SetupAiInitiativeReadStatus;
  tenantKey: string;
  privateSchema: string | null;
  initiatives: readonly SetupAiInitiativeRecord[];
}

let cachedPool: Pool | null | undefined;
function getPool(): Pool | null {
  if (cachedPool !== undefined) return cachedPool;
  const connectionString = process.env.DATABASE_URL?.trim();
  cachedPool = connectionString
    ? new Pool({
        connectionString,
        max: 2,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 5_000,
      })
    : null;
  return cachedPool;
}
export function buildSetupAiInitiativePersistenceRows(
  input: PersistSetupAiInitiativesInput,
  plane: SetupAiInitiativesPrivatePlane,
): SetupAiInitiativeRecord[] {
  return input.initiatives.map((initiative) => ({
    ...initiative,
    tenantKey: plane.tenantKey,
    clientId: input.clientId,
  }));
}
function parseArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
function rowToInitiative(
  row: Record<string, unknown>,
): SetupAiInitiativeRecord {
  return {
    initiativeId: String(row.initiative_id),
    tenantKey: String(row.tenant_key),
    clientId: String(row.client_id),
    name: String(row.name),
    archetype: row.archetype as SetupAiInitiativeRecord["archetype"],
    sponsorRole: String(row.sponsor_role ?? ""),
    ownerRole: String(row.owner_role ?? ""),
    sponsorUserId: row.sponsor_user_id as string | null,
    ownerUserId: row.owner_user_id as string | null,
    vendor: row.vendor as string | null,
    parentProduct: row.parent_product as string | null,
    internalTeam: row.internal_team as string | null,
    status: row.status as SetupAiInitiativeRecord["status"],
    linkedProgramId: row.linked_program_id as string | null,
    startedAt:
      row.started_at instanceof Date
        ? row.started_at.toISOString().slice(0, 10)
        : String(row.started_at),
    targetOutcomes: parseArray(row.target_outcomes),
    realizedSignals: parseArray(row.realized_signals),
    riskSignals: parseArray(row.risk_signals),
    budgetAmount: row.budget_amount === null ? null : Number(row.budget_amount),
    spendToDate: row.spend_to_date === null ? null : Number(row.spend_to_date),
    directionalSummary:
      row.directional_summary as SetupAiInitiativeRecord["directionalSummary"],
    evidenceLinks: parseArray(row.evidence_links),
    tags: parseArray<string>(row.tags),
    visibility: row.visibility as SetupAiInitiativeRecord["visibility"],
    source: row.source as SetupAiInitiativeRecord["source"],
    lastUpdatedAt:
      row.last_updated_at instanceof Date
        ? row.last_updated_at.toISOString()
        : String(row.last_updated_at),
    lastUpdatedBy: String(row.last_updated_by ?? ""),
  };
}
export async function listPersistedSetupAiInitiatives(input: {
  tenantKey: string;
  financialVisibility?: boolean;
}): Promise<SetupAiInitiativeReadResult> {
  const plane = getSetupAiInitiativesPrivatePlane(input.tenantKey);
  if (!plane)
    return {
      status: "skipped_no_private_plane",
      tenantKey: input.tenantKey,
      privateSchema: null,
      initiatives: [],
    };
  const pool = getPool();
  if (!pool)
    return {
      status: "skipped_no_database_url",
      tenantKey: plane.tenantKey,
      privateSchema: plane.privateSchema,
      initiatives: [],
    };
  const result = await pool.query(
    `select * from ${setupAiInitiativesTableRef(plane, plane.initiativeTable)} where tenant_key = $1 order by last_updated_at desc, name asc`,
    [plane.tenantKey],
  );
  return {
    status: "private_db",
    tenantKey: plane.tenantKey,
    privateSchema: plane.privateSchema,
    initiatives: result.rows.map((row) =>
      applySetupAiInitiativeFinancialFirewall(
        rowToInitiative(row),
        input.financialVisibility === true,
      ),
    ),
  };
}
export async function persistSetupAiInitiatives(
  input: PersistSetupAiInitiativesInput,
): Promise<SetupAiInitiativePersistenceResult> {
  const plane = getSetupAiInitiativesPrivatePlane(input.tenantKey);
  if (!plane)
    return {
      status: "skipped_no_private_plane",
      tenantKey: input.tenantKey,
      privateSchema: null,
      uploadBatchId: null,
      acceptedCount: input.initiatives.length,
      persistedInitiativeIds: [],
    };
  if (input.initiatives.length === 0)
    return {
      status: "skipped_empty_upload",
      tenantKey: plane.tenantKey,
      privateSchema: plane.privateSchema,
      uploadBatchId: null,
      acceptedCount: 0,
      persistedInitiativeIds: [],
    };
  const pool = getPool();
  if (!pool)
    return {
      status: "skipped_no_database_url",
      tenantKey: plane.tenantKey,
      privateSchema: plane.privateSchema,
      uploadBatchId: null,
      acceptedCount: input.initiatives.length,
      persistedInitiativeIds: [],
    };
  const uploadBatchId =
    input.uploadBatchId ??
    `setup-ai-initiatives:${plane.tenantKey}:${randomUUID()}`;
  const batchTable = setupAiInitiativesTableRef(plane, plane.uploadBatchTable);
  const initiativeTable = setupAiInitiativesTableRef(
    plane,
    plane.initiativeTable,
  );
  const auditTable = setupAiInitiativesTableRef(plane, plane.auditEventTable);
  const rows = buildSetupAiInitiativePersistenceRows(input, plane);
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into ${batchTable} (upload_batch_id, tenant_key, client_id, document_name, file_name, uploaded_by, accepted_count, source_payload) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) on conflict (upload_batch_id) do update set document_name = excluded.document_name, file_name = excluded.file_name, uploaded_by = excluded.uploaded_by, accepted_count = excluded.accepted_count, source_payload = excluded.source_payload, uploaded_at = now()`,
      [
        uploadBatchId,
        plane.tenantKey,
        input.clientId,
        input.documentName,
        input.fileName,
        input.uploadedBy ?? null,
        rows.length,
        JSON.stringify(input.sourcePayload ?? {}),
      ],
    );
    for (const row of rows) {
      await client.query(
        `insert into ${initiativeTable} (initiative_id, upload_batch_id, tenant_key, client_id, name, archetype, sponsor_user_id, owner_user_id, sponsor_role, owner_role, vendor, parent_product, internal_team, status, linked_program_id, started_at, target_outcomes, realized_signals, risk_signals, budget_amount, spend_to_date, directional_summary, evidence_links, tags, visibility, source, last_updated_at, last_updated_by, raw_payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::date,$17::jsonb,$18::jsonb,$19::jsonb,$20,$21,$22::jsonb,$23::jsonb,$24::jsonb,$25::jsonb,$26,$27::timestamptz,$28,$29::jsonb) on conflict (initiative_id) do update set upload_batch_id = excluded.upload_batch_id, client_id = excluded.client_id, name = excluded.name, archetype = excluded.archetype, sponsor_user_id = excluded.sponsor_user_id, owner_user_id = excluded.owner_user_id, sponsor_role = excluded.sponsor_role, owner_role = excluded.owner_role, vendor = excluded.vendor, parent_product = excluded.parent_product, internal_team = excluded.internal_team, status = excluded.status, linked_program_id = excluded.linked_program_id, started_at = excluded.started_at, target_outcomes = excluded.target_outcomes, realized_signals = excluded.realized_signals, risk_signals = excluded.risk_signals, budget_amount = excluded.budget_amount, spend_to_date = excluded.spend_to_date, directional_summary = excluded.directional_summary, evidence_links = excluded.evidence_links, tags = excluded.tags, visibility = excluded.visibility, source = excluded.source, last_updated_at = excluded.last_updated_at, last_updated_by = excluded.last_updated_by, raw_payload = excluded.raw_payload, ingested_at = now()`,
        [
          row.initiativeId,
          uploadBatchId,
          plane.tenantKey,
          input.clientId,
          row.name,
          row.archetype,
          row.sponsorUserId ?? null,
          row.ownerUserId ?? null,
          row.sponsorRole,
          row.ownerRole,
          row.vendor ?? null,
          row.parentProduct ?? null,
          row.internalTeam ?? null,
          row.status,
          row.linkedProgramId ?? null,
          row.startedAt,
          JSON.stringify(row.targetOutcomes),
          JSON.stringify(row.realizedSignals),
          JSON.stringify(row.riskSignals),
          row.budgetAmount ?? null,
          row.spendToDate ?? null,
          JSON.stringify(row.directionalSummary),
          JSON.stringify(row.evidenceLinks),
          JSON.stringify(row.tags),
          JSON.stringify(row.visibility),
          row.source,
          row.lastUpdatedAt,
          row.lastUpdatedBy,
          JSON.stringify({
            originalInitiativeId: row.initiativeId,
            ...input.sourcePayload,
          }),
        ],
      );
      await client.query(
        `insert into ${auditTable} (audit_event_id, tenant_key, initiative_id, event_type, actor, event_payload) values ($1,$2,$3,$4,$5,$6::jsonb) on conflict (audit_event_id) do nothing`,
        [
          `${uploadBatchId}:${row.initiativeId}:upsert`,
          plane.tenantKey,
          row.initiativeId,
          "fixture_upsert",
          input.uploadedBy ?? "codex-loader",
          JSON.stringify({ status: row.status, archetype: row.archetype }),
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
      persistedInitiativeIds: rows.map((row) => row.initiativeId),
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
