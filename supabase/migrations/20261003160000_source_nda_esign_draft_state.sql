-- A provider draft must be durably recorded before a send request. Completion
-- remains workflow state, not executed-NDA authority.

ALTER TABLE source_nda_esign_envelopes
  ADD COLUMN document_sha256 TEXT NULL;

ALTER TABLE source_nda_esign_envelopes
  ALTER COLUMN sent_at DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'created';

ALTER TABLE source_nda_esign_envelopes
  DROP CONSTRAINT source_nda_esign_status_check,
  ADD CONSTRAINT source_nda_esign_status_check
    CHECK (status IN ('created', 'sent', 'viewed', 'completed', 'declined')),
  ADD CONSTRAINT source_nda_esign_document_hash_check
    CHECK (
      (document_sha256 IS NULL OR document_sha256 ~ '^[a-f0-9]{64}$')
      AND (status <> 'created' OR document_sha256 IS NOT NULL)
    );

ALTER TABLE source_nda_esign_envelopes
  DROP CONSTRAINT source_nda_esign_timestamp_check,
  ADD CONSTRAINT source_nda_esign_timestamp_check CHECK (
    (status = 'created' AND sent_at IS NULL AND viewed_at IS NULL
      AND declined_at IS NULL AND completed_at IS NULL)
    OR
    (status <> 'created' AND sent_at IS NOT NULL
      AND (viewed_at IS NULL OR viewed_at >= sent_at)
      AND (completed_at IS NULL OR completed_at >= sent_at)
      AND (declined_at IS NULL OR declined_at >= sent_at)
      AND (status <> 'viewed' OR viewed_at IS NOT NULL))
  );

CREATE OR REPLACE FUNCTION validate_source_nda_esign_envelope()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> 'created' OR NEW.sent_at IS NOT NULL THEN
    RAISE EXCEPTION 'NDA envelope must be recorded as an unsent draft';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM source_event_candidate_supplier_authority candidate
    WHERE candidate.id = NEW.candidate_authority_id
      AND candidate.client_key = NEW.client_key
      AND candidate.source_event_id = NEW.source_event_id
      AND candidate.vendor_id = NEW.vendor_id
      AND candidate.authority_state = 'accepted' AND candidate.retired_at IS NULL
  ) THEN
    RAISE EXCEPTION 'NDA draft requires an accepted event candidate';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM source_nda_template_versions template
    WHERE template.client_key = NEW.client_key
      AND template.template_version = NEW.template_version
      AND template.content_sha256 = NEW.document_sha256
      AND template.publication_state = 'published'
      AND template.published_at <= NEW.created_at
      AND template.effective_from <= NEW.created_at::date
      AND (template.effective_to IS NULL OR template.effective_to >= NEW.created_at::date)
  ) THEN
    RAISE EXCEPTION 'NDA draft requires the exact applicable Legal-published document';
  END IF;
  RETURN NEW;
END;
$$;

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
     NEW.document_sha256 IS DISTINCT FROM OLD.document_sha256 OR
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
     (OLD.status = 'created' AND NOT (
       NEW.status = 'sent' AND NEW.sent_at IS NOT NULL
       AND OLD.sent_at IS NULL AND NEW.sent_at >= OLD.created_at
       AND NEW.viewed_at IS NULL AND NEW.declined_at IS NULL
       AND NEW.completed_at IS NULL
     )) OR
     (OLD.status <> 'created' AND NEW.sent_at IS DISTINCT FROM OLD.sent_at) OR
     (OLD.status = 'viewed' AND NEW.status = 'sent') OR
     (NEW.status = 'created' AND OLD.status <> 'created') OR
     (NEW.status = 'sent' AND OLD.status NOT IN ('created', 'sent')) OR
     (NEW.status = 'viewed' AND OLD.status NOT IN ('sent', 'viewed'))
  THEN
    RAISE EXCEPTION 'NDA envelope identity and terminal evidence are immutable';
  END IF;

  IF OLD.status = 'created' THEN
    IF NOT EXISTS (
      SELECT 1 FROM source_event_candidate_supplier_authority candidate
      WHERE candidate.id = NEW.candidate_authority_id
        AND candidate.client_key = NEW.client_key
        AND candidate.source_event_id = NEW.source_event_id
        AND candidate.vendor_id = NEW.vendor_id
        AND candidate.authority_state = 'accepted' AND candidate.retired_at IS NULL
    ) THEN
      RAISE EXCEPTION 'NDA send requires a currently accepted event candidate';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM source_nda_template_versions template
      WHERE template.client_key = NEW.client_key
        AND template.template_version = NEW.template_version
        AND template.content_sha256 = NEW.document_sha256
        AND template.publication_state = 'published'
        AND template.published_at <= NEW.sent_at
        AND template.effective_from <= NEW.sent_at::date
        AND (template.effective_to IS NULL OR template.effective_to >= NEW.sent_at::date)
    ) THEN
      RAISE EXCEPTION 'NDA send requires the exact applicable Legal-published document';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
