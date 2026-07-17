# 2026-07-17-tower-ai-portfolio-full-mart-selection — Tower AI Portfolio Full-Mart Selection

## Release ID

`2026-07-17-tower-ai-portfolio-full-mart-selection`

## Status

`candidate`

## Plain-English Summary

The first Tower Command Center story fix improved the AI Portfolio language, but live browser proof showed the AI exhibit was still selecting only the first 12 mart rows before it had a chance to rank funded, proof-backed, and candidate items. If the first 12 rows were all candidate opportunities, Tower showed a misleading story: `$53.7M` AI spend lens with `0` funded/proof rows. This release lets the AI exhibit read the full Tower AI mart first, then select the executive watchlist.

## Layer Impact

- Presentation layer: fixes AI Portfolio row selection so funded/proof rows are not hidden by candidate-row ordering.
- Runtime read layer: no database schema, Azure data-plane, Tower mart, candidate load, or Active Tenant Access behavior changes.
- Governance layer: preserves the same candidate boundary and realized-value gate.

## Client Applicability

- All clients: shared Tower Command Center renderer.
- Specific clients: Healthcare Demo / Meridian is the live proof tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
- `docs/releases/records/2026-07-17-tower-ai-portfolio-full-mart-selection.md`

## QA / Validation

- Focused Tower Jest coverage: pass — `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` (known duplicate manual mock warnings only).
- TypeScript check: pass — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- ESLint on modified Tower files: pass with pre-existing warnings — `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`.
- `git diff --check`: pass.
- `npm run release:check`: pass.

## Rollout Plan

Merge through the protected PR lane. After merge, the repo-owned Azure Container Apps main deploy workflow should build and deploy the image. Signed-in browser proof should verify Healthcare Demo / Meridian Tower AI Portfolio shows the funded/proof story when funded rows are not first in source order.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured by ACA deploy workflow.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Tower Healthcare Demo / Meridian.

## Rollback Plan

Revert the PR or roll ACA traffic back to the prior known-good digest through the approved ACA rollback path. No data rollback is required because this is a presentation-only change.

## Audit Evidence

- PR URL after opening.
- Focused test output.
- ACA revision and digest after deploy.
- Signed-in browser screenshots after deploy.

## Known Gaps

This does not reload or redesign the Tower Azure data mart. It fixes the AI Portfolio renderer selecting too few rows before ranking the story.
