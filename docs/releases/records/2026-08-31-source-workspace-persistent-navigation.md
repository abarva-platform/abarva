# 2026-08-31-source-workspace-persistent-navigation — Source Workspace Persistent Navigation

## Release ID

`2026-08-31-source-workspace-persistent-navigation`

## Status

`candidate`

## Plain-English Summary

Source workspace routes now keep the shared product navigation mounted during
workspace interactions and route transitions. The workspace also has a compact
sticky page toolbar and an initial skeleton so users keep orientation
while data-backed Source views prepare.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: Source presentation only. This changes chrome/layout behavior,
workspace navigation, and loading affordances. It does not alter customer data
records, canonical facts, projections, cubes, loaders, or retrieval behavior.

## Client Applicability

- All clients: Source workspace users receive the navigation and loading-state
  behavior when the release is deployed.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Source workspace route chrome behavior now uses the shared product toolbar.
- Source workspace interactions reset the main workspace scroll position on
  tab, vendor, and contract view changes.
- Source workspace adds a compact sticky page toolbar with persistent
  workspace context and primary actions.
- Source workspace adds a neutral loading skeleton for the canonical workspace
  route.
- Focused Source workspace and shared chrome tests were updated.

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/components/chrome/__tests__/MaestroChrome.test.tsx'` passed: 3 suites, 28 tests.

## Rollout Plan

Merge through pull request into `main`. The repo-owned Azure Container Apps main
deploy workflow builds and deploys the resulting image. No migrations, manual
data jobs, customer record changes, or feature-flag flips are required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this release.
- Approved image digest: Established by the repo-owned deploy workflow.
- ACA runtime invariant: Verify after deploy before claiming the release is
  live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for affected Source workspace routes.

## Rollback Plan

Revert the pull request or roll back the Azure Container Apps web revision to
the last healthy digest. Because this is Layer 4 presentation code only, no data
rollback is required.

## Audit Evidence

- Pull request URL after opening.
- Focused Jest output listed above.
- Azure Container Apps deploy workflow run and runtime digest proof after merge.
- Signed-in Source workspace screenshots after deploy.

## Known Gaps

Signed-in visual proof must still be captured after deployment.
