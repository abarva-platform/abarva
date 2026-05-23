BEGIN;

DO $$
BEGIN
  CREATE TYPE move_dependency_node_kind AS ENUM ('move_instance', 'source_workflow_instance');
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.move_dependencies
  ADD COLUMN IF NOT EXISTS from_instance_id UUID,
  ADD COLUMN IF NOT EXISTS to_instance_id UUID,
  ADD COLUMN IF NOT EXISTS from_node_kind move_dependency_node_kind NOT NULL DEFAULT 'move_instance',
  ADD COLUMN IF NOT EXISTS to_node_kind move_dependency_node_kind NOT NULL DEFAULT 'move_instance',
  ADD COLUMN IF NOT EXISTS estimated_impact_usd NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS accepted_by TEXT,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_by TEXT,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

UPDATE public.move_dependencies md
SET from_instance_id = mi.instance_id,
    from_node_kind = CASE WHEN mt.kind = 'SourceWorkflow' THEN 'source_workflow_instance'::move_dependency_node_kind ELSE 'move_instance'::move_dependency_node_kind END
FROM public.move_instances mi
JOIN public.move_templates mt ON mt.id = mi.template_id
WHERE md.from_instance_id IS NULL
  AND md.from_move_id = mi.engagement_id
  AND md.client_id = mi.client_id;

UPDATE public.move_dependencies md
SET to_instance_id = mi.instance_id,
    to_node_kind = CASE WHEN mt.kind = 'SourceWorkflow' THEN 'source_workflow_instance'::move_dependency_node_kind ELSE 'move_instance'::move_dependency_node_kind END
FROM public.move_instances mi
JOIN public.move_templates mt ON mt.id = mi.template_id
WHERE md.to_instance_id IS NULL
  AND md.to_move_id = mi.engagement_id
  AND md.client_id = mi.client_id;

ALTER TABLE public.move_dependencies
  ALTER COLUMN from_move_id DROP NOT NULL,
  ALTER COLUMN to_move_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'move_dependencies_from_instance_fk'
      AND conrelid = 'public.move_dependencies'::regclass
  ) THEN
    ALTER TABLE public.move_dependencies
      ADD CONSTRAINT move_dependencies_from_instance_fk
      FOREIGN KEY (from_instance_id, client_id)
      REFERENCES public.move_instances(instance_id, client_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'move_dependencies_to_instance_fk'
      AND conrelid = 'public.move_dependencies'::regclass
  ) THEN
    ALTER TABLE public.move_dependencies
      ADD CONSTRAINT move_dependencies_to_instance_fk
      FOREIGN KEY (to_instance_id, client_id)
      REFERENCES public.move_instances(instance_id, client_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'move_dependencies_instance_not_self'
      AND conrelid = 'public.move_dependencies'::regclass
  ) THEN
    ALTER TABLE public.move_dependencies
      ADD CONSTRAINT move_dependencies_instance_not_self
      CHECK (from_instance_id IS NULL OR to_instance_id IS NULL OR from_instance_id <> to_instance_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'move_dependencies_instance_pair_required'
      AND conrelid = 'public.move_dependencies'::regclass
  ) THEN
    ALTER TABLE public.move_dependencies
      ADD CONSTRAINT move_dependencies_instance_pair_required
      CHECK (
        (from_instance_id IS NOT NULL AND to_instance_id IS NOT NULL)
        OR (from_move_id IS NOT NULL AND to_move_id IS NOT NULL)
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_move_dependencies_unique_live_instance_edge
  ON public.move_dependencies(client_id, from_instance_id, to_instance_id, relation_type)
  WHERE deleted_at IS NULL
    AND from_instance_id IS NOT NULL
    AND to_instance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_move_dependencies_client_from_instance
  ON public.move_dependencies(client_id, from_instance_id, relation_type)
  WHERE deleted_at IS NULL
    AND from_instance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_move_dependencies_client_to_instance
  ON public.move_dependencies(client_id, to_instance_id, relation_type)
  WHERE deleted_at IS NULL
    AND to_instance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_move_dependencies_client_relation
  ON public.move_dependencies(client_id, relation_type, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_move_dependencies_client_node_kinds
  ON public.move_dependencies(client_id, from_node_kind, to_node_kind)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_move_dependencies_metadata
  ON public.move_dependencies USING gin(metadata_jsonb)
  WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.move_dependencies TO authenticated;

COMMIT;
