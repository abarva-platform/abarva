# Platform Standard — Azure-native runtime, Anthropic-only reasoning

**Status:** active · **Adopted:** 2026-06-07 · **Supersedes:** Vercel-runtime + OpenAI-reasoning + Supabase-data assumptions.

This is the canonical "new standard" for the platform. New code MUST conform; legacy
is tracked and shrinking. Two pieces are machine-enforced today (see Enforcement);
the rest are in-flight decommissions.

## The standard

| Layer | Standard (required) | Legacy (out — do not extend) |
|---|---|---|
| **Reasoning / synthesis** | **Anthropic / Claude only**, via the audited client (`getAuditedAnthropicClient` / `preflightAnthropicDirectClient`) | OpenAI for any answer/synthesis/classification path |
| **OpenAI (permitted use)** | Embeddings, demo audio, ingestion/seed scripts, the audited egress wrapper — **non-reasoning utilities only** | Using the OpenAI SDK for reasoning |
| **Runtime** | Azure Container Apps | Vercel runtime |
| **Data plane** | Azure private Postgres + Azure AI Search (`DATABASE_URL` → Azure) | Supabase; Supabase fallback |

### Why Anthropic-only for reasoning
Response quality and consistency for executive-grade answers is a hard product
requirement. Production will run **Anthropic only**; a reasoning path that silently
depends on `OPENAI_API_KEY` degrades to a stub or errors in an Anthropic-only prod
(observed: Sentinel synthesis returned "Set OPENAI_API_KEY…" with only Anthropic set).

## Enforcement (machine-checked)

`scripts/guardrails/anthropic-only-reasoning.mjs` (run via `npm run guard:reasoning`,
and in CI via `src/__tests__/guardrails/anthropic-only-reasoning.test.ts`):

- **Default-deny OpenAI** across `src/`. Every OpenAI marker (`from 'openai'`,
  `@ai-sdk/openai`, `new OpenAI(`, `OPENAI_API_KEY`) must fall into:
  1. `ALLOWED_OPENAI_PATHS` — embedding/audio/ingestion/egress-wrapper zones, or
  2. `KNOWN_LEGACY_REASONING` — tracked reasoning debt that must shrink to zero.
- The deleted `openai-runtime` module may never be referenced again.
- **Ratchet:** a tracked-legacy file that no longer uses OpenAI fails the guard
  until removed from the list — the debt list can only shrink.

## Anthropic is first-party (egress policy)

Claude is the sanctioned first-party reasoning provider, not "external AI". The AI
egress policy (`src/lib/integrations/ai-egress/policy.ts`) allows `anthropic` by
default, gated only by an explicit tenant `allowClaude:false` opt-out and the
data-class ceiling — it is exempt from the `allowExternalAI` / `kernelOnlyMode`
controls that govern genuinely external providers (Gamma, etc.). The default tenant
policy is `allowClaude:true`, `kernelOnlyMode:false`, `maxDataClass:confidential`.

## Current state (2026-06-07)

**Converted to Anthropic in this change:**
- `src/lib/intelligence/ask/` — Sentinel/Nexus ask: `classifier.ts`, `synthesizer.ts`,
  `followups.ts` now use Claude; `openai-runtime.ts` deleted.
- `src/app/api/chat/route.ts` — reasons via the audited Anthropic client.

**Tracked OpenAI-reasoning debt (MUST convert next):**
- `src/lib/source/sentinel-chat-llm.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-openai/route.ts`

## Ops items to make the standard true in *running* prod

1. **Redeploy** the Azure Container App from current `main` — the running image is a
   stale, OpenAI-gated build; until redeployed, prod Sentinel synthesis returns the
   OpenAI stub even though `main` is Anthropic.
2. **Apply the `ai_policy` migration to Azure** (`ALTER TABLE clients ADD COLUMN IF
   NOT EXISTS ai_policy JSONB`). It is missing on `abarva_control`; synthesis errors
   `AI policy lookup failed: column "ai_policy" does not exist` regardless of provider.
3. Vercel runtime teardown + Supabase data-plane sunset proceed on their own lanes
   (already in flight); do not reintroduce either as a runtime/data dependency.

## Follow-on guards (next)

- Extend the guard to **block new `@supabase/*` runtime imports** (baseline the
  existing legacy clients; ratchet to zero).
- Add a **no-Vercel-runtime-assumption** check once the Vercel teardown completes.
