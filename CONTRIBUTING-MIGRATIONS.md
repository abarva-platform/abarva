# Contributing migrations

Every migration in `supabase/migrations/` runs twice: once on production when you merge to main, and again from scratch on every PR's preview branch. A migration that works on prod but fails on replay blocks every future PR until it's fixed. This guide is the compounding-interest version — four rules that make every migration re-runnable forever.

## TL;DR — the four rules

1. **`IF NOT EXISTS` everywhere it's legal.** `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`.
2. **`DROP ... IF EXISTS` before every `CREATE POLICY` and `CREATE TRIGGER`.** Policies and triggers don't support `IF NOT EXISTS`, but preview branches hold onto them across failed runs.
3. **Wrap `ADD CONSTRAINT` and `CREATE TYPE` in `DO` blocks** that catch `duplicate_object` AND `duplicate_table` (unique constraints create a backing index — both names can trip independently).
4. **Every `INSERT` carries `ON CONFLICT DO NOTHING` / `DO UPDATE` or `WHERE NOT EXISTS`.** No unconditional seeds.

Copy `supabase/migrations-archive/_template.sql` into your new file and delete what you don't need. It encodes all four rules with working examples.

## Why this matters

Supabase preview branches are persistent. When a run fails halfway through, the policies, triggers, constraints, and rows created before the failure stick around. Re-running replays every migration from the start — including your half-applied one. The second run then trips on "already exists" for anything your migration created before it died.

Prod usually survives because it applied migrations one commit at a time over months, with humans cleaning up after failures. Fresh preview branches are unforgiving — they expose every latent non-idempotent step you've written since 001.

We audited the repo on 2026-04-20 and patched 7 migrations to meet these rules (001, 002, 003, 004, 008, 013, 019, 020, plus 041, 042 from the Programs build). Every new migration after that point has to pass the same bar.

## Rule 1 · `IF NOT EXISTS` everywhere

```sql
-- Tables
CREATE TABLE IF NOT EXISTS your_table (...);

-- Indexes (both regular and unique)
CREATE INDEX IF NOT EXISTS your_index ON your_table(col);
CREATE UNIQUE INDEX IF NOT EXISTS your_unique ON your_table(col);

-- Columns
ALTER TABLE your_table ADD COLUMN IF NOT EXISTS new_col TEXT;
```

### Edge case — `CREATE TABLE` was originally `DROP TABLE; CREATE TABLE`

If you wrote `DROP TABLE IF EXISTS foo; CREATE TABLE foo (...)` to "fix" a schema, that's destructive on re-run (wipes data). Replace with:

```sql
CREATE TABLE IF NOT EXISTS foo (...);
-- Then defensive ADD COLUMN IF NOT EXISTS for any columns your
-- CREATE TABLE declares that might not exist from a prior minimal
-- version of foo.
ALTER TABLE foo ADD COLUMN IF NOT EXISTS new_col TEXT;
```

This is the **013 pattern** — 002 created `engagements` with a minimal schema; 013 assumed a rich schema via `CREATE TABLE IF NOT EXISTS`. The IF NOT EXISTS was a no-op, then indexes referenced columns that never got added. Fix: explicit `ADD COLUMN IF NOT EXISTS` for every column 013 expects that 002 doesn't provide.

## Rule 2 · `DROP POLICY IF EXISTS` before `CREATE POLICY`

Policies and triggers have no `IF NOT EXISTS`. Always drop first:

```sql
DROP POLICY IF EXISTS "policy_name" ON your_table;
CREATE POLICY "policy_name" ON your_table FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS trigger_name ON your_table;
CREATE TRIGGER trigger_name BEFORE UPDATE ON your_table
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

If you're moving a policy from one migration to another (e.g. dropping a service-role-only policy in N and adding a per-user policy in N+1), drop by **both** old and new names up front:

```sql
DROP POLICY IF EXISTS "old_name" ON your_table;  -- legacy · from migration N-1
DROP POLICY IF EXISTS "new_name" ON your_table;  -- current · safety for re-run
CREATE POLICY "new_name" ON your_table ...;
```

## Rule 3 · `DO` block for `ADD CONSTRAINT` and `CREATE TYPE`

Neither supports `IF NOT EXISTS`. Use an `EXCEPTION` handler:

```sql
-- Unique constraint (creates a backing index — catch BOTH errors)
DO $$ BEGIN
  ALTER TABLE your_table
    ADD CONSTRAINT your_table_col_key UNIQUE (col);
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- constraint name taken
  WHEN duplicate_table  THEN NULL;  -- backing index name taken
END $$;

-- Enum type
DO $$ BEGIN
  CREATE TYPE your_enum AS ENUM ('a', 'b', 'c');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

Better yet — **use `CREATE UNIQUE INDEX IF NOT EXISTS`** instead of `ADD CONSTRAINT UNIQUE` where you can. Unique indexes work with `ON CONFLICT` clauses and are natively idempotent.

For CHECK constraints that might need to change over migrations (like `engagements.current_phase` going from 0-4 to 0-5):

