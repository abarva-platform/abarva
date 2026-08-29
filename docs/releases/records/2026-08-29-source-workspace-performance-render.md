# 2026-08-29-source-workspace-performance-render — Source Workspace Performance Rendering

## Release ID

`2026-08-29-source-workspace-performance-render`

## Status

`candidate`

## Plain-English Summary

The Source workspace now renders governed performance observations when the data adapter returns numeric values instead of pre-formatted text. This prevents a client-side surface crash and keeps percentage-style service performance rows legible.

## Layer Impact

Layer 4 Products: updates the Source workspace presentation layer only. No schema, loader, adapter, tenant-routing, or data-plane mutation is included.

## Client Applicability

- All clients: Source workspace users who open contract performance views.
- Specific clients: None named in this public release record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` passed.

## Rollout Plan

Merge by PR to `main`, then use the repo-owned Azure Container Apps main deploy workflow. After deployment, verify the ACA runtime invariant and run signed-in Source workspace proof for the affected performance surface.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: to be captured after deployment.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or redeploy the prior known-good ACA image digest through the approved workflow. No data rollback is required.

## Audit Evidence

Audit evidence will include the PR, deploy workflow run, ACA runtime image/traffic check, and signed-in Source workspace proof after deployment.

## Known Gaps

Live signed-in proof is pending until this candidate is merged and deployed.
