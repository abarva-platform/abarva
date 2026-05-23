-- P3 Move + Source template data layer · Azure Postgres target.
--
-- Folder remains `supabase/migrations` for existing tooling. Tenant table is
-- `clients`; tenant FK is `client_id`.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $template_types$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'move_template_kind') THEN
    CREATE TYPE move_template_kind AS ENUM ('Move', 'SourceWorkflow');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'move_template_status') THEN
    CREATE TYPE move_template_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'retired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'move_template_review_decision') THEN
    CREATE TYPE move_template_review_decision AS ENUM ('submitted', 'commented', 'changes_requested', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'move_instance_status') THEN
    CREATE TYPE move_instance_status AS ENUM ('draft', 'active', 'paused', 'completed', 'retired');
  END IF;
END
$template_types$;

CREATE TABLE IF NOT EXISTS public.move_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  kind move_template_kind NOT NULL,
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  sponsor_raci_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_version_id UUID,
  status move_template_status NOT NULL DEFAULT 'draft',
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  vertical_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  horizon_default TEXT,
  intended_personas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  primary_author_id TEXT,
  approved_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.move_template_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.move_templates(id) ON DELETE CASCADE,
  gate_id TEXT NOT NULL,
  sequence_index INTEGER NOT NULL CHECK (sequence_index >= 0),
  name TEXT NOT NULL,
  sponsor_raci_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_artifacts TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence_anchors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  numeric_kill_criteria_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  sensitivity_analysis_template TEXT NOT NULL DEFAULT '',
  pre_mortem_required BOOLEAN NOT NULL DEFAULT true,
  time_budget_p50_days INTEGER CHECK (time_budget_p50_days IS NULL OR time_budget_p50_days >= 0),
  time_budget_p90_days INTEGER CHECK (time_budget_p90_days IS NULL OR time_budget_p90_days >= 0),
  hand_off_ritual TEXT NOT NULL DEFAULT '',
  maturity_target INTEGER CHECK (maturity_target IS NULL OR maturity_target BETWEEN 1 AND 5),
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, gate_id),
  UNIQUE (template_id, sequence_index)
);

CREATE TABLE IF NOT EXISTS public.move_template_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id UUID NOT NULL REFERENCES public.move_template_gates(id) ON DELETE CASCADE,
  artifact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  toc_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  schema_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_markdown TEXT NOT NULL DEFAULT '',
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gate_id, artifact_id)
);

CREATE TABLE IF NOT EXISTS public.move_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.move_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  status move_template_status NOT NULL,
  snapshot_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

ALTER TABLE public.move_templates
  DROP CONSTRAINT IF EXISTS move_templates_parent_version_fk;

