# 2026-07-13-admin-data-layer-explorer-crawl-surface — Admin Data Layer Explorer Crawl Surface

## Release ID

`2026-07-13-admin-data-layer-explorer-crawl-surface`

## Status

`candidate`

## Plain-English Summary

Adds the new `/admin/data-layer-explorer` page to the authenticated post-deploy crawl surface registry as `admin-data-layer-explorer`, so the route can be proven directly after deployment.

## Layer Impact

- `global-control-lane`: updates the post-deploy crawl registry only.
- `proof/reporting`: enables focused signed-in proof for the Admin Data Layer Explorer page.

## Client Applicability

- All clients: The crawl can authenticate as any configured crawl persona and target this Admin route.
- Specific clients: None.
- Internal only: Used by release/proof automation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `admin-data-layer-explorer` to `PRIMARY_CRAWL_SURFACES`.
- Adds a focused test that resolves the surface to `/admin/data-layer-explorer`.

## QA / Validation

- `npx jest --runTestsByPath src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`: Pass.
- `npm run release:check`: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge through the PR lane and deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, run the focused signed-in post-deploy crawl with `surface=admin-data-layer-explorer`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Checked by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, focused `admin-data-layer-explorer` crawl.

## Rollback Plan

Revert this registry/test change and redeploy through the repo-owned ACA main deploy workflow. No product runtime behavior, production data, candidate versions, promotions, or active access state are changed.

## Audit Evidence

- PR URL: To be added after PR creation.
- Focused crawl artifact: To be added after deployment.

## Known Gaps

This change only registers the Admin Data Layer Explorer as a crawl target. It does not change the page content, route authorization, crawl authentication model, production data state, candidate preview behavior, candidate promotion behavior, Active Tenant Access state, or module runtime consumption. The actual signed-in browser result must still be produced by the post-deploy crawl after this registry change is deployed.
