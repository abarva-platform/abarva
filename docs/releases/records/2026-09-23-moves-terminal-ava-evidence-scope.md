# 2026-09-23-moves-terminal-ava-evidence-scope — Terminal Moves aVa Evidence Scope

## Release ID

`2026-09-23-moves-terminal-ava-evidence-scope`

## Status

`candidate`

## Plain-English Summary

Tightens Moves aVa grounding after a final-phase handoff is already complete. In that terminal state, aVa now receives the live gate/handoff facts but not generic next-phase evidence packets that can belong to a blueprint rather than the completed Move. This prevents post-handoff guidance from mixing stale or unrelated preparation needs into the answer.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Updates the Moves chat grounding path and its deterministic packet contract.
- No Layer 1 intake, Layer 2 adapter, Layer 3 canonical, database schema, tenant-data, registry, or retrieval index change.

## Client Applicability

- All clients: Yes, for the shared Moves user interface and aVa chat behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves aVa chat hardening path.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/lib/programs/ava-chat/packet.ts`
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`

## QA / Validation

- `npx jest src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/__tests__/moves-chat-answer-packet.test.ts --runInBand` — passed.
- `npx eslint src/lib/programs/ava-chat/packet.ts src/lib/programs/ava-chat/__tests__/packet.test.ts src/app/api/chat/agent/route.ts` — passed.
- Additional typecheck and release control validation required before merge.

## Rollout Plan

Merge through pull request. The repo-owned ACA main deploy workflow rolls out the shared web runtime after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be resolved by the repo-owned workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required before live claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, repeat the terminal P5 aVa guidance prompt and confirm no generic evidence packet text appears.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- Pull request and CI checks for this change.
- Local focused Jest and ESLint output.
- Post-deploy signed-in browser proof should verify terminal handoff guidance remains scoped to live Move state.

## Known Gaps

This only scopes terminal-complete P5 aVa grounding. It does not complete the broader Moves end-to-end smoke matrix for uploads, document review, export quality, or every phase.
