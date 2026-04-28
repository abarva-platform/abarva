// GRAPH1 - Graph Provider Contract + Relationship Fallback.
//
// Deterministic, file-pure read model that names the canonical graph
// provider kinds and capabilities the AbarVa Knowledge Fabric must
// support, and documents the relational-table fallback shape used
// when a tenant runs without a real graph database.
//
// GRAPH1 is a *shape* contract. It is the read-only complement to
// TEN2 (tenant isolation data boundary model, which already names a
// `graph` boundary kind), to ARCH1 architecture canon, and to the
// future Knowledge Fabric runtime slice. It does not connect to any
// graph database, does not run any traversal, and does not generate
// or execute SQL. It exists to make the provider envelope and the
// relational fallback shape visible as typed objects so reviewers,
// production-readiness checklists, and future enforcement code can
// agree on the same structural model.
//
// Hard rules (also asserted by the test):
//   - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
//   - No imports from `@/lib/auth/**`, `@/lib/source/**`,
//     `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/nexus/**`,
//     `@/lib/agent/**`, or any supabase / prisma client.
//   - No vendor model name (`anthropic`, `openai`, etc.) appears.
//   - The relational fallback schema is a deterministic SQL-like
//     description, not executable SQL. No `CREATE TABLE` statements
//     are emitted; the description is a typed object the future
//     migration slice will lower into actual DDL.
//   - No false claim that a live graph database is wired today.
//     `postgres_relationship_fallback` is the documented default for
//     tenants without a real graph DB; every other provider kind
//     records `runtimeStatus: 'contract_only'`.

// ---------------------------------------------------------------------
// Canonical provider kinds.
// ---------------------------------------------------------------------

export const GRAPH_PROVIDER_KINDS = [
  'neo4j',
  'cosmos_db_gremlin',
  'neptune',
  'postgres_relationship_fallback',
] as const;

export type GraphProviderKind = (typeof GRAPH_PROVIDER_KINDS)[number];

// ---------------------------------------------------------------------
// Canonical query capabilities a Knowledge Fabric provider may expose.
// ---------------------------------------------------------------------

export const GRAPH_QUERY_CAPABILITIES = [
  'shortest_path',
  'multi_hop_traversal',
  'subgraph_extract',
  'relationship_count',
  'pattern_match',
  'tenant_scoped_query',
] as const;

export type GraphQueryCapability = (typeof GRAPH_QUERY_CAPABILITIES)[number];

// ---------------------------------------------------------------------
// Provider runtime status.
//
// Conservative ladder; mirrors TEN2's TenantBoundaryStatus so the two
// read models can be reviewed side-by-side.
// ---------------------------------------------------------------------

export type GraphProviderRuntimeStatus =
  | 'contract_only'
  | 'partial_runtime'
  | 'enforced_runtime'
  | 'deferred';

// ---------------------------------------------------------------------
// Provider profile shape.
// ---------------------------------------------------------------------

export interface GraphProviderProfile {
  /** Canonical provider kind. */
  kind: GraphProviderKind;
  /** Human label for admin / readiness surfaces. */
  label: string;
  /** Provider family / vendor descriptor (no live SDK reference). */
  family: string;
  /** Whether this provider is the documented fallback. */
  isFallback: boolean;
  /** Capabilities the provider advertises in this contract. */
  capabilities: readonly GraphQueryCapability[];
  /** Tenant-key property required on every node and edge. */
  tenantKeyProperty: string;
  /** Whether tenant key must be enforced on every traversal. */
  requiresTenantKeyOnTraversal: boolean;
  /** Implementation status of the provider today. */
  runtimeStatus: GraphProviderRuntimeStatus;
  /** Residual risk if this provider is selected without mitigation. */
  risk: string;
  /** Mitigation that must remain in place to keep the provider honest. */
  mitigation: string;
  /** Audit requirement that must record any cross-provider action. */
  auditRequirement: string;
  /** Stable provenance flag: never claim live runtime origin. */
  createdFrom: 'deterministic_graph_provider_contract_seed';
}

// ---------------------------------------------------------------------
// Relationship fallback table shape.
//
// The fallback runs on Postgres. Every fallback table is a typed
// description (column name, column type family, nullability, purpose);
// no DDL is emitted. The future migration slice will lower this
// description into a real CREATE TABLE.
// ---------------------------------------------------------------------

export type GraphFallbackColumnTypeFamily =
  | 'tenant_key'
  | 'identifier'
  | 'short_text'
  | 'long_text'
  | 'integer'
  | 'boolean'
  | 'json'
  | 'timestamp_logical';

export interface GraphFallbackColumn {
  name: string;
  typeFamily: GraphFallbackColumnTypeFamily;
  nullable: boolean;
  purpose: string;
}

