# 2026-07-21-moves-p0-html-contract-shell — Moves P0 Contract Shell

## Release ID

`2026-07-21-moves-p0-html-contract-shell`

## Status

`live-proven`

## Plain-English Summary

Moves P0 Origination now uses the supplied Moves Phase Shell design as the product contract: a persistent left journey rail, phase/workspace sections, centered phase header, Steps/Files/Intelligence tabs, and a two-pane step-detail card. The old P0 question-group wizard is removed from the live P0 path so users are guided through the same shell pattern intended for P0-P5.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves P0 UI shell changes for all users who open `/strategic-moves/new`.
- `application-ui`: Replaces P0 visual structure while preserving existing seven-field origination state, aVa extraction, direct field entry, and `/api/programs/origination-submit` payload behavior.
- `assistant-ui`: Keeps aVa dock integrated with the P0 workspace while making the canvas, not chat, the system of record.

## Client Applicability

- All clients: Yes, for the P0 new Move route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No. P0 now renders the contract shell directly to prevent old-shell drift.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/StrategicMoves.module.css`
- `src/components/strategic-moves/MovePhaseExplorer.tsx`
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
- `src/components/strategic-moves/__tests__/MovePhaseExplorer.finder-shell.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/components/strategic-moves/__tests__/MovePhaseExplorer.finder-shell.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/MovePhaseExplorer.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/components/strategic-moves/__tests__/MovePhaseExplorer.finder-shell.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `node -e "const fs=require('fs'); const postcss=require('postcss'); const css=fs.readFileSync('src/components/strategic-moves/StrategicMoves.module.css','utf8'); postcss.parse(css,{from:'src/components/strategic-moves/StrategicMoves.module.css'}); console.log('css parse ok')"`
- Pass: production signed-in visual proof on `https://app.abarva.ai/strategic-moves/new` using Meridian agent auth state. The browser-visible page rendered the P0 contract shell with phase rail, workspace links, Steps/Files/Intelligence tabs, left step menu, right detail pane, and Approve and Build step.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned Azure Container Apps deploy workflow to build and deploy the main image, verify the ACA runtime invariant, then run signed-in browser proof on `/strategic-moves/new`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:ecb2564d92b870b7411d268d1bb7496dc5b09ec1174284b614174c5873311bd7`.
- ACA runtime invariant: Pass. Template image and 100% traffic revision both used `acrabarvalab001.azurecr.io/abarva/web@sha256:ecb2564d92b870b7411d268d1bb7496dc5b09ec1174284b614174c5873311bd7`.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No migration rollback is required because this release does not change database schema, evidence storage, or origination submit APIs.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5219`.
- Merge SHA: `3ebe2b49f4a74ab880451f31c0906d4d7f560a01`.
- ACA deploy run: `https://github.com/abarva-platform/abarva/actions/runs/29855932943`.
- ACA revision: `ca-abarva-web-lab-eastus--m3ebe2b49`.
- Traffic: 100%.
- Runtime proof bundle: GitHub artifact `aca-main-deploy` from run `29855932943`; local verification copy at `/tmp/aca-main-deploy-29855932943-1784658089`.
- Live screenshot: `/Users/anand/Downloads/moves-p0-shell-live-proof-2026-07-21/agent-meridian-strategic-moves-new.png`.
- Validation output: local command output in the Codex task.

## Known Gaps

- This release makes P0 the contract-shell reference. P1-P5 still need a deliberate follow-up migration onto the same universal shell model.
