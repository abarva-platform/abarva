# AbarVa Azure Lab Sequencing Roadmap

Status: active roadmap as of 2026-05-15

## Priority Order

| Order | Service | Why now | Target posture |
|---:|---|---|---|
| 1 | Azure Container Registry | Foundational for real Container Apps images. | RBAC-only, admin disabled; private endpoint later. |
| 2 | Cost Management budgets + alerts | Keeps founder-lab burn visible before more paid services land. | Monthly budget with actual/forecast thresholds. |
| 3 | Service Bus + Event Grid | Unblocks event-driven context refresh without Data Factory complexity. | Live in AZLAB12. Next: ingestion worker. |
| 4 | Azure AI Search | Core retrieval/index layer for context and evidence. | Service live in AZLAB13; index contracts live in AZLAB24; tenant-context backfill live in AZLAB25; query adapter next. |
| 5 | Key Vault env projection | Required before the real AbarVa image can pass runtime smoke in Azure. | Container Apps secret references through managed identity; no credentials baked into image or IaC. |
| 6 | Azure-native graph provider | Needed before the context layer is fully Azure-native. | Cosmos DB for Apache Gremlin deployed in AZLAB17; next is app provider boundary and synthetic graph seed. |
| 7 | Front Door + WAF | Required when Azure hosts a real public app endpoint. | TLS edge, WAF, rate/bot controls. |
| 8 | API Management | Useful when customer/partner APIs are exposed. | Defer until first signed pilot API boundary. |
| 9 | Azure AI Foundry / Azure OpenAI | Lets Azure-native enterprises consume model services through their approved cloud lane. | Claude/LLM routing through approved Foundry/provider lane where available. |
| 10 | Defender for Cloud / Microsoft Sentinel | SOC/SecOps readiness. | Add when budgets and logs are stable. |
| 11 | Azure Policy | Prevents drift and enforces private-data-lane posture. | Required before first customer VPC/private subscription. |
| 12 | Data Factory / Fabric | Better for mature Day-2 ingestion than pilot loading. | Defer; Service Bus/Event Grid + worker is enough first. Fabric Graph stays on the watchlist for analytical graph. |

## Architecture Principle

Do the small, high-leverage platform pieces first:

1. Can we safely run images?
2. Can we see and control cost?
3. Can we ingest changes incrementally?
4. Can we retrieve context at enterprise quality?
5. Can we traverse relationships in an Azure-native graph provider?
6. Can we route model calls through an enterprise-approved lane?

That sequence is more credible than deploying a large catalog of Azure services before the product needs them.

## Image Lane Status

The first real AbarVa web image is now in ACR:

`acrabarvalab001.azurecr.io/abarva/web:lab-ebe449ae-r3`

The next runtime step is Container Apps deployment with Key Vault-backed environment wiring, not another placeholder image.

## Client-VPC Narrative

Two live constraints are useful proof points:

- **App Service quota is blocked** in the lab subscription because Total VMs is zero. The architecture moved to Container Apps instead of waiting or weakening security.
- **Postgres is in `eastus2`** because `eastus` was offer-restricted. The architecture kept Postgres private-only and connected it through private DNS and VNet peering.

This is exactly the kind of resilience enterprise customers need. Client subscriptions often have quotas, region policies, or service restrictions. AbarVa's Azure design should survive those constraints without opening public endpoints or abandoning least-privilege access.
