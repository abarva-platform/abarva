# 2026-07-16-moves-p0-promote-contrast — Moves P0 Promote Button Contrast

## Release ID

`2026-07-16-moves-p0-promote-contrast`

## Status

`candidate`

## Plain-English Summary

Fixes the P0 Originate footer so the black `Promote to P1 Charter` button keeps its label and arrow visible in white bold text. The previous footer rule styled every span inside the promotion area, including the button text, which made the label appear muted on the black button.

## Layer Impact

- Lane: `global-control-lane`
- Product UI: Strategic Moves P0 Originate visual state only. This is shared Moves control-plane behavior, not client-specific data.
- Runtime routing/data: No change.

## Client Applicability

- All clients: Yes, wherever Strategic Moves P0 Originate is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/StrategicMoves.module.css`

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`; the repo-owned `ACA main deploy` workflow builds and deploys the digest-pinned image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, confirm the P0 Promote button label is visible in the signed-in Moves UI.

## Rollback Plan

Revert this PR or redeploy the previous good `main` SHA through the ACA main deploy workflow.

## Audit Evidence

- PR URL: Pending.
- Deployment proof: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

This fixes button contrast only. It does not change P0 routing, gate approval behavior, the Meridian cheat sheet, or phase content.
