# AZLAB27 - Azure Security Audit

Date: 2026-05-15  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Posture: synthetic/no-client-data lab; no PHI, PII, or real customer data

## Executive Read

AZLAB27 adds the L3 security audit gate for the Azure lab. The audit does not mutate Azure resources. It checks whether the private data lane is private, whether managed identity role assignments are scoped tightly enough, and whether Container Apps jobs/apps are projecting secrets through secret references rather than literal environment values.

The 2026-05-15 live run passed with attention:

| Result | Count |
|---|---:|
| Pass | 67 |
| Attention | 9 |
| Fail | 0 |
| Total checks | 76 |

This is the right state for a lab before pilot hardening. The critical data-plane resources that must be private today are private. The remaining attention items are explicit pre-pilot hardening work: close public network reachability on Service Bus, Azure AI Search, and Key Vault once the private operator path exists; disable local auth where Azure RBAC can carry the flow; and tighten managed identity scopes from account/namespace to container/queue.

## Artifact

The audit is runnable from the repo:

```bash
npm run azure:security:audit
```

Strict mode can be used later to fail on attention items:

```bash
node scripts/azure/audit-lab-security.mjs --strict
```

Default mode exits non-zero only on fail findings. That lets the lab expose known hardening gaps without blocking all development. Strict mode is the pilot gate posture.

## What The Audit Checks

| Area | Checks |
|---|---|
| Network exposure | Postgres, Storage, Service Bus, Key Vault, Azure AI Search, and Cosmos DB public network posture. |
| Local auth posture | Service Bus, Azure AI Search, and Cosmos DB local/API-key auth posture. |
| Managed identity RBAC | Broad roles, subscription/resource-group scope, Storage Blob Data Contributor scope, Service Bus data role scope. |
| Secret projection | Container Apps app/job env vars: sensitive-looking values must be `secretRef`; only explicit public config can be literal. |

## Live Findings

### Pass

| Check | Evidence |
|---|---|
| Postgres public access | `Disabled` on `pg-abarva-context-lab-001`. |
| Storage private posture | `publicNetworkAccess=Disabled`, `defaultAction=Deny`, `allowBlobPublicAccess=false` on `stabarvaprivatedplab001`. |
| Cosmos graph public access | `Disabled` on `cos-abarva-graph-lab-001`. |
| Key Vault authorization | RBAC authorization enabled on `kv-abarva-lab-001`. |
| ACR pull | Managed identity has `AcrPull` on `acrabarvalab001`. |
| App secrets | Clerk, Supabase service role, database URL, model keys, Pinecone key, Neo4j compatibility settings, and demo password are projected as Container Apps secret references. |

### Attention Items

| Item | Why it is acceptable for lab | Close path before pilot |
|---|---|---|
| Service Bus public network access enabled | The A2b ingestion lane is still being exercised from lab jobs and operator tooling. | Add private endpoint/private DNS and restrict network access. |
| Service Bus local auth enabled | The current lab still supports connection-string operations for smoke/testing. | Move to managed identity-only once all send/receive paths use RBAC. |
| Key Vault public network reachable | Keeps founder/operator management simple while private operator path is not yet established. | Restrict to private endpoint or trusted operator access path. |
| Azure AI Search public network access enabled | Search broker adapter and private endpoint lane are still pending. | Add private endpoint and restrict public access before customer private data lane. |
| Azure AI Search API-key/local auth enabled | Admin-key flow is still used by backfill and smoke jobs. | Move backfill/query to managed identity/RBAC and disable local auth where supported. |
| Cosmos local auth enabled | Cosmos is projected graph infrastructure; app adapter is not yet using managed identity. | Move graph provider adapter to RBAC/managed identity and disable local auth. |
| Storage Blob Data Contributor at account scope | Good enough for lab smoke and A2b while containers are still evolving. | Scope role to the exact upload/processed containers. |
| Service Bus sender at namespace scope | Good enough while queues are evolving. | Scope to the ingestion queue. |
| Service Bus receiver at namespace scope | Good enough while queues are evolving. | Scope to the ingestion queue. |

## Enterprise Interpretation

This audit gives AbarVa a concrete L3 story for infosec:

- We can prove the private data lane is not just a diagram.
- We can prove sensitive runtime values are not sitting as plaintext app env vars.
- We can prove managed identity is the direction of travel and identify exactly where scope needs tightening.
- We can run the same audit repeatedly as the lab grows, and later flip `--strict` to turn attention items into release blockers.

## Next Gates

| Gate | Next artifact |
|---|---|
| L3 strict pilot hardening | Private endpoint + RBAC-only follow-up for Service Bus, Search, Cosmos, and Key Vault operator access. |
| L4 tenant isolation | Run SEC-P0 cross-tenant probes against the Azure Container Apps FQDN. |
| L5 data integrity | Reset-and-replay migration/seed test and PITR restore drill. |
| L6 functional E2E | Authenticated Azure smoke across Home, Intelligence, Moves, Source, Tower, and Learn. |

