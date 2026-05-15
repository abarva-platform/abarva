# AbarVa Azure Lab Sequencing Roadmap

Status: active roadmap as of 2026-05-15

## Priority Order

| Order | Service | Why now | Target posture |
|---:|---|---|---|
| 1 | Full-stack test gates | Turns the lab from "services exist" into "deployment/pilot readiness is provable." | L1-L11 gate model in `AZURE-FULL-STACK-TEST-LAYERS.md`; L1 resource parity/what-if, L2 connectivity, L3 advisory security audit, L4 Azure probe workflow target, L5 schema reset/replay, L5 tenant data parity, L6 primary-surface workflow, L7 agent-quality corpus, L8 primary-surface load smoke, L10 sensitive-upload audit assertions, and L11 observability audit are live/wired. Next slices are L4/L6/L8/L11 live Azure runs, PITR restore verification, deeper workflow E2E, L7 live runner/scorer, L10 evidence-pack export, and L1 expected-change parsing. |
| 2 | Azure Container Registry | Foundational for real Container Apps images. | RBAC-only, admin disabled; private endpoint later. |
| 3 | Cost Management budgets + alerts | Keeps founder-lab burn visible before more paid services land. | Monthly budget with actual/forecast thresholds. |
| 4 | Service Bus + Event Grid | Unblocks event-driven context refresh without Data Factory complexity. | Live in AZLAB12. Next: ingestion worker. |
| 5 | Azure AI Search | Core retrieval/index layer for context and evidence. | Service live in AZLAB13; index contracts live in AZLAB24; tenant-context backfill live in AZLAB25; query adapter next. |
| 6 | Key Vault env projection | Required before the real AbarVa image can pass runtime smoke in Azure. | Container Apps secret references through managed identity; no credentials baked into image or IaC. |
| 7 | Azure-native graph provider | Needed before the context layer is fully Azure-native. | Cosmos DB for Apache Gremlin deployed in AZLAB17; next is app provider boundary and synthetic graph seed. |
| 8 | Front Door + WAF | Required when Azure hosts a real public app endpoint. | TLS edge, WAF, rate/bot controls. |
| 9 | API Management | Useful when customer/partner APIs are exposed. | Defer until first signed pilot API boundary. |
| 10 | Azure AI Foundry / Azure OpenAI | Lets Azure-native enterprises consume model services through their approved cloud lane. | Claude/LLM routing through approved Foundry/provider lane where available. |
| 11 | Defender for Cloud / Microsoft Sentinel | SOC/SecOps readiness. | Add when budgets and logs are stable. |
| 12 | Azure Policy | Prevents drift and enforces private-data-lane posture. | Required before first customer VPC/private subscription. |
| 13 | Data Factory / Fabric | Better for mature Day-2 ingestion than pilot loading. | Defer; Service Bus/Event Grid + worker is enough first. Fabric Graph stays on the watchlist for analytical graph. |

## Architecture Principle

Do the small, high-leverage platform pieces first:

1. Can we prove the deployment, private connectivity, security posture, tenant isolation, and pilot workflows with repeatable tests?
2. Can we safely run images?
3. Can we see and control cost?
4. Can we ingest changes incrementally?
5. Can we retrieve context at enterprise quality?
6. Can we traverse relationships in an Azure-native graph provider?
7. Can we route model calls through an enterprise-approved lane?

That sequence is more credible than deploying a large catalog of Azure services before the product needs them.

## Image Lane Status

The first real AbarVa web image is now in ACR:

`acrabarvalab001.azurecr.io/abarva/web:lab-ebe449ae-r3`

The current runtime step has moved past placeholder images: the real web image runs in Container Apps with Key Vault-backed environment wiring. The next runtime proof is authenticated surface parity plus SEC-P0 isolation probes against the Azure FQDN.

## Client-VPC Narrative

Two live constraints are useful proof points:

- **App Service quota is blocked** in the lab subscription because Total VMs is zero. The architecture moved to Container Apps instead of waiting or weakening security.
- **Postgres is in `eastus2`** because `eastus` was offer-restricted. The architecture kept Postgres private-only and connected it through private DNS and VNet peering.

This is exactly the kind of resilience enterprise customers need. Client subscriptions often have quotas, region policies, or service restrictions. AbarVa's Azure design should survive those constraints without opening public endpoints or abandoning least-privilege access.
