# 2026-08-31-tower-client-query-routing — Tower Client Query Routing

## Release ID

`2026-08-31-tower-client-query-routing`

## Status

`candidate`

## Plain-English Summary

Tower now passes an explicit `client` query value into the shared tenant resolver when rendering the primary command center route. This restores the expected admin and switch-capable verification path without changing tenant-scoped Tower URLs, data loading, projections, or the command center view model.

## Layer Impact

Layer 4 PRODUCTS: route binding only. Tower still reads the governed command center projection and does not own or mutate data.

Release lane: global-control-lane.

## Client Applicability

- All clients: yes, for authorized Tower route rendering.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/tower/page.tsx`
- `src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts`

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts' --runInBand`
- Pass: `npx eslint 'src/app/(maestro)/tower/page.tsx' 'src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

Merge through pull request, then let the repo-owned Azure Container Apps main deploy workflow publish the resulting main image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved by the main deploy workflow.
- ACA runtime invariant: verify after deploy.
- Worker image invariant: not affected beyond the normal main deploy workflow invariant.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify an authorized client query can render populated Tower data.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned Azure Container Apps main deploy workflow.

## Audit Evidence

- Pull request checks.
- Route-scope regression test.
- ACA runtime invariant after merge.
- Live signed-in Tower route proof after deploy.

## Known Gaps

This change restores route binding only. It does not load Tower data for tenants that have no governed command center projection, and it does not change the tenant-switch authority model.
