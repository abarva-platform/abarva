-- Canonical authority for sourcing requests imported before a Source event exists.
-- Imported rows, classifier proposals, human mapping decisions, and event links
-- remain separate so an extract can never become authoritative merely by loading.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS source.intake_request_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  request_id TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_request_number TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_row INTEGER NOT NULL,
  source_status TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  extracted_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  raw_source JSONB NOT NULL,
  normalized_request JSONB NOT NULL,
  mapping_proposal JSONB NOT NULL,
  required_fact_gaps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_intake_request_version_identity_check CHECK (
    NULLIF(BTRIM(tenant_key), '') IS NOT NULL
    AND NULLIF(BTRIM(request_id), '') IS NOT NULL
    AND NULLIF(BTRIM(source_table), '') IS NOT NULL
    AND NULLIF(BTRIM(source_record_id), '') IS NOT NULL
    AND NULLIF(BTRIM(source_request_number), '') IS NOT NULL
    AND NULLIF(BTRIM(source_version), '') IS NOT NULL
  ),
  CONSTRAINT source_intake_request_version_system_check
    CHECK (source_system IN ('servicenow')),
  CONSTRAINT source_intake_request_version_row_check CHECK (source_row >= 2),
  CONSTRAINT source_intake_request_version_hash_check
    CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT source_intake_request_version_payload_check CHECK (
    jsonb_typeof(raw_source) = 'object'
    AND jsonb_typeof(normalized_request) = 'object'
    AND jsonb_typeof(mapping_proposal) = 'object'
  ),
  UNIQUE (tenant_key, request_id, source_version),
  UNIQUE (
    tenant_key,
    source_system,
    source_table,
    source_record_id,
    source_version
  )
);

CREATE INDEX IF NOT EXISTS source_intake_request_version_queue_idx
  ON source.intake_request_version(tenant_key, extracted_at DESC, request_id);

CREATE TABLE IF NOT EXISTS source.intake_request_mapping_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  request_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  decision_state TEXT NOT NULL,
  category_id TEXT NULL,
  archetype_id TEXT NULL,
  decided_by_user_id TEXT NOT NULL,
  decided_by_name TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_intake_request_mapping_version_fk
    FOREIGN KEY (tenant_key, request_id, source_version)
    REFERENCES source.intake_request_version(tenant_key, request_id, source_version),
  CONSTRAINT source_intake_request_mapping_identity_check CHECK (
    NULLIF(BTRIM(decision_id), '') IS NOT NULL
    AND NULLIF(BTRIM(decided_by_user_id), '') IS NOT NULL
    AND NULLIF(BTRIM(decided_by_name), '') IS NOT NULL
    AND NULLIF(BTRIM(rationale), '') IS NOT NULL
  ),
  CONSTRAINT source_intake_request_mapping_state_check
    CHECK (decision_state IN ('accepted', 'overridden', 'unmapped')),
  CONSTRAINT source_intake_request_mapping_value_check CHECK (
    (decision_state = 'unmapped' AND category_id IS NULL AND archetype_id IS NULL)
    OR
    (decision_state IN ('accepted', 'overridden')
      AND NULLIF(BTRIM(category_id), '') IS NOT NULL
      AND NULLIF(BTRIM(archetype_id), '') IS NOT NULL)
  ),
  UNIQUE (tenant_key, decision_id)
);

CREATE INDEX IF NOT EXISTS source_intake_request_mapping_current_idx
  ON source.intake_request_mapping_decision(
    tenant_key,
    request_id,
    source_version,
    decided_at DESC
  );

CREATE UNIQUE INDEX IF NOT EXISTS source_events_id_client_key_intake_idx
  ON source_events(id, client_key);

CREATE TABLE IF NOT EXISTS source.intake_request_event_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  request_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_event_id UUID NOT NULL,
  linked_by_user_id TEXT NOT NULL,
  linked_by_name TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_intake_request_event_version_fk
    FOREIGN KEY (tenant_key, request_id, source_version)
    REFERENCES source.intake_request_version(tenant_key, request_id, source_version),
  CONSTRAINT source_intake_request_event_fk
    FOREIGN KEY (source_event_id, tenant_key)
    REFERENCES source_events(id, client_key),
  CONSTRAINT source_intake_request_event_identity_check CHECK (
    NULLIF(BTRIM(link_id), '') IS NOT NULL
    AND NULLIF(BTRIM(linked_by_user_id), '') IS NOT NULL
    AND NULLIF(BTRIM(linked_by_name), '') IS NOT NULL
    AND NULLIF(BTRIM(rationale), '') IS NOT NULL
  ),
  UNIQUE (tenant_key, link_id),
  UNIQUE (tenant_key, request_id)
);

CREATE OR REPLACE FUNCTION source.prevent_intake_authority_rewrite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Source intake authority is append-only';
END;
$$;

DROP TRIGGER IF EXISTS source_intake_request_version_immutable
  ON source.intake_request_version;
CREATE TRIGGER source_intake_request_version_immutable
  BEFORE UPDATE OR DELETE ON source.intake_request_version
  FOR EACH ROW EXECUTE FUNCTION source.prevent_intake_authority_rewrite();

DROP TRIGGER IF EXISTS source_intake_request_mapping_immutable
  ON source.intake_request_mapping_decision;
CREATE TRIGGER source_intake_request_mapping_immutable
  BEFORE UPDATE OR DELETE ON source.intake_request_mapping_decision
  FOR EACH ROW EXECUTE FUNCTION source.prevent_intake_authority_rewrite();

DROP TRIGGER IF EXISTS source_intake_request_event_link_immutable
  ON source.intake_request_event_link;
CREATE TRIGGER source_intake_request_event_link_immutable
  BEFORE UPDATE OR DELETE ON source.intake_request_event_link
  FOR EACH ROW EXECUTE FUNCTION source.prevent_intake_authority_rewrite();

ALTER TABLE source.intake_request_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE source.intake_request_mapping_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE source.intake_request_event_link ENABLE ROW LEVEL SECURITY;

DO $policies$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'intake_request_version',
    'intake_request_mapping_decision',
    'intake_request_event_link'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS authenticated_read_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY authenticated_read_%I ON source.%I FOR SELECT TO authenticated USING (source.can_read_sourcing_tenant(tenant_key))',
      table_name,
      table_name
    );
    EXECUTE format('DROP POLICY IF EXISTS service_role_full_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY service_role_full_%I ON source.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      table_name,
      table_name
    );
    EXECUTE format('GRANT SELECT ON source.%I TO authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT ON source.%I TO service_role', table_name);
  END LOOP;
END;
$policies$;

COMMENT ON TABLE source.intake_request_version IS
  'Immutable source-versioned request intake before a Source event exists. Loading a row creates no event authority.';
COMMENT ON TABLE source.intake_request_mapping_decision IS
  'Append-only named human decision accepting, overriding, or declining the classifier proposal for one request version.';
COMMENT ON TABLE source.intake_request_event_link IS
  'One governed link from an imported request to the Source event created from it. The link is not event approval.';
