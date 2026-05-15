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
| Resource parity audit | Azure CLI script + GitHub Actions workflow | `npm run azure:resource:parity`, `.github/workflows/azure-l1-resource-parity.yml` | L1 live-state audit for expected lab resources and unexpected resources in tracked resource groups. AZLAB33 live local run returned 37 pass, 0 attention, 0 fail on 2026-05-15. Complements future Bicep what-if. |
| Bicep what-if gate | Azure CLI + GitHub Actions workflow | `.github/workflows/azure-l1-bicep-whatif.yml` | L1 IaC-plan gate for deployable foundation modules. Builds Bicep and can run subscription-scope what-if by module (`foundation`, `postgres`, `registry-cost`, `event-ingestion`, `search`, `app-runtime`, `graph`, or `all`). |
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
| Tenant data parity gate | GitHub Actions workflow + read-only Postgres verifier | `.github/workflows/azure-l5-data-parity.yml`, `src/scripts/verify-azure-tenant-data-parity.ts` | L5 context-layer density gate: asserts Apex, Meridian, and First Capital have non-empty clients, setup segments, data records, context chunks, graph nodes/edges, Source events, and engagements after copy/restore/migration. |
| Functional E2E | GitHub Actions workflow + Playwright tenant matrix | `.github/workflows/azure-l6-primary-surfaces.yml`, `tests/e2e/primary-surfaces-tenant-matrix.spec.ts` | L6 primary-surface browser gate: signs in through DemoCodeSignIn and traverses Home, Intelligence, Strategic Moves, Source, and Tower for the tenant matrix. Live Azure run waits on Clerk allowing the Container Apps host. |
| Agent quality corpus + runner | JSONL corpus + validator + runner/scorer + GitHub Actions workflows | `tests/agent-quality/golden/*.jsonl`, `npm run qa:agent-quality:corpus`, `npm run qa:agent-quality:runner`, `.github/workflows/agent-quality-corpus.yml`, `.github/workflows/agent-quality-live-runner.yml` | L7 deterministic corpus contract plus execution harness: 50 golden/adversarial prompts across Sentinel, Atlas, Nexus, Source, and Steward with required terms, forbidden terms, tenant/citation/dissent expectations, coverage validation, captured-answer scoring, and optional authenticated live execution against `/api/chat/agent`. |
| Sentinel consistency guards | Voice-doctrine validator + behavior tests | `src/lib/agent/voice-doctrine/sentinel.ts`, `src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts` | L7 post-generation consistency checks: ranked-money ordering, G1 sum reconciliation, G2 relative date math, and G6 pattern-citation validity. AZLAB44 covers the Phase 1 implementation. |
| Compliance audit assertions | Jest + migration-contract test | `src/lib/security/__tests__/quarantine-audit-supabase.test.ts` | L10 sensitive-upload evidence test: proves quarantine listing is tenant-scoped and parent-only, release/hard-delete actions append lifecycle rows through `parent_id`, and the migration enables RLS with public-role SELECT only. |
| SOC2 evidence export | Operator script + manifest | `npm run export:soc2-evidence-pack`, `src/scripts/export-soc2-evidence-pack.ts` | L10 evidence pack export for sensitive-upload decisions, data inventory audit logs, gate evidence, and local approval ledgers. AZLAB38 dry-run passed on 2026-05-15 and records missing optional sources as manifest skips. |
| Sensitive-upload immutability | Operator script + live Postgres assertion | `npm run assert:sensitive-upload-audit-immutability`, `src/scripts/assert-sensitive-upload-audit-immutability.ts` | L10 live assertion that authenticated observer/tenant-admin roles cannot UPDATE/DELETE original sensitive-upload audit rows, while privileged service-side lifecycle actions append `released` and `hard_deleted` child rows. Dry-run passed in AZLAB39. |
| Purview label lifecycle persistence | Supabase data source + unit test | `src/lib/security/quarantine-audit-supabase.ts`, `src/lib/security/__tests__/quarantine-audit-supabase.test.ts` | L10 classification-preservation fix: release and hard-delete lifecycle rows now copy `purview_reached` and `purview_labels` from the original quarantine row. Covered by AZLAB41. |
| Scheduled SOC2 evidence pack | GitHub Actions workflow | `.github/workflows/l10-soc2-evidence-pack.yml` | L10 monthly/manual evidence-pack export. Uses `SOC2_EVIDENCE_DATABASE_URL` or `AZURE_LAB_DATABASE_URL`, supports dry-run/manual filters, and uploads export JSON plus pack artifacts. Covered by AZLAB42. |
| Load smoke | Node script + GitHub Actions workflow | `npm run azure:load:primary-surfaces`, `.github/workflows/azure-l8-primary-surface-load.yml` | L8 dependency-free primary-surface load gate for Azure/staging/prod. Measures 5xx, request errors, status distribution, p95, and per-path latency across Home, Intelligence, Moves, Source, and Tower. |
| Service Bus DLQ drill | Operator script | `npm run azure:servicebus:dlq-drill`, `src/scripts/azure-servicebus-dlq-drill.ts` | L9 resilience drill that produces one malformed ingestion message and verifies the A2b worker moves it to the Service Bus dead-letter subqueue with a worker rejection reason, not retry exhaustion. Dry-run passed in AZLAB40. |
| Retrieval | Azure AI Search | `srch-abarva-context-lab-eastus`; indexes `tenant-context-v1`, `evidence-ledger-v1`, `source-vendor-v1`, `industry-corpus-v1`, `signals-v1` | Azure-native retrieval service for tenant context, evidence, source/vendor artifacts, industry corpus, and signals. `tenant-context-v1` now holds 6,567 synthetic context chunks with canonical tenant filters; remaining indexes and broker query adapter are pending. |
| Azure-native graph | Cosmos DB for Apache Gremlin | `cos-abarva-graph-lab-001`, `abarva-context-graph`, `tenant-context` | Operational relationship graph foundation for tenant context; partitioned by `/tenantKey` and reachable through private endpoint/DNS. |
| Graph compatibility | Neo4j env compatibility path | Driver gated behind `graph_neo4j_enabled` (default OFF) since 2026-05-15. Postgres `enterprise_graph_*` (1,313 nodes / 1,568 edges) is the real system of record. The unhealthy Azure Neo4j resource can be deleted without app crashes — see `NEO4J-DEPRECATION-PLAN.md`. | Current code keeps a Neo4j driver for compatibility, but the lab does not treat Neo4j as the strategic Azure graph provider. Phase C of the deprecation plan removes the driver dep entirely. |
| Database lane | Azure Database for PostgreSQL Flexible Server, DB VNet, VNet peering | `pg-abarva-context-lab-001`, `vnet-abarva-database-lab-eastus2` | Azure-native system-of-record candidate for control, context, and audit stores. Current `abarva_control` verifier count: 149 migrations, 234 public tables, 3 clients, 48 engagements, 6,567 context chunks, 1,313 graph nodes, 1,568 graph edges, 23 Source events. |
| Observability | Log Analytics, Application Insights, Action Group, Activity Log Alert | `log-abarva-observability-lab-eastus`, `appi-abarva-observability-lab-eastus`, `ag-abarva-observability-lab-eastus`, `ala-subscription-deployment-failures` | Gives the lab an operational control loop and deployment failure visibility. |
| Observability audit | Azure CLI script + GitHub Actions workflow | `npm run azure:observability:audit`, `.github/workflows/azure-l11-observability-audit.yml` | L11 evidence-plane audit for Log Analytics, Application Insights, action group, deployment-failure alert, monthly budget, Container Apps diagnostics, and web-app telemetry binding. AZLAB32 live local run returned 11 pass, 2 attention, 0 fail on 2026-05-15. |
| Cost guardrails | Cost Management budget | `budget-abarva-lab-monthly` | Keeps lab burn visible before adding paid retrieval/model/security services. |
| Security posture | Defender pricing baseline | Free tier for selected resource types | Establishes a security posture without creating unnecessary lab burn. |

