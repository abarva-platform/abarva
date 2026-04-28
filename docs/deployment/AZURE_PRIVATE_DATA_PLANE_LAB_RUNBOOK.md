# Azure Private Data Plane Lab Runbook

Slice ID: AZLAB5
Document: AZURE_PRIVATE_DATA_PLANE_LAB_RUNBOOK.md
Status: code_complete
Authored: 2026-04-26
Author: Lane L (parallel build run)
Type: Documentation only — no application code, no runtime modification,
no migrations, no model calls, no production systems.

---

## Purpose

This runbook guides an engineer through standing up a **lab-grade**
simulation of the AbarVa private data plane on Azure. It covers the
networking, compute, database, secret management, and observability
resources required to exercise the boundary-policy and audit-event
flows described in the architecture contracts (ARCH3, CLOUD2,
CLOUD5, TEN1).

### What this runbook covers

- Azure resource group layout for a two-plane lab (control + private
  data plane)
- VNet and subnet layout
- Container Apps hosting for the control plane simulation and the
  private data plane API stub
- PostgreSQL Flexible Server (lab tier) for each plane
- Blob Storage with private endpoint simulation
- Key Vault for secret simulation with managed identity access
- Application Insights and Log Analytics for lab observability
- Deployment verification steps
- Cost guardrails and teardown instructions

### What this runbook does NOT deploy

- No production systems of any kind
- No enterprise-grade key management or HSM integration
- No live compliance attestation infrastructure
- No AbarVa application source code (the runbook deploys shell
  containers; real application wiring is a separate step)
- No Azure OpenAI or other AI services
- No Azure Kubernetes Service or AKS clusters

**This is a simulation lab only.** Nothing in this runbook constitutes
a production deployment, a data residency proof, or a compliance
attestation. Evidence from this lab is illustrative only.

---

## Prerequisites

### Accounts and tooling

1. **Azure subscription** — pay-as-you-go or MSDN / Visual Studio
   subscription is acceptable for lab use. An enterprise EA or
   CSP subscription also works; confirm your organization allows
   resource creation in eastus before proceeding.

2. **Azure CLI installed and logged in**

   ```bash
   # Install (macOS)
   brew install azure-cli

   # Verify
   az --version

   # Log in
   az login

   # Set default subscription
   az account set --subscription "<subscription-id>"
   ```

3. **Docker installed** — required only if you intend to build and
   push custom container images for the stub services. The default
   path uses a public hello-world image to validate hosting; swap
   it for a real stub image when ready.

   ```bash
   docker --version
   ```

4. **This repository cloned locally** — the runbook references
   docker-compose files and seed scripts from the repo root.

5. **jq installed** — used in verification steps.

   ```bash
   brew install jq
   ```

### Cost guardrail

Running all resources in this runbook continuously costs
**approximately $20-50 per month** at standard pay-as-you-go rates
as of early 2026. Costs vary by region and usage pattern.

- The dominant cost driver is PostgreSQL Flexible Server (Burstable
  B1ms, ~$13/month per instance, two instances = ~$26/month).
- Container Apps with min-replicas 0 incur no compute cost when idle.
- Key Vault and Log Analytics are low-cost for lab volumes.
- Private endpoints (if added) cost approximately $7/day each; this
  runbook uses internal ingress and service tags instead for lab
  mode.

Set a budget alert before provisioning resources (see Cost Guardrails
section).

---

## Resource Groups

Create two resource groups: one for the control plane simulation and
one for the private data plane simulation. Using eastus throughout
keeps latency low and simplifies private DNS zone peering.

```bash
az group create \
  --name rg-abarva-lab-control \
  --location eastus \
  --tags environment=lab plane=control owner=abarva-lab

az group create \
  --name rg-abarva-lab-private-dp \
  --location eastus \
  --tags environment=lab plane=private-data-plane owner=abarva-lab
```

Verify:

