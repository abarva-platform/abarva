# 2026-07-20-moves-phase-shell-1to1-contract — Moves Phase Shell 1:1 Contract Pass

## Release ID

`2026-07-20-moves-phase-shell-1to1-contract`

## Status

`candidate`

## Plain-English Summary

This release tightens the deployed Moves phase shell to the attached `Moves Phase Shell.html` visual contract. The prior shell release preserved the right runtime structure but still drifted visually: the context strip was dark, the canvas was too wide, and the top workspace view pills from the reference were missing. This pass restores the reference dimensions and treatments while leaving the evidence, upload, phase approval, File Cabinet, and Phase Intelligence runtime paths unchanged.

## Layer Impact

- `global-control-lane`: shared Moves phase page visual shell and workspace navigation for all tenants.
- Runtime data paths are unchanged. This is a visual/workflow-shell alignment pass only.

## Client Applicability

- All clients: yes, for Moves phase pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Restores the reference `Steps / Files / Intelligence` workspace pill strip at the top of the phase canvas.
  - Aligns the Moves subnav, left rail, centered canvas, stage header, progress card, and typography toward the attached HTML contract.
  - Preserves the existing Files & Evidence, Phase Intelligence, upload, and Approve & Build wiring.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in browser proof after ACA deploy.

## Rollout Plan

Open a PR against `abarva-platform/abarva`, merge through the protected PR flow, let the repo-owned ACA main deploy workflow build and deploy the production image, then run signed-in Moves browser proof on a non-critical Move route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: pending ACA deploy
- ACA runtime invariant: pending ACA deploy
- Worker image invariant: no worker image changes expected
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this PR or deploy the prior ACA digest through the approved main deploy workflow. No schema, migration, data, or worker rollback is required.

## Audit Evidence

- PR URL: pending
- CI/check output: pending
- ACA revision/image digest: pending
- Signed-in browser screenshot: pending

## Known Gaps

- This release does not change evidence classification, document-generation prompts, deliverable quality scoring, candidate/data-layer behavior, or Tower outcomes.
- Existing Jest duplicate manual mock warnings remain outside this change.