## In-Flight Next

| Order | Capability | Azure service | Intended state |
|---:|---|---|---|
| 1 | L4 Azure isolation probe run | Container Apps + Clerk + SEC-P0 workflow | AZLAB28 wired the workflow target. Next step is minting an Azure-host Clerk session, loading `AZURE_LAB_*` secrets, and running the probe against the Azure FQDN. |
| 2 | L5 seed/data-copy replay | GitHub Actions + Azure copy scripts | AZLAB29 covers schema reset/replay and AZLAB31 adds row-count assertions. Next L5 step is a live Azure run after each `db:azure:copy-tenant-context`, plus weekly PITR restore verification. |
| 3 | L6 live primary-surface E2E | Playwright + Clerk + Container Apps | AZLAB30 wired the workflow. Next step is allowing the Azure host in Clerk, then running `azure-lab` against all three demo tenants. |
| 4 | L1 resource parity / what-if runs | GitHub Actions + Azure CLI | AZLAB33 wired live-state resource parity and AZLAB36 wired Bicep build/what-if. Next step is running both through GitHub OIDC and adding expected-change parsing. |
| 5 | L11 observability audit run | GitHub Actions + Azure CLI | AZLAB32 wired the evidence-plane audit. Next step is loading `AZURE_LAB_CLIENT_ID`/`AZURE_LAB_TENANT_ID` secrets and running the manual workflow. |
| 6 | L8 load-smoke run | Node load script + GitHub Actions | AZLAB35 wired the dependency-free load gate. Next step is running against Azure with `AZURE_LAB_L8_COOKIE` and `--require-2xx` after Clerk accepts the Container Apps hostname. |
| 7 | L7 live agent-quality baseline run + telemetry | Agent APIs + corpus scorer + Sentinel consistency guards | AZLAB37 wired the deterministic corpus contract, AZLAB43 added the live runner/scorer, and AZLAB44 added Phase 1 Sentinel consistency guards. Next step is running the 50 prompts against Azure/prod with a short-lived authenticated cookie, storing the first scored baseline artifact, and wiring guard telemetry into C5. |
| 8 | L3 strict pilot hardening | Private Endpoint + RBAC-only posture | AZLAB27 is 0-fail advisory. Before customer private-data-lane pilot, close the 9 attention items: Service Bus/Search public access, Key Vault public manageability, local auth, and over-broad RBAC scopes. |
| 9 | Data-access adapter migration | App API/data layer | Move routes that still depend on Supabase REST behind an adapter that can target Azure Postgres. |
| 10 | Search query adapter | Azure AI Search + AgentContextBroker | Tenant-context backfill is live. Next proof is broker retrieval against `tenant-context-v1` and additional backfills for evidence/source/industry/signals. |
| 11 | Model lane | Azure AI Foundry / Azure OpenAI | Governed enterprise model endpoint, including Claude through Azure-native procurement where available. |
| 12 | Graph-provider code boundary | App broker + Cosmos Gremlin adapter | Replace direct Neo4j reads with a provider boundary and project tenant edges from Postgres to Cosmos Gremlin. |
| 13 | Enterprise ingress | Front Door + WAF | Public Azure entry with TLS, WAF, bot/rate controls, and customer-ready routing. |
| 14 | Event Grid normalizer | Event Grid + Service Bus + Container Apps Job | Complete for metadata-bearing BlobCreated events. AZLAB23 proved Blob upload -> Event Grid -> Service Bus -> worker normalizer -> guard -> audit without direct canonical producer messages. |

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
| L1-L11 full-stack test gates not wired end-to-end | High | `AZURE-FULL-STACK-TEST-LAYERS.md` defines the deploy, pilot, and continuous gates. L1 resource parity/what-if, L2 positive-path, L3 advisory audit, L4 Azure SEC-P0 target, L5 schema/data parity, L6 primary-surface E2E, L7 agent-quality corpus and runner/scorer, L8 load smoke, L9 Service Bus DLQ drill, L10 sensitive-upload audit assertions/evidence export/immutability command/Purview label persistence/scheduled export, and L11 evidence-plane audit are now wired. Remaining gates: first L7 live baseline run, deeper L9 resilience drills, and L10 live-Purview/blob-retention assertions. |
| L3 security attention items remain advisory | High | AZLAB27 found 0 fail and 9 attention. Close or intentionally waive Service Bus/Search public access, local auth, Key Vault public manageability, Cosmos local auth, and account/namespace-scoped RBAC before a customer private-data-lane pilot. |
| L11 telemetry attention items remain advisory | Medium | AZLAB32 found 0 fail and 2 attention: App Insights is not workspace-backed, and the web Container App does not yet project the App Insights connection string. Close before using App Insights as the pilot SLO source. |
| Authenticated route-level Azure smoke still needed | High | Core setup/context tables are copied and direct app-to-Azure-Postgres health is green; AZLAB28 wired SEC-P0 to the Azure target and AZLAB30 wired browser E2E, but both need live Azure-host Clerk/auth runs. |
| Live seed/data-copy drill still needed | High | AZLAB31 adds the tenant row-count assertion gate. Next L5 gate is a live run after `db:azure:copy-tenant-context`, plus PITR restore verification against a sandbox database. |
| Supabase REST paths still exist | High | Add a data-access adapter boundary so routes can target Supabase or Azure Postgres without rewriting product surfaces. |
| Search broker adapter missing | High | AZLAB25 loaded `tenant-context-v1`; next step is AgentContextBroker query adapter and retrieval quality tests. |
| No graph-provider app adapter yet | Medium | Add a broker-level graph provider interface and seed Cosmos Gremlin with synthetic tenant context. |
| Broker/index path still audit-only | Medium | AZLAB23 closes raw BlobCreated normalization. Next step is enabling broker rebuild/chunk/index work behind the `INGESTION_PIPELINE_MODE` boundary once the data-access adapter is ready. |
| No Front Door/WAF | Medium | Add when real Azure-hosted app needs enterprise ingress. |
| No Azure Policy assignments beyond placeholders | Medium | Add guardrails before first customer VPC lane. |
| Key Vault still public-network reachable for lab manageability | Medium | Close once a private operator path exists; tracked by AZLAB27. |
