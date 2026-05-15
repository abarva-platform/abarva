# AbarVa Azure Lab Native Graph Foundation

Status: deployed to `abarva-lab-sub` on 2026-05-15
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`
Data posture: synthetic/no-client-data only

## Purpose

This stage creates the Azure-native operational graph foundation for the AbarVa context layer.

The current application still has a Neo4j compatibility path, but live smoke shows Neo4j is not healthy in the lab. The target architecture should not depend on Neo4j as the default graph store for Azure enterprise deployments.

## Deployed Resources

| Capability | Resource | State |
|---|---|---|
| Graph account | `cos-abarva-graph-lab-001` | Cosmos DB account with `EnableGremlin` and `EnableServerless`. |
| Graph database | `abarva-context-graph` | Tenant context graph database. |
| Graph | `tenant-context` | Partitioned by `/tenantKey`. |
| Private endpoint | `pe-cos-abarva-graph-lab-001-gremlin` | Deployed in `snet-private-endpoints`. |
| Private DNS zone | `privatelink.gremlin.cosmos.azure.com` | Linked to `vnet-abarva-private-dataplane-lab-eastus`. |
| Key Vault bootstrap secrets | `cosmos-gremlin-*` | Endpoint, key, database, and graph names stored for the future provider adapter. |

## Live Verification

Deployment:

- Subscription deployment: `azlab17-cosmos-gremlin-graph-20260515030419` → `Succeeded`
- Account: `cos-abarva-graph-lab-001`
- Public network access: `Disabled`
- Capabilities: `EnableGremlin`, `EnableServerless`
- Location: `East US`
- Graph database: `abarva-context-graph`
- Graph: `tenant-context`
- Partition key: `/tenantKey`
- Private DNS A records:
  - `cos-abarva-graph-lab-001` → `10.42.2.6`
  - `cos-abarva-graph-lab-001-eastus` → `10.42.2.7`
- Key Vault secrets set without printing values:
  - `cosmos-gremlin-endpoint`
  - `cosmos-gremlin-key`
  - `cosmos-gremlin-database`
  - `cosmos-gremlin-graph`

## Tenant Isolation Model

The first graph uses `/tenantKey` as the partition key. That is the right lab shape because it lets us mimic multiple client private data planes inside one subscription while preserving a clear tenant boundary:

| Boundary | Lab model | Client-VPC target |
|---|---|---|
| Tenant graph data | One graph, partitioned by `/tenantKey`. | Customer-owned graph account or database in their subscription. |
| Tenant relational data | Separate Postgres databases or schemas per tenant lane. | Customer-owned Azure Database for PostgreSQL or approved managed DB. |
| Tenant artifacts | Separate Blob containers or storage accounts. | Customer-owned storage account with private endpoints. |
| Tenant retrieval | Separate Azure AI Search indexes per tenant. | Customer-owned Search service or isolated indexes depending on policy. |
| Tenant secrets | Prefixes in lab Key Vault. | Customer-owned Key Vault. |

This is enough to prove day-one multi-tenant isolation without prematurely creating a subscription per demo client.

## What Goes Into The Graph

The graph is for relationships the agents need to reason over:

| Node family | Examples |
|---|---|
| Tenant / business unit | enterprise, division, region, segment |
| Person / role | CIO, CFO, CDAO, sponsor, approver, blocker |
| System / dataset | Epic, ServiceNow, Snowflake, CMDB, policy repository |
| Vendor / contract / SI | incumbent platform, renewal, overlap, concentration risk |
| Move / phase / evidence | strategic move, gate, dependency, proof point |
| Control / policy / finding | HIPAA, SR 11-7, model risk, security exception |

## Relationship To Postgres

Postgres remains the system of record for structured entities, contracts, audit, workflow state, and value tracking.

Cosmos Gremlin is the relationship traversal layer. It should be rebuilt from authoritative manifests or written through the context broker, not treated as the sole source of truth.

## Next Step

Add a graph-provider boundary in app code:

- `neo4j` provider: current compatibility adapter.
- `cosmos-gremlin` provider: Azure-native operational graph.
- future `fabric-graph` provider: analytical graph over lakehouse/OneLake scenarios.

Then seed a small synthetic graph for Apex, Meridian, and First Capital and validate cross-tenant partition isolation.
