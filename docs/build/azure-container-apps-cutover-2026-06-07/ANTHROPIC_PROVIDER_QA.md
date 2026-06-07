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

- `npm run audit:provider-proof` → **passed**. See
  `PROVIDER_AUDIT_PROOF.md` for the repeatable verifier and live audit-row SQL.
- `npx jest provider-audit.test.ts openai-runtime-contract.test.ts sentinel-chat-llm.test.ts` → **10 passed**.
- `tsc --noEmit` → **passed**.
- `eslint` (changed files) → **passed**.
- `npm run release:check` → **passed**.

## Runtime QA status — BLOCKED on Clerk-capable environment

As of 2026-06-07 ~05:15Z, this VM still cannot complete signed-in runtime QA:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
  `DEMO_LOGIN_PASSWORD`, and `DATABASE_URL` are absent from the agent
  environment.
- The 0-traffic Azure Container Apps test revision is already deployed and
  healthy per `SIGNED_IN_AZURE_QA.md`, but protected routes still require a
  Clerk session for tenant QA and live provider audit confirmation.
- Cursor Cloud secrets added after this VM was provisioned do not appear in the
  running VM; signed-in QA must run from a newly provisioned agent or an
  operator environment that has the Clerk credentials/session.

## Image

`acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933`
built from merged main + this provider branch (after tests passed).

## Remaining (runtime) acceptance — requires signed-in QA

- Confirm live `ai_egress_audit.provider=anthropic` for the two workflows.
- Confirm Claude answers are advisor-quality and citations intact.
- Run the signed-in Lakeshore/Meridian golden-question pass on the `provqa`
  revision-scoped FQDN. See `SIGNED_IN_AZURE_QA.md` for the current
  status/blocker and runbook.
