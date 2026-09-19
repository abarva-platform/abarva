-- Source event request/strategy version authority.
-- These rows are Layer 3 authority records: Source reads them as projection
-- input, but product surfaces do not own the facts.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE UNIQUE INDEX IF NOT EXISTS source_events_id_client_key_authority_idx
  ON source_events(id, client_key);

CREATE TABLE IF NOT EXISTS source_event_authority_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  client_key TEXT NOT NULL,
  authority_kind TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  content_json JSONB NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  supersedes_version_id UUID NULL REFERENCES source_event_authority_versions(id) ON DELETE SET NULL,
  superseded_at TIMESTAMPTZ NULL,
  superseded_by_version_id UUID NULL REFERENCES source_event_authority_versions(id) ON DELETE SET NULL,
  CONSTRAINT source_event_authority_versions_event_client_fk
    FOREIGN KEY (event_id, client_key)
    REFERENCES source_events(id, client_key)
    ON DELETE CASCADE,
  CONSTRAINT source_event_authority_versions_scoped_identity_key
    UNIQUE (id, event_id, client_key, authority_kind),
  CONSTRAINT source_event_authority_versions_kind_check
    CHECK (authority_kind IN ('request', 'strategy')),
  CONSTRAINT source_event_authority_versions_version_number_check
    CHECK (version_number > 0),
  CONSTRAINT source_event_authority_versions_hash_check
    CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT source_event_authority_versions_creator_check
    CHECK (NULLIF(BTRIM(created_by_user_id), '') IS NOT NULL),
  CONSTRAINT source_event_authority_versions_supersession_check
    CHECK (
      (superseded_at IS NULL AND superseded_by_version_id IS NULL)
      OR
      (superseded_at IS NOT NULL AND superseded_by_version_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS source_event_authority_versions_number_idx
  ON source_event_authority_versions(event_id, authority_kind, version_number);

CREATE UNIQUE INDEX IF NOT EXISTS source_event_authority_versions_content_idx
  ON source_event_authority_versions(event_id, authority_kind, content_hash);

CREATE UNIQUE INDEX IF NOT EXISTS source_event_authority_versions_one_current_idx
  ON source_event_authority_versions(event_id, authority_kind) WHERE superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS source_event_authority_versions_event_idx
  ON source_event_authority_versions(event_id);

CREATE INDEX IF NOT EXISTS source_event_authority_versions_client_idx
  ON source_event_authority_versions(client_key, authority_kind);

COMMENT ON TABLE source_event_authority_versions IS
  'Immutable request and strategy authority versions for Source New events. Content changes create a new version; Source product surfaces consume the current version as projection input.';
COMMENT ON COLUMN source_event_authority_versions.content_hash IS
  'SHA-256 hex digest of the canonicalized content_json payload.';

CREATE OR REPLACE FUNCTION prevent_source_event_authority_version_content_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF
    NEW.event_id IS DISTINCT FROM OLD.event_id OR
    NEW.client_key IS DISTINCT FROM OLD.client_key OR
    NEW.authority_kind IS DISTINCT FROM OLD.authority_kind OR
    NEW.version_number IS DISTINCT FROM OLD.version_number OR
    NEW.content_hash IS DISTINCT FROM OLD.content_hash OR
    NEW.content_json IS DISTINCT FROM OLD.content_json OR
    NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id OR
    NEW.created_at IS DISTINCT FROM OLD.created_at OR
    NEW.supersedes_version_id IS DISTINCT FROM OLD.supersedes_version_id
  THEN
    RAISE EXCEPTION 'source_event_authority_versions are immutable; create a new version for material edits';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_source_event_authority_version_lineage_scope()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  linked_event_id UUID;
  linked_client_key TEXT;
  linked_authority_kind TEXT;
BEGIN
  IF NEW.supersedes_version_id IS NOT NULL THEN
    IF NEW.supersedes_version_id = NEW.id THEN
      RAISE EXCEPTION 'an authority version cannot supersede itself';
    END IF;

    SELECT event_id, client_key, authority_kind
      INTO linked_event_id, linked_client_key, linked_authority_kind
      FROM source_event_authority_versions
      WHERE id = NEW.supersedes_version_id;

    IF NOT FOUND OR
      (linked_event_id, linked_client_key, linked_authority_kind)
        IS DISTINCT FROM (NEW.event_id, NEW.client_key, NEW.authority_kind)
    THEN
      RAISE EXCEPTION 'supersedes_version_id must reference the same event, tenant, and authority kind';
    END IF;
  END IF;

  IF NEW.superseded_by_version_id IS NOT NULL THEN
    IF NEW.superseded_by_version_id = NEW.id THEN
      RAISE EXCEPTION 'an authority version cannot be superseded by itself';
    END IF;

    SELECT event_id, client_key, authority_kind
      INTO linked_event_id, linked_client_key, linked_authority_kind
      FROM source_event_authority_versions
      WHERE id = NEW.superseded_by_version_id;

    IF NOT FOUND OR
      (linked_event_id, linked_client_key, linked_authority_kind)
        IS DISTINCT FROM (NEW.event_id, NEW.client_key, NEW.authority_kind)
    THEN
      RAISE EXCEPTION 'superseded_by_version_id must reference the same event, tenant, and authority kind';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_event_authority_versions_lineage_scope_trigger
  ON source_event_authority_versions;
CREATE TRIGGER source_event_authority_versions_lineage_scope_trigger
  BEFORE INSERT OR UPDATE ON source_event_authority_versions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_source_event_authority_version_lineage_scope();

DROP TRIGGER IF EXISTS source_event_authority_versions_immutable_trigger
  ON source_event_authority_versions;
CREATE TRIGGER source_event_authority_versions_immutable_trigger
  BEFORE UPDATE ON source_event_authority_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_source_event_authority_version_content_update();

CREATE TABLE IF NOT EXISTS source_event_authority_version_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  client_key TEXT NOT NULL,
  authority_kind TEXT NOT NULL,
  version_id UUID NOT NULL,
  role TEXT NOT NULL,
  decision TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  reason TEXT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT source_event_authority_version_approvals_version_scope_fk
    FOREIGN KEY (version_id, event_id, client_key, authority_kind)
    REFERENCES source_event_authority_versions(id, event_id, client_key, authority_kind)
    ON DELETE CASCADE,
  CONSTRAINT source_event_authority_version_approvals_kind_check
    CHECK (authority_kind IN ('request', 'strategy')),
  CONSTRAINT source_event_authority_version_approvals_role_check
    CHECK (role IN ('request_acceptor', 'business_owner', 'procurement_lead')),
  CONSTRAINT source_event_authority_version_approvals_decision_check
    CHECK (decision IN ('approved', 'changes_requested')),
  CONSTRAINT source_event_authority_version_approvals_actor_check
    CHECK (NULLIF(BTRIM(actor_user_id), '') IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS source_event_authority_version_approvals_one_decision_idx
  ON source_event_authority_version_approvals(version_id, role)
  WHERE decision = 'approved';

CREATE INDEX IF NOT EXISTS source_event_authority_version_approvals_event_idx
  ON source_event_authority_version_approvals(event_id);

CREATE INDEX IF NOT EXISTS source_event_authority_version_approvals_version_idx
  ON source_event_authority_version_approvals(version_id);

COMMENT ON TABLE source_event_authority_version_approvals IS
  'Append-only named approvals bound to exact request or strategy authority versions.';

ALTER TABLE source_event_authority_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_event_authority_version_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_source_event_authority_versions"
  ON source_event_authority_versions;
CREATE POLICY "service_role_full_source_event_authority_versions"
  ON source_event_authority_versions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_authority_versions"
  ON source_event_authority_versions;
CREATE POLICY "authenticated_read_source_event_authority_versions"
  ON source_event_authority_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_authority_versions.event_id
        AND se.client_key = source_event_authority_versions.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_source_event_authority_versions"
  ON source_event_authority_versions;
CREATE POLICY "authenticated_insert_source_event_authority_versions"
  ON source_event_authority_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_tenant_admin()
    AND created_by_user_id = current_user_id()
    AND EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_authority_versions.event_id
        AND se.client_key = source_event_authority_versions.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

DROP POLICY IF EXISTS "block_update_source_event_authority_versions"
  ON source_event_authority_versions;
CREATE POLICY "block_update_source_event_authority_versions"
  ON source_event_authority_versions
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "block_delete_source_event_authority_versions"
  ON source_event_authority_versions;
CREATE POLICY "block_delete_source_event_authority_versions"
  ON source_event_authority_versions
  FOR DELETE TO authenticated
  USING (false);

DROP POLICY IF EXISTS "service_role_full_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals;
CREATE POLICY "service_role_full_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals;
CREATE POLICY "authenticated_read_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_authority_version_approvals.event_id
        AND se.client_key = source_event_authority_version_approvals.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

DROP POLICY IF EXISTS "authenticated_insert_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals;
CREATE POLICY "authenticated_insert_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    is_tenant_admin()
    AND actor_user_id = current_user_id()
    AND EXISTS (
      SELECT 1
      FROM source_events se
      WHERE se.id = source_event_authority_version_approvals.event_id
        AND se.client_key = source_event_authority_version_approvals.client_key
        AND can_read_tenant_by_key(se.client_key)
    )
  );

DROP POLICY IF EXISTS "block_update_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals;
CREATE POLICY "block_update_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals
  FOR UPDATE TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "block_delete_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals;
CREATE POLICY "block_delete_source_event_authority_version_approvals"
  ON source_event_authority_version_approvals
  FOR DELETE TO authenticated
  USING (false);

GRANT SELECT, INSERT ON source_event_authority_versions TO authenticated;
GRANT SELECT, INSERT ON source_event_authority_version_approvals TO authenticated;
GRANT ALL ON source_event_authority_versions TO service_role;
GRANT ALL ON source_event_authority_version_approvals TO service_role;
