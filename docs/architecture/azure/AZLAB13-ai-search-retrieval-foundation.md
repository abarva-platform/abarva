# AbarVa Azure Lab AI Search Retrieval Foundation

Status: deployed to `abarva-lab-sub` on 2026-05-14  
Subscription: `abarva-lab-sub` / `701a8554-a166-46e9-bf13-743bc50e3b20`  
Primary region: `eastus`  
Data posture: synthetic/no-client-data only

## Purpose

This stage adds the Azure-native retrieval service that can eventually replace or complement Pinecone for tenant-scoped retrieval.

Azure AI Search should own high-scale retrieval over:

- tenant context chunks
- evidence manifests
- source/vendor artifacts
- industry corpus slices
- real-time signal summaries

Postgres remains the metadata, contract, lineage, and audit system. Blob Storage remains the artifact/evidence store. Search is the retrieval plane.

## Live Resources

| Capability | Resource | Design |
|---|---|---|
| Retrieval service | `srch-abarva-context-lab-eastus` | Basic SKU, 1 replica, 1 partition, public access enabled for lab bootstrap. |
| Indexes | `tenant-context-v1`, `evidence-ledger-v1`, `source-vendor-v1`, `industry-corpus-v1`, `signals-v1` | Created by AZLAB24 with 1536-dimension vector fields and tenant/industry scope guards. |

## Why Indexes Are Contracted Before Created

The service can be deployed now, but the indexes should be created only after the ingestion worker and embedding provider are settled. Otherwise we risk locking the wrong vector dimensions, analyzers, or field contracts too early.

The right sequence is:

1. deploy Search service
2. define index contracts
3. define embedding provider/model and vector dimensions
4. build ingestion worker
5. create indexes through controlled deployment scripts
6. backfill synthetic/demo tenant context
7. measure retrieval quality against Sentinel/Nexus/Source/Atlas question batteries

## Index Contract Sketch

| Index | Primary grain | Required fields | Why it exists |
|---|---|---|---|
| `tenant-context-v1` | Chunk | `tenant_key`, `source_segment`, `record_id`, `chunk_id`, `title`, `body`, `source_uri`, `confidence`, `sensitivity`, `last_seen_at`, `embedding` | Grounds Sentinel/Atlas/Nexus/Source in tenant facts. |
| `evidence-ledger-v1` | Evidence item | `tenant_key`, `evidence_id`, `claim_id`, `source_type`, `source_uri`, `excerpt`, `owner`, `as_of_date`, `confidence`, `embedding` | Lets agents cite and challenge claims. |
| `source-vendor-v1` | Vendor/contract artifact | `tenant_key`, `vendor`, `contract_id`, `category`, `renewal_date`, `annual_spend`, `risk_flags`, `body`, `embedding` | Supports Source and vendor negotiation reasoning. |
| `industry-corpus-v1` | Industry knowledge chunk | `industry`, `domain`, `pattern_id`, `source`, `title`, `body`, `as_of_date`, `confidence`, `embedding` | Gives agents specialized external expertise without fabricating tenant facts. |
| `signals-v1` | Time-bounded signal | `industry`, `signal_id`, `source`, `signal_type`, `summary`, `observed_at`, `expires_at`, `embedding` | Supports current market/vendor/regulatory awareness. |

## Security Posture

| Control | Current lab state | Target private-client state |
|---|---|---|
| Public network access | Enabled for bootstrap and local validation. | Disabled with private endpoint. |
| Auth | Local auth initially available for lab bootstrap. | Managed identity / RBAC-first; key access tightly controlled. |
| Data | Synthetic/no-client-data only. | Client context only after classification, minimization, and tenant boundary controls. |
| Sensitive data | Not loaded. | Worker scans and quarantines PHI/PII/sensitive data before indexing. |

## Validation Plan

Verified after deployment:

- Deployment state: `Succeeded`
- Service status: `running`
- Service endpoint: `https://srch-abarva-context-lab-eastus.search.windows.net`
- SKU: `basic`
- Replica count: `1`
- Partition count: `1`
- Hosting mode: `default`
- Public network access: `Enabled`
- Indexes: created by AZLAB24 on 2026-05-15

## Update 2026-05-15

AZLAB24 created and verified the five planned indexes. The first Azure AD data-plane apply returned `403`, so the lab bootstrap used a Search admin key retrieved through Azure CLI. Before customer-private lanes, grant the runtime managed identity least-privilege Search data-plane RBAC and remove admin-key dependency from normal operations.

AZLAB25 then backfilled `tenant-context-v1` with 6,567 synthetic context chunks from Azure Postgres, normalized to canonical tenant keys: Apex Retail 2,075, First Capital 2,070, Meridian Health 2,422. The remaining indexes are still empty.
