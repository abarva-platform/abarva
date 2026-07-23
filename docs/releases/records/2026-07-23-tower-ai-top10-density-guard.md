# 2026-07-23-tower-ai-top10-density-guard — Tower AI Portfolio top-10 density guard

## Release ID

`2026-07-23-tower-ai-top10-density-guard`

## Status

`candidate`

## Plain-English Summary

The Tower Command Center AI Portfolio now treats the bubble matrix as an executive focus view, not
as a full inventory plot. For the current AI type filter, the matrix shows only the top 10
initiatives by governed value/readiness policy. The scrollable side list still shows the full
filtered set, and the header states the boundary, for example `10 on matrix · 80 in filtered list`.

The candidate pipeline also caps the displayed candidate opportunities at top 10 while preserving
the true total candidate count.

## Layer Impact

- `global-control-lane`: presentational behavior in the Tower Command Center AI Portfolio view.
- `experimental`: only tenants enabled for `tower_command_center_v2` see this surface.

No schema change, no data mutation, no new runtime read path, and no model behavior change.

## Client Applicability

- All clients: no.
- Specific clients: Meridian currently; future enabled tenants inherit the guard.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `tower_command_center_v2`.

## Changes Included

- `src/components/tower/command-center/views/AiPortfolioView.tsx`: top-10 matrix cap for the
  current filter, while keeping the full filtered side list visible.
- `src/lib/tower/command-center/view-model.ts`: candidate display cap reduced from 20 to 10.
- `src/lib/features/registry.ts`: flag summary updated to reflect restored aVa and top-10 density
  behavior.
- Focused regression tests for candidate counts and dense matrix messaging.

## QA / Validation

Passed locally:

- `npm test -- --runTestsByPath src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/css-contract.test.ts --runInBand`
- `npx eslint src/lib/tower/command-center src/components/tower/command-center src/lib/features/registry.ts`
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc -p tsconfig.json --noEmit`
- `npm run release:check`
- `npm run audit:enterprise-naming`
- `git diff --check`

Note: Jest emitted the repo's pre-existing duplicate manual mock warnings for markdown/GFM mocks;
the focused Tower suites still passed.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned
image. The feature remains tenant-gated.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: unchanged.
- Feature/env flag update path: `tower_command_center_v2` include-tenants list.
- Live signed-in proof required: yes for any newly enabled tenant.

## Rollback Plan

Revert this PR to restore the previous matrix behavior. For emergency tenant rollback, remove the
tenant from `tower_command_center_v2` include-tenants and `/tower` returns to the previous Tower
surface.

## Audit Evidence

To be added after PR open and CI/deploy.

## Known Gaps

This does not yet add richer slice/dice controls beyond the existing type filters. Recommended next
slice is a second-level filter for posture or evidence status if the next tenant still has more
than 10 relevant initiatives after type filtering.
