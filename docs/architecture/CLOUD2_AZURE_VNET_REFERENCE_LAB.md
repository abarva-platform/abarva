# CLOUD2 - Azure VNet Reference Lab

Slice ID: CLOUD2
Slice name: Azure VNet Reference Lab Blueprint
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture / specification document only - no application
code, no runtime modification, no IaC, no scripts, no migrations,
no model calls.

This document is the canonical blueprint for an **Azure Virtual
Network reference lab** into which the AbarVa application shell
can later be deployed for **private-VNet, no-public-endpoint,
secret-bounded** validation. It is consumed by a future Terraform
/ Bicep / Azure Developer CLI (`azd`) slice that will translate the
blueprint into deployable Infrastructure-as-Code.

CLOUD2 does **not** deploy anything. It does not provision an
Azure resource, does not call the Azure ARM API, does not invoke
`az`, and does not write IaC. It records the **shape** of the
reference lab and the **validation contract** the lab must
satisfy before any production-readiness promotion is considered.

Cross-references:

- **TEN1** (Tenant Isolation Probes) - governs **logical** tenant
  isolation at the read-model and request-context layer. CLOUD2
  governs the **physical** network, identity, and secret
  boundaries.
- **CLOUD1** (Generic Deployable Shape Contract) - governs the
  cloud-agnostic deployable shape of the AbarVa shell. CLOUD2 is
  the Azure-specific binding of that shape into a private VNet
  reference lab.
- **MG2** (Model Gateway Stub) and **MG3** (Model Gateway Safe
  Integration Contract) - the lab's model gateway is a stub. No
  live model calls are made from inside the lab.
- **AUD2** (Unified Audit Event Read Model) - the audit ledger
  remains deterministic; no live audit emission is wired to the
  lab.
- **PROD3** (Production Readiness Live Panel V1) and **PROD4**
  (deferred external CI / Vercel ingestion) - the lab does not
  promote `production_deployment`; readiness ingestion remains
  deferred.

---

## 1. Lab purpose

### 1.1 What the lab is

The Azure VNet reference lab is a **validation environment**, not
a production environment. Its single job is to prove that the
AbarVa application shell can be deployed **inside a private VNet
with no public endpoints**, with all secrets bounded to a managed
Key Vault, and with a clean observability path.

The lab is built in a **dedicated Azure subscription or
subscription folder** owned by the platform team. It is not
shared with production. It is not shared with any tenant.

### 1.2 What the lab is NOT

The lab is **not**:

- A production environment. No tenant data lands in the lab.
- A multi-region environment. The lab is single-region.
- A high-availability environment. The lab is single-instance per
  tier.
- A scaling test. The lab is not a load-test environment.
- A live-model environment. The model gateway in the lab is a
  stub; no provider keys are configured.
- A certified isolation environment. CLOUD2 does not produce a
  signed isolation report. TEN1 covers logical isolation; CLOUD2
  covers the physical perimeter of the lab.

### 1.3 What the lab proves

When the lab is built and the validation steps in §11 pass:

- The AbarVa shell **starts inside a private VNet** with no
  inbound public address.
- The shell **reads its environment** from platform-injected envs
  and Key Vault references and starts cleanly.
- The shell **queries Postgres through a private endpoint** with
  no public Postgres exposure.
- The shell **writes and reads Blob storage through a private
  endpoint** with no public storage exposure.
- The shell **retrieves a Key Vault secret via managed identity**
  with public network access disabled on the Key Vault.
- The shell **emits logs and traces to Application Insights** in
  the private observability tier.
- **Private DNS resolves** the privatelink hostnames from the App
  subnet to the private endpoint NICs.

### 1.4 What the lab does NOT prove

The lab does **not** prove:

- **Production scaling.** No load test, no autoscale tuning, no
  capacity planning is performed.
- **Disaster recovery.** No backup, restore, geo-replication, or
  region-failover drill is performed.
- **Multi-region readiness.** The lab is single-region.
- **Live model gateway behavior.** The gateway is a stub. No
  provider key, no rate-limit posture, no cost-tracking review.
