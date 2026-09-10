-- Moves current-state schema readback repair.
--
-- The migration ledger can report the historical migrations as applied while a
-- live database is still missing the physical objects needed by the current
-- state upload path. Keep this repair additive and idempotent: no data rewrite,
-- no table replacement, and no schema_migrations hand edit.

BEGIN;

CREATE TABLE IF NOT EXISTS public.tower_dora_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  repo TEXT NOT NULL,
  team TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  deployment_frequency_per_day NUMERIC(10,4) NOT NULL
    CHECK (deployment_frequency_per_day >= 0),
  lead_time_for_changes_hours NUMERIC(12,2) NOT NULL
    CHECK (lead_time_for_changes_hours >= 0),
  change_failure_rate_pct NUMERIC(5,2) NOT NULL
    CHECK (change_failure_rate_pct >= 0 AND change_failure_rate_pct <= 100),
  mttr_hours NUMERIC(12,2) NOT NULL
    CHECK (mttr_hours >= 0),
  sample_size_deploys INTEGER NOT NULL
    CHECK (sample_size_deploys >= 0),
  source TEXT NOT NULL DEFAULT 'github_actions_xlsx_ingest',
  source_file_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  deleted_at TIMESTAMPTZ,
  CHECK (period_end >= period_start),
  UNIQUE (client_id, repo, period_start, period_end)
);

ALTER TABLE public.tower_dora_metrics
  ADD COLUMN IF NOT EXISTS source_file_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tower_dora_metrics_client_period
  ON public.tower_dora_metrics(client_id, period_start DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tower_dora_metrics_team
  ON public.tower_dora_metrics(client_id, team)
  WHERE deleted_at IS NULL;

ALTER TABLE public.tower_dora_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tower_dora_metrics" ON public.tower_dora_metrics;
CREATE POLICY "service_role_all_tower_dora_metrics" ON public.tower_dora_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.tower_workforce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  function TEXT NOT NULL,
  sub_function TEXT,
  location TEXT,
  level TEXT,
  contractor_flag BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE NOT NULL,
  attrition_date DATE,
  attrition_reason TEXT,
  source_file_id UUID,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  as_of_date DATE NOT NULL,
  data_class TEXT NOT NULL DEFAULT 'restricted'
    CHECK (data_class IN ('public', 'internal', 'confidential', 'restricted')),
  CONSTRAINT tower_workforce_attrition_ordering
    CHECK (attrition_date IS NULL OR attrition_date >= start_date),
  CONSTRAINT tower_workforce_unique_per_snapshot
    UNIQUE (client_id, employee_id, as_of_date)
);

ALTER TABLE public.tower_workforce
  ADD COLUMN IF NOT EXISTS source_file_id UUID,
  ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data_class TEXT NOT NULL DEFAULT 'restricted';

CREATE INDEX IF NOT EXISTS idx_tower_workforce_client_function
  ON public.tower_workforce(client_id, function);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_client_as_of
  ON public.tower_workforce(client_id, as_of_date DESC);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_attrition
  ON public.tower_workforce(client_id, attrition_date)
  WHERE attrition_date IS NOT NULL;

ALTER TABLE public.tower_workforce ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tower_workforce" ON public.tower_workforce;
CREATE POLICY "service_role_all_tower_workforce" ON public.tower_workforce
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.program_evidence_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES public.program_evidence_items(id) ON DELETE CASCADE,
  family_key TEXT NOT NULL,
  archetype_id TEXT NULL,
  phase INT NULL,
  decision TEXT NOT NULL DEFAULT 'pending'
    CHECK (decision IN ('pending', 'approved', 'rejected')),
  auto_promoted BOOLEAN NOT NULL DEFAULT false,
  rationale TEXT NULL,
  source_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_by_user_id TEXT NOT NULL,
  reviewed_by_user_id TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_program_evidence_reviews_evidence
  ON public.program_evidence_reviews(evidence_id);

CREATE INDEX IF NOT EXISTS idx_program_evidence_reviews_lookup
  ON public.program_evidence_reviews(tenant_key, program_id, family_key, decision);

ALTER TABLE public.program_evidence_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_program_evidence_reviews" ON public.program_evidence_reviews;
CREATE POLICY "service_role_all_program_evidence_reviews" ON public.program_evidence_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_program_evidence_reviews" ON public.program_evidence_reviews;
CREATE POLICY "authenticated_read_program_evidence_reviews" ON public.program_evidence_reviews
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM public.engagements)
  );

GRANT SELECT ON public.program_evidence_reviews TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
