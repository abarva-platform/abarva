# Lakeshore — Live Azure Management-Plane Stats (2026-06-06)

Authenticated via service principal (`az login --service-principal`) and Azure REST.
All figures are **live management-plane** reads, captured during the load.

## Subscription

- **Name:** `abarva-lab-sub`
- **Subscription ID:** `701a8554-a166-46e9-bf13-743bc50e3b20`
- **Tenant ID:** `f5151b70-963c-4124-a888-20a50e8c2e2c`
- **Principal:** servicePrincipal `419ec65c-a393-4b33-a66e-51a1c49ea9d5` (objectId `6928d484-5a06-4a7e-8a20-e49fff66d59f`)

## Resource inventory (counts)

| Resource type               | Count |
| --------------------------- | ----- |
| Resource groups             | 14    |
| Storage accounts            | 2     |
| Postgres flexible servers   | 2     |
| Azure AI Search services    | 2     |
| Key Vaults                  | 2     |
| Container Apps environments | 2     |
| Container Apps jobs         | 16    |
| Container Apps (apps)       | 4     |
| Service Bus namespaces      | 3     |
| Container Registries (ACR)  | 1     |

## Key resources used by this load

| Role                       | Resource                                                                                    | Resource group                         |
| -------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------- |
| Compute (private worker)   | Container App `ca-abarva-scale-smoke-lab-eastus`                                            | rg-abarva-controlplane-lab-eastus      |
| Managed environment (VNet) | `cae-abarva-scale-lab-eastus` → `vnet-abarva-private-dataplane-lab-eastus/snet-app`         | rg-abarva-controlplane-lab-eastus      |
| Runtime identity           | UAMI `id-abarva-scale-runtime-lab-eastus` (clientId `3b6e0c9d-…`, principalId `42f131d5-…`) | rg-abarva-controlplane-lab-eastus      |
| Image                      | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1`                | rg-abarva-controlplane-lab-eastus      |
| Postgres                   | `pg-abarva-context-lab-001` → db `abarva_control`                                           | rg-abarva-database-lab-eastus2         |
| Blob                       | `stabarvaprivatedplab001` (container `context-drops`)                                       | rg-abarva-private-dataplane-lab-eastus |
| Search                     | `srch-abarva-context-lab-eastus` (index `tenant-context-v1`)                                | rg-abarva-controlplane-lab-eastus      |
| Key Vault                  | `kv-abarva-lab-001` (DB + OpenAI secrets)                                                   | rg-abarva-shared-security-lab-eastus   |

## Dedicated Lakeshore pilot plane (discovered, NOT used for this load)

A separate, more locked-down Lakeshore pilot plane exists and is **not** reachable for data-plane
writes from Cursor Cloud nor from the lab Container Apps environment in this run:

- Storage `stlakeshorepilotlsh001`, Postgres `pglakeshorepilotlsh001`, Search `srchlakeshorepilotlsh001`,
  Key Vault `kvlakeshorepilotlsh001`, env `cae-abarva-lakeshore-pilot-eastus`.
- The Lakeshore tenant context in this load lives in the **shared lab control plane** (`abarva_control`)
  scoped by `tenant_key='lakeshore-holdings'` — the same pattern used by the existing skyharbor/meridian tenants.

## Service-principal RBAC (verified, scoped)

| Role                             | Scope                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| Reader                           | subscription                                                                       |
| Container Apps Contributor       | rg-abarva-controlplane-lab-eastus (containerApps/_ only — **not** jobs/_)          |
| Storage Blob Data Contributor    | storage `stabarvaprivatedplab001` (container `context-drops` writable; others 403) |
| Search Index/Service Contributor | `srch-abarva-context-lab-eastus`                                                   |
| Key Vault Secrets User           | `kv-abarva-lab-001`                                                                |
| Service Bus Data Owner           | `sb-abarva-lab-eastus`, `…-prem`                                                   |
| Monitoring Reader                | rg-abarva-observability-lab-eastus                                                 |

## Data-plane reachability from Cursor Cloud (network tests)

| Target          | From Cursor Cloud VM                                               | From VNet Container App                        |
| --------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| Blob data plane | **403 / blocked** (firewall defaultAction=Deny + private endpoint) | **OK** (container `context-drops`)             |
| Postgres        | **DNS unresolvable / blocked** (private endpoint)                  | **OK** (`abarva_control`)                      |
| Azure AI Search | **403 / blocked**                                                  | **OK** (`tenant-context-v1`)                   |
| Key Vault       | **blocked**                                                        | **OK** (secrets resolved by platform via UAMI) |

**Conclusion:** the private data plane is intentionally unreachable from Cursor Cloud; all data-plane
work was executed from inside the VNet via the Container App private-worker path, exactly as the
task contemplated.