```bash
az group list \
  --query "[?starts_with(name, 'rg-abarva-lab')].[name,location,properties.provisioningState]" \
  --output table
```

Expected output: both groups listed with `Succeeded`.

---

## VNet and Subnets

All lab resources share a single VNet with dedicated subnets per
logical plane. This mirrors the production topology described in
ARCH3 and CLOUD2 without requiring separate VNet peering.

```bash
# Create the VNet
az network vnet create \
  --name vnet-abarva-lab \
  --resource-group rg-abarva-lab-control \
  --address-prefix 10.0.0.0/16 \
  --location eastus

# Control plane subnet
az network vnet subnet create \
  --name snet-control \
  --resource-group rg-abarva-lab-control \
  --vnet-name vnet-abarva-lab \
  --address-prefix 10.0.1.0/24

# Private data plane subnet
az network vnet subnet create \
  --name snet-private-dp \
  --resource-group rg-abarva-lab-control \
  --vnet-name vnet-abarva-lab \
  --address-prefix 10.0.2.0/24

# Shared services subnet (Key Vault, DNS)
az network vnet subnet create \
  --name snet-shared \
  --resource-group rg-abarva-lab-control \
  --vnet-name vnet-abarva-lab \
  --address-prefix 10.0.3.0/24
```

### Subnet summary

| Subnet | CIDR | Purpose |
|---|---|---|
| `snet-control` | 10.0.1.0/24 | Control plane Container Apps environment |
| `snet-private-dp` | 10.0.2.0/24 | Private data plane API stub Container Apps |
| `snet-shared` | 10.0.3.0/24 | Key Vault, DNS resolver, shared services |

---

## Container Apps Environments

### Control plane environment

```bash
# Log Analytics workspace (shared — see Observability section)
az monitor log-analytics workspace create \
  --resource-group rg-abarva-lab-control \
  --workspace-name law-abarva-lab \
  --location eastus

LAW_ID=$(az monitor log-analytics workspace show \
  --resource-group rg-abarva-lab-control \
  --workspace-name law-abarva-lab \
  --query customerId --output tsv)

LAW_KEY=$(az monitor log-analytics workspace get-shared-keys \
  --resource-group rg-abarva-lab-control \
  --workspace-name law-abarva-lab \
  --query primarySharedKey --output tsv)

# Control plane Container Apps environment (internal ingress only)
az containerapp env create \
  --name cae-abarva-lab-control \
  --resource-group rg-abarva-lab-control \
  --location eastus \
  --logs-workspace-id "$LAW_ID" \
  --logs-workspace-key "$LAW_KEY" \
  --internal-only true
```

### Control plane application (stub)

```bash
az containerapp create \
  --name ca-abarva-control-sim \
  --resource-group rg-abarva-lab-control \
  --environment cae-abarva-lab-control \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 1 \
  --ingress internal \
  --target-port 80
```

Note: `--internal-only true` on the environment means the apps are
reachable only from within the VNet. Easy Auth (Azure AD authentication
overlay) is optional for lab use; omitting it reduces setup friction.
Add `--enable-dapr false` unless you are specifically exercising Dapr
patterns.

### Private data plane environment

```bash
az containerapp env create \
  --name cae-abarva-lab-private-dp \
  --resource-group rg-abarva-lab-private-dp \
  --location eastus \
  --logs-workspace-id "$LAW_ID" \
  --logs-workspace-key "$LAW_KEY" \
  --internal-only true
```

### Private data plane API stub

```bash
az containerapp create \
  --name ca-abarva-private-dp-api \
  --resource-group rg-abarva-lab-private-dp \
  --environment cae-abarva-lab-private-dp \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 1 \
  --ingress internal \
  --target-port 80
```

Both container apps use internal ingress. Cross-plane communication
uses the Container Apps internal FQDN. In the lab topology the
control plane simulation calls the private data plane API stub
directly via its internal hostname; in production this would go
through Private Link or VNet peering.

