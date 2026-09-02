-- ────────────────────────────────────────────────────────────────────────────
-- L4 · SQL-level RLS regression suite
-- ────────────────────────────────────────────────────────────────────────────
-- Asserts that Postgres-side Row Level Security holds for every tenant-scoped
-- table in the public schema. This is the SQL counterpart to the curl-level
-- cross-tenant probes at tests/security/sec-p0-cross-tenant-probes.sh — it
-- exercises RLS directly on the database tier, without going through the API.
--
-- What this script asserts:
--
--   1.  For each canonical tenant supplied by scripts/run-rls-regression.ts:
--         a. Connect as the authenticated role with the tenant's JWT claim.
--         b. For every tenant-readable table (discovered dynamically from
--            information_schema), SELECT count(*) and verify ALL rows belong
--            to the caller's tenant (i.e. no other tenant's rows leak).
--         c. Verify cross-tenant blocking: a query for another tenant's key
--            returns zero rows (RLS silently filters, NOT a permission denied).
--         d. Known service-role-only tables may return permission denied;
--            those are classified separately and do not count as green tenant
--            reads.
--
--   2.  service_role bypass: connecting as service_role can see all tenants
--       (confirms that backend code paths still work end-to-end).
--
-- Failure mode:
--   Every violation calls RAISE EXCEPTION inside a DO block, which aborts the
--   surrounding transaction. The TypeScript runner (scripts/run-rls-regression.ts)
--   wraps execution in a transaction and reports the exception. Non-zero exit
--   on any failure → CI fails → release blocks.
--
-- Idempotency:
--   100% SELECT-only. No INSERT/UPDATE/DELETE. Safe to run against any
--   environment, including production. Re-runnable as often as needed.
--
-- Adding a new tenant-scoped table:
--   No code change required if the new table follows one of the supported
--   shapes (tenant_key TEXT, client_key TEXT, or client_id UUID referencing
--   clients.id). The script auto-discovers them via information_schema.
--   See docs/security/RLS-REGRESSION-RUNBOOK.md for the recipe.
--
-- ────────────────────────────────────────────────────────────────────────────

-- Sanity check: ensure the RLS helpers and Postgres roles we depend on exist.
DO $rls_prereqs$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_tenant_key') THEN
    RAISE EXCEPTION
      'RLS helper current_tenant_key() not found. Apply supabase/migrations/20260507100000_rls_role_helpers.sql first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION
      'Postgres role "authenticated" missing. On Azure lab, run the Supabase-compat bootstrap script first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION
      'Postgres role "service_role" missing. On Azure lab, run the Supabase-compat bootstrap script first.';
  END IF;
END
$rls_prereqs$;

-- ── State scratchpad ─────────────────────────────────────────────────────────
-- We accumulate findings into a TEMP table so the final summary RAISE NOTICE
-- block can print one row per (tenant, table) pair. Truncated at end of session.
CREATE TEMP TABLE rls_regression_findings (
  tenant_key      TEXT NOT NULL,
  table_name      TEXT NOT NULL,
  tenant_col      TEXT NOT NULL,        -- 'tenant_key' | 'client_key' | 'client_id'
  visible_rows    BIGINT NOT NULL,      -- count(*) the tenant sees
  foreign_rows    BIGINT NOT NULL,      -- rows in visible set that belong to OTHER tenants
  cross_tenant_leak BIGINT NOT NULL,    -- rows visible when explicitly querying OTHER tenant's key
  status          TEXT NOT NULL         -- 'pass' | 'leak' | 'empty' | 'service_role_only' | 'error:*'
) ON COMMIT DROP;

-- The probe loop intentionally switches to SET LOCAL ROLE authenticated to
-- exercise the same RLS boundary tenant users hit. Temp tables are owned by
-- the admin connection that launches the suite, so grant the downgraded role
-- access to the scratchpad before switching roles.
GRANT INSERT ON rls_regression_findings TO authenticated;

