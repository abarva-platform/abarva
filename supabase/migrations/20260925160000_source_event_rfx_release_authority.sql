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

-- A prepared package is one atomic snapshot, not three independently mutable
-- lists. A separate, governed issuance action is required before any contact.
CREATE TABLE IF NOT EXISTS source_event_rfx_package_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  package_id TEXT NOT NULL,
  package_version_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  snapshot_json TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL,
  release_state TEXT NOT NULL DEFAULT 'prepared'
    CHECK (release_state = 'prepared'),
  expires_at TIMESTAMPTZ NOT NULL,
  approved_by_user_id TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL,
  approval_evidence_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_rfx_package_event_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key),
  CONSTRAINT source_event_rfx_package_identity_check
    CHECK (
      NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(package_id), '') IS NOT NULL
      AND NULLIF(BTRIM(package_version_id), '') IS NOT NULL
      AND NULLIF(BTRIM(approved_by_user_id), '') IS NOT NULL
      AND NULLIF(BTRIM(approval_evidence_reference), '') IS NOT NULL
      AND snapshot_sha256 ~ '^[0-9a-f]{64}$'
      AND approved_at <= expires_at
    ),
  UNIQUE (client_key, package_version_id),
  UNIQUE (client_key, source_event_id, package_id, version_number)
);

COMMENT ON TABLE source_event_rfx_package_version IS
  'Atomic, immutable preparation of an RFx package and its exact recipients. Prepared does not mean issued, received, or externally transmitted.';

CREATE OR REPLACE FUNCTION validate_source_event_rfx_package_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  payload JSONB;
  artifact_record JSONB;
  recipient_record JSONB;
