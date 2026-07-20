# 2026-07-19-moves-universal-phase-shell — Moves Universal Phase Shell

## Release ID

`2026-07-19-moves-universal-phase-shell`

## Status

`candidate`

## Plain-English Summary

Moves phase pages now use the attached Source-style Moves shell as the runtime contract: the left rail owns phase and workspace navigation, the stage tabs own the phase workflow, and the active step is the only primary work surface. The old in-phase Session Playbook/long-scroll guidance surface is no longer mounted inside the phase route; Files & Evidence, Phase Intelligence, and Approvals remain first-class workspace surfaces. The Prepare tab is now a compact purpose/action/proof/live-state table instead of a long instruction page.

## Layer Impact

- `global-control-lane`: shared Moves page UX and workflow guidance for all tenants.
- Runtime data paths are unchanged. Uploads, Files & Evidence, Phase Intelligence, P0 approval, and P1-P5 Approve & Build continue to use existing APIs and component contracts.
- Retired runtime mount: the old in-phase Session Playbook surface is not rendered from the phase shell. The component remains in the repository for now, but the active phase route no longer exposes it as a page in the workflow.

## Client Applicability

- All clients: yes, for Moves phase pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Removes the in-phase Session Playbook workspace mount and duplicate horizontal workspace tabs.
  - Keeps the attached shell pattern: left workspace rail, stage tabs, active step focus, Files & Evidence, Phase Intelligence, and Approvals.
  - Replaces the old Prepare copy with a compact phase briefing table.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass with known unrelated blocker: `npx jest src/components/strategic-moves/__tests__ --runInBand` passed 57 tests across 9 suites and failed one existing Clerk ESM parse path in `moves-liability-visible-controls.test.tsx`; focused shell suite remains green.
- Pass: local webpack dev server compiled protected Moves route and redirected through Clerk auth without app compile errors.
- Pending: signed-in browser proof after deploy.

## Rollout Plan

Open a PR against `abarva-platform/abarva`, merge through the protected PR flow, then let the repo-owned ACA main deploy workflow build and deploy the production image. After deployment, run signed-in Moves browser proof on a disposable Move or non-critical Meridian/FS test Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: pending ACA deploy
- ACA runtime invariant: pending ACA deploy
- Worker image invariant: no worker image changes expected
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR or deploy the previous ACA digest through the approved main deploy workflow. No schema, data, or migration rollback is required.

## Audit Evidence

- PR URL: pending
- CI/check output: pending
- ACA revision/image digest: pending
- Signed-in browser proof: pending

## Known Gaps

- This release does not change evidence classification, document-generation prompts, deliverable quality scoring, candidate/data-layer behavior, or Tower outcomes.
- Existing Jest duplicate manual mock warnings remain outside this change.
