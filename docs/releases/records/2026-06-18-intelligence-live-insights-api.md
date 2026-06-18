# 2026-06-18-intelligence-live-insights-api — Intelligence Live Insights API

## Release ID

`2026-06-18-intelligence-live-insights-api`

## Status

`candidate`

## Plain-English Summary

Adds a tenant-scoped JSON API for the Intelligence module to read materialized `context_insights` rows from the client data plane. This gives QA, crawlers, and future UI work a direct live contract for the insights generated from the context/corpus layer, instead of relying on seeded cards or hidden server-only reads.

## Layer Impact

- `global-control-lane`: Adds a new app API route at `/api/intelligence/insights`.
- `client-data-lane`: Reads tenant-scoped `context_insights` rows and returns citation IDs from `derived_from_record_ids` and `derived_from_fact_ids`.

## Client Applicability

- All clients: The route resolves the active signed-in tenant and reads only that tenant's materialized context insights.
- Specific clients: Initial validated data exists for `meridian-health` and `lakeshore`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/intelligence/insights/route.ts`
- `src/app/api/intelligence/insights/__tests__/route.test.ts`
- `src/lib/intelligence/context-insights.ts`
- `src/lib/intelligence/__tests__/context-insights.test.ts`

## QA / Validation

- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/intelligence/__tests__/context-insights.test.ts src/app/api/intelligence/insights/__tests__/route.test.ts --runInBand`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/lib/intelligence/context-insights.ts src/lib/intelligence/__tests__/context-insights.test.ts src/app/api/intelligence/insights/route.ts src/app/api/intelligence/insights/__tests__/route.test.ts`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PENDING: `node scripts/release-check.mjs --base origin/codex/ai-control-tower-substrate --head HEAD`
- PENDING: CI on PR.
- PENDING: ACA deployment and signed-in/live API smoke after merge.

## Rollout Plan

Merge to `codex/ai-control-tower-substrate`, build and deploy the ACA web image, shift web traffic to the new revision after `/api/health` is green, then smoke `/api/intelligence/insights` with a signed-in Meridian or Lakeshore session.

## Rollback Plan

Code rollback is a Git revert and ACA web image rollback to the prior healthy revision. No schema or data rollback is required because this route is read-only.

## Audit Evidence

- Prior data-plane proof: `context_insights` materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 cited insights for `meridian-health` and 24 cited insights for `lakeshore`.
- Pending PR URL, CI, deploy revision, and smoke output.

## Known Gaps

- Does not change the Intelligence UI yet.
- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not run Blob/document parser/review queues.
