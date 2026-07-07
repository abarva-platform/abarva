# Azure Container Apps Runtime Proof — 2026-06-08

**Goal:** Prove the AbarVa Next.js runtime runs on **Azure Container Apps (ACA)** and can reach the **private Azure data plane** (Postgres / Key Vault / Blob / AI Search) — an Azure runtime migration proof, **not** a Vercel workaround. No Vercel URL is used in any proof below.

**Outcome:** ✅ **Azure runtime migration is PROVEN.** The Next.js app runs on ACA, reaches private Azure Postgres (public network disabled) over VNet peering + private DNS, authenticates via Clerk password sign-in, resolves the signed-in user to the **Meridian** tenant (no Apex bleed), and writes the Responsible-AI acknowledgment to the Azure DB. **8 of 8 pass criteria met** (see Addendum — criterion #5 closed by the discovery re-home).

> **Addendum 2026-06-08 (criterion #5 closed):** the DiscoveryCapturePanel gap was a feature-surface mismatch (it was wired to the superseded `/programs/new` / `ProgramOriginationWorkspace`). Fixed in **PR #3315** by re-homing the panel onto the live `StrategicMoveOriginateClient` (`/strategic-moves/new`) as a flag-gated **Brief | Discovery** canvas sub-tab, fed by a new `strategicMoveBriefToDiscoveryShape` adapter. Built image `acrabarvalab001.azurecr.io/abarva/web:rehome-discovery-5d7a44bcbc`, deployed to revision **`ca-abarva-web-lab-eastus--0000061`** (100% traffic; rollback `--0000059`). **Verified live on the ACA URL signed in as Meridian: the DISCOVERY sub-tab renders "Discovery shape · 0 of 8 captured"** (empty brief → empty dimensions, nothing fabricated). `/api/health` still `postgres:true`. Tier B (persist `discoveryShape` on promote + wire upload/receipt/template flows into the live surface) remains open.

---

## What exists today (Phase 0 inventory)

- **Subscription:** `abarva-lab-sub` (`701a8554-a166-46e9-bf13-743bc50e3b20`), region `eastus` (+ Postgres in `eastus2`).
- **Resource groups:** `rg-abarva-controlplane-lab-eastus`, `rg-abarva-private-dataplane-lab-eastus`, `rg-abarva-observability-lab-eastus`, `rg-abarva-shared-security-lab-eastus`, `rg-abarva-database-lab-eastus2` (+ a separate `*-lakeshore-pilot-*` set).
- **ACR:** `acrabarvalab001` (publicNet Enabled, admin disabled, RBAC pull). Builds from `main` land here regularly.
- **Container Apps env:** `cae-abarva-scale-lab-eastus` — provisioning Succeeded, VNet-integrated into `vnet-abarva-private-dataplane-lab-eastus/snet-app`, static IP `4.255.59.220`, default domain `agreeableocean-2c1472e6.eastus.azurecontainerapps.io`.
- **Container App `ca-abarva-web-lab-eastus`:** **EXISTS and was Running** before this work (revision `--0000058`, image digest `sha256:1eafa212…` = tag `main-20260608-d840c73d48`, built 16:29Z), min/max replicas 1/2, UserAssigned identity.
- **Managed identity `id-abarva-scale-runtime-lab-eastus`** (`principalId 42f131d5…`, `clientId 3b6e0c9d…`) RBAC:
  - **AcrPull** on `acrabarvalab001` ✓
  - **Key Vault Secrets User** on `kv-abarva-lab-001` ✓
  - **Storage Blob Data Contributor** on `stabarvaprivatedplab001/context-drops` ✓
  - **Search Index Data Reader/Contributor + Search Service Contributor** on `srch-abarva-context-lab-eastus` ✓
  - **Service Bus Data Sender/Receiver** on `sb-abarva-lab-eastus(-prem)` queues ✓
- **Key Vault `kv-abarva-lab-001`:** PublicNetworkAccess **Disabled** (private endpoint only) — secrets are NOT readable from a workstation; only the in-VNet managed identity can read them. (README's "public access enabled" note is stale.)
- **Postgres:** `pg-abarva-context-lab-001` (`eastus2`, **publicNet Disabled**, private). Network path: VNet peering `vnet-abarva-private-dataplane-lab-eastus → vnet-abarva-database-lab-eastus2` is **Connected**, private DNS zone `privatelink.postgres.database.azure.com` present.

## What was changed (this session)

1. **Built a fresh image from `main` HEAD** (`289d67ddf4`, the latest commit incl. all discovery merges) because the running revision (`d840c73d48`, 16:29Z) predated the final merges. Built via `az acr build` from a clean, secret-free context (`.env.local` removed; `.dockerignore` excludes `.env*`/`node_modules`/`.next`/`.git`).
2. **Added runtime env** `ABARVA_FEATURE_DISCOVERY_INTAKE_V2_TENANTS=meridian,apexretail` to the Container App.
3. **Updated the Container App** to the new image and **shifted 100% ingress traffic** to the new revision `--0000059`.

## Image tag / digest

- **Tag:** `acrabarvalab001.azurecr.io/abarva/web:main-289d67ddf4`
- **Digest:** `sha256:615d9681b78c4616900571b7f9790630313e74aa0b920e37063a8e8f7416abf6`
- **ACR build run:** `ca2r`, successful in 8m46s.
- Built from git `289d67ddf4` ("feat(discovery): industry profiles … (#3310)").

## Container App revision

- **Active revision:** `ca-abarva-web-lab-eastus--0000059` — Healthy, Running, 1 replica, **100% traffic**.
- **Previous revision retained for rollback:** `--0000058` (image `sha256:1eafa212…`).

## ACA URL (proof endpoint — not Vercel)

`https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`

## Env / secret matrix (names only — no values)

**Runtime env vars on the app:** `ABARVA_DATA_PLANE`, `ABARVA_FEATURE_RETRIEVAL_AZURE_SEARCH_TENANTS`, **`ABARVA_FEATURE_DISCOVERY_INTAKE_V2_TENANTS` (added → `meridian,apexretail`)**, `ANTHROPIC_API_KEY`, `APPLICATIONINSIGHTS_CONNECTION_STRING`, `AZURE_CLIENT_ID`, `AZURE_CONNECTIVITY_*`, `AZURE_KEY_VAULT_NAME`, `AZURE_SEARCH_SERVICE_NAME`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `DATA_PLANE_OBJECT_STORE_ACCOUNT`, `DATA_PLANE_OBJECT_STORE_CONTAINER`, `DEMO_LOGIN_PASSWORD`, `GAMMA_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_DEMO_MODE`, `NEXUS_COMPOSER_MODEL`, `NODE_ENV`, `OPENAI_API_KEY`, `PARALLEL_RUN_INVARIANT_TOKEN`, `PORT`, `HOSTNAME`, `SERVICE_BUS_NAMESPACE`, `SERVICE_BUS_QUEUE_NAME`.

**Key Vault-backed secrets bound on the app:** `clerk-secret-key`, `azure-postgres-control-database-url`, `anthropic-api-key`, `openai-api-key`, `azure-search-admin-key`, `appinsights-connection-string`, `azure-connectivity-health-token`, `parallel-run-token`, `gamma-api-key`, `demo-login-password`.

**Stale refs — present but UNUSED (not bound to any env var):** `neo4j-uri`, `neo4j-username`, `neo4j-password`, `pinecone-api-key`. **No Supabase env or secret exists on the running app.** Recommended cleanup: remove the four unused Neo4j/Pinecone secrets and prune the Supabase/Pinecone/Neo4j refs still present in `infra/azure/parameters/app-runtime.lab.bicepparam` (the Bicep param file is stale relative to the live app). No active Supabase/Pinecone/Neo4j runtime dependency was reintroduced.

## DB connectivity proof (private data plane, from ACA)

`GET https://ca-abarva-web-lab-eastus.…azurecontainerapps.io/api/health` → **HTTP 200**

```json
{
  "ok": true,
  "checks": {
    "postgres": true,
    "direct_postgres": true,
    "azure_graph": "postgres"
  }
}
```

Confirmed on the **new revision `--0000059`** after the traffic cutover. Postgres has public network access **Disabled**; reachability is via the Connected VNet peering + private DNS zone only. This is the core migration proof: the ACA runtime reaches the private Azure Postgres.

## Clerk origin status (Phase 4)

- The ACA FQDN is an **accepted Clerk Development redirect/origin** — navigating to the ACA `/programs/new` redirected to the Clerk hosted sign-in with `redirect_url=https://ca-abarva-web-lab-eastus.…azurecontainerapps.io/strategic-moves/new` and **no origin error**.
- Clerk Development **password sign-in is enabled** (founder enabled it this session).
- Production Clerk / production domain were **not** touched.

## Signed-in proof (Phase 5)

Clean browser context (signed out first). Credentials: `anand.sundaram+meridian@thesundaram.com` / password.

| #   | Pass criterion                                   | Result                                                                                                         |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 1   | Password login succeeds                          | ✅ via Clerk hosted page on the ACA URL                                                                        |
| 2   | Active client resolves to Meridian               | ✅ header + breadcrumb show **"MERIDIAN HEALTH SYSTEM"**                                                       |
| 3   | Responsible-AI acknowledgment writes to Azure DB | ✅ no "ledger unavailable"; flow advanced (contrast: localhost failed here with `ENOTFOUND` on the private DB) |
| 4   | `/programs/new` renders                          | ✅ renders (routing cutover serves it as `/strategic-moves/new`)                                               |
| 5   | **DiscoveryCapturePanel appears**                | ❌ **not shown — feature-surface mismatch (see Blockers)**                                                     |
| 6   | Screenshot captured                              | ✅ signed-in Meridian originate page on the ACA URL                                                            |
| 7   | No Apex tenant bleed                             | ✅ resolved to Meridian, not Apex                                                                              |
| 8   | No Vercel URL used in proof                      | ✅ all proof on the ACA FQDN                                                                                   |

## Screenshots

- Signed-in **Meridian Health System** originate page on the ACA URL (`/strategic-moves/new`), top-nav shows "Meridian Health System" + "Anand Sundaram · Meri…", left Nexus agent panel + Ask bar, right P0 capture stepper. Captured 2026-06-08.

## Blockers

**#5 DiscoveryCapturePanel does not appear — and this is NOT an Azure runtime problem.** Root cause: the discovery-intake feature (16 PRs this session) was wired into `ProgramOriginationWorkspace` rendered by **`/programs/new`**. The live origination surface is **`/strategic-moves/new`**, which renders a _different, newer_ component, **`StrategicMoveOriginateClient`** (no discovery references), and the routing cutover redirects `/programs/*` → `/strategic-moves/*`. So the panel is unreachable in the live app — it would also be absent on Vercel. **Fix (separate workstream):** re-home the discovery capture (DiscoveryCapturePanel + brief-to-shape + receipt card + flag wiring) onto `StrategicMoveOriginateClient` / `/strategic-moves/new`, then rebuild + redeploy. Flag and image are already correct, so once re-homed the panel will render on this same ACA revision pattern.

Other notes:

- `infra/azure/parameters/app-runtime.lab.bicepparam` is **stale** (still wires Supabase/Pinecone/Neo4j and an old image tag); the live app config has already moved past it. Reconcile before using that param file for a fresh deploy.

## Rollback path

- **App rollback:** `az containerapp ingress traffic set -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --revision-weight ca-abarva-web-lab-eastus--0000058=100` (instantly reverts to the prior image/revision; `--0000059` stays available).
- **Vercel:** remains the live production runtime for `app.abarva.ai` and is the **rollback runtime** until Azure passes a full signed-in smoke + a stable monitoring window. No DNS/custom-domain change was made.

## Is Vercel still only a rollback runtime?

Yes. This proof did not touch DNS or the production Clerk/domain. Vercel (`nexus` project → `app.abarva.ai`) remains the live production runtime and the rollback target. Recommended cutover order (unchanged): ACA deployed → full signed-in smoke on ACA URL → Clerk origins/redirects updated → DNS cutover to Azure ingress/Front Door → post-cutover smoke → monitor 24–72h → then retire Vercel.
