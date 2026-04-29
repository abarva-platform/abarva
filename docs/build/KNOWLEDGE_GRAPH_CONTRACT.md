# Knowledge Graph Contract

Document: `docs/build/KNOWLEDGE_GRAPH_CONTRACT.md`
Status: contract only
Scope: knowledge-layer storage, retrieval, migration gates, and tenancy rules
Runtime impact: none
Migration impact: none in this slice

## 1. Purpose

This contract defines the default knowledge graph shape for Nexus / AbarVa intelligence work. It is intentionally Postgres-first so the graph can be implemented inside the existing Supabase / Azure Postgres lineage without forcing a separate graph database into the critical path.

The contract strengthens the knowledge layer by making these promises explicit:

- Graph facts are tenant-scoped unless they are explicitly public corpus facts.
- Graph nodes and edges are evidence-backed or marked as deterministic seed / inferred / proposed.
- Graph retrieval can be served by Postgres recursive CTEs and indexed adjacency tables.
- Neo4j / Cypher assets are historical or optional accelerator material, not the default production dependency.
- Azure migration keeps Postgres as the graph authority and uses Azure AI Search only for vector / hybrid retrieval.
- Any database change required to implement this contract needs separate DB migration approval.

## 2. Current Repo Grounding

This contract is grounded in current repository conventions, not a greenfield graph design.

| Area | Current convention | Contract implication |
| --- | --- | --- |
| Shared intelligence types | `src/lib/intelligence/types.ts` defines `TenancyCtx`, `Source`, `RetrievalResult`, and dimensions `graph`, `vector`, `structured`, `emergent`. | Graph output must remain source-linked claims, not opaque graph payloads. |
| Pattern seeds | `src/lib/intelligence/seed-types.ts` distinguishes `knowledge` and `lifecycle` pattern kinds and carries source documents, related patterns, derived-from patterns, contradiction tags, confidence, lifecycle stages, gates, and expected artifacts. | Pattern nodes and lifecycle edges must preserve seed identity and provenance. |
| Graph retrieval | `src/lib/intelligence/retrieval/graphRetriever.ts` already walks Postgres/Supabase tables and scopes every query by `client_id`. | Postgres is already the live graph retrieval default. Keep it that way. |
| Structured retrieval | `src/lib/intelligence/retrieval/structuredRetriever.ts` reads tenant-scoped SQL tables and public benchmark sources. | The graph should join to structured facts without duplicating full row payloads. |
| Vector retrieval | `src/lib/intelligence/retrieval/vectorRetriever.ts` uses namespaces plus metadata filters, with tenant filtering for client namespaces. | Graph nodes may reference vector chunks but do not replace vector retrieval. |
| Deterministic graph UI | `src/lib/sentinel/pattern-graph-read-model.ts` exposes seed nodes and edges with an honest note that they are not computed from live signal data. | Seed graph edges must carry `origin = deterministic_seed` until promoted. |
| Postgres evidence tables | `supabase/migrations/20260421152501_intelligence_layer_core.sql` defines `evidence`; `024_knowledge_sources.sql` defines `knowledge_sources` and `knowledge_chunks`. | Evidence and citation references should point at these concepts first. |
| Historical graph files | `db/graph/migrations/*.cypher` define useful node and relationship vocabulary. | Cypher vocabulary can inform taxonomy, but Neo4j is not the default dependency. |
| Azure architecture | Azure docs define Postgres Flexible Server, Azure AI Search, Blob, Key Vault, and private data plane boundaries. | Azure cutover must preserve Postgres graph authority and private data plane evidence boundaries. |

## 3. Non-Goals

This contract does not:

- Add or modify migrations.
- Add runtime graph code.
- Require Neo4j, Memgraph, Cosmos DB Gremlin, or another graph store.
- Move raw tenant data into the control plane.
- Replace vector retrieval, corpus indexing, or Azure AI Search.
- Declare any current seed graph to be live production evidence.

## 4. Storage Decision

Default graph store: Postgres.

The production graph authority should be a relational adjacency model in Postgres, with recursive CTEs for bounded traversals and ordinary indexes for tenancy, node kind, edge kind, and evidence status.

Neo4j is allowed only as:

- A local exploration tool.
- A migration reference for existing Cypher taxonomy.
- A future optional read replica / analytics accelerator after explicit architecture approval.

Neo4j must not become required for normal app boot, retrieval, evidence resolution, tenant isolation, or Azure cutover.

## 5. Tenant Isolation

Every tenant-specific graph row must include `client_id UUID NOT NULL` and every retrieval path must accept a `TenancyCtx` carrying at least `clientId` and `userId`.

Tenant isolation rules:

