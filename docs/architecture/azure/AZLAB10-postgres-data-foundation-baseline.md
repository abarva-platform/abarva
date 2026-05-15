# AbarVa Azure Lab Postgres Data Foundation Baseline

Status: deployed to `abarva-lab-sub` on 2026-05-14  
Subscription: `701a8554-a166-46e9-bf13-743bc50e3b20`  
Primary database region: `eastus2`  
Data posture: synthetic/no-client-data only

## Purpose

This stage adds the managed relational data foundation for the AbarVa Azure lab. It is the Azure landing-zone equivalent of the current Postgres/Supabase system-of-record layer, but deployed with private networking and observability controls from the start.

This is not the final production database design. It is the first scale-test database lane that lets us validate:

- private-only Azure Database for PostgreSQL Flexible Server
- cross-region private connectivity from the existing `eastus` runtime/private-data VNet
- private DNS resolution for Postgres
- starter database layout for control, context, and audit data
- Key Vault custody for database admin metadata
- diagnostic export to Log Analytics

## Why East US 2

The foundation runtime lane is in `eastus`, but Azure rejected Postgres Flexible Server provisioning in `eastus` for this subscription:

`LocationIsOfferRestricted`

Postgres SKU availability checks showed version 16 available in `eastus2`, so the database lane is deployed in `eastus2` with a dedicated database VNet and VNet peering back to the existing `eastus` private data-plane VNet.

This is acceptable for the lab because:

- it keeps Postgres private-only
- it avoids public fallback access
- it validates cross-region private networking
- it documents the regional constraint explicitly
- it proves the architecture can survive quota and regional availability constraints without weakening the private data lane

For production, the database and application runtime should be co-located in the final approved region unless resilience or data-residency requirements dictate otherwise.

Before scale-up, measure app-to-Postgres latency and cross-region bandwidth so the same-region decision can be made from real data. The expected lab penalty is small, but the baseline matters: it gives us a factual comparison if `eastus` Postgres availability is later unlocked.

## Live Resources

| Capability | Resource | Notes |
|---|---|---|
| Database resource group | `rg-abarva-database-lab-eastus2` | Dedicated database lane. |
| Database VNet | `vnet-abarva-database-lab-eastus2` | CIDR `10.43.0.0/16`. |
| Delegated subnet | `snet-postgres` | CIDR `10.43.1.0/24`, delegated to `Microsoft.DBforPostgreSQL/flexibleServers`. |
| Postgres server | `pg-abarva-context-lab-001` | Azure Database for PostgreSQL Flexible Server, version 16. |
| Private DNS zone | `privatelink.postgres.database.azure.com` | Linked to database VNet and existing private data-plane VNet. |
| VNet peering | `peer-to-vnet-abarva-database-lab-eastus2` | Existing private data-plane VNet to database VNet. |
| VNet peering | `peer-to-vnet-abarva-private-dataplane-lab-eastus` | Database VNet back to existing private data-plane VNet. |
| Diagnostics | `diag-pg-abarva-context-lab-001` | Sends `allLogs`, `audit`, and `AllMetrics` to Log Analytics. |
| Key Vault secrets | `postgres-context-*` | Admin login/password, server name, and FQDN. |

## Database Shape

| Database | Intended use |
|---|---|
| `abarva_control` | Tenant control-plane metadata, feature flags, deployment metadata, job state. |
| `abarva_context` | Tenant context layer metadata, evidence manifests, dataset manifests, graph/search indexing metadata. |
| `abarva_audit` | Security, agent, data-access, ingestion, and value-realization audit events. |

These are intentionally empty starter databases. No client data, PHI, PII, or production secrets have been loaded.

## Security Controls

| Control | State |
|---|---|
| Public network access | Disabled. |
| Private access | Delegated subnet + private DNS. |
| Admin password | Deployment-time secure parameter; stored in Key Vault. |
| Key Vault secret names | `postgres-context-admin-login`, `postgres-context-admin-password`, `postgres-context-server-name`, `postgres-context-fqdn`. |
| Logs | Sent to the existing Log Analytics workspace. |
| Metrics | `AllMetrics` sent to Log Analytics. |
| VNet reachability | Existing private data-plane VNet can resolve the Postgres private DNS zone through a private DNS VNet link. |

For repeatable redeploys, operators should load `POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD` from the existing Key Vault secret. Generating a new value is only appropriate when intentionally rotating the Postgres administrator password.

## Live Verification

Verified after deployment:

- Server state: `Ready`
- Server version: `16`
- SKU: `Standard_B1ms`, `Burstable`
- Storage: `32 GB`
- Backup retention: `7 days`
- Public network access: `Disabled`
- Databases present: `abarva_control`, `abarva_context`, `abarva_audit`
- VNet peerings: `Connected` both directions
- Private DNS links: database VNet and existing private data-plane VNet
- Key Vault secrets: four `postgres-context-*` secrets enabled
- Diagnostics: `allLogs`, `audit`, `AllMetrics`

## Design Implication

Postgres is now the natural Azure system-of-record candidate for:

- tenants and users
- organization structure
- IT systems and vendors
- financial/KPI metadata
- programs, moves, source events, tower portfolio data
- evidence manifests
- audit/event history

It should not become the primary vector retrieval plane. Azure AI Search should own high-scale retrieval over context chunks, evidence, source artifacts, industry corpus, and real-time signals, with Postgres retaining metadata, contracts, lineage, and audit.

## Next Architecture Decisions

1. Decide migration posture from current Supabase/Postgres:
   - one-way export/import for lab
   - logical replication for longer-running dual-run
   - app dual-write only if absolutely required
2. Define schema ownership:
   - `abarva_control`
   - `abarva_context`
   - `abarva_audit`
3. Add Azure Container Registry and real AbarVa app image.
4. Add app-to-Postgres secret consumption through managed identity and Key Vault.
5. Add Azure AI Search index contracts for context retrieval.
6. Add Azure OpenAI/Foundry model lane and routing controls.
