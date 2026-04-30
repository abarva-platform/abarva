-- Intelligence surface data layer · failure-mode-driven surface foundation.
--
-- Supports the Intelligence Surface Failure-Mode-Driven Design v1 data
-- requirements without changing runtime behavior:
--   * append-only Sentinel response audit log
--   * mode-toggle telemetry
--   * governed editorial registry for failure-mode cards, topic entries,
--     and demo-robustness questions
--
-- Posture follows the existing server-routed Supabase model: service_role
-- writes through API/repository code; anon/authenticated clients receive no
-- direct grants. Session/mode telemetry is append-only after insertion.

BEGIN;

CREATE TABLE IF NOT EXISTS intelligence_session_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  thread_id UUID REFERENCES intelligence_threads(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  response_mode TEXT NOT NULL CHECK (response_mode IN (
    'generic',
    'corpus_grounded',
    'tenant_grounded',
    'cross_corpus'
  )),
  available_modes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  retrieved_pattern_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  retrieved_evidence_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  retrieved_contradiction_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  retrieved_signal_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  provenance_rendered JSONB NOT NULL DEFAULT '[]'::jsonb,
  tenant_data_used BOOLEAN NOT NULL DEFAULT false,
  auth_state TEXT NOT NULL CHECK (auth_state IN (
    'cold',
    'authenticated_no_programs',
    'authenticated_with_programs'
  )),
  engagement_state TEXT NOT NULL CHECK (engagement_state IN (
    'landing',
    'topic_open',
    'conversation_active',
    'synthesis_validation'
  )),
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  tool_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  error_code TEXT,
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    tenant_data_used = false
    OR (client_id IS NOT NULL AND user_id IS NOT NULL)
  ),
  CHECK (
    response_mode IN ('generic', 'corpus_grounded')
    OR (client_id IS NOT NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_created_at
  ON intelligence_session_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_client_created
  ON intelligence_session_log (client_id, created_at DESC) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_user_created
  ON intelligence_session_log (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_session
  ON intelligence_session_log (session_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_mode
  ON intelligence_session_log (response_mode);
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_patterns
  ON intelligence_session_log USING GIN (retrieved_pattern_ids);
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_contradictions
  ON intelligence_session_log USING GIN (retrieved_contradiction_ids);
CREATE INDEX IF NOT EXISTS idx_intelligence_session_log_provenance
  ON intelligence_session_log USING GIN (provenance_rendered jsonb_path_ops);

CREATE TABLE IF NOT EXISTS intelligence_mode_toggle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id UUID REFERENCES intelligence_session_log(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  previous_mode TEXT CHECK (previous_mode IN (
    'generic',
    'corpus_grounded',
    'tenant_grounded',
    'cross_corpus'
  )),
  next_mode TEXT NOT NULL CHECK (next_mode IN (
    'generic',
    'corpus_grounded',
    'tenant_grounded',
    'cross_corpus'
  )),
  dwell_ms INTEGER CHECK (dwell_ms IS NULL OR dwell_ms >= 0),
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    next_mode IN ('generic', 'corpus_grounded')
    OR (client_id IS NOT NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_intelligence_mode_toggle_session
  ON intelligence_mode_toggle_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_mode_toggle_log
  ON intelligence_mode_toggle_events (session_log_id, created_at DESC)
  WHERE session_log_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intelligence_mode_toggle_client
  ON intelligence_mode_toggle_events (client_id, created_at DESC)
  WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS intelligence_surface_content_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_key TEXT NOT NULL UNIQUE,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'failure_mode_card',
    'topic_entry',
    'demo_robustness_question'
  )),
  title TEXT NOT NULL,
  body_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  cited_pattern_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cited_contradiction_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cited_signal_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cited_research_anchors JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'in_review',
    'approved',
    'archived'
  )),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  last_reviewed_by TEXT,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_surface_content_type_status
  ON intelligence_surface_content_registry (entry_type, status, registry_key);
CREATE INDEX IF NOT EXISTS idx_intelligence_surface_content_patterns
  ON intelligence_surface_content_registry USING GIN (cited_pattern_ids);
CREATE INDEX IF NOT EXISTS idx_intelligence_surface_content_contradictions
  ON intelligence_surface_content_registry USING GIN (cited_contradiction_ids);

CREATE OR REPLACE FUNCTION set_intelligence_surface_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_intelligence_surface_registry_updated_at
  ON intelligence_surface_content_registry;
CREATE TRIGGER trg_intelligence_surface_registry_updated_at
  BEFORE UPDATE ON intelligence_surface_content_registry
  FOR EACH ROW EXECUTE FUNCTION set_intelligence_surface_registry_updated_at();

CREATE OR REPLACE FUNCTION prevent_intelligence_append_only_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'intelligence telemetry is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_intelligence_session_log_update
  ON intelligence_session_log;
CREATE TRIGGER trg_prevent_intelligence_session_log_update
  BEFORE UPDATE OR DELETE ON intelligence_session_log
  FOR EACH ROW EXECUTE FUNCTION prevent_intelligence_append_only_mutation();

DROP TRIGGER IF EXISTS trg_prevent_intelligence_mode_toggle_update
  ON intelligence_mode_toggle_events;
CREATE TRIGGER trg_prevent_intelligence_mode_toggle_update
  BEFORE UPDATE OR DELETE ON intelligence_mode_toggle_events
  FOR EACH ROW EXECUTE FUNCTION prevent_intelligence_append_only_mutation();

ALTER TABLE intelligence_session_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_mode_toggle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_surface_content_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_intelligence_session_log" ON intelligence_session_log;
CREATE POLICY "service_role_all_intelligence_session_log" ON intelligence_session_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_intelligence_mode_toggle_events" ON intelligence_mode_toggle_events;
CREATE POLICY "service_role_all_intelligence_mode_toggle_events" ON intelligence_mode_toggle_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_intelligence_surface_content_registry" ON intelligence_surface_content_registry;
CREATE POLICY "service_role_all_intelligence_surface_content_registry" ON intelligence_surface_content_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON intelligence_session_log,
  intelligence_mode_toggle_events,
  intelligence_surface_content_registry
  FROM anon, authenticated;
GRANT ALL ON intelligence_session_log,
  intelligence_mode_toggle_events,
  intelligence_surface_content_registry
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