- **Production tenant isolation.** TEN1 logical isolation is
  separately verified. The lab proves perimeter, not policy.
- **Production observability SLOs.** Application Insights is
  wired; alerting, on-call, retention, and SLO posture are
  deferred.
- **Compliance certification.** No SOC 2, ISO 27001, HIPAA, or
  similar audit is performed. The lab is a technical perimeter
  exercise.

---

## 2. Resource Group layout

The lab uses a **single Resource Group per lab environment**:

- `rg-abarva-lab-<env>-<region>` - e.g.
  `rg-abarva-lab-dev-eastus2`.

All resources live in this group:

- Virtual Network and subnets.
- Container Apps Environment (or App Service Plan in fallback).
- PostgreSQL Flexible Server.
- Storage Account.
- Key Vault.
- Log Analytics workspace.
- Application Insights component.
- Private endpoints, private DNS zones, and zone links.
- Front Door profile or Application Gateway (per ingress choice).

A single RG simplifies teardown and does not split blast radius
because the lab is a non-production validation environment.

Tags applied to every resource:

- `abarva:env = lab-dev`
- `abarva:owner = platform-team`
- `abarva:purpose = vnet-reference-lab`
- `abarva:cost-center = platform`
- `abarva:tenant = none` (the lab is multi-tenant-shaped but
  carries no real tenant data)

---

## 3. Virtual Network and CIDR plan

### 3.1 VNet

- Name: `vnet-abarva-lab-<env>-<region>`.
- Address space: `10.40.0.0/16` (66,536 addresses; comfortable
  headroom for later subnet additions).

### 3.2 Subnets

| Subnet           | CIDR           | Purpose                                                                 | Notes                                                                                       |
| ---------------- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `snet-app`       | `10.40.1.0/24` | App tier - Container Apps Environment (or App Service VNet integration) | Delegated to `Microsoft.App/environments` for Container Apps; outbound NAT through the VNet |
| `snet-data`      | `10.40.2.0/24` | Data tier - PostgreSQL Flexible Server delegated subnet                 | Delegated to `Microsoft.DBforPostgreSQL/flexibleServers` if VNet-injected mode is chosen    |
| `snet-pe`        | `10.40.3.0/24` | Private endpoint NICs                                                   | Hosts NICs for Postgres (private endpoint mode), Blob, Key Vault                            |
| `snet-ingress`   | `10.40.4.0/24` | Application Gateway subnet (fallback ingress)                           | Only present if Application Gateway is the ingress choice                                   |
| `snet-bastion`   | `10.40.5.0/27` | Optional Azure Bastion for operator break-glass                         | Optional; lab-only; not used in normal operation                                            |

The lab uses **private endpoint mode** for Postgres by default;
`snet-data` exists for the alternate **VNet-injected** mode and to
keep the CIDR plan stable across both modes.

### 3.3 NSGs

Each subnet carries a Network Security Group:

- `nsg-snet-app` - allow outbound to `snet-pe` on Postgres
  (5432), Blob (443), Key Vault (443); deny outbound to
  `0.0.0.0/0` on Postgres / SMB / RDP / SSH; allow inbound only
  from the ingress subnet on the App listening port.
- `nsg-snet-data` - allow inbound from `snet-app` on 5432; deny
  all other inbound; deny all outbound.
- `nsg-snet-pe` - default deny inbound/outbound; private
  endpoint NICs do not require explicit allow rules at the
  subnet level (private endpoint policy controls the data plane).
- `nsg-snet-ingress` - allow inbound 443 from the public
  internet only when Application Gateway is used; otherwise
  inbound is locked down and Front Door + Private Link Service
  is the ingress path.
- `nsg-snet-bastion` - the standard Azure Bastion NSG rules.

NSG flow logs are enabled and routed to the Log Analytics
workspace for the lab (see §8).

---

## 4. Compute tier

### 4.1 Preferred: Azure Container Apps

