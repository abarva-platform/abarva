# 2026-06-29-cio-tower-budget-rollup-source-seam — Tower budget rollup source seam

## Release ID

`2026-06-29-cio-tower-budget-rollup-source-seam`

## Status

`candidate`

## Plain-English Summary

Tower now treats governed CIO Tower budget rollups as the complete dashboard source when they exist. Derived initiative rollups remain available only as a fallback when the governed rollup slice is absent, preventing a dashboard from mixing fresh headline totals with stale function-slice totals.

## Layer Impact

- `global-control-lane`: shared Tower dashboard data assembly changes for every tenant using the CIO Tower command center.
- `client-data-lane`: no schema, migration, or tenant data mutation in this release.

## Client Applicability

- All clients: yes, for Tower dashboard budget rollup assembly.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/tower-grounding.ts`: resolves budget rollups from governed rows first and only falls back to derived initiative rollups when governed rows are absent.
- `src/lib/atlas/__tests__/tower-budget-rollup-resolution.test.ts`: regression coverage for the stale-derived-rollup leak.

## QA / Validation

- `npx jest src/lib/atlas/__tests__/tower-budget-rollup-resolution.test.ts --runInBand` passed.
- `npx eslint src/lib/atlas/tower-grounding.ts src/lib/atlas/__tests__/tower-budget-rollup-resolution.test.ts` passed.
- `npm run release:check` must pass before PR merge.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. Browser proof should confirm the Tower headline and budget/function slices come from the same governed source.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual ACA mutation approved by this record.
- Approved image digest: produced by main deploy workflow.
- ACA runtime invariant: 100% traffic must point at the digest-pinned main image.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower dashboard consistency check.

## Rollback Plan

Revert the PR if the governed-rollup precedence causes a regression. Derived initiative rollups remain available in code as a fallback path when no governed rows exist.

## Audit Evidence

- PR URL: to be attached after PR creation.
- Local targeted Jest and ESLint output.
- Post-deploy ACA revision/image/traffic proof.
- Signed-in Tower browser proof showing no stale derived function-slice totals.

## Known Gaps

This release fixes the source-selection seam only. It does not add missing Tower facts or change the underlying tenant datasets.
