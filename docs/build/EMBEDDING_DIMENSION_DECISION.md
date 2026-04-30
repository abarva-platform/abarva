# Embedding Dimension Decision Record

**Status:** LOCKED  
**Locked by:** CB-2 (PR #1260), INT-WV-2 (PR #1287), founder confirmed 2026-04-30  
**Last updated:** 2026-04-30

---

## Decision

Two separate embedding models are in use. This is intentional and final.

| Corpus | Model | Dimensions | Pinecone index |
|--------|-------|------------|----------------|
| Tenant operational data | `text-embedding-3-small` | 1536 | `abarva-tenant-context-prod` |
| Worldview (AbarVa corpus) | `text-embedding-3-large` | 3072 | `abarva-worldview-prod` |

---

## Storage

- **Canonical retrieval path:** Pinecone (both indexes).
- **Backup / audit trail:** JSONB column `enterprise_context_chunks.embedding` in Postgres. This is a write-through backup, not the query path.
- **pgvector:** Not enabled. There is no pgvector dependency. JSONB + Pinecone is the durable architecture.

---

## Rationale

**Why `text-embedding-3-large` (3072) for worldview?**  
Worldview content is authoritative AbarVa intellectual capital — long-form strategy documents, research papers, and curated playbooks. This content benefits meaningfully from the highest-quality embedding model. Semantic precision matters for complex cross-document retrieval.

**Why `text-embedding-3-small` (1536) for tenant data?**  
Tenant operational data (CRM records, meeting notes, program context) is shorter, factual, and more keyword-dense. Retrieval quality difference between 1536 and 3072 is marginal for this content type. The cost and latency savings at tenant scale are material.

**Why not a single model?**  
The two corpora serve different retrieval patterns and live in separate Pinecone indexes already. Normalizing to one model would require re-embedding one corpus and yield no architectural benefit.

---

## Implementation anchors

- `CB-2` (PR #1260): tenant 1536 path — broker bundle, context chunk ingestion, Pinecone upsert at 1536d.
- `INT-WV-2` (PR #1287): worldview 3072 path — corpus ingestion pipeline, Pinecone upsert at 3072d.
- Migration `20260430130000_enterprise_context_chunks_embedding.sql`: adds JSONB `embedding` column to `enterprise_context_chunks`.

---

## Constraints

- Do not add pgvector. The JSONB column is backup only.
- Do not change index dimensions without re-embedding the full corpus and updating both the ingestion pipeline and the broker retrieval call.
- Any new corpus type must explicitly choose one of these two models and document the rationale here before the first embed run.
