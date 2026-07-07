# 2026-06-05-source-openai-hardening — Source OpenAI Provider Hardening

## Release ID

`2026-06-05-source-openai-hardening`

## Status

`candidate`

## Plain-English Summary

Source artifact drafting and Source Sentinel chat no longer route user-visible generation paths through Claude/Anthropic. The canvas now calls the OpenAI-named generation endpoint, the Source prompt registry defaults to an OpenAI model, and the optional Sentinel chat LLM path uses the governed OpenAI egress client. When `OPENAI_API_KEY` is absent, Source keeps deterministic fallback behavior instead of silently switching providers.

## Layer Impact

`global-control-lane`: Changes shared Source generation and chat provider routing for the app control plane. No database schema, RLS, seed, or migration changes are included.

## Client Applicability

- All clients: Source users receive the OpenAI-only artifact generation route and prompt-registry default.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Source Sentinel chat still requires `SENTINEL_CHAT_USE_LLM`; if the flag is off or `OPENAI_API_KEY` is missing, deterministic fallback remains active.

## Changes Included

- Source artifact generation uses `preflightOpenAIDirectClient` and the OpenAI Responses API.
- Added `/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-openai` as the canonical client route and removed the legacy Claude-named Source artifact generation route.
- Updated `UniversalCanvasShell` and `DocumentTab` to remove client/provider naming leaks.
- Updated Source Sentinel chat LLM routing, tests, and prompt-registry model assertions.

## QA / Validation

Local validation under Node `v24.15.0`:

- Passed: `npx jest src/lib/source/__tests__/sentinel-chat-llm.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/canvas-substrate/__tests__/types.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts --runInBand` (4 suites, 24 tests; Jest printed pre-existing duplicate manual mock warnings for markdown/GFM mocks).
- Passed: `npx tsc --noEmit --pretty false`.
- Passed: focused `npx eslint` over changed Source OpenAI route, canvas, generation, chat, and test files.
- Passed: scoped Source runtime scan for `generate-from-claude`, `preflightAnthropicDirectClient`, `ANTHROPIC_API_KEY`, `claude-sonnet`, and `anthropic` across Source generation/chat paths returned no matches.
- Passed: `git diff --check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD` (Release Control Gate passed; Pilot Data Loader Gate passed).

## Rollout Plan

Merge to main and deploy through the normal Vercel production pipeline. No migration, seed, or manual data operation is required.

## Rollback Plan

Revert the Source provider hardening commit to restore the prior provider routing. Because no database schema or migration changes are included, rollback is a code-only redeploy.

## Audit Evidence

Review this release record, the Source provider diff, local focused Jest output, TypeScript output, and release-control output before merge.

## Known Gaps

The app still contains non-Source Anthropic/Claude references in historical data, docs, and unrelated compatibility paths. This release removes the Source artifact generation and Source Sentinel chat provider dependency on Anthropic, but does not remove repository-wide historical references outside the Source runtime path.
