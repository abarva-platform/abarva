# AZLAB24 — Azure AI Search Index Contracts

Status: passed
Date: 2026-05-15
Data posture: empty indexes only; no client data loaded

## Purpose

AZLAB13 deployed the Azure AI Search service and intentionally deferred indexes until the ingestion and embedding contracts settled.

AZLAB24 creates the first retrieval-plane index contracts so the lab has concrete landing zones for tenant context, evidence, Source/vendor artifacts, industry corpus, and real-time signals.

## Live Indexes

| Index | Grain | Scope guard | Vector dimensions | Purpose |
|---|---|---|---:|---|
| `tenant-context-v1` | Tenant context chunk | `tenant_key` | 1536 | Grounds Sentinel, Nexus, Source, Atlas, and Steward in tenant facts. |
| `evidence-ledger-v1` | Evidence item | `tenant_key` | 1536 | Lets agents cite, challenge, and trace claims. |
| `source-vendor-v1` | Vendor/contract artifact | `tenant_key` | 1536 | Supports Source decisions, contract renewal posture, and vendor risk reasoning. |
| `industry-corpus-v1` | Industry knowledge chunk | `industry` | 1536 | Adds specialized industry expertise without inventing tenant facts. |
| `signals-v1` | Time-bounded signal | `industry` | 1536 | Holds current vendor, regulatory, market, and competitive signals. |

All indexes use the `text-embedding-3-small` compatible 1536-dimension vector contract. At AZLAB24 completion they were empty; AZLAB25 subsequently loaded `tenant-context-v1` with synthetic context chunks.

## Repo Artifacts

| Artifact | Purpose |
|---|---|
| `src/lib/azure-search/index-contracts.ts` | Source-of-truth index definitions. |
| `src/lib/azure-search/__tests__/index-contracts.test.ts` | Guards approved index names, tenant/industry scope fields, and vector dimensions. |
| `src/scripts/azure-ai-search-indexes.ts` | `plan`, `apply`, and `verify` runner for lab index deployment. |

## Execution Evidence

Command shape:

```bash
AZURE_SEARCH_SERVICE_NAME=srch-abarva-context-lab-eastus \
  npx tsx src/scripts/azure-ai-search-indexes.ts plan

AZURE_SEARCH_SERVICE_NAME=srch-abarva-context-lab-eastus \
AZURE_SEARCH_ADMIN_KEY=<from az search admin-key show> \
  npx tsx src/scripts/azure-ai-search-indexes.ts apply
```

Apply evidence:

```json
{"event":"azure_search_index_applied","index":"tenant-context-v1"}
{"event":"azure_search_index_applied","index":"evidence-ledger-v1"}
{"event":"azure_search_index_applied","index":"source-vendor-v1"}
{"event":"azure_search_index_applied","index":"industry-corpus-v1"}
{"event":"azure_search_index_applied","index":"signals-v1"}
{"event":"azure_search_indexes_verified","indexes":["tenant-context-v1","evidence-ledger-v1","source-vendor-v1","industry-corpus-v1","signals-v1"]}
```

## Security Finding

The first `apply` attempt using Azure AD data-plane auth returned `403`. The lab bootstrap then used the Search admin key retrieved from Azure CLI without printing the key.

That is acceptable for lab setup, but not the target posture. Before customer-private lanes, assign the runtime managed identity the least-privilege Azure AI Search data-plane role needed for index writes and document reads, then disable or tightly control key-based operations.

## What This Proves

- Azure AI Search is no longer just a provisioned empty service; it has versioned retrieval contracts.
- The five planned retrieval lanes have concrete, versioned contracts.
- Each tenant-bearing index has a `tenant_key` filterable field.
- Industry/signal indexes are separated from tenant facts by `industry` scope.
- The vector contract is aligned to the current tenant embedding model dimension.

## What Remains

- Backfill the remaining evidence, Source/vendor, industry corpus, and signal indexes.
- Wire the ingestion worker's broker/index path beyond `audit_only`.
- Add Azure AI Search query adapter behind the AgentContextBroker.
- Add retrieval quality tests against the Sentinel/Nexus/Source/Atlas question batteries.
- Assign Azure AD Search data-plane RBAC so the lab no longer depends on admin-key bootstrap for index writes.
