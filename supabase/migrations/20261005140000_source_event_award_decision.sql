-- The award decision for one Source event: which accepted candidate supplier
-- won, who decided it, and which canonical contract the decision produced.
--
-- Until now no sourcing event could produce a contract. `source.contract` is
-- written only by ingestion scripts, and the whole schema carried a single
-- `award_approver` column and no award entity, so every contract in the
-- platform arrived by import. This is the record that closes that path.
--
-- An award is not a shortlist, a recommendation, a score, or a signature. It
-- records that a named person selected one supplier for one event. Contract
-- execution remains a separate fact.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS source_event_award_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  -- The winning supplier's canonical identity. The foreign key to candidate
  -- authority is the point: an event cannot award to a supplier it never
  -- accepted onto its panel, so a free-text name can never become an award.
  vendor_id TEXT NOT NULL,
  candidate_authority_id TEXT NOT NULL,
  award_state TEXT NOT NULL DEFAULT 'draft',
  -- The contract this decision produced. Null while the award is a draft;
  -- required once awarded, so an award can never claim to have produced a
  -- contract it did not name.
  contract_id TEXT NULL,
  contract_name TEXT NULL,
  currency TEXT NULL,
  approved_by_user_id TEXT NULL,
  approved_by_name TEXT NULL,
  approved_at TIMESTAMPTZ NULL,
  award_rationale TEXT NULL,
  evidence_reference TEXT NULL,
  retired_at TIMESTAMPTZ NULL,
  retired_by_user_id TEXT NULL,
  retirement_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_award_event_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key)
    ON DELETE CASCADE,
  CONSTRAINT source_event_award_vendor_fk
    FOREIGN KEY (client_key, vendor_id)
    REFERENCES source.vendor(tenant_key, vendor_id),
  CONSTRAINT source_event_award_candidate_fk
    FOREIGN KEY (client_key, candidate_authority_id)
    REFERENCES source_event_candidate_supplier_authority(client_key, authority_id),
  CONSTRAINT source_event_award_identity_check
    CHECK (
      NULLIF(BTRIM(award_id), '') IS NOT NULL
      AND NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(vendor_id), '') IS NOT NULL
      AND NULLIF(BTRIM(candidate_authority_id), '') IS NOT NULL
    ),
  CONSTRAINT source_event_award_state_check
    CHECK (award_state IN ('draft', 'awarded', 'retired')),
  -- An awarded row must carry every fact the award asserts: a named person, a
  -- time, a reason, evidence, and the contract it produced. A blank passes
  -- IS NOT NULL, so each is checked for content rather than presence.
  CONSTRAINT source_event_award_awarded_check
    CHECK (
      award_state <> 'awarded'
      OR (
        NULLIF(BTRIM(approved_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(approved_by_name), '') IS NOT NULL
        AND approved_at IS NOT NULL
        AND NULLIF(BTRIM(award_rationale), '') IS NOT NULL
        AND NULLIF(BTRIM(evidence_reference), '') IS NOT NULL
        AND NULLIF(BTRIM(contract_id), '') IS NOT NULL
        AND NULLIF(BTRIM(contract_name), '') IS NOT NULL
        AND NULLIF(BTRIM(currency), '') IS NOT NULL
        AND retired_at IS NULL
      )
    ),
  CONSTRAINT source_event_award_retirement_check
    CHECK (
      award_state <> 'retired'
      OR (
        approved_at IS NOT NULL
        AND retired_at IS NOT NULL
        AND retired_at >= approved_at
        AND NULLIF(BTRIM(retired_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(retirement_reason), '') IS NOT NULL
      )
    ),
  UNIQUE (client_key, award_id)
);

-- One live award per event. A second supplier cannot be awarded the same event
-- without the first being retired by a named person.
CREATE UNIQUE INDEX IF NOT EXISTS source_event_award_active_idx
  ON source_event_award_decision(client_key, source_event_id)
  WHERE award_state <> 'retired';

-- One contract id per tenant, matching the uniqueness `source.contract` itself
-- enforces, so a replayed award cannot produce a second contract.
CREATE UNIQUE INDEX IF NOT EXISTS source_event_award_contract_idx
  ON source_event_award_decision(client_key, contract_id)
  WHERE contract_id IS NOT NULL AND award_state <> 'retired';

CREATE INDEX IF NOT EXISTS source_event_award_event_idx
  ON source_event_award_decision(client_key, source_event_id, award_state);

COMMENT ON TABLE source_event_award_decision IS
  'Named, evidence-backed decision awarding one Source event to one accepted candidate supplier, and the canonical contract it produced. It is not a shortlist, a score, a recommendation, or a signed agreement.';

CREATE OR REPLACE FUNCTION prevent_source_event_award_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.award_state = 'awarded' AND (
    NEW.award_id IS DISTINCT FROM OLD.award_id OR
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.source_event_id IS DISTINCT FROM OLD.source_event_id OR
    NEW.vendor_id IS DISTINCT FROM OLD.vendor_id OR
    NEW.candidate_authority_id IS DISTINCT FROM OLD.candidate_authority_id OR
    NEW.contract_id IS DISTINCT FROM OLD.contract_id OR
    NEW.contract_name IS DISTINCT FROM OLD.contract_name OR
    NEW.currency IS DISTINCT FROM OLD.currency OR
    NEW.approved_by_user_id IS DISTINCT FROM OLD.approved_by_user_id OR
    NEW.approved_by_name IS DISTINCT FROM OLD.approved_by_name OR
    NEW.approved_at IS DISTINCT FROM OLD.approved_at OR
    NEW.award_rationale IS DISTINCT FROM OLD.award_rationale OR
    NEW.evidence_reference IS DISTINCT FROM OLD.evidence_reference OR
    NEW.created_at IS DISTINCT FROM OLD.created_at OR
    NOT (
      (NEW.award_state = 'awarded'
        AND NEW.retired_at IS NULL
        AND NEW.retired_by_user_id IS NULL
        AND NEW.retirement_reason IS NULL)
      OR
      (NEW.award_state = 'retired'
        AND NEW.retired_at IS NOT NULL
        AND NULLIF(BTRIM(NEW.retired_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(NEW.retirement_reason), '') IS NOT NULL)
    )
  ) THEN
    RAISE EXCEPTION 'an awarded decision is immutable; retire it instead of rewriting it';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_event_award_immutable_trigger
  ON source_event_award_decision;
CREATE TRIGGER source_event_award_immutable_trigger
  BEFORE UPDATE ON source_event_award_decision
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_event_award_rewrite();

ALTER TABLE source_event_award_decision ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_award_decision"
  ON source_event_award_decision;
CREATE POLICY "service_role_full_source_event_award_decision"
  ON source_event_award_decision
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "tenant_read_source_event_award_decision"
  ON source_event_award_decision;
CREATE POLICY "tenant_read_source_event_award_decision"
  ON source_event_award_decision
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_award_decision.source_event_id
        AND se.client_key = source_event_award_decision.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

GRANT SELECT ON source_event_award_decision TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source_event_award_decision TO service_role;
