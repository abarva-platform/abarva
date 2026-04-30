-- Migration · OV2-4a · program_attachments + program-attachments Storage bucket
--
-- Why: Programs module redesign Section B.4 (cross-cutting concerns · file
-- uploads) and Part G (slice OV2-4) call for chat-window file uploads tied
-- to a program / phase / step / deliverable. This slice ships the data
-- layer only — table + RLS + Storage bucket + storage RLS. Follow-on
-- slices (OV2-4b/c/d) add the upload API, the virus-scan worker, and
-- the chat-window upload UI.
--
-- Pilot-readiness floor (Part F): tenant-scoped RLS at both table and
-- storage layer; mime allowlist + size cap enforced server-side; virus
-- scan hook field; soft-delete only; immutable user-side metadata.
--
-- Storage bucket convention — paths are
--   {tenant_key}/{program_id}/{attachment_id}/{safe_filename}
-- The first path segment carries the tenant_key; storage RLS uses that
-- prefix to enforce tenancy on the storage.objects rows.
--
-- Safety: re-runnable per CONTRIBUTING-MIGRATIONS.md four rules. Every
-- CREATE has IF NOT EXISTS; every CREATE POLICY is preceded by a
-- DROP POLICY IF EXISTS; the bucket insert + storage policies are
-- idempotent.
--
-- Depends on: engagements (002), Supabase managed `storage` schema.

BEGIN;

-- ── Table · program_attachments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  phase INT NULL,
  step_id TEXT NULL,
  deliverable_id UUID NULL,
  original_name TEXT NOT NULL,
  -- The path inside the program-attachments bucket. Convention:
  -- {tenant_key}/{program_id}/{attachment_id}/{safe_filename}.
  storage_path TEXT NOT NULL UNIQUE,
  uploader_user_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'pending',
  scan_findings JSONB NULL,
  redaction_state TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Soft-delete only; bucket cleanup is handled by retention policy.
  deleted_at TIMESTAMPTZ NULL
);

-- Defensive column adds — safe no-op if a prior migration created the
-- table with a narrower schema.
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS tenant_key TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS phase INT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS step_id TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS deliverable_id UUID;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS original_name TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS uploader_user_id TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS sha256 TEXT;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS scan_findings JSONB;
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS redaction_state TEXT NOT NULL DEFAULT 'none';
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE program_attachments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Constraints · phase range, size cap, scan_status, redaction_state ──
ALTER TABLE program_attachments
  DROP CONSTRAINT IF EXISTS program_attachments_phase_check;
DO $$ BEGIN
  ALTER TABLE program_attachments
    ADD CONSTRAINT program_attachments_phase_check
    CHECK (phase IS NULL OR (phase >= 0 AND phase <= 6));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE program_attachments
  DROP CONSTRAINT IF EXISTS program_attachments_size_bytes_check;
DO $$ BEGIN
  ALTER TABLE program_attachments
    ADD CONSTRAINT program_attachments_size_bytes_check
    CHECK (size_bytes > 0 AND size_bytes <= 104857600);  -- 100 MB cap
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE program_attachments
  DROP CONSTRAINT IF EXISTS program_attachments_scan_status_check;
