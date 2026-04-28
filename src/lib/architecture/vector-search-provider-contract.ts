// DATA6 - Provider-Agnostic Vector / Search Contract.
//
// Pure type-only / data-only contract module that names every vector
// and search provider AbarVa is willing to integrate with at the
// architecture level, what each provider can do, how it isolates
// tenants, what audit hooks the live runtime must emit when it
// calls the provider, and which environment variables the live
// adapter must read. DATA6 ships ZERO runtime behavior: no provider
// SDK import, no fetch, no Date, no randomness, no auth / source /
// sentinel / atlas / nexus / agent imports, no UI, no live binding.
//
// Relationship to prior slices and the Knowledge Fabric roadmap:
//
//   - TEN2 (src/lib/architecture/tenant-isolation-boundary.ts) names
//     the storage / vector / graph / model_gateway / audit isolation
//     contract any future evidence ledger ingest must respect. DATA6
//     is the per-provider counterpart for the vector / search plane:
//     it names the providers, capabilities, tenant-isolation models,
//     and audit hooks the live retrieval runtime must enforce
//     regardless of which provider is wired up.
//   - EVID2 / EVID3 are the evidence ledger contract; DATA6 does not
//     read from or bind the ledger. The live retrieval runtime is
//     the future seam between EVID2 entries and the vector index.
//   - The data_evidence_knowledge_fabric production-readiness
//     component remains "scaffolded". DATA6 is contract-only and is
//     an intentional NO-OP for the live runtime; it does not promote
//     fabric status, does not bind a live index, does not load a
//     real connector, and does not call any provider endpoint.
//
// DATA6 explicitly DOES NOT:
//   - import any provider SDK (no @pinecone-database, no
//     @azure/search-documents, no pg, no pgvector client, no
//     @google-cloud/alloydb, no @google-cloud/sql, no openai, no
//     anthropic, no @anthropic-ai/sdk, no @openai/sdk).
//   - call fetch, Date.now, Math.random, or new Date(.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/atlas/, src/lib/agent/, src/lib/auth/, supabase, or
//     any live provider URL.
//   - render any UI, mutate state, or invoke any agent runtime.
//
// The exported provider-name strings (e.g. 'pinecone_like_generic')
// are deliberate canonical KEYS the contract uses to address each
// provider; the strings appear ONLY inside string-array literals and
// const-mapped record literals. A hygiene scanner that strips string
// literals before searching for SDK tokens (see the test module
// `stripStringLiterals` helper) will not flag this file.

// ---------------------------------------------------------------------
// Provider kinds
// ---------------------------------------------------------------------

export const VECTOR_SEARCH_PROVIDER_KINDS = [
  'pgvector',
  'azure_ai_search',
  'alloydb_cloud_sql_vector',
  'pinecone_like_generic',
] as const;
export type VectorSearchProviderKind =
  (typeof VECTOR_SEARCH_PROVIDER_KINDS)[number];

// ---------------------------------------------------------------------
// Capability vocabulary
// ---------------------------------------------------------------------

export const VECTOR_SEARCH_CAPABILITIES = [
  'similarity_search',
  'hybrid_search',
  'metadata_filter',
  'reranking',
  'tenant_isolation',
  'index_management',
] as const;
export type VectorSearchCapability =
  (typeof VECTOR_SEARCH_CAPABILITIES)[number];

// ---------------------------------------------------------------------
// Tenant isolation models
// ---------------------------------------------------------------------

export const VECTOR_SEARCH_TENANT_ISOLATION_MODELS = [
  'logical_namespace',
  'physical_separation',
  'index_per_tenant',
] as const;
export type VectorSearchTenantIsolationModel =
  (typeof VECTOR_SEARCH_TENANT_ISOLATION_MODELS)[number];

// ---------------------------------------------------------------------
// Provider profile
// ---------------------------------------------------------------------

export interface VectorSearchProviderProfile {
  kind: VectorSearchProviderKind;
  description: string;
  capabilities: ReadonlyArray<VectorSearchCapability>;
  tenantIsolationModel: VectorSearchTenantIsolationModel;
  auditHooks: ReadonlyArray<string>;
  requiredEnvVars: ReadonlyArray<string>;
  liveExecution: false;
}

