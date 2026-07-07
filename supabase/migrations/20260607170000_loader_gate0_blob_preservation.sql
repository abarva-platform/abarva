-- Admin Loader · Gate 0 — preserve the original in Azure Blob, retrievably.
-- Adds a durable Blob pointer + size to enterprise_context_source_files so every
-- ingested fact can resolve "show me the source" to the preserved original.
-- Idempotent + defensive: no-ops gracefully if the base table is absent in this
-- replay context (the table is created by 20260514100000_enterprise_context_layer);
-- in the real ordered migration the ALTER runs because that table already exists.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.enterprise_context_source_files') IS NULL THEN
    RAISE NOTICE 'enterprise_context_source_files absent in this replay; skipping Gate 0 columns';
    RETURN;
  END IF;

  ALTER TABLE public.enterprise_context_source_files
    ADD COLUMN IF NOT EXISTS blob_container TEXT,
    ADD COLUMN IF NOT EXISTS blob_object_key TEXT,
    ADD COLUMN IF NOT EXISTS blob_url TEXT,
    ADD COLUMN IF NOT EXISTS byte_size BIGINT;

  -- non-negative size guard (added separately to keep ADD COLUMN IF NOT EXISTS simple)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ecsf_byte_size_nonneg') THEN
    ALTER TABLE public.enterprise_context_source_files
      ADD CONSTRAINT ecsf_byte_size_nonneg CHECK (byte_size IS NULL OR byte_size >= 0);
  END IF;

  -- Find files that were committed WITHOUT a preserved Blob original (Gate 0 violations).
  CREATE INDEX IF NOT EXISTS idx_ecsf_missing_blob
    ON public.enterprise_context_source_files (tenant_key)
    WHERE blob_url IS NULL;

  COMMENT ON COLUMN public.enterprise_context_source_files.blob_url IS
    'Durable Azure Blob URI of the preserved original (Gate 0). New loads MUST set this; file_hash is the sha256 of those bytes.';
END $$;

COMMIT;
