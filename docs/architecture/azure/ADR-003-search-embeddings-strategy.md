# ADR-003: Search and Embeddings Strategy — Azure AI Search

Slice ID: AZLAB6 (partial)
Document: ADR-003-search-embeddings-strategy.md
Status: accepted
Authored: 2026-04-26
Author: Code (sole)
Type: Architecture Decision Record — docs only, no runtime code, no migrations, no model calls.

---

## Status

Accepted — 2026-04-26

## Context

AbarVa's Intelligence layer needs vector search for:
- Semantic retrieval of evidence documents
- Pattern matching across vendor responses
- Similarity search for programme recommendations
- Context-bundle assembly from tenant data

The candidate options were:

1. **pgvector** — Postgres extension; simple, zero additional service, already in the data plane
2. **Azure AI Search** — managed search service; hybrid search (keyword + vector), semantic ranking, private endpoint support

## Decision

Use **Azure AI Search** for embeddings and vector retrieval.

Index namespace: per-tenant logical namespace within a shared index (Standard S1 SKU for lab).

## Rationale

| Factor | pgvector | Azure AI Search (chosen) |
|---|---|---|
| Hybrid search (keyword + vector) | Requires custom query | Native hybrid search |
| Semantic ranking | Not available | Enabled (L2 re-ranker) |
| Private endpoint | Via Postgres private endpoint | Native private endpoint |
| Operational complexity | Low — same Postgres | Medium — additional service |
| Scale (production) | Requires Postgres scale-up | Independent scaling |
| Enterprise compliance | Postgres compliance | Azure compliance certs |
| Cost (lab) | Included in Postgres cost | ~$75/month Standard S1 |
| Multi-tenant isolation | RLS + schema | Per-tenant namespace filter |
| Integration with Azure OpenAI | Manual | Native (Azure AI integration) |

pgvector remains an option for simple single-tenant or low-traffic deployments, but for the AbarVa lab and production path, Azure AI Search provides better capabilities at acceptable cost.

## Consequences

- Azure AI Search resource: `srch-abarva-lab-eastus2` in `rg-abarva-lab-control`
- SKU: Standard S1 (lab); Standard S2 (production)
- Tenant isolation: logical namespace field `tenantKey` on every document; queries include `$filter=tenantKey eq '<slug>'`
- Private endpoint: enabled in production; not required for lab (lab uses service endpoint)
- Index schema (base): `{ id, tenantKey, documentType, content, embedding: Collection(Edm.Single), sourceReference, trustLevel, createdAt }`
- Embedding model: `text-embedding-3-small` via Azure OpenAI (1536 dimensions)
- Semantic configuration: enabled with default ranker
- Cost estimate: ~$75/month for S1 + ~$5/month embedding API calls = ~$80/month (within $200 ceiling)

## Deferred

- Customer-managed encryption keys for search index — deferred to production
- Cross-region replication of search index — deferred to production
- Custom embedding models — deferred

## Notes

The existing `DATA6` vector namespace contract in `docs/architecture/` uses a logical namespace model that is compatible with Azure AI Search per-tenant filtering.
