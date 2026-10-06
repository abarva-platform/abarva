-- A lab-only, event-scoped publication authority distinct from Legal publication.
-- No template, evidence, signature, or approval row is created by this migration.

ALTER TABLE source_nda_template_versions
  ADD COLUMN IF NOT EXISTS source_event_id UUID NULL,
  ADD COLUMN IF NOT EXISTS publication_authority_kind TEXT NOT NULL DEFAULT 'legal',
  ADD COLUMN IF NOT EXISTS published_by_admin_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS published_by_admin_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS publication_rationale TEXT NULL;

ALTER TABLE source_nda_template_versions
  ADD CONSTRAINT source_nda_template_versions_event_scope_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key),
  ADD CONSTRAINT source_nda_template_versions_authority_kind_check
    CHECK (publication_authority_kind IN ('legal', 'synthetic_admin')),
  ADD CONSTRAINT source_nda_template_versions_authority_scope_check
    CHECK (
      (publication_authority_kind = 'legal' AND source_event_id IS NULL
       AND published_by_admin_user_id IS NULL AND published_by_admin_name IS NULL
       AND publication_rationale IS NULL)
      OR
      (publication_authority_kind = 'synthetic_admin'
       AND client_key = 'meridian-health' AND source_event_id IS NOT NULL
       AND published_by_legal_user_id IS NULL AND published_by_legal_name IS NULL)
    );

ALTER TABLE source_nda_template_versions
  DROP CONSTRAINT source_nda_template_versions_publish_check;
ALTER TABLE source_nda_template_versions
  ADD CONSTRAINT source_nda_template_versions_publish_check
    CHECK (
      publication_state <> 'published'
      OR (
        published_at IS NOT NULL AND effective_from IS NOT NULL
        AND (
          (publication_authority_kind = 'legal'
           AND NULLIF(BTRIM(published_by_legal_user_id), '') IS NOT NULL
           AND NULLIF(BTRIM(published_by_legal_name), '') IS NOT NULL)
          OR
          (publication_authority_kind = 'synthetic_admin'
           AND NULLIF(BTRIM(published_by_admin_user_id), '') IS NOT NULL
           AND NULLIF(BTRIM(published_by_admin_name), '') IS NOT NULL
           AND LENGTH(BTRIM(COALESCE(publication_rationale, ''))) >= 12
           AND NULLIF(BTRIM(evidence_reference), '') IS NOT NULL)
        )
      )
    );

CREATE OR REPLACE FUNCTION prevent_published_source_nda_template_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.publication_state = 'published' AND (
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.source_event_id IS DISTINCT FROM OLD.source_event_id OR
    NEW.template_version IS DISTINCT FROM OLD.template_version OR
    NEW.template_code IS DISTINCT FROM OLD.template_code OR
    NEW.display_name IS DISTINCT FROM OLD.display_name OR
    NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256 OR
    NEW.publication_authority_kind IS DISTINCT FROM OLD.publication_authority_kind OR
    NEW.published_by_legal_user_id IS DISTINCT FROM OLD.published_by_legal_user_id OR
    NEW.published_by_legal_name IS DISTINCT FROM OLD.published_by_legal_name OR
    NEW.published_by_admin_user_id IS DISTINCT FROM OLD.published_by_admin_user_id OR
    NEW.published_by_admin_name IS DISTINCT FROM OLD.published_by_admin_name OR
    NEW.publication_rationale IS DISTINCT FROM OLD.publication_rationale OR
    NEW.published_at IS DISTINCT FROM OLD.published_at OR
    NEW.effective_from IS DISTINCT FROM OLD.effective_from OR
    NEW.evidence_reference IS DISTINCT FROM OLD.evidence_reference OR
    NOT (
      (NEW.publication_state = 'published' AND NEW.effective_to IS NOT DISTINCT FROM OLD.effective_to)
      OR (NEW.publication_state = 'retired' AND NEW.effective_to IS NOT NULL)
    )
  ) THEN
    RAISE EXCEPTION 'a published NDA template version is immutable; publish a new version';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN source_nda_template_versions.publication_authority_kind IS
  'Synthetic admin publication is a lab-only event-scoped test decision; it is not Legal publication or executed-signature evidence.';

CREATE OR REPLACE FUNCTION validate_source_nda_template_event_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM source_nda_template_versions template
    WHERE template.client_key = NEW.client_key
      AND template.template_version = NEW.template_version
      AND (template.source_event_id IS NULL OR template.source_event_id = NEW.source_event_id)
  ) THEN
    RAISE EXCEPTION 'NDA template version is not applicable to this event';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER source_executed_nda_template_event_scope_trigger
  BEFORE INSERT OR UPDATE OF client_key, source_event_id, template_version
  ON source_executed_nda_authority
  FOR EACH ROW
  EXECUTE FUNCTION validate_source_nda_template_event_scope();

CREATE TRIGGER source_nda_esign_envelope_template_event_scope_trigger
  BEFORE INSERT OR UPDATE OF client_key, source_event_id, template_version
  ON source_nda_esign_envelopes
  FOR EACH ROW
  EXECUTE FUNCTION validate_source_nda_template_event_scope();
