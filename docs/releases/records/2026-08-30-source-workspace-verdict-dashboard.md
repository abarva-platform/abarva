# 2026-08-30-source-workspace-verdict-dashboard — Source Workspace Verdict Dashboard

## Release ID

`2026-08-30-source-workspace-verdict-dashboard`

## Status

`candidate`

## Plain-English Summary

The Source workspace verdict view is arranged as a compact executive dashboard instead of a stacked audit page. The same governed figures and claim limits remain visible, but the first screen now prioritizes action rows, evidence posture, vendor concentration, and claim-quality controls in a scannable layout.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace presentation only. No source adapters, canonical facts, cubes, tenant data, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users on the shared product route receive the layout update.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Source workspace verdict layout classes and responsive CSS.
- Focused workspace render test coverage for the compact dashboard structure.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the Source workspace route.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This release does not add new charts, data sources, source documents, or deterministic calculations. It only improves the verdict dashboard layout for already-governed rows.
