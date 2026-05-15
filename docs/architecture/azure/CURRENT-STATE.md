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
| App image | ACR image | `acrabarvalab001.azurecr.io/abarva/web:lab-parallel-run-20260515-r1` | Proves the real AbarVa Next.js app can build and push through Azure's image lane with a direct Azure Postgres health probe. |
| Real-image app runtime shell | Container App | `ca-abarva-web-lab-eastus` | Active revision `0000004` serves public traffic, pulls from ACR with managed identity, projects secrets from Key Vault, and confirms `direct_postgres=true` against Azure Postgres. |
| Database migration job | Container Apps Job | `job-abarva-db-migrate-lab-eastus` | Runs Azure Postgres compatibility bootstrap plus repo SQL migrations inside the private Container Apps environment; refreshed on 2026-05-15 with execution `job-abarva-db-migrate-lab-eastus-vx03psu` to apply the B5c `sensitive_upload_audit` migration. |
| Tenant context copy job | Container Apps Job | `job-abarva-db-copy-lab-eastus` | Hydrates Azure Postgres with the synthetic setup/context layer needed for a parallel app run. Successful execution `job-abarva-db-copy-lab-eastus-c1o7k0e` copied 48 engagements, 6,567 context chunks, 1,313 graph nodes, 1,568 graph edges, and 23 Source events on 2026-05-15. |
| Event ingestion | Service Bus, Event Grid, Blob containers | `sb-abarva-lab-eastus`, `q-context-ingestion-events`, `q-agent-work-items`, `context-drops`, `context-processed`, `egsub-context-drop-created` | Creates the Day-2 backbone for incremental context-layer refresh. |
| Context ingestion worker | Container Apps Job | `job-a2b-ingest-lab-eus` | Deployable A2b worker that receives Service Bus events, normalizes raw BlobCreated events when needed, downloads Blob payloads, runs the sensitive-upload guard, writes audit rows, and settles messages. Event Grid-only smoke execution `job-a2b-ingest-lab-eus-cv1q617` succeeded on 2026-05-15. |
| Ingestion E2E smoke harness | Container Apps Jobs | `job-a2b-smoke-send-eus`, `job-a2b-smoke-verify-eus` | Synthetic producer/verifier jobs for the A2b lane. Passing canonical run `azlab22-20260515133350` and Event Grid-only run `azlab23-20260515140157` verified safe upload = `allow` and sensitive fake PHI/PII sample = `quarantine` in Azure Postgres. |
| Connectivity smoke | Container Apps Job + guarded health route | `job-azure-connectivity-smoke-eus`, `/api/health/azure-connectivity` | L2 positive-path smoke for Postgres, Blob, Service Bus, Key Vault, and Azure AI Search. AZLAB26 execution `job-azure-connectivity-smoke-eus-flqccn6` passed on 2026-05-15; `tenant-context-v1` count observed: 6,567. |
| Security audit | Azure CLI script | `npm run azure:security:audit`, `scripts/azure/audit-lab-security.mjs` | L3 advisory audit for network posture, local auth, managed-identity role scope, and Container Apps secret projection. AZLAB27 live run returned 67 pass, 9 attention, 0 fail on 2026-05-15. |
| Isolation probes | GitHub Actions workflow + curl suite | `.github/workflows/sec-p0-post-deploy.yml`, `tests/security/sec-p0-cross-tenant-probes.sh` | L4 cross-tenant API probe workflow now has an `azure-lab` target. Live run waits on Azure-host-scoped Clerk session and `AZURE_LAB_*` repository secrets. |
| Reset-and-replay gate | GitHub Actions workflow + disposable Postgres | `.github/workflows/azure-l5-reset-replay.yml` | L5 schema replay gate: fresh Postgres 16, Supabase/Azure compatibility bootstrap, full migration replay, and schema verification. Seed/data-copy replay and Azure PITR restore are still separate live drills. |
| Retrieval | Azure AI Search | `srch-abarva-context-lab-eastus`; indexes `tenant-context-v1`, `evidence-ledger-v1`, `source-vendor-v1`, `industry-corpus-v1`, `signals-v1` | Azure-native retrieval service for tenant context, evidence, source/vendor artifacts, industry corpus, and signals. `tenant-context-v1` now holds 6,567 synthetic context chunks with canonical tenant filters; remaining indexes and broker query adapter are pending. |
| Azure-native graph | Cosmos DB for Apache Gremlin | `cos-abarva-graph-lab-001`, `abarva-context-graph`, `tenant-context` | Operational relationship graph foundation for tenant context; partitioned by `/tenantKey` and reachable through private endpoint/DNS. |
| Graph compatibility | Neo4j env compatibility path | Driver gated behind `graph_neo4j_enabled` (default OFF) since 2026-05-15. Postgres `enterprise_graph_*` (1,313 nodes / 1,568 edges) is the real system of record. The unhealthy Azure Neo4j resource can be deleted without app crashes — see `NEO4J-DEPRECATION-PLAN.md`. | Current code keeps a Neo4j driver for compatibility, but the lab does not treat Neo4j as the strategic Azure graph provider. Phase C of the deprecation plan removes the driver dep entirely. |
| Database lane | Azure Database for PostgreSQL Flexible Server, DB VNet, VNet peering | `pg-abarva-context-lab-001`, `vnet-abarva-database-lab-eastus2` | Azure-native system-of-record candidate for control, context, and audit stores. Current `abarva_control` verifier count: 149 migrations, 234 public tables, 3 clients, 48 engagements, 6,567 context chunks, 1,313 graph nodes, 1,568 graph edges, 23 Source events. |
| Observability | Log Analytics, Application Insights, Action Group, Activity Log Alert | `log-abarva-observability-lab-eastus`, `appi-abarva-observability-lab-eastus`, `ag-abarva-observability-lab-eastus`, `ala-subscription-deployment-failures` | Gives the lab an operational control loop and deployment failure visibility. |
| Cost guardrails | Cost Management budget | `budget-abarva-lab-monthly` | Keeps lab burn visible before adding paid retrieval/model/security services. |
| Security posture | Defender pricing baseline | Free tier for selected resource types | Establishes a security posture without creating unnecessary lab burn. |

