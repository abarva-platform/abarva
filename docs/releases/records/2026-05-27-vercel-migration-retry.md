# 2026-05-27-vercel-migration-retry — Vercel Migration Retry Guard

## Release ID

`2026-05-27-vercel-migration-retry`

## Status

`candidate`

## Plain-English Summary

Adds a retry loop around production Postgres migrations during Vercel builds. This protects production deploys from transient pool exhaustion when multiple Vercel projects start production builds at the same time and the database reports `EMAXCONNSESSION`.

## Layer Impact

- `ops-release-lane`: production builds still run migrations before `next build`, but migration execution now retries up to five times with short backoff before failing.
- `app-control-lane`: no route, UI, or request-time behavior change.

## Client Applicability

- All clients: safer production deployment path.
- Specific clients: none.
- Internal only: Vercel build pipeline.
- Public/demo only: none.
- Feature flag: optional `DB_MIGRATE_MAX_ATTEMPTS` can tune retry count.

## Changes Included

- Script: `scripts/vercel-build.sh`

## QA / Validation

- Reviewed failed Vercel production logs showing `EMAXCONNSESSION max clients reached in session mode`.
- Added bounded retry behavior around `npm run db:migrate -- --ci`.

## Rollout Plan

Merge to main and allow Vercel production deployments to run again. If the pool exhaustion is transient, the retry loop should absorb it. If the pool remains saturated after all retry attempts, the deploy still fails safely.

## Rollback Plan

Revert this release record and the `scripts/vercel-build.sh` retry block to return to single-attempt migration behavior.

## Audit Evidence

- Failed Vercel deployments inspected:
  - `https://nexus-fkmaeifrn-anandsundaram-hashs-projects.vercel.app`
  - `https://abarva-1bgdblreo-anandsundaram-hashs-projects.vercel.app`

## Known Gaps

- This does not increase database pool size or terminate stuck sessions. It only makes deploys resilient to transient contention.
