# 2026-07-21-moves-p0-full-width-canvas — Moves P0 Full-Width Canvas

## Release ID

`2026-07-21-moves-p0-full-width-canvas`

## Status

`candidate`

## Plain-English Summary

Moves P0 Origination now uses the available middle canvas width instead of centering the work area inside a narrow 1040px lane. The left journey rail remains fixed, while the P0 header, mode tabs, and active work card stretch across the remaining page width with responsive padding.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves P0 visual layout for all users who open `/strategic-moves/new`.
- `application-ui`: CSS-only layout polish. No state, API, evidence, gate, generation, or assistant behavior changes.

## Client Applicability

- All clients: Yes, for the P0 new Move route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No. This follows the already-live P0 shell contract.

## Changes Included

- `src/components/strategic-moves/StrategicMoves.module.css`

## QA / Validation

- Pass: `node -e "const fs=require('fs'); const postcss=require('postcss'); const css=fs.readFileSync('src/components/strategic-moves/StrategicMoves.module.css','utf8'); postcss.parse(css,{from:'src/components/strategic-moves/StrategicMoves.module.css'}); console.log('css parse ok')"`
- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand`
- Pending: production signed-in visual proof after ACA deploy.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the main image, verify the ACA runtime invariant, then capture signed-in browser proof on `/strategic-moves/new`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No migration rollback is required because this release does not change database schema, evidence storage, or origination submit APIs.

## Audit Evidence

- PR URL: Pending.
- ACA revision: Pending.
- Live screenshot: Pending.
- Validation output: local command output in the Codex task.

## Known Gaps

- This only fixes P0 canvas width usage. It does not migrate P1-P5 to the universal shell.