## In-Flight Next

| Order | Capability | Azure service | Intended state |
|---:|---|---|---|
| 1 | L4 Azure isolation probe run | Container Apps + Clerk + SEC-P0 workflow | AZLAB28 wired the workflow target. Next step is minting an Azure-host Clerk session, loading `AZURE_LAB_*` secrets, and running the probe against the Azure FQDN. |
| 2 | L5 seed/data-copy replay | GitHub Actions + Azure copy scripts | AZLAB29 covers schema reset/replay. Next L5 step is deterministic synthetic data replay with expected row-count assertions. |
| 3 | L3 strict pilot hardening | Private Endpoint + RBAC-only posture | AZLAB27 is 0-fail advisory. Before customer private-data-lane pilot, close the 9 attention items: Service Bus/Search public access, Key Vault public manageability, local auth, and over-broad RBAC scopes. |
| 4 | Data-access adapter migration | App API/data layer | Move routes that still depend on Supabase REST behind an adapter that can target Azure Postgres. |
| 5 | Search query adapter | Azure AI Search + AgentContextBroker | Tenant-context backfill is live. Next proof is broker retrieval against `tenant-context-v1` and additional backfills for evidence/source/industry/signals. |
| 6 | Model lane | Azure AI Foundry / Azure OpenAI | Governed enterprise model endpoint, including Claude through Azure-native procurement where available. |
| 7 | Graph-provider code boundary | App broker + Cosmos Gremlin adapter | Replace direct Neo4j reads with a provider boundary and project tenant edges from Postgres to Cosmos Gremlin. |
| 8 | Enterprise ingress | Front Door + WAF | Public Azure entry with TLS, WAF, bot/rate controls, and customer-ready routing. |
| 9 | Event Grid normalizer | Event Grid + Service Bus + Container Apps Job | Complete for metadata-bearing BlobCreated events. AZLAB23 proved Blob upload -> Event Grid -> Service Bus -> worker normalizer -> guard -> audit without direct canonical producer messages. |

