-- Workspace Explorer lineage seam.
--
-- Additive only: these arrays are populated by future generate paths from
-- evidence actually assembled at generation time. This migration intentionally
-- does not backfill or infer historical edges; UI must keep showing
-- "lineage not yet recorded" for pre-existing rows.

BEGIN;

ALTER TABLE public.source_artifacts
  ADD COLUMN IF NOT EXISTS cited_source_artifact_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

COMMENT ON COLUMN public.source_artifacts.cited_source_artifact_ids IS
  'Workspace Explorer lineage: source_artifacts ids actually cited by this generated Source artifact. No historical backfill.';

CREATE INDEX IF NOT EXISTS idx_source_artifacts_cited_source_artifact_ids
  ON public.source_artifacts USING gin (cited_source_artifact_ids);

ALTER TABLE public.generated_artifacts
  ADD COLUMN IF NOT EXISTS cited_input_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

COMMENT ON COLUMN public.generated_artifacts.cited_input_ids IS
  'Workspace Explorer lineage: governed input ids actually assembled/cited by the artifact generator. No historical backfill.';

CREATE INDEX IF NOT EXISTS generated_artifacts_cited_input_ids_idx
  ON public.generated_artifacts USING gin (cited_input_ids);

ALTER TABLE public.deliverables_v2
  ADD COLUMN IF NOT EXISTS cited_input_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

COMMENT ON COLUMN public.deliverables_v2.cited_input_ids IS
  'Workspace Explorer lineage: governed input ids actually assembled/cited by the deliverable generator. No historical backfill.';

CREATE INDEX IF NOT EXISTS idx_deliverables_v2_cited_input_ids
  ON public.deliverables_v2 USING gin (cited_input_ids);

COMMIT;
