# 2026-06-01-wave0-atlas-db-pressure — Atlas DB Pressure Hardening

## Release ID

`2026-06-01-wave0-atlas-db-pressure`

## Status

`candidate`

## Plain-English Summary

Live Wave 0 retesting showed Tower Atlas falling back because the chat API hit Azure Postgres connection saturation. This change standardizes runtime Postgres pools on the same serverless-safe one-connection config and stops active-client lookup from misreporting infrastructure pressure as a tenant-auth failure.

## Layer Impact

- `global-control-lane`: shared runtime database access hardening used by Tower, reasoning telemetry, template, dependency, workshop, tenant-data, and compatibility adapters.
- `internal-admin`: improves operator diagnosis when active-client lookup fails due to DB pressure instead of a real missing-client condition.

## Client Applicability

- All clients: lower runtime DB connection pressure for shared app surfaces.
- Specific clients: none.
- Internal only: diagnostic classification for tenant lookup failures.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added a shared `runtimePostgresPoolConfig` helper for one-connection runtime pools with short idle teardown.
- Updated runtime Postgres pool callers that still used larger or default pools to use the shared config.
- Updated active-client and tenant resolution so transient DB capacity failures rethrow instead of becoming `no_client`.
- Added unit coverage for the shared pool config.

## QA / Validation

- `passed`: `npm test -- --runTestsByPath src/lib/__tests__/supabase-server.test.ts --runInBand --no-cache` (5 tests).
- `passed`: focused `npx eslint` on changed runtime DB files returned 0 errors; existing unused-disable warnings remain in reasoning backend files.
- `passed`: `npx tsc --noEmit --pretty false`.
- `passed`: `npm run release:check -- --base origin/main --head HEAD`.
- `not run`: authenticated SkyHarbor Tower Atlas prompt retest for P1 and P3 on `https://app.abarva.ai` after production deployment.

## Rollout Plan

Merge to `main`; Vercel production deployment makes the pool config active. No migration or manual data change is required.

## Rollback Plan

Revert the PR. The app returns to the previous per-module pool settings and previous active-client error classification.

## Audit Evidence

- PR URL: pending.
- Production deployment URL: pending.
- Browser retest output: pending.

## Known Gaps

This reduces new runtime connection pressure but cannot by itself kill already-open idle database sessions from previous deployments.
