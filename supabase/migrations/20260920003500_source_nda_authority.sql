-- Canonical authority for Source Stage 05 NDA readiness.
--
-- Legal publishes versioned NDA templates. A waiver is a separate, explicit,
-- named and time-bound decision for one event and one declared supplier legal
-- entity. This migration creates authority only; it inserts no tenant rows and
-- grants authenticated users no write path.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE UNIQUE INDEX IF NOT EXISTS source_events_id_client_key_nda_idx
  ON source_events(id, client_key);

CREATE TABLE IF NOT EXISTS source_nda_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key TEXT NOT NULL,
  template_version TEXT NOT NULL,
  template_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  publication_state TEXT NOT NULL DEFAULT 'draft',
  content_sha256 TEXT NOT NULL,
  published_by_legal_user_id TEXT NULL,
  published_by_legal_name TEXT NULL,
  published_at TIMESTAMPTZ NULL,
  effective_from DATE NULL,
  effective_to DATE NULL,
  evidence_reference TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_nda_template_versions_identity_check
    CHECK (
      NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(template_version), '') IS NOT NULL
      AND NULLIF(BTRIM(template_code), '') IS NOT NULL
      AND NULLIF(BTRIM(display_name), '') IS NOT NULL
    ),
  CONSTRAINT source_nda_template_versions_state_check
    CHECK (publication_state IN ('draft', 'published', 'retired')),
  CONSTRAINT source_nda_template_versions_hash_check
    CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT source_nda_template_versions_publish_check
    CHECK (
      publication_state <> 'published'
      OR (
        NULLIF(BTRIM(published_by_legal_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(published_by_legal_name), '') IS NOT NULL
        AND published_at IS NOT NULL
        AND effective_from IS NOT NULL
      )
    ),
  CONSTRAINT source_nda_template_versions_effective_window_check
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from),
  UNIQUE (client_key, template_version)
);

CREATE INDEX IF NOT EXISTS source_nda_template_versions_published_idx
  ON source_nda_template_versions(client_key, publication_state, effective_from, effective_to);

COMMENT ON TABLE source_nda_template_versions IS
  'Legal-owned, versioned NDA template registry. An existing empty tenant slice means the registry is modelled but Legal has published no applicable version; a missing relation is unavailable and fails readiness closed.';

CREATE TABLE IF NOT EXISTS source_event_nda_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  supplier_legal_entity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  approved_by_legal_user_id TEXT NOT NULL,
  approved_by_legal_name TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL,
  evidence_reference TEXT NULL,
  revoked_at TIMESTAMPTZ NULL,
  revoked_by_user_id TEXT NULL,
  revocation_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_nda_waivers_event_scope_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key)
    ON DELETE CASCADE,
  CONSTRAINT source_event_nda_waivers_identity_check
    CHECK (
      NULLIF(BTRIM(waiver_id), '') IS NOT NULL
      AND NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(supplier_legal_entity_id), '') IS NOT NULL
    ),
  CONSTRAINT source_event_nda_waivers_reason_check
    CHECK (NULLIF(BTRIM(reason), '') IS NOT NULL),
  CONSTRAINT source_event_nda_waivers_approver_check
    CHECK (
      NULLIF(BTRIM(approved_by_legal_user_id), '') IS NOT NULL
      AND NULLIF(BTRIM(approved_by_legal_name), '') IS NOT NULL
    ),
  CONSTRAINT source_event_nda_waivers_expiry_check
    CHECK (expires_at > approved_at),
  CONSTRAINT source_event_nda_waivers_revocation_check
    CHECK (
      (revoked_at IS NULL AND revoked_by_user_id IS NULL AND revocation_reason IS NULL)
      OR (
        revoked_at IS NOT NULL
        AND NULLIF(BTRIM(revoked_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(revocation_reason), '') IS NOT NULL
      )
    ),
  UNIQUE (client_key, waiver_id)
);

CREATE INDEX IF NOT EXISTS source_event_nda_waivers_event_idx
  ON source_event_nda_waivers(client_key, source_event_id, supplier_legal_entity_id)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE source_event_nda_waivers IS
  'Explicit, time-bound Legal waiver authority for one Source event and one declared supplier legal entity. A waiver is never inferred from missing documents or workflow state.';

CREATE OR REPLACE FUNCTION prevent_published_source_nda_template_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.publication_state = 'published' AND (
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.template_version IS DISTINCT FROM OLD.template_version OR
    NEW.template_code IS DISTINCT FROM OLD.template_code OR
    NEW.display_name IS DISTINCT FROM OLD.display_name OR
    NEW.content_sha256 IS DISTINCT FROM OLD.content_sha256 OR
    NEW.published_by_legal_user_id IS DISTINCT FROM OLD.published_by_legal_user_id OR
    NEW.published_by_legal_name IS DISTINCT FROM OLD.published_by_legal_name OR
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

DROP TRIGGER IF EXISTS source_nda_template_versions_immutable_trigger
  ON source_nda_template_versions;
CREATE TRIGGER source_nda_template_versions_immutable_trigger
  BEFORE UPDATE ON source_nda_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_source_nda_template_rewrite();

CREATE OR REPLACE FUNCTION prevent_source_event_nda_waiver_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF
    NEW.waiver_id IS DISTINCT FROM OLD.waiver_id OR
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.source_event_id IS DISTINCT FROM OLD.source_event_id OR
    NEW.supplier_legal_entity_id IS DISTINCT FROM OLD.supplier_legal_entity_id OR
    NEW.reason IS DISTINCT FROM OLD.reason OR
    NEW.expires_at IS DISTINCT FROM OLD.expires_at OR
    NEW.approved_by_legal_user_id IS DISTINCT FROM OLD.approved_by_legal_user_id OR
    NEW.approved_by_legal_name IS DISTINCT FROM OLD.approved_by_legal_name OR
    NEW.approved_at IS DISTINCT FROM OLD.approved_at OR
    NEW.evidence_reference IS DISTINCT FROM OLD.evidence_reference OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'an approved NDA waiver is immutable; revoke it instead of rewriting it';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_event_nda_waivers_immutable_trigger
  ON source_event_nda_waivers;
CREATE TRIGGER source_event_nda_waivers_immutable_trigger
  BEFORE UPDATE ON source_event_nda_waivers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_event_nda_waiver_rewrite();

ALTER TABLE source_nda_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_event_nda_waivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_nda_template_versions"
  ON source_nda_template_versions;
CREATE POLICY "service_role_full_source_nda_template_versions"
  ON source_nda_template_versions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_nda_template_versions"
  ON source_nda_template_versions;
CREATE POLICY "authenticated_read_source_nda_template_versions"
  ON source_nda_template_versions
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

DROP POLICY IF EXISTS "service_role_full_source_event_nda_waivers"
  ON source_event_nda_waivers;
CREATE POLICY "service_role_full_source_event_nda_waivers"
  ON source_event_nda_waivers
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_nda_waivers"
  ON source_event_nda_waivers;
CREATE POLICY "authenticated_read_source_event_nda_waivers"
  ON source_event_nda_waivers
  FOR SELECT TO authenticated
  USING (
    can_read_tenant_by_key(client_key)
    AND EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_nda_waivers.source_event_id
        AND se.client_key = source_event_nda_waivers.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

GRANT SELECT ON source_nda_template_versions TO authenticated;
GRANT SELECT ON source_event_nda_waivers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source_nda_template_versions TO service_role;
GRANT SELECT, INSERT, UPDATE ON source_event_nda_waivers TO service_role;
