# Applying Postgres Migrations For Azure Runtime

Production runtime is Azure Container Apps with Azure/Postgres as the data
plane. Migrations are not applied by a Vercel build hook. Operators and agents
must run migrations through the governed Azure deployment lane, using the same
direct Postgres runner that local and CI checks use.

This document covers:

- [Canonical runtime](#canonical-runtime)
- [How to run migrations](#how-to-run-migrations)
- [Required environment](#required-environment)
- [Destructive-migration safety guard](#destructive-migration-safety-guard)
- [Rollout order](#rollout-order)
- [Rollback](#rollback)

## Canonical runtime

- Runtime host: Azure Container Apps.
- Public production URL: `https://app.abarva.ai`.
- Database: Azure/Postgres through `DATABASE_URL`.
- Secrets: Azure Key Vault projection or an approved operator environment.
- Legacy Vercel config/build hooks are intentionally not the production deploy
  path.

## How to run migrations

### Dry-run

```sh
npm run db:migrate:dry
```

Use this before a migration PR is merged. It verifies what would apply without
mutating the target database.

### Apply

```sh
npm run db:migrate -- --ci
```

Run this from the approved Azure operator context or release environment with
the production Azure/Postgres `DATABASE_URL` configured. The command uses direct
Postgres through `pg`; it must not use Supabase JS clients, Supabase poolers, or
Vercel build-time environment.

## Required environment

- `DATABASE_URL`: Azure/Postgres connection string for the target data plane.
- `NODE_ENV`: as required by the invoking environment.

Do not set or depend on:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_ENV`
- `VERCEL_GIT_COMMIT_SHA`

Those names may still appear in historical evidence, but they are not part of
the current production migration contract.

## Destructive-migration safety guard

`src/scripts/run-migrations.ts` scans pending migrations for destructive SQL
patterns such as `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE ... DROP`,
`DROP SCHEMA`, and `TRUNCATE`. Destructive migrations require an explicit
`-- migration:destructive-allowed` marker and a release record explaining the
data impact, backup posture, and rollback constraints.

## Rollout order

For runtime changes that depend on a migration:

1. Merge the migration/code PR after CI and release-control checks pass.
2. Build the Azure Container Apps image from the merged commit.
3. Run `npm run db:migrate -- --ci` against Azure/Postgres from the approved
   operator context.
4. Deploy or refresh the Azure Container App revision.
5. Run route smoke, signed-in QA, and any module-specific retrieval/answer QA.
6. Record evidence in the release record or build evidence directory.

## Rollback

Code rollback is a new Azure Container Apps revision pinned to the previous
known-good image. Schema rollback depends on the migration:

- Additive migrations usually do not need immediate schema rollback.
- Destructive or data-shaping migrations must have a release-specific rollback
  plan and backup/restore evidence before apply.

Never describe a migration as production-safe only because a build succeeded.
The proof must include the target database, migration command result, and
post-deploy smoke or QA evidence.
