# 2026-07-17-tower-exhibit-quality-polish — Tower Exhibit Quality Polish

## Release ID

`2026-07-17-tower-exhibit-quality-polish`

## Status

`candidate`

## Plain-English Summary

Tower's Meridian command center now presents the AI portfolio and decision-lane exhibits with a clearer executive story. The AI portfolio matrix uses collision-safe, lane-aware placement instead of overlapping dots, the right-side watchlist no longer clips action labels, and decision lanes use a compact lane board instead of oversized empty cards. Value language is tightened around claimable value gates so the page does not imply realized value.

## Layer Impact

- Presentation layer: updates Tower React rendering for the command-center exhibit, AI portfolio exhibit, and decision-lane exhibit.
- Read-model interpretation layer: normalizes the Tower mart headline from realized-value wording to claimable-value wording without changing source numbers.
- Data layer: no schema, mart, Azure/Postgres, source-template, or data-plane mutation.

## Client Applicability

- All clients: Tower presentation pattern is shared.
- Specific clients: Healthcare Demo / Meridian is the proof tenant for this change.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/lib/cio-tower/tower-mart-view-model.ts`

## QA / Validation

- `npm test -- --runInBand src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — passed.
- `npx eslint src/components/tower/TowerIndexPage.tsx src/lib/cio-tower/tower-mart-view-model.ts` — passed with existing Tower warnings, no errors.
- `npx tsc --noEmit --pretty false` — passed.
- `git diff --check` — required before merge.
- `npm run release:check` — required before merge.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`, shifts traffic to the new healthy revision, and captures runtime invariant proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: produced by ACA main deploy workflow after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: yes, Healthcare Demo / Meridian Tower

## Rollback Plan

Revert the PR or redeploy the previous known-good ACA revision through the approved main deploy lane. No database or data-plane rollback is required because the change is presentation/read-model language only.

## Audit Evidence

- PR URL: to be added when opened.
- Focused Tower Jest output.
- ESLint and TypeScript output.
- ACA runtime invariant artifact after merge/deploy.
- Signed-in Healthcare Demo Tower screenshots for Command Center, Value Proof Funnel, Decision Lanes, and AI Portfolio after deploy.

## Known Gaps

This is not the full Tower mart/data-layer redesign. It does not add Copilot, Workday, SAP, ServiceNow, or GitHub usage feeds; those should be modeled as source-adapter inputs for AI spend, usage, adoption, and benefits realization.
