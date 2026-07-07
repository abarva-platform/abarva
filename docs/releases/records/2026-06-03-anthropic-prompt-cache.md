# 2026-06-03-anthropic-prompt-cache — Anthropic Prompt Cache

## Release ID

`2026-06-03-anthropic-prompt-cache`

## Status

`candidate`

## Plain-English Summary

Adds a conservative Anthropic prompt-cache path for the direct Claude text
adapter. Stable system prompts are cacheable by default, document prompts become
cacheable when metadata carries a stable document/cache key, and returned cache
usage is preserved in the AI egress audit metadata.

## Layer Impact

- `global-control-lane`: Shared AI egress adapter behavior changes for
  Anthropic direct text calls.
- `client-data-lane`: Document-bound prompt cache metadata uses tenant-scoped
  document/cache identifiers but does not store raw documents or prompts.

## Client Applicability

- All clients: Applies to Anthropic direct text calls once deployed.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Runtime opt-out via `ABARVA_ANTHROPIC_PROMPT_CACHE=off`.

## Changes Included

- New prompt-cache helper builds Anthropic Messages payload blocks with
  `cache_control: { type: 'ephemeral' }` where appropriate.
- Anthropic direct text adapter uses the helper and returns provider usage plus
  cache audit metadata.
- AI egress tests assert cache usage metadata survives the completion audit.
- Prompt-cache tests assert system prompt caching, document prompt caching, and
  metadata/env opt-outs.

## QA / Validation

- `npx jest src/lib/integrations/ai-egress/__tests__/anthropic-prompt-cache.test.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts --runInBand` — passed.
- `npx eslint src/lib/integrations/ai-egress/anthropic-prompt-cache.ts src/lib/integrations/ai-egress/anthropic-direct.ts src/lib/integrations/ai-egress/index.ts src/lib/integrations/ai-egress/__tests__/anthropic-prompt-cache.test.ts src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed,
  including the Pilot Data Loader Gate.
- `npx tsc --noEmit --pretty false` — local run blocked by the existing shared
  `node_modules` missing `@axe-core/playwright`; CI typecheck is the
  authoritative full-repo signal.

## Rollout Plan

Merge to main. The direct Anthropic text adapter starts sending cache-control
blocks for stable system prompts and metadata-keyed document prompts. Operators
can disable with `ABARVA_ANTHROPIC_PROMPT_CACHE=off` if provider behavior needs
rollback without code revert.

## Rollback Plan

Set `ABARVA_ANTHROPIC_PROMPT_CACHE=off` to disable cache-control payloads at
runtime, or revert the PR to remove the helper and adapter wiring.

## Audit Evidence

- PR URL: pending.
- Local focused Jest output.
- CI checks after PR open.
- `docs/build/ANTHROPIC_PROMPT_CACHE_2026-06-03.md`.

## Known Gaps

- Streaming/preflight call sites are not force-wrapped by this slice.
- Cache hit rates depend on Anthropic eligibility and repeated stable prefixes;
  the dashboard must trust provider usage metadata rather than assume savings.
- One-hour cache duration is not enabled.