---

## PostgreSQL Flexible Server

One PostgreSQL Flexible Server per resource group, both using the
Burstable B1ms tier for cost efficiency.

### Control plane database

```bash
az postgres flexible-server create \
  --name psql-abarva-lab-control \
  --resource-group rg-abarva-lab-control \
  --location eastus \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --admin-user labadmin \
  --admin-password "$(openssl rand -base64 24)" \
  --high-availability Disabled \
  --public-access None
```

### Private data plane database

```bash
az postgres flexible-server create \
  --name psql-abarva-lab-private-dp \
  --resource-group rg-abarva-lab-private-dp \
  --location eastus \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --admin-user labadmin \
  --admin-password "$(openssl rand -base64 24)" \
  --high-availability Disabled \
  --public-access None
```

Both servers use `--public-access None` so they are not reachable
from the public internet. Connections flow through Private DNS zone
records (see Private DNS section).

Store the generated admin passwords in Key Vault immediately after
creation (see Key Vault section). Do not store them in shell history,
environment variables, or source control.

---

## Blob Storage

Blob Storage for artifact storage simulation. One storage account
per resource group is sufficient for the lab. Private endpoint is
described but is optional for lab mode (see cost note below).

### Control plane storage

```bash
az storage account create \
  --name stlabcontrol$RANDOM \
  --resource-group rg-abarva-lab-control \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --default-action Deny \
  --public-network-access Disabled
```

### Private data plane storage

```bash
az storage account create \
  --name stlabprivdp$RANDOM \
  --resource-group rg-abarva-lab-private-dp \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --default-action Deny \
  --public-network-access Disabled
```

`--public-network-access Disabled` and `--default-action Deny`
ensure the accounts are not publicly reachable. In full lab mode
with private endpoints (optional), add:

```bash
# Optional — adds ~$7/day per endpoint; see Private DNS / Private
# Endpoints section for the trade-off discussion.
az network private-endpoint create \
  --name pe-st-lab-control \
  --resource-group rg-abarva-lab-control \
  --vnet-name vnet-abarva-lab \
  --subnet snet-shared \
  --private-connection-resource-id "$(az storage account show \
      --name <storage-account-name> \
      --resource-group rg-abarva-lab-control \
      --query id --output tsv)" \
  --group-ids blob \
  --connection-name pec-st-lab-control
```

---

## Key Vault

One Key Vault per logical plane for secret simulation. Access is
granted through managed identities — no hardcoded connection strings,
API keys, or passwords.

### Control plane Key Vault

```bash
az keyvault create \
  --name kv-abarva-lab-ctrl \
  --resource-group rg-abarva-lab-control \
  --location eastus \
  --sku standard \
  --enable-rbac-authorization true \
  --public-network-access Disabled
```

### Private data plane Key Vault

```bash
az keyvault create \
  --name kv-abarva-lab-pdp \
  --resource-group rg-abarva-lab-private-dp \
  --location eastus \
  --sku standard \
  --enable-rbac-authorization true \
  --public-network-access Disabled
```

### Managed identity access

```bash
# Get the managed identity principal ID for the control plane app
CTRL_PRINCIPAL=$(az containerapp show \
  --name ca-abarva-control-sim \
  --resource-group rg-abarva-lab-control \
  --query identity.principalId --output tsv)

KV_CTRL_ID=$(az keyvault show \
  --name kv-abarva-lab-ctrl \
  --resource-group rg-abarva-lab-control \
  --query id --output tsv)

# Grant Key Vault Secrets User role
az role assignment create \
  --assignee "$CTRL_PRINCIPAL" \
  --role "Key Vault Secrets User" \
  --scope "$KV_CTRL_ID"
```

Repeat the pattern for the private data plane container app and its
Key Vault. No hardcoded keys are ever stored in container environment
variables or app configuration. All secret references use the
`@Microsoft.KeyVault(SecretUri=...)` syntax in Container Apps
environment variable configuration.

