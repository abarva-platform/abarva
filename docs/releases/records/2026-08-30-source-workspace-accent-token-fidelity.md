# 2026-08-30-source-workspace-accent-token-fidelity — Source Workspace Accent Token Fidelity

## Release ID

`2026-08-30-source-workspace-accent-token-fidelity`

## Status

`candidate`

## Plain-English Summary

This release removes remaining legacy cool-blue accent colors from the Source workspace and aligns inline chart, lens, vendor, contract, and evidence details with the approved Source 360 warm palette.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Source workspace presentation only. No data model, adapter, loader, tenant, retrieval, or calculation behavior changes.

## Client Applicability

- All clients: Source workspace visual styling receives the same accent-token correction.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Source workspace lens and canvas inline accent colors now use the warm Source palette.
- Vendor identity mark no longer uses the old blue/cyan gradient.
- Contract 360 and evidence cockpit labels use the Source action-green accent instead of the previous blue accent.

## QA / Validation

- PASS: `rg -n "#0066CC|rgba\\(0,102,204|#0f7cf6|#12b5cb|#66758c|#0a3d70|#3d6ea8|#a9bdd6" 'src/app/(maestro)/source/preview/workspace' || true`
- PASS: `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- PASS: `npx eslint 'src/app/(maestro)/source/preview/workspace'`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`

## Rollout Plan

Merge to main through PR-only repository governance. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source workspace route token proof after deployment.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps deploy workflow.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7152
- Local validation commands listed above.
- Live signed-in proof: to be added after deployment.

## Known Gaps

This release only addresses residual accent-token mismatch. It does not complete pixel-perfect implementation of every Source 360 tab/subtab.
