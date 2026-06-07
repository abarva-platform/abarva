# Final DNS Cutover — Vercel → Azure Container Apps (2026-06-07)

Status: **Azure target confirmed healthy. DNS cutover BLOCKED on manual
registrar action at Namecheap.** No DNS records were changed by this agent —
the `abarva.ai` zone is hosted at Namecheap (`registrar-servers.com`
nameservers) and no registrar/DNS-provider credentials are available in this
environment. Per the cutover guardrail, this document records the exact
records an operator must apply at the registrar, then stops.

> Guardrails held: no DNS changed without proof, no Supabase reintroduced, no
> Azure resource deleted, no Vercel removal (DNS + QA gates not yet passed),
> no secrets printed.

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
| Custom domains currently bound | none |

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

## 2. Custom domain binding attempt (proves the validation requirement)

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

## 3. Current DNS state (verified)

```
$ dig +short NS abarva.ai
pdns1.registrar-servers.com.
pdns2.registrar-servers.com.

$ dig +short CNAME app.abarva.ai
20a2a769684e17ea.vercel-dns-017.com.

$ dig +short app.abarva.ai
20a2a769684e17ea.vercel-dns-017.com.
216.150.1.193
216.150.16.193

$ dig +short TXT asuid.app.abarva.ai
(empty)

$ curl -I https://app.abarva.ai/api/health
HTTP/2 503
server: Vercel
x-vercel-id: pdx1::iad1::4v7sp-…
```

DNS provider = **Namecheap BasicDNS** (`registrar-servers.com`). This agent has
no Namecheap API/registrar credentials, so the cutover requires manual operator
action.

## 4. ACTION REQUIRED — exact registrar records to apply at Namecheap

Apply these in the `abarva.ai` zone (Namecheap → Domain List → Manage →
Advanced DNS). Host values are entered **relative to the zone** (Namecheap
appends `.abarva.ai` automatically).

### Step A — domain-ownership validation (add first; coexists with Vercel)

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| TXT | `asuid.app` | `A8078EFAA2EC5EE0EBD7683E57858C95FFD118925265A1C3059FDB9865982C7A` | Automatic / 60 |

### Step B — repoint traffic (replace the existing Vercel record)

Remove the existing record:

| Type | Host | Current value (DELETE) |
| --- | --- | --- |
| CNAME | `app` | `20a2a769684e17ea.vercel-dns-017.com` |

Add the Azure record:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| CNAME | `app` | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` | Automatic / 60 |

If Namecheap will not allow a CNAME at `app` alongside other records, use an
A record instead (the environment static inbound IP):

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | `app` | `4.255.59.220` | Automatic / 60 |

> Note: the A-record path pins to the environment static IP. The CNAME path is
> preferred so Azure can change the inbound IP without another DNS edit. In
> either case the `asuid.app` TXT in Step A is mandatory for validation.

## 5. After DNS is applied — operator follow-up (Azure side)

Once `dig +short TXT asuid.app.abarva.ai` returns the verification ID and the
`app` record points at Azure, complete the binding + managed certificate:

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

Managed-certificate issuance takes a few minutes after binding; there can be a
brief TLS window while the cert provisions.

## 6. Post-cutover verification checklist (run after binding + propagation)

```
dig +short CNAME app.abarva.ai          # must NOT contain vercel-dns
curl -sI https://app.abarva.ai          # must NOT include `server: Vercel` or `x-vercel-id`
curl -s  https://app.abarva.ai/api/health   # expect 200 + postgres/direct_postgres true
```

Expected healthy response (matches the Azure FQDN today):

```json
{ "ok": true, "checks": { "postgres": true, "direct_postgres": true, "azure_graph": "postgres" } }
```

## 7. Gate status

| Gate | Status |
| --- | --- |
| Azure target healthy (FQDN `/` + `/api/health` 200, Azure-backed) | ✅ verified |
| Custom-domain validation requirement captured | ✅ verified |
| Registrar records published at Namecheap | ⛔ BLOCKED — manual operator action |
| Azure hostname bind + managed cert | ⛔ BLOCKED — depends on DNS |
| `app.abarva.ai` off Vercel and healthy on Azure | ⛔ BLOCKED — depends on DNS |
| Signed-in production QA on `app.abarva.ai` | ⛔ BLOCKED — see `FINAL_SIGNED_IN_PROD_QA.md` |
| Vercel shutdown | ⛔ BLOCKED — gated on DNS + QA |

Cross-reference: `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`,
`docs/build/supabase-sunset-proof-2026-06-07/README.md`.
