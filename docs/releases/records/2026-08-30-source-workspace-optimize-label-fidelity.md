# 2026-08-30-source-workspace-optimize-label-fidelity — Source Optimize Label Fidelity

## Release ID

`2026-08-30-source-workspace-optimize-label-fidelity`

## Status

`candidate`

## Plain-English Summary

The Source workspace Optimize subtabs now use the same operator-facing labels as the approved design contract. The underlying rows and navigation behavior are unchanged.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace tab labels and helper copy only. No source adapters, canonical facts, cubes, tenant rows, retrieval corpus, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users see the clearer Optimize subtab labels.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Renames the Optimize grouping tab from `By type` to `Type mix`.
- Renames the contract grouping tab from `By contract` to `Contract readiness`.
- Updates focused render coverage for the Source workspace Optimize tabs.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`
- Pass: `npm run release:check`

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the Source workspace Optimize tab labels.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This release does not change the Source workspace data model, calculations, or evidence rows. It only aligns visible Optimize tab labels with the design contract.
