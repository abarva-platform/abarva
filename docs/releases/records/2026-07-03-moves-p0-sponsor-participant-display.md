# 2026-07-03-moves-p0-sponsor-participant-display — Moves P0 Sponsor Participant Display

## Release ID

`2026-07-03-moves-p0-sponsor-participant-display`

## Status

`candidate`

## Plain-English Summary

Moves P0 detail pages now treat the captured origination sponsor text as the user-visible sponsor source when it exists. This prevents a stale resolved participant row from showing a conflicting sponsor below the correct P0 sponsor candidate.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves detail rendering for all tenants using the P0 origination scaffold.
- Product UI: The sponsor/team card suppresses duplicate sponsor-role participants when the charter scaffold already has a captured sponsor candidate.

## Client Applicability

- All clients: Yes, for Strategic Moves detail pages with captured P0 scaffold sponsor text.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveDetailView.tsx`
- `src/components/strategic-moves/__tests__/StrategicMoveDetailView.participants.test.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/StrategicMoveDetailView.participants.test.ts --silent`
- Pass: `npx eslint src/components/strategic-moves/StrategicMoveDetailView.tsx src/components/strategic-moves/__tests__/StrategicMoveDetailView.participants.test.ts`
- Pending: `npm run release:check`
- Pending: production signed-in Moves P0 browser proof after ACA deployment.

## Rollout Plan

Merge to `main`, run the repo-owned Azure Container Apps main deploy workflow, wait for the new revision to become healthy, shift 100% traffic, and rerun the signed-in Industrial Demo Moves P0 pressure proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy on `main`
- Shared runtime mutators: None
- Approved image digest: Pending deploy
- ACA runtime invariant: Required
- Worker image invariant: Required by deploy workflow
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Revert this commit and redeploy through the same ACA main deploy workflow. Rollback only affects display filtering; no data migration is included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4369
- CI run: Pending
- Deployment run: Pending
- Production browser report: Pending

## Known Gaps

This does not change the underlying participant row written at origination. It prevents that resolved participant row from contradicting the captured P0 sponsor candidate in the user-visible detail card.
