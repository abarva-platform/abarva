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
- Tests: `provider-audit.test.ts` (now asserts Sentinel/Source on Anthropic,
  Sentinel Ask audit identity payload, and Anthropic preflight provider/route
  fields), `openai-runtime-contract.test.ts` (rescoped to the OpenAI utility
  paths), `source/__tests__/sentinel-chat-llm.test.ts` (Anthropic mock).

## QA / Validation

- Recreated cleanly on `cursor/anthropic-provider-qa-cutover-a092` from latest
  `main` (`54f5cab2f`) after PR #3243 was closed/conflicting.
- `npx jest src/lib/intelligence/ask/__tests__/provider-audit.test.ts src/lib/intelligence/ask/__tests__/openai-runtime-contract.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts --runInBand`
  — passed (12).
- `tsc --noEmit`, `eslint`, `npm run release:check` — passed.
- Env-var blocker documentation follow-up: `npm run release:check` and
  `npm run audit:provider-proof` — passed in this VM; Jest not rerun here because
  `node_modules/` is absent.
- Provider image built: `acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933`.
- **Azure Container Apps test revision staged safely:** `provqa` is healthy and
  held at **0% traffic**; the existing production revision remains pinned at
  **100% traffic**. Unauthenticated liveness on the revision-scoped FQDN passed
  (Home/sign-in 200, no Supabase refs). See
  `docs/build/azure-container-apps-cutover-2026-06-07/SIGNED_IN_AZURE_QA.md`.
- **Signed-in Azure Container Apps QA — BLOCKED/not run:** this agent VM still
  has no Clerk auth material (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `CLERK_SECRET_KEY`, `DEMO_LOGIN_PASSWORD`, and any Clerk `__session` cookie are
  absent), and repeated mint attempts fail before HTTP with missing
  `CLERK_SECRET_KEY`. Protected Sentinel/Source paths still cannot be exercised
  from here. Latest all-persona mint command:
  `BASE_URL=https://ca-abarva-web-lab-eastus--provqa.agreeableocean-2c1472e6.eastus.azurecontainerapps.io npm run auth:agent-client-states -- --refresh`;
  blocked for all 8 canonical personas and generated non-secret report
  `reports/agent-client-auth/agent-client-auth-2026-06-07T05-16-42-634Z.md`.
- **Blocked / not run:** signed-in live Sentinel Ask + Source chat QA (no Clerk
  session in this environment). This is the gating requirement before production
  — confirm Claude answers are advisor-quality, citations intact, streaming/UX
  unaffected, and `ai_egress_audit` shows `provider=anthropic`.
- Pre-existing unrelated failures in `src/lib/source/exports/*` and
  event-code/artifact-binding suites are present on `main` independent of this
  change (verified by stashing).

## Rollout Plan

Reviewed PR, **do not auto-deploy.** Merge only after the signed-in QA gate
passes. Requires `ANTHROPIC_API_KEY` in the target runtime for the Sentinel Ask and
Source chat provider check. Ticket-mint QA from an agent VM requires
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`; demo-login fallback, if
enabled, requires `DEMO_LOGIN_PASSWORD`. Optional model override env vars are
`INTELLIGENCE_ASK_ANTHROPIC_SYNTHESIS_MODEL`,
`INTELLIGENCE_ASK_ANTHROPIC_SMALL_MODEL`, `ANTHROPIC_MODEL`,
`ANTHROPIC_MINI_MODEL`, and `SENTINEL_CHAT_MODEL` (safe Claude defaults exist).
The legacy `OPENAI_API_KEY` is no longer used by these two reasoning paths.

## Rollback Plan

Revert the PR (restores the OpenAI synthesis runtime + Source OpenAI path). No
data/schema change. Per-path revert is possible (synthesizer.ts and
sentinel-chat-llm.ts are independent).

## Audit Evidence

- `provider-audit.test.ts` wiring and audit-envelope assertions; jest outputs
  on the branch.
- `ai_egress_audit` rows for `intelligence-ask-synthesis` and
  `source-sentinel-chat` should read `provider=anthropic` once exercised live.

## Known Gaps

- Intent classifier (`classifier.ts`) and follow-up suggestions (`followups.ts`)
  still use the OpenAI small-model utility path — tracked as the remaining
  Anthropic-only cleanup (non-reasoning utilities).
- Signed-in live QA not performed in this environment (no Clerk
  env/session names listed above), although the `provqa` test revision is healthy
  at 0% traffic and production remains at 100% traffic on the existing revision.