```sql
ALTER TABLE engagements DROP CONSTRAINT IF EXISTS engagements_current_phase_check;
DO $$ BEGIN
  ALTER TABLE engagements
    ADD CONSTRAINT engagements_current_phase_check
    CHECK (current_phase IS NULL OR (current_phase >= 0 AND current_phase <= 5));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table  THEN NULL;
END $$;
```

## Rule 4 · Every `INSERT` is guarded

Seeds can't assume the target table is empty. Use `ON CONFLICT` when there's a unique key:

```sql
INSERT INTO your_table (id, name) VALUES ('uuid-1', 'foo')
ON CONFLICT (id) DO NOTHING;

-- Or upsert:
INSERT INTO your_table (id, name) VALUES ('uuid-1', 'foo')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
```

When the table has no unique constraint (yet), use `WHERE NOT EXISTS`:

```sql
INSERT INTO your_table (name)
SELECT 'foo'
WHERE NOT EXISTS (SELECT 1 FROM your_table WHERE name = 'foo');
```

## Common mistakes to avoid

- **`CREATE POLICY "a" ON t FOR SELECT USING (true);`** → will fail on re-run. Fix: `DROP POLICY IF EXISTS "a" ON t;` first.
- **`ALTER TABLE t ADD CONSTRAINT t_col_key UNIQUE (col);`** → fails on re-run. Fix: wrap in `DO $$ BEGIN ... EXCEPTION ...`, or replace with `CREATE UNIQUE INDEX IF NOT EXISTS`.
- **`ALTER TABLE t ADD COLUMN c TEXT;`** → fails on re-run. Fix: `ADD COLUMN IF NOT EXISTS c TEXT`.
- **`DROP TABLE IF EXISTS t; CREATE TABLE t (...);`** → destroys data on re-run. Fix: `CREATE TABLE IF NOT EXISTS` + defensive `ADD COLUMN IF NOT EXISTS`.
- **`INSERT INTO t (name) VALUES ('x');`** → creates duplicates on re-run. Fix: add `ON CONFLICT` or `WHERE NOT EXISTS`.

## Audit any migration before merging

Run the audit script from the project root before opening a PR:

```
node scripts/audit-migrations.mjs
```

It flags files with the 8 risky patterns. False positives exist (multi-line INSERTs can confuse the heuristic) but zero output = zero high-severity risk.

## When `supabase db push` fails with "prepared statement already exists"

Transaction-pooler connections (port 6543, `?pgbouncer=true`) can't safely run Supabase's migration runner — the CLI issues prepared statements that collide across pooled connections:

```
ERROR: prepared statement "xxx" already exists (SQLSTATE 42P05)
```

**Workaround:** use the session pooler (port 5432) via `psql` directly. Session pooler gives each connection its own server backend, so prepared statements don't collide.

```bash
# From .env.local
SESSION_POOLER_URL=postgresql://postgres.<ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres

# Apply pending migrations one by one
for f in supabase/migrations/20260421151*.sql; do
  psql "$SESSION_POOLER_URL" -f "$f"
done
```

**Preview-branch side effect:** if Supabase's auto-migrator hits this bug when creating a preview branch, the control-plane status shows `MIGRATIONS_FAILED` permanently — even after you apply the migrations manually. `supabase branches get <name>` will correctly report `ACTIVE_HEALTHY`, but `supabase branches list` still shows failed. That mismatch is a Supabase dashboard issue, not a DB issue. The database is correct; ignore the stale label or create a fresh preview branch under a different name.

First documented hit: 2026-04-21 · `migration-audit-013-020` preview branch during Tower W3 schema push.

## Testing your migration on a preview branch

Every PR that touches `supabase/migrations/**` triggers a Supabase preview branch deploy. Watch the logs:

1. Open the PR
2. Go to https://supabase.com/dashboard/project/xtbymdryojmvoulaotce/branches
3. Click the preview branch → View Logs
4. Look for `✓` on every migration or a specific error

If a migration fails on preview but works on prod, your migration is non-idempotent. Fix per the four rules above, push, watch the preview re-run. Iterate until green.

## When you legitimately can't be idempotent

A small number of operations genuinely can't be re-run safely (destructive data transformations, one-shot backfills that depend on prior state). For those:

1. Gate the migration with a guard table check:

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM _migration_flags WHERE name = 'nnn_one_shot') THEN
    -- Your destructive operation here
    INSERT INTO _migration_flags (name) VALUES ('nnn_one_shot');
  END IF;
END $$;
```

2. Document the rationale in the migration header.
3. Flag in the PR description so the reviewer knows to scrutinize.

## Tooling

- `supabase/migrations-archive/_template.sql` — copy this as a starting point
- `scripts/audit-migrations.mjs` — pre-PR audit
- `supabase db push --dry-run --linked` — show pending migrations without applying
- `supabase db lint --linked` — static schema lint against the linked project

## History

| Date | Change |
|---|---|
| 2026-04-20 | Four rules established; patched 001-004 + 008 + 013 + 019 + 020 retroactively; `_template.sql` + this guide created after Programs build's PR #12 exposed latent 002→013 drift |
