# 2026-06-28-tower-value-proof-honesty — Tower Value Proof Honesty

## Release ID

`2026-06-28-tower-value-proof-honesty`

## Status

`candidate`

## Plain-English Summary

Tower no longer compares proven value against the total IT budget/spend envelope. The value-proof gap now compares committed initiative value against proven/measured value only, so a tenant cannot see contradictory claims such as "proven value is above the business case" and "$142M unproven" at the same time.

## Layer Impact

- `global-control-lane`: updates the shared Tower dashboard math and regression coverage for every tenant using Tower.
- `client-data-lane`: no data migration or reload. Existing tenant Tower values are interpreted more accurately by the UI.

## Client Applicability

- All clients: yes, Tower value-proof display behavior is global.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: changes the Value gap card and daily-read proof headline to use committed initiative value minus measured value instead of total IT spend minus measured value.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: adds regression coverage for the over-proven case so Tower shows "above committed value" instead of labeling the surplus as unproven.

## QA / Validation

- `npx prettier --write src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: passed.
- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`: passed, 7 tests.
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

This PR corrects value-proof interpretation. It does not reload or enrich tenant Tower datasets; missing committed value, measured value, budget split, or renewal fields remain visible as gaps.
