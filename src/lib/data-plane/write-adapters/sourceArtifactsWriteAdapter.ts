// Source-artifacts domain write adapter (write seam — Slice 3f).
//
// Backs the single physical insert inside the shared helper
// `registerSourceArtifactUpload` (src/lib/source/artifact-registry/index.ts).
// That helper is called by BOTH source artifact write routes:
//   - POST /api/v1/source/:eventId/artifacts/generate
//   - POST /api/v1/source/:eventId/artifacts/upload
// Migrating the helper migrates both routes at once — Slice 3b deliberately
// deferred it because it is a shared helper (see sourceWriteAdapter.ts header).
//
// The helper keeps its validation, MIME allowlist, size guardrails and
// row→record mapping; the adapter owns ONLY the `source_artifacts` INSERT and
// returns the inserted row so the helper can map it to its record shape.
// Supabase stays the default; `azure-postgres` is opt-in via `ABARVA_DATA_PLANE`
// and runs the insert inside a real `BEGIN`/`COMMIT` (design doc §2).

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { createTxSession, type TxSessionRunner } from '../read-adapters/azureSession';
import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import type { DataPlane } from './types';

// --- write input ------------------------------------------------------------

/**
 * The `source_artifacts` row body, snake_case column names exactly as the
 * pre-seam helper shaped them. `null` values are explicit so the produced row
 * is byte-faithful on either plane.
 */
export interface SourceArtifactInsertColumns {
  readonly id?: string;
  readonly tenant_key: string;
  readonly source_event_id: string;
  readonly source_event_row_id: string | null;
  readonly stage_key: string;
  readonly artifact_family: string;
  readonly artifact_kind: string;
  readonly source_origin: string;
  readonly source_format: string;
  readonly original_name: string;
  readonly blob_uri: string;
  readonly uploader_user_id: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly sha256: string;
  readonly data_classification: string;
  /**
   * GAP-9 · serialized disclosure-classification flag (a value object) or
   * `null` when the artifact carries no disclosure marking. Persisted to the
   * `source_artifacts.disclosure_classification` JSONB column.
   */
  readonly disclosure_classification: Record<string, unknown> | null;
  readonly created_by: string;
  readonly supersedes_artifact_version_id: string | null;
}

/** A write outcome — `ok:false` carries an error the helper turns into a throw. */
export interface SourceArtifactWriteOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

// --- adapter contract -------------------------------------------------------

/** The source-artifacts write adapter for one physical data plane. */
export interface SourceArtifactsWriteAdapter {
  readonly name: DataPlane;
  /**
   * Insert one `source_artifacts` row and return it. The select column set is
   * caller-supplied so the helper keeps its single source of truth for
   * `SELECT_COLUMNS`. On a DB error returns `ok:false` — the helper re-throws.
   */
  insertArtifact(
    columns: SourceArtifactInsertColumns,
    /** Caller's `SELECT_COLUMNS` projection — a comma-joined column list. */
    selectColumns: string,
  ): Promise<SourceArtifactWriteOutcome<Record<string, unknown>>>;
}

// --- Supabase adapter (DEFAULT) --------------------------------------------

export type SupabaseFactory = () => SupabaseClient;

/**
 * Build the Supabase source-artifacts write adapter. The `.insert()` is the
 * verbatim pre-seam call, so the produced row is byte-faithful. The client
 * factory is injectable so tests drive it without a backend.
 */
export function createSupabaseSourceArtifactsWriteAdapter(
  getClient: SupabaseFactory = getAzureWriteFluentClient,
): SourceArtifactsWriteAdapter {
  return {
    name: 'supabase',

    async insertArtifact(columns, selectColumns) {
      void canonicalTenantKey(columns.tenant_key);
      const { id, ...rest } = columns;
      const row = id ? { id, ...rest } : { ...rest };
      const { data, error } = await getClient()
        .from('source_artifacts')
        .insert(row)
        .select(selectColumns)
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: data as unknown as Record<string, unknown> };
    },
  };
}

// --- Azure Postgres adapter (opt-in) ---------------------------------------

/**
 * Build the Azure Postgres source-artifacts write adapter. Mirrors the
 * Supabase row column-for-column; the INSERT runs inside a real
 * `BEGIN`/`COMMIT` transaction. The session is injectable for tests.
 */
export function createAzureSourceArtifactsWriteAdapter(
  session: TxSessionRunner = createTxSession('abarva-data-plane-source-artifacts-write'),
): SourceArtifactsWriteAdapter {
  return {
    name: 'azure-postgres',

    async insertArtifact(columns, selectColumns) {
      void canonicalTenantKey(columns.tenant_key);
      try {
        // Build the column list dynamically so an optional `id` is honored.
        const entries = Object.entries(columns).filter(([, v]) => v !== undefined);
        const colNames = entries.map(([k]) => k);
        const placeholders = entries.map((_, i) => `$${i + 1}`);
        const values = entries.map(([, v]) => v);
        const returning = selectColumns;
        const rows = await session((run) =>
          run<Record<string, unknown>>(
            `INSERT INTO source_artifacts (${colNames.join(', ')}) `
              + `VALUES (${placeholders.join(', ')}) RETURNING ${returning}`,
            values,
          ),
        );
        if (!rows[0]) return { ok: false, error: 'source_artifacts insert returned no row' };
        return { ok: true, data: rows[0] };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  };
}

// --- selection --------------------------------------------------------------

/**
 * Select the source-artifacts write adapter for the configured (or explicitly
 * passed) plane. Defaults to Supabase — production write behavior is unchanged.
 */
export function selectSourceArtifactsWriteAdapter(
  plane?: DataPlane,
): SourceArtifactsWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? createAzureSourceArtifactsWriteAdapter()
    : createSupabaseSourceArtifactsWriteAdapter();
}
