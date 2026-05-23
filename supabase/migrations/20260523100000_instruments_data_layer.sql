-- P4 Discovery instrument data layer · Azure Postgres target.
--
-- The folder name remains `supabase/migrations` for existing tooling, but
-- this schema is Postgres-first and Azure-native. Tenant table is `clients`;
-- tenant FK is `client_id`.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $instrument_types$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instrument_template_status') THEN
    CREATE TYPE instrument_template_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'retired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instrument_format') THEN
    CREATE TYPE instrument_format AS ENUM ('csv', 'md', 'json', 'docx', 'sql', 'interactive_form');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instrument_review_decision') THEN
    CREATE TYPE instrument_review_decision AS ENUM ('submitted', 'commented', 'changes_requested', 'approved', 'rejected');
  END IF;
END
$instrument_types$;

CREATE TABLE IF NOT EXISTS public.instrument_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_version_id UUID,
  status instrument_template_status NOT NULL DEFAULT 'draft',
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  format instrument_format NOT NULL,
  schema_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_template_text TEXT NOT NULL DEFAULT '',
  content_blob_ref TEXT,
  sample_size_math_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  bias_controls_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_block TEXT NOT NULL DEFAULT '',
  validation_rules_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  triangulation_plan_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  edge_case_guide_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  refresh_cadence TEXT NOT NULL DEFAULT '',
  t_tier SMALLINT NOT NULL CHECK (t_tier BETWEEN 1 AND 3),
  owner_role TEXT NOT NULL DEFAULT '',
  time_to_complete_days INTEGER NOT NULL DEFAULT 1 CHECK (time_to_complete_days >= 0),
  vertical_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  primary_author_id TEXT,
  approved_by_id TEXT,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, slug, version),
  UNIQUE (slug, version)
);

CREATE TABLE IF NOT EXISTS public.instrument_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.instrument_templates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  status instrument_template_status NOT NULL,
  snapshot_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

ALTER TABLE public.instrument_templates
  DROP CONSTRAINT IF EXISTS instrument_templates_parent_version_fk;

ALTER TABLE public.instrument_templates
  ADD CONSTRAINT instrument_templates_parent_version_fk
  FOREIGN KEY (parent_version_id)
  REFERENCES public.instrument_template_versions(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.instrument_template_review_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.instrument_templates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  decision instrument_review_decision NOT NULL DEFAULT 'submitted',
  reviewer_id TEXT,
  submitted_by_id TEXT,
  comment TEXT,
  depth_score NUMERIC(4,2) CHECK (depth_score >= 0 AND depth_score <= 10),
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instrument_template_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.instrument_templates(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instrument_templates_status_category
  ON public.instrument_templates(status, category);
CREATE INDEX IF NOT EXISTS idx_instrument_templates_client_status
  ON public.instrument_templates(client_id, status, category);
CREATE INDEX IF NOT EXISTS idx_instrument_templates_overlays
  ON public.instrument_templates USING gin(vertical_overlays);
CREATE INDEX IF NOT EXISTS idx_instrument_template_versions_recent
  ON public.instrument_template_versions(template_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_instrument_template_review_recent
  ON public.instrument_template_review_state(template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instrument_template_audit_recent
  ON public.instrument_template_audit(template_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.touch_instrument_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_instrument_templates_touch ON public.instrument_templates;
CREATE TRIGGER trg_instrument_templates_touch
  BEFORE UPDATE ON public.instrument_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_instrument_templates_updated_at();

CREATE OR REPLACE FUNCTION public.is_instrument_reviewer()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('maestro', 'admin', 'tenant_admin', 'client_admin', 'instrument_reviewer', 'reviewer')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_write_instrument_template(p_template_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_instrument_reviewer()
    OR EXISTS (
      SELECT 1
      FROM public.instrument_templates it
      WHERE it.id = p_template_id
        AND it.primary_author_id = current_user_id()
        AND (it.client_id IS NULL OR can_write_tenant_by_id(it.client_id))
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_instrument_reviewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_instrument_template(UUID) TO authenticated;

ALTER TABLE public.instrument_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_template_review_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_template_audit ENABLE ROW LEVEL SECURITY;

DO $instrument_service_role$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'instrument_templates',
    'instrument_template_versions',
    'instrument_template_review_state',
    'instrument_template_audit'
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
$instrument_service_role$;

DROP POLICY IF EXISTS auth_read_instrument_templates ON public.instrument_templates;
CREATE POLICY auth_read_instrument_templates
  ON public.instrument_templates FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_instrument_templates ON public.instrument_templates;
CREATE POLICY auth_insert_instrument_templates
  ON public.instrument_templates FOR INSERT TO authenticated
  WITH CHECK (
    (client_id IS NULL OR can_write_tenant_by_id(client_id))
    AND (primary_author_id = current_user_id() OR public.is_instrument_reviewer())
  );
DROP POLICY IF EXISTS auth_update_instrument_templates ON public.instrument_templates;
CREATE POLICY auth_update_instrument_templates
  ON public.instrument_templates FOR UPDATE TO authenticated
  USING (public.can_write_instrument_template(id))
  WITH CHECK (public.can_write_instrument_template(id));

DROP POLICY IF EXISTS auth_read_instrument_versions ON public.instrument_template_versions;
CREATE POLICY auth_read_instrument_versions
  ON public.instrument_template_versions FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_instrument_versions ON public.instrument_template_versions;
CREATE POLICY auth_insert_instrument_versions
  ON public.instrument_template_versions FOR INSERT TO authenticated
  WITH CHECK (
    public.can_write_instrument_template(template_id)
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );

DROP POLICY IF EXISTS auth_read_instrument_review ON public.instrument_template_review_state;
CREATE POLICY auth_read_instrument_review
  ON public.instrument_template_review_state FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_instrument_review ON public.instrument_template_review_state;
CREATE POLICY auth_insert_instrument_review
  ON public.instrument_template_review_state FOR INSERT TO authenticated
  WITH CHECK (
    (submitted_by_id = current_user_id() OR reviewer_id = current_user_id() OR public.is_instrument_reviewer())
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );

DROP POLICY IF EXISTS auth_read_instrument_audit ON public.instrument_template_audit;
CREATE POLICY auth_read_instrument_audit
  ON public.instrument_template_audit FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_instrument_audit ON public.instrument_template_audit;
CREATE POLICY auth_insert_instrument_audit
  ON public.instrument_template_audit FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = current_user_id()
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );

DO $instrument_assignment_fk$
BEGIN
  IF to_regclass('public.discovery_instruments') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'discovery_instruments_instrument_template_id_fkey'
         AND conrelid = 'public.discovery_instruments'::regclass
     ) THEN
    ALTER TABLE public.discovery_instruments
      ADD CONSTRAINT discovery_instruments_instrument_template_id_fkey
      FOREIGN KEY (instrument_template_id)
      REFERENCES public.instrument_templates(id)
      ON DELETE RESTRICT;
  END IF;
END
$instrument_assignment_fk$;

NOTIFY pgrst, 'reload schema';

COMMIT;