-- ── Canonical tenant list ────────────────────────────────────────────────────
-- scripts/run-rls-regression.ts supplies rls_regression_expected_tenants from
-- CANONICAL_TENANT_KEYS. Keep tenant identity code-derived; do not hand-type
-- tenant keys or aliases here.
DO $verify_expected_tenants_source$
BEGIN
  IF to_regclass('pg_temp.rls_regression_expected_tenants') IS NULL THEN
    RAISE EXCEPTION
      'RLS regression expected tenants were not supplied. Run this suite through scripts/run-rls-regression.ts.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM rls_regression_expected_tenants) THEN
    RAISE EXCEPTION
      'RLS regression expected tenants were not supplied. CANONICAL_TENANT_KEYS resolved to an empty set.';
  END IF;
END
$verify_expected_tenants_source$;

CREATE TEMP TABLE rls_regression_tenants (
  tenant_key TEXT PRIMARY KEY,
  client_id  UUID
) ON COMMIT DROP;

GRANT SELECT ON rls_regression_tenants TO authenticated;

INSERT INTO rls_regression_tenants (tenant_key, client_id)
SELECT t.tenant_key, c.id
  FROM rls_regression_expected_tenants t
  LEFT JOIN public.clients c ON c.tenant_key = t.tenant_key;

-- Verify we resolved a client UUID for every canonical key. Without these we
-- cannot exercise the UUID-based variant of the policies.
DO $verify_tenants$
DECLARE
  missing TEXT;
BEGIN
  SELECT string_agg(tenant_key, ', ')
    INTO missing
    FROM rls_regression_tenants
   WHERE client_id IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION
      'Canonical tenant(s) % missing from clients table. Run db:migrate + canonicalization migration before this suite.',
      missing;
  END IF;
END
$verify_tenants$;

-- ── Tenant-scoped table catalogue ────────────────────────────────────────────
-- Auto-discovered. Any public.* table containing one of the recognized tenant-
-- identity columns enters the catalogue.
CREATE TEMP TABLE rls_regression_tables (
  table_name TEXT PRIMARY KEY,
  tenant_col TEXT NOT NULL,
  rls_enabled BOOLEAN NOT NULL,
  policy_count INTEGER NOT NULL
) ON COMMIT DROP;

GRANT SELECT ON rls_regression_tables TO authenticated;

INSERT INTO rls_regression_tables (table_name, tenant_col, rls_enabled, policy_count)
SELECT
  c.relname,
  cols.column_name,
  c.relrowsecurity,
  COALESCE((
    SELECT COUNT(*)::INTEGER FROM pg_policies p
     WHERE p.tablename = c.relname AND p.schemaname = 'public'
  ), 0)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
JOIN LATERAL (
  -- Prefer tenant_key, then client_key, then client_id (UUID) — first match wins.
  SELECT column_name
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = c.relname
     AND column_name IN ('tenant_key', 'client_key', 'client_id')
   ORDER BY array_position(ARRAY['tenant_key','client_key','client_id']::text[], column_name)
   LIMIT 1
) cols ON TRUE
WHERE c.relkind = 'r'
  -- Exclude tables that are clearly not tenant-scoped substrate (registry/
  -- catalogue tables that hold cross-tenant taxonomies). Add to this list
  -- only if a follow-up review confirms global scope.
  AND c.relname NOT IN (
    'clients',                            -- the tenant directory itself
    'schema_migrations',                  -- migration ledger
    'foundational_pattern_variants'       -- cross-tenant taxonomy w/ mixed keys
  );

-- Known service-role-only tables are tenant-scoped but intentionally not
-- directly readable by the downgraded authenticated role in the current
-- production posture. Classify their 42501 permission-denied result honestly
-- instead of treating it as a tenant leak or as a green tenant-readable pass.
CREATE TEMP TABLE rls_regression_service_role_only_tables (
  table_name TEXT PRIMARY KEY
) ON COMMIT DROP;

