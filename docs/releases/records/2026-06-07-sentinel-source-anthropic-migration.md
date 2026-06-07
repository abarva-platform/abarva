# 2026-06-07-sentinel-source-anthropic-migration — Sentinel & Source synthesis → Anthropic (P0)

## Release ID

`2026-06-07-sentinel-source-anthropic-migration`

## Status

`candidate` — **QA-gated: requires signed-in (Clerk) live validation before production.**

## Plain-English Summary

Moves the two production reasoning paths that were still on OpenAI onto the
audited Anthropic Claude client, per the Anthropic-only mandate:

- **Sentinel Ask synthesis** (the main Intelligence answer path) — was OpenAI
  `gpt-5.1`/`gpt-4o-mini`; now Claude via a new `anthropic-runtime`.
- **Source Sentinel chat** — was OpenAI direct; now the audited Claude client.

Nexus already used Claude (unchanged). The non-reasoning OpenAI utility paths
(intent classifier, follow-up suggestions) are intentionally left for a separate
follow-up and are documented as the remaining Anthropic-only cleanup.

## Layer Impact

- Lane: `global-control-lane`. Changes the LLM provider for Sentinel Ask
  synthesis and Source chat for all tenants. No schema/data change.
- Egress remains audited (`getAuditedAnthropicClient` → `preflightAnthropicDirectClient`),
  so `ai_egress_audit` rows record `provider=anthropic` for these workflows.

## Client Applicability

- All clients: yes — Sentinel Ask and Source chat answers are now Claude-generated.
- Feature flag: none. Source chat remains behind the existing
  `SENTINEL_CHAT_USE_LLM` flag.

## Changes Included

- `src/lib/intelligence/ask/anthropic-runtime.ts` (new): `createIntelligenceAskAnthropicText`
  - Claude models, drop-in for the deprecated OpenAI synthesis runtime.
- `src/lib/intelligence/ask/synthesizer.ts`: Sentinel Ask synthesis + `chooseModel`
  now use the Anthropic runtime; configuration check is `ANTHROPIC_API_KEY`.
- `src/lib/source/sentinel-chat-llm.ts`: Source chat uses `getAuditedAnthropicClient`
  - `messages.create` (default model `claude-opus-4-7`).
- Tests: `provider-audit.test.ts` (now asserts Sentinel/Source on Anthropic),
  `openai-runtime-contract.test.ts` (rescoped to the OpenAI utility paths),
  `source/__tests__/sentinel-chat-llm.test.ts` (Anthropic mock).

## QA / Validation

- `npx jest provider-audit / openai-runtime-contract / sentinel-chat-llm` — passed.
- `tsc --noEmit`, `eslint` — passed.
- **Blocked / not run:** signed-in live Sentinel Ask + Source chat QA (no Clerk
  session in this environment). This is the gating requirement before production
  — confirm Claude answers are advisor-quality, citations intact, streaming/UX
  unaffected, and `ai_egress_audit` shows `provider=anthropic`.
- Pre-existing unrelated failures in `src/lib/source/exports/*` and
  event-code/artifact-binding suites are present on `main` independent of this
  change (verified by stashing).

## Rollout Plan

Reviewed PR, **do not auto-deploy.** Merge only after the signed-in QA gate
passes. Requires `ANTHROPIC_API_KEY` in the runtime (already present); the legacy
`OPENAI_API_KEY` is no longer used by these two paths.

## Rollback Plan

Revert the PR (restores the OpenAI synthesis runtime + Source OpenAI path). No
data/schema change. Per-path revert is possible (synthesizer.ts and
sentinel-chat-llm.ts are independent).

## Audit Evidence

- `provider-audit.test.ts` wiring assertions; jest outputs on the branch.
- `ai_egress_audit` rows for `intelligence-ask-synthesis` and
  `source-sentinel-chat` should read `provider=anthropic` once exercised live.

## Known Gaps

- Intent classifier (`classifier.ts`) and follow-up suggestions (`followups.ts`)
  still use the OpenAI small-model utility path — tracked as the remaining
  Anthropic-only cleanup (non-reasoning utilities).
- Signed-in live QA not performed in this environment (no Clerk).
