-- Contact identity belongs to the canonical supplier record. Event-specific
-- permission to approach that contact is a separate, evidenced authority.
-- This migration does not populate contacts or approve any recipient.

CREATE TABLE IF NOT EXISTS source.vendor_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_policy TEXT NOT NULL DEFAULT 'review_required',
  contact_state TEXT NOT NULL DEFAULT 'inactive',
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  evidence_reference TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_vendor_contact_vendor_fk
    FOREIGN KEY (tenant_key, vendor_id)
    REFERENCES source.vendor(tenant_key, vendor_id),
  CONSTRAINT source_vendor_contact_identity_check
    CHECK (
      NULLIF(BTRIM(tenant_key), '') IS NOT NULL
      AND NULLIF(BTRIM(vendor_id), '') IS NOT NULL
      AND NULLIF(BTRIM(contact_id), '') IS NOT NULL
      AND NULLIF(BTRIM(display_name), '') IS NOT NULL
      AND NULLIF(BTRIM(email), '') IS NOT NULL
      AND NULLIF(BTRIM(source_system), '') IS NOT NULL
      AND NULLIF(BTRIM(source_record_id), '') IS NOT NULL
      AND NULLIF(BTRIM(evidence_reference), '') IS NOT NULL
    ),
  CONSTRAINT source_vendor_contact_policy_check
    CHECK (contact_policy IN ('contact_allowed', 'review_required', 'do_not_contact')),
  CONSTRAINT source_vendor_contact_state_check
    CHECK (contact_state IN ('active', 'inactive')),
  UNIQUE (tenant_key, vendor_id, contact_id)
);

COMMENT ON TABLE source.vendor_contact IS
  'Canonical, declared supplier contact identity. Presence or contact_allowed policy alone is not event-specific permission to approach a person.';

-- Include the candidate's event and legal entity in the contact-approval FK;
-- a candidate authority ID from another event or vendor cannot be rebound.
CREATE UNIQUE INDEX IF NOT EXISTS source_event_candidate_supplier_release_link_idx
  ON source_event_candidate_supplier_authority
    (client_key, source_event_id, vendor_id, authority_id);