ALTER TABLE public.move_templates
  ADD CONSTRAINT move_templates_parent_version_fk
  FOREIGN KEY (parent_version_id)
  REFERENCES public.move_template_versions(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.move_template_review_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.move_templates(id) ON DELETE CASCADE,
  decision move_template_review_decision NOT NULL DEFAULT 'submitted',
  reviewer_id TEXT,
  submitted_by_id TEXT,
  comment TEXT,
  depth_score NUMERIC(4,2) CHECK (depth_score >= 0 AND depth_score <= 10),
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.move_instances (
  instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.move_templates(id) ON DELETE RESTRICT,
  template_version_pinned INTEGER NOT NULL CHECK (template_version_pinned >= 1),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES public.engagements(id) ON DELETE SET NULL,
  sponsor_assignments_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_gate TEXT,
  status move_instance_status NOT NULL DEFAULT 'draft',
  artifact_completion_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  gate_skeleton_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  options_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instance_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.move_template_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.move_templates(id) ON DELETE SET NULL,
  instance_id UUID REFERENCES public.move_instances(instance_id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  actor_id TEXT,
  event_type TEXT NOT NULL,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_move_templates_kind_status
  ON public.move_templates(kind, status);
CREATE INDEX IF NOT EXISTS idx_move_templates_depth
  ON public.move_templates(depth_score DESC);
CREATE INDEX IF NOT EXISTS idx_move_templates_overlays
  ON public.move_templates USING gin(vertical_overlays, intended_personas);
CREATE INDEX IF NOT EXISTS idx_move_template_gates_template_sequence
  ON public.move_template_gates(template_id, sequence_index);
CREATE INDEX IF NOT EXISTS idx_move_template_artifacts_gate
  ON public.move_template_artifacts(gate_id);
CREATE INDEX IF NOT EXISTS idx_move_template_versions_recent
  ON public.move_template_versions(template_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_move_template_review_recent
  ON public.move_template_review_state(template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_move_instances_client_status
  ON public.move_instances(client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_move_instances_template_version
  ON public.move_instances(template_id, template_version_pinned);
CREATE INDEX IF NOT EXISTS idx_move_template_audit_template_recent
  ON public.move_template_audit_log(template_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_move_template_audit_client_recent
  ON public.move_template_audit_log(client_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.touch_move_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_move_templates_touch ON public.move_templates;
CREATE TRIGGER trg_move_templates_touch
  BEFORE UPDATE ON public.move_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_move_template_updated_at();

DROP TRIGGER IF EXISTS trg_move_template_gates_touch ON public.move_template_gates;
CREATE TRIGGER trg_move_template_gates_touch
  BEFORE UPDATE ON public.move_template_gates
  FOR EACH ROW EXECUTE FUNCTION public.touch_move_template_updated_at();

DROP TRIGGER IF EXISTS trg_move_template_artifacts_touch ON public.move_template_artifacts;
CREATE TRIGGER trg_move_template_artifacts_touch
  BEFORE UPDATE ON public.move_template_artifacts
  FOR EACH ROW EXECUTE FUNCTION public.touch_move_template_updated_at();

DROP TRIGGER IF EXISTS trg_move_instances_touch ON public.move_instances;
CREATE TRIGGER trg_move_instances_touch
  BEFORE UPDATE ON public.move_instances
  FOR EACH ROW EXECUTE FUNCTION public.touch_move_template_updated_at();

CREATE OR REPLACE FUNCTION public.is_move_template_reviewer()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('maestro', 'admin', 'tenant_admin', 'client_admin', 'template_reviewer', 'reviewer')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_write_move_template(p_template_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_move_template_reviewer()
    OR EXISTS (
      SELECT 1
      FROM public.move_templates mt
      WHERE mt.id = p_template_id
        AND mt.primary_author_id = current_user_id()
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_move_template_reviewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_move_template(UUID) TO authenticated;

ALTER TABLE public.move_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_template_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_template_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_template_review_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_template_audit_log ENABLE ROW LEVEL SECURITY;

DO $template_service_role$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'move_templates',
    'move_template_gates',
    'move_template_artifacts',
    'move_template_versions',
    'move_template_review_state',
    'move_instances',
    'move_template_audit_log'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS service_role_all_%I ON public.%I', v_table, v_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'service_role_all_' || v_table,
      v_table
    );
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', v_table);
  END LOOP;
END
$template_service_role$;

DROP POLICY IF EXISTS auth_read_move_templates ON public.move_templates;
CREATE POLICY auth_read_move_templates
  ON public.move_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_insert_move_templates ON public.move_templates;
CREATE POLICY auth_insert_move_templates
  ON public.move_templates FOR INSERT TO authenticated
  WITH CHECK (primary_author_id = current_user_id() OR public.is_move_template_reviewer());
DROP POLICY IF EXISTS auth_update_move_templates ON public.move_templates;
CREATE POLICY auth_update_move_templates
  ON public.move_templates FOR UPDATE TO authenticated
  USING (public.can_write_move_template(id))
  WITH CHECK (public.can_write_move_template(id));

DROP POLICY IF EXISTS auth_read_move_template_gates ON public.move_template_gates;
CREATE POLICY auth_read_move_template_gates
  ON public.move_template_gates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_write_move_template_gates ON public.move_template_gates;
CREATE POLICY auth_write_move_template_gates
  ON public.move_template_gates FOR ALL TO authenticated
  USING (public.can_write_move_template(template_id))
  WITH CHECK (public.can_write_move_template(template_id));

DROP POLICY IF EXISTS auth_read_move_template_artifacts ON public.move_template_artifacts;
CREATE POLICY auth_read_move_template_artifacts
  ON public.move_template_artifacts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_write_move_template_artifacts ON public.move_template_artifacts;
CREATE POLICY auth_write_move_template_artifacts
  ON public.move_template_artifacts FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.move_template_gates g
    WHERE g.id = public.move_template_artifacts.gate_id
      AND public.can_write_move_template(g.template_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.move_template_gates g
    WHERE g.id = public.move_template_artifacts.gate_id
      AND public.can_write_move_template(g.template_id)
  ));

DROP POLICY IF EXISTS auth_read_move_template_versions ON public.move_template_versions;
CREATE POLICY auth_read_move_template_versions
  ON public.move_template_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_insert_move_template_versions ON public.move_template_versions;
CREATE POLICY auth_insert_move_template_versions
  ON public.move_template_versions FOR INSERT TO authenticated
  WITH CHECK (public.can_write_move_template(template_id));

DROP POLICY IF EXISTS auth_read_move_template_review ON public.move_template_review_state;
CREATE POLICY auth_read_move_template_review
  ON public.move_template_review_state FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_insert_move_template_review ON public.move_template_review_state;
CREATE POLICY auth_insert_move_template_review
  ON public.move_template_review_state FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by_id = current_user_id()
    OR reviewer_id = current_user_id()
    OR public.is_move_template_reviewer()
  );

DROP POLICY IF EXISTS auth_read_move_instances ON public.move_instances;
CREATE POLICY auth_read_move_instances
  ON public.move_instances FOR SELECT TO authenticated
  USING (can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_write_move_instances ON public.move_instances;
CREATE POLICY auth_write_move_instances
  ON public.move_instances FOR ALL TO authenticated
  USING (can_write_tenant_by_id(client_id))
  WITH CHECK (can_write_tenant_by_id(client_id));

DROP POLICY IF EXISTS auth_read_move_template_audit ON public.move_template_audit_log;
CREATE POLICY auth_read_move_template_audit
  ON public.move_template_audit_log FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_move_template_audit ON public.move_template_audit_log;
CREATE POLICY auth_insert_move_template_audit
  ON public.move_template_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = current_user_id()
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.move_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.move_template_gates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.move_template_artifacts TO authenticated;
GRANT SELECT, INSERT ON public.move_template_versions TO authenticated;
GRANT SELECT, INSERT ON public.move_template_review_state TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.move_instances TO authenticated;
GRANT SELECT, INSERT ON public.move_template_audit_log TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
