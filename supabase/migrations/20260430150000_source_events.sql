-- source_events · persisted sourcing events created by the Sentinel agent
-- via the commit_source_event tool on the /source surface.
--
-- The fixture data in listSourceEventSeed() remains the authoritative
-- demo source. DB rows are merged on top (DB rows take precedence when
-- the same event_id is present in both, though in practice the DB only
-- has net-new events created during live sessions).

CREATE TABLE IF NOT EXISTS source_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tenant key matching active_clients.key (e.g. 'apexretail', 'meridian')
  client_key            TEXT NOT NULL,
  -- Human-readable code, e.g. APX-AI-CLOUD-2026
  event_code            TEXT NOT NULL,
  event_name            TEXT NOT NULL,
  -- 'managed_service' | 'software' | 'staffing' | 'infrastructure' | 'consulting' | 'other'
  event_type            TEXT NOT NULL DEFAULT 'other',
  -- Mirrors SourceStageKey; defaults to intake for new events
  current_stage_key     TEXT NOT NULL DEFAULT 'intake',
  -- Mirrors SourceLifecycleStatus
  lifecycle_state       TEXT NOT NULL DEFAULT 'active',
  -- Optional link to an engagement / program
  linked_program_id     TEXT,
  estimated_value_usd   BIGINT,
  trigger_description   TEXT,
  scope_description     TEXT,
  decision_owner        TEXT,
  -- Clerk userId of the user who initiated (may be null for agent-initiated rows)
  created_by_user_id    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for per-tenant list queries
CREATE INDEX IF NOT EXISTS source_events_client_key_idx ON source_events (client_key);
CREATE INDEX IF NOT EXISTS source_events_lifecycle_idx ON source_events (client_key, lifecycle_state);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_source_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS source_events_updated_at_trigger ON source_events;
CREATE TRIGGER source_events_updated_at_trigger
  BEFORE UPDATE ON source_events
  FOR EACH ROW EXECUTE FUNCTION update_source_events_updated_at();

-- RLS: service-role bypass (agent routes use service role)
ALTER TABLE source_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON source_events
  USING (true) WITH CHECK (true);
