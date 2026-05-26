// Uploads write adapter — Slice 3c (upload write routes).
//
// Routes the DB-write half of the generic file-upload routes behind the
// data-plane write seam:
//   - POST /api/tower/upload          (inserts + updates `uploaded_files`)
//   - POST /api/v1/nexus/upload       (inserts `uploaded_files`)
//
// SCOPE — the seam owns ONLY the Postgres row write. The Supabase Storage /
// Azure Blob upload of the file bytes is NOT a data-plane-write concern and
// stays in the route untouched, exactly as the sensitive-upload guard, auth,
// and RBAC do.
//
// Why this is NOT a `DataPlaneWriteAdapter.commit()` unit:
// `commit()`'s statement runner depends on a Supabase `data_plane_exec` RPC
// that does not exist in this codebase, so the default (Supabase) path cannot
// go through it. These are plain (non-append-only) row writes, so this module
// follows the `quarantine-audit-data-plane.ts` pattern instead: a domain
// module with a `supabase` (DEFAULT) implementation that uses the Supabase JS
// client directly and an `azure-postgres` implementation that uses a real
// transaction session — selected by the same `ABARVA_DATA_PLANE` env var.
//
// Default behavior is unchanged: with `ABARVA_DATA_PLANE` unset/`supabase`
// the inserted/updated rows are byte-faithful to the pre-seam `.insert()` /
// `.update()` calls lifted verbatim from the routes.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { getServerSupabase } from '@/lib/supabase-server';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

const UPLOADED_FILES_TABLE = 'uploaded_files';

/** Row body for a new `uploaded_files` record — snake_case, verbatim columns. */
export interface UploadedFileInsert {
  client_id: string;
  uploaded_by_person_id: string;
  file_name: string;
  file_size_bytes: number;
  storage_path: string;
  mime_type: string | null;
  ingestion_status?: string;
  metadata?: Record<string, unknown>;
}

/** Patch body for an `uploaded_files` post-classification update. */
export interface UploadedFileUpdate {
  data_type?: string | null;
  classification_confidence?: number | null;
  ingestion_status?: string;
  rows_total?: number | null;
  rows_ingested?: number | null;
  rows_failed?: number | null;
  parser_notes?: Record<string, unknown> | null;
  parsed_at?: string | null;
}

/**
 * Domain write adapter for the generic `uploaded_files` table. One physical
 * data plane per instance — `supabase` (default) or `azure-postgres`.
 */
export interface UploadsWriteAdapter {
  readonly plane: DataPlane;
  /** Insert a new uploaded-file row; returns the new id. */
  insertUploadedFile(row: UploadedFileInsert): Promise<{ id: string }>;
  /** Patch an existing uploaded-file row by id. */
  updateUploadedFile(id: string, patch: UploadedFileUpdate): Promise<void>;
}

type SupabaseFactory = () => SupabaseClient;

/** Supabase-backed uploads adapter — the DEFAULT path. */
export function createSupabaseUploadsWriteAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): UploadsWriteAdapter {
  return {
    plane: 'supabase',

    async insertUploadedFile(row) {
      const sb = getClient();
      const { data, error } = await sb
        .from(UPLOADED_FILES_TABLE)
        .insert(row)
        .select('id')
        .single();
      if (error) throw error;
      return { id: (data as { id: string }).id };
    },

    async updateUploadedFile(id, patch) {
      const sb = getClient();
      const { error } = await sb
        .from(UPLOADED_FILES_TABLE)
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
  };
}

/** Build an `INSERT ... RETURNING id` from a snake_case row body. */
function buildInsert(table: string, row: Record<string, unknown>): {
  sql: string;
  values: unknown[];
} {
  const keys = Object.keys(row);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  return {
    sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`,
    values: keys.map((k) => row[k]),
  };
}

/** Build an `UPDATE ... WHERE id = $n` from a snake_case patch body. */
function buildUpdateById(table: string, id: string, patch: Record<string, unknown>): {
  sql: string;
  values: unknown[];
} {
  const keys = Object.keys(patch);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  return {
    sql: `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1}`,
    values: [...keys.map((k) => patch[k]), id],
  };
}

/**
 * Azure Postgres uploads adapter — opt-in (`ABARVA_DATA_PLANE=azure-postgres`).
 * Each write runs inside a real `BEGIN`/`COMMIT` transaction.
 */
export function createAzureUploadsWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-uploads-write'),
): UploadsWriteAdapter {
  return {
    plane: 'azure-postgres',

    async insertUploadedFile(row) {
      const { sql, values } = buildInsert(
        UPLOADED_FILES_TABLE,
        row as unknown as Record<string, unknown>,
      );
      const rows = await session((run) => run<{ id: string }>(sql, values));
      return { id: rows[0].id };
    },

    async updateUploadedFile(id, patch) {
      const { sql, values } = buildUpdateById(
        UPLOADED_FILES_TABLE,
        id,
        patch as unknown as Record<string, unknown>,
      );
      await session((run) => run(sql, values));
    },
  };
}

/**
 * Select the uploads write adapter for the configured (or explicitly passed)
 * plane. Defaults to Supabase — production write behavior is unchanged.
 */
export function selectUploadsWriteAdapter(plane?: DataPlane): UploadsWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureUploadsWriteAdapter()
    : createSupabaseUploadsWriteAdapter();
}
