-- Tenant-scoped authenticated read coverage for Azure parallel-run RLS.
--
-- The L4 RLS regression suite intentionally connects as the downgraded
-- `authenticated` role and proves every tenant-scoped table either returns
-- only the caller tenant's rows or no rows. Older tables were service-role
-- only, and one legacy Source policy was accidentally granted to `public`.
--
-- This migration standardizes SELECT policies for public tables with one of
-- the recognized tenant identity columns:
--   tenant_key TEXT  -> can_read_tenant_by_key(tenant_key)
--   client_key TEXT  -> can_read_tenant_by_key(client_key)
--   client_id UUID/TEXT -> can_read_tenant_by_id(client_id)
--
-- It removes previous authenticated/public SELECT policies on those tables
-- before installing the normalized auth_read policy. Write policies are left
-- alone except for public ALL policies, which are never acceptable on
-- tenant-scoped data and are recreated as service_role-only policies.

BEGIN;

DO $tenant_scoped_read$
DECLARE
  v_table TEXT;
  v_col TEXT;
  v_policy RECORD;
  v_expr TEXT;
BEGIN
  FOR v_table, v_col IN
    SELECT
      c.relname,
      cols.column_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    JOIN LATERAL (
      SELECT column_name
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = c.relname
         AND column_name IN ('tenant_key', 'client_key', 'client_id')
       ORDER BY array_position(ARRAY['tenant_key','client_key','client_id']::text[], column_name)
       LIMIT 1
    ) cols ON TRUE
    WHERE c.relkind = 'r'
      AND c.relname NOT IN (
        'clients',
        'schema_migrations',
        'foundational_pattern_variants'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);

    -- Remove older authenticated/public SELECT policies that can either
    -- reference now-private helper tables or use stale tenant-key forms.
    FOR v_policy IN
      SELECT policyname, cmd, roles
        FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = v_table
         AND (
           (cmd = 'SELECT' AND ('authenticated' = ANY(roles) OR 'public' = ANY(roles)))
           OR (cmd = 'ALL' AND 'public' = ANY(roles))
         )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_table);
    END LOOP;

    -- Keep/reinstall service-role bypass explicitly scoped to service_role,
    -- not public. This also repairs legacy policies whose name implied
    -- service-role access but whose role set was actually {public}.
    EXECUTE format('DROP POLICY IF EXISTS service_role_all_%I ON public.%I', v_table, v_table);
    EXECUTE format('DROP POLICY IF EXISTS svc_all ON public.%I', v_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'service_role_all_' || v_table,
      v_table
    );
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', v_table);

    IF v_col IN ('tenant_key', 'client_key') THEN
      v_expr := format('can_read_tenant_by_key(%I)', v_col);
    ELSE
      v_expr := 'can_read_tenant_by_id(client_id)';
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS auth_read ON public.%I', v_table);
    EXECUTE format(
      'CREATE POLICY auth_read ON public.%I FOR SELECT TO authenticated USING (%s)',
      v_table,
      v_expr
    );
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_table);
  END LOOP;
END
$tenant_scoped_read$;

NOTIFY pgrst, 'reload schema';

COMMIT;
