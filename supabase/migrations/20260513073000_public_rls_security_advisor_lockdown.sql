-- Emergency Supabase Security Advisor remediation.
--
-- Addresses:
--   - rls_disabled_in_public
--   - sensitive_columns_exposed
--
-- Posture:
--   The app talks to Supabase through server-side API/read-model code using
--   SUPABASE_SERVICE_ROLE_KEY. Browser clients should not have direct anon or
--   authenticated table access to these legacy/program/reasoning tables.
--
-- Supabase's Security Advisor flags public-schema tables without RLS because
-- exposed Data API roles can otherwise read/write them with the anon key.

BEGIN;

DO $$
DECLARE
  table_name TEXT;
  table_names TEXT[] := ARRAY[
    'emergent_patterns',
    'founder_approval_requests',
    'intelligence_artifacts',
    'intelligence_thread_turns',
    'intelligence_threads',
    'invoices',
    'maestro_oversight_flags',
    'module_state_log',
    'org_data_version',
    'pattern_match_logs',
    'phase_snapshots',
    'portfolio_signals',
    'program_milestones',
    'program_modules',
    'program_origination_drafts',
    'program_risks',
    'program_threads',
    'program_work_items',
    'reasoning_alert_states',
    'reasoning_evidence_ingestions',
    'reasoning_mission_states',
    'reasoning_resolved_contradictions',
    'reasoning_telemetry_events',
    'schema_migrations',
    'team_memberships',
    'teams',
    'user_bookmarks',
    'user_pinned_signals'
  ];
BEGIN
  FOREACH table_name IN ARRAY table_names LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'service_role_all_' || table_name, table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'service_role_all_' || table_name,
      table_name
    );

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END $$;

-- Defense in depth for future public tables created by migration owners.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