export interface GraphRelationshipFallbackTable {
  /** Stable name of the fallback table. */
  tableName: string;
  /** Whether this table holds nodes or edges. */
  role: 'node' | 'edge';
  /** Tenant-key column name (always present, never null). */
  tenantKeyColumn: string;
  /** Columns the table declares, in canonical order. */
  columns: readonly GraphFallbackColumn[];
  /** Indexes the migration slice must declare. */
  indexes: readonly string[];
  /** Why this table exists in the fallback model. */
  purpose: string;
  /** Stable provenance flag. */
  createdFrom: 'deterministic_graph_provider_contract_seed';
}

export interface GraphRelationshipFallbackSchema {
  /** Stable schema name (logical, not the live Postgres schema). */
  schemaName: string;
  /** Tables in the fallback schema, in canonical order. */
  tables: readonly GraphRelationshipFallbackTable[];
  /** Tenant-isolation invariant the migration slice must enforce. */
  tenantIsolationInvariant: string;
  /** Stable provenance flag. */
  createdFrom: 'deterministic_graph_provider_contract_seed';
}

// ---------------------------------------------------------------------
// Summary type.
// ---------------------------------------------------------------------

export interface GraphProviderSummary {
  totalProviders: number;
  totalCapabilities: number;
  fallbackProviderKind: GraphProviderKind;
  byRuntimeStatus: Record<GraphProviderRuntimeStatus, number>;
  capabilityCoverage: Record<GraphQueryCapability, number>;
  providersWithTenantScopedQuery: number;
}

// ---------------------------------------------------------------------
// Seed providers.
//
// Coverage matrix:
//   - Every GraphProviderKind appears exactly once.
//   - Every GraphQueryCapability appears at least once across the seed.
//   - postgres_relationship_fallback is the documented isFallback: true
//     option; every other provider records runtimeStatus contract_only.
// ---------------------------------------------------------------------

const SEED_PROVIDERS: readonly GraphProviderProfile[] = [
  {
    kind: 'neo4j',
    label: 'Neo4j managed graph database',
    family: 'labeled-property-graph',
    isFallback: false,
    capabilities: [
      'shortest_path',
      'multi_hop_traversal',
      'subgraph_extract',
      'relationship_count',
      'pattern_match',
      'tenant_scoped_query',
    ],
    tenantKeyProperty: 'tenant_key',
    requiresTenantKeyOnTraversal: true,
    runtimeStatus: 'contract_only',
    risk: 'Cross-tenant traversal if a Cypher query forgets the tenant_key predicate or a node is written without a tenant_key property.',
    mitigation: 'Cypher helpers must take tenant_key as a required argument and refuse to run when tenant_key is empty; every node and edge write must set tenant_key.',
    auditRequirement: 'Every Cypher invocation must emit a tool_invocation audit event with tenantKey and the query shape.',
    createdFrom: 'deterministic_graph_provider_contract_seed',
  },
  {
    kind: 'cosmos_db_gremlin',
    label: 'Azure Cosmos DB Gremlin API',
    family: 'gremlin-property-graph',
    isFallback: false,
    capabilities: [
      'shortest_path',
      'multi_hop_traversal',
      'subgraph_extract',
      'relationship_count',
      'pattern_match',
      'tenant_scoped_query',
    ],
    tenantKeyProperty: 'tenant_key',
    requiresTenantKeyOnTraversal: true,
    runtimeStatus: 'contract_only',
    risk: 'Cross-tenant traversal across a Cosmos partition if the partition key is not bound to tenant_key or a Gremlin step omits the tenant predicate.',
    mitigation: 'Cosmos partition key must be bound to tenant_key; Gremlin helpers must inject the tenant predicate at the first traversal step and refuse empty tenant_key.',
    auditRequirement: 'Every Gremlin traversal must emit a tool_invocation audit event with tenantKey and the partition key bound to the tenant.',
    createdFrom: 'deterministic_graph_provider_contract_seed',
  },
  {
    kind: 'neptune',
    label: 'AWS Neptune managed graph database',
    family: 'gremlin-and-sparql-property-graph',
    isFallback: false,
    capabilities: [
      'shortest_path',
      'multi_hop_traversal',
      'subgraph_extract',
      'relationship_count',
      'pattern_match',
      'tenant_scoped_query',
    ],
    tenantKeyProperty: 'tenant_key',
    requiresTenantKeyOnTraversal: true,
    runtimeStatus: 'contract_only',
    risk: 'Cross-tenant traversal if a Neptune Gremlin or SPARQL query is issued without the tenant predicate, or if IAM lets a tenant role read the cluster without a per-tenant filter.',
    mitigation: 'Neptune helpers must inject the tenant predicate; cluster IAM must scope tenant roles to a tenant-bound query helper that refuses empty tenant_key.',
    auditRequirement: 'Every Neptune query must emit a tool_invocation audit event with tenantKey and the query shape.',
    createdFrom: 'deterministic_graph_provider_contract_seed',
  },
  {
    kind: 'postgres_relationship_fallback',
    label: 'Postgres relationship-table fallback',
    family: 'relational-edge-table',
    isFallback: true,
    capabilities: [
      'multi_hop_traversal',
      'relationship_count',
      'tenant_scoped_query',
    ],
    tenantKeyProperty: 'tenant_key',
    requiresTenantKeyOnTraversal: true,
    runtimeStatus: 'partial_runtime',
    risk: 'A relational fallback that omits the tenant_key filter on a recursive CTE could leak cross-tenant edges; deep traversals are also expensive without a graph index.',
    mitigation: 'Every fallback query must filter on tenant_key at every CTE step; helpers must reject empty tenant_key and cap traversal depth conservatively.',
    auditRequirement: 'Every fallback traversal must emit a tool_invocation audit event with tenantKey and the depth bound applied to the recursive CTE.',
    createdFrom: 'deterministic_graph_provider_contract_seed',
  },
];

