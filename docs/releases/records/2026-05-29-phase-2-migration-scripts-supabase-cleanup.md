# 2026-05-29-phase-2-migration-scripts-supabase-cleanup — Phase 2 Migration Scripts Supabase Cleanup

## Release ID

`2026-05-29-phase-2-migration-scripts-supabase-cleanup`

## Status

`ready`

## Plain-English Summary

Codex Master Backlog Section 3.3 is closed as an evidence-and-runbook update. Current `origin/main` already runs Vercel build-time migrations through direct Postgres (`pg`) and skips the migration runner on production deploy commits that do not change `supabase/migrations`. This release removes stale operator guidance that still recommended Supabase session-mode pooler usage for migrations.

## Layer Impact

Deployment lane: no build script code changes. `scripts/vercel-build.sh` remains the production deploy orchestrator and `src/scripts/run-migrations.ts` remains the migration runner.

Data lane: no schema changes, no data writes, and no destructive migration execution.

Documentation lane: `docs/deployment/migrations.md` now matches the direct Postgres migration posture and explicitly rejects Supabase session-mode pooler credentials for Vercel build-time migrations.

## Client Applicability

- All clients: safer production deploy posture because migration scripts avoid Supabase session-mode clients at build time.
- Specific clients: none.
- Internal only: deployment runbook and release evidence.
- Public/demo only: none.
- Feature flag: existing `FORCE_DB_MIGRATE_ON_DEPLOY=1` override remains unchanged.

## Changes Included

- `docs/deployment/migrations.md`
- `docs/releases/records/2026-05-29-phase-2-migration-scripts-supabase-cleanup.md`

## QA / Validation

- PASS: focused code review of `scripts/vercel-build.sh`, `package.json` `db:migrate*` scripts, `src/scripts/run-migrations.ts`, and `src/scripts/postgres-client-options.ts`.
- PASS: `rg -n "(@supabase/supabase-js|createClient|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)" scripts/vercel-build.sh src/scripts/run-migrations.ts src/scripts/postgres-client-options.ts package.json` returns only the package dependency entry, not build/migration script usage.
- PASS: `node scripts/audit/vercel-migration-session-guard.mjs`.
- PASS: `bash -n scripts/vercel-build.sh`.
- PASS: `npx jest src/scripts/__tests__/run-migrations.test.ts src/scripts/__tests__/run-migrations-env.test.ts --runInBand`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.

## Rollout Plan

Merge this documentation-only PR after CI is green. No Vercel environment change, runtime deployment, schema migration, or seed run is required by this PR.

## Rollback Plan

Revert this PR to restore the prior deployment documentation. No database rollback is required because this PR does not execute migrations, change schema, or change runtime/build script behavior.

## Audit Evidence

- `scripts/vercel-build.sh` runs `npm run db:migrate -- --ci` only for production deploy commits with changed files under `supabase/migrations`, unless `FORCE_DB_MIGRATE_ON_DEPLOY=1` is set.
- `package.json` maps `db:migrate`, `db:migrate:dry`, and `db:migrate:mark-applied` to `src/scripts/run-migrations.ts`.
- `src/scripts/run-migrations.ts` imports `Client` from `pg`, resolves `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, then `DATABASE_URL`, and does not import `@supabase/supabase-js`.
- `src/scripts/postgres-client-options.ts` builds direct Postgres client options and does not depend on Supabase client helpers.
- PR #2414 identified the production failure mode: parallel Vercel projects attempted `db:migrate` concurrently and Supabase returned `EMAXCONNSESSION`.

## Known Gaps

This release does not serialize future commits that actually change `supabase/migrations`; it confirms and documents that the migration runner uses direct Postgres rather than Supabase session-mode clients. A separate deployment-policy change would be needed if only one Vercel project should own migration execution for migration-bearing commits.
