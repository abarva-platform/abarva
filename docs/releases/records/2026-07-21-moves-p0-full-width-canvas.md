# 2026-07-21-moves-p0-full-width-canvas — Moves P0 Full-Width Canvas

## Release ID

`2026-07-21-moves-p0-full-width-canvas`

## Status

`live-proven`

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
- Pass: production signed-in visual proof on `https://app.abarva.ai/strategic-moves/new` using Meridian agent auth state.
- Pass: live layout measurement at 1600px viewport: left rail `258px`, P0 header/work lane `1342px`, main contract card `1230px` after responsive padding.
- Pass: browser console/page errors: none.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the main image, verify the ACA runtime invariant, then capture signed-in browser proof on `/strategic-moves/new`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:ad40e51b059bcae30ff93cd4cbdbe194f2e8555b6845876ac0b864d2e2adc7cc`.
- ACA runtime invariant: Pass. Template image and 100% traffic revision both used `acrabarvalab001.azurecr.io/abarva/web@sha256:ad40e51b059bcae30ff93cd4cbdbe194f2e8555b6845876ac0b864d2e2adc7cc`.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No migration rollback is required because this release does not change database schema, evidence storage, or origination submit APIs.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5225`.
- Merge SHA: `c967dc7bb64ed6c2516fa88c511825b9a85d5bfe`.
- Superseding deployed main SHA: `14090ffdd64b72d5babb8e72976d7ace0d0a6ba7`.
- ACA deploy run: `https://github.com/abarva-platform/abarva/actions/runs/29859862580`.
- ACA revision: `ca-abarva-web-lab-eastus--m14090ffd`.
- Traffic: 100%.
- Runtime proof bundle: GitHub artifact `aca-main-deploy` from run `29859862580`; local verification copy at `/tmp/aca-main-deploy-29859862580-1784661106`.
- Live screenshot: `/Users/anand/Downloads/moves-p0-full-width-live-proof-2026-07-21/p0-full-width-m14090ffd.png`.
- Validation output: local command output in the Codex task.

## Known Gaps

- This only fixes P0 canvas width usage. It does not migrate P1-P5 to the universal shell.
