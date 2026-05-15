-- Sensitive-upload audit log · B5c data wiring
-- Backs the /admin/quarantine dashboard (PR #1955) + the audit-writer
-- port in the A2b consumer (PR #1954). Schema designed in
-- src/lib/security/quarantine-audit-types.ts.
--
-- Writes happen from:
--   - evaluateSensitiveUpload (sync, Tier-1) — to be wired in the
--     follow-on PR that migrates the 7 upload routes
--   - consumeOneMessage (async, Tier-2) — already accepts an
--     AuditWriter port; production wires it to this table
--   - evaluateSensitiveUploadWithPurview (B5b stub, PR #1957) — same
--
-- Release / hard-delete actions write their own append-only audit
-- rows; the original row is never UPDATEd. We track lifecycle via
-- separate rows keyed by parent_id, so the audit table is fully
-- append-only and SOC2-friendly.

BEGIN;

CREATE TABLE IF NOT EXISTS sensitive_upload_audit (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- For lifecycle rows (released / hard_deleted) this references the
  -- original audit row. NULL on the original ingest decision row.
  parent_id           UUID REFERENCES sensitive_upload_audit(id) ON DELETE NO ACTION,
  tenant_client_key   TEXT NOT NULL,
  evaluated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_tier      TEXT NOT NULL
    CHECK (ingestion_tier IN ('tier1_ui', 'tier2_blob', 'tier3_direct', 'tier4_in_vpc')),
  uploader_user_id    TEXT,
  filename            TEXT NOT NULL,
  mime_type           TEXT,
  size_bytes          BIGINT,
  sha256              TEXT,
  pattern_decision    TEXT NOT NULL
    CHECK (pattern_decision IN ('allow', 'quarantine')),
  purview_reached     BOOLEAN NOT NULL DEFAULT FALSE,
  purview_labels      JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_decision      TEXT NOT NULL
    CHECK (final_decision IN ('allow', 'quarantine', 'released', 'hard_deleted')),
  reason_codes        TEXT[] NOT NULL DEFAULT '{}',
  -- For lifecycle rows.
  released_at         TIMESTAMPTZ,
  released_by         TEXT,
  release_note        TEXT,
  -- Storage pointer; null for content that was rejected before write.
  storage_path        TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sensitive_upload_audit_tenant_evaluated_desc
  ON sensitive_upload_audit (tenant_client_key, evaluated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensitive_upload_audit_open_quarantine
  ON sensitive_upload_audit (tenant_client_key, evaluated_at DESC)
  WHERE final_decision = 'quarantine';

CREATE INDEX IF NOT EXISTS idx_sensitive_upload_audit_parent
  ON sensitive_upload_audit (parent_id)
  WHERE parent_id IS NOT NULL;

COMMENT ON TABLE sensitive_upload_audit IS
  'Append-only audit log for sensitive-upload guard decisions. Each ingestion writes one row with final_decision = ''allow'' or ''quarantine''. Subsequent Release / Hard-delete actions write NEW rows that point at the original via parent_id; the original row is never updated. SOC2 control evidence per docs/security/INFOSEC-ACCELERATOR.md.';

-- RLS: read scoped by tenant. Service-role does the writes from
-- application code (no public-role insert path).
ALTER TABLE sensitive_upload_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_read ON sensitive_upload_audit;
CREATE POLICY auth_read ON sensitive_upload_audit
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_client_key));

GRANT SELECT ON sensitive_upload_audit TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