The lab's **preferred compute tier** is **Azure Container Apps**:

- Container Apps Environment (`cae-abarva-lab-<env>`) deployed
  with **VNet integration** in `snet-app`.
- The environment is configured **internal-only**: the
  environment's load balancer has no public IP. Inbound traffic
  arrives through Front Door + Private Link Service or through
  Application Gateway.
- One Container App (`ca-abarva-shell`) hosts the AbarVa shell.
  Replica count is fixed at 1 for the lab; HPA / KEDA scaling is
  not part of the validation contract.
- Managed identity: a **system-assigned** identity is enabled on
  the Container App for Key Vault access (see §7).
- Outbound: traffic to Postgres / Blob / Key Vault leaves through
  `snet-app` and resolves to the private endpoint NICs in
  `snet-pe` via private DNS (see §10).

### 4.2 Fallback: Azure App Service (Premium plan, VNet
integration)

If Container Apps cannot be used in a given Azure region or
subscription, the lab falls back to:

- App Service Plan (`asp-abarva-lab-<env>`) on a Premium SKU
  (P1v3 or higher) - required for VNet integration.
- App Service (`as-abarva-shell`) with **regional VNet
  integration** into `snet-app`.
- App Service is configured `httpsOnly = true`,
  `publicNetworkAccess = Disabled`, and access restrictions limit
  inbound to the ingress tier only.
- Managed identity is system-assigned, mirroring the Container
  Apps mode.

Either compute mode satisfies the same validation contract; the
blueprint does not require a specific mode.

---

## 5. Data tier - Azure Database for PostgreSQL

### 5.1 Server posture

- Service: **Azure Database for PostgreSQL Flexible Server**.
- Tier: General Purpose, smallest practical SKU for the lab
  (e.g. `Standard_D2ds_v5`).
- High availability: disabled in the lab. (The lab is
  single-instance.)
- Storage: smallest practical (e.g. 32 GB), auto-grow disabled.
- Backup retention: 7 days, no geo-redundant backup.
- Public network access: **Disabled**.

### 5.2 Network mode

The lab uses **private endpoint mode**:

- A private endpoint for the Postgres server is created in
  `snet-pe`.
- The endpoint is registered in the
  `privatelink.postgres.database.azure.com` private DNS zone
  (see §10).
- The Postgres server has no firewall allow-list entries.

### 5.3 Database and roles

- Database: `abarva`.
- Roles: `abarva_app` (least-privilege application role) and
  `abarva_admin` (lab-only DBA role used for migrations).
- Connection string: built at runtime from
  `POSTGRES_HOST`, `POSTGRES_DB`, `POSTGRES_USER`,
  `POSTGRES_PASSWORD` (Key Vault reference), `POSTGRES_SSL_MODE`
  (`require`).

The lab does not exercise tenant data. Schema bootstrap is the
minimum needed for the smoke test in §11.

---

## 6. Storage tier - Azure Blob Storage

### 6.1 Account posture

- Storage account: `stabarvalab<env><uniq>` (lowercase
  alphanumeric, globally unique).
- Kind: `StorageV2`.
- Replication: `LRS` (lab is single-region).
- Public network access: **Disabled**.
- Blob soft-delete: enabled, 7 days.

### 6.2 Network mode

- A private endpoint with `groupId = blob` is created in
  `snet-pe`.
- The endpoint is registered in the
  `privatelink.blob.core.windows.net` private DNS zone (see §10).

### 6.3 Containers

- `app-artifacts` - the lab's blob round-trip target. Used by
  the smoke test in §11.

The lab does not provision other containers; tenant artifact
storage is out of scope for the lab.

---

## 7. Secret tier - Azure Key Vault

### 7.1 Vault posture

- Key Vault: `kv-abarva-lab-<env>-<uniq>`.
- SKU: `standard`.
- RBAC mode: **Azure RBAC** (not access policies).
- Public network access: **Disabled**.
- Soft-delete: enabled (default 90 days).
- Purge protection: enabled.

### 7.2 Network mode

