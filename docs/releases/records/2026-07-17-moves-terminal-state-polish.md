# 2026-07-17-moves-terminal-state-polish — Moves Terminal State Polish

## Release ID

`2026-07-17-moves-terminal-state-polish`

## Status

`candidate`

## Plain-English Summary

Moves now renders the terminal P5 Tower handoff as complete after the P5 gate has passed, instead of leaving the final phase looking perpetually in progress. The release also makes Files & Evidence status labels more client-readable and clarifies that generated next-phase preparation items are guidance/carry-forward inputs, not current-phase blockers.

## Layer Impact

- `global-control-lane`: shared Strategic Moves UI and read-model behavior for phase state, File Cabinet status labels, and Approve & Build preparation copy.
- Runtime data model: no schema or tenant data changes. The release uses the existing `gates_passed` contract as the terminal completion source of truth.

## Client Applicability

- All clients: yes, for Strategic Moves.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Strategic Move view model now exposes a terminal-complete signal when P5 appears in `gates_passed`.
- Strategic Move view model and full program API also honor the persisted `phase_5 · completed` Tower handoff activity when older rows did not backfill P5 into `gates_passed`.
- Strategic Move page model also treats the compact `phase_5:completed` recent-activity signal as terminal handoff completion, while excluding section-level rows such as `phase_5_launch_readiness:signed_off`.
- Strategic Move page model now also treats an approved P5 phase snapshot as terminal handoff completion, so the page shell follows the same persisted approval evidence as the full Program API even when the compact activity row is outside the recent-activity window.
- Strategic Move page model now reads the latest explicit `phase_5` terminal module-state row, so P5 remains complete even when generic recent activity or snapshot reads do not include the terminal handoff row.
- Phase state transformer and phase explorer tallies mark P5 complete after terminal Tower handoff.
- Historical P5 gate panel now routes to Tower and explains the handoff state.
- File Cabinet displays `quarantined` artifacts as `needs review` with the review caveat preserved in a tooltip.
- Approve & Build copy now says inputs are available and next-phase prep items carry forward.

## QA / Validation

- Pass: `npm test -- src/lib/programs/__tests__/phase-explorer-tallies.test.ts src/lib/programs/__tests__/strategic-moves-transformers.test.ts src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/lib/programs/phase-explorer-tallies.ts src/lib/programs/transformers.ts src/lib/programs/types.ui.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/PhaseApproveAndBuild.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts src/lib/programs/__tests__/phase-explorer-tallies.test.ts src/lib/programs/__tests__/strategic-moves-transformers.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Pending post-deploy: signed-in production browser proof that a completed P5 Move shows P5 as complete and offers Tower handoff.
- Pending post-deploy: signed-in production Files & Evidence proof that generated artifacts no longer expose raw `quarantined` status language.

## Rollout Plan

Merge through PR into `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`, then shifts 100% traffic after the new revision is healthy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: GitHub Actions main deploy only
- Approved image digest: pending main deploy
- ACA runtime invariant: pending post-deploy verification
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Rollback by reverting the PR and allowing the ACA main deploy workflow to publish the reverted `main` image. No migration rollback is required because this release does not change schema or persisted tenant data.

## Audit Evidence

- PR URL: pending
- Merge SHA: pending
- ACA revision: pending
- Signed-in screenshots: pending

## Known Gaps

This release does not change deliverable generation quality, evidence approval policy, data-layer extraction, Tower value proof, or client-specific content.
