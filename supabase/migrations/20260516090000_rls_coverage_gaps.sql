-- RLS coverage gaps — tenant-scoped read policies for the data_segment_*
-- substrate + session_messages.
--
-- PROPOSED — NOT YET APPLIED. Reviewed and run via `npm run db:migrate`.
--
-- Source of truth: docs/security/RLS-COVERAGE-AUDIT-2026-05-16.md
-- Audit script:    scripts/audit/rls-coverage-audit.ts
--
-- The audit found 24 tenant-scoped tables with `relrowsecurity = true` but
-- ZERO attached policies. That state is fail-closed for the `authenticated`
-- role (no policy ⇒ no rows visible), so it is not an active cross-tenant
-- leak — but it IS a pilot-readiness gap: tenant users cannot read their own
-- data through an authenticated connection, and the table is one careless
-- permissive policy away from being wide open. Every tenant-scoped table must
-- carry an explicit, tenant-scoped policy.
--
-- These tables were bulk-loaded in the 2026-04-30/05-01 tenant data drop,
-- outside the Phase 5 per-user RLS migration, and never got policies. RLS was
-- later switched on en masse by 20260513073000_public_rls_security_advisor_
-- lockdown.sql without per-table policies.
--
-- Two policy shapes (NOT uniform):
--
--   Shape A — 23 data_segment_* tables store the tenant as `tenant_key TEXT`
--             (hyphenated broker keys: apex-retail / meridian-health /
--             first-capital). Policy uses can_read_tenant_by_key(tenant_key),
--             which compares directly to the JWT `tenant_key` claim.
--
--   Shape B — session_messages stores the tenant in `client_id`, which is
--             TEXT (NOT a UUID FK) holding the tenant slug — and that slug is
--             still a LEGACY ALIAS (`meridian`), not canonical. The policy
--             canonicalizes it via canonical_tenant_key(client_id) and passes
--             the result to the TEXT overload can_read_tenant_by_id(TEXT),
--             which resolves clients.id::text or clients.tenant_key. This works
--             for a slug-bearing column and keeps working if the column is
--             later migrated to a real UUID (canonical_tenant_key passes
--             non-aliases through unchanged).
--
-- Helpers: supabase/migrations/20260507100000_rls_role_helpers.sql
--   can_read_tenant_by_key(TEXT) · can_read_tenant_by_id(UUID/TEXT)
--   current_tenant_key() · is_maestro()
--
-- Compatibility note: some live environments applied
-- 20260507100000_rls_role_helpers.sql before the TEXT overload of
-- can_read_tenant_by_id() was added to that migration file. This migration
-- re-declares the TEXT overload idempotently before using it so production
-- deploys do not depend on editing/replaying an already-applied migration.
--
-- KEY-FORMAT — VERIFIED 2026-05-16 (read-only SELECT against production
-- DATABASE_URL; see docs/security/RLS-COVERAGE-AUDIT-2026-05-16.md §Key-format
-- verification). The original audit flagged a possible hyphenated-vs-slug
-- mismatch; investigation resolved it as follows:
--
--   * data_segment_* tables  → store the HYPHENATED canonical key
--                              (apex-retail / meridian-health / first-capital).
--   * clients.tenant_key     → ALSO hyphenated canonical. The earlier "slug"
--                              claim was stale: migration
--                              20260515120000_tenant_key_canonicalization.sql
--                              rewrote clients.tenant_key apexretail→apex-retail
--                              etc., and rewrote current_tenant_key() to
--                              canonicalize the JWT claim ON READ.
--   * current_tenant_key()   → canonicalizes whatever the Clerk `supabase` JWT
--                              template emits (legacy alias OR canonical).
--
-- ⇒ Shape A is SAFE regardless of the live JWT shape: both the row key and
--   current_tenant_key() are hyphenated canonical, so the direct compare in
--   can_read_tenant_by_key() matches.
--
-- ⇒ Shape B needed a fix. session_messages.client_id still holds a LEGACY
--   ALIAS slug (verified: the live rows carry `meridian`, not
--   `meridian-health`). can_read_tenant_by_id(TEXT) compares client_id against
--   clients.tenant_key — which is now canonical — so an un-canonicalized
--   `meridian` would never match `meridian-health`. This migration introduces a
--   SQL canonicalizer `canonical_tenant_key(TEXT)` and wraps client_id with it
--   so Shape B compares canonical-to-canonical.
--
-- Writes are intentionally NOT granted: the substrate is loaded by
-- service-role tooling, which bypasses RLS. Add a can_write_tenant_by_key
-- write policy only when a tenant-user write path is introduced.
--
-- Idempotent: ENABLE ROW LEVEL SECURITY is a no-op when already enabled;
-- every policy is DROP POLICY IF EXISTS first.

BEGIN;

