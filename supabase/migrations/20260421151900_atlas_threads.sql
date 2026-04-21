-- Tower W3 · atlas_threads
-- Tower conversation containers, separate from Intelligence threads.

BEGIN;

CREATE TABLE IF NOT EXISTS atlas_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  context_scope TEXT NOT NULL DEFAULT 'portfolio'
    CHECK (context_scope IN ('portfolio','signal','use_case','cohort','integration')),
  signal_firing_id UUID REFERENCES signal_firings(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_atlas_threads_client_recent
  ON atlas_threads(client_id, last_message_at DESC NULLS LAST, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atlas_threads_person
  ON atlas_threads(person_id, created_at DESC)
  WHERE person_id IS NOT NULL;

ALTER TABLE atlas_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_atlas_threads" ON atlas_threads;
CREATE POLICY "service_role_all_atlas_threads" ON atlas_threads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
