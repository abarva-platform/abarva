# Azure Cutover Closeout Evidence Pack

Date: 2026-05-22
Status: cutover-ready lab lane; security audit clean
Data posture: synthetic/no-client-data only
Runtime data plane: Azure Postgres

## Executive Summary

The Azure lab lane is deployed, private-network hardened, and runtime-verified.
The last open security gap was Service Bus. That gap is closed: the active app
and ingestion jobs now use a Premium Service Bus namespace with private endpoint
connectivity, queue-scoped managed-identity RBAC, public network access disabled,
and local auth disabled. The final security audit reports `103 pass`, `0
attention`, and `0 fail`.

This is a cutover-ready lab lane. It is suitable as the reference architecture
for a pilot private-data lane, subject to customer-specific subscription,
networking, identity, data-load, and rollback signoff.

## Current Runtime

| Item | Value |
|---|---|
| Azure subscription | `701a8554-a166-46e9-bf13-743bc50e3b20` |
| Control-plane resource group | `rg-abarva-controlplane-lab-eastus` |
| Private data-plane resource group | `rg-abarva-private-dataplane-lab-eastus` |
| Web app | `ca-abarva-web-lab-eastus` |
| Active revision | `ca-abarva-web-lab-eastus--0000045` |
| Runtime FQDN | `ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io` |
| Image | `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260522-88ecab1b1-git1` |
| App scale | min `1`, max `2` |
| Traffic | 100% latest revision |

## Final Security Audit

Command:

```bash
npm run azure:security:audit
```

Result:

```text
producedAt: 2026-05-22T09:57:57.496Z
status: pass
pass: 103
attention: 0
fail: 0
total: 103
```

Security posture closed:

| Control | Final state |
|---|---|
| Postgres public access | Disabled |
| Storage public access | Disabled; default deny |
| Key Vault public access | Disabled; default deny |
| Key Vault authorization | RBAC enabled |
| Azure AI Search public access | Disabled |
| Azure AI Search local auth | Disabled |
| Cosmos public access | Disabled |
| Cosmos local auth | Disabled |
| Service Bus public access | Disabled |
| Service Bus local auth | Disabled |
| Runtime secret projection | Container Apps secret references |
| Storage RBAC | Container-scoped |
| Service Bus RBAC | Queue-scoped |
| Search RBAC | Managed identity, Search Index Data Reader/Contributor |

## Service Bus Premium Cutover

The previous namespace `sb-abarva-lab-eastus` was Standard SKU. Azure Service
Bus private endpoints require Premium SKU, so the fix was a side-by-side
migration.

### New Premium Namespace

| Item | Value |
|---|---|
| Namespace | `sb-abarva-lab-eastus-prem` |
| SKU | Premium |
| Capacity | `1` |
| Public network access | Disabled |
| Local auth | Disabled |
| Private endpoint | `pe-sb-abarva-lab-eastus-prem` |
| Private endpoint IP | `10.42.2.9` |
| Private DNS zone | `privatelink.servicebus.windows.net` |
| DNS record | `sb-abarva-lab-eastus-prem.privatelink.servicebus.windows.net` |

### Queues

| Queue | Purpose | TTL | Dead-letter on expiry |
|---|---|---:|---|
| `q-context-ingestion-events` | Event Grid context-ingestion events | `P14D` | true |
| `q-connectivity-smoke` | Connectivity smoke send/receive proof | `P1D` | false |
| `q-agent-work-items` | Agent work-item fabric | `P14D` | true |

### Runtime References

The active app and jobs point to:

```text
SERVICE_BUS_NAMESPACE=sb-abarva-lab-eastus-prem
SERVICE_BUS_QUEUE_NAME=q-context-ingestion-events
AZURE_CONNECTIVITY_SERVICE_BUS_QUEUE_NAME=q-connectivity-smoke
```

Updated resources:

- `ca-abarva-web-lab-eastus`
- `job-a2b-ingest-lab-eus`
- `job-a2b-smoke-send-eus`
- `job-a2b-smoke-verify-eus`
- `job-azure-connectivity-smoke-eus`

Event Grid subscription `egsub-context-drop-created` now targets:

```text
/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.ServiceBus/namespaces/sb-abarva-lab-eastus-prem/queues/q-context-ingestion-events
```

### Old Standard Namespace

The old namespace `sb-abarva-lab-eastus` is no longer active for runtime or
Event Grid traffic. It is locked down with public network access disabled and
local auth disabled. It had 12 stale active messages in
`q-context-ingestion-events` before lock-down; those are pre-cutover leftovers.

Do not delete the old namespace until the observation window has passed and no
rollback is required.

## Runtime Verification

### Premium Service Bus Connectivity

Execution:

```text
job-azure-connectivity-smoke-eus-lfsku0b
```

Result:

```text
Succeeded
start: 2026-05-22T09:50:33Z
end:   2026-05-22T09:51:09Z
```

### End-to-End Ingestion

Run id:

```text
premium-sb-cutover-20260522094455
```

Executions:

| Step | Execution | Result |
|---|---|---|
| Produce blob/Event Grid event | `job-a2b-smoke-send-eus-tdenqoy` | Succeeded |
| Ingest from Service Bus | `job-a2b-ingest-lab-eus-8sei6hl` | Succeeded |
| Verify persisted result | `job-a2b-smoke-verify-eus-czr1zzg` | Succeeded |

Premium queue hygiene after the run:

| Queue | Active | Dead-letter | Scheduled |
|---|---:|---:|---:|
| `q-context-ingestion-events` | 0 | 0 | 0 |
| `q-connectivity-smoke` | 0 | 0 | 0 |
| `q-agent-work-items` | 0 | 0 | 0 |

### Authenticated Health

Endpoint:

```text
https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io/api/health/azure-connectivity
```

Result:

```text
HTTP 200
event: azure_connectivity_smoke
status: pass
runId: azconn-20260522095926
```

Checks:

| Check | Result | Detail |
|---|---|---|
| Postgres | pass | `SELECT 1 succeeded` |
| Blob | pass | put/get/delete succeeded in `context-drops` |
| Service Bus | pass | send/receive succeeded on `q-connectivity-smoke` |
| Key Vault | pass | secret read succeeded |
| Azure AI Search | pass | count query succeeded on `tenant-context-v1`; count `6567` |

## Cutover Readiness

| Area | Status | Notes |
|---|---|---|
| App deployment | Pass | Latest ready revision serving 100% traffic. |
| Data plane | Pass | Azure Postgres path active. |
| Ingestion backbone | Pass | Event Grid to Premium Service Bus to worker to DB verified. |
| Private network posture | Pass | Postgres, Storage, Key Vault, Search, Cosmos, and Service Bus private/locked. |
| Managed identity posture | Pass | Runtime uses RBAC paths for Storage, Service Bus, Key Vault, Search, and Cosmos posture is locked because unused by active runtime. |
| Security audit | Pass | `103/103` pass. |
| Rollback | Available | Old Standard namespace exists but is locked and not active. |

## Remaining Operational Follow-Ups

These are not cutover blockers for the lab lane:

1. Observe the Premium namespace for 24-48 hours before deleting the old Standard
   namespace.
2. Export final Azure resource state into IaC so the live lab and declarative
   templates cannot drift.
3. Add a scheduled security audit job that records the `103/0/0` gate as a
   recurring control.
4. Repeat the authenticated product-surface smoke after any future app-image
   deploy.
