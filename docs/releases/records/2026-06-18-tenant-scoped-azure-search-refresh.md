# 2026-06-18-tenant-scoped-azure-search-refresh — Tenant-Scoped Azure Search Refresh Guard

## Release ID

`2026-06-18-tenant-scoped-azure-search-refresh`

## Status

`candidate`

## Plain-English Summary

Makes the Azure AI Search tenant-context backfill safe to run for a named client set instead of always reading and verifying every tenant. This is needed after the Meridian/Lakeshore V2 data-plane load: operators can now plan, apply, and verify Search indexing for `meridian-health` and `lakeshore` without re-indexing unrelated clients.

This also registers Lakeshore in the platform tenant alias maps so `lakeshore`, `lakeshore-industries`, and `lakeshore-holdings` resolve to the same tenant key across app/client selection, broker aliases, and Azure Search document mapping.

This change does not generate embeddings and does not enable the `retrieval_azure_search` feature flag. It prepares the safe Search indexing path; a live ACA run and signed-in retrieval proof are still required before claiming Search-backed retrieval is active for either client.

## Layer Impact

- `client-data-lane`: Adds tenant-scoped Search indexing controls for committed context chunks.
- `internal-admin`: Gives operators safer command-line controls for private data-plane refresh jobs.
- `global-control-lane`: Adds Lakeshore to the canonical client and tenant alias registries.

## Client Applicability

- All clients: The Azure Search backfill now requires an explicit tenant scope for mutating runs unless `AZURE_SEARCH_BACKFILL_ALL_TENANTS=true` is set.
- Specific clients: Lakeshore Industries is newly recognized by the shared client/tenant alias registries.
- Internal only: The backfill runner is an operator/private-worker script.
- Public/demo only: Not applicable.
- Feature flag: `retrieval_azure_search` remains off by default; this release does not enable retrieval for any tenant.

## Changes Included

- `src/scripts/azure-ai-search-backfill.ts`
- `src/lib/azure-search/tenant-context-backfill.ts`
- `src/lib/client-config.ts`
- `src/lib/tenant/aliases.ts`
- `src/lib/tenant-keys.ts`
- Unit tests for Azure Search tenant mapping and tenant alias resolution.

## QA / Validation

- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/azure-search/__tests__/tenant-context-backfill.test.ts src/lib/tenant/__tests__/resolveTenant.test.ts src/__tests__/unit/tenant-keys.test.ts --runInBand` — 25 tests passed. Jest emitted pre-existing duplicate manual mock warnings unrelated to this change.
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/tsx src/scripts/azure-ai-search-indexes.ts plan` — planned `tenant-context-v1` plus the other Azure Search indexes.
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/tsx src/scripts/azure-ai-search-backfill.ts verify` — failed fast with `tenant_scope_required`, proving unscoped mutating verification is blocked unless a tenant or explicit all-tenant override is supplied.
- BLOCKED: `/Users/anand/Projects/nexus/node_modules/.bin/tsx src/scripts/azure-ai-search-backfill.ts plan --tenant meridian-health,lakeshore` — local environment does not expose `DATABASE_URL`; must run in ACA/private worker or a shell with the lab database URL.
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/scripts/azure-ai-search-backfill.ts src/lib/azure-search/tenant-context-backfill.ts src/lib/client-config.ts src/lib/tenant/aliases.ts src/lib/tenant-keys.ts src/lib/azure-search/__tests__/tenant-context-backfill.test.ts src/lib/tenant/__tests__/resolveTenant.test.ts src/__tests__/unit/tenant-keys.test.ts`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `node scripts/release-check.mjs --base origin/codex/ai-control-tower-substrate --head HEAD`

## Rollout Plan

Merge to the substrate branch, then build/deploy the web/private-worker image before running the backfill in ACA with:

`npx tsx src/scripts/azure-ai-search-backfill.ts apply --tenant meridian-health,lakeshore`

The run must be followed by:

`npx tsx src/scripts/azure-ai-search-backfill.ts verify --tenant meridian-health,lakeshore`

Only after Search counts match should operators consider enabling `retrieval_azure_search` through the tenant allowlist and running signed-in retrieval QA.

## Rollback Plan

Git-revert this release. If a bad Search apply was run, re-run the previous known-good backfill scope or purge the affected tenant documents from `tenant-context-v1` before re-applying. Do not delete or mutate Postgres context rows as part of rolling back this code change.

## Audit Evidence

- PR and CI once opened.
- Local command output listed in QA / Validation.
- Future ACA apply/verify execution ids, if the private worker run is performed.

## Known Gaps

- Does not generate or store embeddings.
- Does not refresh the Intelligence `context_insights` layer.
- Does not enable Azure Search retrieval by feature flag.
- Does not prove signed-in Intelligence/Tower answers use the refreshed Search index.
