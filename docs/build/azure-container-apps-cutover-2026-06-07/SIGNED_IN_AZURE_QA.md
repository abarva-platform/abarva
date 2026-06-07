# Signed-in Azure Container Apps QA — 2026-06-07

## UPDATE 2026-06-07 ~04:30Z — test revision deployed; signed-in QA still BLOCKED

**0-traffic test revision deployed safely (production traffic untouched):**

- `ca-abarva-web-lab-eastus` switched to **multiple** revision mode; traffic pinned
  to the **named** current revision `…--0000051 = 100%` BEFORE deploying, so the new
  revision took **0%**.
- New revision **`ca-abarva-web-lab-eastus--provqa`** running image
  `cutover-provider-anthropic-20260607-683eb933` (digest `sha256:befdfdd2…`),
  `runningState=Running`, `traffic=0`.
- Traffic verified: `…--0000051 = 100`, `provqa = 0`. **DNS unchanged, prod traffic unchanged.**

**Liveness on the provider image (revision-scoped FQDN, unauthenticated):**

- `GET /` → **HTTP 200** (36 KB); **no `supabase.co`/`pooler.supabase.com`/`supabase`** refs.
- `GET /sign-in` → **HTTP 200**.
- → The Anthropic provider image **boots healthy on Azure Container Apps**.

**Signed-in QA — STILL BLOCKED (stop-and-report):**

- Protected routes on the test revision (`/intelligence`, `/strategic-moves`,
  `/source`, `/tower`, `/admin`) all return the Clerk auth wall — e.g.
  `/strategic-moves` → `https://boss-griffon-61.accounts.dev/sign-in?redirect_url=…`.
- I have **no Clerk session/credentials**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
  `CLERK_SECRET_KEY`, and `DEMO_LOGIN_PASSWORD` are all **absent** here, and the
  Key Vault holding them (`kv-abarva-lab-001`) is `publicNetworkAccess=Disabled`
  (unreachable from Cursor Cloud). So I cannot sign in to QA the 6 surfaces or run
  the golden questions, and cannot observe runtime `ai_egress_audit`.

### EXACT missing requirement to complete signed-in QA

One of the following for the Clerk instance **`boss-griffon-61.accounts.dev`**:

1. An authenticated **Clerk session cookie** (e.g. `__session` JWT) for a tenant
   test user (meridian-cdao / a lakeshore persona), provided to this environment; OR
2. **Test-user credentials** (email + password) for that Clerk instance; OR
3. The `DEMO_LOGIN_PASSWORD` value + demo-login flow (if demo auth is enabled).

The test revision `…--provqa` is left deployed at 0% traffic, ready for a
Clerk-capable operator to QA immediately (sign in against its revision FQDN, run
the 6 surfaces + Lakeshore/Meridian golden questions, confirm
`ai_egress_audit.provider=anthropic`, then record results here). To roll back the
revision-mode change: re-pin traffic and `az containerapp revision set-mode … --mode single`.

---

## Status: BLOCKED — signed-in QA cannot be completed from this environment

Per the cutover guardrail ("stop and report if signed-in QA cannot be
completed"), this is a stop-and-report. Two hard blockers:

1. **No Clerk session/credentials in this environment** (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `CLERK_SECRET_KEY`, and any session cookie are all absent). All authenticated
   surfaces (Intelligence/Sentinel, Moves, Source, Tower, Setup/Admin) redirect
   to Clerk sign-in, so they cannot be exercised.
2. **`ca-abarva-web-lab-eastus` is in Single revision mode** and already runs the
   merged-main cutover image `cutover-main-20260607-43839a41`. In Single mode,
   deploying the provider image would _replace_ the active revision (a full prod
   deploy of unmerged, QA-gated reasoning code) — not a 0-traffic test revision.
   Deploying unmerged code to the prod app is out of bounds.

The provider image is built and ready:
`acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933`.

## What WAS verified (unauthenticated, current revision)

- `GET /` → **HTTP 200** (36 KB); **no `supabase.co` / `pooler.supabase.com` / `supabase`** references in the public HTML.
- `GET /sign-in` → **HTTP 200**.
- Confirms the Azure runtime is up and the public surface has no Supabase leakage.
  (This is the current merged-main revision, not the provider image, and is unauthenticated.)

## Runbook to COMPLETE signed-in QA (operator with Clerk access)

1. **Deploy the provider image as a true test revision** (not prod-replace):
   ```
   az containerapp revision set-mode -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus --mode multiple
   az containerapp update -n ca-abarva-web-lab-eastus -g rg-abarva-controlplane-lab-eastus \
     --image acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933 \
     --revision-suffix provqa
   # keep 100% traffic on the current revision; address the new revision by its label/FQDN for QA
   az containerapp ingress traffic set -n ... --revision-weight <current>=100 <new>=0
   ```
2. **Sign in** as a tenant CXO (e.g. meridian-cdao, a lakeshore persona) against the test revision's revision-scoped FQDN.
3. For each surface — **Home, Intelligence/Sentinel, Moves, Source, Tower, Setup/Admin** — capture: HTTP 200 / no 500; correct tenant; no cross-tenant leakage; no Supabase env dependency; no runtime log refs to `supabase.co`/`pooler.supabase.com`; if an LLM is used, `ai_egress_audit.provider=anthropic`; Sentinel current-state answers cite concrete Azure-backed context.
4. **Golden questions** (capture answer text + citations + `ai_egress_audit` provider/model):
   - Lakeshore: "Talk to me about current state of data analytics and technologies we have today."
   - Lakeshore: "What do we know about Kyriba, treasury modernization, readiness gates, and failure modes?"
   - Lakeshore: "What systems, vendors, contracts, KPIs, owners, and evidence are loaded in the context layer?"
   - Lakeshore: "What evidence is live-loader-backed versus synthetic/demo?"
   - Meridian: "What is our current analytics stack and where do Epic Clarity, Caboodle, SQL Server, Tableau, SAS, Cogito, and Power BI appear or not appear?"
5. Record results back into this file + `ANTHROPIC_PROVIDER_QA.md`.

## Acceptance not yet met

Runtime `ai_egress_audit.provider=anthropic` for `intelligence-ask-synthesis` and
`source-sentinel-chat` is unconfirmed (needs a live signed-in call). Until this QA
passes, the provider migration must not merge to prod, and **no DNS / Vercel /
Supabase-sunset action** is taken.