- A private endpoint with `groupId = vault` is created in
  `snet-pe`.
- The endpoint is registered in the
  `privatelink.vaultcore.azure.net` private DNS zone (see §10).

### 7.3 Identity and RBAC

- The compute tier's **system-assigned managed identity** is
  granted the `Key Vault Secrets User` role on the vault, scoped
  to the vault.
- No service principal client secret is stored anywhere; all
  vault access is via managed identity.

### 7.4 Secrets stored

The vault holds, at minimum:

- `POSTGRES_PASSWORD` - the application role's password.
- `APPLICATION_INSIGHTS_CONNECTION_STRING` - if not injected via
  platform binding.
- A placeholder `MODEL_GATEWAY_PROVIDER_KEY` is **NOT** stored.
  The lab's gateway is a stub (see §9).

---

## 8. Observability tier

### 8.1 Log Analytics

- Workspace: `log-abarva-lab-<env>`.
- Retention: 30 days (lab default).
- Diagnostic settings stream resource logs from:
  - VNet (NSG flow logs).
  - Postgres Flexible Server.
  - Storage account.
  - Key Vault.
  - Container Apps Environment (or App Service).
  - Front Door / Application Gateway (whichever ingress).

### 8.2 Application Insights

- Component: `appi-abarva-lab-<env>`.
- Workspace-based, bound to the Log Analytics workspace above.
- Connection string is exposed to the App via either platform
  binding or Key Vault reference (`APPLICATION_INSIGHTS_-
  CONNECTION_STRING`).
- The application emits structured logs and traces; no PII or
  tenant-real values are emitted in the lab.

### 8.3 What observability proves in the lab

The lab proves that **logs and traces emit cleanly** and that the
private observability path works end-to-end. The lab does **not**
prove SLO posture, alert routing, on-call rotation, retention
governance, or anomaly detection - those are deferred to a later
production-observability slice.

---

## 9. Private ingress

The lab supports **two ingress modes**. Either satisfies the
"no public endpoint on the App" rule.

### 9.1 Front Door Premium + Private Link Service (preferred)

- Front Door Premium profile (`fd-abarva-lab-<env>`).
- Origin: the Container Apps Environment internal endpoint, fronted
  by an **Azure Private Link Service** that exposes the internal
  load balancer privately to Front Door.
- WAF policy attached at the Front Door profile.
- TLS terminates at Front Door; Front Door talks to the origin
  privately.
- The App's environment has **no public IP** in this mode.

### 9.2 Application Gateway with WAF (fallback)

- Application Gateway v2 (`agw-abarva-lab-<env>`) deployed into
  `snet-ingress`.
- WAF policy attached.
- Public IP on the Application Gateway is the only public surface;
  the App tier remains private (App is not directly internet-
  reachable).
- TLS terminates at the Application Gateway; backend is the App
  tier on its private listener.

The lab picks **one** ingress mode per environment. The blueprint
does not require both.

---

## 10. Private DNS zones

The lab provisions and links these private DNS zones to the VNet:

| Zone                                       | Backed resource             |
| ------------------------------------------ | --------------------------- |
| `privatelink.postgres.database.azure.com`  | PostgreSQL Flexible Server  |
| `privatelink.blob.core.windows.net`        | Storage account (blob)      |
| `privatelink.vaultcore.azure.net`          | Key Vault                   |

For each zone:

- A virtual-network-link associates the zone with
  `vnet-abarva-lab-<env>-<region>`.
- An A record is created (manually or by `privateDnsZoneGroup`
  binding on the private endpoint) mapping the resource hostname
  to the private endpoint NIC IP in `snet-pe`.

If Front Door Premium with Private Link is used, an additional
zone (`privatelink.azurefd.net`) may be linked, depending on the
final Front Door private link configuration.

The DNS validation step in §11 confirms that, from inside
`snet-app`, the public hostnames (e.g.
`<server>.postgres.database.azure.com`) resolve to the private
endpoint NIC IPs, not to public IPs.

---

