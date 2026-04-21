-- Tower W3 · data_uploads
-- User-facing ingestion ledger. uploaded_files remains the lower-level audit
-- trail; data_uploads is the normalized Tower workflow table.

BEGIN;

CREATE TABLE IF NOT EXISTS data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  uploaded_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  upload_type TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual','integration','seed','system')),
  filename TEXT NOT NULL,
  file_size_bytes BIGINT,
  uploaded_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending','classifying','preview','parsing','committed','failed')),
  rows_processed INT,
  rows_committed INT,
  rows_rejected INT,
  error_report JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage_ref TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_data_uploads_client_uploaded
  ON data_uploads(client_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_uploads_processing_status
  ON data_uploads(processing_status, uploaded_at DESC);

ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_data_uploads" ON data_uploads;
CREATE POLICY "service_role_all_data_uploads" ON data_uploads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
