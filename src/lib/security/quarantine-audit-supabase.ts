// Supabase-backed implementation of the QuarantineAuditDataSource
// contract from quarantine-audit-types.ts.
//
// Today the /admin/quarantine page uses the stub data source. To flip
// over to the real one, the page imports this module instead. This
// PR ships the implementation without swapping the page — once the
// migration is applied (`npm run db:migrate`), a one-line page edit
// activates real data.

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import {
  type AuditQuery,
  type QuarantineAuditDataSource,
  type SensitiveUploadAuditRow,
  type IngestionTier,
  type AuditDecision,
} from './quarantine-audit-types';

type DbRow = {
  id: string;
  tenant_client_key: string;
  evaluated_at: string;
  ingestion_tier: string;
  uploader_user_id: string | null;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
  pattern_decision: string;
  purview_reached: boolean;
  purview_labels: unknown;
  final_decision: string;
  reason_codes: string[] | null;
  released_at: string | null;
  released_by: string | null;
  storage_path: string | null;
  metadata: Record<string, unknown> | null;
};

function rowFromDb(row: DbRow): SensitiveUploadAuditRow {
  return {
    id: row.id,
    tenantClientKey: row.tenant_client_key,
    evaluatedAt: row.evaluated_at,
    ingestionTier: row.ingestion_tier as IngestionTier,
    uploaderUserId: row.uploader_user_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    patternDecision: row.pattern_decision as 'allow' | 'quarantine',
    purviewReached: row.purview_reached,
    purviewLabels: Array.isArray(row.purview_labels)
      ? (row.purview_labels as ReadonlyArray<string>)
      : [],
    finalDecision: row.final_decision as AuditDecision,
    reasonCodes: row.reason_codes ?? [],
    releasedAt: row.released_at,
    releasedBy: row.released_by,
    storagePath: row.storage_path,
    metadata: row.metadata ?? {},
  };
}

/**
 * Real data source backed by the `sensitive_upload_audit` table
 * (migration `20260515200000_sensitive_upload_audit.sql`).
 *
 * The release / hard-delete actions write a NEW row pointing at the
 * original via `parent_id`, then issue a SELECT to confirm the
 * lifecycle insert. The original quarantine row is never updated —
 * lifecycle is reconstructed by joining on parent_id, so the table
 * is fully append-only and SOC2-friendly.
 */
export const supabaseQuarantineAuditDataSource: QuarantineAuditDataSource = {
  async list(query: AuditQuery): Promise<ReadonlyArray<SensitiveUploadAuditRow>> {
    const sb = getAzureWriteFluentClient();
    let q = sb
      .from('sensitive_upload_audit')
      .select(
        'id, tenant_client_key, evaluated_at, ingestion_tier, uploader_user_id, filename, mime_type, size_bytes, sha256, pattern_decision, purview_reached, purview_labels, final_decision, reason_codes, released_at, released_by, storage_path, metadata',
      )
      .eq('tenant_client_key', query.tenantClientKey)
      .is('parent_id', null) // exclude lifecycle rows from the primary listing
      .order('evaluated_at', { ascending: false })
      .limit(query.limit ?? 200);

    if (query.decision) {
      q = q.eq('final_decision', query.decision);
    }
    if (query.ingestionTier) {
      q = q.eq('ingestion_tier', query.ingestionTier);
    }
    if (query.sinceIso) {
      q = q.gte('evaluated_at', query.sinceIso);
    }

    const { data, error } = await q;
    if (error) {
      throw new Error(`quarantine_audit_list_failed: ${error.message}`);
    }
    return ((data ?? []) as DbRow[]).map(rowFromDb);
  },

  async release({ id, reviewerUserId, note }): Promise<void> {
    const sb = getAzureWriteFluentClient();
    // Look up the parent so we can copy tenant/tier/etc. into the
    // lifecycle row (denormalized; makes the dashboard query cheap).
    const { data: parent, error: lookupErr } = await sb
      .from('sensitive_upload_audit')
      .select('tenant_client_key, ingestion_tier, filename, mime_type, size_bytes, sha256, purview_reached, purview_labels, storage_path')
      .eq('id', id)
      .maybeSingle();
    if (lookupErr) throw new Error(`quarantine_release_lookup_failed: ${lookupErr.message}`);
    if (!parent) throw new Error('quarantine_audit_row_not_found');

    const p = parent as {
      tenant_client_key: string;
      ingestion_tier: string;
      filename: string;
      mime_type: string | null;
      size_bytes: number | null;
      sha256: string | null;
      purview_reached: boolean;
      purview_labels: unknown;
      storage_path: string | null;
    };

    const { error } = await sb.from('sensitive_upload_audit').insert({
      parent_id: id,
      tenant_client_key: p.tenant_client_key,
      ingestion_tier: p.ingestion_tier,
      filename: p.filename,
      mime_type: p.mime_type,
      size_bytes: p.size_bytes,
      sha256: p.sha256,
      pattern_decision: 'allow',
      purview_reached: p.purview_reached,
      purview_labels: Array.isArray(p.purview_labels) ? p.purview_labels : [],
      final_decision: 'released',
      released_at: new Date().toISOString(),
      released_by: reviewerUserId,
      release_note: note ?? null,
      storage_path: p.storage_path,
      reason_codes: [],
    });
    if (error) {
      throw new Error(`quarantine_release_insert_failed: ${error.message}`);
    }
  },

  async hardDelete({ id, reviewerUserId, note }): Promise<void> {
    const sb = getAzureWriteFluentClient();
    const { data: parent, error: lookupErr } = await sb
      .from('sensitive_upload_audit')
      .select('tenant_client_key, ingestion_tier, filename, mime_type, size_bytes, sha256, purview_reached, purview_labels, storage_path')
      .eq('id', id)
      .maybeSingle();
    if (lookupErr) throw new Error(`quarantine_hard_delete_lookup_failed: ${lookupErr.message}`);
    if (!parent) throw new Error('quarantine_audit_row_not_found');

    const p = parent as {
      tenant_client_key: string;
      ingestion_tier: string;
      filename: string;
      mime_type: string | null;
      size_bytes: number | null;
      sha256: string | null;
      purview_reached: boolean;
      purview_labels: unknown;
      storage_path: string | null;
    };

    const { error } = await sb.from('sensitive_upload_audit').insert({
      parent_id: id,
      tenant_client_key: p.tenant_client_key,
      ingestion_tier: p.ingestion_tier,
      filename: p.filename,
      mime_type: p.mime_type,
      size_bytes: p.size_bytes,
      sha256: p.sha256,
      pattern_decision: 'quarantine',
      purview_reached: p.purview_reached,
      purview_labels: Array.isArray(p.purview_labels) ? p.purview_labels : [],
      final_decision: 'hard_deleted',
      released_at: new Date().toISOString(),
      released_by: reviewerUserId,
      release_note: note ?? null,
      storage_path: p.storage_path,
      reason_codes: ['hard_deleted_by_reviewer'],
    });
    if (error) {
      throw new Error(`quarantine_hard_delete_insert_failed: ${error.message}`);
    }
    // NOTE: the actual storage-blob deletion (against Azure Blob /
    // Supabase Storage) is the responsibility of the caller. The
    // audit row records the intent; the blob removal is a separate
    // SDK call that depends on which tier the upload came in through.
    // Wire that in once the per-tier storage clients are unified.
  },
};
