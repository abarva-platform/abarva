-- Packet 18 onboarding upload session ledger.
-- Persists upload -> parse -> validate -> confirm -> commit state so pilot
-- onboarding never depends on app-tier memory.

BEGIN;

CREATE TABLE IF NOT EXISTS onboarding_upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_by TEXT,
  original_filename TEXT NOT NULL,
  pack_kind TEXT NOT NULL,
  pack_version TEXT,
  status TEXT NOT NULL DEFAULT 'validated'
    CHECK (status IN ('uploaded','parsing','validated','validation_failed','committing','committed','commit_failed')),
  row_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  parsed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  commit_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_report JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onboarding_upload_sessions_tenant_created
  ON onboarding_upload_sessions(tenant_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_upload_sessions_status
  ON onboarding_upload_sessions(status, updated_at DESC);

ALTER TABLE onboarding_upload_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_onboarding_upload_sessions" ON onboarding_upload_sessions;
CREATE POLICY "service_role_all_onboarding_upload_sessions" ON onboarding_upload_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