GRANT SELECT ON rls_regression_service_role_only_tables TO authenticated;

INSERT INTO rls_regression_service_role_only_tables (table_name)
VALUES
  ('data_ingestion_runs'),
  ('data_inventory_audit_log'),
  ('data_inventory_segments'),
  ('data_segment_compliance'),
  ('data_segment_cross_program_signals'),
  ('data_segment_enterprise_profile'),
  ('data_segment_evidence_ledger'),
  ('data_segment_industry_context'),
  ('data_segment_it_financials'),
  ('data_segment_it_landscape'),
  ('data_segment_kpi_dictionary'),
  ('data_segment_operating_telemetry'),
  ('data_segment_org_structure'),
  ('data_segment_program_deliverables'),
  ('data_segment_program_inventory'),
  ('data_segment_sourcing_artifacts'),
  ('data_segment_vendor_contracts'),
  ('enterprise_context_chunks'),
  ('enterprise_graph_edges'),
  ('enterprise_graph_nodes'),
  ('instrument_template_audit'),
  ('instrument_template_review_state'),
  ('instrument_template_versions'),
  ('instrument_templates'),
  ('onboarding_upload_sessions'),
  ('platform_notification_deliveries'),
  ('platform_notification_events'),
  ('tenant_expected_baselines'),
  ('tower_ai_tool_usage'),
  ('tower_cloud_cost'),
  ('tower_cmdb_cis'),
  ('tower_cmdb_dependencies'),
  ('tower_dora_metrics'),
  ('tower_itsm_records'),
  ('tower_jira_issues'),
  ('tower_program_financials'),
  ('tower_vendor_spend'),
  ('tower_workforce');

-- Report discovery count via NOTICE so the runner can show it.
DO $report_discovery$
DECLARE
  n_tables INTEGER;
  n_no_rls INTEGER;
BEGIN
  SELECT COUNT(*) INTO n_tables FROM rls_regression_tables;
  SELECT COUNT(*) INTO n_no_rls FROM rls_regression_tables WHERE NOT rls_enabled;
  RAISE NOTICE 'rls-regression: discovered % tenant-scoped tables (% without RLS enabled)', n_tables, n_no_rls;
END
$report_discovery$;

-- ── Probe runner ─────────────────────────────────────────────────────────────
-- For each (tenant, table) pair, run the SELECT under the authenticated role
-- with the JWT claim set to the tenant's key, and verify:
--   * Visible rows belong to the caller's tenant only.
--   * Querying another tenant's key explicitly returns zero rows.
--
-- We use set_config(..., is_local=true) inside a single transaction so the
-- JWT claim and ROLE state are scoped to this transaction and reset at COMMIT.
DO $run_probes$
DECLARE
  v_tenant     RECORD;
  v_table      RECORD;
  v_visible    BIGINT;
  v_foreign    BIGINT;
  v_leak       BIGINT;
  v_sql        TEXT;
  v_filter_col TEXT;
  v_other_key  TEXT;
  v_other_client_id UUID;
  v_status     TEXT;
