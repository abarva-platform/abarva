-- Tower CMDB source-file lineage repair.
--
-- The current-state ingest writer records source_file_id when committing
-- structured CMDB evidence, and the Moves schema readback requires that
-- lineage column. Some lab databases have the historical CMDB table without
-- this additive column. Do not rewrite existing rows here.

BEGIN;

ALTER TABLE public.tower_cmdb_cis
  ADD COLUMN IF NOT EXISTS source_file_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tower_cmdb_cis_source_file
  ON public.tower_cmdb_cis(client_id, source_file_id)
  WHERE source_file_id IS NOT NULL;

COMMIT;