## 11. Lab validation contract

The lab is **only valid** when every step below succeeds. These
steps are descriptive; they will be implemented by the future IaC
slice's smoke harness.

### 11.1 Smoke test - app starts and reads env

1. The App container or App Service starts cleanly.
2. The App resolves its environment variables (see §13).
3. The App resolves Key Vault references (see §7) without
   error.
4. The App reports a healthy `/_health` response on its private
   listener.

### 11.2 Postgres round-trip

1. From the App, open a connection to the Postgres private
   endpoint hostname.
2. Confirm DNS resolves to the private endpoint NIC IP.
3. Run a `SELECT 1`; expect `1`.
4. Run a `CREATE TABLE _smoke_<run_id> (id int)`,
   `INSERT INTO _smoke_<run_id> VALUES (1)`,
   `SELECT id FROM _smoke_<run_id>`, then
   `DROP TABLE _smoke_<run_id>`.
5. All queries succeed; connection uses TLS (`sslmode=require`).

### 11.3 Blob round-trip

1. From the App, write a small object to `app-artifacts/<run_id>`.
2. Read it back; confirm content matches.
3. Confirm the request resolves to the blob private endpoint NIC.
4. Delete the object.

### 11.4 Key Vault secret retrieval

1. From the App, retrieve `POSTGRES_PASSWORD` from Key Vault via
   the managed identity.
2. Confirm the request resolves to the vault private endpoint
   NIC.
3. Confirm a non-MI request from outside the VNet is denied
   (public network access disabled on the vault).

### 11.5 Log emission to Application Insights

1. The App emits a structured log line and a trace span tagged
   `abarva.lab.smoke = true`.
2. The line is visible in Application Insights / Log Analytics
   within the expected ingestion latency.

### 11.6 Private DNS resolution check

1. From `snet-app`, `nslookup` (or equivalent) the Postgres
   hostname; resolve must return a private IP in `snet-pe`'s
   range (`10.40.3.0/24`).
2. Same check for the blob and vault hostnames.

The lab is considered **green** when steps 11.1 through 11.6 all
succeed in a single run with no fallback to public networking.

---

## 12. Model gateway stub

The lab does **not** make live model calls. Inside the lab:

- The Model Gateway runs in **stub mode** as defined by **MG2**.
- No provider key (Anthropic, OpenAI, or otherwise) is loaded
  into the App or stored in Key Vault.
- Any code path that would invoke a model must be guarded by the
  MG2 / MG3 contract and produce a deterministic stub response.
- Outbound network egress from `snet-app` to public model
  provider domains is denied at the NSG level.

The lab proves **perimeter** for the gateway path - that the
gateway runs without a live model provider - not the **safety**
of the gateway in production.

---

## 13. Environment variable contract

The App expects the following environment variables in the lab.
Variables marked `vault` are loaded from Key Vault references;
variables marked `platform` are injected by the platform binding;
variables marked `static` are set at deploy time and are not
secret.

| Variable                                     | Source     | Purpose                                                              |
| -------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `NODE_ENV`                                   | static     | `production` for the lab build                                       |
| `ABARVA_ENV`                                 | static     | `lab-dev`                                                            |
| `POSTGRES_HOST`                              | static     | Postgres server FQDN (resolves to private endpoint via private DNS)  |
| `POSTGRES_DB`                                | static     | `abarva`                                                             |
| `POSTGRES_USER`                              | static     | `abarva_app`                                                         |
| `POSTGRES_PASSWORD`                          | vault      | Application role password                                            |
| `POSTGRES_SSL_MODE`                          | static     | `require`                                                            |
| `BLOB_ACCOUNT_NAME`                          | static     | Storage account name                                                 |
| `BLOB_CONTAINER`                             | static     | `app-artifacts`                                                      |
| `KEYVAULT_URI`                               | static     | `https://<vault-name>.vault.azure.net`                               |
| `APPLICATION_INSIGHTS_CONNECTION_STRING`     | platform / vault | Application Insights wiring                                    |
| `MODEL_GATEWAY_MODE`                         | static     | `stub` (lab-only; MG2 / MG3 contract)                                |
| `MODEL_GATEWAY_PROVIDER_KEY`                 | (absent)   | Not set in the lab. Lab does not call live providers                 |
| `LOG_LEVEL`                                  | static     | `info` (lab default)                                                 |

