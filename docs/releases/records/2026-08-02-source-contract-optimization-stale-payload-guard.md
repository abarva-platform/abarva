# 2026-08-02-source-contract-optimization-stale-payload-guard — Hotfix: guard against a stale persisted profile crashing the live event page

## Release ID

`2026-08-02-source-contract-optimization-stale-payload-guard`

## Status

`candidate`

## Plain-English Summary

Immediate follow-up to `2026-08-02-source-contract-optimization-canvas-wiring`
(PR #5878), deployed minutes earlier. Live signed-in verification found that
change had broken the SkyHarbor contract-optimization event page: the
persisted `profile_payload` snapshot for that event predates the
`visualInsights` field the panel component reads unconditionally, so the page
threw an unhandled `TypeError` and became unusable.

This hotfix validates the exact fields `ContractOptimizationProfilePanel`
reads before returning a persisted profile as renderable. A stale/incompatible
snapshot now degrades to "no profile" (the page's pre-#5878 baseline, honest
and non-crashing) instead of crashing the page.

## Layer Impact

- `global-control-lane`: same shared read path introduced in #5878.

## Client Applicability

- All clients: shared code path; behavior only differs for the SkyHarbor
  demo event, which currently has a stale snapshot and will now render
  without the profile panel (rather than crashing) until that data is
  refreshed through the approved load-script/ACA-job path.

## Changes Included

- `src/lib/source/contract-optimization/read.ts`: added
  `isRenderableContractOptimizationProfile` validation.
- `src/lib/source/contract-optimization/__tests__/read.test.ts` (new): 5
  tests, including one that reproduces the exact live regression.

## QA / Validation

- PASS: `npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npx eslint src/lib/source/contract-optimization/read.ts src/lib/source/contract-optimization/__tests__/read.test.ts`
- PASS: `npx jest src/lib/source/contract-optimization/__tests__/read.test.ts` (5/5)
- Live signed-in proof: pending post-deploy (this record is filed before the
  merge/deploy that will prove it, consistent with the fast-follow nature of
  this hotfix).

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys
automatically.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked
  `released` — the event page must load without error, and the panel's
  absence (until the underlying data is refreshed) must be silent, not a
  crash.

## Rollback Plan

Code rollback by reverting the PR. No data mutation.

## Audit Evidence

- Console error captured during live verification of PR #5878 (`TypeError:
Cannot read properties of undefined (reading 'exposureByDriver')`).
- This PR's diff and CI run.
- Post-deploy: live signed-in screenshot confirming the event page loads.

## Known Gaps

- The panel will not render for this SkyHarbor event until its persisted
  `profile_payload` is refreshed via the approved load-script/ACA-job path so
  it includes `visualInsights` and the other fields this guard checks. That
  refresh is separate follow-up work, not part of this hotfix.
