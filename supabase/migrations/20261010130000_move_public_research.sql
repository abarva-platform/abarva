-- Migration · Move public-source research: runs + stored outside sources
--
-- Why: Moves deliverable builds will be able to research PUBLIC web sources
-- (program rules, payment rules, published studies) through the audited
-- Anthropic egress path. Every retrieved source must be stored, tenant- and
-- Move-scoped, with its URL, retrieval date and a short verbatim excerpt, and
-- must be approved by a consultant before any deliverable may cite it. This
-- migration adds only the storage contract; nothing writes to it until the
-- research step ships behind `moves_public_source_research`.
--
-- Deliberately NOT program_evidence_items: a public source is not client
-- evidence, never auto-promotes, and must never be numbered or rendered as a
-- fact about the client. Separate tables keep that boundary structural.
-- Rows are tenant-scoped (never corpus_global).
--
-- Safety: additive-only, re-runnable (IF NOT EXISTS / DROP POLICY IF EXISTS /
-- guarded constraints). No backfill, no data change.
-- Depends on: engagements (Move registry).

BEGIN;

-- ── Research runs ──────────────────────────────────────────────────────────
-- One row per research attempt for a Move build, including attempts that
-- produced nothing (timeout, denial, parse failure), so a build can say
-- "no outside sources" honestly instead of silently.
CREATE TABLE IF NOT EXISTS move_public_research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  phase INT NULL,
  brief_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  source_count INT NOT NULL DEFAULT 0,
  audit_id TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  duration_ms INT NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE move_public_research_runs
    ADD CONSTRAINT move_public_research_runs_status_check
    CHECK (status IN ('ok', 'failed', 'timeout', 'skipped', 'denied'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_research_runs
    ADD CONSTRAINT move_public_research_runs_source_count_check
    CHECK (source_count >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_research_runs
    ADD CONSTRAINT move_public_research_runs_phase_check
    CHECK (phase IS NULL OR (phase >= 0 AND phase <= 5));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_research_runs
    ADD CONSTRAINT move_public_research_runs_brief_hash_check
    CHECK (char_length(brief_hash) > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- The cache lookup: "was this brief researched for this Move recently?"
CREATE INDEX IF NOT EXISTS idx_move_public_research_runs_lookup
  ON move_public_research_runs (tenant_key, program_id, brief_hash, created_at DESC);

-- ── Stored public sources ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS move_public_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  program_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES move_public_research_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'public_source',
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NULL,
  published_at DATE NULL,
  retrieved_at TIMESTAMPTZ NOT NULL,
  excerpt TEXT NOT NULL,
  -- The dedupe key's excerpt half. A stored generated column (not an
  -- expression index) so the writer can name it in ON CONFLICT.
  excerpt_md5 TEXT GENERATED ALWAYS AS (md5(excerpt)) STORED,
  claim TEXT NULL,
  confidence TEXT NULL,
  decision TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_user_id TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A row in this table is a public source and nothing else.
DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_kind_check
    CHECK (kind = 'public_source');
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- https only: no http, no file:, no data:, no javascript:.
DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_url_https_check
    CHECK (url ~ '^https://[^[:space:]]+$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- A short verbatim quotation, never a copied page.
DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_excerpt_length_check
    CHECK (char_length(excerpt) >= 1 AND char_length(excerpt) <= 300);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_title_check
    CHECK (char_length(title) >= 1);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_confidence_check
    CHECK (confidence IS NULL OR confidence IN ('high', 'medium', 'low', 'unverified'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_decision_check
    CHECK (decision IN ('pending', 'approved', 'rejected'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- A decided source names who decided and when; a pending one names neither.
DO $$ BEGIN
  ALTER TABLE move_public_sources
    ADD CONSTRAINT move_public_sources_review_stamp_check
    CHECK (
      (decision = 'pending' AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL)
      OR (decision <> 'pending' AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- One stored row per (tenant, Move, URL, excerpt): the same quotation from the
-- same page is never stored twice for a Move, however many runs find it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_move_public_sources_dedupe
  ON move_public_sources (tenant_key, program_id, url, excerpt_md5);

-- The hot path: "approved sources for this Move".
CREATE INDEX IF NOT EXISTS idx_move_public_sources_lookup
  ON move_public_sources (tenant_key, program_id, decision, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_move_public_sources_run
  ON move_public_sources (run_id);

-- ── Row-level security · mirrors program_evidence_items ────────────────────
-- Service role writes (the build worker and the review route run server-side).
-- Authenticated sessions may read their own tenant's rows for Moves they can
-- see. Unlike program_evidence_items there is no authenticated INSERT: these
-- rows are produced by the research step, never typed in by a session.
-- Authenticated UPDATE/DELETE are denied, as on program_evidence_items.
ALTER TABLE move_public_research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_public_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_move_public_research_runs" ON move_public_research_runs;
CREATE POLICY "service_role_all_move_public_research_runs" ON move_public_research_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_move_public_research_runs" ON move_public_research_runs;
CREATE POLICY "authenticated_read_move_public_research_runs" ON move_public_research_runs
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM engagements)
  );

DROP POLICY IF EXISTS "authenticated_insert_move_public_research_runs" ON move_public_research_runs;
DROP POLICY IF EXISTS "authenticated_update_move_public_research_runs" ON move_public_research_runs;
DROP POLICY IF EXISTS "authenticated_delete_move_public_research_runs" ON move_public_research_runs;
CREATE POLICY "authenticated_insert_move_public_research_runs" ON move_public_research_runs
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "authenticated_update_move_public_research_runs" ON move_public_research_runs
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "authenticated_delete_move_public_research_runs" ON move_public_research_runs
  FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "service_role_all_move_public_sources" ON move_public_sources;
CREATE POLICY "service_role_all_move_public_sources" ON move_public_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_move_public_sources" ON move_public_sources;
CREATE POLICY "authenticated_read_move_public_sources" ON move_public_sources
  FOR SELECT TO authenticated
  USING (
    tenant_key = (auth.jwt() ->> 'tenant_key')
    AND program_id IN (SELECT id FROM engagements)
  );

DROP POLICY IF EXISTS "authenticated_insert_move_public_sources" ON move_public_sources;
DROP POLICY IF EXISTS "authenticated_update_move_public_sources" ON move_public_sources;
DROP POLICY IF EXISTS "authenticated_delete_move_public_sources" ON move_public_sources;
CREATE POLICY "authenticated_insert_move_public_sources" ON move_public_sources
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "authenticated_update_move_public_sources" ON move_public_sources
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "authenticated_delete_move_public_sources" ON move_public_sources
  FOR DELETE TO authenticated USING (false);

GRANT SELECT ON move_public_research_runs TO authenticated;
GRANT SELECT ON move_public_sources TO authenticated;

COMMIT;