-- Guard: the helper functions this migration depends on must exist.
DO $rls_prereqs$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NULL THEN
    RAISE EXCEPTION
      'Helper can_read_tenant_by_key not found. Apply 20260507100000_rls_role_helpers.sql first.';
  END IF;
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NULL THEN
    RAISE EXCEPTION
      'Helper can_read_tenant_by_id(uuid) not found. Apply 20260507100000_rls_role_helpers.sql first.';
  END IF;
END
$rls_prereqs$;

-- Live compatibility shim for environments where the base helper migration was
-- already marked applied before this overload was added.
CREATE OR REPLACE FUNCTION can_read_tenant_by_id(p_client_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE (id::text = p_client_id OR tenant_key = p_client_id)
      AND tenant_key = current_tenant_key()
  ) OR is_maestro()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_read_tenant_by_id(TEXT) TO authenticated;

-- SQL-side tenant-key canonicalizer. Mirrors the alias map in
-- src/lib/tenant-keys.ts and migration 20260515120000_tenant_key_
-- canonicalization.sql. Used by Shape B to canonicalize a column that still
-- holds a legacy alias before comparing it to clients.tenant_key (canonical).
-- Unknown / NULL values pass through unchanged (forward-compatible).
CREATE OR REPLACE FUNCTION canonical_tenant_key(p_key TEXT)
RETURNS TEXT AS $$
  SELECT CASE p_key
           WHEN 'apexretail' THEN 'apex-retail'
           WHEN 'meridian'   THEN 'meridian-health'
           WHEN 'arcturus'   THEN 'first-capital'
           ELSE p_key
         END
$$ LANGUAGE sql IMMUTABLE;

GRANT EXECUTE ON FUNCTION canonical_tenant_key(TEXT) TO authenticated;

-- ── Shape A · data_segment_* (tenant_key TEXT) ───────────────────────────────
-- Apply the identical ENABLE RLS + auth_read + GRANT pattern to each table.
-- A DO loop keeps the 23 tables in lockstep and makes adding/removing one a
-- single-line edit. format(%I) safely quotes each identifier.
DO $shape_a$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'data_segment_ai_transformation',
    'data_segment_compliance',
    'data_segment_cross_program_signals',
    'data_segment_decision_traces',
    'data_segment_enterprise_profile',
    'data_segment_evidence_ledger',
    'data_segment_financial_model',
    'data_segment_graph_relationships',
    'data_segment_industry_context',
    'data_segment_it_financials',
    'data_segment_it_landscape',
    'data_segment_kpi_dictionary',
    'data_segment_kpi_history',
    'data_segment_operating_telemetry',
    'data_segment_org_structure',
    'data_segment_peer_benchmarks',
    'data_segment_program_deliverables',
    'data_segment_program_inventory',
    'data_segment_scenario_library',
    'data_segment_sourcing_artifacts',
    'data_segment_stakeholder_notes',
    'data_segment_vendor_contracts',
    'data_segment_vendor_intelligence'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    -- Skip cleanly if a table is absent in this environment.
    IF to_regclass(format('public.%I', v_table)) IS NULL THEN
      RAISE NOTICE 'rls-coverage-gaps: table public.% absent — skipped', v_table;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('DROP POLICY IF EXISTS auth_read ON public.%I', v_table);
    EXECUTE format(
      'CREATE POLICY auth_read ON public.%I '
      || 'FOR SELECT TO authenticated '
      || 'USING (can_read_tenant_by_key(tenant_key))',
      v_table
    );
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_table);
  END LOOP;
END
$shape_a$;

-- ── Shape B · session_messages (client_id TEXT, holds legacy alias slug) ─────
-- client_id is TEXT and stores the tenant slug, not a clients.id UUID — and
-- that slug is still a LEGACY ALIAS (verified: live rows carry `meridian`).
-- clients.tenant_key was canonicalized to `meridian-health` by migration
-- 20260515120000, so a raw compare would never match. We canonicalize
-- client_id first, then hand it to the TEXT overload of can_read_tenant_by_id,
-- which resolves clients.id::text OR clients.tenant_key. canonical_tenant_key
-- passes non-aliases through unchanged, so this stays correct if client_id is
-- later migrated to a UUID FK or backfilled to canonical slugs.
DO $shape_b$
BEGIN
  IF to_regclass('public.session_messages') IS NULL THEN
    RAISE NOTICE 'rls-coverage-gaps: table public.session_messages absent — skipped';
  ELSE
    ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS auth_read ON public.session_messages;
    CREATE POLICY auth_read ON public.session_messages
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(canonical_tenant_key(client_id)));  -- TEXT overload
    GRANT SELECT ON public.session_messages TO authenticated;
  END IF;
END
$shape_b$;

NOTIFY pgrst, 'reload schema';

COMMIT;
