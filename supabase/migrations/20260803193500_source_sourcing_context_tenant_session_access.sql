-- Allow Source sourcing consumption projections to be read by trusted internal
-- runtimes that set an explicit tenant session context.
--
-- The views remain tenant-filtered through source.can_read_sourcing_tenant().
-- This only adds the same app.tenant_key session-context pattern used by other
-- Source/Tower layers; it does not remove tenant predicates from any view.

BEGIN;

CREATE OR REPLACE FUNCTION source.can_read_sourcing_tenant(candidate_tenant_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  runtime_role TEXT;
  allowed BOOLEAN;
  session_tenant_key TEXT;
  trusted_internal_reader BOOLEAN;
BEGIN
  IF candidate_tenant_key IS NULL OR candidate_tenant_key = '' THEN
    RETURN FALSE;
  END IF;

  IF to_regprocedure('auth.role()') IS NOT NULL THEN
    EXECUTE 'SELECT auth.role()' INTO runtime_role;
  ELSE
    runtime_role := current_user;
  END IF;

  IF runtime_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- app.tenant_key is a selector, not authorization. Only trusted internal
  -- database/operator principals may use it directly; authenticated product
  -- callers still flow through public.can_read_tenant_by_key below.
  session_tenant_key := current_setting('app.tenant_key', true);
  trusted_internal_reader :=
    current_user = 'postgres'
    OR has_schema_privilege(current_user, 'source', 'CREATE');

  IF trusted_internal_reader AND session_tenant_key = candidate_tenant_key THEN
    RETURN TRUE;
  END IF;

  IF to_regprocedure('public.can_read_tenant_by_key(text)') IS NOT NULL THEN
    EXECUTE 'SELECT public.can_read_tenant_by_key($1)' INTO allowed USING candidate_tenant_key;
    RETURN COALESCE(allowed, FALSE);
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION source.can_read_sourcing_tenant(TEXT) IS
  'Tenant access helper for Source sourcing consumption views. Allows service_role, trusted internal DB/operator principals with explicit app.tenant_key session context, or the canonical public.can_read_tenant_by_key helper.';

DO $source_sourcing_tenant_access_assertions$
DECLARE
  previous_tenant_key TEXT;
BEGIN
  previous_tenant_key := current_setting('app.tenant_key', true);

  PERFORM set_config('app.tenant_key', 'tenant-a', false);
  IF source.can_read_sourcing_tenant('tenant-b') THEN
    RAISE EXCEPTION 'source.can_read_sourcing_tenant allowed tenant-b while app.tenant_key was tenant-a';
  END IF;

  PERFORM set_config('app.tenant_key', COALESCE(previous_tenant_key, ''), false);
END;
$source_sourcing_tenant_access_assertions$;

COMMIT;