---

## Application Insights and Log Analytics

A single shared Log Analytics workspace (`law-abarva-lab`, created
above) receives logs from both container app environments. Application
Insights provides distributed tracing and structured log correlation.

```bash
# Application Insights for control plane
az monitor app-insights component create \
  --app ai-abarva-lab-control \
  --resource-group rg-abarva-lab-control \
  --location eastus \
  --workspace "$LAW_ID"

# Application Insights for private data plane
az monitor app-insights component create \
  --app ai-abarva-lab-private-dp \
  --resource-group rg-abarva-lab-private-dp \
  --location eastus \
  --workspace "$LAW_ID"
```

Both container apps should be configured with the corresponding
`APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable:

```bash
AI_CTRL_CONN=$(az monitor app-insights component show \
  --app ai-abarva-lab-control \
  --resource-group rg-abarva-lab-control \
  --query connectionString --output tsv)

az containerapp update \
  --name ca-abarva-control-sim \
  --resource-group rg-abarva-lab-control \
  --set-env-vars "APPLICATIONINSIGHTS_CONNECTION_STRING=$AI_CTRL_CONN"
```

Log Analytics queries for audit event verification are covered in
the Deployment Verification section.

---

## Private DNS and Private Endpoints

### Lab mode: internal ingress + service tags (recommended)

Full private endpoints add approximately $7/day per endpoint, which
is high for a casual lab. For most lab purposes the following
approach is sufficient and costs nothing extra:

- Container Apps environments use `--internal-only true` (already
  configured above). Apps are reachable only from within the VNet
  via automatically assigned internal FQDNs.
- PostgreSQL and storage accounts use `--public-access None` /
  `--public-network-access Disabled`. They are accessible only via
  private endpoints or service endpoints.
- For minimal lab validation without private endpoints, temporarily
  allow access from your jump VM or developer machine IP using
  firewall rules, then lock down again:

  ```bash
  az postgres flexible-server firewall-rule create \
    --name AllowDeveloperIP \
    --resource-group rg-abarva-lab-control \
    --server-name psql-abarva-lab-control \
    --start-ip-address <your-ip> \
    --end-ip-address <your-ip>
  ```

### Production-grade private DNS zones (optional for lab)

If you want to exercise the full private DNS resolution path — as
would be required in production — create private DNS zones and link
them to the VNet:

```bash
# Postgres private DNS zone
az network private-dns zone create \
  --resource-group rg-abarva-lab-control \
  --name "privatelink.postgres.database.azure.com"

az network private-dns link vnet create \
  --resource-group rg-abarva-lab-control \
  --zone-name "privatelink.postgres.database.azure.com" \
  --name pdnslink-postgres \
  --virtual-network vnet-abarva-lab \
  --registration-enabled false

# Blob private DNS zone
az network private-dns zone create \
  --resource-group rg-abarva-lab-control \
  --name "privatelink.blob.core.windows.net"

az network private-dns link vnet create \
  --resource-group rg-abarva-lab-control \
  --zone-name "privatelink.blob.core.windows.net" \
  --name pdnslink-blob \
  --virtual-network vnet-abarva-lab \
  --registration-enabled false
```

Each private endpoint created for Postgres or storage must then be
registered in the corresponding private DNS zone with an A record
pointing to the private endpoint's NIC IP address.

---

## Deployment Verification Steps

Run these steps in order after completing provisioning.

### Step 1: Resource groups exist

```bash
az group show --name rg-abarva-lab-control \
  --query properties.provisioningState --output tsv
# Expected: Succeeded

az group show --name rg-abarva-lab-private-dp \
  --query properties.provisioningState --output tsv
# Expected: Succeeded
```

### Step 2: Container apps are running

```bash
az containerapp show \
  --name ca-abarva-control-sim \
  --resource-group rg-abarva-lab-control \
  --query "properties.runningStatus" --output tsv
