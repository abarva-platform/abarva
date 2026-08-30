# 2026-08-30-source-impact-coverage-fallback — Source Impact Coverage Fallback

## Release ID

`2026-08-30-source-impact-coverage-fallback`

## Status

`candidate`

## Plain-English Summary

Source workspace impact rendering now treats old coverage-only rows as incomplete when action candidates, claim cards, storyline rows, and aVa grounding bundles are missing. The workspace may still preserve coverage rows, but it derives the executive impact layer from governed Source and consumption read models instead of showing zero impact objects.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: updates the Source workspace reader only. It does not change schemas, loaders, tenant data, canonical facts, or calculation logic.

## Client Applicability

- All clients: yes, for Source workspace rendering when coverage-only impact rows exist.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`

## QA / Validation

Validation status before release:

- ESLint for the touched Source workspace files: passed.
- Focused Jest coverage for the Source workspace ECL portfolio adapter: passed.
- `npm run release:check`: passed.
- Signed-in production proof after ACA deployment to confirm Source workspace shows derived claim cards and aVa grounding rows without cross-tenant leakage: not run.

## Rollout Plan

Merge through PR, then use the repo-owned Azure Container Apps main deploy workflow. No data-plane job or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: resolved by the workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the Source workspace reader change and redeploy through the same ACA workflow. Since there is no schema or data mutation, rollback is code-only.

## Audit Evidence

Audit evidence will be the PR, workflow run, ACA runtime invariant, and signed-in Source workspace proof folder captured after deployment.

## Known Gaps

This release does not create new data, refresh cubes, or alter prebuilt impact views. It only prevents coverage-only rows from suppressing the derived executive impact layer.
