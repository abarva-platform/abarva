# PROD2 Production Readiness Freshness Layer

## Purpose

This slice makes the Production Readiness tracker freshness-aware without pretending it is true live monitoring.

The tracker already has an internal no-store API refresh path from PROD3. This slice adds a clearer freshness contract around the manifest itself so users can tell whether the page is showing a recent repository-backed manifest or an aging/stale snapshot.

## What Changed

- The production readiness read model now exposes freshness metadata:
  - `lastUpdated`
  - `dataSource`
  - `updateMode`
  - `freshnessStatus`
  - `staleReason`
  - `nextRefreshRecommendation`
- Freshness states are:
  - `fresh`
  - `aging`
  - `stale`
  - `unknown`
- Update modes are:
  - `static_manifest`
  - `repository_snapshot`
  - `github_checks`
  - `vercel_deploy`
  - `mixed`
- The admin Production Readiness UI now shows the manifest source, freshness status, stale reason, and a clear "not live monitoring" disclaimer when the tracker is repository-backed.
- The API response carries the same freshness fields alongside the existing request-time refresh metadata.

## What Is Not Real-Time

This slice does not ingest:

- GitHub checks
- Vercel deployments
- route smoke execution
- persona crawler results
- database-backed readiness
- production observability

The tracker remains a deterministic repository manifest with request-time API refresh metadata.

## Future PROD4+ Work

Future slices may add:

- secure server-side GitHub check ingestion
- secure server-side Vercel deployment status ingestion
- deploy event polling
- route smoke execution status
- persona crawler status
- production observability integration
- database-backed readiness state

Any future live status must be explicit, server-side, and backed by safe tokens/configuration. Until then, the tracker must say it is repository-backed and not live monitoring.

## Validation

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts`
- `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts`
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts`
- `npm run build`
- `npm run build -- --webpack`
- `git diff --check`
- JSON parse for `docs/build/production-readiness.json` and `docs/build/build-slices.json`

## Out Of Scope

- no GitHub polling
- no Vercel polling
- no external API calls
- no auth rewrite
- no model calls
- no Source UI/runtime changes
- no migrations
- no production-ready claim
