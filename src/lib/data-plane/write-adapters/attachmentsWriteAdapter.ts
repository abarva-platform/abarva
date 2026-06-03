// Attachments write adapter — Slice 3c (upload write routes).
//
// Routes the DB-write half of the program-attachment + agent-attachment
// upload routes behind the data-plane write seam:
//   - POST   /api/programs/[id]/attachments/upload          → program_attachments INSERT
//   - GET    /api/programs/[id]/attachments/[attachmentId]   → (read-only, signed URL — NOT migrated)
//   - POST   /api/programs/workspace/[moveId]/upload         → program_attachments INSERT
//   - POST   /api/v1/agent/attachments                       → agent_attachment INSERT
//   - DELETE /api/v1/agent/attachments/[id]                  → agent_attachment soft-delete UPDATE
//
// SCOPE — the seam owns ONLY the Postgres row write. The Supabase Storage /
// Azure Blob upload/download of file bytes (and signed-URL brokering) stays
// in the route untouched, as do auth, RBAC, and the sensitive-upload guard.
//
// Pattern (per `quarantine-audit-data-plane.ts`): a domain module with a
// `supabase` (DEFAULT) implementation that uses the Supabase JS client
// directly and an `azure-postgres` implementation that uses a real
// transaction session — selected by the same `ABARVA_DATA_PLANE` env var.
// The `commit()` statement-runner path is not used because its Supabase
// `data_plane_exec` RPC does not exist; these are plain row writes.
//
// Default behavior is unchanged: with `ABARVA_DATA_PLANE` unset/`supabase`
// the inserted/updated rows are byte-faithful to the pre-seam `.insert()` /
// `.update()` calls lifted verbatim from the routes (and from
// `lib/programs/attachments`).

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import {
  createTxSession,
  type TxSessionRunner,
} from "../read-adapters/azureSession";
import { resolveDataPlane } from "../read-adapters/resolveDataPlane";
import type { DataPlane } from "./types";

const PROGRAM_ATTACHMENTS_TABLE = "program_attachments";
const AGENT_ATTACHMENT_TABLE = "agent_attachment";

/** Row body for a new `program_attachments` record — snake_case, verbatim. */
export interface ProgramAttachmentInsert {
  tenant_key: string;
  program_id: string;
  phase: number | null;
  step_id: string | null;
  deliverable_id: string | null;
  original_name: string;
  storage_path: string;
  uploader_user_id: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  scan_status?: string;
  scan_findings?: Record<string, unknown> | null;
}

/** Row body for a new `agent_attachment` record — snake_case, verbatim. */
export interface AgentAttachmentInsert {
  id: string;
  tenant_id: string;
  surface: string;
  agent: string;
  user_id: string;
  file_name: string;
  mime: string;
  bytes: number;
  storage_path: string;
  extracted_text: string | null;
  linked_move_id: string | null;
  parse_metadata?: Record<string, unknown> | null;
}

/**
 * Domain write adapter for the attachment tables. One physical data plane per
 * instance — `supabase` (default) or `azure-postgres`.
 */
export interface AttachmentsWriteAdapter {
  readonly plane: DataPlane;
  /** Insert a program-attachment metadata row; returns the selected row. */
  insertProgramAttachment(
    row: ProgramAttachmentInsert,
    selectColumns: string,
  ): Promise<Record<string, unknown>>;
  /** Insert an agent-attachment metadata row. */
  insertAgentAttachment(row: AgentAttachmentInsert): Promise<void>;
  /**
   * Soft-delete an agent-attachment row (stamp `deleted_at`), scoped by
   * tenant and only if not already deleted. Returns the id, or null if no
   * matching row was affected (not found / already deleted).
   */
  softDeleteAgentAttachment(
    id: string,
    tenantId: string,
  ): Promise<{ id: string } | null>;
}

type SupabaseFactory = () => SupabaseClient;

