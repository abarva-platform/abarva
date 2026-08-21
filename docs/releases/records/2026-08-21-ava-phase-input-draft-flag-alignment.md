# 2026-08-21-ava-phase-input-draft-flag-alignment — aVa Phase Input Draft Flag Alignment

## Release ID

`2026-08-21-ava-phase-input-draft-flag-alignment`

## Status

`candidate`

## Plain-English Summary

The Moves phase page can show a draft-input action even when the broader Moves
aVa chat-hardening flag is off. This release makes that draft action deterministic
in its own right: phase-input draft requests build the governed Moves packet and
return cited `capture-field` proposals without depending on the broader
hardening flag. Other deterministic status answers remain behind the existing
flag.

## Layer Impact

- `global-control-lane`
- Layer 4 Products: Updates the Moves aVa chat route so the visible draft-input
  action has a deterministic, cited response path for every tenant using the
  shared product runtime.
- Layer 3 Canonical: No canonical model change.
- Layer 2 Source Adapters: No adapter change.
- Layer 1 Client Intake: No intake change.

## Client Applicability

- All clients: yes, where the Moves phase page and aVa chat are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: broad Moves aVa chat hardening remains feature-gated; the
  phase-input draft action is deterministic because the UI action is already
  visible.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/lib/programs/ava-chat/answer-modes.ts`
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/ava-chat/__tests__/packet.test.ts --runInBand`.
- Pass: `npx tsc --noEmit`.
- Pass: `npx eslint src/app/api/chat/agent/route.ts src/lib/programs/ava-chat/answer-modes.ts src/lib/programs/ava-chat/__tests__/packet.test.ts`.
- Pending before merge: `npm run release:check`.
- Pending after deploy: signed-in verification of the phase-input draft action.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the
runtime image.

## Deployment Authority

- Repo-owned deploy workflow: required on merge to `main`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the phase-input draft action.

## Rollback Plan

Revert the release PR and redeploy through the repo-owned ACA main deploy
workflow.

## Audit Evidence

- PR, CI, deployment run, runtime invariant proof, and signed-in browser proof
  captured with the release.

## Known Gaps

The code path has local validation but still needs post-deploy signed-in proof
against the shared runtime. No tenant data load, canonical write, registry
activation, or phase approval is part of this release.
