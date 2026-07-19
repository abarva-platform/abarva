# 2026-07-19-tower-ai-value-realization-claim-gate — Tower AI Value Runtime Claim Gate

## Release ID

`2026-07-19-tower-ai-value-realization-claim-gate`

## Status

`candidate`

## Plain-English Summary

Tower now treats the richer AI tools, program usage, interview, KPI, and benefits evidence as value-realization evidence without confusing it with booked or claimable value. The runtime fallback projection can read SA08 AI benefits rows, exposes partial finance validation separately, and keeps claimable realized value at zero unless the source row explicitly allows realized value. Lakeshore aliases also resolve to the canonical Lakeshore Holdings tenant key instead of the retired Lakeshore Industries key, and Morgan Street no longer falls through to Lakeshore.

## Layer Impact

- `global-control-lane`: Updates shared Tower runtime canonicalization and fallback metric wording for all clients.
- `client-data-lane`: Extends the V7/Tower fallback projection to recognize SA08-SA11 source adapter dimensions when they are present in the governed business-record layer. It does not load, mutate, or promote tenant data.
- `public-demo`: Improves demo safety by preventing usage/interview/partial-validation rows from appearing as proven or realized value.

## Client Applicability

- All clients: Tower runtime aliases, metric labels, and claim-gate fallback behavior.
- Specific clients: Lakeshore receives canonical key cleanup from retired `lakeshore-industries` runtime aliases to `lakeshore-holdings`.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/tower/v7-tower-projection.ts`
  - Adds SA08-SA11 dimension recognition.
  - Adds SA08 benefits-row projection.
  - Adds strict claim-gated value logic.
  - Adds `partial_finance_validated_value_ytd` as a separate metric packet.
- `src/lib/cio-tower/metric-packet.ts`
  - Updates Lakeshore aliases to canonical `lakeshore-holdings`.
- `src/lib/cio-tower/answer.ts`
  - Updates Lakeshore aliases and removes Morgan-to-Lakeshore fallback.
- `src/components/tower/TowerIndexPage.tsx`
  - Renames fallback dashboard wording from proven value to claimable value.
- Focused Tower tests updated to lock the new behavior.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/tower/__tests__/v7-tower-projection.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx --runInBand`
  - Passed: 4 suites, 36 tests.
  - Note: Jest emitted the existing duplicate manual mock warnings for markdown/GFM mocks.
- `npx eslint src/lib/tower/v7-tower-projection.ts src/lib/cio-tower/metric-packet.ts src/lib/cio-tower/answer.ts src/components/tower/TowerIndexPage.tsx src/lib/tower/__tests__/v7-tower-projection.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx src/components/tower/charts/__tests__/TowerCxoCharts.smoke.test.tsx`
  - Passed with existing Tower component unused-symbol warnings; no errors.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
  - Passed.
- `git diff --check`
  - Passed.

## Rollout Plan

Merge to `main` through the normal PR lane. The repo-owned Azure Container Apps main deploy workflow will build and deploy the next digest-pinned image to the shared Product/Lab runtime. No migration or tenant data-load job is included in this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after the repo-owned deploy workflow builds the merged SHA.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower page for at least Meridian and Lakeshore after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main lane. No schema rollback or data cleanup is required because this release does not write database state.

## Audit Evidence

- PR URL: pending.
- Focused Jest, ESLint, TypeScript, and whitespace validation output from this branch.
- Post-merge deploy run, ACA revision, image digest, and signed-in Tower screenshots to be attached after deployment.

## Known Gaps

- Existing source-data folders still include a retired `datasets/tenant-inputs/active/lakeshore-industries` packet. This PR stops Tower runtime canonicalizers from preferring that alias, but the physical source cleanup should remain a separate client-data cleanup task.
- This PR does not run the ACA data-build job or refresh `cio_tower.mart_*` rows. It hardens the runtime and fallback projection for the richer AI value inputs already present.
