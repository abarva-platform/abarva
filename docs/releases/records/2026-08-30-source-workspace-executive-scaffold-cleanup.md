# 2026-08-30-source-workspace-executive-scaffold-cleanup — Source Workspace Executive Scaffold Cleanup

## Release ID

`2026-08-30-source-workspace-executive-scaffold-cleanup`

## Status

`candidate`

## Plain-English Summary

The Source workspace Optimize view now uses executive-facing evidence language instead of an internal proof-layer label. The page still shows the same loaded-row and finance-state guardrails, but the label is suitable for the product surface.

## Layer Impact

Layer 4 Products only, release lane `global-control-lane`. This changes display copy and focused regression coverage for the Source workspace. It does not change intake files, adapters, canonical records, projections, tenant data, retrieval policy, or agent behavior.

## Client Applicability

- All clients: Source workspace users with access to the workspace route.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing route/provider controls only; no new flag.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`

## QA / Validation

- `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` passed.

## Rollout Plan

Open a PR, squash merge to `main`, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the new image. After deploy, run signed-in route proof for the Source workspace Optimize and subtab views.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before live-proof claims.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for Source workspace Optimize rendering and tenant-isolation smoke.

## Rollback Plan

Revert the merge commit and allow the repo-owned deploy workflow to redeploy the prior Source workspace rendering code. No data rollback is required.

## Audit Evidence

- PR URL and merge commit once available.
- Focused Jest and ESLint command output.
- Post-deploy signed-in Source workspace proof bundle once available.

## Known Gaps

Live signed-in proof remains pending until this candidate is merged and deployed.