BEGIN
  FOR v_tenant IN SELECT tenant_key, client_id FROM rls_regression_tenants LOOP

    -- Switch to authenticated role with this tenant's JWT claim.
    -- request.jwt.claims is the canonical PostgREST/Supabase claim slot; the
    -- RLS helpers (current_tenant_key, current_user_role) read it through
    -- current_setting('request.jwt.claims', true). is_local=true scopes the
    -- value to this transaction and resets it automatically at COMMIT.
    PERFORM set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'tenant_key', v_tenant.tenant_key,
        'role',       'observer',          -- least-privileged role
        'sub',        'rls-regression-runner'
      )::text,
      true
    );
    SET LOCAL ROLE authenticated;

    FOR v_table IN SELECT table_name, tenant_col, rls_enabled FROM rls_regression_tables LOOP
      v_filter_col := v_table.tenant_col;

      -- Pick an other-tenant key to use for the cross-tenant probe.
      SELECT tenant_key, client_id INTO v_other_key, v_other_client_id
        FROM rls_regression_tenants
       WHERE tenant_key <> v_tenant.tenant_key
       LIMIT 1;

      v_visible := 0;
      v_foreign := 0;
      v_leak := 0;
      v_status := 'pass';

      -- (1) Count visible rows for this tenant.
      v_sql := format('SELECT COUNT(*) FROM public.%I', v_table.table_name);
      BEGIN
        EXECUTE v_sql INTO v_visible;
      EXCEPTION WHEN insufficient_privilege THEN
        IF EXISTS (
          SELECT 1
            FROM rls_regression_service_role_only_tables
           WHERE table_name = v_table.table_name
        ) THEN
          INSERT INTO rls_regression_findings VALUES (
            v_tenant.tenant_key, v_table.table_name, v_filter_col,
            -1, -1, -1, 'service_role_only'
          );
        ELSE
          INSERT INTO rls_regression_findings VALUES (
            v_tenant.tenant_key, v_table.table_name, v_filter_col,
            -1, -1, -1, 'error: ' || SQLERRM
          );
        END IF;
        CONTINUE;
      WHEN OTHERS THEN
        INSERT INTO rls_regression_findings VALUES (
          v_tenant.tenant_key, v_table.table_name, v_filter_col,
          -1, -1, -1, 'error: ' || SQLERRM
        );
        CONTINUE;
      END;

      -- (2) Count rows in the visible set that belong to OTHER tenants.
      --     This is the leak detector. Three column shapes to handle.
      IF v_filter_col = 'client_id' THEN
        -- client_id appears in two historical shapes:
        --   * UUID FK to clients.id
        --   * TEXT tenant slug, e.g. session_messages.client_id
        -- Do not join public.clients here: the probe is running as the
        -- downgraded authenticated role and tenant users should not need
        -- broad access to the tenant directory. Compare against the canonical
        -- UUID/key pair already resolved in the admin-owned temp table.
        v_sql := format(
          'SELECT COUNT(*) FROM public.%I
            WHERE client_id::text IS DISTINCT FROM %L
              AND client_id::text IS DISTINCT FROM %L',
          v_table.table_name,
          v_tenant.client_id::text,
          v_tenant.tenant_key
        );
      ELSE
        -- TEXT variant (tenant_key or client_key).
        v_sql := format(
          'SELECT COUNT(*) FROM public.%I WHERE %I IS DISTINCT FROM %L',
          v_table.table_name, v_filter_col, v_tenant.tenant_key
        );
      END IF;
      BEGIN
        EXECUTE v_sql INTO v_foreign;
      EXCEPTION WHEN OTHERS THEN
        v_foreign := -1;
      END;

      -- (3) Cross-tenant explicit probe: query for the OTHER tenant's key.
      --     RLS should filter silently. Expectation: zero rows.
      IF v_filter_col = 'client_id' THEN
        v_sql := format(
          'SELECT COUNT(*) FROM public.%I
            WHERE client_id::text IN (%L, %L)',
          v_table.table_name,
          v_other_client_id::text,
          v_other_key
        );
      ELSE
        v_sql := format(
          'SELECT COUNT(*) FROM public.%I WHERE %I = %L',
          v_table.table_name, v_filter_col, v_other_key
        );
      END IF;
      BEGIN
        EXECUTE v_sql INTO v_leak;
      EXCEPTION WHEN OTHERS THEN
        v_leak := -1;
      END;

      -- Classify the result.
      IF v_foreign > 0 OR v_leak > 0 THEN
        v_status := 'leak';
      ELSIF v_visible = 0 THEN
        v_status := 'empty';   -- not a failure on its own; informational
      ELSE
        v_status := 'pass';
      END IF;

      INSERT INTO rls_regression_findings VALUES (
        v_tenant.tenant_key, v_table.table_name, v_filter_col,
        v_visible, v_foreign, v_leak, v_status
      );
    END LOOP;

    -- Reset for next tenant iteration.
    RESET ROLE;
  END LOOP;
