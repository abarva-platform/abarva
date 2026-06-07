# Signed-in Azure Container Apps QA — 2026-06-07

## UPDATE 2026-06-07 ~05:15Z — rechecked; current VM cannot perform signed-in QA

Operator re-referenced this QA record. Rechecked the current agent VM before any
traffic or auth action. Signed-in QA is still **blocked** here.

- Required auth/data env vars are absent in the process environment:
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
  `DEMO_LOGIN_PASSWORD`, and `DATABASE_URL`.
- VM boot time is **2026-06-05 09:32 UTC**. This is not a newly provisioned
  post-secret VM, so Cursor Cloud secrets added later would not be injected.
- Local tool/dependency state is also insufficient for the mint path:
  `node_modules/` is absent, local `tsx`/`@clerk/backend`/`@playwright/test`
  are absent, Node is `v22.14.0`, and `az` is not installed in this VM.
- Mint retry attempted:
  `npm run auth:agent-client-states -- --client lakeshore --refresh`.
  It fails before the helper reaches the secret check because dependencies are
  not installed: `Cannot find module '@clerk/backend'`.
- Route tested: none. No Clerk ticket/session could be minted; no authenticated
  HTTP route could be exercised; no Azure revision state could be queried from
  this VM because `az` is unavailable.

The underlying acceptance blocker remains unchanged: signed-in QA requires a
fresh, provisioned environment with Clerk/demo secrets present at startup and
the repo dependencies/browser tooling installed, or a provided Clerk session
cookie/test-user credential for `boss-griffon-61.accounts.dev`.

Guardrails held: no DNS/Vercel/Supabase action; no Azure traffic action from
this VM; no `.auth` committed.

---

## UPDATE 2026-06-07 ~05:14Z — provqa healthy, traffic unchanged

Operator status update: the `provqa` test revision is healthy and remains held
at **0% traffic**. Production traffic remains pinned at **100%** on the existing
production revision.

This confirms the provider image can remain staged for signed-in QA without
shifting live traffic. The signed-in Clerk QA gate is still open from this VM
because Clerk secrets/session material are absent here.

---

## UPDATE 2026-06-07 ~05:08Z — retried after "fresh VM"; still same VM, secrets absent

Operator reported Clerk prereqs available in a fresh VM and asked to mint + QA.
Re-checked and re-attempted; **secrets are still absent and this is NOT a fresh VM.**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DEMO_LOGIN_PASSWORD`:
  absent in `printenv`, login shell, and all `.env*` files.
- VM boot time: **2026-06-06 02:57 UTC** (`uptime` shows up 1 day, 2:10) — i.e. the
  same VM that has run since before the secrets were added. Prior-session
  `node_modules` and branch HEAD (`71dd1d42a`) are still present. Cursor Cloud Agent
  secrets are injected only at **VM provisioning**, so a long-running VM never picks
  up secrets added afterward.
- Mint attempt: `npm run auth:agent-client-states -- --client lakeshore --refresh`
  against `provqa` → both personas FAIL with
  `Missing CLERK_SECRET_KEY. Use a local .env.local; never commit it.`
  - Clerk users used: `cfo@lakeshore-holdings.example.com`,
    `cio@lakeshore-holdings.example.com`. Route tested: none (fails before HTTP).

**Remediation:** the secrets must be present when the VM is **provisioned**. Either
start a genuinely new Cloud Agent run on this branch _after_ the secrets are saved
(a new run that does `npm ci` from a clean checkout), or confirm the Clerk secrets
are scoped to repo `abarva-platform/abarva` and that secret injection is enabled for
this run. I cannot self-inject secrets into a running VM.

Guardrails held: `provqa` still 0% traffic (`--0000051=100`); no DNS/Vercel/Supabase
change; no `.auth` committed.

---

## UPDATE 2026-06-07 ~04:40Z — Clerk mint attempted; secrets not in this VM

Operator opted to provide Clerk auth via Cursor secrets and asked to mint sign-in
tickets with the repo helper (`scripts/auth/prime-agent-client-auth-states.ts`,
`npm run auth:agent-client-states`). Attempted against the 0-traffic test revision.

**Mint attempt — FAILED (exact, non-secret):**

- Command: `BASE_URL=https://ca-abarva-web-lab-eastus--provqa…azurecontainerapps.io npm run auth:agent-client-states -- --persona lakeshore-cfo --refresh`
- Clerk user identifier used: `cfo@lakeshore-holdings.example.com` (persona `lakeshore-cfo`)
- Route tested: none reached — failed before any HTTP call (secret check is first).
- **Exact non-secret error:** `Missing CLERK_SECRET_KEY. Use a local .env.local; never commit it.`

**Root cause:** the Clerk env vars are **absent in this already-running agent VM**.
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DEMO_LOGIN_PASSWORD` all
read `absent`. Cursor Cloud Agent secrets are injected into a **new** agent VM at
startup; adding them mid-session does **not** propagate into the current VM.

**To complete signed-in QA, two prerequisites in the VM that runs the mint:**

1. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` present at VM start
   (start a **fresh agent run** after adding the Cursor secrets), and
2. Playwright chromium installed (`npx playwright install chromium` — not currently
   cached here). The helper launches headless chromium for ticket sign-in.

Personas ready in the helper: `lakeshore-cfo` (`cfo@lakeshore-holdings.example.com`),
`lakeshore-cio` (`cio@lakeshore-holdings.example.com`), `meridian-cdao`
(`cdao@meridian-health.example.com`). Note: there is **no Apex _CDO_** persona — the
closest is `apexretail-cio` (`cio@apex-retail.example.com`); provision an Apex CDO
via `auth:provision-cxo-personas` if specifically required.

Guardrails held: `provqa` still 0% traffic (`--0000051=100`); no DNS / Vercel /
Supabase change; no `.auth` files committed (`.auth/` is gitignored).

---

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
