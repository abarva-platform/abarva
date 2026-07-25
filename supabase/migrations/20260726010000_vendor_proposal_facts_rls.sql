-- Vendor proposal facts — real, tenant-scoped RLS (PR A of the
-- RLS/tenant-isolation security workstream, sequenced per ADR-0013 to run
-- before PR 4 stage/artifact contracts).
--
-- source_vendor_proposal_facts / source_vendor_proposal_fact_reviews shipped
-- (20260725190000_source_vendor_proposal_facts.sql) with `USING (true) WITH
-- CHECK (true)` policies — RLS technically "enabled" but not actually
-- constraining anything; real isolation was 100% the application query
-- layer's WHERE clauses. This migration replaces that with the same
-- can_read_tenant_by_key() convention already used by 13+ other Source
-- tables (supabase/migrations/20260507110000_source_per_user_rls_read.sql,
-- 20260706120000_source_event_facts.sql), so these two tables are picked up
-- automatically by the existing auto-discovering regression suite
-- (tests/security/rls-regression.sql).
--
-- source_vendor_proposal_fact_reviews had no tenant/event column of its own
-- (only fact_id) — a join-based policy would work, but every other governed
-- table in this schema denormalizes its own tenant/event column directly so
-- RLS policies stay simple column checks and the auto-discovery harness
-- (which only recognizes tenant_key/client_key/client_id columns) picks the
-- table up with no special-casing. This migration adds client_key +
-- source_event_id here too, backfilled from the parent fact.
--
-- Real DB-level RLS enforcement additionally requires the connecting role
-- to actually assume `authenticated` and carry a `request.jwt.claims` GUC —
-- see src/lib/source/vendor-proposals/tenant-scoped-session.ts, this
-- migration's application-side counterpart.

BEGIN;

ALTER TABLE source_vendor_proposal_fact_reviews
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS source_event_id UUID REFERENCES source_events(id);

UPDATE source_vendor_proposal_fact_reviews r
   SET client_key = f.client_key,
       source_event_id = f.source_event_id
  FROM source_vendor_proposal_facts f
 WHERE r.fact_id = f.id
   AND r.client_key IS NULL;

ALTER TABLE source_vendor_proposal_fact_reviews
  ALTER COLUMN client_key SET NOT NULL,
  ALTER COLUMN source_event_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS source_vendor_proposal_fact_reviews_client_key_idx
  ON source_vendor_proposal_fact_reviews (client_key);

-- ── source_vendor_proposal_facts ────────────────────────────────────────────

DROP POLICY IF EXISTS "service_role_full_access" ON source_vendor_proposal_facts;

CREATE POLICY "service_role_all_source_vendor_proposal_facts"
  ON source_vendor_proposal_facts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_source_vendor_proposal_facts"
  ON source_vendor_proposal_facts
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

CREATE POLICY "authenticated_insert_source_vendor_proposal_facts"
  ON source_vendor_proposal_facts
  FOR INSERT TO authenticated
  WITH CHECK (can_read_tenant_by_key(client_key));

-- Deliberately no authenticated UPDATE/DELETE policy — the table is
-- append-only by design (see the original migration's header comment); a
-- caller in the `authenticated` role has no path to mutate an existing row
-- at all, RLS-enforced default-deny, on top of the immutable-ownership
-- trigger below which would reject an ownership change even from
-- service_role.

GRANT SELECT, INSERT ON source_vendor_proposal_facts TO authenticated;

-- ── source_vendor_proposal_fact_reviews ─────────────────────────────────────

DROP POLICY IF EXISTS "service_role_full_access" ON source_vendor_proposal_fact_reviews;

CREATE POLICY "service_role_all_source_vendor_proposal_fact_reviews"
  ON source_vendor_proposal_fact_reviews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_source_vendor_proposal_fact_reviews"
  ON source_vendor_proposal_fact_reviews
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

CREATE POLICY "authenticated_insert_source_vendor_proposal_fact_reviews"
  ON source_vendor_proposal_fact_reviews
  FOR INSERT TO authenticated
  WITH CHECK (can_read_tenant_by_key(client_key));

GRANT SELECT, INSERT ON source_vendor_proposal_fact_reviews TO authenticated;

-- ── Immutable ownership (own-table columns) ─────────────────────────────────
-- Neither table is ever UPDATEd by application code today (both are
-- append-only ledgers) — these triggers are a defense-in-depth backstop
-- against a future bug or an ad-hoc service_role query silently reassigning
-- a fact's or review's tenant/event/vendor/proposal ownership after
-- creation. Cross-table ownership consistency (supersedes_fact_id, the
-- fact<->review fact_id link) is PR B's scope, not this migration's.

CREATE OR REPLACE FUNCTION source_vendor_proposal_facts_prevent_ownership_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_key IS DISTINCT FROM OLD.client_key
     OR NEW.source_event_id IS DISTINCT FROM OLD.source_event_id
     OR NEW.vendor_key IS DISTINCT FROM OLD.vendor_key
     OR NEW.proposal_artifact_id IS DISTINCT FROM OLD.proposal_artifact_id
  THEN
    RAISE EXCEPTION
      'source_vendor_proposal_facts: client_key, source_event_id, vendor_key, and proposal_artifact_id are immutable after creation (fact %)',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_source_vendor_proposal_facts_immutable_ownership
  ON source_vendor_proposal_facts;
CREATE TRIGGER trg_source_vendor_proposal_facts_immutable_ownership
  BEFORE UPDATE ON source_vendor_proposal_facts
  FOR EACH ROW EXECUTE FUNCTION source_vendor_proposal_facts_prevent_ownership_change();

CREATE OR REPLACE FUNCTION source_vendor_proposal_fact_reviews_prevent_ownership_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fact_id IS DISTINCT FROM OLD.fact_id
     OR NEW.client_key IS DISTINCT FROM OLD.client_key
     OR NEW.source_event_id IS DISTINCT FROM OLD.source_event_id
  THEN
    RAISE EXCEPTION
      'source_vendor_proposal_fact_reviews: fact_id, client_key, and source_event_id are immutable after creation (review %)',
      OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_source_vendor_proposal_fact_reviews_immutable_ownership
  ON source_vendor_proposal_fact_reviews;
CREATE TRIGGER trg_source_vendor_proposal_fact_reviews_immutable_ownership
  BEFORE UPDATE ON source_vendor_proposal_fact_reviews
  FOR EACH ROW EXECUTE FUNCTION source_vendor_proposal_fact_reviews_prevent_ownership_change();

COMMIT;
