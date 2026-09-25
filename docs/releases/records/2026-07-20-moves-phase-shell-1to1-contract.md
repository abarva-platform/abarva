# 2026-07-20-moves-phase-shell-1to1-contract — Moves Phase Shell 1:1 Contract Pass

## Release ID

`2026-07-20-moves-phase-shell-1to1-contract`

## Status

`released`

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
- Pass: PR #5081 merged into `main` at `88316a171181c842a31ef319e925f756de4a3faa`.
- Pass: ACA runtime invariant captured with `ca-abarva-web-lab-eastus--m88316a17` serving 100% traffic from digest `sha256:d9a30e8f24a8db60cc99bd3c98831cb50f9d38133cef2a98231c86101eb771ef`.
- Pass: signed-in Meridian Moves phase route rendered the protected app shell with the reference `Steps / Files / Intelligence` strip, left phase rail, centered 1120px canvas, light context strip, and P0 stage tabs.
- Proof bundle: `/Users/anand/Downloads/moves-shell-1to1-live-proof-2026-07-20`

## Rollout Plan

Open a PR against `abarva-platform/abarva`, merge through the protected PR flow, let the repo-owned ACA main deploy workflow build and deploy the production image, then run signed-in Moves browser proof on a non-critical Move route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: `sha256:d9a30e8f24a8db60cc99bd3c98831cb50f9d38133cef2a98231c86101eb771ef`
- ACA runtime invariant: pass; template image and 100% traffic revision image match.
- ACA revision: `ca-abarva-web-lab-eastus--m88316a17`
- Worker image invariant: no worker image changes expected
- Feature/env flag update path: none
- Live signed-in proof required: completed

## Rollback Plan

Revert this PR or deploy the prior ACA digest through the approved main deploy workflow. No schema, migration, data, or worker rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5081
- Merge SHA: `88316a171181c842a31ef319e925f756de4a3faa`
- ACA revision: `ca-abarva-web-lab-eastus--m88316a17`
- ACA image digest: `sha256:d9a30e8f24a8db60cc99bd3c98831cb50f9d38133cef2a98231c86101eb771ef`
- Runtime invariant proof: `/Users/anand/Downloads/moves-shell-1to1-live-proof-2026-07-20/runtime-invariant/runtime-invariant-proof.json`
- Signed-in browser proof: `/Users/anand/Downloads/moves-shell-1to1-live-proof-2026-07-20/proof.json`
- Signed-in browser screenshot: `/Users/anand/Downloads/moves-shell-1to1-live-proof-2026-07-20/moves-shell-live.png`

## Known Gaps

- This release does not change evidence classification, document-generation prompts, deliverable quality scoring, candidate/data-layer behavior, or Tower outcomes.
- Existing Jest duplicate manual mock warnings remain outside this change.
