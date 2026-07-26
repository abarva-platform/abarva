-- Vendor proposal facts — cross-table and cross-event consistency (PR B of
-- the RLS/tenant-isolation security workstream). PR A made
-- source_vendor_proposal_facts / source_vendor_proposal_fact_reviews real,
-- RLS-enforced, tenant-scoped tables. This migration closes the remaining
-- class of gap PR A explicitly deferred: nothing stopped a row from being
-- INSERTed with an internally INCONSISTENT ownership chain — e.g. a fact
-- whose source_event_id points at a real event belonging to a DIFFERENT
-- tenant than the fact's own client_key, or a supersedes_fact_id pointing
-- at a fact from another tenant/event/vendor/fact-key. The application
-- layer (vendor-proposal-facts.ts) always writes these consistently today,
-- but per the "prefer database constraints or guarded database functions
-- where plain foreign keys cannot express the rule safely" principle, this
-- is now also enforced at the database layer — a future bug, a different
-- caller, or a service_role-authenticated ops script cannot silently create
-- an internally inconsistent row.
--
-- Plain foreign keys cannot express these rules (a FK only proves the
-- referenced row EXISTS, not that its tenant/event columns match the
-- referencing row's) — hence BEFORE INSERT trigger functions, following
-- this migration's sibling immutable-ownership triggers
-- (20260726010000_vendor_proposal_facts_rls.sql) in style and placement.
--
-- Vendor authorization: this schema has no dedicated vendors/event_vendors
-- table (vendor_key is a free-text column, confirmed during scope
-- discovery — Source's existing vendor-lever fact model uses the same
-- convention). There is therefore no vendor-authorization row to check
-- against beyond "the fact's own vendor_key is internally consistent with
-- itself," which the supersession check below already covers. A real
-- vendor registry with per-event vendor authorization is out of this
-- migration's scope — noted honestly rather than fabricating a check
-- against a table that doesn't exist.

BEGIN;

CREATE OR REPLACE FUNCTION source_vendor_proposal_facts_check_ownership_consistency()
RETURNS TRIGGER AS $$
DECLARE
  event_client_key TEXT;
  artifact_tenant_key TEXT;
  artifact_event_id UUID;
  superseded_client_key TEXT;
  superseded_event_id UUID;
  superseded_vendor_key TEXT;
  superseded_fact_key TEXT;
BEGIN
  -- 1. The fact's own client_key must match the event it claims to belong to.
  SELECT client_key INTO event_client_key
    FROM source_events WHERE id = NEW.source_event_id;
  IF event_client_key IS NULL THEN
    RAISE EXCEPTION
      'source_vendor_proposal_facts: source_event_id % does not reference a real source_events row',
      NEW.source_event_id;
  END IF;
  IF event_client_key IS DISTINCT FROM NEW.client_key THEN
    RAISE EXCEPTION
      'source_vendor_proposal_facts: client_key % does not match source_events.client_key % for event %',
      NEW.client_key, event_client_key, NEW.source_event_id;
  END IF;

  -- 2. The proposal artifact must belong to the same tenant AND the same event.
  SELECT tenant_key, source_event_id INTO artifact_tenant_key, artifact_event_id
    FROM source_artifacts WHERE id = NEW.proposal_artifact_id;
  IF artifact_tenant_key IS NULL THEN
    RAISE EXCEPTION
      'source_vendor_proposal_facts: proposal_artifact_id % does not reference a real source_artifacts row',
      NEW.proposal_artifact_id;
  END IF;
  IF artifact_tenant_key IS DISTINCT FROM NEW.client_key
     OR artifact_event_id IS DISTINCT FROM NEW.source_event_id
  THEN
    RAISE EXCEPTION
      'source_vendor_proposal_facts: proposal_artifact_id % belongs to tenant=%/event=%, not tenant=%/event=%',
      NEW.proposal_artifact_id, artifact_tenant_key, artifact_event_id, NEW.client_key, NEW.source_event_id;
  END IF;

  -- 3. supersedes_fact_id must reference a fact with the SAME tenant, event,
  --    vendor, and fact_key — a revision of the same logical fact, never a
  --    different one. proposal_artifact_id is deliberately NOT required to
  --    match: a revision is expected to come from a different (newer)
  --    proposal document.
  IF NEW.supersedes_fact_id IS NOT NULL THEN
    SELECT client_key, source_event_id, vendor_key, fact_key
      INTO superseded_client_key, superseded_event_id, superseded_vendor_key, superseded_fact_key
      FROM source_vendor_proposal_facts WHERE id = NEW.supersedes_fact_id;
    IF superseded_client_key IS NULL THEN
      RAISE EXCEPTION
        'source_vendor_proposal_facts: supersedes_fact_id % does not reference a real fact',
        NEW.supersedes_fact_id;
    END IF;
    IF superseded_client_key IS DISTINCT FROM NEW.client_key
       OR superseded_event_id IS DISTINCT FROM NEW.source_event_id
       OR superseded_vendor_key IS DISTINCT FROM NEW.vendor_key
       OR superseded_fact_key IS DISTINCT FROM NEW.fact_key
    THEN
      RAISE EXCEPTION
        'source_vendor_proposal_facts: supersedes_fact_id % (tenant=%/event=%/vendor=%/fact_key=%) is not the same logical fact as tenant=%/event=%/vendor=%/fact_key=%',
        NEW.supersedes_fact_id, superseded_client_key, superseded_event_id, superseded_vendor_key, superseded_fact_key,
        NEW.client_key, NEW.source_event_id, NEW.vendor_key, NEW.fact_key;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_source_vendor_proposal_facts_ownership_consistency
  ON source_vendor_proposal_facts;
CREATE TRIGGER trg_source_vendor_proposal_facts_ownership_consistency
  BEFORE INSERT ON source_vendor_proposal_facts
  FOR EACH ROW EXECUTE FUNCTION source_vendor_proposal_facts_check_ownership_consistency();

-- Reviews: the review's own client_key/source_event_id must match the fact
-- it reviews. The application layer (acceptVendorProposalFact /
-- rejectVendorProposalFact) already derives these from the fact row it just
-- read in the same transaction — this is the database-level backstop.
CREATE OR REPLACE FUNCTION source_vendor_proposal_fact_reviews_check_ownership_consistency()
RETURNS TRIGGER AS $$
DECLARE
  fact_client_key TEXT;
  fact_event_id UUID;
BEGIN
  SELECT client_key, source_event_id INTO fact_client_key, fact_event_id
    FROM source_vendor_proposal_facts WHERE id = NEW.fact_id;
  IF fact_client_key IS NULL THEN
    RAISE EXCEPTION
      'source_vendor_proposal_fact_reviews: fact_id % does not reference a real fact',
      NEW.fact_id;
  END IF;
  IF fact_client_key IS DISTINCT FROM NEW.client_key
     OR fact_event_id IS DISTINCT FROM NEW.source_event_id
  THEN
    RAISE EXCEPTION
      'source_vendor_proposal_fact_reviews: review claims tenant=%/event=% but fact % belongs to tenant=%/event=%',
      NEW.client_key, NEW.source_event_id, NEW.fact_id, fact_client_key, fact_event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_source_vendor_proposal_fact_reviews_ownership_consistency
  ON source_vendor_proposal_fact_reviews;
CREATE TRIGGER trg_source_vendor_proposal_fact_reviews_ownership_consistency
  BEFORE INSERT ON source_vendor_proposal_fact_reviews
  FOR EACH ROW EXECUTE FUNCTION source_vendor_proposal_fact_reviews_check_ownership_consistency();

COMMIT;
