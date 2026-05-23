-- P5 Workshop template data layer · Azure Postgres target.
--
-- The folder name remains `supabase/migrations` for existing tooling, but
-- this schema is Postgres-first and Azure-native. Tenant table is `clients`;
-- tenant FK is `client_id`. Template rows may be global (`client_id IS NULL`)
-- or client-private (`client_id IS NOT NULL`); instances are always tenant-scoped.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $workshop_types$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workshop_template_status') THEN
    CREATE TYPE workshop_template_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'retired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workshop_asset_type') THEN
    CREATE TYPE workshop_asset_type AS ENUM (
      'pre_read',
      'agenda',
      'facilitator_brief',
      'worksheet',
      'decision_capture',
      'pre_mortem',
      'post_read',
      'stakeholder_map'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workshop_review_decision') THEN
    CREATE TYPE workshop_review_decision AS ENUM ('submitted', 'commented', 'changes_requested', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workshop_instance_status') THEN
    CREATE TYPE workshop_instance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workshop_pack_format') THEN
    CREATE TYPE workshop_pack_format AS ENUM ('pdf', 'zip');
  END IF;
END
$workshop_types$;

CREATE TABLE IF NOT EXISTS public.workshop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_version_id UUID,
  status workshop_template_status NOT NULL DEFAULT 'draft',
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  owning_gate_id UUID REFERENCES public.gate_criteria(id) ON DELETE SET NULL,
  hypothesis_to_test TEXT NOT NULL DEFAULT '',
  stakeholder_map_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  facilitator_tactics_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  vertical_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_by TEXT,
  updated_by TEXT,
  approved_by TEXT,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, slug, version)
);

CREATE TABLE IF NOT EXISTS public.workshop_template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshop_templates(id) ON DELETE CASCADE,
  asset_type workshop_asset_type NOT NULL,
  sequence_index INTEGER NOT NULL CHECK (sequence_index >= 0),
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  content_text TEXT,
  content_blob_ref TEXT,
  schema_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  time_box_minutes INTEGER CHECK (time_box_minutes IS NULL OR time_box_minutes >= 0),
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CHECK (content_text IS NOT NULL OR content_blob_ref IS NOT NULL),
  UNIQUE (workshop_id, sequence_index)
);

CREATE TABLE IF NOT EXISTS public.workshop_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshop_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  status workshop_template_status NOT NULL,
  snapshot_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workshop_id, version)
);

ALTER TABLE public.workshop_templates
  DROP CONSTRAINT IF EXISTS workshop_templates_parent_version_fk;

