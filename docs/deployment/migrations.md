# Auto-applying Supabase migrations on Vercel deploys

This repo wires `supabase/migrations/*.sql` into the Vercel build so that
**every production deploy applies any pending migrations before serving
traffic**. The manual "paste the SQL into the Supabase dashboard" step is
gone for non-destructive migrations.

This document covers:

- [How it works](#how-it-works)
- [Local testing before pushing](#local-testing-before-pushing)
- [The destructive-migration safety guard](#the-destructive-migration-safety-guard)
- [Required env vars on Vercel](#required-env-vars-on-vercel)
- [What does NOT auto-apply](#what-does-not-auto-apply)
- [Emergency rollback](#emergency-rollback)
- [Mental model — when to manually run vs. let Vercel handle it](#mental-model)

---

## How it works

Three pieces:

1. **`vercel.ts`** at the repo root sets the Vercel `buildCommand` to
   `bash scripts/vercel-build.sh`. The indirection is required because
   Vercel's `buildCommand` (a) must be a literal string in the exported
   config and (b) is capped at 256 characters — too short for an inlined
   `case` statement.

2. **`scripts/vercel-build.sh`** runs at deploy time on Vercel
   infrastructure. It branches on `$VERCEL_ENV`:

   - `production` → `npm run db:migrate -- --ci`, then `npm run build`.
     A migration failure (`set -e`) propagates non-zero and aborts the
     deploy.
   - any other value → log a skip line, then `npm run build`.

3. **`src/scripts/run-migrations.ts`** is the existing one-command runner.
   It:
   - Reads every `.sql` file in `supabase/migrations/`
   - Skips files already recorded in the `schema_migrations` tracking table
   - Scans pending files for [destructive patterns](#the-destructive-migration-safety-guard) and aborts if any are found without an opt-in marker
   - Applies remaining files in lexicographic order (timestamp-prefixed names sort correctly)
   - Each migration runs in its own transaction; a failure rolls back and exits non-zero

Because the migration runner is gated by `&&`, any failure (missing
`DATABASE_URL`, SQL syntax error, destructive-pattern detection) aborts
the deploy before `next build` runs. Old code keeps serving traffic; no
half-applied schema can desync from a half-deployed app.

### Behaviour matrix

| `VERCEL_ENV` | Pre-build action | Build runs |
|---|---|---|
| `production` | `npm run db:migrate -- --ci` | yes (only if migrations succeed) |
| `preview` | log skip line | yes |
| `development` | log skip line | yes |
| unset (local `npm run build`) | n/a — `vercel.ts` only applies on Vercel | yes |

---

## Local testing before pushing

Before opening a PR with a new migration, validate it locally against the
prod schema. Two flows:

### Dry-run (recommended for every new migration)

```sh
npm run db:migrate:dry
```

Prints the list of pending migrations without applying them. Catches
"is this actually new?" and "does the runner see it?" issues before push.

Requires `DATABASE_URL` in `.env.local` pointing at the target database
(typically a personal Supabase branch or local Postgres — never prod).

### Apply locally

```sh
npm run db:migrate
```

Same logic the deploy runs, against your local `DATABASE_URL`. If this
succeeds locally and the migration is idempotent (per
[`CONTRIBUTING-MIGRATIONS.md`](../../CONTRIBUTING-MIGRATIONS.md)), the prod
deploy will succeed too.

### What `--ci` adds

The CI flag is the same code path as a normal apply, with one difference:
on success it emits a final structured summary line:

```
✓ Applied 3 pending migrations: 20260508040000_foo.sql, 20260508050000_bar.sql, 20260508060000_baz.sql
```

This makes Vercel build logs greppable for deploy auditing.

---

## The destructive-migration safety guard

Auto-apply means a single careless `DROP TABLE` ships to production
silently. The guard prevents that.

### Patterns that block the deploy

The runner scans every pending migration for these patterns (case-insensitive):

- `DROP TABLE`
- `DROP COLUMN`
- `DROP SCHEMA`
- `ALTER TABLE … DROP` (column, constraint, default, anything)
- `TRUNCATE`

If any pattern matches a non-comment line in any pending migration, the
runner exits non-zero with a clear error:

```
✗  Destructive migration patterns detected (auto-apply blocked).

   20260520010000_drop_legacy.sql:14 — DROP TABLE
     DROP TABLE legacy_foo;

   Auto-apply on Vercel prod deploys refuses to run destructive
   migrations to prevent accidental data loss.
```

### Patterns that do NOT block

Routine idempotency scaffolding is exempt:

- `DROP POLICY IF EXISTS` (per `CONTRIBUTING-MIGRATIONS.md` rule 2)
- `DROP TRIGGER IF EXISTS` (rule 2)
- `DROP INDEX IF EXISTS`
- `DROP FUNCTION IF EXISTS`
- `DROP CONSTRAINT IF EXISTS` (only as standalone — `ALTER TABLE … DROP CONSTRAINT` still flags)

### Opting in for an audited destructive migration

If the destructive change is intentional and reviewed, add the opt-in
marker as a comment anywhere in the file (convention: top of the file):

```sql
-- migration:destructive-allowed
-- Reviewed by @anand 2026-05-08 · drops the unused legacy_foo table
-- left over from the pre-2025 schema.
DROP TABLE IF EXISTS legacy_foo;
```

The marker is a deliberate human-audit signal. It should only be added
after:

1. A code reviewer has confirmed the destructive change is correct.
2. The data being dropped is either gone, archived, or confirmed
   unreferenced.
3. (For high-risk drops) A dump or snapshot is taken first.

The destructive guard intentionally has zero override flags. The marker
comment is the only path through.

---

## Required env vars on Vercel

These must be set in **production scope** on the Vercel project for
auto-apply to work:

| Env var | Used by | Likely already set? |
|---|---|---|
| `DATABASE_URL` | `run-migrations.ts` (Postgres connection) | yes — required for runtime DB access |
| `NEXT_PUBLIC_SUPABASE_URL` | runtime | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | runtime | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime | yes |

The runner connects via `DATABASE_URL` only (it uses `pg`, not the
Supabase JS client). If `DATABASE_URL` is missing the deploy fails with:

```
✗  DATABASE_URL required in .env.local
```

If you see that on a Vercel deploy, set `DATABASE_URL` in the project's
production environment and redeploy.

> **Tip:** For migrations specifically, prefer the Supabase **Session-mode
> pooler** URL (port 5432). The transaction-mode pooler (port 6543) is for
> short-lived runtime queries and won't reliably support multi-statement
> migrations.

---

## What does NOT auto-apply

Auto-apply is intentionally narrow. The following still require a human:

1. **Destructive migrations** — see [the safety guard](#the-destructive-migration-safety-guard).
2. **Preview deploys** — preview branches never write to prod DB. If a
   preview branch needs schema changes, use Supabase Branching to spin up
   a dedicated branch DB.
3. **Migrations that depend on data** — if a migration assumes specific
   data is present (rare; should be in seeds, not migrations), still
   apply it manually so you can verify the data state.
4. **Migrations that grant new RLS / role permissions** — these should
   still be reviewed. The guard doesn't catch them, but they're often
   security-relevant.
5. **`db:seed` runs** — seeds are a separate manual step and always have
   been. Auto-apply only runs `db:migrate`.

---

## Emergency rollback

### Scenario 1 — The migration ran but the app needs to roll back

A migration applied cleanly, but the new code that depends on it has a
bug. You want to revert to the previous Vercel deployment.

The migration is **already applied** to prod. Rolling back the Vercel
deploy alone is fine — the new column / table just sits there unused
until the next forward fix. Roll back with:

```sh
vercel rollback                   # or vercel rollback <deployment-url>
```

Don't try to "un-apply" the migration unless you're certain the new
column / table is actively breaking the rolled-back code (rare, since
old code doesn't reference new columns).

### Scenario 2 — The migration failed mid-deploy

The migration runner exited non-zero. The deploy aborted before
`next build`. Production is still serving the previous version.

1. Check Vercel build logs for the SQL error.
2. Fix the migration in a new commit (do NOT amend the failed one — the
   transaction rolled back, so re-running is safe).
3. Push. The next deploy retries from where it left off (the failed
   migration is still pending; subsequent ones are still pending).

### Scenario 3 — A migration ran in part and corrupted state

This is extremely rare because each migration runs in a transaction.
If it does happen (e.g. a `CREATE TABLE` that committed before a later
statement failed in a multi-statement file with explicit `COMMIT`s):

1. Manually fix the schema via the Supabase dashboard.
2. Mark the migration as applied without re-running:

   ```sh
   npm run db:migrate:mark-applied
   ```

   This inserts every current migration into `schema_migrations` with
   `ON CONFLICT DO NOTHING`. Use it sparingly — it bypasses the runner
   entirely.

---

## Mental model

| Situation | Auto-apply? | Notes |
|---|---|---|
| New non-destructive migration (CREATE TABLE IF NOT EXISTS, ADD COLUMN, etc.) | yes | This is the happy path the system is designed for. |
| Renaming a column | yes (with care) | `RENAME COLUMN` doesn't trigger the destructive guard, but app code referencing the old name will 500. Stage as: add new column → backfill → switch reads → switch writes → drop old column (the drop carries the marker). |
| Dropping a column / table | manual marker required | Add `-- migration:destructive-allowed` after audit. |
| Adding RLS policies | yes | Apply normally. Verify policy correctness in PR review. |
| Seeding data | n/a | Use `db:seed`, not migrations. |
| Migration on a preview branch | n/a | Preview deploys never run migrations. Use Supabase Branching. |
| Local development | manual via `npm run db:migrate` | `vercel.ts` only takes effect on Vercel. |

---

## Related docs

- [`CONTRIBUTING-MIGRATIONS.md`](../../CONTRIBUTING-MIGRATIONS.md) — the four
  rules every migration must follow (idempotency, `IF NOT EXISTS`, etc).
  Auto-apply assumes those rules are obeyed; a non-idempotent migration
  may fail on the second deploy after a transient error.
- `vercel.ts` (repo root) — Vercel programmatic config; sets
  `buildCommand` to `bash scripts/vercel-build.sh`.
- `scripts/vercel-build.sh` — the deploy-time orchestrator that runs
  migrations conditional on `$VERCEL_ENV`, then `next build`.
- `src/scripts/run-migrations.ts` — the migration runner with the CI mode
  and destructive guard.
- `src/scripts/__tests__/run-migrations.test.ts` — tests covering the
  destructive guard and CLI flags.
