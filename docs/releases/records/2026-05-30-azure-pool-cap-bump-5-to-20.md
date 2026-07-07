# 2026-05-30-azure-pool-cap-bump-5-to-20 — Raise Azure Postgres pool cap from 5 to 20

## Release ID

`2026-05-30-azure-pool-cap-bump-5-to-20`

## Status

`candidate`

## Plain-English Summary

The `/admin` landing page fans out to roughly twelve distinct Postgres queries per render to assemble the Trust strip, posture grid, action queue, and audit ribbon. Until today, the in-code cap on the Azure Postgres connection pool was 5, which throttled the fan-out and caused the amber "Live data temporarily unavailable" banner to fire intermittently on non-Apex tenants. Browser re-test after operator-set `ABARVA_PG_POOL_MAX=5` showed the banner still firing for Meridian, confirming the 5-cap is the binding constraint. Azure Postgres Flexible Server B-tier supports 100+ concurrent connections per instance — the prior 5-cap was the most conservative serverless default we shipped before live load data existed. This change raises the cap to 20 (still well under platform capacity) so operators can configure pools that match `/admin`'s real fan-out.

## Layer Impact

- `global-control-lane` — both `azureRead` (read-adapter session pool) and `postgresCompat` (write/compat pool) cap raised. Default value is unchanged at 1; only operator-set `ABARVA_PG_POOL_MAX` (or legacy `PGPOOL_MAX`) values above 5 now have any effect.

## Client Applicability

- All clients: yes (every tenant rendering `/admin` benefits once the operator raises the env var).
- Specific clients: visible symptom was most pronounced on Meridian (highest non-Apex query load on the substrate snapshot path).
- Internal only: n/a
- Public/demo only: n/a
- Feature flag: gated by env var; no rollout occurs unless `ABARVA_PG_POOL_MAX` is set above 5.

## Changes Included

- `src/lib/data-plane/read-adapters/azureSession.ts` — `Math.min(parsed, 5)` → `Math.min(parsed, 20)` in `resolveAzurePoolMax`, with comment block explaining the rationale.
- `src/lib/data-plane/postgresCompat.ts` — same cap raise in `resolvePostgresPoolMax`.
- `src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts` — test pinning updated for new cap; PGPOOL_MAX legacy alias coverage added.
- `src/lib/__tests__/supabase-server.test.ts` — same test pinning update for postgresCompat.

## QA / Validation

- `npx jest src/lib/data-plane/read-adapters/__tests__/azure-session.test.ts src/lib/__tests__/supabase-server.test.ts` — 8/8 pass.
- Browser re-test against prod will confirm amber banner clears for Meridian once env var bumped to e.g. `ABARVA_PG_POOL_MAX=15`.

## Rollout Plan

- Merge PR; Vercel auto-deploys to production.
- Operator action (separate): raise `ABARVA_PG_POOL_MAX` in Vercel prod env from 5 to 15 (or 20). The env-var change requires a redeploy to take effect.
- Re-verify amber banner on `/admin` for Meridian after rollout.

## Rollback Plan

- Revert PR and redeploy. The cap can also be effectively held at 5 by leaving the env var at 5, since the in-code cap is the upper bound only — values below it are honored exactly.

## Audit Evidence

- PR URL: populated on push.
- Local test run: 8/8 pass on the touched test files.
- Vercel deploy URL: populated on PR check.
- Prod re-verification: Chrome MCP read of `/admin` after redeploy, checking the amber-banner status element.

## Known Gaps

- This release only raises the cap; it does not add per-connect diagnostic emission (pool.totalCount / idleCount / waitingCount on rejection). That diagnostic is deferred to a follow-up so we can land the cap raise cleanly first.
- Postgres server-side `max_connections` is not validated by this change. If multiple Fluid Compute instances are warm simultaneously, each can hold up to 20 connections — operators should monitor `pg_stat_activity` after rollout.
