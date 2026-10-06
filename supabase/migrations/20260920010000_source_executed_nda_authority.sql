-- Canonical executed-NDA authority for Source Stage 05.
--
-- The File Cabinet proves that bytes exist. This relation records the
-- governed meaning needed for coverage: which event, declared supplier legal
-- entity, Legal-published template version, scope, and validity window those
-- executed bytes represent. It inserts no tenant rows and grants authenticated
-- users no write path.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE UNIQUE INDEX IF NOT EXISTS source_events_id_client_key_executed_nda_idx
  ON source_events(id, client_key);

CREATE UNIQUE INDEX IF NOT EXISTS source_artifacts_id_tenant_key_executed_nda_idx
  ON source_artifacts(id, tenant_key);

CREATE TABLE IF NOT EXISTS source_executed_nda_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nda_id TEXT NOT NULL,
  client_key TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  artifact_id UUID NOT NULL,
  supplier_legal_entity_id TEXT NOT NULL,
  template_version TEXT NOT NULL,
  scope_level TEXT NOT NULL,
  covered_affiliate_entity_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  executed_at TIMESTAMPTZ NOT NULL,
  uploaded_by_user_id TEXT NOT NULL,
  recorded_by_user_id TEXT NOT NULL,
  evidence_reference TEXT NULL,
  authority_state TEXT NOT NULL DEFAULT 'recorded',
  retired_at TIMESTAMPTZ NULL,
  retired_by_user_id TEXT NULL,
  retirement_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_executed_nda_authority_event_scope_fk
    FOREIGN KEY (source_event_id, client_key)
    REFERENCES source_events(id, client_key)
    ON DELETE CASCADE,
  CONSTRAINT source_executed_nda_authority_artifact_scope_fk
    FOREIGN KEY (artifact_id, client_key)
    REFERENCES source_artifacts(id, tenant_key),
  CONSTRAINT source_executed_nda_authority_supplier_fk
    FOREIGN KEY (client_key, supplier_legal_entity_id)
    REFERENCES source.vendor(tenant_key, vendor_id),
  CONSTRAINT source_executed_nda_authority_template_fk
    FOREIGN KEY (client_key, template_version)
    REFERENCES source_nda_template_versions(client_key, template_version),
  CONSTRAINT source_executed_nda_authority_identity_check
    CHECK (
      NULLIF(BTRIM(nda_id), '') IS NOT NULL
      AND NULLIF(BTRIM(client_key), '') IS NOT NULL
      AND NULLIF(BTRIM(supplier_legal_entity_id), '') IS NOT NULL
      AND NULLIF(BTRIM(template_version), '') IS NOT NULL
      AND NULLIF(BTRIM(uploaded_by_user_id), '') IS NOT NULL
      AND NULLIF(BTRIM(recorded_by_user_id), '') IS NOT NULL
    ),
  CONSTRAINT source_executed_nda_authority_scope_check
    CHECK (scope_level IN ('supplier_entity', 'supplier_and_affiliates', 'event_only')),
  CONSTRAINT source_executed_nda_authority_validity_check
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT source_executed_nda_authority_state_check
    CHECK (authority_state IN ('recorded', 'retired')),
  CONSTRAINT source_executed_nda_authority_retirement_check
    CHECK (
      (authority_state = 'recorded'
        AND retired_at IS NULL
        AND retired_by_user_id IS NULL
        AND retirement_reason IS NULL)
      OR
      (authority_state = 'retired'
        AND retired_at IS NOT NULL
        AND NULLIF(BTRIM(retired_by_user_id), '') IS NOT NULL
        AND NULLIF(BTRIM(retirement_reason), '') IS NOT NULL)
    ),
  UNIQUE (client_key, nda_id),
  UNIQUE (client_key, source_event_id, artifact_id, supplier_legal_entity_id)
);

CREATE INDEX IF NOT EXISTS source_executed_nda_authority_event_idx
  ON source_executed_nda_authority(
    client_key,
    source_event_id,
    supplier_legal_entity_id,
    authority_state
  );

