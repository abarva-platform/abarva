-- Provider envelopes are workflow state, not executed-NDA authority. Only a
-- separately filed, reviewed executed artifact can establish coverage.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE UNIQUE INDEX IF NOT EXISTS source_nda_esign_candidate_identity_idx
  ON source_event_candidate_supplier_authority
  (id, client_key, source_event_id, vendor_id);

CREATE TABLE IF NOT EXISTS source_nda_esign_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  vendor_id TEXT NOT NULL,
  candidate_authority_id UUID NOT NULL,
  template_version TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_environment TEXT NOT NULL,
  provider_envelope_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL,
  viewed_at TIMESTAMPTZ NULL,
  declined_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  signed_document_blob_ref TEXT NULL,
  signed_document_sha256 TEXT NULL,
  certificate_blob_ref TEXT NULL,
  certificate_sha256 TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_nda_esign_event_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key),
  CONSTRAINT source_nda_esign_vendor_fk
    FOREIGN KEY (client_key, vendor_id)
    REFERENCES source.vendor(tenant_key, vendor_id),
  CONSTRAINT source_nda_esign_candidate_fk
    FOREIGN KEY (candidate_authority_id, client_key, source_event_id, vendor_id)
    REFERENCES source_event_candidate_supplier_authority(id, client_key, source_event_id, vendor_id),
  CONSTRAINT source_nda_esign_template_fk
    FOREIGN KEY (client_key, template_version)
    REFERENCES source_nda_template_versions(client_key, template_version),
  CONSTRAINT source_nda_esign_identity_check CHECK (
    NULLIF(BTRIM(client_key), '') IS NOT NULL
    AND NULLIF(BTRIM(vendor_id), '') IS NOT NULL
    AND NULLIF(BTRIM(template_version), '') IS NOT NULL
    AND NULLIF(BTRIM(provider), '') IS NOT NULL
    AND NULLIF(BTRIM(provider_envelope_id), '') IS NOT NULL
  ),
  CONSTRAINT source_nda_esign_environment_check
    CHECK (provider_environment IN ('demo', 'production')),
  CONSTRAINT source_nda_esign_environment_tenant_check
    CHECK ((provider_environment = 'demo') = (client_key = 'meridian-health')),
  CONSTRAINT source_nda_esign_status_check
    CHECK (status IN ('sent', 'viewed', 'completed', 'declined')),
  CONSTRAINT source_nda_esign_completion_check CHECK (
    status <> 'completed' OR (
      completed_at IS NOT NULL
      AND NULLIF(BTRIM(signed_document_blob_ref), '') IS NOT NULL
      AND NULLIF(BTRIM(certificate_blob_ref), '') IS NOT NULL
      AND signed_document_sha256 ~ '^[a-f0-9]{64}$'
      AND certificate_sha256 ~ '^[a-f0-9]{64}$'
      AND declined_at IS NULL
    )
  ),
  CONSTRAINT source_nda_esign_decline_check CHECK (
    status <> 'declined' OR (declined_at IS NOT NULL AND completed_at IS NULL)
  ),
  CONSTRAINT source_nda_esign_no_early_completion_check CHECK (
    status = 'completed' OR (
      completed_at IS NULL
      AND signed_document_blob_ref IS NULL
      AND signed_document_sha256 IS NULL
      AND certificate_blob_ref IS NULL
      AND certificate_sha256 IS NULL
    )
  ),
  CONSTRAINT source_nda_esign_timestamp_check CHECK (
    (viewed_at IS NULL OR viewed_at >= sent_at)
    AND (completed_at IS NULL OR completed_at >= sent_at)
    AND (declined_at IS NULL OR declined_at >= sent_at)
    AND (status <> 'viewed' OR viewed_at IS NOT NULL)
  ),
  UNIQUE (client_key, provider, provider_environment, provider_envelope_id)
);

CREATE INDEX IF NOT EXISTS source_nda_esign_event_idx
  ON source_nda_esign_envelopes(client_key, source_event_id, vendor_id, status);

COMMENT ON TABLE source_nda_esign_envelopes IS
  'Tenant/event/canonical-supplier-fenced provider envelope state. Completion bytes and certificate references do not themselves grant executed-NDA authority.';

