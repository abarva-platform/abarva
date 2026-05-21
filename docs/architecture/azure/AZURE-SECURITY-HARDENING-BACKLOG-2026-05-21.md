# Azure Security Hardening Backlog

Date: 2026-05-21
Status: 85 pass, 9 attention, 0 fail
Scope: Azure lab private-data-lane hardening before customer pilot

## Executive Read

The Azure lab security audit has no failures. The remaining nine findings are
pilot-hardening items, not current lab breakages. They should not be closed by
blindly disabling public/local auth: Service Bus and Azure AI Search still need
private endpoints and code/runtime proof before public access and keys can be
removed safely.

The right sequence is:

1. add missing private endpoints / private DNS;
2. prove managed-identity/RBAC runtime paths;
3. narrow role scopes;
4. disable local auth/public access;
5. rerun strict security audit and connectivity smoke.

## Current Attention Items

| # | Audit check | Current state | Why it matters | Safe close path | Risk if done blindly |
|---:|---|---|---|---|---|
| 1 | `network.service_bus.public_access` | Service Bus public network access enabled | Customer private-data-lane should avoid public broker reachability | Add Service Bus private endpoint + DNS, prove Container Apps can send/receive, then disable public access | Ingestion/connectivity queues can stop receiving messages. |
| 2 | `identity.service_bus.local_auth` | Service Bus local auth enabled | SAS/key auth should not remain available for customer lane | Prove all Service Bus paths use managed identity, then set `disableLocalAuth=true` | Any hidden connection-string path breaks. |
| 3 | `network.key_vault.public_access` | Key Vault public network reachable for lab manageability | Secrets should be reachable only through private/operator paths | Confirm private operator path, then set network default deny/public disabled | Local ops and emergency secret update can be locked out. |
| 4 | `network.ai_search.public_access` | Azure AI Search public network access enabled | Retrieval index should be private for customer data | Add Search private endpoint + DNS, prove app/search-backfill route works privately, then disable public access | Agent retrieval and backfill can fail. |
| 5 | `identity.ai_search.local_auth` | Azure AI Search is API-key/local-auth enabled | API keys are broad and harder to scope than RBAC | Prove `DefaultAzureCredential` search path in app/backfill/smoke, remove `AZURE_SEARCH_ADMIN_KEY`, then disable local auth | Retriever falls back to no search or errors. |
| 6 | `identity.cosmos.local_auth` | Cosmos local auth enabled | Graph provider should use managed identity/RBAC where supported | Build and prove graph-provider managed-identity path, then disable local auth | Future Gremlin/key-based paths can fail. |
| 7 | `rbac.storage_scope` | Storage Blob Data Contributor assigned at storage-account scope | Account scope is broader than the container-level upload/read need | Assign role at required container scopes, prove Blob smoke, remove account-scope assignment | Context ingestion may lose read/write/delete on needed containers. |
| 8 | `rbac.service_bus_scope` sender | Service Bus sender assigned at namespace scope | Namespace scope is broader than queue-level need | Assign sender at each required queue scope, prove send paths, remove namespace-scope sender | Producer/Event Grid paths can fail. |
| 9 | `rbac.service_bus_scope` receiver | Service Bus receiver assigned at namespace scope | Namespace scope is broader than queue-level need | Assign receiver at each required queue scope, prove receive paths, remove namespace-scope receiver | Worker/connectivity receive paths can fail. |

## Recommended Execution Slices

### Slice S1 — Service Bus Private/RBAC Hardening

Owned resources:

- `sb-abarva-lab-eastus`
- queues: `q-context-ingestion-events`, `q-agent-work-items`,
  `q-connectivity-smoke`
- managed identity: `id-abarva-scale-runtime-lab-eastus`

Steps:

1. Add Service Bus private endpoint and private DNS.
2. Assign queue-scoped sender/receiver roles to the managed identity.
3. Rerun connectivity smoke and ingestion smoke.
4. Remove namespace-scoped Service Bus data roles.
5. Disable Service Bus local auth.
6. Disable Service Bus public network access only after private path passes.

Definition of done:

- Service Bus attention items 1, 2, 8, and 9 close.
- Connectivity smoke still passes `service_bus`.
- Ingestion worker still receives from `q-context-ingestion-events`.

### Slice S2 — Azure AI Search Private/RBAC Hardening

Owned resources:

- `srch-abarva-context-lab-eastus`
- Search indexes: `tenant-context-v1`, `evidence-ledger-v1`,
  `source-vendor-v1`, `industry-corpus-v1`, `signals-v1`
- app/backfill paths using `src/lib/azure-search/tenant-context-retriever.ts`
  and `src/scripts/azure-ai-search-backfill.ts`

Steps:

1. Add Azure AI Search private endpoint and private DNS.
2. Prove `DefaultAzureCredential` search path without
   `AZURE_SEARCH_ADMIN_KEY`.
3. Remove Search admin-key secret projection from runtime/backfill jobs.
4. Disable Search local auth/API-key-only mode.
5. Disable Search public network access after private path passes.

Definition of done:

- Search attention items 4 and 5 close.
- Connectivity smoke still passes `ai_search`.
- Authenticated agent retrieval still returns tenant-grounded context.

### Slice S3 — Key Vault Private Operator Path

Owned resources:

- `kv-abarva-lab-001`
- private endpoint `pe-kv-shared`
- private DNS zone `privatelink.vaultcore.azure.net`

Steps:

1. Confirm Container Apps and connectivity jobs can read required secrets over
   the private path.
2. Establish an operator path for emergency secret management.
3. Set Key Vault network ACL default action to deny and public access disabled.
4. Rerun connectivity smoke and app health.

Definition of done:

- Key Vault public-access attention item closes.
- Secret reads still pass from Azure runtime.
- Operators have a documented private management path.

### Slice S4 — Storage Container Scope Narrowing

Owned resources:

- storage account `stabarvaprivatedplab001`
- containers: `context-drops`, `context-processed`

Steps:

1. Assign `Storage Blob Data Contributor` at required container scopes.
2. Rerun Blob connectivity smoke and ingestion smoke.
3. Remove storage-account-scoped assignment.

Definition of done:

- Storage RBAC-scope attention item closes.
- Blob put/get/delete still passes in connectivity smoke.
- Ingestion worker can still read/drop/process context files.

### Slice S5 — Cosmos Local-Auth Retirement

Owned resources:

- `cos-abarva-graph-lab-001`
- graph provider code path

Steps:

1. Confirm which code path uses Cosmos Gremlin today.
2. Add or prove managed-identity/RBAC graph-provider access.
3. Disable local auth only after the graph path is proven.

Definition of done:

- Cosmos local-auth attention item closes.
- Graph smoke passes without key-based auth.

## Current Non-Decision

Do not disable public access or local auth directly from the current lab state.
The audit warnings are real, but several are intentionally sequenced behind
private endpoints and managed-identity proof. Treat direct disablement as a
breaking change unless the corresponding slice above has passed.

## Final Strict Gate

After all slices:

```bash
npm run azure:security:audit -- --strict
npm run azure:connectivity:smoke
```

For the deployed app:

```bash
curl -fsS https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io/api/health
```

Expected:

- security audit: pass;
- connectivity smoke: pass for Postgres, Blob, Service Bus, Key Vault, Search;
- app health: `postgres=true`, `direct_postgres=true`.
