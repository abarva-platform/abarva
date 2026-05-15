# AbarVa Azure Lab Current State

Status: live lab snapshot as of 2026-05-15
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
| App image | ACR image | `acrabarvalab001.azurecr.io/abarva/web:lab-keyvault-health-20260515-r1` | Proves the real AbarVa Next.js app can build and push through Azure's image lane with the public health probe. |
| Real-image app runtime shell | Container App | `ca-abarva-web-lab-eastus` | References the real AbarVa image with managed-identity ACR pull and Key Vault-backed env projection. |
| Database migration job | Container Apps Job | `job-abarva-db-migrate-lab-eastus` | Runs Azure Postgres compatibility bootstrap plus repo SQL migrations inside the private Container Apps environment; verified 149 migrations / 234 public tables on 2026-05-15. |
| Event ingestion | Service Bus, Event Grid, Blob containers | `sb-abarva-lab-eastus`, `q-context-ingestion-events`, `q-agent-work-items`, `context-drops`, `context-processed`, `egsub-context-drop-created` | Creates the Day-2 backbone for incremental context-layer refresh. |
| Retrieval | Azure AI Search | `srch-abarva-context-lab-eastus` | Azure-native retrieval service for tenant context, evidence, source/vendor artifacts, industry corpus, and signals. |
| Azure-native graph | Cosmos DB for Apache Gremlin | `cos-abarva-graph-lab-001`, `abarva-context-graph`, `tenant-context` | Operational relationship graph foundation for tenant context; partitioned by `/tenantKey` and reachable through private endpoint/DNS. |
| Graph compatibility | Neo4j env compatibility path | Current `NEO4J_*` settings projected from Key Vault, but health currently reports `neo4j=false` | Current code has a Neo4j driver, but the lab should not treat Neo4j as the strategic Azure graph provider. |
| Database lane | Azure Database for PostgreSQL Flexible Server, DB VNet, VNet peering | `pg-abarva-context-lab-001`, `vnet-abarva-database-lab-eastus2` | Azure-native system-of-record candidate for control, context, and audit stores. |
| Observability | Log Analytics, Application Insights, Action Group, Activity Log Alert | `log-abarva-observability-lab-eastus`, `appi-abarva-observability-lab-eastus`, `ag-abarva-observability-lab-eastus`, `ala-subscription-deployment-failures` | Gives the lab an operational control loop and deployment failure visibility. |
| Cost guardrails | Cost Management budget | `budget-abarva-lab-monthly` | Keeps lab burn visible before adding paid retrieval/model/security services. |
| Security posture | Defender pricing baseline | Free tier for selected resource types | Establishes a security posture without creating unnecessary lab burn. |

## In-Flight Next

| Order | Capability | Azure service | Intended state |
|---:|---|---|---|
| 1 | Tenant seed/export parity | Azure Postgres + seed harness | Load Apex, Meridian, and First Capital synthetic setup packs into Azure and compare context/graph counts. |
| 2 | Search index contracts | Azure AI Search indexes | Create indexes after embedding dimensions/provider and ingestion worker contract are set. |
| 3 | Model lane | Azure AI Foundry / Azure OpenAI | Governed enterprise model endpoint, including Claude through Azure-native procurement where available. |
| 4 | Graph-provider code boundary | App broker + Cosmos Gremlin adapter | Replace direct Neo4j reads with a provider boundary and project tenant edges from Postgres to Cosmos Gremlin. |
| 5 | Enterprise ingress | Front Door + WAF | Public Azure entry with TLS, WAF, bot/rate controls, and customer-ready routing. |
| 6 | Ingestion worker | Container Apps job or worker app | Consume Service Bus events, validate datasets, scan sensitive data, update manifests, and refresh search. |

## Front / Middle / Back Mapping

| AbarVa layer | Current product function | Azure lab mapping | Target state |
|---|---|---|---|
| Front | Next.js app shell, Home, Intelligence, Moves, Source, Tower, Learn | Container Apps runtime lane is proven with placeholder app; production/demo still runs elsewhere until parity is cut over. | Azure Front Door + WAF in front of Container Apps for Azure-first deployments; Vercel can remain SaaS edge where appropriate. |
| Middle | API routes, agent orchestration, context assembly, model gateway, source/move workflows | Container Apps + managed identity + Key Vault + private network + ACR image supply chain. | Split app runtime, broker/API boundary, ingestion worker, evaluation worker, and scheduled jobs as separate images in ACR. |
| Back | Tenant data, context metadata, evidence, audit, files | Private Postgres + private Blob Storage. | Postgres for metadata/contracts/audit; Blob for raw artifacts/manifests; AI Search for retrieval; optional graph/vector services as tenant requirements dictate. |
| Model/retrieval | Sentinel/Nexus/Source/Atlas reasoning over tenant context | Not yet live in Azure. | Azure AI Search + Foundry model lane, with sensitivity-aware routing and evaluation telemetry. |
| Relationship graph | Entity and dependency relationships for tenant context | Cosmos DB for Apache Gremlin is now deployed as the Azure-native operational graph foundation; current code still has a Neo4j compatibility driver. | Provider boundary with Cosmos Gremlin first; Fabric Graph for analytical graph as it matures. |
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
- No full Supabase-to-Azure cutover yet; AZLAB18 adds the migration job and parallel-run path, not production cutover.
- No Kubernetes unless the product clearly needs it.

## Current Gaps

| Gap | Severity | Close path |
|---|---|---|
| Azure tenant data seed parity not yet executed | High | Run Day-1 seed/export harness for Apex, Meridian, and First Capital; compare setup-pack, context chunk, and graph counts. |
| No Azure AI Search indexes yet | High | Create indexes after embedding/model contract is finalized. |
| No graph-provider app adapter yet | Medium | Add a broker-level graph provider interface and seed Cosmos Gremlin with synthetic tenant context. |
| No ingestion worker yet | Medium | Add a Container Apps job/worker that consumes the Service Bus event queue. |
| No Front Door/WAF | Medium | Add when real Azure-hosted app needs enterprise ingress. |
| No Azure Policy assignments beyond placeholders | Medium | Add guardrails before first customer VPC lane. |
| Key Vault still public-network reachable for lab manageability | Medium | Close once a private operator path exists. |