DO $$ BEGIN
  ALTER TABLE program_attachments
    ADD CONSTRAINT program_attachments_scan_status_check
    CHECK (scan_status IN ('pending', 'clean', 'infected', 'errored', 'skipped'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE program_attachments
  DROP CONSTRAINT IF EXISTS program_attachments_redaction_state_check;
DO $$ BEGIN
  ALTER TABLE program_attachments
    ADD CONSTRAINT program_attachments_redaction_state_check
    CHECK (redaction_state IN ('none', 'partial', 'redacted'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

-- storage_path uniqueness is declared inline on CREATE TABLE; defensively
-- add a unique index in case the column was added later.
CREATE UNIQUE INDEX IF NOT EXISTS uq_program_attachments_storage_path
  ON program_attachments (storage_path);

-- ── Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_program_attachments_tenant_program
  ON program_attachments (tenant_key, program_id);

CREATE INDEX IF NOT EXISTS idx_program_attachments_phase
  ON program_attachments (program_id, phase) WHERE phase IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_attachments_uploader
  ON program_attachments (uploader_user_id);

-- ── Row-level security · table ────────────────────────────────────────
ALTER TABLE program_attachments ENABLE ROW LEVEL SECURITY;

-- Service role: full access (server API routes, virus-scan worker).
DROP POLICY IF EXISTS "service_role_all_program_attachments" ON program_attachments;
CREATE POLICY "service_role_all_program_attachments" ON program_attachments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SELECT · authenticated user can read attachments on programs they
-- can see (the engagements policy enforces program-tier visibility),
-- AND the row's tenant_key must match a program the user can see. We
-- defer tenant scoping to the engagements policy: if a user can SELECT
-- the engagements row, they can see the attachments. Uploader can
-- always see their own.
DROP POLICY IF EXISTS "authenticated_read_program_attachments" ON program_attachments;
CREATE POLICY "authenticated_read_program_attachments" ON program_attachments
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      uploader_user_id = (auth.jwt() ->> 'sub')
      OR program_id IN (SELECT id FROM engagements)
    )
  );

-- INSERT · authenticated user creating their own row only. The
-- uploader_user_id must match the JWT sub claim, and the program_id
-- must be one they can see (engagements RLS handles the visibility
-- check via the IN-subquery). tenant_key is enforced by the storage
-- path prefix at the storage layer.
DROP POLICY IF EXISTS "authenticated_insert_program_attachments" ON program_attachments;
CREATE POLICY "authenticated_insert_program_attachments" ON program_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    uploader_user_id = (auth.jwt() ->> 'sub')
    AND program_id IN (SELECT id FROM engagements)
  );

-- UPDATE · NO authenticated UPDATE policy. User uploads can never
-- re-write metadata. scan_status / scan_findings / redaction_state /
-- deleted_at are mutated only by the service role (virus-scan worker
-- + server-side soft-delete API). The absence of an UPDATE policy
-- for the authenticated role denies user UPDATEs by default.

-- DELETE · NO authenticated DELETE policy. Hard DELETE is blocked at
-- RLS. Soft-delete is service-role only via setting deleted_at.

GRANT SELECT, INSERT ON program_attachments TO authenticated;

-- ── Storage bucket · program-attachments ──────────────────────────────
-- Idempotent insert; ON CONFLICT DO NOTHING is the standard Supabase
-- pattern for ensuring the bucket exists. We deliberately keep public
-- = false; access is brokered via signed URLs from the upload API
-- (OV2-4b) using the service role.
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-attachments', 'program-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS · storage.objects for program-attachments ─────────────
-- Path convention: {tenant_key}/{program_id}/{attachment_id}/{filename}.
-- storage.objects.name carries the path; storage.foldername(name)
-- returns the segments as an array. We tenant-scope on segment 1
-- (tenant_key), via the JWT claim `tenant_key`. (The Clerk → Supabase
-- JWT template emits `tenant_key` in claims; if the claim is missing
-- the policy fails closed.)
--
-- This is the project's first storage RLS migration. Documented
-- carefully: if any future bucket needs the same model, copy the
-- policy block below verbatim and substitute the bucket id.

DROP POLICY IF EXISTS "program_attachments_select_tenant_path" ON storage.objects;
CREATE POLICY "program_attachments_select_tenant_path" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'program-attachments'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
  );

DROP POLICY IF EXISTS "program_attachments_insert_tenant_path" ON storage.objects;
CREATE POLICY "program_attachments_insert_tenant_path" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'program-attachments'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
  );

-- UPDATE · blocked at user level (immutable on write). NO policy for
-- the authenticated role => default-deny. Service role still
-- bypasses RLS for re-keying / migration ops.

-- DELETE · blocked at user level. Service-role only (retention +
-- soft-delete reconciler in OV2-4c). NO policy for authenticated.

-- Service-role full access is implicit in Supabase storage (service
-- role bypasses RLS), so no explicit service_role policy is needed
-- here — but documented for clarity.

NOTIFY pgrst, 'reload schema';

COMMIT;