CREATE TABLE IF NOT EXISTS source_event_rfx_contact_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  vendor_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  candidate_authority_id TEXT NOT NULL,
  approved_contact_name TEXT NOT NULL,
  approved_contact_email TEXT NOT NULL,
  authority_state TEXT NOT NULL DEFAULT 'draft',
  approved_by_user_id TEXT NULL,
  approved_at TIMESTAMPTZ NULL,
  evidence_reference TEXT NULL,
  retired_at TIMESTAMPTZ NULL,
  retired_by_user_id TEXT NULL,
  retirement_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_rfx_contact_event_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key),
  CONSTRAINT source_event_rfx_contact_identity_fk
    FOREIGN KEY (client_key, vendor_id, contact_id)
    REFERENCES source.vendor_contact(tenant_key, vendor_id, contact_id),
  CONSTRAINT source_event_rfx_contact_candidate_fk
    FOREIGN KEY (client_key, source_event_id, vendor_id, candidate_authority_id)
    REFERENCES source_event_candidate_supplier_authority
      (client_key, source_event_id, vendor_id, authority_id),
  CONSTRAINT source_event_rfx_contact_identity_check
    CHECK (
      NULLIF(BTRIM(authority_id), '') IS NOT NULL
      AND NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(vendor_id), '') IS NOT NULL
      AND NULLIF(BTRIM(contact_id), '') IS NOT NULL
      AND NULLIF(BTRIM(candidate_authority_id), '') IS NOT NULL
      AND NULLIF(BTRIM(approved_contact_name), '') IS NOT NULL
      AND NULLIF(BTRIM(approved_contact_email), '') IS NOT NULL
    ),
  CONSTRAINT source_event_rfx_contact_state_check
    CHECK (authority_state IN ('draft', 'approved', 'retired')),
  CONSTRAINT source_event_rfx_contact_approval_check
    CHECK (
      authority_state <> 'approved'
      OR (
        NULLIF(BTRIM(approved_by_user_id), '') IS NOT NULL
        AND approved_at IS NOT NULL
        AND NULLIF(BTRIM(evidence_reference), '') IS NOT NULL
        AND retired_at IS NULL
        AND retired_by_user_id IS NULL
        AND retirement_reason IS NULL
      )
    ),
  CONSTRAINT source_event_rfx_contact_retirement_check
    CHECK (
      authority_state <> 'retired'
      OR (
        approved_at IS NOT NULL
        AND retired_at IS NOT NULL
        AND retired_at >= approved_at
        AND NULLIF(BTRIM(retired_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(retirement_reason), '') IS NOT NULL
      )
    ),
  UNIQUE (client_key, authority_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS source_event_rfx_contact_active_idx
  ON source_event_rfx_contact_authority
    (client_key, source_event_id, vendor_id, contact_id)
  WHERE authority_state <> 'retired';

COMMENT ON TABLE source_event_rfx_contact_authority IS
  'Named, evidenced contact approval for one supplier in one Source event. It is not a package release, invitation, receipt, or supplier communication.';

CREATE OR REPLACE FUNCTION prevent_source_event_rfx_contact_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.authority_state IN ('approved', 'retired') THEN
      RAISE EXCEPTION 'approved contact authority cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.authority_state = 'retired' THEN
    RAISE EXCEPTION 'retired contact authority is immutable';
  END IF;

  IF OLD.authority_state = 'approved' THEN
    IF NEW.authority_state = 'approved' THEN
      IF NEW IS DISTINCT FROM OLD THEN
        RAISE EXCEPTION 'approved contact authority is immutable';
      END IF;
    ELSIF NEW.authority_state = 'retired' THEN
      IF NEW.id IS DISTINCT FROM OLD.id
        OR NEW.authority_id IS DISTINCT FROM OLD.authority_id
        OR NEW.client_key IS DISTINCT FROM OLD.client_key
        OR NEW.source_event_id IS DISTINCT FROM OLD.source_event_id
        OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
        OR NEW.contact_id IS DISTINCT FROM OLD.contact_id
        OR NEW.candidate_authority_id IS DISTINCT FROM OLD.candidate_authority_id
        OR NEW.approved_contact_name IS DISTINCT FROM OLD.approved_contact_name
        OR NEW.approved_contact_email IS DISTINCT FROM OLD.approved_contact_email
        OR NEW.approved_by_user_id IS DISTINCT FROM OLD.approved_by_user_id
        OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
        OR NEW.evidence_reference IS DISTINCT FROM OLD.evidence_reference
        OR NEW.created_at IS DISTINCT FROM OLD.created_at
      THEN
        RAISE EXCEPTION 'retire contact authority without rewriting its approval';
      END IF;
    ELSE
      RAISE EXCEPTION 'approved contact authority may only be retired';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER source_event_rfx_contact_immutable_trigger
  BEFORE UPDATE OR DELETE ON source_event_rfx_contact_authority
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_event_rfx_contact_rewrite();

ALTER TABLE source.vendor_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_event_rfx_contact_authority ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_full_source_vendor_contact
  ON source.vendor_contact FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY authenticated_read_source_vendor_contact
  ON source.vendor_contact FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_key));

CREATE POLICY service_role_full_source_event_rfx_contact_authority
  ON source_event_rfx_contact_authority FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY authenticated_read_source_event_rfx_contact_authority
  ON source_event_rfx_contact_authority FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1 FROM source_events event
      WHERE event.id = source_event_rfx_contact_authority.source_event_id
        AND event.client_key = source_event_rfx_contact_authority.client_key
        AND can_read_tenant_by_key(event.client_key)
    )
  );

GRANT SELECT ON source.vendor_contact TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source.vendor_contact TO service_role;
GRANT SELECT ON source_event_rfx_contact_authority TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source_event_rfx_contact_authority TO service_role;
