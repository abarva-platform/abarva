-- Repair physical Source canvas state when the migration ledger and schema drift.
--
-- The original canvas migration can be present in schema_migrations while one
-- or more physical state tables are absent after a database restore. Product
-- reads deliberately fall back to a virtual scaffold, so that drift is not
-- visible until the first generated artifact is persisted. This additive
-- repair recreates the final table shape without rewriting existing rows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.source_event_artifact_states (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id          UUID NOT NULL REFERENCES public.source_events(id) ON DELETE CASCADE,
  tenant_key               TEXT NOT NULL,
  artifact_code            TEXT NOT NULL,
  stage_key                TEXT NOT NULL,
  artifact_family          TEXT NOT NULL,
  tier                     TEXT NOT NULL DEFAULT 'stub'
                           CHECK (tier IN ('stub', 'outline', 'rich')),
  status                   TEXT NOT NULL DEFAULT 'not_started'
                           CHECK (status IN (
                             'not_started', 'drafting', 'needs_review',
                             'approved', 'locked', 'superseded'
                           )),
  requirement_level        TEXT NOT NULL
                           CHECK (requirement_level IN ('required', 'recommended', 'optional')),
  gate_defining            BOOLEAN NOT NULL DEFAULT false,
  linked_artifact_id       UUID REFERENCES public.source_artifacts(id) ON DELETE SET NULL,
  notes                    TEXT,
  body                     TEXT,
  body_format              TEXT NOT NULL DEFAULT 'markdown'
                           CHECK (body_format IN ('markdown', 'html', 'plain')),
  body_authored_by         TEXT,
  body_updated_at          TIMESTAMPTZ,
  body_generation_metadata JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, artifact_code)
);

