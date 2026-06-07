# Final DNS Cutover — Vercel → Azure Container Apps (2026-06-07)

Status: **✅ COMPLETE — `app.abarva.ai` is now served by Azure Container Apps,
off Vercel, with a valid managed certificate.** The operator applied the DNS
records at Namecheap; the `app` CNAME now points to the Azure environment and
the custom domain is bound (`SniEnabled`) with an Azure-managed certificate
(`Succeeded`). Verified `~06:19Z`: `app.abarva.ai/` and `/api/health` return
200 from Azure with no Vercel headers.

> Guardrails held: DNS records applied by the operator at the registrar (this
> agent has no registrar credentials and changed no DNS itself); no Supabase
> reintroduced; no Azure resource deleted; no Vercel removal yet (signed-in QA
> passed, but Vercel credentials are not present in this environment); no secrets
> printed.

## 0. Cutover result (verified 2026-06-07 ~06:19Z)

| Task 3 check | Result |
| --- | --- |
| `dig +short CNAME app.abarva.ai` no longer `vercel-dns` | ✅ `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io.` |
| `curl -I https://app.abarva.ai` has no `server: Vercel` / `x-vercel-id` | ✅ only `x-powered-by: Next.js` |
| `https://app.abarva.ai/api/health` → 200, postgres/direct_postgres true | ✅ `{ ok:true, postgres:true, direct_postgres:true, azure_graph:"postgres" }` |
| TLS cert for `app.abarva.ai` | ✅ `CN=app.abarva.ai` (DigiCert/GeoTrust), valid (no `-k` needed) |
| Container App custom domain | ✅ `app.abarva.ai` bound `SniEnabled` |
| Managed certificate | ✅ `mc-cae-abarva-sca-app-abarva-ai-8374`, subject `app.abarva.ai`, status `Succeeded` |

Note: the `asuid.app` TXT validation record did not need to propagate — once the
`app` CNAME resolved to the Azure environment, CNAME-based domain-control
validation satisfied the managed-certificate issuance. The `asuid.app` TXT
remains optional belt-and-suspenders for future re-validation.

## 1. Azure target confirmed

| Item | Value |
| --- | --- |
| Subscription | `abarva-lab-sub` (`701a8554-…-743bc50e3b20`) |
| Resource group | `rg-abarva-controlplane-lab-eastus` |
| Container App | `ca-abarva-web-lab-eastus` |
| Managed environment | `cae-abarva-scale-lab-eastus` |
| Ingress FQDN | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` |
| Ingress | external, targetPort `3000` |
| Environment default domain | `agreeableocean-2c1472e6.eastus.azurecontainerapps.io` |
| Environment static inbound IP | `4.255.59.220` |
| Active revision (100% traffic) | `ca-abarva-web-lab-eastus--0000051` (Running, weight 100) |
| Other revision | `ca-abarva-web-lab-eastus--provqa` (Running, weight 0) |
| Image on active revision | `acrabarvalab001.azurecr.io/abarva/web:cutover-provider-anthropic-20260607-683eb933` |
| Custom-domain verification ID | `A8078EFAA2EC5EE0EBD7683E57858C95FFD118925265A1C3059FDB9865982C7A` |
| Custom domains currently bound | `app.abarva.ai` (`SniEnabled`) |

### Traffic weights (verified)

```
[
  { "revisionName": "ca-abarva-web-lab-eastus--0000051", "weight": 100 }
]
```

### Azure FQDN health (verified `~05:44–05:48Z`)

- `GET /` → **HTTP 200**, `x-powered-by: Next.js`, no `server: Vercel`, no
  `x-vercel-id`.
- `GET /api/health` → **HTTP 200**:

```json
{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }
```

## 2. Custom domain binding history

### Initial validation attempt

Ran against the live Container App:

```
az containerapp hostname add -g rg-abarva-controlplane-lab-eastus \
  -n ca-abarva-web-lab-eastus --hostname app.abarva.ai
