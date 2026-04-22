-- Tower W3 · signal_evidence_chains
-- Structured evidence records attached to a normalized signal firing.

BEGIN;

CREATE TABLE IF NOT EXISTS signal_evidence_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_firing_id UUID NOT NULL REFERENCES signal_firings(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  evidence_type TEXT NOT NULL
    CHECK (evidence_type IN ('invoice','usage_record','inventory_registry','benchmark','attestation','document','other')),
  source_label TEXT NOT NULL,
  artifact_ref TEXT,
  vendor_name TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  amount_usd NUMERIC(14,2),
  metric_value NUMERIC,
  metric_unit TEXT,
  confidence TEXT
    CHECK (confidence IN ('high','medium','low')),
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_evidence_chains_signal
  ON signal_evidence_chains(signal_firing_id, position, created_at);

ALTER TABLE signal_evidence_chains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_signal_evidence_chains" ON signal_evidence_chains;
CREATE POLICY "service_role_all_signal_evidence_chains" ON signal_evidence_chains
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
