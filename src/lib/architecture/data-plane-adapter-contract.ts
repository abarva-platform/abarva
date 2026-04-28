// TEN4 - Data Plane Adapter Contract.
//
// Pure type-only contract module describing the provider-agnostic
// adapter shapes for every component of the AbarVa data plane. TEN4
// ships ZERO runtime behavior - no provider SDK, no fetch, no Date,
// no randomness, no agent / source / sentinel / atlas / nexus / auth
// imports, no UI, no persistence. The contract names the canonical
// adapter kinds (relational store, object store, vector search,
// graph provider, evidence ledger, model gateway provider, audit
// store), the metadata each adapter must declare (provider,
// capabilities, requiredEnvVars, safetyConstraints), the deterministic
// seed example used by reviewers and future provisioning code, the
// summary helper, and the validator helper.
//
// TEN4 lets AbarVa run on shared SaaS, dedicated tenant, or private
// (customer-owned) deployments without changing the runtime: the live
// runtime resolves adapters from a registry; TEN4 names the SHAPE of
// each adapter so the registry contract is honest across deployment
// modes. The matching deployment-mode catalog lives in TEN1; the
// tenant isolation envelope lives in TEN2; the dedicated-tenant
// blueprint lives in TEN3. TEN4 is the per-component shape that any
// adapter (Postgres, Snowflake, S3, Azure Blob, GCS, pgvector, Pinecone,
// Neo4j, the AbarVa evidence ledger, the AbarVa model gateway, the
// AbarVa audit ledger) must implement.
//
// TEN4 explicitly DOES NOT:
//   - import any provider SDK (no openai, no anthropic, no aws-sdk,
//     no @azure/, no @google-cloud/, no pg, no pinecone, no neo4j).
//   - call fetch, Date.now, Math.random, or new Date(.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/atlas/, src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.
//   - mutate any state. Every export is a const literal, an interface,
//     or a pure accessor over the const literals.
//
// TEN4 records adapter SHAPES, not adapter implementations. Live
// adapter classes will land in later slices behind the same shape
// contract.

// ---------------------------------------------------------------------
// Canonical adapter kinds.
// ---------------------------------------------------------------------

export const DATA_PLANE_ADAPTER_KINDS = [
  'relational_store',
  'object_store',
  'vector_search',
  'graph_provider',
  'evidence_ledger',
  'model_gateway_provider',
  'audit_store',
] as const;

export type DataPlaneAdapterKind = (typeof DATA_PLANE_ADAPTER_KINDS)[number];

// ---------------------------------------------------------------------
// Canonical deployment modes the adapter contract must support.
// ---------------------------------------------------------------------

export const DATA_PLANE_DEPLOYMENT_MODES = [
  'shared_saas',
  'dedicated_tenant',
  'private_deployment',
] as const;

export type DataPlaneDeploymentMode =
  (typeof DATA_PLANE_DEPLOYMENT_MODES)[number];

// ---------------------------------------------------------------------
// Adapter base shape - every concrete adapter interface extends this.
// ---------------------------------------------------------------------

export interface DataPlaneAdapterBase {
  /** Stable adapter kind. */
  kind: DataPlaneAdapterKind;
  /** Provider key (provider-agnostic; e.g. 'postgres-flexible',
   *  'azure-blob', 'pgvector', 'pg-graph', 'abarva-evidence-ledger',
   *  'abarva-model-gateway', 'abarva-audit-stream'). */
  provider: string;
  /** Capability tokens this adapter advertises (e.g. 'tenant_bound',
   *  'rls_enforced', 'tenant_namespace', 'managed_identity'). */
  capabilities: ReadonlyArray<string>;
  /** Environment variable keys the live runtime must populate before
   *  the adapter is bound. Names only - never values. */
  requiredEnvVars: ReadonlyArray<string>;
  /** Safety / governance constraints the adapter must honor (e.g.
   *  'tenant_key_required_on_every_call', 'no_cross_tenant_read'). */
  safetyConstraints: ReadonlyArray<string>;
  /** Stable provenance tag - never live runtime origin. */
  createdFrom: 'deterministic_data_plane_adapter_contract_seed';
}

