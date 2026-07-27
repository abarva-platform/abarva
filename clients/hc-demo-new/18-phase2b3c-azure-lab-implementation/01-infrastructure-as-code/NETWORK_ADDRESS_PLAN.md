# Network Address Plan

The read-only Azure scan found existing visible VNet ranges:

| VNet | Resource group | Prefixes |
| --- | --- | --- |
| `vnet-abarva-lakeshore-pilot-data-eastus` | `rg-abarva-lakeshore-pilot-data-eastus` | 10.72.0.0/16 |
| `vnet-abarva-private-dataplane-lab-eastus` | `rg-abarva-private-dataplane-lab-eastus` | 10.42.0.0/16 |
| `vnet-abarva-database-lab-eastus2` | `rg-abarva-database-lab-eastus2` | 10.43.0.0/16 |
| `vnet-abarva-lakeshore-pilot-db-eastus2` | `rg-abarva-lakeshore-pilot-db-eastus2` | 10.73.0.0/16 |

Approved HC Demo New names:

- VNet: `vnet-abarva-hcdn-lab-eus-001`
- Container Apps subnet: `snet-aca-hcdn-lab-eus-001` sized `/23`
- PostgreSQL subnet: `snet-pg-hcdn-lab-eus-001` sized `/27`
- Private endpoint subnet: `snet-pe-hcdn-lab-eus-001` sized `/27`

Proposed non-overlapping ranges:

| Network | CIDR | Delegation |
| --- | --- | --- |
| VNet | `10.74.0.0/22` | none |
| Container Apps subnet | `10.74.0.0/23` | `Microsoft.App/environments` |
| PostgreSQL subnet | `10.74.2.0/27` | `Microsoft.DBforPostgreSQL/flexibleServers` |
| Private endpoint subnet | `10.74.2.32/27` | none |

Collision result: no overlap with visible subscription VNets (`10.42.0.0/16`, `10.43.0.0/16`, `10.72.0.0/16`, `10.73.0.0/16`).

Apply remains blocked until this plan is independently reviewed and the same collision scan is re-run immediately before apply.
