# 2026-08-30-source-workspace-vendor-summary-band — Source Vendor Summary Band

## Release ID

`2026-08-30-source-workspace-vendor-summary-band`

## Status

`candidate`

## Plain-English Summary

The Source workspace vendor view now presents the selected vendor as a compact executive summary band instead of a long vertical fact stack. The summary uses only already-loaded cross-contract vendor facts and grouped contract headers.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace presentation for the selected vendor panel. No source adapters, canonical facts, cubes, tenant rows, retrieval corpus, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users receive the cleaner vendor summary presentation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Replaces the selected-vendor vertical fact stack with a compact summary band.
- Shows only loaded vendor facts: contract count, recorded annual value, portfolio share, renewal count, action rows, unconfirmed action value, unclaimed credits, and spend/performance row coverage.
- Keeps grouped contract headers clickable without introducing unsupported vendor-wide risk, SLA, or realized-value claims.
- Adds focused render coverage for the grouped-contract summary shape.

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
- Live signed-in proof required: Yes, for the Source workspace vendor summary surface.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Source workspace proof after deployment.

## Known Gaps

This release does not add vendor-wide SLA, risk score, realized savings, or benchmark metrics. Those remain hidden unless supported by broad loaded evidence rows.
