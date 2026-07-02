# 2026-07-01-tower-cxo-compact-polish — Tower CXO Compact Polish

## Release ID

`2026-07-01-tower-cxo-compact-polish`

## Status

`candidate`

## Plain-English Summary

This release tightens the Tower landing experience so it reads more like a CIO command center and less like an internal proof page. It removes fake date/time chrome, removes repeated Tower command-center labels, reduces tab size, adds a compact Visuals tab for governed chart-style slices, and keeps the existing AbarVa Tower colors and data bindings.

## Layer Impact

- `global-control-lane`: Updates the shared Tower surface used by signed-in clients.
- `client-data-lane`: No data schema, ingestion, or measure calculation changes. Existing governed Tower data continues to drive the cards, tables, and aVa parity path.

## Client Applicability

- All clients: Tower page visual polish applies globally.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Removes fake `12:00 AM` and displayed day/date masthead copy.
  - Collapses repeated `Tower · CIO command center` labels.
  - Reduces Tower masthead and tab sizing.
  - Adds a compact `Visuals` dashboard tab backed by existing governed Tower model slices.
  - Tightens governed CXO card and section spacing.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
  - Adds regression coverage for clutter removal and the compact Visuals tab.

## QA / Validation

- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` — passed, 11/11 tests.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/app/'(maestro)'/tower/page.tsx` — passed with existing Tower component unused-code warnings, no errors.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — repo-wide run reached existing unrelated dependency/type gaps (`js-yaml`, Azure Document Intelligence package, `@axe-core/playwright`); no Tower patch type errors were introduced in the touched files.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps deploy lane build the exact main SHA image, then verify `https://app.abarva.ai/tower` in the signed-in browser.

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

This is a Tower presentation polish release. It does not change the governed CIO Tower measure model, source ingestion, aVa answer contract, or underlying data quality.