CREATE OR REPLACE FUNCTION validate_source_nda_esign_envelope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM source_event_candidate_supplier_authority
    WHERE id = NEW.candidate_authority_id
      AND client_key = NEW.client_key
      AND source_event_id = NEW.source_event_id
      AND vendor_id = NEW.vendor_id
      AND authority_state = 'accepted' AND retired_at IS NULL
  ) THEN
    RAISE EXCEPTION 'NDA envelope requires an accepted event candidate';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM source_nda_template_versions
    WHERE client_key = NEW.client_key
      AND template_version = NEW.template_version
      AND publication_state = 'published'
      AND published_at <= NEW.sent_at
      AND effective_from <= NEW.sent_at::date
      AND (effective_to IS NULL OR effective_to >= NEW.sent_at::date)
  ) THEN
    RAISE EXCEPTION 'NDA envelope requires an applicable Legal-published template';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER source_nda_esign_envelope_validate_trigger
  BEFORE INSERT ON source_nda_esign_envelopes
  FOR EACH ROW EXECUTE FUNCTION validate_source_nda_esign_envelope();

CREATE OR REPLACE FUNCTION prevent_source_nda_esign_envelope_rewrite()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.client_key IS DISTINCT FROM OLD.client_key OR
     NEW.source_event_id IS DISTINCT FROM OLD.source_event_id OR
     NEW.vendor_id IS DISTINCT FROM OLD.vendor_id OR
     NEW.candidate_authority_id IS DISTINCT FROM OLD.candidate_authority_id OR
     NEW.template_version IS DISTINCT FROM OLD.template_version OR
     NEW.provider IS DISTINCT FROM OLD.provider OR
     NEW.provider_environment IS DISTINCT FROM OLD.provider_environment OR
     NEW.provider_envelope_id IS DISTINCT FROM OLD.provider_envelope_id OR
     NEW.sent_at IS DISTINCT FROM OLD.sent_at OR
     NEW.created_at IS DISTINCT FROM OLD.created_at OR
     (OLD.viewed_at IS NOT NULL AND NEW.viewed_at IS DISTINCT FROM OLD.viewed_at) OR
     (OLD.completed_at IS NOT NULL AND NEW.completed_at IS DISTINCT FROM OLD.completed_at) OR
     (OLD.declined_at IS NOT NULL AND NEW.declined_at IS DISTINCT FROM OLD.declined_at) OR
     (OLD.signed_document_blob_ref IS NOT NULL AND
       NEW.signed_document_blob_ref IS DISTINCT FROM OLD.signed_document_blob_ref) OR
     (OLD.signed_document_sha256 IS NOT NULL AND
       NEW.signed_document_sha256 IS DISTINCT FROM OLD.signed_document_sha256) OR
     (OLD.certificate_blob_ref IS NOT NULL AND
       NEW.certificate_blob_ref IS DISTINCT FROM OLD.certificate_blob_ref) OR
     (OLD.certificate_sha256 IS NOT NULL AND
       NEW.certificate_sha256 IS DISTINCT FROM OLD.certificate_sha256) OR
     OLD.status IN ('completed', 'declined') OR
     (OLD.status = 'viewed' AND NEW.status = 'sent') OR
     (NEW.status = 'sent' AND OLD.status <> 'sent') OR
     (NEW.status = 'viewed' AND OLD.status NOT IN ('sent', 'viewed'))
  THEN
    RAISE EXCEPTION 'NDA envelope identity and terminal evidence are immutable';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER source_nda_esign_envelope_immutable_trigger
  BEFORE UPDATE ON source_nda_esign_envelopes
  FOR EACH ROW EXECUTE FUNCTION prevent_source_nda_esign_envelope_rewrite();

ALTER TABLE source_nda_esign_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_source_nda_esign_envelopes"
  ON source_nda_esign_envelopes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_source_nda_esign_envelopes"
  ON source_nda_esign_envelopes FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1 FROM source_events se
      WHERE se.id = source_nda_esign_envelopes.source_event_id
        AND se.client_key = source_nda_esign_envelopes.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

GRANT SELECT ON source_nda_esign_envelopes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source_nda_esign_envelopes TO service_role;
