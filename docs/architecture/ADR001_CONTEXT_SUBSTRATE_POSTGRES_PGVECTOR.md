# ADR-001 — Postgres-First Context Substrate with pgvector

**Status:** Accepted  
**Date:** 2026-06-20  
**Decider:** Anand Sundaram (founder)

---

## Context

AbarVa's intelligence surfaces (Home, Intelligence/Lens, Tower/Atlas) all depend on the same underlying data substrate: structured facts, vector chunks, graph edges, and evidence citations loaded per enterprise client. Over time, three separate retrieval technologies accumulated in the codebase:

| Technology          | Current code state                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pinecone**        | Legacy. `getPineconeClient()` returns `DisabledVectorClient` — a no-op stub. Pinecone API keys and scripts still exist but the broker path is fully disabled. (`pinecone-client.ts:148`)                                                                                                                                                                               |
| **Azure AI Search** | Feature-flagged off everywhere. `retrieval_azure_search` flag exists in registry with `includeTenants: []` — routes broker through `Azure AI Search (tenant-context-v1)` but has never been enabled for any tenant. (`registry.ts:157`)                                                                                                                                |
| **pgvector**        | Not enabled. Migration `20260430130000_enterprise_context_chunks_embedding.sql` explicitly notes: _"pgvector is NOT enabled in this Supabase project."_ Embeddings write to a JSONB audit column, not a vector type. The canonical CB-3 retrieval path in the broker references Pinecone, which is now disabled — leaving semantic search effectively non-operational. |
| **Neo4j**           | Feature-flagged off. `graph_neo4j_enabled` defaults false. `enterprise_graph_nodes` / `enterprise_graph_edges` Postgres tables are the system of record for the relationship graph. (`neo4j-gate.ts:1`)                                                                                                                                                                |

Current retrieval in the broker is therefore: **Postgres full-text search only** (GIN index on `chunk_text`). Semantic/vector search is dormant.

---

## Decision

**Client-private context substrate:** Azure PostgreSQL Flexible Server with pgvector enabled.

**Graph:** Postgres `enterprise_graph_nodes` / `enterprise_graph_edges` tables. No dedicated graph service.

**Shared industry corpus:** Azure AI Search is acceptable only for the worldview/industry corpus (analyst reports, benchmarks, frameworks) if/when that corpus becomes large and document-heavy enough to justify hybrid search. It must not be used as the default tenant-private facts retrieval layer.

**Pinecone:** Deprecated. Remove dependency after pgvector is proven at parity.

**Neo4j / Cosmos Gremlin / Neptune:** Do not add. Revisit only if a single client's graph exceeds ~100K nodes with 5+ hop traversal requirements — well beyond current scale (~1,050 edges/client).

---

## Migration Plan

The following steps must be completed in order. No step is "done" until it has a retrieval proof (signed-in answer citing the new path).

### Step 1 — Enable pgvector extension

Enable the `vector` extension on the Azure PostgreSQL Flexible Server instance.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Allowlist the extension in the Azure portal if not already present (Azure Database for PostgreSQL Flexible Server supports pgvector GA — no additional tier required).

### Step 2 — Schema migration

Add a native vector column alongside the existing JSONB audit column. Keep JSONB for rollback window.

```sql
ALTER TABLE enterprise_context_chunks
  ADD COLUMN embedding_vector vector(1536);

CREATE INDEX ON enterprise_context_chunks
  USING hnsw (embedding_vector vector_cosine_ops)
  WHERE embedding_vector IS NOT NULL;
```

### Step 3 — Embedding script update

Update `src/scripts/embed-pending-chunks.ts` so the `--postgres-only` path writes to `embedding_vector` (the new `vector(1536)` column), not just JSONB. JSONB audit column can remain for ops spot-checks.

Embedding status values (source of truth: migration CHECK constraint): `pending | skipped | embedded | failed`

### Step 4 — Retriever update

Update the broker's CB-3 retrieval path to query pgvector first:

```sql
SELECT chunk_id, chunk_text, 1 - (embedding_vector <=> $1) AS similarity
FROM enterprise_context_chunks
WHERE tenant_key = $2
  AND embedding_vector IS NOT NULL
ORDER BY embedding_vector <=> $1
LIMIT 10;
```

Keyword/structured full-text fallback remains as CB-2. Azure AI Search lane (`retrieval_azure_search` flag) stays off for all tenants.

### Step 5 — Parity gate

Before removing JSONB or any Pinecone scripts: compare pgvector results vs old path on the golden question set for each canonical tenant. Both paths must return citations that satisfy the evidence gate (`evidence_usable = true`).

### Step 6 — Surface wiring (kill browser intelligence)

Home and Tower ask bars must go server-side through the same governed context bundle (`/api/intelligence/ask` or a Tower-scoped variant). Browser-side pattern matching in Tower (`public/tower-v2/app.js`) stays for the visualization UI but must not be the AI reasoning path.

### Step 7 — Repo gate

CI must fail if any canonical tenant has:

- Files in `datasets/` but zero rows in `enterprise_context_records`
- `embedding_status = 'embedded'` rows but no `embedding_vector` populated
- No passing golden question against signed-in retrieval

---

## Consequences

**Positive:**

- One database, one billing surface, one private VNet perimeter — eliminates Pinecone external dependency and Azure AI Search for client data
- pgvector HNSW index on Flexible Server handles the retrieval load at current scale (< 50K chunks/tenant)
- Graph stays co-located with facts — no cross-service join overhead
- Azure AI Search remains available as a well-defined upgrade path for the shared worldview corpus

**Negative:**

- pgvector extension must be enabled and allowlisted — a one-time Azure ops step requiring portal access
- Existing JSONB embeddings must be backfilled into the `vector(1536)` column before semantic search is live
- The `retrieval_azure_search` feature flag and Pinecone scripts stay in the codebase until parity is proven — some cleanup debt

**Not affected:**

- Enterprise*context*\* schema structure — no breaking changes to tables that callers rely on
- Sentinel reasoning contract — the context bundle API surface is unchanged
- RLS and tenant isolation — enforced at the Postgres row level, unaffected by index type

---

## What NOT to do before this migration is complete

- Do not flip `retrieval_azure_search` broadly — the feature exists but has never had a parity proof
- Do not claim vector/semantic search is live until pgvector extension + migration + retrieval proof pass Step 5
- Do not add a graph database
- Do not re-enable Pinecone as a retrieval path
