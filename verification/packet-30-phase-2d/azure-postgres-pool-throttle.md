# Azure Postgres Pool Throttle Verification

Date: 2026-05-29

## Trigger

Production post-deploy crawl logs on `/strategic-moves` showed:

`(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`

## Finding

The runtime had two shared database helpers that could reserve too many sessions
per serverless instance:

- `src/lib/data-plane/read-adapters/azureSession.ts` opened a new `pg.Client`
  for each session call.
- `src/lib/data-plane/postgresCompat.ts` used a `pg.Pool` with `max: 10`.

Under Vercel route/crawl concurrency, those defaults are unsafe for an Azure
session-mode pool capped at 15.

## Change

- Azure read/write sessions now reuse a shared `pg.Pool`.
- Both helper families default to `1` pooled connection.
- `ABARVA_PG_POOL_MAX` / `PGPOOL_MAX` can raise the cap, but only to `5`.
- Fallback ordering remains unchanged.

## Validation

- PASS: focused Jest for Azure session and Supabase/Postgres compatibility
  fallback behavior.
- PASS: focused ESLint over changed files.
- PASS: full TypeScript check.

## Rollback

Revert the PR. No schema or data rollback required.
