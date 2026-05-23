-- P1 Corpus data layer · Azure Postgres target.
--
-- The folder name remains `supabase/migrations` for existing tooling, but
-- this schema is Postgres-first and Azure-native. Tenant table is `clients`;
-- tenant FK is `client_id`.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $corpus_types$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'corpus_pattern_status') THEN
    CREATE TYPE corpus_pattern_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'retired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'corpus_relationship_type') THEN
    CREATE TYPE corpus_relationship_type AS ENUM ('supports', 'contradicts', 'extends', 'depends_on', 'replaces', 'related');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'corpus_review_decision') THEN
    CREATE TYPE corpus_review_decision AS ENUM ('submitted', 'commented', 'changes_requested', 'approved', 'rejected');
  END IF;
END
$corpus_types$;

CREATE TABLE IF NOT EXISTS public.corpus_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status corpus_pattern_status NOT NULL DEFAULT 'draft',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.750 CHECK (confidence >= 0 AND confidence <= 1),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_version_id UUID,
  primary_author_id TEXT,
  approved_by_id TEXT,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  search_doc_id TEXT UNIQUE,
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  vertical_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  region_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  applicable_horizons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corpus_pattern_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES public.corpus_patterns(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  status corpus_pattern_status NOT NULL,
  snapshot_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pattern_id, version)
);

ALTER TABLE public.corpus_patterns
  DROP CONSTRAINT IF EXISTS corpus_patterns_parent_version_fk;

ALTER TABLE public.corpus_patterns
  ADD CONSTRAINT corpus_patterns_parent_version_fk
  FOREIGN KEY (parent_version_id)
  REFERENCES public.corpus_pattern_versions(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.corpus_pattern_content (
  pattern_id UUID PRIMARY KEY REFERENCES public.corpus_patterns(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  markdown_body TEXT NOT NULL DEFAULT '',
  claims_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  counterarguments_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
  synthesis_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corpus_pattern_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id UUID NOT NULL REFERENCES public.corpus_patterns(id) ON DELETE CASCADE,
  to_id UUID NOT NULL REFERENCES public.corpus_patterns(id) ON DELETE CASCADE,
  type corpus_relationship_type NOT NULL,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.750 CHECK (confidence >= 0 AND confidence <= 1),
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_id, to_id, type),
  CHECK (from_id <> to_id)
);

CREATE TABLE IF NOT EXISTS public.corpus_review_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES public.corpus_patterns(id) ON DELETE CASCADE,
  decision corpus_review_decision NOT NULL DEFAULT 'submitted',
  reviewer_id TEXT,
  submitted_by_id TEXT,
  comment TEXT,
  depth_score NUMERIC(4,2) CHECK (depth_score >= 0 AND depth_score <= 10),
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corpus_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  context_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  actor_id TEXT,
  pattern_id UUID REFERENCES public.corpus_patterns(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corpus_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES public.corpus_patterns(id) ON DELETE CASCADE,
  overlay_type TEXT NOT NULL,
  overlay_key TEXT NOT NULL,
  content_delta_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pattern_id, overlay_type, overlay_key)
);

CREATE TABLE IF NOT EXISTS public.client_private_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status corpus_pattern_status NOT NULL DEFAULT 'draft',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.750 CHECK (confidence >= 0 AND confidence <= 1),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  parent_version_id UUID,
  primary_author_id TEXT,
  approved_by_id TEXT,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  search_doc_id TEXT UNIQUE,
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  vertical_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  region_overlays TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  applicable_horizons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  markdown_body TEXT NOT NULL DEFAULT '',
  structured_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, slug, version)
);

CREATE INDEX IF NOT EXISTS idx_corpus_patterns_status_category
  ON public.corpus_patterns(status, category);
CREATE INDEX IF NOT EXISTS idx_corpus_patterns_overlays
  ON public.corpus_patterns USING gin(vertical_overlays, region_overlays, applicable_horizons);
