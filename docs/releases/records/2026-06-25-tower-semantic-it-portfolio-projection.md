# 2026-06-25-tower-semantic-it-portfolio-projection — Tower Reads V4 IT Portfolio Rows

## Release ID

`2026-06-25-tower-semantic-it-portfolio-projection`

## Status

`candidate`

## Plain-English Summary

Tower no longer treats a tenant as empty just because the older `ai_initiatives`
table has no rows. When the legacy Tower substrate is empty, Tower now projects
tenant-loaded V4 IT portfolio initiatives and vendor contract rows from the
enterprise context layer, then falls back to AI-control Tower rows if needed.
This keeps Tower focused on the broader IT portfolio, not only AI initiatives.

## Layer Impact

- `global-control-lane`: Tower shared runtime behavior changes for every tenant
  through one server-side read path.
- `client-data-lane`: No data migration is included, but the runtime now reads
  tenant-scoped `enterprise_context_records` and `ai_control_*` rows as a Tower
  read-model fallback.

## Client Applicability

- All clients: yes, because Tower fallback behavior is global.
- Specific clients: Lakeshore and SkyHarbor diagnostics are explicitly added to
  the Tower substrate debug route.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `src/lib/tower/tower-semantic-projection.ts`.
- Wired `src/lib/atlas/tower-grounding.ts` to use V4 IT portfolio projection
  when `ai_initiatives` is empty.
- Added Lakeshore and SkyHarbor to `/api/debug/tower-substrate`.
- Added regression tests for V4 IT initiatives and AI-control fallback rows.

## QA / Validation

- `npx jest src/lib/tower/__tests__/tower-semantic-projection.test.ts src/lib/data-plane/read-adapters/__tests__/tower-substrate-read-adapter.test.ts --runInBand`
  passed: 2 suites, 10 tests.
- `npx eslint src/lib/tower/tower-semantic-projection.ts src/lib/atlas/tower-grounding.ts src/app/api/debug/tower-substrate/route.ts src/lib/tower/__tests__/tower-semantic-projection.test.ts`
  passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
  pending at record creation time.

## Rollout Plan

Merge to `main`, build and deploy through Azure Container Apps using the
repo-owned ACA deploy path, then verify the deployed `/tower` page for
Lakeshore shows non-empty Tower portfolio data.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned main deploy path.
- Approved image digest: to be recorded after ACA deployment.
- ACA runtime invariant: required after deployment.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Lakeshore `/tower`.

## Rollback Plan

Revert the PR and redeploy the previous approved main image. No schema or data
migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy proof: pending.
- Signed-in browser screenshot: pending.

## Known Gaps

This release creates a runtime projection fallback. The longer-term semantic
architecture should materialize a first-class `tower_read_model_*` view after
each tenant load and gate tenant readiness on that projection.