BEGIN
  payload := NEW.snapshot_json::jsonb;

  IF encode(digest(NEW.snapshot_json, 'sha256'), 'hex') <> NEW.snapshot_sha256
    OR payload->>'tenantKey' IS DISTINCT FROM NEW.client_key
    OR payload->>'eventId' IS DISTINCT FROM NEW.source_event_id::text
    OR payload->>'packageId' IS DISTINCT FROM NEW.package_id
    OR payload->>'packageVersionId' IS DISTINCT FROM NEW.package_version_id
    OR (payload->>'version')::integer IS DISTINCT FROM NEW.version_number
    OR payload->>'approvedByUserId' IS DISTINCT FROM NEW.approved_by_user_id
    OR (payload->>'approvedAt')::timestamptz IS DISTINCT FROM NEW.approved_at
    OR payload->>'approvalEvidenceReference' IS DISTINCT FROM NEW.approval_evidence_reference
    OR (payload->>'expiresAt')::timestamptz IS DISTINCT FROM NEW.expires_at
    OR NULLIF(BTRIM(payload->>'disclosureClassification'), '') IS NULL
    OR payload->'authentication'->>'method' IS NULL
    OR payload->'authentication'->>'method' = 'none'
    OR jsonb_typeof(payload->'artifacts') IS DISTINCT FROM 'array'
    OR jsonb_typeof(payload->'recipients') IS DISTINCT FROM 'array'
  THEN
    RAISE EXCEPTION 'prepared RFx package metadata or digest does not match its snapshot';
  END IF;

  IF jsonb_array_length(payload->'artifacts') = 0
    OR jsonb_array_length(payload->'recipients') = 0
    OR (SELECT COUNT(DISTINCT value->>'artifactId')
        FROM jsonb_array_elements(payload->'artifacts'))
       <> jsonb_array_length(payload->'artifacts')
    OR (SELECT COUNT(DISTINCT value->>'recipientId')
        FROM jsonb_array_elements(payload->'recipients'))
       <> jsonb_array_length(payload->'recipients')
  THEN
    RAISE EXCEPTION 'prepared RFx package requires distinct artifacts and recipients';
  END IF;

  IF NEW.expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'expired RFx package cannot be prepared';
  END IF;

  FOR artifact_record IN SELECT value FROM jsonb_array_elements(payload->'artifacts') LOOP
    PERFORM 1
    FROM source_artifacts artifact
    WHERE artifact.id = (artifact_record->>'artifactId')::uuid
      AND artifact.tenant_key = NEW.client_key
      AND (artifact.source_event_id = NEW.source_event_id::text
        OR artifact.source_event_row_id = NEW.source_event_id)
      AND artifact.lifecycle_state = 'current'
      AND artifact.deleted_at IS NULL
      AND COALESCE(artifact.blob_sha256, artifact.sha256) = artifact_record->>'sha256'
    FOR SHARE OF artifact;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'RFx artifact is not current, event-scoped, or byte-identical';
    END IF;
  END LOOP;

  FOR recipient_record IN SELECT value FROM jsonb_array_elements(payload->'recipients') LOOP
    IF NULLIF(BTRIM(recipient_record->>'recipientId'), '') IS NULL
      OR NULLIF(BTRIM(recipient_record->>'legalEntityId'), '') IS NULL
      OR NULLIF(BTRIM(recipient_record->>'contactId'), '') IS NULL
      OR num_nonnulls(recipient_record->>'ndaAuthorityId', recipient_record->>'waiverAuthorityId') <> 1
    THEN
      RAISE EXCEPTION 'RFx recipient lacks identity or exactly one NDA authority';
    END IF;

    PERFORM 1
    FROM source_event_rfx_contact_authority contact
    JOIN source.vendor_contact vendor_contact
      ON vendor_contact.tenant_key = contact.client_key
     AND vendor_contact.vendor_id = contact.vendor_id
     AND vendor_contact.contact_id = contact.contact_id
    JOIN source_event_candidate_supplier_authority candidate
      ON candidate.client_key = contact.client_key
     AND candidate.source_event_id = contact.source_event_id
     AND candidate.vendor_id = contact.vendor_id
     AND candidate.authority_id = contact.candidate_authority_id
    WHERE contact.client_key = NEW.client_key
      AND contact.source_event_id = NEW.source_event_id
      AND contact.authority_id = recipient_record->>'contactAuthorityId'
      AND contact.vendor_id = recipient_record->>'legalEntityId'
      AND contact.contact_id = recipient_record->>'contactId'
      AND contact.approved_contact_name = recipient_record->>'contactName'
      AND contact.approved_contact_email = recipient_record->>'contactEmail'
      AND contact.authority_state = 'approved'
      AND contact.retired_at IS NULL
      AND contact.approved_by_user_id IS NOT NULL
      AND contact.evidence_reference IS NOT NULL
      AND contact.approved_at <= NEW.approved_at
      AND vendor_contact.display_name = contact.approved_contact_name
      AND vendor_contact.email = contact.approved_contact_email
      AND vendor_contact.contact_policy = 'contact_allowed'
      AND vendor_contact.contact_state = 'active'
      AND candidate.authority_id = recipient_record->>'candidateAuthorityId'
      AND candidate.authority_state = 'accepted'
      AND candidate.retired_at IS NULL
    FOR SHARE OF contact, vendor_contact, candidate;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'RFx recipient lacks active candidate and named-contact authority';
    END IF;

    IF recipient_record ? 'ndaAuthorityId' THEN
      PERFORM 1
      FROM source_executed_nda_authority nda
      JOIN source_nda_template_versions template
        ON template.client_key = nda.client_key
       AND template.template_version = nda.template_version
      JOIN source_artifacts evidence
        ON evidence.id = nda.artifact_id
       AND evidence.tenant_key = nda.client_key
      WHERE nda.client_key = NEW.client_key
        AND nda.source_event_id = NEW.source_event_id
        AND nda.supplier_legal_entity_id = recipient_record->>'legalEntityId'
        AND nda.nda_id = recipient_record->>'ndaAuthorityId'
        AND nda.authority_state = 'recorded'
        AND nda.retired_at IS NULL
        AND nda.executed_at <= NEW.approved_at
        AND nda.effective_from <= NEW.approved_at::date
        AND (nda.effective_to IS NULL OR nda.effective_to >= NEW.approved_at::date)
        AND nda.signature_method IN ('wet_ink', 'e_signature_out_of_band')
        AND NULLIF(BTRIM(nda.supplier_signatory_name), '') IS NOT NULL
        AND NULLIF(BTRIM(nda.buyer_signatory_name), '') IS NOT NULL
        AND (nda.certificate_sha256 IS NOT NULL OR nda.private_evidence_ref IS NOT NULL)
        AND template.publication_state = 'published'
        AND template.effective_from <= NEW.approved_at::date
        AND (template.effective_to IS NULL OR template.effective_to >= NEW.approved_at::date)
        AND evidence.artifact_type = 'nda_executed'
        AND evidence.lifecycle_state = 'current'
        AND COALESCE(evidence.blob_sha256, evidence.sha256) IS NOT NULL
      FOR SHARE OF nda, template, evidence;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'RFx recipient lacks current executed NDA evidence';
      END IF;
    ELSE
      PERFORM 1
      FROM source_event_nda_waivers waiver
      WHERE waiver.client_key = NEW.client_key
        AND waiver.source_event_id = NEW.source_event_id
        AND waiver.supplier_legal_entity_id = recipient_record->>'legalEntityId'
        AND waiver.waiver_id = recipient_record->>'waiverAuthorityId'
        AND waiver.revoked_at IS NULL
        AND waiver.approved_at <= NEW.approved_at
        AND waiver.expires_at >= NEW.approved_at
        AND NULLIF(BTRIM(waiver.reason), '') IS NOT NULL
        AND NULLIF(BTRIM(waiver.approved_by_legal_name), '') IS NOT NULL
      FOR SHARE OF waiver;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'RFx recipient lacks current named Legal waiver';
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER source_event_rfx_package_validate_trigger
  BEFORE INSERT ON source_event_rfx_package_version
  FOR EACH ROW
  EXECUTE FUNCTION validate_source_event_rfx_package_version();

CREATE OR REPLACE FUNCTION prevent_source_event_rfx_package_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'prepared RFx package versions are immutable';
END;
$$;

CREATE TRIGGER source_event_rfx_package_immutable_trigger
  BEFORE UPDATE OR DELETE ON source_event_rfx_package_version
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_event_rfx_package_rewrite();

ALTER TABLE source_event_rfx_package_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_full_source_event_rfx_package_version
  ON source_event_rfx_package_version FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY authenticated_read_source_event_rfx_package_version
  ON source_event_rfx_package_version FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1 FROM source_events event
      WHERE event.id = source_event_rfx_package_version.source_event_id
        AND event.client_key = source_event_rfx_package_version.client_key
    )
  );
GRANT SELECT ON source_event_rfx_package_version TO authenticated;
GRANT SELECT, INSERT ON source_event_rfx_package_version TO service_role;