END
$run_probes$;

-- ── service_role bypass check ────────────────────────────────────────────────
-- Verify that backend code paths (which run as service_role) still see data
-- across all tenants. If this regresses, every server route that bypasses
-- RLS is silently broken — failure mode that the curl-level probes miss.
DO $service_role_check$
DECLARE
  v_total        BIGINT;
  v_distinct_tk  BIGINT;
BEGIN
  SET LOCAL ROLE service_role;

  -- Use clients as the canary: every environment has at least 3 rows and
  -- the table is in the unconditional bypass for service_role.
  SELECT COUNT(*), COUNT(DISTINCT tenant_key)
    INTO v_total, v_distinct_tk
    FROM public.clients
   WHERE tenant_key IS NOT NULL;

  IF v_distinct_tk < 1 THEN
    RAISE EXCEPTION
      'service_role bypass appears broken: clients table returns 0 distinct tenant_keys (saw % rows)',
      v_total;
  END IF;

  RAISE NOTICE 'rls-regression: service_role sees % clients across % tenant(s) — bypass OK',
    v_total, v_distinct_tk;

  RESET ROLE;
END
$service_role_check$;

-- ── Summary and assertion ────────────────────────────────────────────────────
-- Pretty-print the findings table and RAISE EXCEPTION if any (tenant, table)
-- pair is classified as 'leak' or 'error:*'. 'empty' rows are reported but
-- not treated as failures — a seed-light environment is allowed.
DO $summary$
DECLARE
  v_row    RECORD;
  v_leaks  INTEGER;
  v_errs   INTEGER;
  v_empty  INTEGER;
  v_pass   INTEGER;
  v_service_only INTEGER;
  v_total_visible BIGINT;
BEGIN
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE 'RLS regression findings (tenant · table · column · visible · foreign · cross · status)';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  FOR v_row IN
    SELECT tenant_key, table_name, tenant_col,
           visible_rows, foreign_rows, cross_tenant_leak, status
      FROM rls_regression_findings
     ORDER BY (status <> 'pass') DESC, tenant_key, table_name
  LOOP
    RAISE NOTICE '%  %  %  visible=%  foreign=%  cross=%  [%]',
      rpad(v_row.tenant_key, 16),
      rpad(v_row.table_name, 50),
      rpad(v_row.tenant_col, 12),
      lpad(v_row.visible_rows::text, 8),
      lpad(v_row.foreign_rows::text, 8),
      lpad(v_row.cross_tenant_leak::text, 6),
      v_row.status;
  END LOOP;
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  SELECT
    COUNT(*) FILTER (WHERE status = 'pass'),
    COUNT(*) FILTER (WHERE status = 'leak'),
    COUNT(*) FILTER (WHERE status LIKE 'error:%'),
    COUNT(*) FILTER (WHERE status = 'empty'),
    COUNT(*) FILTER (WHERE status = 'service_role_only'),
    COALESCE(SUM(visible_rows) FILTER (WHERE visible_rows > 0), 0)
   INTO v_pass, v_leaks, v_errs, v_empty, v_service_only, v_total_visible
   FROM rls_regression_findings;

  RAISE NOTICE 'rls-regression: pass=% leak=% error=% empty=% service_role_only=%',
    v_pass, v_leaks, v_errs, v_empty, v_service_only;

  IF v_leaks > 0 OR v_errs > 0 THEN
    RAISE EXCEPTION
      'RLS regression failed: % leak(s), % error(s). Inspect the findings table above. Do NOT release until green.',
      v_leaks, v_errs;
  END IF;

  RAISE NOTICE 'rls-regression: ALL GREEN — tenant isolation holding across % rows in % tenant-readable findings; % findings are service-role-only',
    v_total_visible, v_pass + v_empty, v_service_only;
END
$summary$;
