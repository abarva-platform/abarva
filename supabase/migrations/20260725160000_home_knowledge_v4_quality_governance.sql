-- Home Knowledge V4 quality governance
--
-- Two additions, both internal-admin/operator surfaces (no tenant-facing RLS
-- needed -- consumed only by the governed persist/inspect scripts and the
-- admin review UI, same access pattern as home_knowledge_packs itself):
--
-- 1. Override columns on home_knowledge_packs: approving a candidate whose
--    validation_status is not 'pass' must be a distinct, audited action --
--    a written reason, the reviewer identity, a timestamp, and a snapshot of
--    exactly which findings were acknowledged (not just "the row's current
--    quality_report", which could drift after the fact).
--
-- 2. home_knowledge_v4_job_runs: a job-run-level outcome log, independent of
--    whether a home_knowledge_packs row was ever created. A generation
--    failure (Claude call throws) or a persistence failure (DB write throws)
--    today leaves NO trace anywhere queryable -- the job's own logs are the
--    only record, and those are not retained or reviewable. This table is
--    the source of truth for "job outcomes unambiguous": one row per tenant
--    per job execution, written before any later tenant's failure can crash
--    the whole batch.

BEGIN;

ALTER TABLE public.home_knowledge_packs
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS overridden_by TEXT,
  ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS findings_acknowledged JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.home_knowledge_packs.override_reason IS
  'Required whenever this row is approved with validation_status != pass. Free-text explaining why an authorized reviewer approved a candidate the validator flagged.';
COMMENT ON COLUMN public.home_knowledge_packs.findings_acknowledged IS
  'Snapshot of the exact quality_report.violations entries the reviewer acknowledged at override time -- not a reference to the live quality_report, which could change later.';

CREATE TABLE IF NOT EXISTS public.home_knowledge_v4_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_execution_name TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  outcome TEXT NOT NULL
    CHECK (outcome IN (
      'generated_clean',
      'generated_with_quality_failure',
      'generation_failed',
      'persistence_failed'
    )),
  pack_id UUID REFERENCES public.home_knowledge_packs(id) ON DELETE SET NULL,
  pack_version TEXT,
  validation_status TEXT,
  error_message TEXT,
  generator_version TEXT,
  claude_model TEXT,
  claude_prompt_hash TEXT,
  content_hash TEXT,
  proof_bundle_uri TEXT,
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  persisted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_knowledge_v4_job_runs_tenant_idx
  ON public.home_knowledge_v4_job_runs (tenant_key, created_at DESC);

CREATE INDEX IF NOT EXISTS home_knowledge_v4_job_runs_execution_idx
  ON public.home_knowledge_v4_job_runs (job_execution_name);

COMMENT ON TABLE public.home_knowledge_v4_job_runs IS
  'One row per tenant per book-mode job execution, written regardless of success or failure. Source of truth for job-run outcome counts (generated_clean / generated_with_quality_failure / generation_failed / persistence_failed) -- a generation or persistence failure must be queryable here even when no home_knowledge_packs row exists.';

COMMIT;
