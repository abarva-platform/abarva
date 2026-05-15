-- Tenant-key canonicalization across substrate tables.
--
-- Three of our seeded tenants have historical short-form aliases that still
-- appear in several public-schema substrate tables, mixed with the canonical
-- long-form keys used elsewhere. The Azure AI Search adapter (landing next)
-- relies on a single canonical key per tenant; mixed keys split retrieval
-- results and return empty bundles.
--
--   Canonical          Historical aliases
--   ─────────          ──────────────────
--   apex-retail        apexretail
--   meridian-health    meridian
--   first-capital      arcturus
--
-- This migration:
--   1. Defines the alias map in a CTE / temp table.
--   2. UPDATEs every affected table to rewrite aliases → canonical.
--   3. Updates the RLS helper `current_tenant_key()` to canonicalize the
--      JWT claim on read, so existing Clerk metadata (which still carries
--      old aliases) continues to work without re-seeding users.
--   4. Verifies (SELECT at the end) that no aliases remain in any affected
--      column. The migration runner aborts the whole transaction if not.
--
-- Idempotent: every UPDATE is gated by `WHERE col IN (aliases)`, so re-runs
-- match zero rows.
--
-- Deliberately NOT included (deferred to follow-up PRs):
--   * CHECK constraints — multiple writers (Clerk metadata seeder,
--     `audit-tenant-data-planes.ts`, several /api routes) still hard-code
--     old aliases. Adding a CHECK would break those writers. See
--     docs/architecture/azure/TENANT-KEY-CANONICALIZATION-AUDIT.md
--     for the follow-up list.
--   * The `keystone → keystone-energy-holdings` mapping. Out of scope:
--     the brief authorized only three tenants. Filed as follow-up.

BEGIN;

-- Alias map, used by every UPDATE below via a CTE join.
CREATE TEMP TABLE tenant_key_alias_map (
  alias TEXT PRIMARY KEY,
  canonical TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO tenant_key_alias_map (alias, canonical) VALUES
  ('apexretail', 'apex-retail'),
  ('meridian',   'meridian-health'),
  ('arcturus',   'first-capital');

-- ── 1. clients table ──────────────────────────────────────────────────────
-- Updates the Brindlemark / Apex / Meridian seed rows. Unique partial index
-- `idx_clients_tenant_key WHERE tenant_key IS NOT NULL` does not collide:
-- no existing row carries the canonical form (verified pre-migration).
UPDATE public.clients c
   SET tenant_key = m.canonical,
       updated_at = now()
  FROM tenant_key_alias_map m
 WHERE c.tenant_key = m.alias;

-- ── 2. enterprise_context_* tables ────────────────────────────────────────
-- All carry `tenant_key TEXT`. Pre-migration check confirmed there are no
-- collisions on the (tenant_key, *_key) unique indexes after canonicalization.
UPDATE public.enterprise_context_chunks SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_chunk_queue SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_evidence SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_facts SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_quality_issues SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_records SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_relationships SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_snapshots SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_source_files SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_sources SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_stewardship_tasks SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.enterprise_context_template_runs SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;

-- ── 3. program_* tables ───────────────────────────────────────────────────
UPDATE public.program_approval_requests SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.program_attachments SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.program_audit_log SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.program_evidence_items SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;

-- ── 4. source_* tables ────────────────────────────────────────────────────
-- Note: `source_events` and `source_event_participants` store the key as
-- `client_key` (the legacy column name), not `tenant_key`.
UPDATE public.source_artifacts SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.source_event_artifact_states SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.source_event_evidence_states SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.source_event_gate_criterion_states SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias;
UPDATE public.source_event_participants SET client_key = m.canonical
  FROM tenant_key_alias_map m WHERE client_key = m.alias;
UPDATE public.source_events SET client_key = m.canonical
  FROM tenant_key_alias_map m WHERE client_key = m.alias;

-- ── 5. foundational_pattern_variants ──────────────────────────────────────
-- Only `meridian` appears (1 row); `apex`, `first_capital`, `keystone` are a
-- distinct underscore-separated taxonomy used by this table, NOT historical
-- aliases of the canonical client keys. Only the `meridian` value is mapped.
UPDATE public.foundational_pattern_variants SET tenant_key = m.canonical
  FROM tenant_key_alias_map m WHERE tenant_key = m.alias AND m.alias = 'meridian';

-- ── 6. RLS helper: canonicalize the JWT claim ────────────────────────────
-- Existing Clerk metadata (seed-clerk-metadata route) sets
-- `publicMetadata.clientId = 'apexretail' | 'meridian' | 'arcturus'`. Those
-- values land in the JWT and feed `current_tenant_key()`, which RLS uses
-- in equality checks against row-level `tenant_key` columns. After this
-- migration the row values are canonical, so the JWT-side must canonicalize
-- to match.
--
-- We rewrite `current_tenant_key()` to apply the same alias map on read.
-- The Clerk seeder still works untouched (follow-up will canonicalize it
-- too); this keeps RLS green during the transition.
CREATE OR REPLACE FUNCTION current_tenant_key()
RETURNS TEXT AS $$
  SELECT CASE auth.jwt() ->> 'tenant_key'
           WHEN 'apexretail' THEN 'apex-retail'
           WHEN 'meridian'   THEN 'meridian-health'
           WHEN 'arcturus'   THEN 'first-capital'
           ELSE auth.jwt() ->> 'tenant_key'
         END;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION current_tenant_key() TO authenticated;

-- ── 7. Verification ───────────────────────────────────────────────────────
-- Raise an exception (which forces ROLLBACK inside the runner's transaction)
-- if any alias survived the rewrite. This is the regression watch and
-- doubles as a smoke test that we covered every table we audited.
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM (
    SELECT 1 FROM public.clients WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_chunks WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_chunk_queue WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_evidence WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_facts WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_quality_issues WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_records WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_relationships WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_snapshots WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_source_files WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_sources WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_stewardship_tasks WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.enterprise_context_template_runs WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.program_approval_requests WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.program_attachments WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.program_audit_log WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.program_evidence_items WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.source_artifacts WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.source_event_artifact_states WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.source_event_evidence_states WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.source_event_gate_criterion_states WHERE tenant_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.source_event_participants WHERE client_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.source_events WHERE client_key IN ('apexretail','meridian','arcturus')
    UNION ALL SELECT 1 FROM public.foundational_pattern_variants WHERE tenant_key = 'meridian'
  ) sub;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'tenant-key canonicalization left % aliased rows behind', remaining;
  END IF;
END$$;

COMMIT;