CREATE INDEX IF NOT EXISTS idx_corpus_pattern_versions_recent
  ON public.corpus_pattern_versions(pattern_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_relationships_from
  ON public.corpus_pattern_relationships(from_id, type);
CREATE INDEX IF NOT EXISTS idx_corpus_relationships_to
  ON public.corpus_pattern_relationships(to_id, type);
CREATE INDEX IF NOT EXISTS idx_corpus_review_pattern_recent
  ON public.corpus_review_state(pattern_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_telemetry_client_recent
  ON public.corpus_telemetry(client_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_telemetry_pattern_recent
  ON public.corpus_telemetry(pattern_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_overlays_lookup
  ON public.corpus_overlays(overlay_type, overlay_key);
CREATE INDEX IF NOT EXISTS idx_client_private_patterns_client_status
  ON public.client_private_patterns(client_id, status, category);

CREATE OR REPLACE FUNCTION public.touch_corpus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_corpus_patterns_touch ON public.corpus_patterns;
CREATE TRIGGER trg_corpus_patterns_touch
  BEFORE UPDATE ON public.corpus_patterns
  FOR EACH ROW EXECUTE FUNCTION public.touch_corpus_updated_at();

DROP TRIGGER IF EXISTS trg_corpus_pattern_content_touch ON public.corpus_pattern_content;
CREATE TRIGGER trg_corpus_pattern_content_touch
  BEFORE UPDATE ON public.corpus_pattern_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_corpus_updated_at();

DROP TRIGGER IF EXISTS trg_corpus_overlays_touch ON public.corpus_overlays;
CREATE TRIGGER trg_corpus_overlays_touch
  BEFORE UPDATE ON public.corpus_overlays
  FOR EACH ROW EXECUTE FUNCTION public.touch_corpus_updated_at();

DROP TRIGGER IF EXISTS trg_client_private_patterns_touch ON public.client_private_patterns;
CREATE TRIGGER trg_client_private_patterns_touch
  BEFORE UPDATE ON public.client_private_patterns
  FOR EACH ROW EXECUTE FUNCTION public.touch_corpus_updated_at();

CREATE OR REPLACE FUNCTION public.is_corpus_reviewer()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('maestro', 'admin', 'tenant_admin', 'client_admin', 'corpus_reviewer', 'reviewer')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_write_corpus_pattern(p_pattern_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_corpus_reviewer()
    OR EXISTS (
      SELECT 1
      FROM public.corpus_patterns cp
      WHERE cp.id = p_pattern_id
        AND cp.primary_author_id = current_user_id()
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_corpus_reviewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_corpus_pattern(UUID) TO authenticated;

ALTER TABLE public.corpus_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_pattern_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_pattern_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_pattern_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_review_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corpus_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_private_patterns ENABLE ROW LEVEL SECURITY;

DO $corpus_rls$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'corpus_patterns',
    'corpus_pattern_versions',
    'corpus_pattern_content',
    'corpus_pattern_relationships',
    'corpus_review_state',
    'corpus_telemetry',
    'corpus_overlays',
    'client_private_patterns'
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
$corpus_rls$;

DROP POLICY IF EXISTS auth_read_corpus_patterns ON public.corpus_patterns;
CREATE POLICY auth_read_corpus_patterns
  ON public.corpus_patterns FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_insert_corpus_patterns ON public.corpus_patterns;
CREATE POLICY auth_insert_corpus_patterns
  ON public.corpus_patterns FOR INSERT TO authenticated
  WITH CHECK (primary_author_id = current_user_id() OR public.is_corpus_reviewer());
DROP POLICY IF EXISTS auth_update_corpus_patterns ON public.corpus_patterns;
CREATE POLICY auth_update_corpus_patterns
  ON public.corpus_patterns FOR UPDATE TO authenticated
  USING (public.can_write_corpus_pattern(id))
  WITH CHECK (public.can_write_corpus_pattern(id));

DROP POLICY IF EXISTS auth_read_corpus_versions ON public.corpus_pattern_versions;
CREATE POLICY auth_read_corpus_versions
  ON public.corpus_pattern_versions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_insert_corpus_versions ON public.corpus_pattern_versions;
CREATE POLICY auth_insert_corpus_versions
  ON public.corpus_pattern_versions FOR INSERT TO authenticated
  WITH CHECK (public.can_write_corpus_pattern(pattern_id));

DROP POLICY IF EXISTS auth_read_corpus_content ON public.corpus_pattern_content;
CREATE POLICY auth_read_corpus_content
  ON public.corpus_pattern_content FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_write_corpus_content ON public.corpus_pattern_content;
CREATE POLICY auth_write_corpus_content
  ON public.corpus_pattern_content FOR ALL TO authenticated
  USING (public.can_write_corpus_pattern(pattern_id))
  WITH CHECK (public.can_write_corpus_pattern(pattern_id));

DROP POLICY IF EXISTS auth_read_corpus_relationships ON public.corpus_pattern_relationships;
CREATE POLICY auth_read_corpus_relationships
  ON public.corpus_pattern_relationships FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_write_corpus_relationships ON public.corpus_pattern_relationships;
CREATE POLICY auth_write_corpus_relationships
  ON public.corpus_pattern_relationships FOR ALL TO authenticated
  USING (public.can_write_corpus_pattern(from_id) OR public.can_write_corpus_pattern(to_id))
  WITH CHECK (public.can_write_corpus_pattern(from_id) OR public.can_write_corpus_pattern(to_id));

DROP POLICY IF EXISTS auth_read_corpus_review ON public.corpus_review_state;
CREATE POLICY auth_read_corpus_review
  ON public.corpus_review_state FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_insert_corpus_review ON public.corpus_review_state;
CREATE POLICY auth_insert_corpus_review
  ON public.corpus_review_state FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by_id = current_user_id()
    OR reviewer_id = current_user_id()
    OR public.is_corpus_reviewer()
  );

DROP POLICY IF EXISTS auth_read_corpus_telemetry ON public.corpus_telemetry;
CREATE POLICY auth_read_corpus_telemetry
  ON public.corpus_telemetry FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_insert_corpus_telemetry ON public.corpus_telemetry;
CREATE POLICY auth_insert_corpus_telemetry
  ON public.corpus_telemetry FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = current_user_id()
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );

DROP POLICY IF EXISTS auth_read_corpus_overlays ON public.corpus_overlays;
CREATE POLICY auth_read_corpus_overlays
  ON public.corpus_overlays FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS auth_write_corpus_overlays ON public.corpus_overlays;
CREATE POLICY auth_write_corpus_overlays
  ON public.corpus_overlays FOR ALL TO authenticated
  USING (public.is_corpus_reviewer())
  WITH CHECK (public.is_corpus_reviewer());

DROP POLICY IF EXISTS auth_read_client_private_patterns ON public.client_private_patterns;
CREATE POLICY auth_read_client_private_patterns
  ON public.client_private_patterns FOR SELECT TO authenticated
  USING (can_read_tenant_by_id(client_id));
DROP POLICY IF EXISTS auth_write_client_private_patterns ON public.client_private_patterns;
CREATE POLICY auth_write_client_private_patterns
  ON public.client_private_patterns FOR ALL TO authenticated
  USING (can_write_tenant_by_id(client_id))
  WITH CHECK (can_write_tenant_by_id(client_id));

GRANT SELECT ON public.corpus_patterns TO authenticated;
GRANT SELECT ON public.corpus_pattern_versions TO authenticated;
GRANT SELECT ON public.corpus_pattern_content TO authenticated;
GRANT SELECT ON public.corpus_pattern_relationships TO authenticated;
GRANT SELECT ON public.corpus_review_state TO authenticated;
GRANT SELECT, INSERT ON public.corpus_telemetry TO authenticated;
GRANT SELECT ON public.corpus_overlays TO authenticated;
GRANT SELECT ON public.client_private_patterns TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.corpus_patterns TO authenticated;
GRANT INSERT ON public.corpus_pattern_versions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.corpus_pattern_content TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.corpus_pattern_relationships TO authenticated;
GRANT INSERT ON public.corpus_review_state TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.corpus_overlays TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.client_private_patterns TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
