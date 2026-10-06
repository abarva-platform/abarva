-- Restore the Source stage guidebook repository table after legacy public-object
-- cleanup removed it while product code and migration readback still depend on it.
-- The migration is additive and idempotent: it recreates the table shape, RLS,
-- grants, and the published global defaults required by the repository verifier.

CREATE TABLE IF NOT EXISTS source_stage_guidebooks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key         TEXT NOT NULL,
  client_key        TEXT,
  title             TEXT NOT NULL,
  purpose           TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  status            TEXT NOT NULL DEFAULT 'draft',
  sections          JSONB NOT NULL DEFAULT '[]'::jsonb,
  version           INTEGER NOT NULL DEFAULT 1,
  created_by        TEXT,
  updated_by        TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT source_stage_guidebooks_status_chk
    CHECK (status IN ('draft', 'published'))
);

ALTER TABLE source_stage_guidebooks
  ADD COLUMN IF NOT EXISTS client_key TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'source_stage_guidebooks_status_chk'
      AND conrelid = 'source_stage_guidebooks'::regclass
  ) THEN
    ALTER TABLE source_stage_guidebooks
      ADD CONSTRAINT source_stage_guidebooks_status_chk
      CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS source_stage_guidebooks_stage_idx
  ON source_stage_guidebooks (stage_key, client_key, status);

CREATE UNIQUE INDEX IF NOT EXISTS source_stage_guidebooks_unique_published_global_idx
  ON source_stage_guidebooks (stage_key, status, version)
  WHERE client_key IS NULL;

ALTER TABLE source_stage_guidebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_source_stage_guidebooks"
  ON source_stage_guidebooks;
CREATE POLICY "service_role_all_source_stage_guidebooks"
  ON source_stage_guidebooks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_source_stage_guidebooks"
  ON source_stage_guidebooks;
CREATE POLICY "authenticated_read_source_stage_guidebooks"
  ON source_stage_guidebooks
  FOR SELECT TO authenticated
  USING (client_key IS NULL OR can_read_tenant_by_key(client_key));

GRANT SELECT ON source_stage_guidebooks TO authenticated;
GRANT ALL ON source_stage_guidebooks TO service_role;

WITH defaults AS (
  SELECT
    'strategy'::text AS stage_key,
    'Strategy Gate Review'::text AS title,
    'Confirm the mandate, decision owner, scope boundary, value target, and approval route before the sourcing event advances.'::text AS purpose,
    20::integer AS duration_minutes,
    jsonb_build_array(
      jsonb_build_object(
        'type', 'purpose',
        'title', 'What this session is for',
        'body', 'Confirm whether the event should proceed, what decision is being made, what is explicitly in and out, and which human owner is accountable for the next stage.',
        'timeBoxMinutes', null
      ),
      jsonb_build_object(
        'type', 'agenda',
        'title', 'Gate agenda',
        'body', '1. Read back the trigger. 2. Confirm the decision owner. 3. Confirm scope boundaries. 4. Test the value target basis. 5. Record approve, send back, or hold.',
        'timeBoxMinutes', 20
      ),
      jsonb_build_object(
        'type', 'decision_capture',
        'title', 'Decision to record',
        'body', 'Record one clear outcome: approved, sent back with named gaps, or held with a named dependency and revisit date.',
        'timeBoxMinutes', null
      )
    ) AS sections
  UNION ALL
  SELECT
    'rfp',
    'RFP Readiness Review',
    'Confirm scope lock, evidence coverage, response-control rules, and evaluation weights before the RFP becomes vendor-facing.',
    35,
    jsonb_build_array(
      jsonb_build_object(
        'type', 'purpose',
        'title', 'What this session is for',
        'body', 'Catch scope drift, open evidence gaps, and soft evaluation rules before vendors receive the package.',
        'timeBoxMinutes', null
      ),
      jsonb_build_object(
        'type', 'agenda',
        'title', 'Readiness agenda',
        'body', '1. Confirm scope lock. 2. Walk required exhibits. 3. Confirm response controls. 4. Confirm weights and disqualification rules. 5. Decide ready, held, or sent back.',
        'timeBoxMinutes', 35
      ),
      jsonb_build_object(
        'type', 'decision_capture',
        'title', 'Decision to record',
        'body', 'Record ready to issue, held for named gap closure, or sent back to scope. Do not issue with unnamed open items.',
        'timeBoxMinutes', null
      )
    )
)
INSERT INTO source_stage_guidebooks (
  stage_key,
  client_key,
  title,
  purpose,
  duration_minutes,
  status,
  sections,
  version,
  published_at
)
SELECT
  defaults.stage_key,
  NULL,
  defaults.title,
  defaults.purpose,
  defaults.duration_minutes,
  'published',
  defaults.sections,
  1,
  now()
FROM defaults
WHERE NOT EXISTS (
  SELECT 1
  FROM source_stage_guidebooks existing
  WHERE existing.stage_key = defaults.stage_key
    AND existing.client_key IS NULL
    AND existing.status = 'published'
    AND existing.version = 1
);

COMMENT ON TABLE source_stage_guidebooks IS
  'Facilitator guide content for Source stage-transition sessions. Global defaults use client_key NULL; tenant overrides are client_key-scoped.';

NOTIFY pgrst, 'reload schema';
