# 2026-09-23-moves-terminal-ava-guidance — Moves Terminal aVa Guidance

## Release ID

`2026-09-23-moves-terminal-ava-guidance`

## Status

`candidate`

## Plain-English Summary

This change prevents Moves aVa from turning post-handoff evidence notes into blockers after a terminal phase has already completed. When the last phase is handed off, chat grounding now names that terminal state and frames any remaining evidence notes as caveats or follow-up work instead of prerequisites to acceptance. The structured answer renderer also suppresses next-phase preparation tables on a completed handoff so the response does not contradict the phase gate.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Moves aVa prompt grounding and structured answer rendering only. No canonical data, client intake files, adapters, registry state, migrations, or data-plane state change.

## Client Applicability

- All clients: Applies to Moves aVa answers on completed terminal phase handoffs.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Moves aVa hardening path where enabled.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/lib/programs/ava-chat/types.ts`
- `src/lib/programs/ava-chat/packet.ts`
- `src/lib/programs/ava-chat/system-prompt.ts`
- `src/lib/programs/moves-chat-answer-packet.ts`
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`
- `src/lib/programs/__tests__/moves-chat-answer-packet.test.ts`

## QA / Validation

- `npx jest src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/__tests__/moves-chat-answer-packet.test.ts --runInBand` — passed, 13/13 tests.
- `npx eslint src/lib/programs/ava-chat/types.ts src/lib/programs/ava-chat/packet.ts src/lib/programs/ava-chat/system-prompt.ts src/app/api/chat/agent/route.ts src/lib/programs/moves-chat-answer-packet.ts src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/__tests__/moves-chat-answer-packet.test.ts` — passed.

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps deploy workflow may rebuild and deploy the web image after merge. No manual migration, data load, registry activation, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, terminal Moves aVa guidance proof after deploy.

## Rollback Plan

Revert the pull request and allow the repo-owned deploy workflow to redeploy the previous behavior. No data rollback is required.

## Audit Evidence

- Smoke report: `reports/moves-e2e-operating-smoke/20260923T222629Z/`
- Focused test outputs under `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/`

## Known Gaps

This change fixes terminal handoff chat grounding only. The broader Moves P0-P5 operating smoke test remains in progress.
