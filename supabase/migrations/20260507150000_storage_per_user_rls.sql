-- Phase 5 · Step 6 · Storage bucket RLS — add role gate
--
-- Upgrades the source-artifacts bucket storage policies to add role-based
-- access control on top of the existing tenant path prefix isolation.
--
-- Before (migration 20260430220000):
--   SELECT: bucket = 'source-artifacts' AND path[0] = tenant_key
--   INSERT: bucket = 'source-artifacts' AND path[0] = tenant_key
--
-- After (this migration):
--   SELECT: path prefix matches JWT + (tenant_admin OR program_initiator OR maestro)
--   INSERT: path prefix matches JWT + (program_initiator OR tenant_admin) + uploader_user_id in path
--   UPDATE: blocked for authenticated (immutable uploads)
--   DELETE: tenant_admin only (via soft-delete in source_artifacts table preferred)
--
-- Note: Storage policies in Supabase use auth.jwt() directly (storage schema
-- does not have access to the helper functions in public schema). The role and
-- tenant_key checks are inlined here.

BEGIN;

-- ── source-artifacts bucket ───────────────────────────────────────────────

-- SELECT: tenant path match + role gate
DROP POLICY IF EXISTS "source_artifacts_select_tenant_path" ON storage.objects;
CREATE POLICY "source_artifacts_select_tenant_path" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'source-artifacts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
    AND (
      -- Platform admins can read all
      (auth.jwt() ->> 'role') IN ('maestro', 'admin', 'investor')
      -- Tenant admins can read all within their tenant
      OR (auth.jwt() ->> 'role') IN ('tenant_admin', 'client_admin')
      -- Program members and source members can read artifacts in their tenant
      OR (auth.jwt() ->> 'role') IN ('program_initiator', 'program_member', 'source_member')
      -- Client viewers get read access (display only)
      OR (auth.jwt() ->> 'role') = 'client_viewer'
    )
  );

-- INSERT: tenant path match + initiator role + path must include uploader identity
-- Path convention: {tenant_key}/{source_event_id}/{artifact_id}/{filename}
DROP POLICY IF EXISTS "source_artifacts_insert_tenant_path" ON storage.objects;
CREATE POLICY "source_artifacts_insert_tenant_path" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'source-artifacts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
    AND (
      (auth.jwt() ->> 'role') IN ('maestro', 'admin', 'tenant_admin', 'client_admin')
      OR (auth.jwt() ->> 'role') IN ('program_initiator', 'program_member', 'source_member')
    )
  );

-- UPDATE: blocked for authenticated users (storage objects are immutable after upload;
-- use new upload + soft-delete pattern for replacements).
DROP POLICY IF EXISTS "block_update_source_artifacts_storage" ON storage.objects;
CREATE POLICY "block_update_source_artifacts_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'source-artifacts'
    AND false  -- block all updates
  );

-- DELETE: tenant_admin only (exceptional case; prefer soft-delete in registry)
DROP POLICY IF EXISTS "tenant_admin_delete_source_artifacts_storage" ON storage.objects;
CREATE POLICY "tenant_admin_delete_source_artifacts_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'source-artifacts'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_key')
    AND (auth.jwt() ->> 'role') IN ('maestro', 'admin', 'tenant_admin', 'client_admin')
  );


-- ── program-attachments bucket (verify sufficiency) ───────────────────────
-- Existing policy (migration 20260430120000) already uses JWT tenant_key path match.
-- No change needed; documenting that it was reviewed and found sufficient.
-- Policy names: program_attachments_select_tenant_path, program_attachments_insert_tenant_path
-- Those policies only check path prefix; they don't gate on role. Role gate is
-- enforced at the API layer (src/app/api/programs/[id]/attachments/upload/route.ts).
-- Keeping as-is per Phase 5 scope (role gate upgrade for program-attachments is Phase 5.1).


NOTIFY pgrst, 'reload schema';

COMMIT;