// ---------------------------------------------------------------------
// Helpers - all return readonly views.
// ---------------------------------------------------------------------

export function listGraphProviders(): readonly GraphProviderKind[] {
  return GRAPH_PROVIDER_KINDS;
}

export function buildGraphProviderRegistry(): readonly GraphProviderProfile[] {
  return SEED_PROVIDERS;
}

function emptyByRuntimeStatus(): Record<GraphProviderRuntimeStatus, number> {
  return {
    contract_only: 0,
    partial_runtime: 0,
    enforced_runtime: 0,
    deferred: 0,
  };
}

function emptyCapabilityCoverage(): Record<GraphQueryCapability, number> {
  const out = {} as Record<GraphQueryCapability, number>;
  for (const capability of GRAPH_QUERY_CAPABILITIES) {
    out[capability] = 0;
  }
  return out;
}

export function summarizeGraphProviders(
  providers: readonly GraphProviderProfile[] = SEED_PROVIDERS,
): GraphProviderSummary {
  const byRuntimeStatus = emptyByRuntimeStatus();
  const capabilityCoverage = emptyCapabilityCoverage();
  let providersWithTenantScopedQuery = 0;
  let fallbackProviderKind: GraphProviderKind = 'postgres_relationship_fallback';

  for (const provider of providers) {
    byRuntimeStatus[provider.runtimeStatus] += 1;
    for (const capability of provider.capabilities) {
      capabilityCoverage[capability] += 1;
    }
    if (provider.capabilities.includes('tenant_scoped_query')) {
      providersWithTenantScopedQuery += 1;
    }
    if (provider.isFallback) {
      fallbackProviderKind = provider.kind;
    }
  }

  return {
    totalProviders: providers.length,
    totalCapabilities: GRAPH_QUERY_CAPABILITIES.length,
    fallbackProviderKind,
    byRuntimeStatus,
    capabilityCoverage,
    providersWithTenantScopedQuery,
  };
}

// ---------------------------------------------------------------------
// Relational fallback schema description (NOT executable SQL).
//
// The schema is the deterministic shape the future migration slice
// will lower into a real CREATE TABLE. Three tables: nodes, edges,
// and an audit-companion edge-version table that lets the fallback
// participate in tenant-scoped audit replay.
// ---------------------------------------------------------------------

const FALLBACK_NODES_TABLE: GraphRelationshipFallbackTable = {
  tableName: 'graph_fallback_nodes',
  role: 'node',
  tenantKeyColumn: 'tenant_key',
  columns: [
    {
      name: 'tenant_key',
      typeFamily: 'tenant_key',
      nullable: false,
      purpose: 'Tenant scope; every node row must carry tenant_key and every read must filter on it.',
    },
    {
      name: 'node_id',
      typeFamily: 'identifier',
      nullable: false,
      purpose: 'Stable per-tenant node identifier; primary key together with tenant_key.',
    },
    {
      name: 'node_kind',
      typeFamily: 'short_text',
      nullable: false,
      purpose: 'Node kind drawn from a closed vocabulary (e.g. program, dataset, deliverable).',
    },
    {
      name: 'label',
      typeFamily: 'short_text',
      nullable: false,
      purpose: 'Human label for review and admin surfaces.',
    },
    {
      name: 'properties_json',
      typeFamily: 'json',
      nullable: false,
      purpose: 'Typed-shape properties; redaction rules apply before any model gateway hand-off.',
    },
    {
      name: 'created_at_logical',
      typeFamily: 'timestamp_logical',
      nullable: false,
      purpose: 'Deterministic logical timestamp written at ingest; never derived from Date.now in this contract module.',
    },
  ],
  indexes: [
    'idx_graph_fallback_nodes_tenant_key',
    'idx_graph_fallback_nodes_tenant_key_node_kind',
  ],
  purpose: 'Stores Knowledge Fabric nodes for tenants without a real graph database.',
  createdFrom: 'deterministic_graph_provider_contract_seed',
};

