# 2026-08-30-source-workspace-vendor-grouping-fallback — Source Vendor Grouping Fallback

## Release ID

`2026-08-30-source-workspace-vendor-grouping-fallback`

## Status

`candidate`

## Plain-English Summary

The Source workspace vendor detail panel can now show grouped contract rows even when a vendor rollup row does not carry explicit contract reference arrays. The UI falls back to canonical contract rows by vendor identity before showing an empty-state.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace presentation logic only. No source adapters, canonical facts, cubes, tenant rows, retrieval corpus, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users get more reliable vendor drill-down when the loaded portfolio has contract rows available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Derives selected-vendor contract rows from explicit contract references, vendor references, or normalized vendor name.
- Reuses the same derived rows when correcting displayed vendor counts, annual value, committed value, renewal count, and next end date.
- Keeps the empty-state only for cases where no matching contract rows exist in the loaded Source workspace substrate.
- Adds regression coverage for a vendor rollup row with an empty contract reference array.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`
- Pass: `npx tsc --noEmit --pretty false`
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
- Live signed-in proof required: Yes, for the Source workspace vendor summary drill-down.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This release does not introduce unsupported vendor-wide SLA, risk score, realized savings, or benchmark metrics.
