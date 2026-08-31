# 2026-08-31-source-workspace-chart-empty-states — Source Workspace Chart Empty States

## Release ID

`2026-08-31-source-workspace-chart-empty-states`

## Status

`candidate`

## Plain-English Summary

Source workspace charts now either render governed visual marks or show an explicit empty state that explains why the chart is withheld. Single-category bar charts are capped so a placeholder or highly concentrated category cannot fill the whole chart area and look like a broken block.

## Layer Impact

Layer 4 Products, `global-control-lane`: updates the Source workspace presentation layer only. No source adapters, canonical facts, cubes, tenant data, data-build jobs, or schema objects change.

## Client Applicability

- All clients: yes, for Source workspace users on the shared product route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source workspace Recharts cards now render explicit chart empty states for missing concentration, vendor evidence depth, performance trend, and optimize type-mix data.
- Bar charts now cap maximum bar size to avoid misleading full-panel slabs when a view has one dominant category.
- Source workspace browser-surface tests now verify chart-empty behavior and chart-rendered behavior across the vendor subtabs and enriched action/performance views.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration, data load, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker behavior changed; existing deploy invariant still applies.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Source workspace vendor subtabs and optimize/performance chart states.

## Rollback Plan

Revert the PR and redeploy through the same ACA main deploy workflow. This restores the previous chart rendering behavior and does not require schema or data rollback.

## Audit Evidence

- PR URL: pending.
- Local validation commands listed above.
- ACA deploy run and signed-in proof to be attached after merge/deploy.

## Known Gaps

Signed-in visual proof is pending merge and deployment.
