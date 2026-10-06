# 2026-09-23-moves-terminal-ava-terminal-guidance — Terminal Moves aVa Guidance

## Release ID

`2026-09-23-moves-terminal-ava-terminal-guidance`

## Status

`candidate`

## Plain-English Summary

Tightens the Moves aVa system prompt for a final-phase Move that has already completed handoff. In that state, aVa must answer from the completed-handoff posture and must not ask the user to re-capture acceptance, close the phase, or complete the handoff package again.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates the shared Moves aVa prompt contract for terminal final-phase guidance.
- No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, database schema, tenant-data, registry, or retrieval index change.

## Client Applicability

- All clients: Yes, for the shared Moves user interface and aVa chat behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves aVa chat hardening path.

## Changes Included

- `src/lib/programs/ava-chat/system-prompt.ts`
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/__tests__/moves-chat-answer-packet.test.ts --runInBand`.
- Passed: `npx eslint src/lib/programs/ava-chat/system-prompt.ts src/lib/programs/ava-chat/__tests__/packet.test.ts`.
- Passed: `git diff --check`.
- Passed: `npm run typecheck`.
- Passed: `npm run release:check`.
- Not run yet: post-deploy signed-in proof repeating the terminal final-phase aVa prompt.

## Rollout Plan

Merge through pull request. The repo-owned ACA main deploy workflow rolls out the shared web runtime after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be resolved by the repo-owned workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required before live claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, repeat the terminal final-phase aVa guidance prompt.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- Pull request and CI checks for this change.
- Local focused Jest, ESLint, typecheck, and release control output.
- Post-deploy signed-in browser proof for terminal final-phase aVa guidance.

## Known Gaps

This only tightens terminal final-phase chat guidance. It does not complete the broader Moves end-to-end smoke matrix for uploads, document review, export quality, or every phase.
