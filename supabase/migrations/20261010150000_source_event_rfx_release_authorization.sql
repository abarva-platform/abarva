-- A prepared RFx package is not released. This append-only decision binds a
-- named operator to the exact prepared snapshot after rechecking its sources.
-- Delivery, supplier access, and receipt remain separate records.

CREATE TABLE IF NOT EXISTS source_event_rfx_release_authorization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  package_version_id TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  authorized_by_user_id TEXT NOT NULL,
  authorized_at TIMESTAMPTZ NOT NULL,
  release_evidence_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_rfx_authorization_event_fk
    FOREIGN KEY (source_event_id, client_key) REFERENCES source_events(id, client_key),
  CONSTRAINT source_event_rfx_authorization_package_fk
    FOREIGN KEY (client_key, package_version_id)
    REFERENCES source_event_rfx_package_version(client_key, package_version_id),
  CONSTRAINT source_event_rfx_authorization_identity_check CHECK (
    NULLIF(BTRIM(client_key), '') IS NOT NULL
    AND NULLIF(BTRIM(package_version_id), '') IS NOT NULL
    AND NULLIF(BTRIM(authorized_by_user_id), '') IS NOT NULL
    AND NULLIF(BTRIM(release_evidence_reference), '') IS NOT NULL
  ),
  UNIQUE (client_key, source_event_id, package_version_id)
);

COMMENT ON TABLE source_event_rfx_release_authorization IS
  'Immutable human authorization decision for one digest-bound prepared RFx version. It is not external delivery or supplier receipt.';

CREATE OR REPLACE FUNCTION validate_source_event_rfx_release_authorization()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  package_row source_event_rfx_package_version%ROWTYPE;
  payload JSONB;
  artifact_record JSONB;
  recipient_record JSONB;
