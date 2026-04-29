# Graph + Vector Readiness

**Status:** Wave 5 persistence readiness decision record  
**Date:** 2026-04-29  
**Scope:** Enterprise Data Room, Agent Context Broker, vector candidates, graph candidates, and the persistence sequence that should come before any live retrieval migration.

## 1. Status Snapshot

AbarVa has a designed knowledge layer, not a live vector/graph runtime yet.

What is live in source code today:

- `src/lib/knowledge/enterprise-data-room.ts` defines deterministic Enterprise Data Room records for `apex-retail`, `meridian`, and `first-capital`.
- `src/lib/knowledge/agent-context-broker.ts` exposes the read-only `buildEnterpriseAgentContextBundle` seam used by agents to request governed context.
- `src/lib/knowledge/enterprise-data-room-persistence.ts` lowers data-room records into dry-run persistence row groups: `enterprise_data_rooms`, `entities`, `artifacts`, `evidence`, `chunks`, `graph_nodes`, and `graph_edges`.
- `src/lib/architecture/vector-search-provider-contract.ts` names accepted vector/search provider families. It is contract-only.
- `src/lib/architecture/graph-provider-contract.ts` names accepted graph provider families and the Postgres relationship-table fallback. It is contract-only.
- `docs/build/AGENT_INTELLIGENCE_SURFACE_AREA.md` establishes the broker boundary: app-tier code goes through `AgentContextBroker`, not direct Enterprise Data Room/vector/graph imports.

Current deterministic volume, generated from the source-code seeds:

| Tenant | Richness | Graph nodes | Graph edges | Vector candidate chunks | Dry-run persistence rows |
|---|---:|---:|---:|---:|---:|
| `apex-retail` | rich | 129 | 107 | 212 | 600 |
| `meridian` | partial | 66 | 14 | 284 | 434 |
| `first-capital` | partial | 13 | 11 | 241 | 282 |
| **Total** | 3 tenants | **208** | **132** | **737** | **1,316** |

What is not live yet:

- No embeddings are generated.
- No `vector(1536)` column exists for Enterprise Data Room chunks.
- No HNSW/IVFFlat ANN index exists for tenant evidence search.
- No live graph database is wired.
- No app route or agent should call a vector or graph store directly.

## 2. Embedding Model Decision

Default embedding model: `text-embedding-3-small`.

Default dimensionality: `1536`.

Why this is the right default for the lab and first pilots:

- It is sufficient for first-pass semantic retrieval over program deliverables, evidence claims, systems, vendors, phase-pack concepts, and sourcing artifacts.
- It keeps storage and index size small enough for Postgres/pgvector to remain operationally simple during pilot scale.
- It avoids committing to an expensive retrieval plane before the broker contract, write-back contract, and evidence ledger are stable.
- It gives us a stable dimension for schema design: `vector(1536)`.

Tokenization policy:

- Chunk by evidence-bearing unit, not by arbitrary byte length.
- Preferred units: deliverable section, evidence claim, artifact summary, system record, vendor-contract record, financial metric record, program record, sourcing-event record.
- Each chunk must carry `tenant_key`, `source_record_id`, `source_basis`, `data_classification`, `approval_state`, and enough metadata for the broker to withhold or cite it.
- Raw private text should not be stored in shared metadata. This matches the current `rawPrivateTextAllowedInSharedMetadata: false` rule in vector readiness records.

Fallback if the selected embedding model changes:

- Add a new embedding profile row or enum value before re-embedding.
- Do not overwrite existing vectors in place without a versioned `embedding_model` and `embedding_dim` field.
- Keep retrieval callers pinned to a named embedding profile until a migration validates recall quality.

## 3. Vector Store Decision

Default vector store for the SaaS/lab path: Supabase Postgres with pgvector.

Preferred table shape for Enterprise Data Room chunks:

