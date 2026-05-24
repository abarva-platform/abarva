-- Legacy clean-cutover PR A: framework overlays substrate.
--
-- This creates the DB home for migrated Domain Function Packs. It is
-- Postgres-first and Azure-native: tenant table is `clients`; tenant FK is
-- `client_id`. The table is intentionally separate from `corpus_overlays`:
-- corpus overlays modify or specialize individual corpus patterns, while
-- framework overlays hold executable framework records such as Function Packs
-- that are selected by client vertical/function.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.framework_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  vertical_key TEXT NOT NULL,
  function_key TEXT NOT NULL,
  overlay_kind TEXT NOT NULL DEFAULT 'function-pack'
    CHECK (overlay_kind IN ('function-pack')),
  status corpus_pattern_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  framework_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_corpus_pattern_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  depth_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 10),
  created_by_id TEXT,
  approved_by_id TEXT,
  published_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (length(btrim(vertical_key)) > 0),
  CHECK (length(btrim(function_key)) > 0)
);

COMMENT ON TABLE public.framework_overlays IS
  'DB-backed executable framework overlays, including migrated Domain Function Packs. Global rows have client_id NULL; client-specific rows are scoped to clients.id.';
COMMENT ON COLUMN public.framework_overlays.client_id IS
  'Optional tenant scope. Uses clients/client_id convention; NULL means global overlay.';
COMMENT ON COLUMN public.framework_overlays.vertical_key IS
  'Client vertical / industry key used to select the framework overlay.';
COMMENT ON COLUMN public.framework_overlays.function_key IS
  'Function key within the vertical, matching engagements.function_pack_key.';
COMMENT ON COLUMN public.framework_overlays.framework_jsonb IS
  'Typed framework payload, for Function Packs matching the FunctionPack schema.';
COMMENT ON COLUMN public.framework_overlays.source_corpus_pattern_ids IS
  'Corpus pattern ids that grounded this overlay during migration/authoring.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_framework_overlays_unique_version
  ON public.framework_overlays(
    coalesce(client_id::text, 'global'),
    vertical_key,
    function_key,
    overlay_kind,
    version
  );
CREATE INDEX IF NOT EXISTS idx_framework_overlays_lookup
  ON public.framework_overlays(
    vertical_key,
    function_key,
    overlay_kind,
    status,
    version DESC
  );
CREATE INDEX IF NOT EXISTS idx_framework_overlays_client_lookup
  ON public.framework_overlays(client_id, vertical_key, function_key)
  WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_framework_overlays_sources
  ON public.framework_overlays USING gin(source_corpus_pattern_ids);

DROP TRIGGER IF EXISTS trg_framework_overlays_touch ON public.framework_overlays;
CREATE TRIGGER trg_framework_overlays_touch
  BEFORE UPDATE ON public.framework_overlays
  FOR EACH ROW EXECUTE FUNCTION public.touch_corpus_updated_at();

ALTER TABLE public.framework_overlays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_framework_overlays ON public.framework_overlays;
CREATE POLICY service_role_all_framework_overlays
  ON public.framework_overlays FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS auth_read_framework_overlays ON public.framework_overlays;
CREATE POLICY auth_read_framework_overlays
  ON public.framework_overlays FOR SELECT TO authenticated
  USING (client_id IS NULL OR can_read_tenant_by_id(client_id));

DROP POLICY IF EXISTS auth_write_framework_overlays ON public.framework_overlays;
CREATE POLICY auth_write_framework_overlays
  ON public.framework_overlays FOR ALL TO authenticated
  USING (
    public.is_corpus_reviewer()
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  )
  WITH CHECK (
    public.is_corpus_reviewer()
    AND (client_id IS NULL OR can_write_tenant_by_id(client_id))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.framework_overlays TO service_role;
GRANT SELECT ON public.framework_overlays TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.framework_overlays TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
