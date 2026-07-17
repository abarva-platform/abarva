# 2026-07-17-tower-command-center-story-fix — Tower Command Center Story Fix

## Release ID

`2026-07-17-tower-command-center-story-fix`

## Status

`candidate`

## Plain-English Summary

Tower's Command Center was technically rendering the Meridian/Healthcare Tower mart, but the AI Portfolio view did not tell an executive story. It plotted repeated raw rows into a collapsed-looking matrix and repeated internal posture labels such as `Freeze` without explaining the business decision. This release turns that screen into a capital-control exhibit: approved and embedded AI spend, candidate AI ideas, proof signals, and the decision posture are now explained in business language.

## Layer Impact

- Presentation layer: updates the Tower Command Center AI Portfolio exhibit to dedupe repeated display rows, normalize value/readiness points for visible executive scanning, and replace raw posture labels with business-readable actions.
- Runtime read layer: no database schema, Azure data-plane, Tower mart, candidate load, or Active Tenant Access behavior changes.
- Governance layer: keeps the existing value-claim boundary intact; candidate AI remains discovery-only and is not presented as approved funding or realized value.

## Client Applicability

- All clients: Tower Command Center rendering logic is shared.
- Specific clients: Healthcare Demo / Meridian benefits immediately because the current Tower mart AI Portfolio page exposed the issue.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
- `docs/releases/records/2026-07-17-tower-command-center-story-fix.md`

## QA / Validation

- Focused Tower Jest coverage for the Command Center mart path: pass, `npm test -- --runTestsByPath src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` (14/14 tests passed).
- TypeScript check: pass, `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- ESLint on modified Tower files: pass with pre-existing warnings in the large Tower component, `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`.
- `git diff --check`: pass.
- `npm run release:check`: pass.

## Rollout Plan

Merge through the protected PR lane. After merge, the repo-owned Azure Container Apps main deploy workflow should build and deploy the image. Signed-in browser proof should verify the Tower AI Portfolio, Value Proof Funnel, and Command Center views on `https://app.abarva.ai/tower`.

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

This does not reload or redesign the Tower Azure data mart. It fixes how the current Tower mart is communicated in the Command Center. The broader requirement to reconcile every displayed fact back through Azure data layers and updated source templates remains a separate data-plane/mart workstream.
