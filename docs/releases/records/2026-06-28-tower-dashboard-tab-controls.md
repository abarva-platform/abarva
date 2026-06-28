# 2026-06-28-tower-dashboard-tab-controls — Tower Dashboard Tab Controls

## Release ID

`2026-06-28-tower-dashboard-tab-controls`

## Status

`candidate`

## Plain-English Summary

The Tower CIO command center already rendered the new dashboard, but browser proof showed the view tabs could appear inert in the live surface. This release changes those dashboard tabs from navigation links to explicit client-side controls so Overview, Portfolio, Budget, Vendors, and AI ROI immediately switch the visible dashboard content while still updating the URL.

## Layer Impact

- `global-control-lane`: Tower surface behavior changes for every tenant using the shared Tower page.
- `client-data-lane`: No schema, ingestion, or tenant data changes.

## Client Applicability

- All clients: Yes, shared Tower UI behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: dashboard tabs now call a shared `onSelect` handler that updates local dashboard state and pushes the shareable Tower URL.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: test now clicks the Budget dashboard control and asserts the Budget view renders.

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` passed: 8 tests.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` passed with existing warnings and no errors.
- `npm run release:check` required before merge.
- Signed-in browser proof required after ACA deployment to confirm each Tower dashboard tab changes content for Lakeshore and SkyHarbor.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the main image, then verify `app.abarva.ai/tower` in signed-in browser sessions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None introduced.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must pass in the main deploy workflow.
- Worker image invariant: Unchanged; worker jobs are updated by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower tab proof for Lakeshore and SkyHarbor.

## Rollback Plan

Revert the PR and redeploy main. The rollback restores link-based dashboard tabs without touching tenant data.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4111
- CI: focused Jest, ESLint, release check, and PR checks.
- Runtime proof: signed-in screenshots and crawl report under `/Users/anand/Downloads/tower-command-center-proof-20260628/` after deployment.

## Known Gaps

None known for the tab-switching defect. Broader Tower data quality remains governed by the Tower source-file and dossier refresh lane.
