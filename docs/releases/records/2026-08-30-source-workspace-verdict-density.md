# 2026-08-30-source-workspace-verdict-density — Source Workspace Verdict Density

## Release ID

`2026-08-30-source-workspace-verdict-density`

## Status

`candidate`

## Plain-English Summary

The Source workspace verdict screen is tightened so the executive dashboard reads as a concise first-screen view instead of a long stacked page. It keeps the same governed numbers, claim controls, and unsupported-claim hiding, while making evidence posture and action rows easier to scan.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace presentation only. No source adapters, canonical facts, cubes, tenant rows, retrieval corpus, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users on the shared product route receive the layout update.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Compact verdict decision-row styling.
- Compact evidence-posture fact grid styling.
- Compact claim-quality control styling.
- Focused workspace render test coverage for the compact verdict classes.

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
- Live signed-in proof required: Yes, for the Source workspace route.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This release does not add new charts, data sources, source documents, or deterministic calculations. It only improves the first-screen density for already-governed rows.
