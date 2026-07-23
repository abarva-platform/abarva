-- Governed P3b assembly: durable, tenant-fenced dependencies between generated deliverables.
BEGIN;

ALTER TABLE deliverable_runs
  ADD COLUMN IF NOT EXISTS batch_id UUID NULL,
  ADD COLUMN IF NOT EXISTS sequence_no SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS depends_on_run_id UUID NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT NULL;

ALTER TABLE deliverable_runs
  DROP CONSTRAINT IF EXISTS deliverable_runs_sequence_nonnegative,
  ADD CONSTRAINT deliverable_runs_sequence_nonnegative
    CHECK (sequence_no IS NULL OR sequence_no >= 0),
  DROP CONSTRAINT IF EXISTS deliverable_runs_no_self_dependency,
  ADD CONSTRAINT deliverable_runs_no_self_dependency
    CHECK (depends_on_run_id IS NULL OR depends_on_run_id <> id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deliverable_runs_tenant_identity
  ON deliverable_runs (id, client_id, tenant_key);

ALTER TABLE deliverable_runs
  DROP CONSTRAINT IF EXISTS deliverable_runs_tenant_dependency_fk,
  ADD CONSTRAINT deliverable_runs_tenant_dependency_fk
    FOREIGN KEY (depends_on_run_id, client_id, tenant_key)
    REFERENCES deliverable_runs (id, client_id, tenant_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deliverable_runs_batch_sequence
  ON deliverable_runs (batch_id, sequence_no)
  WHERE batch_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_deliverable_runs_idempotent_sequence
  ON deliverable_runs (client_id, idempotency_key, sequence_no)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deliverable_runs_dependency_claim
  ON deliverable_runs (status, depends_on_run_id, created_at)
  WHERE status IN ('queued', 'running');

COMMIT;