- Client graph nodes require `client_id` unless `scope = 'public'`.
- Client graph edges require `client_id` unless both endpoints are public and the relationship is public corpus knowledge.
- Cross-client aggregate edges are not allowed to expose source client ids; they must materialize only aggregate facts with cohort thresholds matching the emergent retrieval rule (`n >= 3`).
- Public nodes can be joined into a tenant graph, but tenant nodes cannot be joined into another tenant graph.
- Access scope references should be carried on graph facts when the source table supports `reasoning_scope_id` / `disclosure_scope_id`.
- Service-role policies are not enough as the final product boundary; application retrieval must also filter by `client_id` and scope.

## 6. Node Taxonomy

Canonical node IDs should be stable strings. UUID primary keys are acceptable for storage, but graph consumers need stable external keys for deterministic rendering and citations.

| Node kind | Scope | Source of truth | Required identity fields | Notes |
| --- | --- | --- | --- | --- |
| `Client` | tenant | `clients` | `client_id` | Tenant root. |
| `Engagement` | tenant | `engagements` | `engagement_id`, `client_id` | Work-object root for delivery context. |
| `UseCase` | tenant | `use_cases` | `use_case_id`, `client_id` | Already used by graph retrieval. |
| `Application` | tenant | `applications` | `application_id`, `client_id` | Vendor deployment / system instance. |
| `Integration` | tenant | `integrations` | `integration_id`, `client_id` | System-to-system dependency. |
| `Contradiction` | tenant | `contradictions` | `contradiction_id`, `client_id` | Must carry state, severity, confidence, evidence ids when available. |
| `Evidence` | tenant | `evidence` | `evidence_id`, `client_id` | Assertion support, not raw document payload. |
| `KnowledgeSource` | public or licensed | `knowledge_sources` | `source_key` or `source_id` | Authority, benchmark, regulation, framework, report, vendor doc. |
| `KnowledgeChunk` | public or licensed | `knowledge_chunks` / vector index | `chunk_id`, `source_id`, vector namespace id | Citation-resolvable chunk or section. |
| `Pattern` | public, tenant variant, or seed | `PatternSeed`, `pattern_packs`, generated manifests | `pattern_id` or `pattern_key`, version | Includes knowledge and lifecycle pattern kinds. |
| `LifecycleStage` | public or tenant | lifecycle seeds / program state | `stage_id`, `pattern_id` | Stage / gate traversal. |
| `GateCriterion` | public or tenant | lifecycle seeds / gate tables | `criterion_id`, `stage_id` | Can block advancement. |
| `ExpectedArtifact` | public or tenant | lifecycle seeds / deliverables | `artifact_requirement_id`, `stage_id` | Evidence readiness and deliverable linkage. |
| `Signal` | tenant or aggregate | signal catalog / signal firings | `signal_id`, `client_id` when tenant | Detection and alert primitive. |
| `Solution` | public or tenant | solution seeds / solution catalog | `solution_id` | Solution primitive. |
| `Benchmark` | public or aggregate | `knowledge_sources`, cohorts, benchmarks | `benchmark_id`, as-of | Must carry methodology and confidence. |
| `Vendor` | public or tenant | vendor docs, applications, sourcing corpus | `vendor_key` or `application_id` | Public vendor knowledge and tenant deployment are separate nodes. |
| `Regulation` | public | knowledge sources / graph taxonomy | `regulation_key`, jurisdiction | Public authority node. |
| `Framework` | public | knowledge sources / graph taxonomy | `framework_key`, version | Public control / methodology node. |
| `Topic` | public | topic taxonomy | `topic_key` | Shared classification node. |
| `CohortAggregate` | aggregate | emergent pattern tables | `aggregate_id`, cohort dimensions, as-of | Must enforce privacy threshold. |

## 7. Edge Taxonomy

Every edge must have a typed `edge_kind`, direction, provenance, confidence, status, and optional evidence references.

