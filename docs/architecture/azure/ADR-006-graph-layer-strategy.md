# ADR-006: Azure-Native Graph Layer Strategy

Status: accepted for lab architecture
Date: 2026-05-15
Data posture: synthetic/no-client-data only

## Decision

AbarVa should not make Neo4j the default target-state graph service for Azure enterprise deployments.

Neo4j remains a compatibility bridge because the current app has a Neo4j-backed graph driver and `/api/health` checks that code path today. The Azure target state is:

1. **Operational relationship graph:** Azure Cosmos DB for Apache Gremlin where the product needs online, low-latency traversal across entities such as tenant, person, system, vendor, policy, KPI, move, source event, evidence, and dependency.
2. **Analytical and visual graph:** Microsoft Fabric Graph as it matures, especially when the client wants relationship modeling over OneLake without duplicating governed enterprise data into a separate graph store.
3. **Compatibility/exception path:** Neo4j only when a client already standardizes on it, needs graph-native algorithms beyond the Azure-native services, or when migration risk is higher than the value of immediate Azure-native purity.

## Why

AbarVa's enterprise story is stronger when the client context layer can live inside the customer's Azure boundary using managed identity, private networking, Azure-native monitoring, Azure-native RBAC, and customer-owned governance. A separate third-party graph cluster adds another security model, another procurement lane, and another operations surface.

The app should still preserve a graph abstraction in code. The durable design is not "Neo4j everywhere" or "Cosmos everywhere"; it is "AbarVa relationship graph behind a provider boundary." That lets the same product reason over connected context while the deployment chooses the right graph implementation.

## Current Lab Posture

| Layer | Current state | Direction |
|---|---|---|
| App graph driver | `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` are still used by the current code path. | Keep projected through Key Vault for parity smoke only. |
| Azure-native operational graph | Not yet provisioned. | Add Cosmos DB for Gremlin after the provider boundary is explicit. |
| Azure-native analytical graph | Not yet provisioned. | Track Fabric Graph for context analytics and executive visualization once production suitability is acceptable. |
| Health check | `/api/health` checks current Supabase + Neo4j integrations. | Split future health into `runtime`, `context-store`, `graph-provider`, and `retrieval-provider` checks so Azure-native graph migration is measurable. |

## Target Context Graph Model

The graph should represent relationships the agents need to reason over, not just generic nodes:

| Node family | Example relationships | Agent value |
|---|---|---|
| Tenant / business unit | owns KPI, runs system, funds move | Keeps answers tenant-grounded. |
| Person / role | reports to, sponsors, blocks, approves | Lets Sentinel and Nexus reason about sponsorship and decision rights. |
| System / dataset | feeds, depends on, has data-quality issue | Supports architecture, data-readiness, and AI feasibility calls. |
| Vendor / contract / SI | provides, renews, overlaps, concentrates risk | Supports Source and Tower sourcing judgment. |
| Move / program / phase | depends on, gates, evidence-for, risk-to | Supports Nexus phase gates and Tower portfolio pressure. |
| Policy / control / finding | constrains, requires evidence, blocks deployment | Supports healthcare, banking, and enterprise security posture. |

## Migration Path

1. Keep the current Neo4j env projection so the real image can boot and `/api/health` can prove parity.
2. Introduce a graph-provider interface behind the broker boundary, with provider IDs such as `neo4j`, `cosmos-gremlin`, and later `fabric-graph`.
3. Stand up a small Cosmos DB for Gremlin lab graph with synthetic relationship data only.
4. Run dual-write or rebuild-from-manifest for graph edges from the context layer.
5. Move health checks and agent graph reads to the provider boundary.
6. Retire Neo4j from the Azure default once Cosmos/Fabric graph coverage is validated.

## Implications

- Key Vault projection still includes Neo4j secrets in the current lab because the code uses them today.
- The product architecture document should call Neo4j a compatibility adapter, not the strategic Azure graph service.
- The first Azure-native graph PR should not be a UI feature. It should be a provider-boundary + synthetic graph smoke + health/readiness check.

## Microsoft Reference Points

- Azure Cosmos DB for Apache Gremlin is Microsoft's managed graph database service for storing, querying, and traversing graph data with Gremlin.
- Microsoft Fabric Graph is currently public preview and is better framed as an analytical/visual graph lane until production maturity is acceptable.
