CREATE TABLE IF NOT EXISTS abarnexus_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'preview',
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'failed')),
  record_count INTEGER NOT NULL DEFAULT 0,
  records JSONB NOT NULL DEFAULT '[]',
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abarnexus_ingestion_runs_created_at
  ON abarnexus_ingestion_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abarnexus_ingestion_runs_source_id
  ON abarnexus_ingestion_runs(source_id, created_at DESC);

ALTER TABLE abarnexus_ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abarnexus_ingestion_runs_service_role_all"
  ON abarnexus_ingestion_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