const FALLBACK_EDGES_TABLE: GraphRelationshipFallbackTable = {
  tableName: 'graph_fallback_edges',
  role: 'edge',
  tenantKeyColumn: 'tenant_key',
  columns: [
    {
      name: 'tenant_key',
      typeFamily: 'tenant_key',
      nullable: false,
      purpose: 'Tenant scope; every edge row must carry tenant_key and every traversal must filter on it.',
    },
    {
      name: 'edge_id',
      typeFamily: 'identifier',
      nullable: false,
      purpose: 'Stable per-tenant edge identifier; primary key together with tenant_key.',
    },
    {
      name: 'from_node_id',
      typeFamily: 'identifier',
      nullable: false,
      purpose: 'Source node identifier; foreign key to graph_fallback_nodes (tenant_key, node_id).',
    },
    {
      name: 'to_node_id',
      typeFamily: 'identifier',
      nullable: false,
      purpose: 'Target node identifier; foreign key to graph_fallback_nodes (tenant_key, node_id).',
    },
    {
      name: 'relationship_kind',
      typeFamily: 'short_text',
      nullable: false,
      purpose: 'Relationship kind drawn from a closed vocabulary (e.g. supports, blocks, uses_dataset).',
    },
    {
      name: 'properties_json',
      typeFamily: 'json',
      nullable: false,
      purpose: 'Typed-shape edge properties; redaction rules apply before any model gateway hand-off.',
    },
    {
      name: 'is_active',
      typeFamily: 'boolean',
      nullable: false,
      purpose: 'Soft-delete flag so traversal helpers can ignore retired edges without a destructive write.',
    },
    {
      name: 'created_at_logical',
      typeFamily: 'timestamp_logical',
      nullable: false,
      purpose: 'Deterministic logical timestamp written at ingest; never derived from Date.now in this contract module.',
    },
  ],
  indexes: [
    'idx_graph_fallback_edges_tenant_key',
    'idx_graph_fallback_edges_tenant_key_from_node_id',
    'idx_graph_fallback_edges_tenant_key_to_node_id',
    'idx_graph_fallback_edges_tenant_key_relationship_kind',
  ],
  purpose: 'Stores Knowledge Fabric edges for tenants without a real graph database; recursive CTE traversals filter on tenant_key at every step.',
  createdFrom: 'deterministic_graph_provider_contract_seed',
};

const FALLBACK_EDGE_VERSIONS_TABLE: GraphRelationshipFallbackTable = {
  tableName: 'graph_fallback_edge_versions',
  role: 'edge',
  tenantKeyColumn: 'tenant_key',
  columns: [
    {
      name: 'tenant_key',
      typeFamily: 'tenant_key',
      nullable: false,
      purpose: 'Tenant scope; every version row must carry tenant_key.',
    },
    {
      name: 'edge_id',
      typeFamily: 'identifier',
      nullable: false,
      purpose: 'Edge identifier this version row covers.',
    },
    {
      name: 'version_index',
      typeFamily: 'integer',
      nullable: false,
      purpose: 'Monotonic per-edge version counter; increments on every property or activity change.',
    },
    {
      name: 'change_reason',
      typeFamily: 'long_text',
      nullable: false,
      purpose: 'Why the edge was changed; carried into audit replay so reviewers can reconstruct intent.',
    },
    {
      name: 'recorded_at_logical',
      typeFamily: 'timestamp_logical',
      nullable: false,
      purpose: 'Deterministic logical timestamp; never derived from Date.now in this contract module.',
    },
  ],
  indexes: [
    'idx_graph_fallback_edge_versions_tenant_key',
    'idx_graph_fallback_edge_versions_tenant_key_edge_id',
  ],
  purpose: 'Provides an append-only version trail so the fallback can participate in tenant-scoped audit replay alongside the unified audit ledger.',
  createdFrom: 'deterministic_graph_provider_contract_seed',
};

const FALLBACK_SCHEMA: GraphRelationshipFallbackSchema = {
  schemaName: 'knowledge_fabric_fallback',
  tables: [
    FALLBACK_NODES_TABLE,
    FALLBACK_EDGES_TABLE,
    FALLBACK_EDGE_VERSIONS_TABLE,
  ],
  tenantIsolationInvariant:
    'Every read, write, and recursive CTE traversal across knowledge_fabric_fallback tables must filter on tenant_key at every step; helpers must refuse empty tenant_key.',
  createdFrom: 'deterministic_graph_provider_contract_seed',
};

export function buildRelationshipFallbackSchema(): GraphRelationshipFallbackSchema {
  return FALLBACK_SCHEMA;
}
