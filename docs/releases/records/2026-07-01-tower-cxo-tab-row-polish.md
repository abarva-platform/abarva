# 2026-07-01-tower-cxo-tab-row-polish — Tower CXO Tab Row Polish

## Release ID

`2026-07-01-tower-cxo-tab-row-polish`

## Status

`candidate`

## Plain-English Summary

This release removes the changing descriptive text in front of the Tower CXO tabs, centers the tab row so it does not shift left or right when a tab is selected, and tightens the executive operating card by removing the extra explanatory paragraph.

## Layer Impact

- `global-control-lane`: Updates the shared signed-in Tower surface.
- `client-data-lane`: No data schema, ingestion, measure calculation, or aVa answer change.

## Client Applicability

- All clients: Tower CXO layout polish applies globally.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Removes the per-tab descriptive sentence before the tab row.
  - Centers the tab row and gives tabs stable width to prevent jumping.
  - Reduces tab font/padding slightly.
  - Tightens the executive operating card and removes its extra body copy.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
  - Adds regression coverage proving the removed descriptive copy stays absent.

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
- Live signed-in proof required: Yes, Tower page screenshot and DOM checks.

## Rollback Plan

Revert this UI-only commit and redeploy the previous approved main image. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA runtime proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This is presentation polish only. It does not change the governed Tower data model, source evidence, or aVa chat behavior.