```

Result (expected, because DNS still points to Vercel and the `asuid` TXT does
not yet exist):

```
ERROR: (InvalidCustomHostNameValidation) A TXT record pointing from
asuid.app.abarva.ai to
A8078EFAA2EC5EE0EBD7683E57858C95FFD118925265A1C3059FDB9865982C7A
was not found.
```

No partial/broken binding was persisted — the command errors before writing.

### Final binding result

After the operator updated Namecheap DNS, Azure accepted CNAME-based validation,
bound `app.abarva.ai` to the Container App, and issued the managed certificate
`mc-cae-abarva-sca-app-abarva-ai-8374` with status `Succeeded`.

## 3. Final DNS state (verified ~06:19Z)

```
$ dig +short NS abarva.ai
pdns1.registrar-servers.com.
pdns2.registrar-servers.com.

$ dig +short CNAME app.abarva.ai
ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io.

$ dig +short app.abarva.ai
ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io.
4.255.59.220

$ dig +short TXT asuid.app.abarva.ai
(empty; not required because CNAME validation satisfied Azure)

$ curl -I https://app.abarva.ai/api/health
HTTP/2 200
x-powered-by: Next.js
```

`/api/health` response:

```json
{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }
```

DNS provider = **Namecheap BasicDNS** (`registrar-servers.com`). This agent has
no Namecheap API/registrar credentials; the DNS change was applied by the
operator and verified here.

## 4. Registrar records applied at Namecheap

These are the records used in the `abarva.ai` zone (Namecheap → Domain List →
Manage → Advanced DNS). Host values are entered **relative to the zone**
(Namecheap appends `.abarva.ai` automatically).

### Step A — domain-ownership validation (add first; coexists with Vercel)

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| TXT | `asuid.app` | `A8078EFAA2EC5EE0EBD7683E57858C95FFD118925265A1C3059FDB9865982C7A` | Automatic / 60 |

### Step B — repoint traffic (replace the existing Vercel record)

Removed the previous Vercel record:

| Type | Host | Current value (DELETE) |
| --- | --- | --- |
| CNAME | `app` | `20a2a769684e17ea.vercel-dns-017.com` |

Added the Azure record:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| CNAME | `app` | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` | Automatic / 60 |

If Namecheap will not allow a CNAME at `app` alongside other records, use an
A record instead (the environment static inbound IP):

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | `app` | `4.255.59.220` | Automatic / 60 |

> Note: the A-record path was not needed. The CNAME path was used and Azure
> accepted CNAME validation for managed-certificate issuance.

## 5. Azure follow-up completed

The following commands were the Azure-side follow-up after DNS pointed at Azure:

```
RG=rg-abarva-controlplane-lab-eastus
APP=ca-abarva-web-lab-eastus
ENV=cae-abarva-scale-lab-eastus

# 1) add the validated hostname
az containerapp hostname add -g $RG -n $APP --hostname app.abarva.ai

# 2) bind + provision an Azure-managed certificate (CNAME validation)
az containerapp hostname bind -g $RG -n $APP \
  --hostname app.abarva.ai --environment $ENV \
  --validation-method CNAME
```

Managed-certificate issuance completed successfully. The final hostname binding
is `SniEnabled`.

## 6. Post-cutover verification checklist (completed)

```
dig +short CNAME app.abarva.ai          # must NOT contain vercel-dns
curl -sI https://app.abarva.ai          # must NOT include `server: Vercel` or `x-vercel-id`
curl -s  https://app.abarva.ai/api/health   # expect 200 + postgres/direct_postgres true
```

Healthy response:

```json
{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }
```

## 7. Gate status

| Gate | Status |
| --- | --- |
| Azure target healthy (FQDN `/` + `/api/health` 200, Azure-backed) | ✅ verified |
| Custom-domain validation requirement captured | ✅ verified |
| Registrar records published at Namecheap (`app` CNAME → Azure) | ✅ done (operator) |
| Azure hostname bind + managed cert | ✅ bound `SniEnabled`, cert `Succeeded` |
| `app.abarva.ai` off Vercel and healthy on Azure | ✅ verified ~06:19Z |
| Signed-in production QA on `app.abarva.ai` | ✅ PASSED (operator browser test ~06:42Z+) — see `FINAL_SIGNED_IN_PROD_QA.md` |
| Vercel shutdown | ⛔ pending — no Vercel creds (QA gate now passed) |
| Lakeshore rich-demo readiness | ❌ not ready (data-seeding gap, out of scope; no sunset claim) |

Cross-reference: `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`,
`docs/build/supabase-sunset-proof-2026-06-07/README.md`.
