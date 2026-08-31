# 2026-08-31-tower-zero-claim-denominator-gap — Tower Zero-Claim Denominator Gap

## Release ID

`2026-08-31-tower-zero-claim-denominator-gap`

## Status

`candidate`

## Plain-English Summary

The Tower decision rail now treats an empty value-claim population as a missing input rather than a
completed proof state. When no claims are loaded, the executive headline, benefit cards, usage
evidence card, and review decision list withdraw denominator-based findings instead of rendering
phrases such as `0 of 0` or assigning review actions to zero claims.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS only. The change affects Tower command-center rendering and regression coverage.
It does not change schemas, loaders, tenant rows, serving views, policies, migrations, or runtime
data access.

## Client Applicability

- All clients: yes, wherever the Tower command-center surface is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/views/CommandCenterView.tsx`
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`

## QA / Validation

Status: PASS.

- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
- PASS — `npx eslint src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit --pretty false`
- PASS — `node scripts/release-check.mjs --base origin/main --head HEAD`
- PASS WITH PRE-EXISTING BASELINE FAILURES — `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower src/lib/tower --runInBand --silent` matched the known Tower baseline at 6 failing suites and 21 failing tests; this change added one passing regression test.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow will
publish the rendering change after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, for the Tower command-center decisions surface.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No data rollback is
required.

## Audit Evidence

Inspect the PR diff, focused regression output, release-control output, ACA deploy evidence, and a
signed-in Tower command-center proof after deployment.

## Known Gaps

This change only hardens the empty-denominator rendering path in the Tower command-center decision
rail. It does not change upstream claim loading, source-data quality, or the governed Tower
projection counts.