```sql
enterprise_context_chunks (
  id uuid primary key,
  tenant_key text not null,
  client_id uuid null,
  source_record_id text not null,
  source_table text not null,
  source_basis text not null,
  chunk_ordinal integer not null,
  chunk_text text not null,
  token_count integer not null,
  data_classification text not null,
  approval_state text not null,
  embedding_model text not null,
  embedding_dim integer not null default 1536,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Recommended ANN index:

```sql
create index enterprise_context_chunks_embedding_hnsw
on enterprise_context_chunks
using hnsw (embedding vector_cosine_ops);
```

Distance metric: cosine distance.

Why pgvector first:

- Tenant filters, RLS, evidence metadata, and vector rows stay in one operational plane.
- The broker can join retrieved chunks to relational evidence/artifact/program rows without a separate provider hop.
- For current volumes, pgvector is not the bottleneck. The source-code seeds have 737 vector candidate chunks; even 100 tenants at 10,000 chunks each is still a reasonable Postgres-first milestone if indexing and tenant filters are designed carefully.
- It keeps Azure private-data-plane migration straightforward: Postgres Flexible Server plus pgvector is easier to reason about than adding a separate managed vector database on day one.

Alternatives remain valid later:

| Option | When it may make sense | Current posture |
|---|---|---|
| Azure AI Search | Dedicated Azure tenant with hybrid BM25 + vector + managed reranking | Contracted, not default |
| AlloyDB / Cloud SQL vector | Google Cloud private deployment path | Contracted, not default |
| Pinecone-like managed vector DB | Very large cross-tenant retrieval or specialized vector operations | Contracted, not default |

## 4. Graph Store Decision

Default graph store for the next migration: Postgres relationship tables first, not Neo4j-first.

Why Postgres-first:

- It keeps tenant isolation, transactional writes, backups, and audit behavior in the same database plane.
- It supports the first required graph use cases: neighborhood summaries, cross-program relationship counts, vendor/system/program/evidence adjacency, and bounded two-hop traversal.
- It avoids a second operational database before the product proves graph traversal is a bottleneck.
- The graph provider contract already names `postgres_relationship_fallback` as the fallback provider with `partial_runtime` status.

Candidate graph table shape:

```sql
enterprise_graph_nodes (
  id uuid primary key,
  tenant_key text not null,
  stable_key text not null,
  node_type text not null,
  title text not null,
  source_record_id text not null,
  source_basis text not null,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_key, stable_key)
)

enterprise_graph_edges (
  id uuid primary key,
  tenant_key text not null,
  from_node_id uuid not null references enterprise_graph_nodes(id),
  to_node_id uuid not null references enterprise_graph_nodes(id),
  edge_type text not null,
  confidence numeric not null,
  evidence_ids text[] not null default '{}',
  source_basis text not null,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
)
```

Indexes:

```sql
create index enterprise_graph_nodes_tenant_type_idx
on enterprise_graph_nodes (tenant_key, node_type);

create index enterprise_graph_edges_tenant_from_idx
on enterprise_graph_edges (tenant_key, from_node_id, edge_type);

