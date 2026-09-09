# 2026-09-09-source-vendor-depth-coverage — Source Vendor Coverage Alignment

## Release ID

`2026-09-09-source-vendor-depth-coverage`

## Status

`candidate`

## Plain-English Summary

Source now calculates the selected-vendor evidence metrics from the same alias-aware coverage rollup used by the vendor evidence table. This keeps the selected-vendor panel consistent with the row a user clicked when a supplier relationship is assembled from multiple evidence-backed vendor references, including suppliers that have both register rows and supplemental depth evidence aliases.

## Layer Impact

Layer 4 Products: Source presentation logic only. The change affects vendor detail metric display and does not change loaders, adapters, canonical records, migrations, or data-plane writes.

## Client Applicability

- All clients: Source workspace vendor evidence views.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Uses alias-aware coverage aggregation for the selected-vendor panel.
- Uses the same alias-aware action-row count in the selected-vendor metric tile.
- Preserves evidence aliases when a selected vendor also exists in the governed register.
- Adds a behavioral regression for selected-vendor coverage across evidence vendor aliases.
- Adds a behavioral regression for register vendors with supplemental evidence aliases.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — pass.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — pass.
- `npm run release:check` — pass.

## Rollout Plan

Merge by pull request into `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the approved main image. No migration, loader, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production web rollout.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: to be captured by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: Source workspace selected-vendor evidence metrics and grouped-contract panel.

## Rollback Plan

Revert the Source presentation commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this is a presentation-only change.

## Audit Evidence

Pull request, CI checks, deployment workflow run, ACA runtime-invariant proof, and live Source workspace smoke-test notes.

## Known Gaps

This release does not widen the vendor concentration table, change vendor ranking, or change portfolio denominator math. It only aligns the selected-vendor detail metrics with evidence rows that are already visible in the Source vendor evidence view.