The application **must boot** when only the variables above are
set. Any additional production-only variable (e.g. tenant
provisioning secrets, payment provider keys) is **out of scope**
for the lab and must not be required at startup.

---

## 14. Progression path to IaC

CLOUD2 is documentation only. The progression to a deployable
lab is:

1. **CLOUD3 (Bicep stub)** - author the resource group, VNet,
   subnets, NSGs, and private DNS zones in Bicep. Validates the
   shape against this blueprint via `az deployment group what-if`.
2. **CLOUD4 (Bicep data + secrets)** - add Postgres Flexible
   Server, Storage, Key Vault, private endpoints, and zone
   groups. Run §11.2 / §11.3 / §11.4 from a one-shot job
   container.
3. **CLOUD5 (Bicep compute)** - add Container Apps Environment
   and the App, deploy a smoke image, and run §11.1 / §11.5.
4. **CLOUD6 (Bicep ingress)** - add Front Door Premium with
   Private Link Service (preferred) or Application Gateway with
   WAF (fallback). Run end-to-end §11.
5. **CLOUD7 (azd binding)** - wrap CLOUD3-CLOUD6 behind
   `azure.yaml` so `azd up` is the single entry point.
6. **CLOUD8 (Terraform parity, optional)** - re-author the same
   shape in Terraform if the founder chooses Terraform as the
   long-term IaC. The blueprint is IaC-tool-agnostic; either
   Bicep or Terraform can satisfy the contract.

Until CLOUD3 lands and §11 passes, the lab is **not deployable**.
`production_deployment` remains `blocked` and is not promoted by
this slice.

---

## 15. Boundaries summary

| Concern                              | In scope for CLOUD2  | Deferred to                       |
| ------------------------------------ | -------------------- | --------------------------------- |
| Resource Group / VNet / subnets      | Yes (blueprint)      | CLOUD3 (Bicep stub)               |
| Private endpoints + private DNS      | Yes (blueprint)      | CLOUD4 (Bicep data + secrets)     |
| Compute (Container Apps / App Svc)   | Yes (blueprint)      | CLOUD5 (Bicep compute)            |
| Ingress (Front Door / App Gateway)   | Yes (blueprint)      | CLOUD6 (Bicep ingress)            |
| `azd` integration                    | Yes (mention)        | CLOUD7 (azd binding)              |
| Terraform parity                     | Yes (mention)        | CLOUD8 (Terraform, optional)      |
| Smoke / DB / Blob / KV / DNS checks  | Yes (contract)       | CLOUD3-CLOUD6 (implementation)    |
| Live model gateway                   | No (stub only)       | Production-only, post-MG3         |
| Production scaling / DR / multi-region | No                 | Production-only                   |
| SOC 2 / HIPAA / compliance           | No                   | Production-only governance slice  |
| Production tenant isolation cert     | No                   | TEN1 + later certification slice  |

---

## 16. Why this is safe

- Documentation only. No application code, no runtime
  modification, no IaC, no scripts, no migrations, no model
  calls, no live retrieval, no browser automation, no Azure ARM
  calls.
- The blueprint is explicit about what the lab proves and what
  the lab does NOT prove (§1.3 / §1.4 / §15).
- The model gateway stays a stub (§12). No provider key is
  written anywhere.
- The environment variable contract (§13) is the minimum the App
  needs at startup; tenant-real or production-only variables are
  excluded.
- The validation contract (§11) is descriptive, not executable.
  No CI gate is created by CLOUD2; the future IaC slices own
  execution.
- `production_deployment` stays `blocked`. The blocker
  `prod-deploy-verification` is preserved verbatim. No readiness
  promotion.
