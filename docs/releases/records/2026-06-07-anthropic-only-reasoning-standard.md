# 2026-06-07-anthropic-only-reasoning-standard — Anthropic-only reasoning (Azure-native standard)

## Release ID

`2026-06-07-anthropic-only-reasoning-standard`

## Status

`candidate`

## Plain-English Summary

Production reasoning must run on Anthropic/Claude only. This change converts the
Sentinel/Nexus "ask" pipeline (intent classification, answer synthesis, follow-ups)
and the `/api/chat` route from OpenAI to the audited Anthropic client, deletes the
OpenAI runtime in that path, and adds a machine-enforced guard so reasoning code
can't regress to OpenAI. OpenAI remains allowed only for non-reasoning utilities
(embeddings, demo audio, ingestion scripts). This codifies the broader "new
standard": Azure-native runtime + Azure private data plane + Anthropic reasoning;
Vercel/Supabase/OpenAI-for-reasoning are legacy.

## Layer Impact

- `global-control-lane`: shared answer-generation behavior. The ask reasoning path
  and chat route now use Claude. No schema change, no data-plane writes. A new CI
  guard (`scripts/guardrails/anthropic-only-reasoning.mjs`) enforces the rule.

## Client Applicability

- All clients: Yes — applies to every tenant's Sentinel/Nexus answers.
- Feature flag: None. The rule is unconditional.

## Changes Included

- Converted (extracted from in-flight `codex/corpus-wave-24`, the coherent ask unit):
  `src/lib/intelligence/ask/{classifier,synthesizer,followups,index,response-policy,
  tenant-fact-fingerprint,tenant-identity-pin}.ts` → Anthropic; deleted
  `ask/openai-runtime.ts` and `ask/evidence-field-disclosure.ts`; updated ask tests;
  `src/app/api/chat/route.ts` → audited Anthropic client.
- New: `scripts/guardrails/anthropic-only-reasoning.mjs` (default-deny OpenAI guard,
  ratcheting legacy list), `src/__tests__/guardrails/anthropic-only-reasoning.test.ts`,
  `docs/architecture/AZURE_NATIVE_ANTHROPIC_STANDARD.md`, `npm run guard:reasoning`.

Not included: no data-load/corpus changes, no Supabase use or fallback, no DNS/
Vercel/drain/search/freeze/account changes. The two remaining OpenAI-reasoning files
(`source/sentinel-chat-llm.ts`, `generate-from-openai` route) are tracked debt, not
converted here.

## QA / Validation

- `npm run guard:reasoning` → passes (4,293 files scanned; 2 tracked-legacy remain).
- `jest` guardrails + ask suites → pass.
- ESLint touched files clean; `tsc --noEmit` no new errors in touched files.
- `npm run release:check -- --base origin/main --head HEAD` → see PR CI.

## Rollout Plan

Merge to `main`, then **redeploy the Azure Container App** (the running image is a
stale OpenAI-gated build). Apply the `ai_policy` migration to Azure so synthesis
does not error on the missing column. No data migration.

## Rollback Plan

Revert the PR (code-only). The ask path returns to the prior OpenAI runtime. No data
or schema state to unwind. (Note: reverting reintroduces a standard violation; the
guard would then fail, which is the intended signal.)

## Audit Evidence

- PR: `cursor/anthropic-only-reasoning-enforcement` → main.
- Guard output + jest run in CI.
- Standard doc: `docs/architecture/AZURE_NATIVE_ANTHROPIC_STANDARD.md`.
- Provenance of the conversion: extracted from `codex/corpus-wave-24` (its ask-path
  Anthropic refactor), de-risked to stand alone on `origin/main`.

## Known Gaps

- Two OpenAI-reasoning files remain (tracked in the guard): `sentinel-chat-llm.ts`
  and the `generate-from-openai` Source route — convert next.
- Guard does not yet block new `@supabase/*` runtime imports or Vercel-runtime
  assumptions (follow-on guards).
- Running prod stays OpenAI-gated until the Azure Container App is redeployed and the
  `ai_policy` migration is applied (ops items).
