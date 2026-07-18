# 2026-07-18-tower-duplicate-portfolio-header — Tower: Stop Rendering Two Stacked Page Headers

## Release ID

`2026-07-18-tower-duplicate-portfolio-header`

## Status

`candidate`

## Plain-English Summary

Tower's Portfolio tab was rendering two full page headers stacked back-to-back with no content between them — a "CXO Executive Dashboard" masthead, immediately followed by `CxoGovernedCommandCenter`'s own "Investment Control Tower" header and tab bar. Confirmed via live screenshot on the FS Demo tenant.

Root cause: `showLegacyTowerMasthead` in `TowerIndexPage.tsx` only suppressed the legacy masthead when `towerMartView` was present, but the render logic actually falls through to `CxoGovernedCommandCenter` — which ships its own equivalent header — whenever `cxoView` is present and `towerMartView` is not. The flag was written for the `towerMartView` path only and never updated when the `cxoView` fallback started shipping its own header too.

Fix: `showLegacyTowerMasthead` now also excludes the `cxoView` fallback case, so the legacy masthead only renders for the final `CioDashboardTabs`/`CioDashboardPanel` fallback path, which has no header of its own.

## Layer Impact

- `global-control-lane`: `TowerIndexPage.tsx` is the shared Tower portfolio surface for every tenant.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: `showLegacyTowerMasthead` condition widened from `towerMartView` to `(towerMartView || cxoView)`. One-line change, no other logic touched.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`: added a guard assertion (`queryByText("CXO Executive Dashboard")` → `.not.toBeInTheDocument()`) to the existing `cxoView`-only test case. Confirmed this assertion genuinely catches the bug — reverting the fix while keeping the assertion makes the test fail with the exact duplicate heading found in the DOM, proving this isn't a tautological check.

## QA / Validation

- Pass: `npx eslint` on both touched files — 0 errors; 29 pre-existing warnings in `TowerIndexPage.tsx` confirmed unrelated via `git stash` against clean `origin/main` (identical warning count before and after).
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — 16/16, including the new guard assertion.
- Pass: `npx jest src/components/tower` (full directory sweep) — 25/25, no regressions.
- Rigorously confirmed the fix is real and necessary: reverted `TowerIndexPage.tsx` while keeping the new test assertion — the test fails, showing the exact duplicate `<h1>CXO Executive Dashboard</h1>` in the rendered output, matching the reported screenshot precisely.
- Not run: live signed-in browser proof (no valid local Clerk session in this environment) — flag as pending, same as every other PR this session.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job — pure UI condition fix.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — open Tower's Portfolio tab for a tenant on the `cxoView` path (e.g. FS Demo) post-deploy and confirm only one page header renders above the tab bar.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff.
- `TowerCioDashboardSurface.test.tsx` full pass (16/16) plus full Tower directory sweep (25/25).
- Before/after test comparison proving the bug and the fix are both real.
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- Did not audit whether `TowerMartCommandCenter` (the sibling primary path, when `towerMartView` is present) has any analogous header-duplication risk of its own — out of scope for this fix, which only closes the specific `cxoView` fallback gap confirmed in the screenshot.
