# 2026-06-18-intelligence-live-insights-api — Intelligence Live Insights API

## Release ID

`2026-06-18-intelligence-live-insights-api`

## Status

`released`

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
- PASS: `node scripts/release-check.mjs --base origin/codex/ai-control-tower-substrate --head HEAD`
- PASS: PR #3663 CI on GitHub: ESLint, Routes and disclaimers, Typecheck + reasoning-layer tests.
- PASS: ACR build `cadp` pushed `acrabarvalab001.azurecr.io/abarva/web:intelligence-insights-api-5b20dd3e@sha256:f346d3c110239c805bce30e94aa759d5a183db706d730a1baeb877cbf29705a8`.
- PASS: ACA web revision `ca-abarva-web-lab-eastus--0000104` is active at 100% traffic with image `acrabarvalab001.azurecr.io/abarva/web:intelligence-insights-api-5b20dd3e`.
- PASS: Public health smoke returned HTTP 200 with `postgres: true`, `direct_postgres: true`, and `azure_graph: "postgres"`.
- PASS: Anonymous `/api/intelligence/insights?limit=3` smoke returned Clerk sign-in redirect, proving the route is not publicly exposed.
- NOT RUN: Signed-in tenant API smoke was not run in this release record because no reusable Clerk-authenticated browser/session cookie was available to the deploy job.

## Rollout Plan

Merged to `codex/ai-control-tower-substrate` in PR #3663, built and deployed the ACA web image, shifted web traffic to revision `ca-abarva-web-lab-eastus--0000104` after `/api/health` was green, and confirmed the insights route is Clerk-protected. A signed-in Meridian or Lakeshore browser smoke is still required before claiming UI-visible retrieval.

## Rollback Plan

Code rollback is a Git revert and ACA web image rollback to the prior healthy revision. No schema or data rollback is required because this route is read-only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3663
- Merge commit: `5b20dd3e984a5815230462b811d376917321b189`
- Prior data-plane proof: `context_insights` materializer verify execution `job-abarva-private-operator-eus-en2ye2q` proved 24 cited insights for `meridian-health` and 24 cited insights for `lakeshore`.
- ACR build: `cadp`
- Deployed image: `acrabarvalab001.azurecr.io/abarva/web:intelligence-insights-api-5b20dd3e@sha256:f346d3c110239c805bce30e94aa759d5a183db706d730a1baeb877cbf29705a8`
- ACA serving revision: `ca-abarva-web-lab-eastus--0000104`, 100% traffic as of 2026-06-18 09:53 UTC.
- Health smoke: `https://app.abarva.ai/api/health` returned HTTP 200 with Postgres checks green.
- Auth smoke: `https://app.abarva.ai/api/intelligence/insights?limit=3` returned HTTP 307 to Clerk sign-in when unsigned.

## Known Gaps

- Does not change the Intelligence UI yet.
- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not run Blob/document parser/review queues.
