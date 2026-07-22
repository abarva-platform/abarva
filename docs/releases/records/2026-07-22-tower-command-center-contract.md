# 2026-07-22-tower-command-center-contract — Tower Command Center Contract Surface

## Release ID

`2026-07-22-tower-command-center-contract`

## Status

`candidate`

## Plain-English Summary

Tower now routes mart-backed tenants to a new Command Center surface built from the provided Tower design contract. The page is organized as an executive operating view: command posture, value proof funnel, decision lanes, AI portfolio, recommended actions, and evidence posture. The old Tower mart surface is no longer used as the runtime fallback when a Tower mart view is available.

## Layer Impact

- Release lane: `global-control-lane`.
- Presentation layer: adds a new Recharts-backed Tower Command Center contract component and wires the Tower route to use it for `TowerMartCommandViewModel` data.
- Read-model consumption layer: continues to read the existing Tower mart view model produced by the server read path. This release does not add, mutate, or promote Tower mart data.
- Agent shell layer: keeps the aVa chat dock collapsed by default so the dashboard is workflow-led rather than chat-led.

## Client Applicability

- All clients: tenants with a populated Tower mart view receive the new Tower Command Center surface after deployment.
- Specific clients: Healthcare Demo / Meridian remains the primary browser-proof target because its mart is currently the most complete Tower demo data set.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new feature flag.

## Changes Included

- Adds `src/components/tower/TowerCommandCenterContract.tsx`.
- Updates `src/components/tower/TowerIndexPage.tsx` to route `towerMartView` to the new contract surface.
- Updates `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` to prove the new surface replaces the archived reference-pack/mart fallback behavior.
- No migrations.
- No ACA Job writes.
- No Active Tenant Access update.

## QA / Validation

- `npm test -- --runInBand src/lib/cio-tower src/components/tower` passed: 12 test suites, 112 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- `npx eslint src/components/tower/TowerCommandCenterContract.tsx src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` passed with warnings from archived legacy Tower code that is no longer routed.
- `git diff --check` passed.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the new image to Azure Container Apps. After the workflow finishes, verify the ACA runtime invariant and run signed-in Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be captured after ACA deploy.
- ACA runtime invariant: required after deploy before claiming live proof.
- Worker image invariant: not changed.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, `/tower` for Healthcare Demo / Meridian, including all Tower tabs.

## Rollback Plan

Revert the PR or restore the previous Tower route branch in `TowerIndexPage.tsx`. No data rollback is required because this release does not write to Postgres, Azure AI Search, Blob, or the Tower mart tables.

## Audit Evidence

- Local test log: `/tmp/tower-command-tests.log`.
- Local typecheck log: `/tmp/tower-command-tsc.log`.
- Local lint log: `/tmp/tower-command-eslint.log`.
- PR URL and ACA deploy evidence to be added after PR creation and deployment.

## Known Gaps

- Live signed-in browser proof is pending ACA deployment.
- Archived legacy Tower functions remain in `TowerIndexPage.tsx` and are no longer routed for mart-backed tenants; a later cleanup PR can physically remove that legacy code after the new surface is proven live.
