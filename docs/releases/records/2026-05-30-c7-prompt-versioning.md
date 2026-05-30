# 2026-05-30-c7-prompt-versioning — Sentinel Prompt Versioning

## Release ID

`2026-05-30-c7-prompt-versioning`

## Status

`candidate`

## Plain-English Summary

Sentinel's live system prompt is now selected through a versioned prompt registry instead of being embedded directly in the orchestrator. The active Sentinel prompt defaults to semver version `1.0.0`, can be selected with `SENTINEL_PROMPT_VERSION`, and preserves the current prompt text and answer behavior.

## Layer Impact

- `runtime-app-lane`: Routes Sentinel prompt text through `src/lib/prompts/` while leaving Sentinel ranking, fallback answers, citations, grounding checks, and model selection unchanged.
- `release-governance-lane`: Records C7 Phase 1 prompt-versioning scope, validation, and rollback evidence.

## Client Applicability

- All clients: Yes, for authenticated Sentinel/Intelligence turns that use the Sentinel orchestrator.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Optional runtime config is `SENTINEL_PROMPT_VERSION`, defaulting to `1.0.0`.

## Changes Included

- Adds `src/lib/prompts/sentinel.v1.0.0.ts` as the semver-named Sentinel prompt file.
- Adds `src/lib/prompts/sentinel.ts` as the active-version registry and config resolver.
- Updates `src/lib/sentinel/orchestrator.ts` to build the LLM system prompt from the active Sentinel prompt definition.
- Adds prompt registry tests and a Sentinel regression test pairing prompt version `1.0.0` to expected citation and grounding behavior.
- No database schema, RLS, migration, production deployment script, or Sentinel answer-quality logic change.

## QA / Validation

- PASS: `npx jest src/lib/prompts/__tests__/sentinel.test.ts src/lib/sentinel/__tests__/orchestrator.test.ts --runInBand`.
- PASS: `npx eslint src/lib/prompts/sentinel.v1.0.0.ts src/lib/prompts/sentinel.ts src/lib/prompts/__tests__/sentinel.test.ts src/lib/sentinel/orchestrator.ts src/lib/sentinel/__tests__/orchestrator.test.ts`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.

## Rollout Plan

Merge to `main` after PR checks pass and deploy the Next.js app normally. With no env change, Sentinel uses prompt version `1.0.0`. Operators can explicitly pin the same version with `SENTINEL_PROMPT_VERSION=1.0.0`.

## Rollback Plan

Revert the application commit to restore the inline Sentinel prompt in the orchestrator. No data rollback, migration rollback, or RLS rollback is required.

## Audit Evidence

- Prompt registry: `src/lib/prompts/sentinel.ts`.
- Versioned prompt: `src/lib/prompts/sentinel.v1.0.0.ts`.
- Regression coverage: `src/lib/prompts/__tests__/sentinel.test.ts` and `src/lib/sentinel/__tests__/orchestrator.test.ts`.
- PR URL: pending.

## Known Gaps

Phase 2-3 model versioning, admin reasoning trace UI, and continuous learning loops remain out of scope for this C7 Phase 1 slice.