# Expected: Running

az containerapp show \
  --name ca-abarva-private-dp-api \
  --resource-group rg-abarva-lab-private-dp \
  --query "properties.runningStatus" --output tsv
# Expected: Running
```

### Step 3: Boundary API endpoint returns 200

From a VM or jump host inside the VNet, retrieve the internal FQDN
of the private data plane API stub and issue a test request:

```bash
DP_FQDN=$(az containerapp show \
  --name ca-abarva-private-dp-api \
  --resource-group rg-abarva-lab-private-dp \
  --query "properties.configuration.ingress.fqdn" --output tsv)

curl -s -o /dev/null -w "%{http_code}" "https://${DP_FQDN}/"
# Expected: 200
```

The hello-world stub returns 200. When a real boundary API is wired,
the expected response body should include a simulated evidence
manifest acknowledgement, not raw data.

### Step 4: Audit events appear in Log Analytics

```bash
az monitor log-analytics query \
  --workspace "$LAW_ID" \
  --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(15m) | take 10" \
  --output table
```

For a real boundary API stub the query should be updated to filter
for audit event log lines (e.g., `| where Log contains "audit"`).
The absence of raw PII or sensitive data fields in the logs is
the key check; this must be verified manually in a real wiring.

### Step 5: No raw data in control plane logs

```bash
az monitor log-analytics query \
  --workspace "$LAW_ID" \
  --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(15m) | where Log contains 'email' or Log contains 'ssn' or Log contains 'dob' | count" \
  --output tsv
# Expected: 0
```

This is a heuristic check. A full no-raw-data verification requires
a defined sensitive-field taxonomy and log scraping tests specific
to the real application payload shapes.

---

## Cost Guardrails

### Budget alert

Set a budget alert at $50/month before provisioning any resources:

```bash
az consumption budget create \
  --budget-name lab-abarva-monthly \
  --resource-group rg-abarva-lab-control \
  --amount 50 \
  --time-grain Monthly \
  --time-period-start "$(date +%Y-%m-01)" \
  --time-period-end "2030-12-31" \
  --contact-emails "your-email@example.com"
```

### Scale container apps to zero when idle

When you are not actively using the lab, scale both container apps
to zero replicas to eliminate compute charges:

```bash
az containerapp update \
  --name ca-abarva-control-sim \
  --resource-group rg-abarva-lab-control \
  --min-replicas 0

az containerapp update \
  --name ca-abarva-private-dp-api \
  --resource-group rg-abarva-lab-private-dp \
  --min-replicas 0
```

Scale back up when needed:

```bash
az containerapp update \
  --name ca-abarva-control-sim \
  --resource-group rg-abarva-lab-control \
  --min-replicas 1

az containerapp update \
  --name ca-abarva-private-dp-api \
  --resource-group rg-abarva-lab-private-dp \
  --min-replicas 1
```

### Pause PostgreSQL Flexible Servers

When the lab is not in active use, stop both Postgres instances.
The server resumes automatically after 7 days; restart it manually
before that to avoid auto-resume charges:

```bash
az postgres flexible-server stop \
  --name psql-abarva-lab-control \
  --resource-group rg-abarva-lab-control

az postgres flexible-server stop \
  --name psql-abarva-lab-private-dp \
  --resource-group rg-abarva-lab-private-dp
```

Resume when needed:

```bash
az postgres flexible-server start \
  --name psql-abarva-lab-control \
  --resource-group rg-abarva-lab-control

az postgres flexible-server start \
  --name psql-abarva-lab-private-dp \
  --resource-group rg-abarva-lab-private-dp
