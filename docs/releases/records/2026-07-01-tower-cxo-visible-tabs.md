# 2026-07-01-tower-cxo-visible-tabs — Tower CXO Visible Tabs

## Release ID

`2026-07-01-tower-cxo-visible-tabs`

## Status

`candidate`

## Plain-English Summary

This release puts the compact Tower tabs on the actual governed CXO page path. The prior compact polish updated the legacy fallback dashboard tab row, but the live signed-in page renders the governed CXO command-center view. This follow-up adds visible section tabs directly to that governed page: Value, Budget, Portfolio, Benchmark, Evidence, and Ask aVa.

## Layer Impact

- `global-control-lane`: Updates the shared Tower surface used by signed-in clients.
- `client-data-lane`: No schema, ingestion, measure, dossier, or calculation changes. Existing governed Tower view-model data continues to drive all sections.

## Client Applicability

- All clients: Tower governed CXO view tab visibility applies globally.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Adds compact visible tabs to the governed CXO command-center page.
  - Keeps tab copy short and aligned to the existing Tower color palette.
  - Switches between existing governed sections without adding mock data or new math.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
  - Adds regression coverage proving the governed CXO tabs render and Portfolio content appears after selecting the Portfolio tab.

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` — passed, 11/11 tests.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — passed with existing Tower unused-code warnings, no errors.
- `git diff --check` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy lane build and deploy the exact main SHA image, then verify `https://app.abarva.ai/tower` in the signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required before declaring deployed.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower page screenshot and DOM checks showing tabs are visible.

## Rollback Plan

Revert this UI-only commit and redeploy the previous approved main image. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA runtime proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This is a visibility/interaction fix for the governed Tower page tabs. It does not change Tower data quality, governed calculations, or aVa answer logic.
