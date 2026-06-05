# 2026-06-05-openai-loader-backed-diagnostic-chat — OpenAI Loader-Backed Diagnostic Chat

## Release ID

`2026-06-05-openai-loader-backed-diagnostic-chat`

## Status

`candidate`

## Plain-English Summary

The legacy `/api/chat` diagnostic route no longer injects stale static Meridian profile facts or calls Claude. It now calls the OpenAI-backed runtime and grounds organization-specific claims in the authenticated tenant's loader-backed context when available.

## Layer Impact

`global-control-lane`: The shared diagnostic API route now follows the same OpenAI-only direction as the Meridian/PHS execution lane and avoids static fixture facts.

`client-data-lane`: Meridian benefits immediately because the route can no longer embed the old Charlotte / 23-hospital fixture profile in prompts. No tenant data, seed rows, or migrations are changed.

## Client Applicability

- All clients: Yes, for callers of `/api/chat`.
- Specific clients: Meridian Health System receives the main safety benefit because the old route contained a static Meridian branch.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/chat/route.ts` now uses `createIntelligenceAskOpenAIText` and `buildTenantContextBlock`.
- The route returns `x-abarva-model-provider: openai` for deterministic runtime inspection.
- The static `@/data/meridian` and Anthropic/Claude route dependencies were removed from this API path.
- `src/app/api/chat/__tests__/route-openai-loader-contract.test.ts` pins the OpenAI-only, loader-backed contract and blocks stale Meridian prompt facts.

## QA / Validation

- PASS: `npx jest src/app/api/chat/__tests__/route-openai-loader-contract.test.ts --runInBand` — 2 tests passed.
- PASS: `npx tsc --noEmit --pretty false --incremental false`.
- PASS: `git diff --check`.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment. No migration or manual data load is required.

## Rollback Plan

Revert the PR. The rollback only affects the legacy diagnostic chat route and does not touch tenant data.

## Audit Evidence

- PR URL and CI checks once opened.
- Local Jest and TypeScript output from this branch.

## Known Gaps

This does not reload Meridian/PHS context data. The governed Admin/Setup loader path remains the source of truth for the broader Meridian context reset.
