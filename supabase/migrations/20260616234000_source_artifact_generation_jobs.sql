-- Source artifact generation jobs · durable async draft queue
--
-- Adds an event-scoped queue for Source generated artifacts. This is the
-- durable handoff between stage entry ("draft this artifact") and the worker
-- that materializes a DOCX/HTML/File-Cabinet artifact through the existing
-- governed generator. Additive only: no existing Source rows are rewritten.

BEGIN;

CREATE TABLE IF NOT EXISTS source_artifact_generation_jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_key          TEXT NOT NULL,
  source_event_id     UUID NOT NULL REFERENCES source_events(id) ON DELETE CASCADE,
  artifact_row_id     UUID NOT NULL REFERENCES source_event_artifact_states(id) ON DELETE CASCADE,
  artifact_code       TEXT NOT NULL,
  stage_key           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  quality_tier        TEXT NOT NULL DEFAULT 'real_engagement'
    CHECK (quality_tier IN ('standard', 'real_engagement', 'premium_final')),
  requested_via       TEXT NOT NULL DEFAULT 'stage_entry'
    CHECK (requested_via IN ('stage_entry', 'manual_retry', 'worker_replay')),
  requested_by_user_id TEXT,
  attempt_count       INTEGER NOT NULL DEFAULT 0,
  max_attempts        INTEGER NOT NULL DEFAULT 3,
  locked_by           TEXT,
  locked_at           TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  last_error          TEXT,
  result_metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_artifact_generation_jobs_queue
  ON source_artifact_generation_jobs (status, created_at)
  WHERE status IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS idx_source_artifact_generation_jobs_event
  ON source_artifact_generation_jobs (client_key, source_event_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_artifact_generation_jobs_active_artifact
  ON source_artifact_generation_jobs (artifact_row_id)
  WHERE status IN ('queued', 'running');

COMMENT ON TABLE source_artifact_generation_jobs IS
  'Durable Source artifact generation queue. Stage entry enqueues a draft job and marks the artifact drafting; the worker materializes the artifact through the governed Source generator and records result metadata. No client-facing document is considered complete until the artifact row, Blob/File Cabinet records, and section verification prove it.';

ALTER TABLE source_artifact_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_source_artifact_generation_jobs
  ON source_artifact_generation_jobs;
CREATE POLICY service_role_all_source_artifact_generation_jobs
  ON source_artifact_generation_jobs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_read_source_artifact_generation_jobs
  ON source_artifact_generation_jobs;
CREATE POLICY authenticated_read_source_artifact_generation_jobs
  ON source_artifact_generation_jobs
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(client_key));

GRANT SELECT ON source_artifact_generation_jobs TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