ALTER TABLE public.workshop_templates
  ADD CONSTRAINT workshop_templates_parent_version_fk
  FOREIGN KEY (parent_version_id)
  REFERENCES public.workshop_template_versions(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.workshop_template_review_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshop_templates(id) ON DELETE CASCADE,
  decision workshop_review_decision NOT NULL DEFAULT 'submitted',
  reviewer_id TEXT,
  submitted_by_id TEXT,
  comment TEXT,
  depth_score NUMERIC(4,2) CHECK (depth_score IS NULL OR (depth_score >= 0 AND depth_score <= 10)),
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workshop_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workshop_templates(id) ON DELETE RESTRICT,
  version_pinned INTEGER NOT NULL CHECK (version_pinned >= 1),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  move_instance_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES public.gate_criteria(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  status workshop_instance_status NOT NULL DEFAULT 'scheduled',
  decisions_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  dissent_log_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  post_read_sent_at TIMESTAMPTZ,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (client_id, template_id, version_pinned, move_instance_id, gate_id)
);

CREATE TABLE IF NOT EXISTS public.workshop_pack_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshop_templates(id) ON DELETE CASCADE,
  workshop_instance_id UUID REFERENCES public.workshop_instances(id) ON DELETE SET NULL,
  move_instance_id UUID REFERENCES public.engagements(id) ON DELETE SET NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  format workshop_pack_format NOT NULL,
  blob_ref TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  sha256 TEXT NOT NULL,
  rendered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workshop_templates_status
  ON public.workshop_templates(status, updated_at DESC)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_templates_global_slug_version
  ON public.workshop_templates(slug, version)
  WHERE client_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_templates_client_slug_version
  ON public.workshop_templates(client_id, slug, version)
  WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workshop_templates_client_status
  ON public.workshop_templates(client_id, status, updated_at DESC)
  WHERE deleted_at IS NULL AND client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workshop_templates_gate
  ON public.workshop_templates(owning_gate_id)
  WHERE deleted_at IS NULL AND owning_gate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workshop_template_assets_workshop
  ON public.workshop_template_assets(workshop_id, sequence_index)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workshop_template_versions_recent
  ON public.workshop_template_versions(workshop_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_template_review_recent
  ON public.workshop_template_review_state(workshop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_instances_client_move
  ON public.workshop_instances(client_id, move_instance_id, scheduled_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workshop_instances_gate
  ON public.workshop_instances(gate_id)
  WHERE deleted_at IS NULL AND gate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workshop_pack_renders_client_recent
  ON public.workshop_pack_renders(client_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_workshops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workshop_templates_touch ON public.workshop_templates;
CREATE TRIGGER trg_workshop_templates_touch
  BEFORE UPDATE ON public.workshop_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_workshops_updated_at();

DROP TRIGGER IF EXISTS trg_workshop_template_assets_touch ON public.workshop_template_assets;
CREATE TRIGGER trg_workshop_template_assets_touch
  BEFORE UPDATE ON public.workshop_template_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_workshops_updated_at();

DROP TRIGGER IF EXISTS trg_workshop_instances_touch ON public.workshop_instances;
CREATE TRIGGER trg_workshop_instances_touch
  BEFORE UPDATE ON public.workshop_instances
  FOR EACH ROW EXECUTE FUNCTION public.touch_workshops_updated_at();

CREATE OR REPLACE FUNCTION public.is_workshop_reviewer()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('maestro', 'admin', 'tenant_admin', 'client_admin', 'workshop_reviewer', 'reviewer')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_read_workshop_template(p_workshop_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workshop_templates wt
    WHERE wt.id = p_workshop_id
      AND wt.deleted_at IS NULL
      AND (wt.client_id IS NULL OR can_read_tenant_by_id(wt.client_id))
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_write_workshop_template(p_workshop_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workshop_templates wt
    WHERE wt.id = p_workshop_id
      AND wt.deleted_at IS NULL
      AND (
        public.is_workshop_reviewer()
        OR wt.created_by = current_user_id()
        OR (wt.client_id IS NOT NULL AND can_write_tenant_by_id(wt.client_id))
      )
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_workshop_reviewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_workshop_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_workshop_template(UUID) TO authenticated;

ALTER TABLE public.workshop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_template_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_template_review_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_pack_renders ENABLE ROW LEVEL SECURITY;

DO $workshop_rls$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'workshop_templates',
    'workshop_template_assets',
    'workshop_template_versions',
    'workshop_template_review_state',
    'workshop_instances',
    'workshop_pack_renders'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'service_role_all_' || v_table, v_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'service_role_all_' || v_table,
      v_table
    );
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', v_table);
  END LOOP;
END
$workshop_rls$;

DROP POLICY IF EXISTS auth_read_workshop_templates ON public.workshop_templates;
CREATE POLICY auth_read_workshop_templates
  ON public.workshop_templates FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND (client_id IS NULL OR can_read_tenant_by_id(client_id)));
DROP POLICY IF EXISTS auth_insert_workshop_templates ON public.workshop_templates;
CREATE POLICY auth_insert_workshop_templates
  ON public.workshop_templates FOR INSERT TO authenticated
  WITH CHECK (
    created_by = current_user_id()
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );
DROP POLICY IF EXISTS auth_update_workshop_templates ON public.workshop_templates;
CREATE POLICY auth_update_workshop_templates
  ON public.workshop_templates FOR UPDATE TO authenticated
  USING (deleted_at IS NULL AND (public.is_workshop_reviewer() OR created_by = current_user_id() OR (client_id IS NOT NULL AND can_write_tenant_by_id(client_id))))
  WITH CHECK (client_id IS NULL OR can_write_tenant_by_id(client_id));

DROP POLICY IF EXISTS auth_read_workshop_template_assets ON public.workshop_template_assets;
CREATE POLICY auth_read_workshop_template_assets
  ON public.workshop_template_assets FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.can_read_workshop_template(workshop_id));
DROP POLICY IF EXISTS auth_write_workshop_template_assets ON public.workshop_template_assets;
CREATE POLICY auth_write_workshop_template_assets
  ON public.workshop_template_assets FOR ALL TO authenticated
  USING (deleted_at IS NULL AND public.can_write_workshop_template(workshop_id))
  WITH CHECK (public.can_write_workshop_template(workshop_id));

DROP POLICY IF EXISTS auth_read_workshop_template_versions ON public.workshop_template_versions;
CREATE POLICY auth_read_workshop_template_versions
  ON public.workshop_template_versions FOR SELECT TO authenticated
  USING (public.can_read_workshop_template(workshop_id));
DROP POLICY IF EXISTS auth_insert_workshop_template_versions ON public.workshop_template_versions;
CREATE POLICY auth_insert_workshop_template_versions
  ON public.workshop_template_versions FOR INSERT TO authenticated
  WITH CHECK (public.can_write_workshop_template(workshop_id));

DROP POLICY IF EXISTS auth_read_workshop_template_review_state ON public.workshop_template_review_state;
CREATE POLICY auth_read_workshop_template_review_state
  ON public.workshop_template_review_state FOR SELECT TO authenticated
  USING (public.can_read_workshop_template(workshop_id));
DROP POLICY IF EXISTS auth_insert_workshop_template_review_state ON public.workshop_template_review_state;
CREATE POLICY auth_insert_workshop_template_review_state
  ON public.workshop_template_review_state FOR INSERT TO authenticated
  WITH CHECK (
    public.can_write_workshop_template(workshop_id)
    OR reviewer_id = current_user_id()
    OR submitted_by_id = current_user_id()
  );

DROP POLICY IF EXISTS auth_read_workshop_instances ON public.workshop_instances;
CREATE POLICY auth_read_workshop_instances
  ON public.workshop_instances FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_write_workshop_instances ON public.workshop_instances;
CREATE POLICY auth_write_workshop_instances
  ON public.workshop_instances FOR ALL TO authenticated
  USING (deleted_at IS NULL AND can_write_tenant_by_id(client_id))
  WITH CHECK (can_write_tenant_by_id(client_id));

DROP POLICY IF EXISTS auth_read_workshop_pack_renders ON public.workshop_pack_renders;
CREATE POLICY auth_read_workshop_pack_renders
  ON public.workshop_pack_renders FOR SELECT TO authenticated
  USING (can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_workshop_pack_renders ON public.workshop_pack_renders;
CREATE POLICY auth_insert_workshop_pack_renders
  ON public.workshop_pack_renders FOR INSERT TO authenticated
  WITH CHECK (can_write_tenant_by_id(client_id));

GRANT SELECT, INSERT, UPDATE ON public.workshop_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workshop_template_assets TO authenticated;
GRANT SELECT, INSERT ON public.workshop_template_versions TO authenticated;
GRANT SELECT, INSERT ON public.workshop_template_review_state TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workshop_instances TO authenticated;
GRANT SELECT, INSERT ON public.workshop_pack_renders TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