COMMENT ON TABLE source_executed_nda_authority IS
  'Immutable governed meaning for one executed NDA artifact. File names and supplier-name strings never establish template, legal-entity, event, affiliate, or validity authority.';

CREATE OR REPLACE FUNCTION validate_source_executed_nda_artifact()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  artifact_row source_artifacts%ROWTYPE;
BEGIN
  SELECT * INTO artifact_row
  FROM source_artifacts
  WHERE id = NEW.artifact_id
    AND tenant_key = NEW.client_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'executed NDA artifact is unavailable in this tenant';
  END IF;

  IF artifact_row.source_event_id IS DISTINCT FROM NEW.source_event_id::text
     AND artifact_row.source_event_row_id IS DISTINCT FROM NEW.source_event_id THEN
    RAISE EXCEPTION 'executed NDA artifact belongs to another event';
  END IF;

  IF artifact_row.artifact_type <> 'nda_executed' THEN
    RAISE EXCEPTION 'executed NDA authority requires artifact_type nda_executed';
  END IF;

  IF artifact_row.lifecycle_state <> 'current' THEN
    RAISE EXCEPTION 'executed NDA authority requires the current artifact version';
  END IF;

  IF NULLIF(BTRIM(COALESCE(artifact_row.blob_sha256, artifact_row.sha256)), '') IS NULL THEN
    RAISE EXCEPTION 'executed NDA authority requires a recorded artifact hash';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_executed_nda_authority_artifact_trigger
  ON source_executed_nda_authority;
CREATE TRIGGER source_executed_nda_authority_artifact_trigger
  BEFORE INSERT OR UPDATE OF artifact_id, client_key, source_event_id
  ON source_executed_nda_authority
  FOR EACH ROW
  EXECUTE FUNCTION validate_source_executed_nda_artifact();

CREATE OR REPLACE FUNCTION prevent_source_executed_nda_authority_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.authority_state = 'retired' THEN
    RAISE EXCEPTION 'retired executed NDA authority is immutable';
  END IF;

  IF
    NEW.nda_id IS DISTINCT FROM OLD.nda_id OR
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.source_event_id IS DISTINCT FROM OLD.source_event_id OR
    NEW.artifact_id IS DISTINCT FROM OLD.artifact_id OR
    NEW.supplier_legal_entity_id IS DISTINCT FROM OLD.supplier_legal_entity_id OR
    NEW.template_version IS DISTINCT FROM OLD.template_version OR
    NEW.scope_level IS DISTINCT FROM OLD.scope_level OR
    NEW.covered_affiliate_entity_ids IS DISTINCT FROM OLD.covered_affiliate_entity_ids OR
    NEW.effective_from IS DISTINCT FROM OLD.effective_from OR
    NEW.effective_to IS DISTINCT FROM OLD.effective_to OR
    NEW.executed_at IS DISTINCT FROM OLD.executed_at OR
    NEW.uploaded_by_user_id IS DISTINCT FROM OLD.uploaded_by_user_id OR
    NEW.recorded_by_user_id IS DISTINCT FROM OLD.recorded_by_user_id OR
    NEW.evidence_reference IS DISTINCT FROM OLD.evidence_reference OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'executed NDA authority is immutable; retire and record a new row';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_executed_nda_authority_immutable_trigger
  ON source_executed_nda_authority;
CREATE TRIGGER source_executed_nda_authority_immutable_trigger
  BEFORE UPDATE ON source_executed_nda_authority
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_executed_nda_authority_rewrite();

ALTER TABLE source_executed_nda_authority ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_executed_nda_authority"
  ON source_executed_nda_authority;
CREATE POLICY "service_role_full_source_executed_nda_authority"
  ON source_executed_nda_authority
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_executed_nda_authority"
  ON source_executed_nda_authority;
CREATE POLICY "authenticated_read_source_executed_nda_authority"
  ON source_executed_nda_authority
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

GRANT SELECT ON source_executed_nda_authority TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source_executed_nda_authority TO service_role;
