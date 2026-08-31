# 2026-08-31-source-workspace-credit-evidence-precedence — Source Workspace Credit Evidence Precedence

## Release ID

`2026-08-31-source-workspace-credit-evidence-precedence`

## Status

`candidate`

## Plain-English Summary

The Source workspace recoverable-credit lane now prefers the deterministic impact
coverage slice when it is loaded. The older performance-credit snapshot remains a
fallback only when the deterministic impact slice has no credit value. This keeps the
executive view from promoting a larger legacy rollup over the amount that can be traced
through the current Source impact read models.

The follow-up correction also scopes the recoverable-credit headline to the active
contract-depth load run when one is declared. That prevents older coverage rows from
being combined into a single current-package claim.

When the active load run is not exposed by the workspace diagnostics, the credit
headline is now limited to coverage rows tied to explicit credit/recovery action
candidates before falling back to broader historical performance-credit coverage.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 PRODUCTS: updates Source workspace presentation logic and evidence-basis text.
  No schema, loader, adapter, or canonical model change is included.

## Client Applicability

- All clients: yes, for Source workspace tenants with contract-depth impact coverage.
- Specific clients: none named in this public release record.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`
  passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand`
  passed, including active-load-run credit precedence and no-active-run historical
  credit isolation.

## Rollout Plan

Merge through a protected PR to `main`. The repo-owned Azure Container Apps main deploy
workflow builds and deploys the resulting web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before claiming live status.
- Worker image invariant: not affected.
- Feature/env flag update path: not affected.
- Live signed-in proof required: yes, Source workspace Optimize/Evidence proof after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy
workflow. No data rollback is required because this is presentation logic only.

## Audit Evidence

- PR URL: pending.
- ACA deploy run: pending.
- Signed-in Source workspace proof: pending.

## Known Gaps

Live signed-in proof and aVa grounding checks remain required after deployment.
