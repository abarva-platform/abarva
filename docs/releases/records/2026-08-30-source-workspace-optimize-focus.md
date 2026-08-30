# 2026-08-30-source-workspace-optimize-focus — Source Workspace Optimize Focus

## Release ID

`2026-08-30-source-workspace-optimize-focus`

## Status

`candidate`

## Plain-English Summary

The Source workspace Optimize view now opens as a compact action surface instead of exposing broad candidate-table language. The screen shows evidence-backed action rows, keeps finance confirmation separate from realized value, and summarizes any extra action rows behind a rollup.

## Layer Impact

Layer 4 Products only, release lane `global-control-lane`. This changes Source workspace presentation and regression coverage. It does not change intake files, adapters, canonical records, projections, tenant data, retrieval policy, or agent behavior.

## Client Applicability

- All clients: Source workspace users with access to the workspace route.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing route/provider controls only; no new flag.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/workspace.css`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- Passed: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the new image. After deploy, run signed-in route proof for the Source workspace Optimize subtabs.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before live-proof claims.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for Source workspace Optimize rendering and tenant-isolation smoke.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to redeploy the prior Source workspace Optimize rendering code. No data rollback is required.

## Audit Evidence

- PR URL and merge commit once available.
- Focused Jest, ESLint, TypeScript, and release-check command output.
- Post-deploy signed-in Source workspace proof bundle once available.

## Known Gaps

Live signed-in proof remains pending until this candidate is merged and deployed.
