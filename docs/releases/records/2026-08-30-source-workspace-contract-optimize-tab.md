# 2026-08-30-source-workspace-contract-optimize-tab — Source Contract Optimize Tab

## Release ID

`2026-08-30-source-workspace-contract-optimize-tab`

## Status

`candidate`

## Plain-English Summary

The Source workspace now keeps contract-level Optimize inside the Contract 360 detail tab set instead of replacing the detail view with the workspace-level Optimize canvas. This preserves the expected contract detail flow while keeping the top-level Optimize workspace available.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace navigation state only. No source adapters, canonical facts, cubes, tenant rows, retrieval corpus, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users receive the navigation correction.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Separates workspace-level Optimize navigation from contract-level Optimize detail tab behavior.
- Adds focused render coverage for the Contract 360 Optimize tab remaining within the contract detail shell.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the Source workspace route and Contract 360 tabs.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This release does not add new contract data, optimization calculations, or document evidence. It only corrects Source workspace navigation fidelity.
