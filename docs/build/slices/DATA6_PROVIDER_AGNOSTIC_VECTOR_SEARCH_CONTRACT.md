# DATA6 · Provider-Agnostic Vector / Search Contract

Slice ID: DATA6
Slice name: Provider-Agnostic Vector / Search Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Lane D (wave3 data parallel pack)

Adds a deterministic, type-only contract module that names every
vector / search provider AbarVa is willing to integrate with at the
architecture layer, what each provider can do, how it isolates
tenants, the audit hooks the live runtime must emit when it calls
the provider, and the environment variables the live adapter must
read. **No model call, no live retrieval, no provider SDK import,
no Date.now reads, no randomness, no fetch, no http, no axios, no
UI, no migrations.**

DATA6 is a contract, not a runtime. It does not query a vector
index, does not initialize a connection pool, does not register a
live adapter, and does not promote any production-readiness
component. It is the per-provider counterpart of TEN2 for the
vector / search plane: TEN2 names the storage / vector / graph /
model_gateway / audit isolation contract any future evidence
ledger ingest must respect; DATA6 names the providers, capabilities,
tenant-isolation models, audit hooks, and required env vars the
live retrieval runtime must enforce regardless of which provider
is wired up.

## What changed

- New module
  [src/lib/architecture/vector-search-provider-contract.ts](../../../src/lib/architecture/vector-search-provider-contract.ts):
  - Public types: `VectorSearchProviderKind` (4 kinds: `pgvector`,
    `azure_ai_search`, `alloydb_cloud_sql_vector`,
    `pinecone_like_generic`), `VectorSearchCapability` (6
    capabilities: `similarity_search`, `hybrid_search`,
    `metadata_filter`, `reranking`, `tenant_isolation`,
    `index_management`), `VectorSearchTenantIsolationModel` (3
    models: `logical_namespace`, `physical_separation`,
    `index_per_tenant`), `VectorSearchProviderProfile`,
    `VectorSearchAdapterContract`, `VectorSearchProviderSummary`.
  - Public constants: `VECTOR_SEARCH_PROVIDER_KINDS`,
    `VECTOR_SEARCH_CAPABILITIES`,
    `VECTOR_SEARCH_TENANT_ISOLATION_MODELS`.
  - Pure helpers: `listVectorSearchProviders()`,
    `buildVectorSearchProviderRegistry()`,
    `summarizeVectorSearchProviders()`,
    `getVectorSearchProviderProfile(kind)`.
  - Every adapter contract carries `createdFrom:
    'deterministic_vector_search_provider_seed'` and
    `liveBinding: false`; every profile carries
    `liveExecution: false`.

- New tests
  [src/__tests__/integration/architecture/vector-search-provider-contract.test.ts](../../../src/__tests__/integration/architecture/vector-search-provider-contract.test.ts):
  Deterministic coverage over all 4 provider kinds, all 6
  capabilities, all 3 tenant-isolation models, byte-equal output
  across consecutive calls, registry shape, accessor null-safety,
  and module hygiene (no provider SDK imports, no `fetch(` /
  `http(` / `axios` runtime calls, no Date.now / Math.random / new
  Date, no React hooks, no placeholder copy, no forbidden runtime
  imports).

## Provider profiles at a glance

| Kind                       | Capabilities                                                                                                  | Tenant isolation     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------- |
| `pgvector`                 | similarity_search, metadata_filter, tenant_isolation, index_management                                        | logical_namespace    |
| `azure_ai_search`          | similarity_search, hybrid_search, metadata_filter, reranking, tenant_isolation, index_management              | index_per_tenant     |
| `alloydb_cloud_sql_vector` | similarity_search, hybrid_search, metadata_filter, tenant_isolation, index_management                         | logical_namespace    |
| `pinecone_like_generic`    | similarity_search, metadata_filter, tenant_isolation, index_management                                        | logical_namespace    |

Each profile names the audit hooks the live runtime must emit
(`vector_search_request_started`, `vector_search_request_completed`,
`vector_search_request_refused`, plus provider-specific extensions
such as `hybrid_search_request_recorded` and
`reranker_invocation_recorded` for Azure AI Search) and the env
vars the live adapter must read by name only (no value is baked
into the contract module).

## Out of scope

- No live provider calls. The module imports zero provider SDKs.
- No connector binding. The future live retrieval runtime is the
  seam between EVID2 entries and the vector index; DATA6 does not
  open that seam.
- No production-readiness promotion. The
  `data_evidence_knowledge_fabric` component remains `scaffolded`.
- No UI. No tenant runtime mutation. No migrations. No env file.

## Validation

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/vector-search-provider-contract.test.ts
npx eslint --max-warnings=0 src/lib/architecture/vector-search-provider-contract.ts src/__tests__/integration/architecture/vector-search-provider-contract.test.ts
```

## Acceptance summary

- All 4 canonical provider kinds are represented as profiles in
  canonical order.
- All 6 capabilities are representable on at least one profile.
- All 3 tenant isolation models appear in the canonical
  vocabulary.
- Helpers are byte-equal deterministic across consecutive calls.
- Every adapter contract carries the canonical
  `deterministic_vector_search_provider_seed` createdFrom and
  `liveBinding: false`.
- Module hygiene gate passes: no provider SDK import, no
  `fetch(` / `http(` / `axios` in code, no live runtime calls.
