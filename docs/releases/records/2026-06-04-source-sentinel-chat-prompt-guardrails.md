# 2026-06-04-source-sentinel-chat-prompt-guardrails — Source Sentinel Chat Prompt Guardrails

## Release ID

`2026-06-04-source-sentinel-chat-prompt-guardrails`

## Status

`candidate`

## Plain-English Summary

This release tightens the feature-flagged Source Sentinel chat LLM path before production activation. The system prompt now uses the actual Source event client name instead of accidentally substituting the event title into the assistant identity line, and tests lock the expected model-backed, cited-answer, fallback, and citation-gap behaviors.

## Layer Impact

- `global-control-lane`: Updates shared Source agent prompt assembly and model-path guardrail tests for every tenant when `SENTINEL_CHAT_USE_LLM=true`.
- `client-data-lane`: No schema, seed, ingestion, retrieval, or private data-plane changes.

## Client Applicability

- All clients: the Source Sentinel chat LLM path receives the prompt fix when the feature flag is enabled.
- Specific clients: Apex Retail is the verified scenario for the current CXO-readiness closure.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `SENTINEL_CHAT_USE_LLM`.

## Changes Included

- `src/lib/source/sentinel-chat-llm.ts`: uses the Source event client name for the assistant identity line in the LLM system prompt.
- `src/lib/source/__tests__/sentinel-chat-llm.test.ts`: adds prompt identity, missing-key fallback, and citation-gap regression coverage.

## QA / Validation

- `npm test -- --runInBand src/lib/source/__tests__/sentinel-chat-llm.test.ts` — passed, 5 tests.
- `npx eslint src/lib/source/sentinel-chat-llm.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts` — passed.

## Rollout Plan

Merge to `main`; Vercel production deploy updates the dormant LLM path. Production model-backed chat still requires `SENTINEL_CHAT_USE_LLM=true` and `ANTHROPIC_API_KEY` to be available in the environment.

## Rollback Plan

Revert this release commit or PR. No migrations, data changes, or feature-flag flips are included.

## Audit Evidence

- Focused Jest and ESLint output in PR checks.
- After feature-flag activation, the Source ask endpoint should return `noModel: false` for an event-grounded prompt and should include evidence citations or a citation-gap warning.

## Known Gaps

- This release does not flip the production environment flag.
- The deterministic answer engine remains the fallback path when egress is denied, the API key is missing, the flag is disabled, or the model call fails.
