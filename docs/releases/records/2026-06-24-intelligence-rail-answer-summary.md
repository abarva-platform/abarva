# 2026-06-24-intelligence-rail-answer-summary — Intelligence Rail Answer Summary

## Release ID

`2026-06-24-intelligence-rail-answer-summary`

## Status

`candidate`

## Plain-English Summary

This follow-up keeps the Intelligence chat rail clean after the focused workspace rollout. When the backend emits a structured `AgentAnswer`, the rail now keeps a concise "Answer is ready on the canvas" status instead of duplicating the full executive answer. The full answer, experts, citations, tables, charts, and graphs remain on the right-side Intelligence canvas.

## Layer Impact

- `global-control-lane`: frontend behavior for `/intelligence/ask`.
- No backend, data, retrieval, semantic-layer, prompt, or tenant-specific changes.

## Client Applicability

- All signed-in tenants using Intelligence Ask.
- No feature flag.

## Changes Included

- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: keeps `AgentAnswer` prose on the canvas, not the rail.
- `src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx`: adds a regression test proving structured answer prose does not clutter the chat rail.

## QA / Validation

- `passed`: `npx eslint 'src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx' 'src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx'`
- `passed`: `npx jest --runTestsByPath 'src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx' --runInBand` — 1 suite / 5 tests passed. Jest still reports existing duplicate manual mock warnings unrelated to this release.
- `passed`: `npm run audit:ai-surface-controls`
- `passed`: `npm run release:check`
- `pending`: signed-in browser proof after ACA deployment.

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps main workflow. Verify `/intelligence/ask` signed in for SkyHarbor with a question that returns an `AgentAnswer`.

## Deployment Authority

Azure Container Apps main deploy only. No Vercel path or non-main ACA mutation.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest. No data rollback required.

## Audit Evidence

- PR URL: to be added.
- ACA revision: to be added after deployment.
- Browser proof: to be added after deployment.

## Known Gaps

This release only fixes rail clutter for structured Intelligence answers. It does not change answer quality, semantic retrieval, or the backend context packet.
