-- Foundation V3 Phase A candidate identity repair.
-- Additive only: exposes source row identity as indexed working-layer columns
-- so conservation gates can measure natural-key collapse before promotion.

BEGIN;

ALTER TABLE working.entity_candidate
  ADD COLUMN IF NOT EXISTS source_row_ref TEXT,
  ADD COLUMN IF NOT EXISTS source_object_ref TEXT,
  ADD COLUMN IF NOT EXISTS original_row_id TEXT;

UPDATE working.entity_candidate
SET
  natural_key = coalesce(
    nullif(natural_key, ''),
    nullif(candidate_payload->>'natural_key', ''),
    CASE
      WHEN nullif(candidate_payload->>'source_native_id', '') IS NOT NULL
        THEN entity_type || ':' || regexp_replace(lower(candidate_payload->>'source_native_id'), '[^a-z0-9]+', '-', 'g')
      ELSE NULL
    END
  ),
  source_row_ref = coalesce(nullif(source_row_ref, ''), nullif(candidate_payload->>'source_row_ref', '')),
  source_object_ref = coalesce(nullif(source_object_ref, ''), nullif(candidate_payload->>'source_object_ref', ''), nullif(candidate_payload->>'source_native_id', '')),
  original_row_id = coalesce(
    nullif(original_row_id, ''),
    nullif(candidate_payload->>'original_row_id', ''),
    nullif(candidate_payload #>> '{raw_row,original_row_id}', ''),
    nullif(candidate_payload #>> '{raw_row,source_record_id}', ''),
    nullif(candidate_payload->>'source_native_id', '')
  ),
  natural_key_basis = case
    when natural_key_basis <> '{}'::jsonb then natural_key_basis
    else jsonb_build_object(
      'basis', 'phase_a_backfill',
      'source_row_ref', coalesce(nullif(candidate_payload->>'source_row_ref', ''), source_row_ref),
      'source_object_ref', coalesce(nullif(candidate_payload->>'source_object_ref', ''), nullif(candidate_payload->>'source_native_id', ''), source_object_ref),
      'original_row_id', coalesce(nullif(candidate_payload->>'original_row_id', ''), nullif(candidate_payload #>> '{raw_row,original_row_id}', ''), nullif(candidate_payload #>> '{raw_row,source_record_id}', ''), original_row_id)
    )
  end
WHERE natural_key IS NULL
   OR source_row_ref IS NULL
   OR source_object_ref IS NULL
   OR original_row_id IS NULL
   OR natural_key_basis = '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'entity_candidate_natural_key_nonempty_chk'
      AND conrelid = 'working.entity_candidate'::regclass
  ) THEN
    ALTER TABLE working.entity_candidate
      ADD CONSTRAINT entity_candidate_natural_key_nonempty_chk
      CHECK (natural_key IS NULL OR nullif(trim(natural_key), '') IS NOT NULL) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'entity_candidate_source_row_ref_nonempty_chk'
      AND conrelid = 'working.entity_candidate'::regclass
  ) THEN
    ALTER TABLE working.entity_candidate
      ADD CONSTRAINT entity_candidate_source_row_ref_nonempty_chk
      CHECK (source_row_ref IS NULL OR nullif(trim(source_row_ref), '') IS NOT NULL) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'entity_candidate_original_row_id_nonempty_chk'
      AND conrelid = 'working.entity_candidate'::regclass
  ) THEN
    ALTER TABLE working.entity_candidate
      ADD CONSTRAINT entity_candidate_original_row_id_nonempty_chk
      CHECK (original_row_id IS NULL OR nullif(trim(original_row_id), '') IS NOT NULL) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS entity_candidate_source_row_ref_idx
  ON working.entity_candidate (tenant_key, source_version_ref, source_row_ref)
  WHERE source_row_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS entity_candidate_original_row_id_idx
  ON working.entity_candidate (tenant_key, entity_type, original_row_id)
  WHERE original_row_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS entity_candidate_distinct_key_audit_idx
  ON working.entity_candidate (tenant_key, entity_type, natural_key, source_row_ref)
  WHERE natural_key IS NOT NULL;

COMMIT;
