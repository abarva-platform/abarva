# 2026-05-30-atlas-fallback-visibility — Atlas Live/Fallback Mode Visibility

## Release ID

`2026-05-30-atlas-fallback-visibility`

## Status

`candidate`

## Plain-English Summary

Atlas now reports whether an answer was served through the normal live path or through deterministic fallback. The graceful fallback remains in place, but `/api/v1/atlas/chat` and `/api/v1/atlas/ask` expose `x-atlas-mode: live|fallback`, and the JSON response carries the fallback reason where applicable.

## Layer Impact

- `global-control-lane`: Atlas response metadata and observability improve for all tenants.
- `internal-admin`: E2E and QA harnesses can measure fallback rate without inferring it from answer text.

## Client Applicability

- All clients: Atlas API responses include the mode header.
- Specific clients: None.
- Internal only: Structured logs and QA reporting use the mode/fallback reason.
- Public/demo only: Demo runs can now distinguish live model output from deterministic reads.
- Feature flag: None.

## Changes Included

- Adds `AtlasExecutionMode = 'live' | 'fallback'` to the Atlas response contract.
- Returns `atlasMode` and `fallbackReason` from Atlas turns.
- Emits `x-atlas-mode` from `/api/v1/atlas/chat` and `/api/v1/atlas/ask`.
- Adds structured `[atlas.mode]` log events for live and fallback model paths.
- Adds a static API contract test for mode visibility.

## QA / Validation

- Verified production project env lists `ANTHROPIC_API_KEY` for Preview and Production.
- Verified the local `.env.local` Anthropic key and configured `claude-opus-4-7` model can complete a minimal Anthropic Messages API call.
- Passed: `npx jest src/app/api/v1/atlas/__tests__/mode-visibility.test.ts --runInBand`.
- Passed: `npx tsc --noEmit --pretty false`.
- Passed: `npx eslint src/app/api/v1/atlas/ask/route.ts src/app/api/v1/atlas/chat/route.ts src/app/api/v1/atlas/__tests__/mode-visibility.test.ts src/lib/atlas/llm.ts src/lib/atlas/orchestrator.ts src/lib/atlas/scripted-engine.ts src/lib/atlas/types.ts`.
- Passed: `git diff --check`.

## Rollout Plan

Merge to main and let the normal Vercel deployment expose the new header. No migration or feature flag is required.

## Rollback Plan

Revert the release commit. Atlas fallback behavior will still work, but E2E harnesses will again need to infer fallback from response text.

## Audit Evidence

- PR: Pending.
- API header contract: `src/app/api/v1/atlas/__tests__/mode-visibility.test.ts`.
- Runtime source: `src/lib/atlas/llm.ts`, `src/lib/atlas/orchestrator.ts`, `/api/v1/atlas/chat`, and `/api/v1/atlas/ask`.

## Known Gaps

The prior production E2E run proved fallback happened, but did not expose the exact deployed fallback reason. This release makes the next E2E run capture that reason deterministically.
