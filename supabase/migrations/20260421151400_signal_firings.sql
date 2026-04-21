-- Tower W3 · signal_firings
-- Normalized signal lifecycle records. Current portfolio feed rows can link in
-- via source_portfolio_signal_id while the application transitions off the
-- flatter portfolio_signals shape.

BEGIN;

CREATE TABLE IF NOT EXISTS signal_firings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  signal_catalog_id UUID NOT NULL REFERENCES signal_catalog(id) ON DELETE RESTRICT,
  source_portfolio_signal_id UUID REFERENCES portfolio_signals(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  severity TEXT NOT NULL
    CHECK (severity IN ('critical','warning','info')),
  state TEXT NOT NULL DEFAULT 'new'
    CHECK (state IN ('new','triaged','actioned','resolved','suppressed')),
  headline TEXT NOT NULL,
  narrative_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  impact_usd NUMERIC(14,2),
  evidence_summary_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  cohort_context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  triaged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  suppressed_until TIMESTAMPTZ,
  suppression_reason TEXT,
  originated_engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS signal_firings_source_portfolio_signal_key
  ON signal_firings(source_portfolio_signal_id)
  WHERE source_portfolio_signal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signal_firings_client_state
  ON signal_firings(client_id, state, severity, fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_firings_use_case
  ON signal_firings(use_case_id, fired_at DESC)
  WHERE use_case_id IS NOT NULL;

DROP TRIGGER IF EXISTS signal_firings_set_updated_at ON signal_firings;
CREATE TRIGGER signal_firings_set_updated_at BEFORE UPDATE ON signal_firings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE signal_firings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_signal_firings" ON signal_firings;
CREATE POLICY "service_role_all_signal_firings" ON signal_firings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
