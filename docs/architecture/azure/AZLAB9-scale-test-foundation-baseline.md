# AbarVa Azure Lab Scale-Test Foundation Baseline

Status: deployed to `abarva-lab-sub` on 2026-05-14  
Subscription: `701a8554-a166-46e9-bf13-743bc50e3b20`  
Region: `eastus`  
Data posture: synthetic/no-client-data only

## Purpose

This baseline establishes the Azure lane AbarVa needs for enterprise scale testing before we move real application images, databases, models, or customer data into Azure.

It is intentionally not a toy environment. It validates the hard parts that enterprise customers and InfoSec teams care about early:

- private data plane isolation
- private endpoint and private DNS wiring
- managed identity access instead of embedded secrets
- centralized observability
- autoscaling runtime infrastructure
- repeatable IaC deployment
- no PHI, PII, or real client data

## What Is Live Now

| Plane | Azure services | Live resources |
|---|---|---|
| Shared security | Key Vault | `kv-abarva-lab-001` |
| Private data plane | VNet, NSG, Storage, Private Endpoints, Private DNS | `vnet-abarva-private-dataplane-lab-eastus`, `stabarvaprivatedplab001`, `pe-kv-shared`, `pe-stabarvaprivatedplab001-blob` |
| Runtime scale lane | Container Apps environment, Container App, Managed Identity | `cae-abarva-scale-lab-eastus`, `ca-abarva-scale-smoke-lab-eastus`, `id-abarva-scale-runtime-lab-eastus` |
| Observability | Log Analytics, Application Insights, Action Group, Activity Log Alert | `log-abarva-observability-lab-eastus`, `appi-abarva-observability-lab-eastus`, `ag-abarva-observability-lab-eastus`, `ala-subscription-deployment-failures` |
| Subscription guardrail | Defender pricing baseline | `Free` tier for App Services, Storage Accounts, Key Vaults, Virtual Machines |

## Network Design

The private data plane uses a dedicated VNet:

| Subnet | CIDR | Purpose |
|---|---:|---|
| `snet-app` | `10.42.4.0/23` | Container Apps managed environment infrastructure. Sized with scale-test headroom. |
| `snet-data` | `10.42.1.0/24` | Future private data services and integration workloads. |
| `snet-private-endpoints` | `10.42.2.0/24` | Private endpoints for storage, Key Vault, and later Postgres/Search. |

Private DNS zones are linked to the VNet:

- `privatelink.blob.core.windows.net`
- `privatelink.vaultcore.azure.net`

This means services inside the VNet can resolve private endpoints without public data-plane routing. Postgres private DNS is implemented in IaC and will be activated when the Postgres resource ID is supplied.

## Security Posture

| Control | Current state |
|---|---|
| Client data | Not loaded. Synthetic/no-client-data only. |
| Storage public network access | Disabled. |
| Storage blob public access | Disabled. |
| Storage network default action | Deny. |
| Storage network bypass | None. |
| Key Vault authorization | Azure RBAC. |
| Key Vault purge protection | Enabled. |
| Key Vault soft delete | Enabled, 90 days. |
| Key Vault private endpoint | Enabled. |
| Key Vault public network access | Enabled for founder-lab manageability. Production/private-client lane should disable this once a private operator path exists. |
| Runtime identity | User-assigned managed identity. |
| Runtime storage access | Managed identity granted Storage Blob Data Contributor on the private data-plane storage account. |

## Scale-Test Runtime

The first runtime lane is Azure Container Apps, not App Service. That is deliberate:

- avoids the current App Service VM quota blocker
- supports event/HTTP-driven autoscale
- fits the future private data plane boundary-service model
- gives a clean path to run the real AbarVa app image or a boundary API container later

The deployed placeholder app:

- uses the public Microsoft hello-world image
- has external ingress enabled for smoke testing only
- scales from `0` to `10` replicas
- scales on HTTP concurrency with `concurrentRequests = 50`
- logs to the shared Log Analytics workspace

Observed smoke result:

