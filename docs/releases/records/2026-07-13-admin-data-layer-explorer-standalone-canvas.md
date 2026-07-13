# 2026-07-13-admin-data-layer-explorer-standalone-canvas — Admin Data Layer Explorer Standalone Canvas

## Release ID

`2026-07-13-admin-data-layer-explorer-standalone-canvas`

## Status

`candidate`

## Plain-English Summary

Moves `/admin/data-layer-explorer` out of the old Steward/Admin workspace shell and into a standalone full-canvas app page. The previous implementation was browser-visible after the route-mount fix, but it rendered inside `AdminCanonShellV2`, which made the new Data Journey artifact look like a legacy setup/admin page. This release keeps the same read-only data journey model and proof markers, but changes the page composition and visual system so the artifact reads as a strategic data-layer explorer.

## Layer Impact

- `internal-admin`: visual/page-composition change for `/admin/data-layer-explorer`.
- `global-control-lane`: no runtime behavior change beyond this Admin page rendering wrapper.
- `proof/reporting`: preserves the existing route markers used by the focused signed-in crawl.

## Client Applicability

- All clients: Authorized Admin users see the standalone Data Layer Explorer for the active tenant context.
- Specific clients: None.
- Internal only: Admin/control-plane page.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Replaces `AdminCanonShellV2` / `EditorialCanvas` wrapping with a direct `AppShell` full-canvas layout.
- Removes the old Steward left sidebar from this page.
- Adds a compact dark masthead, horizontal data-journey navigation, truth-split tiles, and clearer sans typography.
- Updates the source test to assert the route does not render through the legacy Admin shell.

## QA / Validation

- `npx jest --runTestsByPath src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts src/lib/admin/__tests__/data-layer-explorer.test.ts --runInBand`: Pass.
- `npx eslint src/app/'(maestro)'/admin/data-layer-explorer/page.tsx src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts`: Pass.
- `npm run audit:admin-data-layer-explorer`: Pass.
- `npm run build`: Pass.
- `npm run audit:enterprise-naming`: Pass.
- `npm run release:check`: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge through the protected PR lane and deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, run the focused signed-in crawl for `surface=admin-data-layer-explorer` and verify the screenshot shows the standalone Data Layer Explorer canvas, not the old Admin/Steward workspace shell.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Checked by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, focused Admin Data Layer Explorer route proof.

## Rollback Plan

Revert this page-composition change and redeploy through the repo-owned ACA main deploy workflow. Rollback returns `/admin/data-layer-explorer` to the old Admin shell rendering, without changing production tenant data, candidate versions, promotions, Active Tenant Access state, or module runtime behavior.

## Audit Evidence

- PR URL: To be added after PR creation.
- Focused crawl artifact after deployment: To be added after deployment.

## Known Gaps

This is a UI/composition correction only. It does not change upload execution, validation execution, candidate creation, candidate promotion, Active Tenant Access updates, production data writes, or module runtime consumption.