```

---

## What is Simulated vs Real

### Simulated

- **Boundary policy enforcement** — the hello-world stub returns 200
  but does not implement the actual boundary policy contract from
  CLOUD5. Replace with a real stub to exercise boundary semantics.
- **Evidence manifest flow** — no real evidence manifest is generated
  by this lab. Log Analytics queries serve as a proxy for confirming
  that events flow and that no raw data leaks into control plane
  logs.
- **Audit events** — Container Apps console logs stand in for a real
  structured audit event stream. A production system would emit
  structured audit records to a dedicated audit log sink.
- **Tenant isolation** — resource groups simulate plane boundaries.
  Real tenant isolation is enforced at the application layer (row-
  level security, namespace scoping) per TEN1; that application code
  is not deployed in this lab.

### Real

- **Azure networking** — the VNet, subnets, and internal ingress
  configuration are real Azure resources following the topology
  described in ARCH3 and CLOUD2.
- **Container Apps hosting** — real Azure Container Apps with
  configurable scaling, internal ingress, and Log Analytics
  integration.
- **Managed identities** — real system-assigned managed identities
  on container apps with real RBAC role assignments on Key Vault.
  No passwords or keys are stored in environment variables.
- **Private network posture** — Postgres and storage accounts with
  public access disabled are genuinely not internet-reachable.

### Not real

- **Production SLAs** — this is a lab using Burstable tiers and
  disabled high availability. No uptime SLA applies.
- **Enterprise key management** — Key Vault standard tier, no HSM,
  no BYOK, no customer-managed keys in this lab.
- **Compliance attestation** — no FedRAMP, SOC 2, HIPAA, or ISO 27001
  certification is implied or conferred by running this lab.
- **Data residency proof** — the lab topology is consistent with
  eastus data residency but does not constitute a legal or
  regulatory data residency proof.

---

## What NOT to Claim

The following claims are explicitly out of scope for any evidence
derived from this lab:

- **This is NOT a production deployment.** Running this runbook
  does not create a production-grade AbarVa environment.
- **This does NOT prove data residency compliance.** Keeping
  resources in eastus is a step toward data residency, not proof
  of it.
- **This does NOT replace enterprise security review.** A
  production deployment requires a full security review covering
  network topology, identity and access management, secret rotation,
  vulnerability scanning, and penetration testing.
- **Evidence from this lab is illustrative only.** Screenshots,
  Log Analytics query results, and curl outputs from this lab
  demonstrate plausibility of the architecture, not production
  fitness.
- **This does NOT certify any production-readiness component.**
  The `production_deployment` component status in
  `docs/build/production-readiness.json` is not promoted by this
  runbook.

---

## Cleanup

Delete all lab resources when the lab is no longer needed. The
`--no-wait` flag returns immediately; deletion runs asynchronously
and typically completes within 10-15 minutes.

```bash
az group delete \
  --name rg-abarva-lab-control \
  --yes \
  --no-wait

az group delete \
  --name rg-abarva-lab-private-dp \
  --yes \
  --no-wait
```

Verify deletion is in progress:

```bash
az group show --name rg-abarva-lab-control \
  --query properties.provisioningState --output tsv
# Expected: Deleting (until gone)
```

Note: deleting the resource groups also deletes the VNet, subnets,
Container Apps environments, all container apps, both PostgreSQL
servers, storage accounts, Key Vaults, and Application Insights
components in those groups. Log Analytics workspace (`law-abarva-lab`)
lives in `rg-abarva-lab-control` and will also be deleted.

If you want to retain Log Analytics for post-mortem queries, move
it to a separate resource group before running the cleanup commands.

---

## Related Documents

- `docs/architecture/ABARVA_AZURE_REFERENCE_TARGET.md` — production-
  grade Azure reference target architecture (ARCH3)
- `docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md` — VNet
  reference lab blueprint (CLOUD2)
- `docs/architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md` — tenancy
  isolation model (TEN1)
- `docs/deployment/LOCAL_PRIVATE_DEPLOYMENT_LAB.md` — local
  Docker-based private deployment lab
- `docs/build/slices/AZLAB5_AZURE_LAB_DEPLOYMENT_RUNBOOK.md` —
  slice contract for this document
