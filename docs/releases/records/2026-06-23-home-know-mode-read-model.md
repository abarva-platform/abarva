# 2026-06-23-home-know-mode-read-model — Home KNOW-Mode Context Read Model

## Release ID

`2026-06-23-home-know-mode-read-model`

## Status

`candidate`

## Plain-English Summary

Home KNOW mode now has a backend-owned seam: shared TypeScript response contract, SQL read-model views, expected-field metadata, a live data gate script, and a dedicated `/api/home/know/ask` endpoint. The endpoint canonicalizes tenant keys, classifies intent server-side, reads Home views, assembles deterministic facts/tables/charts/citations/gaps/conflicts, and returns a `HomeKnowResponse`. It does not call `/api/intelligence/ask`, does not summon expert labels, does not invent missing people, and hands decision asks to Intelligence/Moves/Tower instead of writing a Home strategy memo.

## Layer Impact

- `global-control-lane`: Adds the server-side Home KNOW endpoint and shared response contract used by all future Home renderers.
- `client-data-lane`: Adds SQL read-model views and expected-field metadata over existing tenant-scoped context rows. No tenant data migration.

## Client Applicability

- All clients: Yes, through the same Home surface and tenant-scoped context records.
- Specific clients: Apex, First Capital, SkyHarbor, Meridian, Lakeshore are the pilot validation set.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Frontend wiring is intentionally deferred until the backend contract is stable.

## Changes Included

- `src/lib/home/know/home-know-contract.ts`
- `src/lib/home/know/home-know-engine.ts`
- `src/lib/home/know/__tests__/home-know-engine.test.ts`
- `src/app/api/home/know/ask/route.ts`
- `supabase/migrations/20260623180000_home_know_read_models.sql`
- `scripts/qa/home-know-data-gate.mjs`
- `src/lib/tenant/aliases.ts`
- `src/app/api/intelligence/ask/route.ts` removes the first-cut Home hook so Home KNOW no longer rides through Intelligence.
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`

## QA / Validation

- `npm test -- src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand` passed: 6/6 tests.
- `npx eslint src/lib/home/know/home-know-contract.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/__tests__/home-know-engine.test.ts src/app/api/home/know/ask/route.ts src/lib/tenant/aliases.ts` passed.
- `npm run release:check` passed.
- `node scripts/qa/home-know-data-gate.mjs` was attempted locally and correctly blocked because neither `ABARVA_AZURE_DATABASE_URL` nor `DATABASE_URL` is present. This must run inside the private VNet before any deployed/browser green claim.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` was run. It fails on pre-existing missing dependency/type declarations outside this change: `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`. The new Home KNOW contract/engine/route files are not in the remaining error list.

## Rollout Plan

Merge to `main`, apply the Home KNOW read-model migration, run `node scripts/qa/home-know-data-gate.mjs` inside the private VNet for all five v4 tenants, build the exact git SHA into an Azure Container Apps image, deploy through the repo-owned ACA lane, shift 100% traffic to the healthy revision, then run the signed-in tenant matrix and reality crawl report for all five pilot tenants.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab rollout.
- Shared runtime mutators: No manual ACA mutation outside the approved deploy lane.
- Approved image digest: To be recorded after build.
- ACA runtime invariant: Template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: No new flag or env var.
- Live signed-in proof required: Yes, tenant matrix plus screenshots/report for all five tenants.

## Rollback Plan

Revert the PR or deploy the previous approved ACA image digest. The migration is additive SQL views plus `home_expected_fields`; rollback can drop the endpoint code and optionally drop the Home KNOW views/table if needed. No tenant data rows are rewritten.

## Audit Evidence

- PR URL: pending.
- Focused unit test output: 6/6 passing for Home KNOW contract engine.
- Data gate: blocked locally due missing DB env; queued for VNet.
- Deployed proof: pending.

## Known Gaps

- This candidate is not marked green in the Brain Contract matrix until the migration is applied, the live data gate passes for all five v4 tenants, and deployed-app screenshots prove the endpoint/render path.
- The current visible Home route baseline must be checked before frontend wiring: production may still use `HomeSurface`, `AvaAsk`, or `/api/home/v2-frame` depending on deploy state. Do not assume frontend and backend are already connected.
- The views are SQL views in this PR. The follow-up operational step is converting hot views to materialized views and calling `refresh_home_know_views(tenant_key)` after tenant load/reload.