create index enterprise_graph_edges_tenant_to_idx
on enterprise_graph_edges (tenant_key, to_node_id, edge_type);
```

Edge families already present in source-code candidate records include relationships among people, systems, vendor contracts, financial metrics, programs, artifacts, sourcing events, and evidence. The first live graph migration should preserve those families instead of inventing a separate graph taxonomy.

Neo4j remains an option later when:

- query depth routinely exceeds bounded two-hop/three-hop traversals;
- graph algorithms become product-critical;
- the team needs native graph explainability or path ranking beyond what recursive CTEs can safely provide;
- a dedicated tenant explicitly requires a managed graph store.

## 5. Migration Sequencing

Recommended order:

1. **PR-V: ProgramsBrokerAdapter.** Create the Programs read seam into the broker. No route wiring yet.
2. **PR-W: Evidence-binding tests.** Ensure Phase Pack `evaluationHint` vocabulary maps to DB or Enterprise Data Room concepts.
3. **Graph/vector readiness doc.** This document gates persistence migration design.
4. **Enterprise persistence migration v1.** Add `enterprise_data_rooms`, `enterprise_entities`, `enterprise_artifacts`, `enterprise_evidence`, `enterprise_context_chunks`, `enterprise_graph_nodes`, and `enterprise_graph_edges` tables. Include tenant-key indexes before any retrieval code.
5. **Dry-run mapper parity test.** Assert `mapEnterpriseDataRoomToPersistenceRows` can lower every source-code data-room row into the migration shape without dropped IDs.
6. **Embedding generation job.** Generate `text-embedding-3-small` vectors for approved chunk rows only. Record model, dim, chunking version, and source hash.
7. **Vector retrieval adapter behind broker.** Add similarity search inside the broker/data layer only. App-tier callers still see `EnterpriseAgentContextBundle`.
8. **Graph traversal adapter behind broker.** Add bounded neighborhood traversal inside the broker/data layer only. No route imports of graph tables.
9. **Write-back contract.** Add provenance-bearing write events for generated deliverables, user edits, decisions, approvals, and evidence attachments.
10. **Outcome telemetry and longitudinal pack evolution.** Store phase outcomes, anti-pattern firings, question-resolution outcomes, and pack-version weights.

Ordering constraints:

- Do not generate embeddings before the chunk table has source hash and approval metadata.
- Do not expose retrieval before tenant-key filtering and audit hooks are in place.
- Do not allow app-tier code to choose vector/graph providers.
- Do not start pack-learning updates until pack versions and outcome telemetry are persisted.

## 6. App-Tier Impact

The app tier should experience graph/vector persistence as better broker context, not as a new import path.

Allowed path:

```text
Programs runtime -> ProgramsBrokerAdapter -> AgentContextBroker -> data-room / persistence / vector / graph
```

Disallowed paths:

```text
src/app/** -> EnterpriseDataRoom
src/app/** -> pgvector table
src/app/** -> graph table/provider
src/lib/agent/** -> EnterpriseDataRoom
src/lib/agent/** -> vector/graph provider
```

What `ProgramsBrokerAdapter` enables:

- Wave 2 evidence runner can request program-scoped context without importing data-room seeds.
- Sponsor health drift can request tenant/program evidence through one seam.
- Cross-program portfolio reasoning can request graph neighborhoods once the broker owns traversal.
- Future write-back PRs can preserve the read/write split: read through broker, write through a separate provenance contract.

The broker is allowed to evolve from source-code seeded records to persisted rows. App-tier code should not know which storage mode is active.

## 7. Open Decisions

These are intentionally not buried:

| Decision | Current recommendation | Owner |
|---|---|---|
| Embedding profile version name | `openai_text_embedding_3_small_1536_v1` | Founder + engineering |
| Chunking version name | `enterprise_context_chunker_v1` | Engineering |
| HNSW parameters | Start with Postgres defaults; tune after pilot query corpus exists | Engineering |
| Hybrid search | Defer until lexical misses are observed; Azure AI Search remains the likely hybrid path for Azure-dedicated tenants | Founder + engineering |
| Graph provider beyond Postgres | Defer Neo4j/Cosmos/Neptune until bounded Postgres traversal is insufficient | Founder + engineering |
| Cross-tenant learning | Explicit founder/privacy decision required before longitudinal aggregation | Founder |
| Raw L4 retrieval | Default deny; require explicit broker authorization and audit evidence | Founder + security |
| Production tenant isolation | Separate subscription/data-plane decision remains outside this doc; this doc only names store-level shape | Founder + cloud owner |

## 8. Readiness Gate

A persistence PR should not merge unless all are true:

- Every table has `tenant_key` or an explicit tenant-bound parent relation.
- Every vector row records `embedding_model`, `embedding_dim`, chunking version, source hash, approval state, and data classification.
- Every graph node and edge carries tenant key, source basis, and stable source record linkage.
- Broker tests prove unknown tenants return blocked bundles, not fabricated context.
- App-tier import checks prove routes and agent modules do not import Enterprise Data Room, vector, or graph internals.
- Synthetic/demo data remains the only data in the lab environment.