// ---------------------------------------------------------------------
// Per-component adapter contracts.
// ---------------------------------------------------------------------

export interface RelationalStoreAdapter extends DataPlaneAdapterBase {
  kind: 'relational_store';
  /** Whether row-level security is enforced for this adapter. */
  rowLevelSecurity: boolean;
  /** Default tenant binding strategy: per-tenant database, per-tenant
   *  schema, or row-scoped on tenant_id. */
  tenantBindingStrategy:
    | 'per_tenant_database'
    | 'per_tenant_schema'
    | 'row_scoped_on_tenant_id';
}

export interface ObjectStoreAdapter extends DataPlaneAdapterBase {
  kind: 'object_store';
  /** Whether public network access is disabled by default. */
  publicNetworkAccessDisabled: boolean;
  /** Default access strategy: dedicated bucket per tenant, dedicated
   *  prefix per tenant inside a shared bucket, or signed URL only. */
  accessStrategy:
    | 'dedicated_bucket_per_tenant'
    | 'dedicated_prefix_per_tenant'
    | 'signed_url_only';
}

export interface VectorSearchAdapter extends DataPlaneAdapterBase {
  kind: 'vector_search';
  /** Whether the adapter refuses to run without a tenant key. */
  tenantKeyRequired: boolean;
  /** Default namespace strategy: per-tenant namespace inside a shared
   *  index, dedicated index per tenant, or row-scoped pgvector table. */
  namespaceStrategy:
    | 'per_tenant_namespace'
    | 'dedicated_index_per_tenant'
    | 'row_scoped_pgvector';
}

export interface GraphProviderAdapter extends DataPlaneAdapterBase {
  kind: 'graph_provider';
  /** Whether traversals require a tenant predicate. */
  tenantPredicateRequired: boolean;
  /** Default storage strategy: per-tenant graph namespace, dedicated
   *  graph database per tenant, or row-scoped edge table. */
  storageStrategy:
    | 'per_tenant_graph_namespace'
    | 'dedicated_graph_database_per_tenant'
    | 'row_scoped_edge_table';
}

export interface EvidenceLedgerAdapter extends DataPlaneAdapterBase {
  kind: 'evidence_ledger';
  /** Whether every read/write carries the tenant key. */
  tenantKeyOnEveryEntry: boolean;
  /** Default retention strategy: tenant-contracted retention, default
   *  365 days, or per-evidence retention. */
  retentionStrategy:
    | 'tenant_contracted_retention'
    | 'default_365_day_retention'
    | 'per_evidence_retention';
}

export interface ModelGatewayProviderAdapter extends DataPlaneAdapterBase {
  kind: 'model_gateway_provider';
  /** Whether the adapter routes through the AbarVa model gateway
   *  (true) or is a raw provider adapter the gateway wraps (false).
   *  Raw provider adapters MUST NOT be invoked outside the gateway. */
  routesThroughAbarvaGateway: boolean;
  /** Default tier policy: per-tenant allowlist, shared image with
   *  per-tenant routing keys, or local-only. */
  tierPolicy:
    | 'per_tenant_allowlist'
    | 'shared_image_with_tenant_routing'
    | 'local_only';
}

export interface AuditStoreAdapter extends DataPlaneAdapterBase {
  kind: 'audit_store';
  /** Whether every audit row carries the tenant key. */
  tenantKeyOnEveryRow: boolean;
  /** Default boundary strategy: dedicated tenant stream, row-scoped
   *  shared ledger with tenant filter, or append-only ledger. */
  boundaryStrategy:
    | 'dedicated_tenant_stream'
    | 'row_scoped_shared_ledger'
    | 'append_only_ledger';
}

// ---------------------------------------------------------------------
// Discriminated union covering every canonical adapter kind.
// ---------------------------------------------------------------------

