# 2026-08-30-source-vendor-concentration-collapse — Source Vendor Concentration Collapse

## Release ID

`2026-08-30-source-vendor-concentration-collapse`

## Status

`candidate`

## Plain-English Summary

The Source 360 executive vendor concentration summary now collapses duplicate
supplier display names before ranking the largest relationships. Contract-level
vendor references remain intact for drill-down, but executive rollups no longer
show the same supplier as separate top-concentration rows when source rows carry
legal-name variants.

## Layer Impact

Layer 4 Products / `global-control-lane`: Source product derivation and UI
summary rendering.

Layers 1-3: No change. No intake files, adapters, canonical tables, loaders, or
tenant rows are changed.

## Client Applicability

- All clients: Source users benefit from cleaner vendor concentration rollups.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Aggregates Source 360 vendor summary rows by normalized supplier display name.
- Combines annual value, contract count, auto-renew counts, next end date, and
  contract refs for duplicate display-name variants.
- Keeps contract-level vendor refs intact for drill-down behavior.
- Adds a focused regression test for duplicate supplier display-name collapse.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts --runInBand`
- PASS: `npx eslint src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build`

## Rollout Plan

Open a PR, squash merge to main, and let the repo-owned Azure Container Apps
main deploy workflow build and deploy the exact main SHA.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source 360 vendor concentration
  summary.

## Rollback Plan

Revert this PR and redeploy through the same ACA main workflow. No data rollback
is required because this release does not mutate data.

## Audit Evidence

PR, CI/deploy run, ACA runtime invariant, and signed-in browser proof for the
Source 360 vendor concentration summary.

## Known Gaps

This release does not rewrite upstream vendor identity data. It only prevents
display-name variants from appearing as separate executive summary rows.