ALTER TABLE public.source_event_artifact_states
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS body_format TEXT NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS body_authored_by TEXT,
  ADD COLUMN IF NOT EXISTS body_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS body_generation_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_source_event_artifact_states_event
  ON public.source_event_artifact_states (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_artifact_states_event_stage
  ON public.source_event_artifact_states (source_event_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_source_event_artifact_states_tenant
  ON public.source_event_artifact_states (tenant_key);

CREATE TABLE IF NOT EXISTS public.source_event_gate_criterion_states (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id          UUID NOT NULL REFERENCES public.source_events(id) ON DELETE CASCADE,
  tenant_key               TEXT NOT NULL,
  criterion_id             TEXT NOT NULL,
  from_stage               TEXT NOT NULL,
  to_stage                 TEXT NOT NULL,
  state                    TEXT NOT NULL DEFAULT 'pending'
                           CHECK (state IN ('pending', 'met', 'not_met', 'waived', 'deferred')),
  reviewer_user_id         TEXT,
  reviewed_at              TIMESTAMPTZ,
  notes                    TEXT,
  evidence_artifact_ids    JSONB NOT NULL DEFAULT '[]'::jsonb,
  waiver_approval_id       UUID REFERENCES public.source_event_approvals(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_source_event_gate_criterion_states_event
  ON public.source_event_gate_criterion_states (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_gate_criterion_states_event_from_stage
  ON public.source_event_gate_criterion_states (source_event_id, from_stage);
CREATE INDEX IF NOT EXISTS idx_source_event_gate_criterion_states_tenant
  ON public.source_event_gate_criterion_states (tenant_key);

CREATE TABLE IF NOT EXISTS public.source_event_evidence_states (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id          UUID NOT NULL REFERENCES public.source_events(id) ON DELETE CASCADE,
  tenant_key               TEXT NOT NULL,
  requirement_id           TEXT NOT NULL,
  stage_key                TEXT NOT NULL,
  current_state            TEXT NOT NULL DEFAULT 'Not Requested'
                           CHECK (current_state IN (
                             'Not Requested', 'Loaded', 'Parsed', 'Available',
                             'Usable Evidence', 'Stale', 'Low Confidence'
                           )),
  source_artifact_id       UUID REFERENCES public.source_artifacts(id) ON DELETE SET NULL,
  notes                    TEXT,
  last_synced_at           TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_event_id, requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_source_event_evidence_states_event
  ON public.source_event_evidence_states (source_event_id);
CREATE INDEX IF NOT EXISTS idx_source_event_evidence_states_event_stage
  ON public.source_event_evidence_states (source_event_id, stage_key);
CREATE INDEX IF NOT EXISTS idx_source_event_evidence_states_tenant
  ON public.source_event_evidence_states (tenant_key);

CREATE OR REPLACE FUNCTION public.source_canvas_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS source_event_artifact_states_touch
  ON public.source_event_artifact_states;
CREATE TRIGGER source_event_artifact_states_touch
  BEFORE UPDATE ON public.source_event_artifact_states
  FOR EACH ROW EXECUTE FUNCTION public.source_canvas_touch_updated_at();

DROP TRIGGER IF EXISTS source_event_gate_criterion_states_touch
  ON public.source_event_gate_criterion_states;
CREATE TRIGGER source_event_gate_criterion_states_touch
  BEFORE UPDATE ON public.source_event_gate_criterion_states
  FOR EACH ROW EXECUTE FUNCTION public.source_canvas_touch_updated_at();

DROP TRIGGER IF EXISTS source_event_evidence_states_touch
  ON public.source_event_evidence_states;
CREATE TRIGGER source_event_evidence_states_touch
  BEFORE UPDATE ON public.source_event_evidence_states
  FOR EACH ROW EXECUTE FUNCTION public.source_canvas_touch_updated_at();

ALTER TABLE public.source_event_artifact_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_event_gate_criterion_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_event_evidence_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_source_event_artifact_states
  ON public.source_event_artifact_states;
CREATE POLICY service_role_all_source_event_artifact_states
  ON public.source_event_artifact_states FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS authenticated_read_source_event_artifact_states
  ON public.source_event_artifact_states;
CREATE POLICY authenticated_read_source_event_artifact_states
  ON public.source_event_artifact_states FOR SELECT TO authenticated
  USING (public.can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_write_source_event_artifact_states
  ON public.source_event_artifact_states;
CREATE POLICY authenticated_write_source_event_artifact_states
  ON public.source_event_artifact_states FOR INSERT TO authenticated
  WITH CHECK (public.can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_update_source_event_artifact_states
  ON public.source_event_artifact_states;
CREATE POLICY authenticated_update_source_event_artifact_states
  ON public.source_event_artifact_states FOR UPDATE TO authenticated
  USING (public.can_read_tenant_by_key(tenant_key))
  WITH CHECK (public.can_read_tenant_by_key(tenant_key));

DROP POLICY IF EXISTS service_role_all_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states;
CREATE POLICY service_role_all_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS authenticated_read_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states;
CREATE POLICY authenticated_read_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states FOR SELECT TO authenticated
  USING (public.can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_write_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states;
CREATE POLICY authenticated_write_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states FOR INSERT TO authenticated
  WITH CHECK (public.can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_update_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states;
CREATE POLICY authenticated_update_source_event_gate_criterion_states
  ON public.source_event_gate_criterion_states FOR UPDATE TO authenticated
  USING (public.can_read_tenant_by_key(tenant_key))
  WITH CHECK (public.can_read_tenant_by_key(tenant_key));

DROP POLICY IF EXISTS service_role_all_source_event_evidence_states
  ON public.source_event_evidence_states;
CREATE POLICY service_role_all_source_event_evidence_states
  ON public.source_event_evidence_states FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS authenticated_read_source_event_evidence_states
  ON public.source_event_evidence_states;
CREATE POLICY authenticated_read_source_event_evidence_states
  ON public.source_event_evidence_states FOR SELECT TO authenticated
  USING (public.can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_write_source_event_evidence_states
  ON public.source_event_evidence_states;
CREATE POLICY authenticated_write_source_event_evidence_states
  ON public.source_event_evidence_states FOR INSERT TO authenticated
  WITH CHECK (public.can_read_tenant_by_key(tenant_key));
DROP POLICY IF EXISTS authenticated_update_source_event_evidence_states
  ON public.source_event_evidence_states;
CREATE POLICY authenticated_update_source_event_evidence_states
  ON public.source_event_evidence_states FOR UPDATE TO authenticated
  USING (public.can_read_tenant_by_key(tenant_key))
  WITH CHECK (public.can_read_tenant_by_key(tenant_key));

GRANT SELECT, INSERT, UPDATE ON public.source_event_artifact_states TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.source_event_gate_criterion_states TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.source_event_evidence_states TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