export type DataPlaneAdapter =
  | RelationalStoreAdapter
  | ObjectStoreAdapter
  | VectorSearchAdapter
  | GraphProviderAdapter
  | EvidenceLedgerAdapter
  | ModelGatewayProviderAdapter
  | AuditStoreAdapter;

// ---------------------------------------------------------------------
// Validation finding type.
// ---------------------------------------------------------------------

export type DataPlaneAdapterFindingSeverity = 'info' | 'warning' | 'error';

export interface DataPlaneAdapterFinding {
  ref: string;
  severity: DataPlaneAdapterFindingSeverity;
  reason: string;
}

// ---------------------------------------------------------------------
// Summary type.
// ---------------------------------------------------------------------

export interface DataPlaneAdapterSummary {
  totalAdapters: number;
  adapterKindsCovered: ReadonlyArray<DataPlaneAdapterKind>;
  adaptersByKind: Record<DataPlaneAdapterKind, number>;
  providersByKind: Record<DataPlaneAdapterKind, ReadonlyArray<string>>;
  totalRequiredEnvVars: number;
  totalSafetyConstraints: number;
}

// ---------------------------------------------------------------------
// Deterministic seed adapters.
// ---------------------------------------------------------------------

const SEED_RELATIONAL: RelationalStoreAdapter = {
  kind: 'relational_store',
  provider: 'postgres-flexible',
  capabilities: [
    'tenant_bound',
    'rls_enforced',
    'managed_identity',
    'point_in_time_recovery',
  ],
  requiredEnvVars: [
    'DATA_PLANE_RELATIONAL_HOST',
    'DATA_PLANE_RELATIONAL_DATABASE',
    'DATA_PLANE_RELATIONAL_USER',
  ],
  safetyConstraints: [
    'tenant_key_required_on_every_query',
    'no_cross_tenant_read',
    'shared_pool_clients_forbidden',
    'connection_helper_is_only_entry_point',
  ],
  rowLevelSecurity: true,
  tenantBindingStrategy: 'per_tenant_database',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_OBJECT_STORE: ObjectStoreAdapter = {
  kind: 'object_store',
  provider: 'azure-blob',
  capabilities: [
    'tenant_bound',
    'managed_identity',
    'private_endpoint',
    'soft_delete',
  ],
  requiredEnvVars: [
    'DATA_PLANE_OBJECT_STORE_ACCOUNT',
    'DATA_PLANE_OBJECT_STORE_CONTAINER',
  ],
  safetyConstraints: [
    'public_network_access_disabled',
    'signed_urls_tenant_scoped',
    'no_cross_tenant_signed_url',
    'managed_identity_only',
  ],
  publicNetworkAccessDisabled: true,
  accessStrategy: 'dedicated_bucket_per_tenant',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_VECTOR_SEARCH: VectorSearchAdapter = {
  kind: 'vector_search',
  provider: 'pgvector',
  capabilities: [
    'tenant_namespace',
    'cosine_similarity',
    'hybrid_search',
    'embedding_versioned',
  ],
  requiredEnvVars: [
    'DATA_PLANE_VECTOR_HOST',
    'DATA_PLANE_VECTOR_DATABASE',
  ],
  safetyConstraints: [
    'tenant_key_required_on_every_query',
    'empty_tenant_key_refused',
    'no_cross_tenant_retrieval',
    'evidence_basis_recorded_on_use',
  ],
  tenantKeyRequired: true,
  namespaceStrategy: 'per_tenant_namespace',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_GRAPH_PROVIDER: GraphProviderAdapter = {
  kind: 'graph_provider',
  provider: 'pg-graph',
  capabilities: [
    'tenant_namespace',
    'directed_edges',
    'tenant_predicate_indexed',
  ],
  requiredEnvVars: [
    'DATA_PLANE_GRAPH_HOST',
    'DATA_PLANE_GRAPH_DATABASE',
  ],
  safetyConstraints: [
    'tenant_predicate_required_on_every_traversal',
    'empty_tenant_key_refused',
    'no_cross_tenant_traversal',
    'graph_writes_audited',
  ],
  tenantPredicateRequired: true,
  storageStrategy: 'per_tenant_graph_namespace',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_EVIDENCE_LEDGER: EvidenceLedgerAdapter = {
  kind: 'evidence_ledger',
  provider: 'abarva-evidence-ledger',
  capabilities: [
    'tenant_bound',
    'append_only',
    'lifecycle_tracked',
    'claim_support_evaluator_compatible',
  ],
  requiredEnvVars: [
    'DATA_PLANE_EVIDENCE_LEDGER_HOST',
    'DATA_PLANE_EVIDENCE_LEDGER_DATABASE',
  ],
  safetyConstraints: [
    'tenant_key_on_every_entry',
    'no_fabricated_evidence_id',
    'no_cross_tenant_evidence_read',
    'lifecycle_state_change_audited',
  ],
  tenantKeyOnEveryEntry: true,
  retentionStrategy: 'tenant_contracted_retention',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_MODEL_GATEWAY_PROVIDER: ModelGatewayProviderAdapter = {
  kind: 'model_gateway_provider',
  provider: 'abarva-model-gateway',
  capabilities: [
    'tenant_bound_policy',
    'allowlist_enforced',
    'rate_limited',
    'audited_on_every_call',
  ],
  requiredEnvVars: [
    'DATA_PLANE_GATEWAY_HOST',
    'DATA_PLANE_GATEWAY_TENANT_POLICY_REGISTRY',
  ],
  safetyConstraints: [
    'tenant_key_required_on_every_invocation',
    'no_provider_sdk_outside_gateway',
    'allowlist_enforced_per_tenant',
    'cost_estimate_recorded_per_invocation',
  ],
  routesThroughAbarvaGateway: true,
  tierPolicy: 'per_tenant_allowlist',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_AUDIT_STORE: AuditStoreAdapter = {
  kind: 'audit_store',
  provider: 'abarva-audit-stream',
  capabilities: [
    'tenant_bound',
    'append_only',
    'tenant_scoped_export',
    'retention_configurable',
  ],
  requiredEnvVars: [
    'DATA_PLANE_AUDIT_HOST',
    'DATA_PLANE_AUDIT_STREAM',
  ],
  safetyConstraints: [
    'tenant_key_on_every_row',
    'readers_require_tenant_filter',
    'export_refuses_empty_tenant_key',
    'no_cross_tenant_audit_read',
  ],
  tenantKeyOnEveryRow: true,
  boundaryStrategy: 'dedicated_tenant_stream',
  createdFrom: 'deterministic_data_plane_adapter_contract_seed',
};

const SEED_ADAPTERS: ReadonlyArray<DataPlaneAdapter> = [
  SEED_RELATIONAL,
  SEED_OBJECT_STORE,
  SEED_VECTOR_SEARCH,
  SEED_GRAPH_PROVIDER,
  SEED_EVIDENCE_LEDGER,
  SEED_MODEL_GATEWAY_PROVIDER,
  SEED_AUDIT_STORE,
];

// ---------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------

export function listDataPlaneAdapterKinds(): ReadonlyArray<DataPlaneAdapterKind> {
  return DATA_PLANE_ADAPTER_KINDS;
}

export function listDataPlaneDeploymentModes(): ReadonlyArray<DataPlaneDeploymentMode> {
  return DATA_PLANE_DEPLOYMENT_MODES;
}

export function buildDataPlaneAdapterContractSeed(): ReadonlyArray<DataPlaneAdapter> {
  return SEED_ADAPTERS;
}

function emptyByKind<T>(zero: T): Record<DataPlaneAdapterKind, T> {
  const out = {} as Record<DataPlaneAdapterKind, T>;
  for (const kind of DATA_PLANE_ADAPTER_KINDS) {
    out[kind] = zero;
  }
  return out;
}

function emptyProvidersByKind(): Record<DataPlaneAdapterKind, string[]> {
  const out = {} as Record<DataPlaneAdapterKind, string[]>;
  for (const kind of DATA_PLANE_ADAPTER_KINDS) {
    out[kind] = [];
  }
  return out;
}

export function summarizeDataPlaneAdapters(
  adapters: ReadonlyArray<DataPlaneAdapter> = SEED_ADAPTERS,
): DataPlaneAdapterSummary {
  const adaptersByKind = emptyByKind<number>(0);
  const providersByKindMutable = emptyProvidersByKind();
  let totalRequiredEnvVars = 0;
  let totalSafetyConstraints = 0;

  for (const adapter of adapters) {
    adaptersByKind[adapter.kind] += 1;
    if (!providersByKindMutable[adapter.kind].includes(adapter.provider)) {
      providersByKindMutable[adapter.kind].push(adapter.provider);
    }
    totalRequiredEnvVars += adapter.requiredEnvVars.length;
    totalSafetyConstraints += adapter.safetyConstraints.length;
  }

  const adapterKindsCovered = adapters
    .map((adapter) => adapter.kind)
    .filter((kind, index, arr) => arr.indexOf(kind) === index);

  const providersByKind = {} as Record<
    DataPlaneAdapterKind,
    ReadonlyArray<string>
  >;
  for (const kind of DATA_PLANE_ADAPTER_KINDS) {
    providersByKind[kind] = providersByKindMutable[kind];
  }

  return {
    totalAdapters: adapters.length,
    adapterKindsCovered,
    adaptersByKind,
    providersByKind,
    totalRequiredEnvVars,
    totalSafetyConstraints,
  };
}

function pushFinding(
  findings: DataPlaneAdapterFinding[],
  ref: string,
  reason: string,
): void {
  findings.push({ ref, severity: 'error', reason });
}

export function validateDataPlaneAdapter(adapter: DataPlaneAdapter): {
  isValid: boolean;
  findings: ReadonlyArray<DataPlaneAdapterFinding>;
} {
  const findings: DataPlaneAdapterFinding[] = [];
  const ref = `${adapter.kind}:${adapter.provider}`;

  if (!DATA_PLANE_ADAPTER_KINDS.includes(adapter.kind)) {
    pushFinding(findings, ref, `unknown adapter kind: ${String(adapter.kind)}`);
  }
  if (typeof adapter.provider !== 'string' || adapter.provider.length === 0) {
    pushFinding(findings, ref, 'provider must be a non-empty string');
  }
  if (!Array.isArray(adapter.capabilities) || adapter.capabilities.length === 0) {
    pushFinding(findings, ref, 'capabilities must be a non-empty array');
  }
  if (
    !Array.isArray(adapter.requiredEnvVars) ||
    adapter.requiredEnvVars.length === 0
  ) {
    pushFinding(findings, ref, 'requiredEnvVars must be a non-empty array');
  }
  if (
    !Array.isArray(adapter.safetyConstraints) ||
    adapter.safetyConstraints.length === 0
  ) {
    pushFinding(findings, ref, 'safetyConstraints must be a non-empty array');
  }
  if (
    adapter.createdFrom !== 'deterministic_data_plane_adapter_contract_seed'
  ) {
    pushFinding(
      findings,
      ref,
      'createdFrom must be deterministic_data_plane_adapter_contract_seed',
    );
  }

  for (const envVar of adapter.requiredEnvVars) {
    if (typeof envVar !== 'string' || envVar.length === 0) {
      pushFinding(findings, ref, 'requiredEnvVars entries must be non-empty strings');
    }
  }
  for (const constraint of adapter.safetyConstraints) {
    if (typeof constraint !== 'string' || constraint.length === 0) {
      pushFinding(
        findings,
        ref,
        'safetyConstraints entries must be non-empty strings',
      );
    }
  }

  return {
    isValid: findings.every((finding) => finding.severity !== 'error'),
    findings,
  };
}
