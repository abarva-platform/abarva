# 2026-06-07-convert-remaining-openai-reasoning — Convert last OpenAI reasoning paths to Anthropic

## Release ID

`2026-06-07-convert-remaining-openai-reasoning`

## Status

`candidate`

## Plain-English Summary

Completes the Anthropic-only reasoning standard. The two remaining reasoning paths
that still called OpenAI — the Source Sentinel chat LLM and the Source artifact
"generate" route — now call the audited Anthropic/Claude client. The default model
for Source artifact prompts flips from `gpt-5.1` to `claude-sonnet-4-6`. The
enforcement guard's tracked-legacy list is now empty: zero OpenAI reasoning paths.

## Layer Impact

- `global-control-lane`: Source answer/artifact generation now reasons on Claude.
  No schema change, no data-plane writes. Same function interfaces (consumers
  untouched); only the model provider and provider-specific call shape changed.

## Client Applicability

- All clients: Yes — applies to every tenant's Source Sentinel chat + artifact drafts.
- Feature flag: Source Sentinel chat remains gated by `SENTINEL_CHAT_USE_LLM`
  (unchanged); when enabled it now requires `ANTHROPIC_API_KEY` (was `OPENAI_API_KEY`).

## Changes Included

- `src/lib/source/sentinel-chat-llm.ts`: `preflightOpenAIDirectClient` →
  `preflightAnthropicDirectClient`; `responses.create` → `messages.create`
  (system + user message); `output_text` → text-block extraction; default model
  `gpt-5.1` → `claude-sonnet-4-6`; key check `OPENAI_API_KEY` → `ANTHROPIC_API_KEY`.
- Source artifact generate route: same provider/call/shape conversion; comments +
  fallback messages updated. **Renamed the route** `…/artifacts/[artifactCode]/generate-from-openai`
  → `…/artifacts/[artifactCode]/generate` (provider-neutral, per the standard's
  architecture-rules guard) and updated its one caller
  (`src/components/source/canvas/UniversalCanvasShell.tsx`).
- `src/lib/source/agent-generation/prompt-registry.ts`: `DEFAULT_MODEL` `gpt-5.1` →
  `claude-sonnet-4-6`.
- `scripts/guardrails/anthropic-only-reasoning.mjs`: `KNOWN_LEGACY_REASONING` emptied
  (ratchet complete — 0 tracked-legacy).

No data-load/corpus changes. No Supabase. No DNS/Vercel/account changes.

## QA / Validation

- `npm run guard:reasoning` → passes, **0 tracked-legacy reasoning files**.
- `jest` affected source suites + guardrails → 3 suites / 22 tests pass.
- `tsc --noEmit`: no new errors in touched files (3 total = pre-existing missing
  optional deps). ESLint touched files clean.
- `npm run release:check -- --base origin/main --head HEAD` → see PR CI.

## Rollout Plan

Merge to `main`, then redeploy the Azure Container App (same redeploy that activates
the prior Anthropic-only PR). No migration for this PR; the `ai_policy` migration is
tracked separately.

## Rollback Plan

Revert the PR (code-only). Reasoning reverts to OpenAI for these two paths, and the
guard's ratchet would then fail (intended signal). No data/schema state to unwind.

## Audit Evidence

- PR: `cursor/convert-remaining-openai-reasoning` → main.
- Guard output (0 legacy) + jest in CI.
- Builds on `2026-06-07-anthropic-only-reasoning-standard` (#3270).

## Known Gaps

- The Source artifact generate route was renamed to a provider-neutral path
  (`/generate`); its single in-app caller was updated in the same change.
- Guard does not yet block new `@supabase/*` runtime imports / Vercel assumptions
  (follow-on guards, tracked in the standard doc).
