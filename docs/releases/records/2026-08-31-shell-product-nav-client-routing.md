# 2026-08-31-shell-product-nav-client-routing — Product Nav Client Routing

## Release ID

`2026-08-31-shell-product-nav-client-routing`

## Status

`candidate`

## Plain-English Summary

The signed-in product navigation now uses Next.js client transitions for product links instead of forcing a full document reload. This keeps the shared shell mounted during product switches and reduces the blank/loading feel when operators move between workspace surfaces.

## Layer Impact

Layer 4 product surface, `global-control-lane`: changes the shared navigation component used by product pages. No data models, schemas, tenant records, loaders, adapters, cubes, or agent prompts change.

## Client Applicability

- All clients: yes, for signed-in product navigation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/AbarvaNav.tsx`
- `src/components/__tests__/AbarvaNav.client-routing.test.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/__tests__/AbarvaNav.client-routing.test.ts src/components/chrome/__tests__/MaestroChrome.test.tsx src/components/navigation/__tests__/NexusTopNav.test.tsx`
- Pass: `npx eslint src/components/AbarvaNav.tsx src/components/__tests__/AbarvaNav.client-routing.test.ts`
- Not run yet: live signed-in browser proof for navigation feel and top-bar persistence after deployment.

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the repo-owned workflow.
- ACA runtime invariant: verified by the repo-owned workflow.
- Worker image invariant: verified by the repo-owned workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: recommended for navigation feel and persistent top-bar behavior.

## Rollback Plan

Revert the component/test change and redeploy via the repo-owned Azure Container Apps workflow, or roll back to the prior healthy ACA revision under the standard release runbook.

## Audit Evidence

PR, CI checks, and ACA deploy evidence will be attached after merge/deploy.

## Known Gaps

Live signed-in visual proof depends on browser tooling/session availability.
