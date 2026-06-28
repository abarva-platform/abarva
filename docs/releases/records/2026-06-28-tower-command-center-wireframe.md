# 2026-06-28-tower-command-center-wireframe — Tower CIO Command Center Wireframe

## Release ID

`2026-06-28-tower-command-center-wireframe`

## Status

`candidate`

## Plain-English Summary

Tower now follows the supplied CIO command-center wireframe more closely: five focused views, a stronger daily-read story, less prompt clutter on the dashboard canvas, and clearer separation between real loaded values and missing Tower fields. The dashboard no longer exposes the old Outcomes/Risks/Board tab set on the right-side command center.

## Layer Impact

- `global-control-lane`: updates the shared Tower React surface for every tenant using the Tower module.
- `client-data-lane`: reads the same tenant-bound Tower initiative, vendor, and budget-rollup data; no migration or data rewrite is included.

## Client Applicability

- All clients: yes, Tower surface behavior is global.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: replaces the old eight-view dashboard switcher with the five-view command center: Overview, Portfolio, Budget, Vendors, AI ROI.
- `src/components/tower/TowerIndexPage.tsx`: adds the daily-read value-proof hero and trust frame, uses budget rollups for run/change and OpEx/CapEx slices, and removes the dashboard-side scenario prompt block.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: updates regression coverage for the new five-view command center, budget-rollup split rendering, aVa branding, raw-ID suppression, and no Atlas fallback.

## QA / Validation

- `npx prettier --write src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: passed.
- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`: passed, 6 tests.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: passed with existing Tower unused-code warnings, no errors.

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

This PR improves the Tower command-center surface and data-honesty behavior. It does not reload or repair tenant Tower datasets; missing fields remain visible as gaps instead of being displayed as fake zeroes.
