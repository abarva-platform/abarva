# GRAPH1 - Graph Provider Contract + Relationship Fallback

Slice ID: GRAPH1
Slice name: Graph Provider Contract + Relationship Fallback
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Lane E (parallel build pack)

Adds a contract-only module that names the canonical graph provider
kinds and capabilities the AbarVa Knowledge Fabric must support, and
documents the relational-table fallback shape used when a tenant runs
without a real graph database. **No live graph database wiring. No
SDK import. No network. No Date.now. No randomness. No agent /
source / sentinel / atlas / auth imports. No UI. No executable SQL.**

GRAPH1 is intentionally a contract slice, not a runtime slice. Live
Knowledge Fabric ingest and traversal continue to be deferred. Until
the live runtime ships, this contract names WHAT the live runtime
must enforce when it eventually selects between Neo4j, Cosmos DB
Gremlin, Neptune, or the Postgres relationship-table fallback.

## Why a contract before a live graph database

Three prior slices set the tenant data envelope; GRAPH1 closes the
graph-shaped corner of it without taking on runtime risk:

1. **TEN1** - SaaS tenancy architecture canon. Names the data
   evidence plane and lists "knowledge graph edges" as one of the
   isolation surfaces.
2. **TEN2** - tenant isolation data boundary model
   ([src/lib/architecture/tenant-isolation-boundary.ts](../../../src/lib/architecture/tenant-isolation-boundary.ts)).
   Already declares a `graph` boundary kind that requires every
   node and edge to carry `tenant_key`.
3. **GRAPH1** - this slice. Names the canonical provider kinds, the
   six query capabilities each provider must advertise, and the
   typed shape of the Postgres relationship-table fallback.

The relationship is layered:

```text
TEN1            names the data evidence plane (architecture-level)
    │
    ▼
TEN2 boundary   names the graph boundary kind + tenant_key invariant
    │
    ▼
GRAPH1          names the provider kinds, capabilities, and fallback shape
    │
    ▼
(future) live   wires a single graph provider (or the fallback) per tenant
```

The contract module exists so the live Knowledge Fabric implementation
slice can be reviewed against a typed, code-checked specification
rather than a prose document. Every constraint is expressed as a
`readonly` constant or a pure accessor, so a static scan can confirm
the live module honors the contract.

## What changed

- New module
  [src/lib/architecture/graph-provider-contract.ts](../../../src/lib/architecture/graph-provider-contract.ts):
  - Public type unions:
    `GraphProviderKind`, `GraphQueryCapability`,
    `GraphProviderRuntimeStatus`, `GraphFallbackColumnTypeFamily`.
  - Public interfaces:
    `GraphProviderProfile`, `GraphFallbackColumn`,
    `GraphRelationshipFallbackTable`,
    `GraphRelationshipFallbackSchema`, `GraphProviderSummary`.
  - Public constants:
    `GRAPH_PROVIDER_KINDS`, `GRAPH_QUERY_CAPABILITIES`.
  - Public helpers:
    `listGraphProviders`, `buildGraphProviderRegistry`,
    `summarizeGraphProviders`, `buildRelationshipFallbackSchema`.
  - Imports nothing. The contract is fully self-contained.

- New tests
  [src/__tests__/integration/architecture/graph-provider-contract.test.ts](../../../src/__tests__/integration/architecture/graph-provider-contract.test.ts):
  Deterministic suite covering the four provider kinds, the six
  capabilities, the documented fallback option, byte-equal
  determinism, the relational fallback schema, and module hygiene
  (no `prisma.`, no `supabase.`, no `await db`, no `fetch(`, no
  `Date.now`, no `Math.random`, no `new Date(`, no React hooks, no
  placeholder copy, and no executable SQL DDL).

## Provider surface

Four provider kinds are recognized; the live runtime must select
exactly one per tenant:

| Kind                              | Family                              | Fallback | Default capabilities                                                                                       |
|-----------------------------------|-------------------------------------|----------|------------------------------------------------------------------------------------------------------------|
| `neo4j`                           | labeled-property-graph              | no       | shortest_path, multi_hop_traversal, subgraph_extract, relationship_count, pattern_match, tenant_scoped_query |
| `cosmos_db_gremlin`               | gremlin-property-graph              | no       | shortest_path, multi_hop_traversal, subgraph_extract, relationship_count, pattern_match, tenant_scoped_query |
| `neptune`                         | gremlin-and-sparql-property-graph   | no       | shortest_path, multi_hop_traversal, subgraph_extract, relationship_count, pattern_match, tenant_scoped_query |
| `postgres_relationship_fallback`  | relational-edge-table               | yes      | multi_hop_traversal, relationship_count, tenant_scoped_query                                               |

Every provider advertises `tenant_scoped_query` and records
`requiresTenantKeyOnTraversal: true`. The live runtime must reject
empty `tenant_key` and inject the tenant predicate at the first
traversal step, regardless of provider.

The non-fallback providers (Neo4j, Cosmos Gremlin, Neptune) are
recorded with `runtimeStatus: 'contract_only'` because the live wiring
is deferred. The fallback is recorded as `partial_runtime` because
the Postgres data plane already exists for tenants that engage AbarVa
without provisioning a managed graph database; the migration that
creates the fallback tables is its own follow-up slice.

## Capability surface

Six canonical capabilities are recognized:

