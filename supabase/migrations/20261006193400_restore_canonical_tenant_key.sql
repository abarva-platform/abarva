-- Re-declare the SQL tenant-key canonicalizer before the first migration that
-- depends on it at DDL time.
--
-- canonical_tenant_key(TEXT) was introduced in
-- 20260516090000_rls_coverage_gaps.sql. The live migration ledger records that
-- migration as applied, yet applying
-- 20261006193500_source_nda_template_event_canonical_fk.sql there failed with
-- "function canonical_tenant_key(text) does not exist": the function is not
-- resolvable on that database's search path. Fresh replays pass because they
-- create it in sequence.
--
-- This migration re-declares the function in the public schema with the SAME
-- body as 20260516090000 (CREATE OR REPLACE is a no-op where it already exists
-- identically), so the generated column added next resolves it everywhere.
-- Mirrors the alias map in src/lib/tenant-keys.ts. Unknown / NULL values pass
-- through unchanged. Idempotent.

CREATE OR REPLACE FUNCTION public.canonical_tenant_key(p_key TEXT)
RETURNS TEXT AS $$
  SELECT CASE p_key
           WHEN 'apexretail' THEN 'apex-retail'
           WHEN 'meridian'   THEN 'meridian-health'
           WHEN 'arcturus'   THEN 'first-capital'
           ELSE p_key
         END
$$ LANGUAGE sql IMMUTABLE;

GRANT EXECUTE ON FUNCTION public.canonical_tenant_key(TEXT) TO authenticated;
