# 2026-06-04-source-redesign-spec-06-chat-sizing — Source Sentinel Chat Sizing

## Release ID

`2026-06-04-source-redesign-spec-06-chat-sizing`

## Status

`candidate`

## Plain-English Summary

The Source event canvas now sizes the Sentinel chat lane according to the stage being viewed. Empty drafting stages leave more room for the next action and document workspace, while executive decision opens with Sentinel collapsed so the recommendation surface leads.

## Layer Impact

- `global-control-lane`: updates shared Source UI behavior for all tenants using the Source event canvas. No schema, data-plane, model, provider, or ingestion behavior changes.

## Client Applicability

- All clients: Source event canvas users receive the proportional chat sizing.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `src/lib/source/chat-sizing-policy.ts`.
- Adds `src/components/source/canvas/SentinelChatProportional.tsx`.
- Updates the Source universal canvas to pass stage-aware chat defaults.
- Extends AgentDock collapsed-chip copy support and stage-surface reset behavior.

## QA / Validation

- Pass: `npm test -- --runInBand src/lib/source/__tests__/chat-sizing-policy.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx src/components/agent/__tests__/AgentDock.test.tsx` (64/64 tests).
- Pass: `git diff --check`.
- Pass: `npx eslint src/lib/source/chat-sizing-policy.ts src/lib/source/__tests__/chat-sizing-policy.test.ts src/components/source/canvas/SentinelChatProportional.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/components/agent/AgentDock.tsx src/__tests__/integration/source/source-event-canvas-render.test.tsx --max-warnings 0`.
- Pass: `npx tsc --noEmit --skipLibCheck --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Not run yet: full GitHub checks and post-deploy crawl against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`, deploy to Vercel production, and verify `app.abarva.ai` with the Source post-deploy crawl.

## Rollback Plan

Revert the PR or redeploy the previous production deployment. No database rollback is needed.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/3057`.
- CI: pending.
- Production deploy: pending.
- Post-deploy crawl: pending.

## Known Gaps

This release does not change whether Sentinel chat is model-backed. Per Anand's active constraint, no Claude/Anthropic work is introduced; future model/API work must use OpenAI only.
