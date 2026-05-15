# AbarVa Azure Lab Current State

Status: live lab snapshot as of 2026-05-14  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Data posture: synthetic/no-client-data only

## Executive Read

The Azure lab now proves the shape of an enterprise private data lane for AbarVa. It is not just a demo account: it has private networking, private storage, private Postgres, managed identity, observability, a Container Apps runtime lane, and a repeatable IaC path.

The current design keeps the app runtime in `eastus` and the first managed Postgres lane in `eastus2` because this subscription is offer-restricted for Postgres Flexible Server in `eastus`. That cross-region pattern is acceptable for lab and useful for enterprise proof: the architecture absorbed a quota/region constraint without opening a public database endpoint.

## What Is Live

| Layer | Azure services | Live resources | Why it matters |
|---|---|---|---|
| Shared security | Key Vault | `kv-abarva-lab-001` | Central custody for secrets and future model/data-plane credentials. |
| Private network | VNet, NSG, Private DNS | `vnet-abarva-private-dataplane-lab-eastus`, `privatelink.*` zones | Creates the private data lane AbarVa can place inside a customer-controlled Azure boundary. |
| Private object store | Storage + Private Endpoint | `stabarvaprivatedplab001`, `pe-stabarvaprivatedplab001-blob` | Stores datasets, evidence manifests, exports, and corpus artifacts without public data-plane access. |
| Runtime scale lane | Container Apps environment, Container App, managed identity | `cae-abarva-scale-lab-eastus`, `ca-abarva-scale-smoke-lab-eastus`, `id-abarva-scale-runtime-lab-eastus` | Validates HTTP/container autoscale without App Service VM quota. |
| Image supply chain | Azure Container Registry | `acrabarvalab001` | RBAC-only image registry for app, broker, ingestion, and evaluation worker images. |
| Event ingestion | Service Bus, Event Grid, Blob containers | `sb-abarva-lab-eastus`, `q-context-ingestion-events`, `q-agent-work-items`, `context-drops`, `context-processed`, `egsub-context-drop-created` | Creates the Day-2 backbone for incremental context-layer refresh. |
| Database lane | Azure Database for PostgreSQL Flexible Server, DB VNet, VNet peering | `pg-abarva-context-lab-001`, `vnet-abarva-database-lab-eastus2` | Azure-native system-of-record candidate for control, context, and audit stores. |
| Observability | Log Analytics, Application Insights, Action Group, Activity Log Alert | `log-abarva-observability-lab-eastus`, `appi-abarva-observability-lab-eastus`, `ag-abarva-observability-lab-eastus`, `ala-subscription-deployment-failures` | Gives the lab an operational control loop and deployment failure visibility. |
| Cost guardrails | Cost Management budget | `budget-abarva-lab-monthly` | Keeps lab burn visible before adding paid retrieval/model/security services. |
| Security posture | Defender pricing baseline | Free tier for selected resource types | Establishes a security posture without creating unnecessary lab burn. |

## In-Flight Next

| Order | Capability | Azure service | Intended state |
|---:|---|---|---|
| 1 | Retrieval | Azure AI Search | Tenant context, evidence, source/vendor, and industry corpus indexes. |
| 2 | Model lane | Azure AI Foundry / Azure OpenAI | Governed enterprise model endpoint, including Claude through Azure-native procurement where available. |
| 3 | Real app runtime | Azure Container Apps + ACR image | Deploy a real AbarVa image with Key Vault-backed env and health checks. |
| 4 | Enterprise ingress | Front Door + WAF | Public Azure entry with TLS, WAF, bot/rate controls, and customer-ready routing. |
| 5 | Ingestion worker | Container Apps job or worker app | Consume Service Bus events, validate datasets, scan sensitive data, update manifests, and refresh search. |

## Front / Middle / Back Mapping

| AbarVa layer | Current product function | Azure lab mapping | Target state |
|---|---|---|---|
| Front | Next.js app shell, Home, Intelligence, Moves, Source, Tower, Learn | Container Apps runtime lane is proven with placeholder app; production/demo still runs elsewhere until parity is cut over. | Azure Front Door + WAF in front of Container Apps for Azure-first deployments; Vercel can remain SaaS edge where appropriate. |
| Middle | API routes, agent orchestration, context assembly, model gateway, source/move workflows | Container Apps + managed identity + Key Vault + private network + ACR image supply chain. | Split app runtime, broker/API boundary, ingestion worker, evaluation worker, and scheduled jobs as separate images in ACR. |
| Back | Tenant data, context metadata, evidence, audit, files | Private Postgres + private Blob Storage. | Postgres for metadata/contracts/audit; Blob for raw artifacts/manifests; AI Search for retrieval; optional graph/vector services as tenant requirements dictate. |
| Model/retrieval | Sentinel/Nexus/Source/Atlas reasoning over tenant context | Not yet live in Azure. | Azure AI Search + Foundry model lane, with sensitivity-aware routing and evaluation telemetry. |
| Ops/security | Logs, metrics, secrets, deployment failures | Log Analytics, App Insights, Key Vault, activity log alert. | Azure Policy, Defender, Sentinel, private operator access, budget enforcement, and DLP/sensitive-data controls. |

## Cost and Latency Notes

The lab currently crosses `eastus` to `eastus2` for app-to-Postgres traffic. That adds a small latency penalty and cross-region bandwidth cost. For lab, this is the right trade: it preserves private networking while avoiding the `eastus` Postgres offer restriction.

Before scale-up, measure and record:

| Metric | Why |
|---|---|
| Container Apps to Postgres p50/p95 query latency | Establish real cross-region cost of the current layout. |
| Monthly GB egress from `eastus2` to `eastus` | Quantify whether the topology matters economically. |
| Same-region comparison if `eastus` quota/offer is lifted | Decide with data, not architecture preference. |

## Explicit Non-Goals Today

- No PHI, PII, or real client data.
- No production model keys.
- No open public database endpoint.
- No customer VPN/private link yet.
- No full Supabase-to-Azure cutover yet.
- No Kubernetes unless the product clearly needs it.

## Current Gaps

| Gap | Severity | Close path |
|---|---|---|
| Real AbarVa app image not yet pushed to Azure | High | Build/push image to ACR, deploy a staging Container App with Key Vault-backed env. |
| No Azure AI Search indexes yet | High | Define context/evidence/source/index contracts and deploy search. |
| No ingestion worker yet | Medium | Add a Container Apps job/worker that consumes the Service Bus event queue. |
| No Front Door/WAF | Medium | Add when real Azure-hosted app needs enterprise ingress. |
| No Azure Policy assignments beyond placeholders | Medium | Add guardrails before first customer VPC lane. |
| Key Vault still public-network reachable for lab manageability | Medium | Close once a private operator path exists. |