// ---------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------
//
// VectorSearchAdapterContract is the shape any future live provider
// adapter must satisfy. DATA6 ships the contract only; the live
// adapter implementation is deferred. The contract names the
// per-provider profile the adapter binds, the canonical adapter
// identifier the audit ledger records, and the createdFrom seed
// string so a hygiene scanner can prove this slice is deterministic.

export interface VectorSearchAdapterContract {
  adapterKey: string;
  profile: VectorSearchProviderProfile;
  createdFrom: 'deterministic_vector_search_provider_seed';
  liveBinding: false;
}

// ---------------------------------------------------------------------
// Provider summary (counters used by the readiness tracker)
// ---------------------------------------------------------------------

export interface VectorSearchProviderSummary {
  totalProviders: number;
  totalCapabilities: number;
  totalTenantIsolationModels: number;
  providerKinds: ReadonlyArray<VectorSearchProviderKind>;
  capabilitiesByProvider: Readonly<
    Record<VectorSearchProviderKind, ReadonlyArray<VectorSearchCapability>>
  >;
}

// ---------------------------------------------------------------------
// Canonical provider profiles
// ---------------------------------------------------------------------

const PROFILE_PGVECTOR: VectorSearchProviderProfile = {
  kind: 'pgvector',
  description:
    'Postgres-resident vector index using the pgvector extension. ' +
    'Lives inside the same Postgres data plane the relational rows ' +
    'live in, which makes tenant isolation a row-scope problem on ' +
    'the existing tenant_id column rather than a separate index ' +
    'cluster. Suitable for low-to-medium volume similarity search ' +
    'colocated with transactional data.',
  capabilities: [
    'similarity_search',
    'metadata_filter',
    'tenant_isolation',
    'index_management',
  ],
  tenantIsolationModel: 'logical_namespace',
  auditHooks: [
    'vector_search_request_started',
    'vector_search_request_completed',
    'vector_search_request_refused',
    'vector_index_mutation_recorded',
    'tenant_scope_recorded',
  ],
  requiredEnvVars: ['DATABASE_URL', 'PGVECTOR_INDEX_NAME'],
  liveExecution: false,
};

const PROFILE_AZURE_AI_SEARCH: VectorSearchProviderProfile = {
  kind: 'azure_ai_search',
  description:
    'Azure AI Search service with vector + hybrid (BM25 + vector) ' +
    'search and a managed reranker. Ships an index-per-tenant ' +
    'isolation model so tenant data lives in physically distinct ' +
    'indexes rather than sharing a single namespace. Targeted at ' +
    'enterprise tenants whose private deployment lab requires the ' +
    'Azure VNET reference path (see CLOUD2 / CLOUD5).',
  capabilities: [
    'similarity_search',
    'hybrid_search',
    'metadata_filter',
    'reranking',
    'tenant_isolation',
    'index_management',
  ],
  tenantIsolationModel: 'index_per_tenant',
  auditHooks: [
    'vector_search_request_started',
    'vector_search_request_completed',
    'vector_search_request_refused',
    'hybrid_search_request_recorded',
    'reranker_invocation_recorded',
    'tenant_scope_recorded',
  ],
  requiredEnvVars: [
    'AZURE_AI_SEARCH_ENDPOINT',
    'AZURE_AI_SEARCH_API_KEY',
    'AZURE_AI_SEARCH_INDEX_PREFIX',
  ],
  liveExecution: false,
};

const PROFILE_ALLOYDB_CLOUD_SQL_VECTOR: VectorSearchProviderProfile = {
  kind: 'alloydb_cloud_sql_vector',
  description:
    'AlloyDB / Cloud SQL with the AlloyDB AI vector extension. Lives ' +
    'inside a dedicated Google Cloud Postgres-compatible data plane; ' +
    'tenant isolation can be modeled as a logical namespace on the ' +
    'shared cluster or as a physically separate cluster per tenant ' +
    'depending on the contracted deployment tier. DATA6 carries the ' +
    'logical_namespace baseline for the shared-cluster default; the ' +
    'physical-separation tier is named in the description for the ' +
    'eventual private-deployment matrix.',
  capabilities: [
    'similarity_search',
    'hybrid_search',
    'metadata_filter',
    'tenant_isolation',
    'index_management',
  ],
  tenantIsolationModel: 'logical_namespace',
  auditHooks: [
    'vector_search_request_started',
    'vector_search_request_completed',
    'vector_search_request_refused',
    'vector_index_mutation_recorded',
    'tenant_scope_recorded',
  ],
  requiredEnvVars: [
    'ALLOYDB_CONNECTION_NAME',
    'ALLOYDB_DATABASE_URL',
    'ALLOYDB_VECTOR_INDEX_NAME',
  ],
  liveExecution: false,
};

