# AZLAB29 - L5 Reset-And-Replay Gate

Date: 2026-05-15  
Scope: L5 data integrity for Azure parallel-run readiness  
Posture: CI workflow against disposable synthetic Postgres; no customer data

## Executive Read

AZLAB29 adds the first rebuild-from-zero data integrity gate. The workflow provisions a fresh Postgres 16 service in GitHub Actions, applies the Azure/Supabase compatibility shims, replays every repo migration, and verifies the resulting schema baseline.

This is not the live Azure restore drill. It is the lower-level proof that the codebase can reconstruct its database contract from source control without depending on a manually prepared database.

## Artifact

Workflow:

```text
.github/workflows/azure-l5-reset-replay.yml
```

Local-compatible scripts:

```text
src/scripts/postgres-client-options.ts
src/scripts/bootstrap-azure-postgres-compat.ts
src/scripts/run-migrations.ts
src/scripts/verify-azure-postgres-schema.ts
```

## What Changed

The migration/bootstrap/verify scripts now share a Postgres client option helper:

- Azure and Supabase-style URLs keep SSL enabled with `rejectUnauthorized=false`.
- Local CI URLs with `sslmode=disable`, `localhost`, `127.0.0.1`, or `::1` use `ssl=false`.

That keeps the Azure path intact while allowing a disposable Postgres container to exercise the migration stack.

## Workflow Steps

| Step | Purpose |
|---|---|
| Start Postgres 16 service | Fresh empty database named `abarva_l5`. |
| `npm run db:azure:bootstrap` | Adds Supabase compatibility schemas/functions/roles/storage tables required by migrations. |
| `npm run db:migrate -- --ci --allow-destructive` | Replays all migrations from zero. `--allow-destructive` is safe here because the DB is disposable. |
| `npm run db:azure:verify` | Counts migrations, public tables, storage buckets, and key product tables. |

## Trigger Model

The workflow runs on:

- manual dispatch;
- Sunday scheduled replay;
- pull requests that touch migrations, migration scripts, the workflow, or package lockfiles.

## Boundaries

This closes the first L5 gate only. Remaining L5 proof points:

| Remaining item | Why |
|---|---|
| Canonical seed/data-copy replay | Proves the synthetic context layer can be rebuilt, not just the schema. |
| Expected row-count assertions | Turns a successful run into a deterministic tenant-content contract. |
| Azure PITR restore drill | Proves the managed Azure database can restore and serve the app after failure. |

