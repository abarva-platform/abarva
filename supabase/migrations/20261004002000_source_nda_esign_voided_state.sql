-- Provider voids are terminal workflow state, never executed-NDA evidence.
-- A fresh envelope may be created only after the prior one is terminal.

ALTER TABLE source_nda_esign_envelopes
  ADD COLUMN voided_at TIMESTAMPTZ NULL;

ALTER TABLE source_nda_esign_envelopes
  DROP CONSTRAINT source_nda_esign_status_check,
  ADD CONSTRAINT source_nda_esign_status_check
    CHECK (status IN ('created', 'sent', 'viewed', 'completed', 'declined', 'voided')),
  ADD CONSTRAINT source_nda_esign_voided_check CHECK (
    (status = 'voided' AND voided_at IS NOT NULL AND voided_at >= sent_at
      AND completed_at IS NULL AND declined_at IS NULL
      AND signed_document_blob_ref IS NULL AND signed_document_sha256 IS NULL
      AND certificate_blob_ref IS NULL AND certificate_sha256 IS NULL)
    OR (status <> 'voided' AND voided_at IS NULL)
  );

CREATE OR REPLACE FUNCTION prevent_source_nda_esign_voided_rewrite()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('completed', 'declined', 'voided') OR
     (OLD.voided_at IS NOT NULL AND NEW.voided_at IS DISTINCT FROM OLD.voided_at) OR
     (NEW.status = 'voided' AND OLD.status NOT IN ('sent', 'viewed'))
  THEN
    RAISE EXCEPTION 'NDA terminal envelope state is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER source_nda_esign_voided_immutable_trigger
  BEFORE UPDATE ON source_nda_esign_envelopes
  FOR EACH ROW EXECUTE FUNCTION prevent_source_nda_esign_voided_rewrite();
