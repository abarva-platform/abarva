# 2026-05-29-azure-postgres-pool-throttle

## Release ID

`2026-05-29-azure-postgres-pool-throttle`

## Status

`rolled-back`

## Plain-English Summary

This release lowers the number of database connections each serverless runtime
can open against Azure Postgres. Production crawl logs showed
`max clients reached in session mode - pool_size: 15` on `/strategic-moves`;
the shared runtime database helpers now reuse tiny pools instead of allowing a
single warm function instance to reserve many sessions.

## Layer Impact

- App control lane: no product UI changes.
- Data plane: shared Azure Postgres read/write helpers now default to one
  pooled connection per runtime instance.
- Release lane: reduces production crawl/deploy risk caused by database session
  exhaustion.
- Schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. The database helpers are shared by every tenant and route.
- Specific clients: none.
- Internal only: runtime infrastructure.
- Public/demo only: no.
- Feature flag: optional `ABARVA_PG_POOL_MAX` / `PGPOOL_MAX`, capped at `5`.

## Changes Included

- Replaces per-call Azure read sessions with a shared `pg.Pool`.
- Defaults Azure session pools to `1` connection, configurable up to `5`.
- Defaults the Supabase-compat Postgres pool from `10` connections down to `1`,
  configurable up to `5`.
- Keeps fallback behavior from `ABARVA_AZURE_DATABASE_URL` to `DATABASE_URL`.
- Adds focused unit coverage for the pool-size guardrail.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts src/lib/__tests__/supabase-server.test.ts --runInBand`
- PASS: `npx eslint src/lib/data-plane/read-adapters/azureSession.ts src/lib/data-plane/postgresCompat.ts src/lib/supabase-server.ts src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts src/lib/__tests__/supabase-server.test.ts`
- PASS: `npx tsc --noEmit --pretty false --incremental false`

## Rollout Plan

Merge after CI green. Deploy through the standard production pipeline. Post
deploy, verify `/api/health` and rerun the post-deploy crawl surfaces that
previously reported `/strategic-moves` database-session failures.

## Rollback Plan

Revert this PR. That restores the previous connection behavior. No database
rollback is required.

## Audit Evidence

- Vercel logs for the prior deployment showed
  `(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`.
- Focused tests verify the default pool cap and override behavior.

## Known Gaps

- This release reduces runtime connection pressure. It does not change the
  underlying Azure Postgres pool size.
- Production promotion to `dpl_7LNQZjLGhjEDSK9ZntAPVc8GuyYC` was rolled back
  after authenticated post-deploy crawl pressure drove `/api/health` to HTTP
  503. Follow-up release `2026-05-29-strategic-moves-crawl-fanout` reduces the
  Strategic Moves route-level DB fan-out that remained after this pool guard.
