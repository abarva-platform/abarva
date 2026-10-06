-- Explicit authority for accepting a governed supplier legal entity into one
-- Source event's candidate panel. Invitation, response, recommendation, and
-- award states never imply candidate acceptance.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE UNIQUE INDEX IF NOT EXISTS source_events_id_client_key_candidate_supplier_idx
  ON source_events(id, client_key);

CREATE TABLE IF NOT EXISTS source_event_candidate_supplier_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  vendor_id TEXT NOT NULL,
  authority_state TEXT NOT NULL DEFAULT 'draft',
  accepted_by_user_id TEXT NULL,
  accepted_by_name TEXT NULL,
  accepted_at TIMESTAMPTZ NULL,
  acceptance_rationale TEXT NULL,
  evidence_reference TEXT NULL,
  retired_at TIMESTAMPTZ NULL,
  retired_by_user_id TEXT NULL,
  retirement_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_candidate_supplier_event_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key)
    ON DELETE CASCADE,
  CONSTRAINT source_event_candidate_supplier_vendor_fk
    FOREIGN KEY (client_key, vendor_id)
    REFERENCES source.vendor(tenant_key, vendor_id),
  CONSTRAINT source_event_candidate_supplier_identity_check
    CHECK (
      NULLIF(BTRIM(authority_id), '') IS NOT NULL
      AND NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(vendor_id), '') IS NOT NULL
    ),
  CONSTRAINT source_event_candidate_supplier_state_check
    CHECK (authority_state IN ('draft', 'accepted', 'retired')),
  CONSTRAINT source_event_candidate_supplier_acceptance_check
    CHECK (
      authority_state <> 'accepted'
      OR (
        NULLIF(BTRIM(accepted_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(accepted_by_name), '') IS NOT NULL
        AND accepted_at IS NOT NULL
        AND NULLIF(BTRIM(acceptance_rationale), '') IS NOT NULL
        AND NULLIF(BTRIM(evidence_reference), '') IS NOT NULL
        AND retired_at IS NULL
      )
    ),
  CONSTRAINT source_event_candidate_supplier_retirement_check
    CHECK (
      authority_state <> 'retired'
      OR (
        accepted_at IS NOT NULL
        AND retired_at IS NOT NULL
        AND retired_at >= accepted_at
        AND NULLIF(BTRIM(retired_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(retirement_reason), '') IS NOT NULL
      )
    ),
  UNIQUE (client_key, authority_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS source_event_candidate_supplier_active_idx
  ON source_event_candidate_supplier_authority(client_key, source_event_id, vendor_id)
  WHERE authority_state <> 'retired';

CREATE INDEX IF NOT EXISTS source_event_candidate_supplier_event_idx
  ON source_event_candidate_supplier_authority(client_key, source_event_id, authority_state);

COMMENT ON TABLE source_event_candidate_supplier_authority IS
  'Named, evidence-backed authority accepting one governed supplier legal entity into one Source event candidate panel. It is not an invitation, response, recommendation, or award record.';

CREATE OR REPLACE FUNCTION prevent_source_event_candidate_supplier_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.authority_state = 'accepted' AND (
    NEW.authority_id IS DISTINCT FROM OLD.authority_id OR
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.source_event_id IS DISTINCT FROM OLD.source_event_id OR
    NEW.vendor_id IS DISTINCT FROM OLD.vendor_id OR
    NEW.accepted_by_user_id IS DISTINCT FROM OLD.accepted_by_user_id OR
    NEW.accepted_by_name IS DISTINCT FROM OLD.accepted_by_name OR
    NEW.accepted_at IS DISTINCT FROM OLD.accepted_at OR
    NEW.acceptance_rationale IS DISTINCT FROM OLD.acceptance_rationale OR
    NEW.evidence_reference IS DISTINCT FROM OLD.evidence_reference OR
    NEW.created_at IS DISTINCT FROM OLD.created_at OR
    NOT (
      (NEW.authority_state = 'accepted'
        AND NEW.retired_at IS NULL
        AND NEW.retired_by_user_id IS NULL
        AND NEW.retirement_reason IS NULL)
      OR
      (NEW.authority_state = 'retired'
        AND NEW.retired_at IS NOT NULL
        AND NULLIF(BTRIM(NEW.retired_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(NEW.retirement_reason), '') IS NOT NULL)
    )
  ) THEN
    RAISE EXCEPTION 'an accepted candidate supplier authority is immutable; retire it instead of rewriting it';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_event_candidate_supplier_immutable_trigger
  ON source_event_candidate_supplier_authority;
CREATE TRIGGER source_event_candidate_supplier_immutable_trigger
  BEFORE UPDATE ON source_event_candidate_supplier_authority
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_event_candidate_supplier_rewrite();

ALTER TABLE source_event_candidate_supplier_authority ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_candidate_supplier_authority"
  ON source_event_candidate_supplier_authority;
CREATE POLICY "service_role_full_source_event_candidate_supplier_authority"
  ON source_event_candidate_supplier_authority
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_candidate_supplier_authority"
  ON source_event_candidate_supplier_authority;
CREATE POLICY "authenticated_read_source_event_candidate_supplier_authority"
  ON source_event_candidate_supplier_authority
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_candidate_supplier_authority.source_event_id
        AND se.client_key = source_event_candidate_supplier_authority.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

GRANT SELECT ON source_event_candidate_supplier_authority TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source_event_candidate_supplier_authority TO service_role;
