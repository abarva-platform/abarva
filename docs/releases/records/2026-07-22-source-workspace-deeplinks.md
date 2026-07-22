# 2026-07-22-source-workspace-deeplinks — Source Workspace Deep Links

## Release ID

`2026-07-22-source-workspace-deeplinks`

## Status

`candidate`

## Plain-English Summary

Source event workspace links now open the intended workspace directly. A URL such as `?workspace=approvals` lands the user in the Approvals workspace instead of forcing them back to Steps and making them click again.

## Layer Impact

- `global-control-lane`: Updates the shared Source event shell route and client canvas state initialization. No schema, tenant data, model prompt, deployment workflow, or environment setting changes are included.

## Client Applicability

- All clients: Any signed-in Source user on the redesigned event shell receives the deep-link behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/page.tsx`: Reads and normalizes the `workspace` search parameter.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: Initializes and syncs the active workspace from the route-selected value, and adds stable workspace rail test hooks.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`: Adds regression coverage for opening directly to a route-selected workspace.

## QA / Validation

- Live pre-fix observation against `https://app.abarva.ai`: `?workspace=approvals` did not open Approvals; the event shell still opened on Steps.
- `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`: passed, 14/14 tests.
- `npx eslint src/app/(maestro)/source/events/[eventId]/page.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`: passed after refreshing the isolated worktree's missing `node_modules` dependencies.
- `npm run release:check`: passed.
- Live post-deploy proof against `https://app.abarva.ai/source/events/apex-retail-ams-outsourcing-2026?stage=responses&workspace=approvals`: pending ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the exact merged commit, then verify the ACA runtime invariant and run signed-in browser proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge to `main`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, because this affects signed-in Source navigation.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback or migration rollback is required.

## Audit Evidence

- PR: pending.
- CI/release check: pending.
- ACA runtime proof: pending.
- Live signed-in browser proof: pending.

## Known Gaps

- This release does not create artifact acceptance records for SRC-004; it only makes existing workspace links land in the correct shell workspace.