| Edge kind | From | To | Scope | Evidence rule |
| --- | --- | --- | --- | --- |
| `HAS_ENGAGEMENT` | `Client` | `Engagement` | tenant | Structural edge; source row is enough. |
| `HAS_USE_CASE` | `Client` or `Engagement` | `UseCase` | tenant | Structural edge; source row is enough. |
| `USES_APPLICATION` | `UseCase` | `Application` | tenant | Requires source row or evidence. |
| `DEPENDS_ON_INTEGRATION` | `Application` | `Integration` | tenant | Requires source row or evidence. |
| `SURFACED_CONTRADICTION` | `Engagement` or `UseCase` | `Contradiction` | tenant | Requires contradiction row. |
| `SUPPORTED_BY` | any claim node | `Evidence` or `KnowledgeChunk` | same as source | Required for decision-grade claims. |
| `SOURCED_FROM` | `Evidence`, `Benchmark`, `Vendor`, `Regulation`, `Framework` | `KnowledgeSource` | public/licensed/tenant | Required for citations. |
| `ABOUT_TOPIC` | any public or tenant node | `Topic` | matching source | Can be deterministic if taxonomy-owned. |
| `APPLIES_TO_INDUSTRY` | `Regulation`, `Framework`, `Benchmark`, `Pattern` | `Topic` or industry key | public | Requires source or taxonomy approval. |
| `DETECTS_PATTERN` | `Signal` | `Pattern` | tenant or aggregate | Requires detection rule version and source signals. |
| `RELATED_TO_PATTERN` | `Pattern` | `Pattern` | public/seed | Can originate from seed fields such as related / derived pattern ids. |
| `IMPLIES` | `Pattern` or `Signal` | `Pattern` or `Contradiction` | seed/tenant/aggregate | Seed edges must not be presented as live-computed. |
| `CONTRADICTS` | `Pattern`, `Signal`, `Evidence`, `Contradiction` | same | tenant/public | Requires opposing evidence or deterministic template. |
| `CO_OCCURS_WITH` | `Pattern` or `Signal` | `Pattern` or `Signal` | aggregate or seed | Live aggregate requires privacy threshold. |
| `ESCALATES_TO` | `Pattern`, `Signal`, `FailureMode` | `Pattern`, `Contradiction`, `Action` | tenant/seed | Requires rule or evidence. |
| `BENCHMARKED_AGAINST` | `UseCase`, `KPI`, `Program` | `Benchmark` | tenant to public | Requires benchmark source and as-of. |
| `GATED_BY` | `LifecycleStage` or work object | `GateCriterion` | tenant/public | Structural edge; gate result is separate evidence. |
| `REQUIRES_ARTIFACT` | `LifecycleStage` | `ExpectedArtifact` | tenant/public | Structural edge. |
| `ROLLS_UP_TO` | tenant signal/fact | `CohortAggregate` | aggregate | Must not reveal peer ids. |

## 8. Informational Postgres Shape

The following shape is informational only. It is not a migration in this slice.

```sql
-- Informational only. Requires separate migration approval.
create table knowledge_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid null references clients(id) on delete cascade,
  node_key text not null,
  node_kind text not null,
  scope text not null check (scope in ('public', 'tenant', 'aggregate', 'seed')),
  title text not null,
  summary text,
  source_table text,
  source_pk text,
  version text,
  confidence_level text check (confidence_level is null or confidence_level in ('high', 'medium', 'low')),
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, node_key)
);

create table knowledge_graph_edges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid null references clients(id) on delete cascade,
  edge_key text not null,
  edge_kind text not null,
  from_node_id uuid not null references knowledge_graph_nodes(id) on delete cascade,
  to_node_id uuid not null references knowledge_graph_nodes(id) on delete cascade,
  scope text not null check (scope in ('public', 'tenant', 'aggregate', 'seed')),
  origin text not null check (origin in ('source_row', 'deterministic_seed', 'detection_rule', 'human_reviewed', 'model_proposed', 'aggregate')),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  evidence_ids text[] not null default array[]::text[],
  source_ids text[] not null default array[]::text[],
  rule_version text,
  observed_at date,
  as_of_date date,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, edge_key)
);
```

Minimum indexes for any approved implementation:

- `(client_id, node_kind, node_key)` on nodes.
- `(client_id, edge_kind)` on edges.
- `(from_node_id, edge_kind)` and `(to_node_id, edge_kind)` on edges.
- GIN indexes for `evidence_ids`, `source_ids`, and metadata only if query paths justify them.
- Partial indexes for public graph rows where `client_id is null`.

## 9. Retrieval Contract

Graph retrieval must return `RetrievalResult`-compatible claims, not unbounded raw graph dumps.

Required retrieval behavior:

- Accept `TenancyCtx` and fail closed when `clientId` is missing for tenant graph walks.
- Default `maxDepth` to a small bounded value; deeper traversals require explicit caller choice.
- Enforce timeout and partial-result behavior consistent with `parallelRetrieve`.
- Include source-backed `Source` objects for every returned claim.
- Preserve `partial = true` when any traversal branch fails.
- Never infer tenant access from route slug alone; use resolved client id.
- Sort deterministically for equal weights / confidence.

Postgres traversal is expected to use recursive CTEs for bounded paths, for example:

```sql
-- Informational only. Requires separate migration and query review.
with recursive walk as (
  select e.id, e.from_node_id, e.to_node_id, e.edge_kind, 1 as depth
  from knowledge_graph_edges e
  where e.client_id = :client_id
    and e.from_node_id = :start_node_id
  union all
  select e.id, e.from_node_id, e.to_node_id, e.edge_kind, w.depth + 1
  from knowledge_graph_edges e
  join walk w on e.from_node_id = w.to_node_id
  where e.client_id = :client_id
    and w.depth < :max_depth
)
select * from walk;
```

## 10. Evidence and Citation Requirements

Graph facts must declare their evidence posture.

Evidence status vocabulary:

- `structural`: relationship is directly represented by a source row and does not need a separate evidence artifact.
- `cited`: relationship is supported by one or more citation-resolvable evidence or knowledge source records.
- `seeded`: relationship comes from deterministic seed data and must be labeled as such.
- `inferred`: relationship is computed from deterministic rules and must carry rule version.
- `proposed`: relationship is model- or analyst-proposed and cannot drive decisions until reviewed.
- `rejected`: relationship was considered and rejected, retained only for audit if needed.

Decision-grade graph edges require:

- At least one evidence id, source id, or source row pointer.
- `as_of_date` or `observed_at` when time-sensitive.
- Confidence level.
- Origin.
- Review status when generated from a model or aggregate.

## 11. Azure Migration Alignment

Azure migration must preserve the same graph authority model.

| Concern | Contract |
| --- | --- |
| Control Plane | Postgres Flexible Server stores graph metadata, public corpus nodes, aggregate graph facts, routing policies, and audit/evidence manifests. |
| Private Data Plane | Customer-owned Postgres / Blob stores raw data and source metadata. AbarVa receives evidence manifests and citation locators, not raw bytes. |
| Search / embeddings | Azure AI Search handles vector and hybrid retrieval; graph authority remains Postgres. |
| Secrets | Key Vault stores database/search/model credentials. No graph contract requires secrets in source or docs. |
| Region | Follow Azure ADR region policy; lab/prod path currently targets East US 2 with East US fallback if needed. |
| Model gateway | Graph context passed to models must be scoped, source-linked, and stripped of raw private data unless policy permits. |
| Cutover | Supabase/Postgres to Azure Postgres cutover must preserve graph ids, node keys, edge keys, evidence references, RLS, and retrieval parity. |

## 12. Cutover Gates

A graph implementation is not production-ready until all gates pass.

| Gate | Required evidence |
| --- | --- |
| Schema approved | Separate DB migration approval exists and names graph tables / indexes / RLS. |
| Tenancy verified | Tests or probes show tenant A cannot retrieve tenant B nodes, edges, evidence, or private source references. |
| Public/tenant split verified | Public corpus nodes can be joined into tenant context; tenant nodes never leak into public context. |
| Evidence resolvable | Every decision-grade edge resolves to evidence, source row, or knowledge source. |
| Seed honesty verified | Deterministic seed edges render as seed/stub and are not called live-computed. |
| Retrieval parity | Existing `graphRetriever` behavior is preserved or intentionally migrated with fixtures and before/after output. |
| Performance bounded | Default graph walks enforce max depth, timeout, and row limits. |
| Azure parity | Azure Postgres graph tables and AI Search indexes preserve ids, filters, and citation references. |
| Rollback ready | Rollback path can disable new graph retrieval without deleting evidence or source records. |

## 13. Requires Separate DB Migration Approval

The following are explicitly out of scope for this docs-only slice and require separate approval:

- Creating `knowledge_graph_nodes`, `knowledge_graph_edges`, or any graph adjacency table.
- Adding columns to `evidence`, `knowledge_sources`, `knowledge_chunks`, `contradictions`, `use_cases`, `applications`, `integrations`, `pattern_packs`, or signal tables.
- Adding RLS policies or changing service-role policies.
- Backfilling graph nodes / edges from seed files, Supabase tables, Cypher files, or corpus files.
- Adding pgvector, ltree, pg_trgm, Apache AGE, or other Postgres extensions.
- Migrating Pinecone namespaces to Azure AI Search indexes.
- Introducing Neo4j or any graph database as a required runtime service.
- Changing private data plane evidence-manifest tables or boundary API persistence.

## 14. Open Blockers

- No approved graph adjacency migration exists in this slice.
- Current runtime graph retrieval reads existing relational tables directly; it does not yet use a canonical graph edge table.
- Existing deterministic pattern graph edges are seed/stub edges and should remain labeled that way.
- Historical Cypher migrations need review before any vocabulary is promoted into Postgres schema.
- Azure Postgres and Azure AI Search cutover are architecture-aligned but not completed by this document.
