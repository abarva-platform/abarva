-- Admin Loader · Gate 0 — preserve the original in Azure Blob, retrievably.
-- Adds a durable Blob pointer + size to enterprise_context_source_files so every
-- ingested fact can resolve "show me the source" to the preserved original.
-- Idempotent; additive (no data change to existing rows).

BEGIN;

ALTER TABLE public.enterprise_context_source_files
  ADD COLUMN IF NOT EXISTS blob_container TEXT,
  ADD COLUMN IF NOT EXISTS blob_object_key TEXT,
  ADD COLUMN IF NOT EXISTS blob_url TEXT,
  ADD COLUMN IF NOT EXISTS byte_size BIGINT CHECK (byte_size IS NULL OR byte_size >= 0);

-- Find files that were committed WITHOUT a preserved Blob original (Gate 0 violations).
CREATE INDEX IF NOT EXISTS idx_ecsf_missing_blob
  ON public.enterprise_context_source_files (tenant_key)
  WHERE blob_url IS NULL;

COMMENT ON COLUMN public.enterprise_context_source_files.blob_url IS
  'Durable Azure Blob URI of the preserved original (Gate 0). New loads MUST set this; file_hash is the sha256 of those bytes.';

COMMIT;