BEGIN
  NEW.authorized_at := clock_timestamp();
  SELECT * INTO package_row
  FROM source_event_rfx_package_version
  WHERE client_key = NEW.client_key
    AND source_event_id = NEW.source_event_id
    AND package_version_id = NEW.package_version_id
  FOR SHARE;

  IF NOT FOUND OR package_row.release_state <> 'prepared'
    OR package_row.snapshot_sha256 <> NEW.snapshot_sha256
    OR encode(digest(package_row.snapshot_json, 'sha256'), 'hex') <> NEW.snapshot_sha256
    OR NEW.authorized_at < package_row.approved_at
    OR NEW.authorized_at >= package_row.expires_at
  THEN
    RAISE EXCEPTION 'RFx authorization requires one current digest-bound prepared package';
  END IF;

  payload := package_row.snapshot_json::jsonb;
  IF payload->>'tenantKey' IS DISTINCT FROM NEW.client_key
    OR payload->>'eventId' IS DISTINCT FROM NEW.source_event_id::text
    OR payload->>'packageVersionId' IS DISTINCT FROM NEW.package_version_id
    OR jsonb_typeof(payload->'artifacts') IS DISTINCT FROM 'array'
    OR jsonb_typeof(payload->'recipients') IS DISTINCT FROM 'array'
    OR jsonb_array_length(payload->'artifacts') = 0
    OR jsonb_array_length(payload->'recipients') = 0
  THEN
    RAISE EXCEPTION 'RFx authorization snapshot is incomplete or mismatched';
  END IF;

  FOR artifact_record IN SELECT value FROM jsonb_array_elements(payload->'artifacts') LOOP
    PERFORM 1 FROM source_artifacts artifact
    WHERE artifact.id = (artifact_record->>'artifactId')::uuid
      AND artifact.tenant_key = NEW.client_key
      AND (artifact.source_event_id = NEW.source_event_id::text
        OR artifact.source_event_row_id = NEW.source_event_id)
      AND artifact.lifecycle_state = 'current'
      AND artifact.deleted_at IS NULL
      AND COALESCE(artifact.blob_sha256, artifact.sha256) = artifact_record->>'sha256'
    FOR SHARE OF artifact;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'RFx authorization artifact is unavailable or byte-mismatched';
    END IF;
  END LOOP;

  FOR recipient_record IN SELECT value FROM jsonb_array_elements(payload->'recipients') LOOP
    IF num_nonnulls(recipient_record->>'ndaAuthorityId',
      recipient_record->>'waiverAuthorityId') <> 1
    THEN
      RAISE EXCEPTION 'RFx authorization recipient lacks one NDA or waiver authority';
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
    JOIN source.vendor vendor
      ON vendor.tenant_key = candidate.client_key
     AND vendor.vendor_id = candidate.vendor_id
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
      AND contact.approved_at <= NEW.authorized_at
      AND vendor_contact.display_name = contact.approved_contact_name
      AND vendor_contact.email = contact.approved_contact_email
      AND vendor_contact.contact_policy = 'contact_allowed'
      AND vendor_contact.contact_state = 'active'
      AND candidate.authority_id = recipient_record->>'candidateAuthorityId'
      AND candidate.authority_state = 'accepted'
      AND candidate.retired_at IS NULL
      AND vendor.active_state = 'active'
      AND COALESCE(
        vendor.raw_payload->'candidate_supplier_registry'->>'contactPolicy',
        vendor.raw_payload->'candidate_supplier_registry'->>'contact_policy',
        vendor.raw_payload->'candidateSupplierRegistry'->>'contactPolicy',
        vendor.raw_payload->'candidateSupplierRegistry'->>'contact_policy'
      ) = 'contact_allowed'
    FOR SHARE OF contact, vendor_contact, candidate, vendor;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'RFx authorization recipient lacks active candidate and contact authority';
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
        AND nda.executed_at <= NEW.authorized_at
        AND nda.effective_from <= NEW.authorized_at::date
        AND (nda.effective_to IS NULL OR nda.effective_to >= NEW.authorized_at::date)
        AND nda.signature_method IN ('wet_ink', 'e_signature_out_of_band')
        AND NULLIF(BTRIM(nda.supplier_signatory_name), '') IS NOT NULL
        AND NULLIF(BTRIM(nda.buyer_signatory_name), '') IS NOT NULL
        AND (nda.certificate_sha256 IS NOT NULL OR nda.private_evidence_ref IS NOT NULL)
        AND template.publication_state = 'published'
        AND template.effective_from <= NEW.authorized_at::date
        AND (template.effective_to IS NULL OR template.effective_to >= NEW.authorized_at::date)
        AND evidence.artifact_type = 'nda_executed'
        AND evidence.lifecycle_state = 'current'
        AND evidence.deleted_at IS NULL
        AND (evidence.source_event_id = NEW.source_event_id::text
          OR evidence.source_event_row_id = NEW.source_event_id)
        AND COALESCE(evidence.blob_sha256, evidence.sha256) =
          recipient_record->>'ndaDocumentSha256'
        AND recipient_record->>'ndaDocumentSha256' ~ '^[0-9a-f]{64}$'
      FOR SHARE OF nda, template, evidence;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'RFx authorization lacks current executed NDA evidence';
      END IF;
    ELSE
      PERFORM 1 FROM source_event_nda_waivers waiver
      WHERE waiver.client_key = NEW.client_key
        AND waiver.source_event_id = NEW.source_event_id
        AND waiver.supplier_legal_entity_id = recipient_record->>'legalEntityId'
        AND waiver.waiver_id = recipient_record->>'waiverAuthorityId'
        AND waiver.revoked_at IS NULL
        AND waiver.approved_at <= NEW.authorized_at
        AND waiver.expires_at >= NEW.authorized_at
        AND NULLIF(BTRIM(waiver.reason), '') IS NOT NULL
        AND NULLIF(BTRIM(waiver.approved_by_legal_name), '') IS NOT NULL
      FOR SHARE OF waiver;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'RFx authorization lacks current named Legal waiver';
      END IF;
    END IF;
  END LOOP;

  -- Lock waits can cross an expiry boundary. Stamp and check the final decision
  -- time after all referenced authority rows have been locked.
  NEW.authorized_at := clock_timestamp();
  IF NEW.authorized_at >= package_row.expires_at THEN
    RAISE EXCEPTION 'RFx package expired before authorization completed';
  END IF;
  FOR recipient_record IN SELECT value FROM jsonb_array_elements(payload->'recipients') LOOP
    IF recipient_record ? 'ndaAuthorityId' THEN
      PERFORM 1
      FROM source_executed_nda_authority nda
      JOIN source_nda_template_versions template
        ON template.client_key = nda.client_key
       AND template.template_version = nda.template_version
      WHERE nda.client_key = NEW.client_key
        AND nda.source_event_id = NEW.source_event_id
        AND nda.nda_id = recipient_record->>'ndaAuthorityId'
        AND nda.effective_from <= NEW.authorized_at::date
        AND (nda.effective_to IS NULL OR nda.effective_to >= NEW.authorized_at::date)
        AND template.effective_from <= NEW.authorized_at::date
        AND (template.effective_to IS NULL OR template.effective_to >= NEW.authorized_at::date);
    ELSE
      PERFORM 1 FROM source_event_nda_waivers waiver
      WHERE waiver.client_key = NEW.client_key
        AND waiver.source_event_id = NEW.source_event_id
        AND waiver.waiver_id = recipient_record->>'waiverAuthorityId'
        AND waiver.expires_at >= NEW.authorized_at;
    END IF;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'RFx NDA or waiver expired before authorization completed';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER source_event_rfx_authorization_validate_trigger
  BEFORE INSERT ON source_event_rfx_release_authorization
  FOR EACH ROW EXECUTE FUNCTION validate_source_event_rfx_release_authorization();

CREATE OR REPLACE FUNCTION prevent_source_event_rfx_authorization_rewrite()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'RFx authorization decisions are immutable';
END;
$$;

CREATE TRIGGER source_event_rfx_authorization_immutable_trigger
  BEFORE UPDATE OR DELETE ON source_event_rfx_release_authorization
  FOR EACH ROW EXECUTE FUNCTION prevent_source_event_rfx_authorization_rewrite();

ALTER TABLE source_event_rfx_release_authorization ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_full_source_event_rfx_release_authorization
  ON source_event_rfx_release_authorization FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY authenticated_read_source_event_rfx_release_authorization
  ON source_event_rfx_release_authorization FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1 FROM source_events event
      WHERE event.id = source_event_rfx_release_authorization.source_event_id
        AND event.client_key = source_event_rfx_release_authorization.client_key
    )
  );
GRANT SELECT ON source_event_rfx_release_authorization TO authenticated;
GRANT SELECT, INSERT ON source_event_rfx_release_authorization TO service_role;
