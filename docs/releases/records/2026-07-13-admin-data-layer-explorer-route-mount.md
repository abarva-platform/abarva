# 2026-07-13-admin-data-layer-explorer-route-mount — Admin Data Layer Explorer Route Mount

## Release ID

`2026-07-13-admin-data-layer-explorer-route-mount`

## Status

`candidate`

## Plain-English Summary

Fixes the Admin proxy allowlist so `/admin/data-layer-explorer` renders the new read-only Data Layer Explorer page instead of being drained back to the canonical `/admin` setup page.

The signed-in focused crawl after the first deployment reached `/admin/data-layer-explorer`, but the HTML and screenshot showed the existing setup/data-control surface. Root cause: the proxy redirects any `/admin/*` browser route that is not listed in `ACTIVE_ADMIN_SUBROUTES`. The Data Layer Explorer route file existed and built correctly, but the proxy did not yet mark it active.

## Layer Impact

- `global-control-lane`: updates Admin browser-route gating for one explicit route.
- `internal-admin`: makes the already-merged Data Layer Explorer page browser-visible.
- `proof/reporting`: adds regression coverage for the proxy route allowlist.

## Client Applicability

- All clients: Authorized Admin users can reach the Data Layer Explorer route for the active tenant context.
- Specific clients: None.
- Internal only: Admin/control-plane route.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `/admin/data-layer-explorer` to `ACTIVE_ADMIN_SUBROUTES`.
- Adds a unit regression that proves the route is auth-gated, not public, and allowed to render instead of collapsing to setup.
- Refreshes the generated Admin Data Layer Explorer proof JSONs from `npm run audit:admin-data-layer-explorer`.

## QA / Validation

- `npx jest --runTestsByPath src/__tests__/unit/proxy-active-admin-subroutes.test.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts --runInBand`: Pass.
- `npm run audit:admin-data-layer-explorer`: Pass.
- `npm run release:check`: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge through the protected PR lane and deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, run the focused signed-in crawl for `surface=admin-data-layer-explorer` and verify the HTML contains the Data Layer Explorer markers, not the setup/data-control page.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Checked by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, focused Admin Data Layer Explorer route proof.

## Rollback Plan

Revert this proxy allowlist/test change and redeploy through the repo-owned ACA main deploy workflow. Rollback returns `/admin/data-layer-explorer` to the old Admin route-drain behavior. No production tenant data, candidate versions, promotions, Active Tenant Access state, or module runtime behavior are changed.

## Audit Evidence

- Prior focused crawl finding: `/admin/data-layer-explorer` rendered the setup/data-control page before this fix.
- PR URL: To be added after PR creation.
- Focused crawl artifact after deployment: To be added after deployment.

## Known Gaps

This change fixes route visibility only. It does not change the Data Layer Explorer content model, upload execution, validation execution, candidate creation, candidate promotion, Active Tenant Access updates, production data writes, or module runtime consumption.
