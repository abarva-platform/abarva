# Final Signed-In Production QA — `app.abarva.ai` (2026-06-07)

Status: **COMPLETE for production route QA — `app.abarva.ai` now serves Azure
and signed-in browser QA passed.**
Unauthenticated production proof on the live hostname is done (Azure-backed,
no Vercel, correct auth gating, no 5xx). The operator also completed signed-in
browser QA across the six core surfaces after repairing live Azure schema drift
with existing repo migrations. Row-level Anthropic provider audit proof remains
a separate provider-migration evidence item, not a blocker for the DNS/runtime
cutover.

> Guardrails held: no secrets printed; only env/secret **names** inspected;
> no Supabase reintroduced; no Azure resources changed; Vercel not removed
> (Vercel credentials are not present in this environment).

## 0. Live production proof on `https://app.abarva.ai` (verified ~06:19Z)

| Surface | Route | Result (unauthenticated) |
| --- | --- | --- |
| Home | `/` | **200**, `x-powered-by: Next.js`, no Vercel headers |
| Health | `/api/health` | **200**, `postgres/direct_postgres=true`, `azure_graph=postgres` |
| Intelligence/Sentinel | `/intelligence` | **307 → `/sign-in?redirect=%2Fintelligence`** (Clerk auth gate) |
| Moves | `/strategic-moves` | **307** → Clerk sign-in |
| Source | `/source` | **307** → Clerk sign-in |
| Tower | `/tower` | **307** → Clerk sign-in |
| Setup/Admin | `/setup` | **301 → `/admin`** (then Clerk auth gate) |
| Sign-in | `/sign-in` | **200** |

No surface returned a 5xx. Protected routes correctly redirect unauthenticated
requests to Clerk sign-in — proper auth gating, served by Azure. The TLS cert
is `CN=app.abarva.ai` (DigiCert/GeoTrust), validated without `-k`.

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
  expected to record `provider=anthropic`.
- Row-level `ai_egress_audit.provider=anthropic` confirmation was not separately
  captured in this PR. Treat that as provider-migration audit evidence still to
  capture, not as a failure of the Azure DNS/runtime cutover.

## A.4 Signed-in production QA — ✅ PASSED (operator browser test, ~06:42Z+)

The operator completed signed-in browser QA on `https://app.abarva.ai` after
repairing live Azure schema drift (existing repo migrations applied to Azure
Postgres: Responsible AI ledgers, engagement `function_pack_key`, Lakeshore
holding-group metadata — see PR #3266). Agent re-confirmed all routes are
Azure-served (307 → Clerk sign-in unauthenticated, no 5xx, no Vercel headers).

| Surface | Route | Signed-in result |
| --- | --- | --- |
| Home | `/home` | ✅ renders signed-in |
| Intelligence / Sentinel | `/intelligence` | ✅ renders (corpus empty — see caveat) |
| Moves | `/strategic-moves` | ✅ renders (no moves — see caveat) |
| Source | `/source/queue` | ✅ renders |
| Tower | `/tower` | ✅ renders (no substrate — see caveat) |
| Setup / Admin | `/admin` | ✅ renders (`0 records` — see caveat) |

Additional passes:

- **Responsible AI acknowledgment/training** works and records to **Azure
  Postgres**.
- **Fresh post-fix Azure log filter** (after `2026-06-07T06:42:00Z`):
  **0 Supabase references, 0 missing-column errors, 0 HTTP 500 matches.**
- Local: `git diff --check` and
  `npm run release:check -- --base origin/main --head HEAD` pass.

### Honest caveat — Lakeshore is NOT rich-demo-ready

The app renders **safely** and is Azure-backed, but the Lakeshore tenant content
is not seeded:

- Intelligence reports **corpus not seeded**.
- Moves has **no moves**.
- Tower has **no substrate**.
- Admin shows **`0 records`**.

This is a **data-seeding gap, not a runtime/safety failure** — routing, auth,
schema, and the Azure data plane are healthy. Rich-demo readiness (loading
Lakeshore corpus/moves/substrate via the Admin Data Loader) is tracked
separately and is **out of scope** for this cutover/shutdown evidence. **No
sunset-ready claim is made.**

## B. Signed-in QA checklist (reference — now satisfied above)

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
| `app.abarva.ai` cut over to Azure (off Vercel) | ✅ verified ~06:19Z |
| Azure target healthy + Azure-backed | ✅ verified |
| Unauthenticated route proof (6 surfaces, no 5xx, auth gated) | ✅ verified on `app.abarva.ai` |
| No Supabase env/secret references | ✅ verified |
| Anthropic provider configured | ✅ verified (env/secret/image) |
| Signed-in QA on `app.abarva.ai` (all 6 surfaces) | ✅ PASSED — operator browser test ~06:42Z+ |
| Responsible AI acknowledgment records to Azure Postgres | ✅ PASSED |
| Fresh post-fix Azure logs: 0 Supabase / 0 missing-column / 0 500 | ✅ PASSED (after `06:42:00Z`) |
| Lakeshore rich-demo readiness (corpus/moves/substrate seeded) | ❌ NOT ready (data-seeding gap, out of scope; no sunset claim) |

Signed-in QA passed. The only remaining gate before Vercel removal is having
Vercel credentials available to this environment (none present). No sunset-ready
claim is made; Lakeshore content seeding is tracked separately.
