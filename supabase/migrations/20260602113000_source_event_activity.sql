-- source_event_activity · append-only audit trail for Source canvas actions.
--
-- Records the named human or agent action that changed Source event state:
-- artifact generation/body edits, gate criterion decisions, and stage
-- promotions. The UI reads this table for the Log tab instead of synthesizing
-- placeholder entries.

CREATE TABLE IF NOT EXISTS source_event_activity (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  client_key           TEXT NOT NULL,
  actor_user_id        TEXT,
  actor_display_name   TEXT,
  actor_role           TEXT,
  action_type          TEXT NOT NULL,
  action_label         TEXT NOT NULL,
  stage_key            TEXT,
  artifact_code        TEXT,
  criterion_id         TEXT,
  reason               TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_event_activity_event_idx
  ON source_event_activity (event_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS source_event_activity_client_idx
  ON source_event_activity (client_key, occurred_at DESC);

CREATE INDEX IF NOT EXISTS source_event_activity_action_idx
  ON source_event_activity (action_type, occurred_at DESC);

ALTER TABLE source_event_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_event_activity"
  ON source_event_activity;
CREATE POLICY "service_role_all_source_event_activity"
  ON source_event_activity
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_event_activity"
  ON source_event_activity;
CREATE POLICY "authenticated_read_source_event_activity"
  ON source_event_activity
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

DROP POLICY IF EXISTS "authenticated_insert_source_event_activity"
  ON source_event_activity;
CREATE POLICY "authenticated_insert_source_event_activity"
  ON source_event_activity
  FOR INSERT TO authenticated
  WITH CHECK (can_read_tenant_by_key(client_key));

GRANT SELECT, INSERT ON source_event_activity TO authenticated;

COMMENT ON TABLE source_event_activity IS
  'Append-only Source canvas audit trail: artifact generation/body edits, gate decisions, stage promotions, and accountable human reasons.';