## Front / Middle / Back Mapping

| AbarVa layer | Current product function | Azure lab mapping | Target state |
|---|---|---|---|
| Front | Next.js app shell, Home, Intelligence, Moves, Source, Tower, Learn | Container Apps runtime lane now serves the real AbarVa image and returns HTTP `200` for `/`; production/demo still runs elsewhere until authenticated parity is cut over. | Azure Front Door + WAF in front of Container Apps for Azure-first deployments; Vercel can remain SaaS edge where appropriate. |
| Middle | API routes, agent orchestration, context assembly, model gateway, source/move workflows | Container Apps + managed identity + Key Vault + private network + ACR image supply chain. | Split app runtime, broker/API boundary, ingestion worker, evaluation worker, and scheduled jobs as separate images in ACR. |
| Back | Tenant data, context metadata, evidence, audit, files | Private Postgres + private Blob Storage. Azure Postgres now has migrated schema, copied synthetic tenant context rows, and direct app-runtime connectivity through Key Vault-projected `DATABASE_URL`. | Postgres for metadata/contracts/audit; Blob for raw artifacts/manifests; AI Search for retrieval; optional graph/vector services as tenant requirements dictate. |
| Model/retrieval | Sentinel/Nexus/Source/Atlas reasoning over tenant context | Azure AI Search has the first synthetic tenant-context backfill, but agent retrieval still uses existing app paths until the broker adapter lands. | Azure AI Search + Foundry model lane, with sensitivity-aware routing and evaluation telemetry. |
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
| L1-L11 full-stack test gates not wired end-to-end | High | `AZURE-FULL-STACK-TEST-LAYERS.md` defines the deploy, pilot, and continuous gates. L2 positive-path connectivity smoke is now live in AZLAB26. Next PRs should add L3 Azure security audit, L4 Azure SEC-P0 workflow target, L5 reset-and-replay, and L6 workflow E2E. |
| L3 security attention items remain advisory | High | AZLAB27 found 0 fail and 9 attention. Close or intentionally waive Service Bus/Search public access, local auth, Key Vault public manageability, Cosmos local auth, and account/namespace-scoped RBAC before a customer private-data-lane pilot. |
| Authenticated route-level Azure smoke still needed | High | Core setup/context tables are copied and direct app-to-Azure-Postgres health is green; AZLAB28 wired SEC-P0 to the Azure target, but browser sign-in plus tenant surface parity still need a live run. |
| Seed/data-copy reset-and-replay still needed | High | AZLAB29 covers fresh schema replay. Next L5 gate should replay canonical synthetic data and assert tenant row counts. |
| Supabase REST paths still exist | High | Add a data-access adapter boundary so routes can target Supabase or Azure Postgres without rewriting product surfaces. |
| Search broker adapter missing | High | AZLAB25 loaded `tenant-context-v1`; next step is AgentContextBroker query adapter and retrieval quality tests. |
| No graph-provider app adapter yet | Medium | Add a broker-level graph provider interface and seed Cosmos Gremlin with synthetic tenant context. |
| Broker/index path still audit-only | Medium | AZLAB23 closes raw BlobCreated normalization. Next step is enabling broker rebuild/chunk/index work behind the `INGESTION_PIPELINE_MODE` boundary once the data-access adapter is ready. |
| No Front Door/WAF | Medium | Add when real Azure-hosted app needs enterprise ingress. |
| No Azure Policy assignments beyond placeholders | Medium | Add guardrails before first customer VPC lane. |
| Key Vault still public-network reachable for lab manageability | Medium | Close once a private operator path exists; tracked by AZLAB27. |
