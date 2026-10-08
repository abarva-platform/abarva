-- A request-level decision is distinct from a field-mapping decision. Keep each
-- decision bound to an immutable imported version and preserve merged requests.

CREATE TABLE IF NOT EXISTS source.intake_request_disposition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  request_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  disposition_state TEXT NOT NULL,
  surviving_request_id TEXT NULL,
  surviving_source_version TEXT NULL,
  rationale TEXT NULL,
  decided_by_user_id TEXT NOT NULL,
  decided_by_name TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_intake_request_disposition_subject_fk
    FOREIGN KEY (tenant_key, request_id, source_version)
    REFERENCES source.intake_request_version(tenant_key, request_id, source_version),
  CONSTRAINT source_intake_request_disposition_survivor_fk
    FOREIGN KEY (tenant_key, surviving_request_id, surviving_source_version)
    REFERENCES source.intake_request_version(tenant_key, request_id, source_version),
  CONSTRAINT source_intake_request_disposition_identity_check CHECK (
    NULLIF(BTRIM(tenant_key), '') IS NOT NULL
    AND NULLIF(BTRIM(request_id), '') IS NOT NULL
    AND NULLIF(BTRIM(source_version), '') IS NOT NULL
    AND NULLIF(BTRIM(decided_by_user_id), '') IS NOT NULL
    AND NULLIF(BTRIM(decided_by_name), '') IS NOT NULL
  ),
  CONSTRAINT source_intake_request_disposition_state_check
    CHECK (disposition_state IN ('accepted', 'returned', 'merged', 'declined')),
  CONSTRAINT source_intake_request_disposition_rationale_check CHECK (
    disposition_state NOT IN ('returned', 'merged', 'declined')
    OR NULLIF(BTRIM(rationale), '') IS NOT NULL
  ),
  CONSTRAINT source_intake_request_disposition_survivor_check CHECK (
    (disposition_state = 'merged'
      AND surviving_request_id IS NOT NULL
      AND surviving_source_version IS NOT NULL
      AND NULLIF(BTRIM(surviving_request_id), '') IS NOT NULL
      AND NULLIF(BTRIM(surviving_source_version), '') IS NOT NULL
      AND surviving_request_id <> request_id)
    OR
    (disposition_state <> 'merged'
      AND surviving_request_id IS NULL
      AND surviving_source_version IS NULL)
  ),
  UNIQUE (tenant_key, request_id, source_version)
);

CREATE INDEX IF NOT EXISTS source_intake_request_disposition_queue_idx
  ON source.intake_request_disposition(tenant_key, decided_at DESC, request_id);

CREATE TRIGGER source_intake_request_disposition_immutable
  BEFORE UPDATE OR DELETE ON source.intake_request_disposition
  FOR EACH ROW EXECUTE FUNCTION source.prevent_intake_authority_rewrite();

ALTER TABLE source.intake_request_disposition ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_read_intake_request_disposition
  ON source.intake_request_disposition FOR SELECT TO authenticated
  USING (source.can_read_sourcing_tenant(tenant_key));

CREATE POLICY service_role_full_intake_request_disposition
  ON source.intake_request_disposition FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON source.intake_request_disposition TO authenticated;
GRANT SELECT, INSERT ON source.intake_request_disposition TO service_role;

COMMENT ON TABLE source.intake_request_disposition IS
  'Append-only request-level acceptance, return, merge or decline authority for an immutable imported request version.';
