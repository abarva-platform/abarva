# 2026-07-21-moves-p0-new-shell-alignment — Moves P0 New Shell Alignment

## Release ID

`2026-07-21-moves-p0-new-shell-alignment`

## Status

`candidate`

## Plain-English Summary

The Start a Move page now better matches the rest of the Moves phase shell. P0 keeps the existing seven-answer origination contract, but the canvas is wider, the three work sections read like real workflow tabs, and a compact command center explains what the user should do now, what completion means, and whether the Move is ready for P1 gate review.

## Layer Impact

- `global-control-lane`: Shared Moves UI behavior for the P0 origination surface.
- Runtime data model: No change.
- Evidence or generation pipeline: No change.

## Client Applicability

- All clients: No.
- Specific clients: Tenants with the existing Moves Finder-shell flags, including Meridian, SkyHarbor, Lakeshore, and First Capital.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves origination shell path; this release does not add a new feature flag.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/StrategicMoves.module.css`
- PR URL: Pending
- Commit SHA: Pending

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand`
- Pass: `git diff --check`
- Pending: `npx tsc --noEmit --pretty false -p tsconfig.json`
- Pending: `npm run release:check`
- Pending: signed-in browser proof on `https://app.abarva.ai/strategic-moves/new`

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then verify the ACA runtime invariant and signed-in browser-visible P0 page.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable; web UI only.
- Feature/env flag update path: No new flag or env update.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Since there is no data-model, migration, evidence, or generation change, rollback is UI-only.

## Audit Evidence

- PR URL: Pending
- Merge SHA: Pending
- ACA revision: Pending
- Signed-in screenshot: Pending

## Known Gaps

- This release aligns the P0 visual/workflow shell only. It does not change P1-P5 deliverable generation, upload lifecycle, gate approval logic, or synthetic proof data.
