# 2026-06-28-tower-visible-label-normalization — Tower Visible Label Normalization

## Release ID

`2026-06-28-tower-visible-label-normalization`

## Status

`candidate`

## Plain-English Summary

Tower now normalizes raw dimension and ownership slugs before showing them in the CIO dashboard. Internal values such as `model_governance` are displayed as human-readable labels such as `Model Governance`, keeping the command center suitable for a CXO audience.

## Layer Impact

- `global-control-lane`: updates shared Tower presentation logic and regression coverage for all tenants.
- `client-data-lane`: no data rewrite. This is a display-normalization fix over existing tenant-bound Tower rows.

## Client Applicability

- All clients: yes, Tower visible label behavior is global.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: applies the shared label normalizer to grouped function/budget labels and program ownership/category rows.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: adds regression coverage proving raw slugs such as `model_governance` and `run_resilience` are not visible in Tower.

## QA / Validation

- `npx prettier --write src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: passed.
- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`: passed, 8 tests.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: passed with existing Tower unused-code warnings, no errors.
- `npm run release:check`: passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy build and publish the image, then verify the deployed `app.abarva.ai/tower` surface signed in for representative tenants.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: active ACA revision image and 100% traffic must match the main deploy digest.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, Tower surface screenshot after ACA deploy.

## Rollback Plan

Revert this PR or redeploy the previous approved main image. No database rollback is required.

## Audit Evidence

- PR and CI evidence to be attached when opened.
- Focused Tower Jest and ESLint output from the candidate branch.
- Post-merge ACA revision/digest and signed-in Tower browser screenshots.

## Known Gaps

This PR normalizes visible labels only. It does not enrich missing spend/value/renewal fields or reload Tower datasets.