/** Supabase-backed attachments adapter — the DEFAULT path. */
export function createSupabaseAttachmentsWriteAdapter(
  getClient: SupabaseFactory = getAzureWriteFluentClient,
): AttachmentsWriteAdapter {
  return {
    plane: "supabase",

    async insertProgramAttachment(row, selectColumns) {
      const sb = getClient();
      // `scan_status` / `scan_findings` are only sent when scan_status is
      // explicitly supplied — preserving the pre-seam conditional spread so
      // DB column defaults still apply when omitted.
      const body: Record<string, unknown> = {
        tenant_key: row.tenant_key,
        program_id: row.program_id,
        phase: row.phase,
        step_id: row.step_id,
        deliverable_id: row.deliverable_id,
        original_name: row.original_name,
        storage_path: row.storage_path,
        uploader_user_id: row.uploader_user_id,
        mime_type: row.mime_type,
        size_bytes: row.size_bytes,
        sha256: row.sha256,
        ...(row.scan_status
          ? {
              scan_status: row.scan_status,
              scan_findings: row.scan_findings ?? null,
            }
          : {}),
      };
      const { data, error } = await sb
        .from(PROGRAM_ATTACHMENTS_TABLE)
        .insert(body)
        .select(selectColumns)
        .single();
      if (error) throw error;
      return data as unknown as Record<string, unknown>;
    },

    async insertAgentAttachment(row) {
      const sb = getClient();
      const { error } = await sb.from(AGENT_ATTACHMENT_TABLE).insert(row);
      if (error) throw error;
    },

    async softDeleteAgentAttachment(id, tenantId) {
      const sb = getClient();
      const { data, error } = await sb
        .from(AGENT_ATTACHMENT_TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return data ? { id: (data as { id: string }).id } : null;
    },
  };
}

/** Build an `INSERT ... RETURNING <cols>` from a snake_case row body. */
function buildInsertReturning(
  table: string,
  row: Record<string, unknown>,
  returning: string,
): { sql: string; values: unknown[] } {
  const keys = Object.keys(row);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  return {
    sql:
      `INSERT INTO ${table} (${keys.join(", ")}) ` +
      `VALUES (${placeholders}) RETURNING ${returning}`,
    values: keys.map((k) => row[k]),
  };
}

/**
 * Azure Postgres attachments adapter — opt-in
 * (`ABARVA_DATA_PLANE=azure-postgres`). Each write runs inside a real
 * `BEGIN`/`COMMIT` transaction.
 */
export function createAzureAttachmentsWriteAdapter(
  session: TxSessionRunner = createTxSession("abarva-attachments-write"),
): AttachmentsWriteAdapter {
  return {
    plane: "azure-postgres",

    async insertProgramAttachment(row, selectColumns) {
      const body: Record<string, unknown> = {
        tenant_key: row.tenant_key,
        program_id: row.program_id,
        phase: row.phase,
        step_id: row.step_id,
        deliverable_id: row.deliverable_id,
        original_name: row.original_name,
        storage_path: row.storage_path,
        uploader_user_id: row.uploader_user_id,
        mime_type: row.mime_type,
        size_bytes: row.size_bytes,
        sha256: row.sha256,
        ...(row.scan_status
          ? {
              scan_status: row.scan_status,
              scan_findings: row.scan_findings ?? null,
            }
          : {}),
      };
      const { sql, values } = buildInsertReturning(
        PROGRAM_ATTACHMENTS_TABLE,
        body,
        selectColumns,
      );
      const rows = await session((run) =>
        run<Record<string, unknown>>(sql, values),
      );
      return rows[0];
    },

    async insertAgentAttachment(row) {
      const { sql, values } = buildInsertReturning(
        AGENT_ATTACHMENT_TABLE,
        row as unknown as Record<string, unknown>,
        "id",
      );
      await session((run) => run(sql, values));
    },

    async softDeleteAgentAttachment(id, tenantId) {
      const rows = await session((run) =>
        run<{ id: string }>(
          `UPDATE ${AGENT_ATTACHMENT_TABLE} SET deleted_at = $1 ` +
            `WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL ` +
            `RETURNING id`,
          [new Date().toISOString(), id, tenantId],
        ),
      );
      return rows.length > 0 ? { id: rows[0].id } : null;
    },
  };
}

/**
 * Select the attachments write adapter for the configured (or explicitly
 * passed) plane. Defaults to Supabase — production write behavior unchanged.
 */
export function selectAttachmentsWriteAdapter(
  plane?: DataPlane,
): AttachmentsWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === "azure-postgres"
    ? createAzureAttachmentsWriteAdapter()
    : createSupabaseAttachmentsWriteAdapter();
}
