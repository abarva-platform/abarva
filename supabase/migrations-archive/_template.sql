-- Migration NNN · short title
--
-- Why: one-sentence motivation (what product problem this solves, who asked,
-- link to packet/spec if any)
-- Safety: additive-only / re-runnable / landing risk if it fails mid-way
-- Depends on: migrations/tables this assumes exist
--
-- ── Template notes · delete before committing ──────────────────────────
-- Supabase applies migrations in lexical-sort order on both production
-- (merge to main) AND fresh preview branches (PR open). A preview branch
-- replays every migration from the beginning · any non-idempotent step
-- breaks PRs. Four rules, enforced by _template.sql + CONTRIBUTING-MIGRATIONS.md:
--
--   1 · ALWAYS use IF NOT EXISTS on CREATE TABLE / CREATE INDEX
--   2 · ALWAYS DROP POLICY IF EXISTS before CREATE POLICY
--       (and DROP TRIGGER IF EXISTS before CREATE TRIGGER)
--   3 · Guard ADD CONSTRAINT + CREATE TYPE in a DO block that catches
--       duplicate_object AND duplicate_table (UNIQUE constraints create
--       backing indexes — both names can collide independently)
--   4 · Every INSERT must carry ON CONFLICT DO NOTHING/UPDATE or
--       WHERE NOT EXISTS (SELECT 1 FROM ...)
--
-- Preview branches persist state across failed runs · a half-applied
-- migration that left a policy/constraint/index behind will trip the
-- next run if you don't drop-first.
-- ───────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Tables ·  CREATE TABLE IF NOT EXISTS ──────────────────────────────
CREATE TABLE IF NOT EXISTS your_table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defensive column adds · safe no-op if table was created by prior
-- migration with a different (narrower) schema.
ALTER TABLE your_table_name ADD COLUMN IF NOT EXISTS extra_column TEXT;

-- ── Unique constraints · CREATE UNIQUE INDEX IF NOT EXISTS ────────────
-- Prefer CREATE UNIQUE INDEX over ALTER TABLE ADD CONSTRAINT UNIQUE ·
-- index form is natively idempotent. Unique index still works with
-- ON CONFLICT clauses.
CREATE UNIQUE INDEX IF NOT EXISTS your_table_name_name_key
  ON your_table_name(name);

-- ── Other indexes · CREATE INDEX IF NOT EXISTS ────────────────────────
CREATE INDEX IF NOT EXISTS idx_your_table_name_created_at
  ON your_table_name(created_at DESC);

-- ── Non-UNIQUE constraints · DO block with duplicate_object+duplicate_table ──
DO $$ BEGIN
  ALTER TABLE your_table_name
    ADD CONSTRAINT your_table_name_status_check
    CHECK (status IN ('draft', 'active', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;  -- index-backed constraints
  WHEN undefined_column THEN NULL; -- column dropped since last time
END $$;

-- ── Triggers · DROP IF EXISTS before CREATE ───────────────────────────
DROP TRIGGER IF EXISTS your_table_name_set_updated_at ON your_table_name;
CREATE TRIGGER your_table_name_set_updated_at
  BEFORE UPDATE ON your_table_name
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Row-level security · idempotent policy definitions ────────────────
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_your_table_name" ON your_table_name;
CREATE POLICY "service_role_all_your_table_name" ON your_table_name
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_your_table_name" ON your_table_name;
CREATE POLICY "authenticated_read_your_table_name" ON your_table_name
  FOR SELECT TO authenticated USING (true);

-- ── Seeds · ON CONFLICT or NOT EXISTS guard ───────────────────────────
INSERT INTO your_table_name (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'example')
ON CONFLICT (id) DO NOTHING;

-- If the target table has no unique constraint, use WHERE NOT EXISTS:
-- INSERT INTO your_table_name (name)
-- SELECT 'example'
-- WHERE NOT EXISTS (SELECT 1 FROM your_table_name WHERE name = 'example');

-- ── Enums · PostgreSQL can't CREATE TYPE IF NOT EXISTS · wrap in DO block ──
DO $$ BEGIN
  CREATE TYPE your_table_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tell PostgREST to reload schema cache (needed when columns/types change)
NOTIFY pgrst, 'reload schema';

COMMIT;
