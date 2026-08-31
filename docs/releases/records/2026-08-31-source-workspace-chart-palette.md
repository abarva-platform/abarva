# 2026-08-31-source-workspace-chart-palette — Source Workspace Chart Palette

## Release ID

`2026-08-31-source-workspace-chart-palette`

## Status

`candidate`

## Plain-English Summary

Source workspace charts now use the named Source chart palette instead of hard-coded near-black fills and labels. This keeps executive charts visually consistent with the workspace design contract and avoids charts reading as solid black blocks when data is sparse or highly concentrated.

## Layer Impact

Layer 4 Products, `global-control-lane`: updates the Source workspace presentation layer only. No source adapters, canonical facts, cubes, tenant data, data-build jobs, or schema objects change.

## Client Applicability

- All clients: yes, for Source workspace users on the shared product route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source workspace charts now use a shared semantic palette for concentration, evidence-depth, archetype, performance, and optimize visual marks.
- Chart legends now describe the primary series as navy instead of black.
- A focused regression test prevents hard-coded black chart fills, black chart strokes, and black legend labels from returning.

## QA / Validation

- Pass: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --changed-only`

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration, data load, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker behavior changed; existing deploy invariant still applies.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Source workspace vendor, contract, performance, and optimize chart views.

## Rollback Plan

Revert the PR and redeploy through the same ACA main deploy workflow. This restores the previous chart color behavior and does not require schema or data rollback.

## Audit Evidence

- PR URL: pending.
- Local validation commands to be added before merge.
- ACA deploy run and signed-in proof to be attached after merge/deploy.

## Known Gaps

Signed-in visual proof is pending merge and deployment.
