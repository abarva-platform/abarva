# Final Signed-In Production QA — `app.abarva.ai` (2026-06-07)

Status: **BLOCKED — cannot run signed-in QA on `app.abarva.ai` yet.** Two
preconditions are unmet in this environment:

1. **`app.abarva.ai` still serves Vercel** (HTTP 503), because the DNS cutover
   is blocked on manual Namecheap registrar action — see
   `FINAL_DNS_CUTOVER.md`. Signed-in QA against the production hostname is
   meaningless until it resolves to Azure.
2. **No Clerk session is available** in this headless agent. Signed-in QA of
   Home / Intelligence (Sentinel) / Moves / Source / Tower / Setup-Admin
   requires an authenticated browser session and a known tenant.

This document records the Azure-target health that **was** provable without a
session, plus the exact signed-in QA script for the operator to run once DNS
is cut over.

> Guardrails held: no secrets printed; only env/secret **names** inspected;
> no Supabase reintroduced; no Azure resources changed.

## A. Azure-backed runtime proof (no session required) — ✅ verified

These confirm the Azure target is the genuine app and is Azure-backed, not
Supabase-backed.

### A.1 Health + identity (Azure FQDN)

- `GET https://…azurecontainerapps.io/` → **200**, `x-powered-by: Next.js`,
  no `server: Vercel`, no `x-vercel-id`.
- `GET https://…azurecontainerapps.io/api/health` → **200**:

```json
{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }
```

### A.2 No Supabase env/host references — ✅ verified

Active container env var **names** (values not printed):

```
ABARVA_DATA_PLANE, ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS,
ANTHROPIC_API_KEY, APPLICATIONINSIGHTS_CONNECTION_STRING, AZURE_CLIENT_ID,
AZURE_CONNECTIVITY_HEALTH_TOKEN, AZURE_CONNECTIVITY_KEY_VAULT_SECRET_NAME,
AZURE_CONNECTIVITY_SEARCH_INDEX_NAME, AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME,
AZURE_KEY_VAULT_NAME, AZURE_SEARCH_SERVICE_NAME, CLERK_SECRET_KEY,
DATABASE_URL, DEMO_LOGIN_PASSWORD, GAMMA_API_KEY, HOSTNAME,
INGESTION_SMOKE_CONTAINER_NAME, INGESTION_SMOKE_STORAGE_ACCOUNT_NAME,
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_DEMO_MODE,
NEXT_TELEMETRY_DISABLED, NEXUS_COMPOSER_MODEL, NODE_ENV, OPENAI_API_KEY,
PARALLEL_RUN_INVARIANT_TOKEN, PORT, SERVICE_BUS_NAMESPACE, SERVICE_BUS_QUEUE_NAME
```

- `grep -i supabase` over env var names → **NONE**.
- `DATABASE_URL` is bound to secret ref `azure-postgres-control-database-url`
  (Azure Postgres) — **not** Supabase. Guardrail "do not point DATABASE_URL to
  Supabase" holds.
- `ABARVA_DATA_PLANE = azure-postgres`.
- Secret **names** present include legacy `neo4j-*` / `pinecone-api-key`
  (compatibility-era residue, not injected as runtime env), and
  `anthropic-api-key`. **No `supabase*` secret exists.**

### A.3 Provider expectation (LLM audit)

- `ANTHROPIC_API_KEY` env + `anthropic-api-key` secret are present; the image
  tag is `cutover-provider-anthropic-20260607-683eb933`, consistent with the
  Anthropic provider migration. Sentinel/Source LLM audit rows are therefore
  expected to record `provider=anthropic`. **Row-level confirmation requires
  a signed-in session and is part of the blocked checklist below.**

## B. Blocked signed-in QA checklist (run after DNS cutover)

For each surface, sign in to `https://app.abarva.ai` with a known tenant and
capture proof.

| Surface | Route(s) | Required proof |
| --- | --- | --- |
| Home | `/` | 200, no 500; correct tenant in header/switcher |
| Intelligence / Sentinel | `/intelligence`, Sentinel views | 200; answers grounded in Azure context; `ai_egress_audit.provider = anthropic` |
| Moves (Strategic Moves) | `/strategic-moves`, `/strategic-moves/[moveId]` | 200; moves scoped to active tenant only |
| Source | `/source` | 200; LLM audit rows `provider = anthropic`; exports tenant-scoped |
| Tower (Control Tower) | Tower route | 200; execution/value rows are tenant-scoped |
| Setup / Admin | `/setup`, admin | 200; admin data loader path; no cross-tenant rows |

For every surface confirm:

- **HTTP 200 / no 500.**
- **Correct tenant** — the active `client_id` matches the signed-in tenant.
- **No cross-tenant leakage** — switch tenants and confirm row sets change and
  never bleed across `client_id`.
- **No Supabase env/host references in logs** — tail Container App logs:
  `az containerapp logs show -g rg-abarva-controlplane-lab-eastus -n ca-abarva-web-lab-eastus --tail 200`
  and confirm no `supabase`/`*.supabase.co` host strings.
- **LLM audit provider** — Sentinel/Source rows in `ai_egress_audit` (or
  equivalent) show `provider = anthropic`.
- **Current-state grounding** — ask a current-state technology/context question
  and confirm the answer returns concrete Azure-backed context (matching the
  drained enterprise-context corpus), not a generic or empty response.

## C. Gate status

| Gate | Status |
| --- | --- |
| Azure target healthy + Azure-backed (no session) | ✅ verified |
| No Supabase env/secret references | ✅ verified |
| Anthropic provider configured | ✅ verified (env/secret/image) |
| Signed-in QA on `app.abarva.ai` (all 6 surfaces) | ⛔ BLOCKED — DNS not cut over + no session |
| LLM audit `provider=anthropic` row proof | ⛔ BLOCKED — needs session |
| Cross-tenant isolation proof | ⛔ BLOCKED — needs session |

Until Section B passes, Vercel must **not** be removed.
