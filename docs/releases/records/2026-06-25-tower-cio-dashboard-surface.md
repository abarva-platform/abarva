# 2026-06-25-tower-cio-dashboard-surface — Tower CIO Dashboard Surface

## Release ID

`2026-06-25-tower-cio-dashboard-surface`

## Status

`candidate`

## Plain-English Summary

Tower now opens as a CIO portfolio command center instead of an AI-only portfolio canvas. The page keeps the shared aVa dock on the left and adds a dashboard view selector for Overview, Portfolio, Budget, Vendors, AI ROI, Outcomes, and Risks. Each view reads the existing Tower initiatives and vendor rows, shows loaded slices, and names missing data as gaps instead of filling with fixture values.

## Layer Impact

- `global-control-lane`: Updates the shared Tower application surface for all tenants.
- UI/read-model presentation: Re-slices existing Tower read-model props in the client component; no database schema, migration, or ingestion path changed.

## Client Applicability

- All clients: Yes, wherever `/tower` renders the shared `TowerIndexPage`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; active when the Tower page deploys.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: adds CIO dashboard view model, view selector, metric cards, portfolio/budget/vendor/AI ROI/outcome/risk panels, and command-center masthead.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: focused render coverage for the CIO dashboard, AI ROI view, aVa branding, and non-AI program coverage.

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed. Note: Jest reports pre-existing duplicate manual mock warnings for markdown mocks.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` passed with warnings from old unused Tower canvas helpers left in file for compatibility cleanup.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from the exact merge SHA, deploy to `ca-abarva-web-lab-eastus`, move 100% traffic to the new healthy revision, then run signed-in browser proof on `/tower` for at least Lakeshore and SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be recorded by the ACA deploy.
- ACA runtime invariant: Template image, 100% traffic revision image, and approved digest must match.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/tower` command-center surface with aVa dock and CIO dashboard views.

## Rollback Plan

Revert this PR and redeploy the prior approved `main` image digest through the ACA deploy path. No data rollback is required because this release is presentation-only.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision/digest: pending.
- Browser screenshots: pending after deploy.

## Known Gaps

- Existing old Tower canvas helpers remain in the file as unused warnings and should be pruned in a cleanup PR once this surface is browser-proven.
- Run/change and detailed AI spend benchmarking depend on explicit fields in the Tower read model; this release names those as gaps when absent.