| Capability             | Notes                                                                                       |
|------------------------|---------------------------------------------------------------------------------------------|
| `shortest_path`        | Single-source / single-target shortest path within tenant scope.                            |
| `multi_hop_traversal`  | Bounded-depth traversal across labeled edges within tenant scope.                           |
| `subgraph_extract`     | Tenant-scoped subgraph extraction for Atlas / Sentinel narrative composition.               |
| `relationship_count`   | Tenant-scoped count of relationships matching a typed filter.                               |
| `pattern_match`        | Pattern-shaped query (Cypher, Gremlin, or future fallback DSL) within tenant scope.         |
| `tenant_scoped_query`  | Required on every provider; rejects calls without a tenant predicate.                       |

The fallback advertises a deliberately narrower set
(`multi_hop_traversal`, `relationship_count`, `tenant_scoped_query`).
The remaining three capabilities (`shortest_path`, `subgraph_extract`,
`pattern_match`) are explicitly out of scope for the relational
fallback - the future runtime should refuse those capabilities for
tenants on the fallback rather than fabricate a degraded answer.

## Relational fallback schema

`buildRelationshipFallbackSchema()` returns a deterministic SQL-like
schema description for the `knowledge_fabric_fallback` logical
schema. It is **not** executable SQL; the future migration slice will
lower the description into a real `CREATE TABLE` statement.

The schema declares three tables:

- `graph_fallback_nodes` - Knowledge Fabric nodes, primary-keyed by
  `(tenant_key, node_id)`.
- `graph_fallback_edges` - Knowledge Fabric edges, primary-keyed by
  `(tenant_key, edge_id)`, with foreign-key references back to
  `(tenant_key, node_id)` on both endpoints.
- `graph_fallback_edge_versions` - append-only version trail so the
  fallback can participate in tenant-scoped audit replay alongside
  the unified audit ledger.

Every table:

- Carries `tenant_key` as a non-null column.
- Names at least one index that includes `tenant_key`.
- Uses logical timestamps (`timestamp_logical`) rather than wall-
  clock writes; the live migration slice will pin the logical
  timestamp shape.

The schema-level `tenantIsolationInvariant` records the rule the
migration slice must enforce: every read, write, and recursive CTE
traversal must filter on `tenant_key` at every step, and helpers must
refuse empty `tenant_key`.

## What is intentionally NOT in GRAPH1

- **Live graph database wiring.** GRAPH1 is contract-only. No SDK
  import, no fetch, no provider call.
- **Live SQL migration.** The fallback schema is a typed shape; the
  migration that creates the tables is a separate slice and is not
  staged here.
- **Cypher / Gremlin / SPARQL helpers.** GRAPH1 does not ship a query
  builder; the live runtime slice owns helper authoring.
- **Cross-provider portability layer.** GRAPH1 names the canonical
  capabilities each provider must advertise; it does not implement a
  uniform query DSL across providers.
- **Knowledge Fabric ingest.** GRAPH1 does not ingest entities,
  evidence, or relationships; ingest remains gated on the future
  Knowledge Fabric runtime slice.
- **Production-readiness promotion.** GRAPH1 does not promote
  `data_evidence_knowledge_fabric` from `scaffolded`. The component
  remains scaffolded; the contract narrows the future runtime path
  without changing the readiness verdict.

## Hygiene invariants

- No `import OpenAI`, no `import Anthropic`, no `import` from
  `@anthropic-ai/sdk`, `@openai/sdk`, `@prisma/client`,
  `@supabase/supabase-js`, `neo4j-driver`, or `gremlin`.
- No `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`.
- No `prisma.`, no `supabase.`, no `await db` references in code.
- No React state / effect hooks.
- No imports from `@/lib/sentinel/`, `@/lib/atlas/`, `@/lib/nexus/`,
  `@/lib/source/`, `@/lib/agent/`, `@/lib/auth/`.
- No `Coming soon`, `TBD`, or `Lorem ipsum` placeholder copy.
- No executable SQL DDL (`CREATE TABLE`, `ALTER TABLE`,
  `DROP TABLE`) anywhere in the file.
- All accessors are pure: same input -> byte-equal output across
  calls. Both `buildGraphProviderRegistry` and
  `buildRelationshipFallbackSchema` are deterministic.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/graph-provider-contract.test.ts
npx eslint --max-warnings=0 src/lib/architecture/graph-provider-contract.ts src/__tests__/integration/architecture/graph-provider-contract.test.ts
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"
```

## Future slices that build on GRAPH1

- **GRAPH2 - Fallback schema migration.** Lowers
  `buildRelationshipFallbackSchema()` into a real Postgres migration
  with the tenant_key invariant enforced at the database layer.
- **GRAPH3 - Provider helper.** Implements tenant-scoped traversal
  helpers for the fallback provider; rejects providers that do not
  advertise the required capability.
- **GRAPH4 - Live provider runtime.** Wires Neo4j, Cosmos Gremlin, or
  Neptune behind the same `GraphProviderProfile` interface.

## Acceptance criteria mapping

- All 4 provider kinds covered with metadata - `GRAPH_PROVIDER_KINDS`
  + `buildGraphProviderRegistry` + provider-coverage tests.
- All 6 capabilities covered - `GRAPH_QUERY_CAPABILITIES` +
  capability-coverage tests.
- `postgres_relationship_fallback` documented as the fallback option -
  fallback test verifies exactly one provider records `isFallback: true`
  and that it is the postgres fallback kind.
- Byte-equal determinism - dedicated determinism tests for both
  `buildGraphProviderRegistry` and `buildRelationshipFallbackSchema`.
- No real DB calls - module hygiene tests verify the source contains
  no `prisma.`, no `supabase.`, no `await db` references in code.
- Module hygiene - dedicated tests verify no SDK imports, no
  forbidden runtime imports, no `Date.now` / `Math.random` /
  `new Date(`, no `fetch(`, no React hooks, no placeholder copy,
  no executable SQL DDL.
