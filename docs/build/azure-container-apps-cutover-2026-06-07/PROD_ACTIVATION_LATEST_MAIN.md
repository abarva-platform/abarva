# Production Activation — latest `main` on Azure Container Apps (2026-06-07)

Lead-driven activation of `origin/main` HEAD `70c4f98bf` (PRs #3268/#3269, #3270, #3272, #3273, #3274).

## Deploy (Lane 1) — DONE

| Item | Value |
|---|---|
| Built from | `main@70c4f98bf` (via `az acr build`) |
| Image | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-70c4f98bf` |
| Digest | `sha256:4b448827b4067a95a46f953c5e53ae62a6a7bc755e37604137b645f61b35e381` |
| Revision | `ca-abarva-web-lab-eastus--0000052` (traffic **100%**) |
| `app.abarva.ai` | HTTP/2 200, `x-powered-by: Next.js`, **no** `server: vercel` / `x-vercel-id` |
| `/api/health` | `postgres:true, direct_postgres:true, azure_graph:postgres` |

GATE-DEPLOY: ✅ live image = main HEAD, Azure-backed, no Vercel headers.

## Migration / schema (Lane 2) — DONE

- Migrate job `job-abarva-db-migrate-lab-eastus` repointed to the new image and run.
- First pass applied the `ai_egress_control_plane` migration but **failed** at
  `20260602100000_source_events_idempotency.sql` (3 duplicate `(client_key,event_code)` groups).
- Fix (prescribed): `scripts/source-events-dedup.ts --apply` via the private operator job —
  soft-archived the 3 dupes (kept earliest row, set rest `lifecycle_state='archived'`, **no deletes**).
- Re-run applied **7 pending migrations**, incl. `20260602100000_source_events_idempotency ✓` and
  **`20260607150000_anthropic_first_party_default_policy ✓`**.

GATE-SCHEMA: ✅ `clients.ai_policy` + `ai_egress_audit` + `tenant_policy_audit` present in `abarva_control`
(`inet_server_addr=10.43.1.4`). First-party default policy applied → all tenants `allowClaude:true`.

## Provider / Anthropic-only (Lane 3) — PROVEN

`ai_egress_audit` (post-activation), reasoning workflows:

| workflow | provider | route | decision |
|---|---|---|---|
| `intelligence-ask-synthesis` | **anthropic** | anthropic-direct | allow |
| `intelligence-ask-followups` | **anthropic** | anthropic-direct | allow |
| `intelligence-ask-intent-classifier` | **anthropic** | anthropic-direct | allow |
| `*-embedding` (utility) | openai/openai-embeddings | openai-direct/azure-foundry-private | mixed (allow/deny) |

✅ Production reasoning is Anthropic/Claude only. OpenAI appears solely in embedding utilities.

## GATE-LIVE-ANSWER — PASS

Real `askIntelligence` (new image, headless operator job), both persona tenants returned
**non-stub** grounded answers:
- **Lakeshore** — 1,521-char answer, 8 sources, all real Kyriba/treasury patterns. (Was Claude-denied pre-migration.)
- **Meridian** — non-stub; correctly **refused to fabricate** the exec bench / analytics stack (fact layer absent — see CXO audit).

## Read-only proof method

All private-plane reads/writes ran inside `job-abarva-private-operator-eus` (ARM-PATCH command override, restored after; `NODE_OPTIONS=--conditions=react-server` for `tsx` to import the real reasoning stack). Logs via Log Analytics `03910a48-…`. No secret values printed.