const PROFILE_PINECONE_LIKE_GENERIC: VectorSearchProviderProfile = {
  kind: 'pinecone_like_generic',
  description:
    'Generic managed vector database with a namespace-per-tenant ' +
    'isolation model and an external HTTPS endpoint. The provider ' +
    'name is deliberately generic; AbarVa never imports a vendor ' +
    'SDK at the architecture layer. The live adapter is responsible ' +
    'for translating the contract into the concrete vendor API.',
  capabilities: [
    'similarity_search',
    'metadata_filter',
    'tenant_isolation',
    'index_management',
  ],
  tenantIsolationModel: 'logical_namespace',
  auditHooks: [
    'vector_search_request_started',
    'vector_search_request_completed',
    'vector_search_request_refused',
    'vector_index_mutation_recorded',
    'tenant_scope_recorded',
  ],
  requiredEnvVars: [
    'GENERIC_VECTOR_PROVIDER_ENDPOINT',
    'GENERIC_VECTOR_PROVIDER_API_KEY',
    'GENERIC_VECTOR_PROVIDER_INDEX',
  ],
  liveExecution: false,
};

// ---------------------------------------------------------------------
// Canonical registry (deterministic, ordered by VECTOR_SEARCH_PROVIDER_KINDS)
// ---------------------------------------------------------------------

const PROVIDER_PROFILES: Readonly<
  Record<VectorSearchProviderKind, VectorSearchProviderProfile>
> = {
  pgvector: PROFILE_PGVECTOR,
  azure_ai_search: PROFILE_AZURE_AI_SEARCH,
  alloydb_cloud_sql_vector: PROFILE_ALLOYDB_CLOUD_SQL_VECTOR,
  pinecone_like_generic: PROFILE_PINECONE_LIKE_GENERIC,
};

// ---------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------

export function listVectorSearchProviders(): ReadonlyArray<VectorSearchProviderProfile> {
  return VECTOR_SEARCH_PROVIDER_KINDS.map((kind) => PROVIDER_PROFILES[kind]);
}

export function buildVectorSearchProviderRegistry(): ReadonlyArray<VectorSearchAdapterContract> {
  return VECTOR_SEARCH_PROVIDER_KINDS.map((kind) => ({
    adapterKey: `vector_search.adapter.${kind}.v1`,
    profile: PROVIDER_PROFILES[kind],
    createdFrom: 'deterministic_vector_search_provider_seed' as const,
    liveBinding: false as const,
  }));
}

export function summarizeVectorSearchProviders(): VectorSearchProviderSummary {
  const capabilitiesByProvider: Record<
    VectorSearchProviderKind,
    ReadonlyArray<VectorSearchCapability>
  > = {
    pgvector: PROFILE_PGVECTOR.capabilities,
    azure_ai_search: PROFILE_AZURE_AI_SEARCH.capabilities,
    alloydb_cloud_sql_vector: PROFILE_ALLOYDB_CLOUD_SQL_VECTOR.capabilities,
    pinecone_like_generic: PROFILE_PINECONE_LIKE_GENERIC.capabilities,
  };
  return {
    totalProviders: VECTOR_SEARCH_PROVIDER_KINDS.length,
    totalCapabilities: VECTOR_SEARCH_CAPABILITIES.length,
    totalTenantIsolationModels:
      VECTOR_SEARCH_TENANT_ISOLATION_MODELS.length,
    providerKinds: VECTOR_SEARCH_PROVIDER_KINDS,
    capabilitiesByProvider,
  };
}

export function getVectorSearchProviderProfile(
  kind: string,
): VectorSearchProviderProfile | null {
  if (typeof kind !== 'string' || kind.length === 0) {
    return null;
  }
  if (
    !VECTOR_SEARCH_PROVIDER_KINDS.includes(kind as VectorSearchProviderKind)
  ) {
    return null;
  }
  return PROVIDER_PROFILES[kind as VectorSearchProviderKind];
}
