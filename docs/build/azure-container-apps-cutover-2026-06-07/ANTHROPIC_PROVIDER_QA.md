# Anthropic/Claude Provider Migration — Static QA — 2026-06-07

Recreated cleanly on branch `cursor/anthropic-provider-qa-cutover-a092` from
latest `main` (`54f5cab2f`), since the prior PR (#3243) was closed/conflicting.

## What changed (reasoning provider only)

| Path                                                                                            | Before                                                             | After                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sentinel Ask synthesis (`src/lib/intelligence/ask/synthesizer.ts` + new `anthropic-runtime.ts`) | OpenAI `gpt-5.1`/`gpt-4o-mini` (`createIntelligenceAskOpenAIText`) | **Anthropic Claude** via `createIntelligenceAskAnthropicText` → `getAuditedAnthropicClient`; models `claude-opus-4-7` (synthesis) / `claude-haiku-4-5-20251001` (concise) |
| Source Sentinel chat (`src/lib/source/sentinel-chat-llm.ts`)                                    | OpenAI direct (`preflightOpenAIDirectClient`, `gpt-5.1`)           | **Anthropic Claude** via `getAuditedAnthropicClient` + `messages.create` (`claude-opus-4-7`)                                                                              |
| Nexus free-text (`src/lib/programs/nexus-free-text.ts`)                                         | Claude (`claude-opus-4-7`)                                         | **unchanged** (verified, not refactored)                                                                                                                                  |

## What did NOT change

- Non-reasoning OpenAI utilities (intent classifier, follow-up suggestions) remain
  on the OpenAI small-model path — they do not generate answers.
- No data-plane drain/search/freeze logic touched.
- No DNS, no Supabase pause/delete/freeze, no Vercel removal.

## Provider acceptance (static / code-evidenced)

- Sentinel Ask synthesis → `provider=anthropic`, Claude model ids. ✅
- Source chat synthesis → `provider=anthropic`, `claude-opus-4-7`. ✅
- Egress audited via `getAuditedAnthropicClient` → `preflightAnthropicDirectClient`,
  which records `ai_egress_audit` rows with **tenant, workflow, provider, route,
  model** (workflows: `intelligence-ask-synthesis`, `source-sentinel-chat`).
  Runtime confirmation of the audit rows is part of signed-in QA (pending).
- No Sentinel/Source/Nexus answer-generation path calls OpenAI (asserted by
  `provider-audit.test.ts`).

## Static validation (all passed)

- `npx jest provider-audit.test.ts openai-runtime-contract.test.ts sentinel-chat-llm.test.ts` → **10 passed**.
- `tsc --noEmit` → **passed**.
- `eslint` (changed files) → **passed**.
- `npm run release:check` → **passed**.

## Image

`acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933`
built from merged main + this provider branch (after tests passed).

## Remaining (runtime) acceptance — requires signed-in QA

- Confirm live `ai_egress_audit.provider=anthropic` for the two workflows.
- Confirm Claude answers are advisor-quality and citations intact.
  See `SIGNED_IN_AZURE_QA.md` for status/blocker.
