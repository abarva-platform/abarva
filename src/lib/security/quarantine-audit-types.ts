// Quarantine + audit dashboard types · B5c
//
// Shape of audit rows the dashboard renders. Today the data source
// is a typed stub (`loadQuarantineAuditRows` returns []). When B5b
// implementation lands, the actual writes start flowing from:
//   - `evaluateSensitiveUpload` (sync, Tier-1)
//   - `consumeOneMessage` (async, Tier-2, via the A2b consumer's
//     AuditWriter port)
//
// The same row schema covers both paths so the dashboard is
// single-source.
//
// Future Supabase table (proposed):
//
//   CREATE TABLE sensitive_upload_audit (
//     id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     tenant_client_key TEXT NOT NULL,
//     evaluated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     ingestion_tier    TEXT NOT NULL,            -- 'tier1_ui' | 'tier2_blob' | 'tier3_direct' | 'tier4_in_vpc'
//     uploader_user_id  TEXT,                     -- nullable for system-driven Tier 2/3
//     filename          TEXT NOT NULL,
//     mime_type         TEXT,
//     size_bytes        BIGINT,
//     sha256            TEXT,
//     pattern_decision  TEXT NOT NULL,            -- 'allow' | 'quarantine'
//     purview_reached   BOOLEAN NOT NULL DEFAULT FALSE,
//     purview_labels    JSONB NOT NULL DEFAULT '[]'::jsonb,
//     final_decision    TEXT NOT NULL,            -- 'allow' | 'quarantine' | 'released' | 'hard_deleted'
//     reason_codes      TEXT[] NOT NULL DEFAULT '{}',
//     released_at       TIMESTAMPTZ,
//     released_by       TEXT,
//     storage_path      TEXT,                     -- where the quarantined blob lives
//     metadata          JSONB DEFAULT '{}'::jsonb
//   );
//
//   CREATE INDEX ON sensitive_upload_audit (tenant_client_key, evaluated_at DESC);
//   CREATE INDEX ON sensitive_upload_audit (final_decision)
//     WHERE final_decision IN ('quarantine', 'released');
//
// Migration to be authored alongside the B5b implementation PR.

export type IngestionTier = 'tier1_ui' | 'tier2_blob' | 'tier3_direct' | 'tier4_in_vpc';
export type AuditDecision = 'allow' | 'quarantine' | 'released' | 'hard_deleted';

export interface SensitiveUploadAuditRow {
  readonly id: string;
  readonly tenantClientKey: string;
  readonly evaluatedAt: string; // ISO
  readonly ingestionTier: IngestionTier;
  readonly uploaderUserId: string | null;
  readonly filename: string;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly sha256: string | null;
  readonly patternDecision: 'allow' | 'quarantine';
  readonly purviewReached: boolean;
  readonly purviewLabels: ReadonlyArray<string>;
  readonly finalDecision: AuditDecision;
  readonly reasonCodes: ReadonlyArray<string>;
  readonly releasedAt: string | null;
  readonly releasedBy: string | null;
  readonly storagePath: string | null;
  readonly metadata: Record<string, unknown>;
}

/**
 * Filters supported by the dashboard. The data source MUST honor
 * tenantClientKey; everything else is optional UX.
 */
export interface AuditQuery {
  readonly tenantClientKey: string;
  readonly decision?: AuditDecision;
  readonly ingestionTier?: IngestionTier;
  readonly limit?: number;
  readonly sinceIso?: string;
}

/**
 * Data-source contract. Stubbed today; backed by Supabase once the
 * sensitive_upload_audit table is migrated.
 */
export interface QuarantineAuditDataSource {
  list(query: AuditQuery): Promise<ReadonlyArray<SensitiveUploadAuditRow>>;
  release(args: { id: string; reviewerUserId: string; note?: string }): Promise<void>;
  hardDelete(args: { id: string; reviewerUserId: string; note?: string }): Promise<void>;
}

/**
 * Stub implementation — returns nothing. The dashboard renders an
 * empty state with a banner explaining that the data source is not
 * yet wired. Swap this for a Supabase-backed implementation when
 * the migration lands.
 */
export const stubQuarantineAuditDataSource: QuarantineAuditDataSource = {
  async list() {
    return [];
  },
  async release() {
    throw new Error('quarantine_release_not_yet_wired');
  },
  async hardDelete() {
    throw new Error('quarantine_hard_delete_not_yet_wired');
  },
};
