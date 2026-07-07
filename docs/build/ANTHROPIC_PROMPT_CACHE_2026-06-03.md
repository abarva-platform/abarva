# Anthropic Prompt Cache Evidence Packet

Date: 2026-06-03

Backlog: T187 — Anthropic prompt caching for parsed-doc and agent system
prompts.

## What Changed

The Anthropic direct text adapter now builds cache-control payloads before
calling the Messages API:

- Stable system prompts are marked with `cache_control: { type: 'ephemeral' }`
  by default.
- User prompt blocks are marked cacheable only when request metadata includes a
  stable document/cache key, or when metadata explicitly opts in.
- Metadata can opt out with `anthropicPromptCache.enabled=false` or the runtime
  can disable caching with `ABARVA_ANTHROPIC_PROMPT_CACHE=off`.
- The adapter returns Anthropic `usage` and prompt-cache audit metadata so the
  AI egress audit spine can preserve cache creation/read token counts.

## Data Contract

Accepted stable document/cache keys:

- `promptCacheKey` / `prompt_cache_key`
- `parseCacheKey` / `parse_cache_key`
- `documentKey` / `document_key`
- `documentId` / `document_id`
- `sourceDocumentId` / `source_document_id`
- `artifactCode` / `artifact_code`
- `sha256`

Audit metadata emitted by the adapter:

- `anthropicPromptCache.enabled`
- `anthropicPromptCache.cacheSystemPrompt`
- `anthropicPromptCache.cacheUserPrompt`
- `anthropicPromptCache.cacheKey`
- `anthropicPromptCache.ttl = ephemeral_5m`
- `usage.cache_creation_input_tokens`
- `usage.cache_read_input_tokens`

## Files

- `src/lib/integrations/ai-egress/anthropic-prompt-cache.ts`
- `src/lib/integrations/ai-egress/anthropic-direct.ts`
- `src/lib/integrations/ai-egress/index.ts`
- `src/lib/integrations/ai-egress/__tests__/anthropic-prompt-cache.test.ts`
- `src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts`

## Local QA

- `npx jest src/lib/integrations/ai-egress/__tests__/anthropic-prompt-cache.test.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts --runInBand` — passed.
- `npx eslint src/lib/integrations/ai-egress/anthropic-prompt-cache.ts src/lib/integrations/ai-egress/anthropic-direct.ts src/lib/integrations/ai-egress/index.ts src/lib/integrations/ai-egress/__tests__/anthropic-prompt-cache.test.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed,
  including the Pilot Data Loader Gate.
- `npx tsc --noEmit --pretty false` — local run blocked by the existing shared
  `node_modules` missing `@axe-core/playwright` for
  `tests/accessibility/public-axe.spec.ts`; T187 code-specific type errors
  were fixed before PR open.

## Reference

- Anthropic prompt caching docs:
  `https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching`

## Known Boundaries

- This slice does not force cache-control onto every streaming/preflight call.
- Cache effectiveness depends on repeated stable prompt prefixes and Anthropic
  cache eligibility; the runtime records returned usage metadata instead of
  assuming a cache hit.
- One-hour cache duration is not enabled by this slice.
