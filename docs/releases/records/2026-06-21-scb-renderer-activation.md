# 2026-06-21-scb-renderer-activation — Shared Answer Renderer Activation

## Release ID

`2026-06-21-scb-renderer-activation`

## Status

`candidate`

## Plain-English Summary

This activates the built Shared Context Brain renderer on the Intelligence ask surface. When Ava's live answer already contains concrete figures or retrieved sources, the API emits a structured `AgentAnswer` event and the chat renders its tables/charts through the shared renderer. The change does not invent numbers; it only renders figures and sources already present in the answer stream.

## Layer Impact

- `global-control-lane`: Adds a structured stream event to `/api/intelligence/ask` and a render slot in `AgentDock`.
- `experimental`: Shared Context Brain renderer activation for Intelligence. Other surfaces remain unchanged.

## Client Applicability

- All clients: Intelligence ask can display structured exhibits when supporting answer data exists.
- Specific clients: None.
- Internal only: No.
- Public/demo only: None.
- Feature flag: No new flag. Existing SCB surface flags remain separately controlled.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts` extracts grounded figures/sources into `AnswerTable`/`AnswerChart` objects.
- `src/app/api/intelligence/ask/route.ts` emits an `agent-answer` NDJSON event when structured exhibits are renderable.
- `src/components/agent/AgentDock.tsx` accepts and renders `agentAnswer`.
- `src/components/intelligence-v3/SentinelChat.tsx` binds the streamed `agent-answer` event to the active turn.

## QA / Validation

- `npm test -- src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/intelligence-v3/__tests__/SentinelChat.migration.test.tsx --runInBand` — passed, 11/11 tests.
- `npx eslint src/lib/intelligence/answer/structured-exhibits.ts src/app/api/intelligence/ask/route.ts src/components/agent/AgentDock.tsx src/components/intelligence-v3/SentinelChat.tsx src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/components/intelligence-v3/__tests__/SentinelChat.migration.test.tsx` — passed.

## Rollout Plan

Merge to `main`; repo-owned ACA main deploy builds and deploys the runtime image. Browser proof should ask Intelligence for a spend/table/chart-style answer and verify the structured exhibit renders.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by main deploy after merge.
- ACA runtime invariant: Verified by main deploy after merge.
- Worker image invariant: Verified by main deploy after merge.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — browser proof of Intelligence structured exhibit after deploy.

## Rollback Plan

Revert this PR. Prose streaming remains the fallback because the renderer event is additive.

## Audit Evidence

- Focused Jest and ESLint outputs.
- Main deploy and signed-in browser proof after merge.

## Known Gaps

This does not run the env-gated live model eval or flip SCB flags for pilot tenants.
