// Data-plane-routed quarantine audit data source — write-seam PROOF ROUTE.
//
// This is the foundation proof for the write-adapter seam
// (`src/lib/data-plane/write-adapters/`). The quarantine release / hard-delete
// lifecycle write is the cleanest possible proof: it is append-only — a NEW
// row pointing at the original via `parent_id`, never an update — which is
// exactly the `appendAudit` contract.
//
// `quarantine-audit-supabase.ts` keeps the original, hard-wired Supabase
// implementation untouched (used by the listing path and as the reference).
// This module reuses its parent-row lookup (a read — transitive per design
// doc §4) but routes the lifecycle INSERT through `selectWriteAdapter()`, so
// the same code path commits to Supabase today and to Azure Postgres after
// the cutover-flip — selected by `ABARVA_DATA_PLANE`, default `supabase`.
//
// The produced row is byte-faithful to the pre-seam `.insert()` body: the same
// snake_case columns, the same values. Default behavior is unchanged.

import { getServerSupabase } from '@/lib/supabase-server';
import { selectWriteAdapter } from '@/lib/data-plane/write-adapters';
import type { DataPlaneWriteAdapter } from '@/lib/data-plane/write-adapters';
import { supabaseQuarantineAuditDataSource } from './quarantine-audit-supabase';
import type {
  AuditQuery,
  QuarantineAuditDataSource,
  SensitiveUploadAuditRow,
} from './quarantine-audit-types';

const AUDIT_TABLE = 'sensitive_upload_audit';

/** The parent quarantine row, denormalized into each lifecycle entry. */
interface ParentRow {
  tenant_client_key: string;
  ingestion_tier: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
  purview_reached: boolean;
  purview_labels: unknown;
  storage_path: string | null;
}

/** Look up the parent quarantine row (a read — stays on Supabase, transitive). */
async function loadParent(id: string, failurePrefix: string): Promise<ParentRow> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from(AUDIT_TABLE)
    .select(
      'tenant_client_key, ingestion_tier, filename, mime_type, size_bytes, sha256, purview_reached, purview_labels, storage_path',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`${failurePrefix}_lookup_failed: ${error.message}`);
  if (!data) throw new Error('quarantine_audit_row_not_found');
  return data as ParentRow;
}

/**
 * Build the lifecycle-row column body. Identical shape to the verbatim
 * `.insert()` in `quarantine-audit-supabase.ts` — `parent_id` is supplied
 * separately by the write adapter, so it is omitted here.
 */
function lifecycleColumns(
  parent: ParentRow,
  opts: {
    patternDecision: 'allow' | 'quarantine';
    finalDecision: 'released' | 'hard_deleted';
    reviewerUserId: string;
    note?: string;
    reasonCodes: string[];
  },
): Record<string, unknown> {
  return {
    tenant_client_key: parent.tenant_client_key,
    ingestion_tier: parent.ingestion_tier,
    filename: parent.filename,
    mime_type: parent.mime_type,
    size_bytes: parent.size_bytes,
    sha256: parent.sha256,
    pattern_decision: opts.patternDecision,
    purview_reached: parent.purview_reached,
    purview_labels: Array.isArray(parent.purview_labels) ? parent.purview_labels : [],
    final_decision: opts.finalDecision,
    released_at: new Date().toISOString(),
    released_by: opts.reviewerUserId,
    release_note: opts.note ?? null,
    storage_path: parent.storage_path,
    reason_codes: opts.reasonCodes,
  };
}

/**
 * A quarantine audit data source whose lifecycle writes route through the
 * data-plane write seam. `list` delegates to the existing Supabase source
 * (a read; transitive migration is a later slice).
 *
 * The write adapter is injectable so tests drive it without a live backend.
 */
export function createDataPlaneQuarantineAuditDataSource(
  writeAdapter: DataPlaneWriteAdapter = selectWriteAdapter(),
): QuarantineAuditDataSource {
  return {
    async list(query: AuditQuery): Promise<ReadonlyArray<SensitiveUploadAuditRow>> {
      return supabaseQuarantineAuditDataSource.list(query);
    },

    async release({ id, reviewerUserId, note }): Promise<void> {
      const parent = await loadParent(id, 'quarantine_release');
      const result = await writeAdapter.appendAudit({
        table: AUDIT_TABLE,
        tenantKey: parent.tenant_client_key,
        actorUserId: reviewerUserId,
        parentId: id,
        // A retried release for the same parent must not double-insert.
        idempotencyKey: `quarantine_release:${id}`,
        columns: lifecycleColumns(parent, {
          patternDecision: 'allow',
          finalDecision: 'released',
          reviewerUserId,
          note,
          reasonCodes: [],
        }),
      });
      if (!result.ok) {
        throw new Error(
          `quarantine_release_insert_failed: ${result.reason}` +
            (result.detail ? ` (${result.detail})` : ''),
        );
      }
    },

    async hardDelete({ id, reviewerUserId, note }): Promise<void> {
      const parent = await loadParent(id, 'quarantine_hard_delete');
      const result = await writeAdapter.appendAudit({
        table: AUDIT_TABLE,
        tenantKey: parent.tenant_client_key,
        actorUserId: reviewerUserId,
        parentId: id,
        idempotencyKey: `quarantine_hard_delete:${id}`,
        columns: lifecycleColumns(parent, {
          patternDecision: 'quarantine',
          finalDecision: 'hard_deleted',
          reviewerUserId,
          note,
          reasonCodes: ['hard_deleted_by_reviewer'],
        }),
      });
      if (!result.ok) {
        throw new Error(
          `quarantine_hard_delete_insert_failed: ${result.reason}` +
            (result.detail ? ` (${result.detail})` : ''),
        );
      }
      // NOTE: the storage-blob deletion remains a separate per-tier concern,
      // unchanged from the pre-seam implementation.
    },
  };
}

/**
 * The default data-plane-routed quarantine audit data source. Honors
 * `ABARVA_DATA_PLANE` at module load — `supabase` unless explicitly opted out.
 */
export const dataPlaneQuarantineAuditDataSource: QuarantineAuditDataSource =
  createDataPlaneQuarantineAuditDataSource();