- Endpoint: `https://ca-abarva-scale-smoke-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
- HTTP status: 200
- 50-request smoke: 50 succeeded, 0 failed

## What Is Not Yet Live

These services are part of the target architecture but intentionally not deployed in this first foundation pass:

| Service | Why not live yet | Next decision |
|---|---|---|
| Azure Database for PostgreSQL Flexible Server | Needs final topology: control-plane DB, private data-plane metadata DB, or both. | Decide SKU, private DNS, backup, HA, and migration path from Supabase/Postgres. |
| Azure AI Search | Needs corpus/index design and embedding provider decision. | Define indexes for tenant context, evidence manifests, source artifacts, and industry corpus. |
| Azure OpenAI / Foundry | Needs model routing policy and approved region/model availability. | Define low/medium/high sensitivity model lanes. |
| Azure Container Registry | Needed before running real AbarVa images. | Add private ACR with managed identity pulls. |
| Front Door + WAF | Needed for public enterprise-grade app ingress. | Decide whether Azure or Vercel remains primary edge for the lab. |
| API Management | Useful for enterprise boundary APIs, but not needed for first scale lane. | Add when API products and rate limits are defined. |
| Budget resources | Cost guardrails are defined in docs; live budget is not yet deployed in this pass. | Add budget/contact parameters and subscription budget deployment. |

## Target State Direction

The scale foundation should evolve into three deployment lanes:

1. **SaaS control plane**: public product shell, tenant routing, auth, model gateway, orchestration, telemetry.
2. **Private data lane**: customer context layer, evidence manifests, dataset adapters, sensitive-data controls, private endpoints.
3. **Specialist intelligence lane**: Azure AI Search indexes, industry corpora, real-time signals, model routing, audit/evaluation telemetry.

The key design principle remains: AbarVa should reason over structured client context and evidence, but raw sensitive client data should not have to leave the private data lane.

## Service Alignment

This is the service map we should align on before expanding the lab. It keeps the story clean for enterprise architecture, InfoSec, and future scale testing.

### Day-1 Lab Services

These are live now and form the minimum serious foundation.

| Capability | Azure service | Why it belongs |
|---|---|---|
| Runtime scale lane | Azure Container Apps | Validates autoscaling app and boundary-service runtime without App Service VM quota. |
| Private network | Azure Virtual Network | Creates the private data lane and future app/data/service segmentation. |
| Private service access | Azure Private Endpoint | Keeps data services reachable through private IPs instead of public data-plane routes. |
| Private DNS | Azure Private DNS | Makes private endpoints operational and repeatable inside the VNet. |
| Secure object store | Azure Storage | Stores synthetic datasets, future evidence manifests, exports, and corpus artifacts. |
| Secrets and keys | Azure Key Vault | Centralizes secrets, model keys, signing keys, and future customer-boundary material. |
| Runtime identity | Managed Identity | Removes embedded credentials from runtime access patterns. |
| Observability | Log Analytics + Application Insights | Gives one place to inspect app health, scale behavior, deployment failures, and future model telemetry. |
| Alerting | Action Group + Activity Log Alert | Creates the first operational control loop. |
| Baseline posture | Defender pricing baseline | Establishes subscription-level security posture while keeping lab cost low. |

### Next Services To Add

These services turn the foundation into a complete AbarVa Azure architecture.

| Capability | Azure service | Intended AbarVa use |
|---|---|---|
| Application database | Azure Database for PostgreSQL Flexible Server | Azure equivalent of the current Postgres/Supabase data layer for tenants, programs, source events, audit, and context metadata. |
| Context/vector retrieval | Azure AI Search | Tenant context index, evidence index, industry corpus index, source/vendor index, and future real-time signal index. |
| Governed model lane | Azure OpenAI / Azure AI Foundry | Enterprise-approved model endpoint for high-sensitivity clients and Microsoft-aligned customers. |
| Private image supply chain | Azure Container Registry | Stores AbarVa app, boundary API, ingestion worker, and evaluation worker images. |
| Public enterprise ingress | Azure Front Door + WAF | Global TLS edge, WAF policy, bot/rate protection, and optional Azure-first app entry. |
| API product boundary | Azure API Management | Boundary APIs, partner APIs, throttling, subscription keys, policy enforcement, and audit logs. |
| Async orchestration | Azure Service Bus / Storage Queues | Dataset ingestion jobs, corpus refreshes, long-running agent work, and evaluation runs. |
| Event integration | Azure Event Grid | Lightweight event backbone for file drops, dataset changes, and refresh signals. |
| Day-2 ingestion | Azure Data Factory or Microsoft Fabric Data Factory | Scheduled/incremental ingestion from CMDB, policies, KPI systems, procurement, vendor data, HR/org, and operational sources. |
| Governance | Azure Policy | Enforce tags, diagnostics, no public data stores, private endpoints, allowed regions, and required encryption posture. |
| Security operations | Defender for Cloud + Microsoft Sentinel | Security posture, alerts, and enterprise SOC integration path. |
| Cost control | Azure Cost Management budgets | Hard founder-lab and later tenant-lane spend visibility. |

### Services To Defer Unless Needed

| Service | Defer reason |
|---|---|
| App Service Plan | Current subscription has zero Total VMs quota; Container Apps is a better first scale lane anyway. |
| AKS | Too much operational weight until the app clearly needs Kubernetes-level control. |
| Azure Synapse | Fabric/Data Factory + Postgres/Search is simpler for this stage. |
| Managed Grafana | Useful later, but Log Analytics/App Insights is enough for first scale tests. |

### Recommended Sequencing

1. **Foundation**: current deployed baseline.
2. **Image lane**: Azure Container Registry + real AbarVa container image.
3. **Database lane**: private Postgres Flexible Server and migration harness from the current Postgres/Supabase shape.
4. **Context lane**: Azure AI Search indexes for tenant context, evidence, source, and industry corpus.
5. **Model lane**: Azure OpenAI/Foundry plus routing controls alongside the existing provider strategy.
6. **Ingress/API lane**: Front Door/WAF and API Management when the Azure-hosted app or private boundary APIs need external consumption.
7. **Day-2 automation**: Data Factory/Fabric, Event Grid, and Service Bus for incremental corpus and context refresh.
8. **Production controls**: Azure Policy, Defender for Cloud, Sentinel integration, budgets, diagnostic settings, and private operator access.

## Validation Commands

```bash
az bicep build --file infra/azure/foundation.bicep

az deployment sub what-if \
  --name azfound-scale-foundation-whatif \
  --location eastus \
  --template-file infra/azure/foundation.bicep \
  --parameters infra/azure/parameters/foundation.lab.bicepparam

az deployment sub create \
  --name azfound-scale-foundation-lab \
  --location eastus \
  --template-file infra/azure/foundation.bicep \
  --parameters infra/azure/parameters/foundation.lab.bicepparam
```

## Immediate Next Steps

1. Decide whether the real AbarVa runtime for scale tests runs on Azure Container Apps first, with Vercel retained for production/demo until parity is proven.
2. Add private Azure Container Registry and image-pull identity.
3. Add Postgres Flexible Server in private mode and decide the Supabase-to-Azure migration model.
4. Add Azure AI Search and define context-layer index contracts.
5. Add Azure OpenAI/Foundry and model-routing controls.
6. Produce the end-to-end architecture baseline that maps every AbarVa module to front/middle/back/data/model/ops services.
