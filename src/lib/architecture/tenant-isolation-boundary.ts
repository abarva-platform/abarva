// TEN2 - Tenant Isolation Data Boundary Model.
//
// Deterministic, file-pure read model that documents the canonical
// tenant isolation boundary stack across persistence, vector indexes,
// graph stores, model gateway invocations, and audit events.
//
// TEN2 is a *shape* contract. It is the read-only complement to S7
// (tenant isolation decision probes) and the ADM3 / EVID2 / AUD2
// read models. It does not authenticate, does not run RLS, does not
// migrate, and does not call any vendor SDK. It exists to make the
// isolation envelope visible as a typed object so reviewers,
// production-readiness checklists, and future enforcement code can
// agree on the same structural model.
//
// Hard rules (also asserted by the test):
//   - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
//   - No imports from `@/lib/auth/**`, `@/lib/source/**`,
//     `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/nexus/**`,
//     `@/lib/agent/**`, or any supabase client.
//   - No vendor model name (`anthropic`, `openai`, etc.) appears.
//   - No false claim that production tenant isolation is complete.
//     Every boundary records its own residual `risk` and a
//     `mitigation` paragraph that names the next required step.

// ---------------------------------------------------------------------
// Canonical isolation level ladder (order is contract, weakest to
// strongest).
// ---------------------------------------------------------------------

export const TENANT_ISOLATION_LEVELS = [
  'logical_row_level',
  'schema_isolated',
  'database_isolated',
  'environment_isolated',
  'customer_private_data_plane',
] as const;

export type TenantIsolationLevel = typeof TENANT_ISOLATION_LEVELS[number];

// ---------------------------------------------------------------------
// Typed boundary surfaces.
// ---------------------------------------------------------------------

export type TenantBoundaryStatus =
  | 'contract_only'
  | 'partial_runtime'
  | 'enforced_runtime'
  | 'deferred';

export interface TenantIsolationBoundaryBase {
  /** Stable id for the boundary (not a tenant id). */
  id: string;
  /** Human label, used in admin / readiness surfaces. */
  label: string;
  /** Where the boundary lives in the stack. */
  surface: string;
  /** Current isolation level for this boundary. */
  isolationLevel: TenantIsolationLevel;
  /** Implementation status of the boundary today. */
  status: TenantBoundaryStatus;
  /** Residual risk if this boundary fails. */
  risk: string;
  /** Mitigation that must remain in place to keep the boundary honest. */
  mitigation: string;
  /** Audit requirement that must record any cross-boundary action. */
  auditRequirement: string;
  /** Stable provenance flag: never claim live runtime origin. */
  createdFrom: 'deterministic_tenant_isolation_seed';
}

export interface TenantStorageBoundary extends TenantIsolationBoundaryBase {
  kind: 'storage';
  /** Physical / logical store covered (e.g. `postgres.public`). */
  store: string;
  /** Whether row-level security is the enforcement strategy. */
  rowLevelSecurityRequired: boolean;
  /** Tenant key column name expected on every tenant-scoped row. */
  tenantKeyColumn: string;
}

export interface TenantVectorBoundary extends TenantIsolationBoundaryBase {
  kind: 'vector';
  /** Vector index family (e.g. `pgvector`, `qdrant`). Generic on purpose. */
  indexFamily: string;
  /** Mandatory metadata filter that must be applied at query time. */
  mandatoryFilterField: string;
}

export interface TenantGraphBoundary extends TenantIsolationBoundaryBase {
  kind: 'graph';
  /** Graph store family (e.g. `pg-graph`, `apache-age`). */
  graphFamily: string;
  /** Node-level tenant property required on every tenant-scoped node. */
  tenantPropertyName: string;
}

export interface TenantModelGatewayBoundary extends TenantIsolationBoundaryBase {
  kind: 'model_gateway';
  /** Whether tenant key must be present on every gateway invocation. */
  tenantKeyRequiredOnInvocation: boolean;
  /** Whether the gateway must reject calls with an empty tenant key. */
  rejectEmptyTenantKey: boolean;
}

export interface TenantAuditBoundary extends TenantIsolationBoundaryBase {
  kind: 'audit';
  /** Audit event types that must always carry a tenant key. */
  tenantScopedEventTypes: readonly string[];
}

export type TenantDataBoundary =
  | TenantStorageBoundary
  | TenantVectorBoundary
  | TenantGraphBoundary
  | TenantModelGatewayBoundary
  | TenantAuditBoundary;

// ---------------------------------------------------------------------
// Validation finding type.
// ---------------------------------------------------------------------

export type TenantIsolationFindingSeverity =
  | 'info'
  | 'warning'
  | 'error';

export interface TenantIsolationFinding {
  boundaryId: string;
  severity: TenantIsolationFindingSeverity;
  reason: string;
}

// ---------------------------------------------------------------------
// Summary type.
// ---------------------------------------------------------------------

export interface TenantIsolationSummary {
  totalBoundaries: number;
  byKind: Record<TenantDataBoundary['kind'], number>;
  byIsolationLevel: Record<TenantIsolationLevel, number>;
  byStatus: Record<TenantBoundaryStatus, number>;
  boundariesWithAuditRequirement: number;
  boundariesWithMitigation: number;
}

// ---------------------------------------------------------------------
// Seed boundaries.
//
// Coverage matrix:
//   - Every `kind` (storage, vector, graph, model_gateway, audit) is
//     represented at least once.
//   - Every TenantIsolationLevel value appears at least once across
//     the seed.
//   - Every boundary records risk + mitigation + auditRequirement.
//   - No boundary is marked `enforced_runtime` for surfaces that are
//     not actually production-enforced today; partial / contract-only
//     statuses are used conservatively.
// ---------------------------------------------------------------------

const SEED_BOUNDARIES: readonly TenantDataBoundary[] = [
  // ---- storage --------------------------------------------------------
  {
    kind: 'storage',
    id: 'storage-postgres-tenant-rows',
    label: 'Postgres tenant-scoped row storage',
    surface: 'persistence.postgres.public',
    store: 'postgres.public',
    rowLevelSecurityRequired: true,
    tenantKeyColumn: 'tenant_key',
    isolationLevel: 'logical_row_level',
    status: 'partial_runtime',
    risk: 'Cross-tenant row read or write if a query forgets the tenant_key predicate or RLS policy regresses.',
    mitigation: 'Every tenant-scoped table must declare tenant_key NOT NULL, ship a deny-by-default RLS policy, and route reads through helpers that bind tenant_key at the call site.',
    auditRequirement: 'Every persisted state change on a tenant-scoped row must emit a unified audit event that carries tenantKey.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
  {
    kind: 'storage',
    id: 'storage-postgres-shared-config',
    label: 'Postgres tenant configuration schema',
    surface: 'persistence.postgres.tenant_config',
    store: 'postgres.tenant_config',
    rowLevelSecurityRequired: true,
    tenantKeyColumn: 'tenant_key',
    isolationLevel: 'schema_isolated',
    status: 'contract_only',
    risk: 'Tenant configuration leaks (feature flags, role overrides) if shared schema is read without the tenant_key filter.',
    mitigation: 'Tenant config tables live in their own schema with a deny-by-default RLS policy and are read only through tenant-bound helpers.',
    auditRequirement: 'Configuration mutations must emit a unified audit event of type governance_decision with tenantKey set.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
  {
    kind: 'storage',
    id: 'storage-customer-private-warm-cache',
    label: 'Customer private warm cache',
    surface: 'persistence.customer-private.warm-cache',
    store: 'customer.private.warm_cache',
    rowLevelSecurityRequired: false,
    tenantKeyColumn: 'tenant_key',
    isolationLevel: 'customer_private_data_plane',
    status: 'deferred',
    risk: 'A future customer-private deployment that shares a warm cache region across tenants would re-introduce the cross-tenant read path that S7 closed.',
    mitigation: 'Customer-private deployments must run a per-tenant cache namespace and refuse to start without a tenant_key environment binding.',
    auditRequirement: 'Cache fills and evictions must emit a unified audit event with tenantKey when the cache holds tenant-scoped values.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
  // ---- vector ---------------------------------------------------------
  {
    kind: 'vector',
    id: 'vector-evidence-index',
    label: 'Evidence vector index',
    surface: 'vector.evidence',
    indexFamily: 'pgvector',
    mandatoryFilterField: 'tenant_key',
    isolationLevel: 'logical_row_level',
    status: 'contract_only',
    risk: 'Cross-tenant retrieval from a shared vector index if the tenant_key filter is omitted from the query plan.',
    mitigation: 'Vector queries must go through a helper that injects the tenant_key filter and refuses to run when tenant_key is empty.',
    auditRequirement: 'Every vector retrieval used by a deliverable or recommendation must record an evidence_used audit event with tenantKey.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
  // ---- graph ---------------------------------------------------------
  {
    kind: 'graph',
    id: 'graph-knowledge-fabric',
    label: 'Knowledge fabric graph store',
    surface: 'graph.knowledge-fabric',
    graphFamily: 'pg-graph',
    tenantPropertyName: 'tenant_key',
    isolationLevel: 'database_isolated',
    status: 'contract_only',
    risk: 'Cross-tenant traversal if a node lacks the tenant_key property or a traversal helper omits the tenant predicate.',
    mitigation: 'Graph mutations must enforce tenant_key on every node and edge; traversal helpers must take tenant_key as a required argument.',
    auditRequirement: 'Knowledge fabric writes must emit a tool_invocation or governance_decision audit event with tenantKey.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
  // ---- model gateway -------------------------------------------------
  {
    kind: 'model_gateway',
    id: 'gateway-tenant-binding',
    label: 'Model gateway tenant binding',
    surface: 'model_gateway.invocation',
    tenantKeyRequiredOnInvocation: true,
    rejectEmptyTenantKey: true,
    isolationLevel: 'environment_isolated',
    status: 'contract_only',
    risk: 'A gateway call without a tenant key could mix tenant evidence into a single prompt context or fan a tenant request to the wrong downstream lane.',
    mitigation: 'The gateway contract requires tenantKey on every invocation, refuses empty tenantKey, and pins each tenant to its allowed model lane.',
    auditRequirement: 'Every gateway invocation must emit a model_gateway_decision audit event with tenantKey and decisionRationale.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
  // ---- audit ---------------------------------------------------------
  {
    kind: 'audit',
    id: 'audit-tenant-scoped-events',
    label: 'Tenant-scoped audit event coverage',
    surface: 'audit.unified-events',
    tenantScopedEventTypes: [
      'agent_recommendation',
      'agent_handoff',
      'evidence_used',
      'evidence_blocked',
      'tool_invocation',
      'model_gateway_decision',
      'gate_check',
      'gate_transition',
      'deliverable_generated',
      'deliverable_approved',
      'deliverable_superseded',
      'user_action',
      'readiness_update',
      'route_smoke_result',
      'governance_decision',
    ],
    isolationLevel: 'logical_row_level',
    status: 'partial_runtime',
    risk: 'A tenant action without an audit event would leave no replay trail and would erode tenant accountability.',
    mitigation: 'Every unified audit event type must carry tenantKey; surfaces that produce tenant-scoped events must validate before emission.',
    auditRequirement: 'Audit events themselves must be tenantKey-bound; review tooling must reject empty tenantKey before persistence.',
    createdFrom: 'deterministic_tenant_isolation_seed',
  },
];

// ---------------------------------------------------------------------
// Helpers - all return readonly views.
// ---------------------------------------------------------------------

export function listTenantIsolationLevels(): readonly TenantIsolationLevel[] {
  return TENANT_ISOLATION_LEVELS;
}

export function buildTenantDataBoundaryModel(): readonly TenantDataBoundary[] {
  return SEED_BOUNDARIES;
}

function emptyByKind(): Record<TenantDataBoundary['kind'], number> {
  return {
    storage: 0,
    vector: 0,
    graph: 0,
    model_gateway: 0,
    audit: 0,
  };
}

function emptyByIsolationLevel(): Record<TenantIsolationLevel, number> {
  const out = {} as Record<TenantIsolationLevel, number>;
  for (const level of TENANT_ISOLATION_LEVELS) {
    out[level] = 0;
  }
  return out;
}

function emptyByStatus(): Record<TenantBoundaryStatus, number> {
  return {
    contract_only: 0,
    partial_runtime: 0,
    enforced_runtime: 0,
    deferred: 0,
  };
}

export function summarizeTenantIsolationBoundaries(
  boundaries: readonly TenantDataBoundary[] = SEED_BOUNDARIES,
): TenantIsolationSummary {
  const byKind = emptyByKind();
  const byIsolationLevel = emptyByIsolationLevel();
  const byStatus = emptyByStatus();
  let boundariesWithAuditRequirement = 0;
  let boundariesWithMitigation = 0;

  for (const boundary of boundaries) {
    byKind[boundary.kind] += 1;
    byIsolationLevel[boundary.isolationLevel] += 1;
    byStatus[boundary.status] += 1;
    if (boundary.auditRequirement.trim().length > 0) {
      boundariesWithAuditRequirement += 1;
    }
    if (boundary.mitigation.trim().length > 0) {
      boundariesWithMitigation += 1;
    }
  }

  return {
    totalBoundaries: boundaries.length,
    byKind,
    byIsolationLevel,
    byStatus,
    boundariesWithAuditRequirement,
    boundariesWithMitigation,
  };
}

export function validateTenantBoundary(
  boundary: TenantDataBoundary,
): { isValid: boolean; findings: readonly TenantIsolationFinding[] } {
  const findings: TenantIsolationFinding[] = [];

  if (!boundary.id || boundary.id.trim().length === 0) {
    findings.push({
      boundaryId: boundary.id ?? '',
      severity: 'error',
      reason: 'missing id',
    });
  }
  if (!boundary.label || boundary.label.trim().length === 0) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: 'missing label',
    });
  }
  if (!boundary.surface || boundary.surface.trim().length === 0) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: 'missing surface',
    });
  }
  if (!TENANT_ISOLATION_LEVELS.includes(boundary.isolationLevel)) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: `unknown isolationLevel: ${String(boundary.isolationLevel)}`,
    });
  }
  if (!boundary.risk || boundary.risk.trim().length === 0) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: 'missing risk',
    });
  }
  if (!boundary.mitigation || boundary.mitigation.trim().length === 0) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: 'missing mitigation',
    });
  }
  if (
    !boundary.auditRequirement ||
    boundary.auditRequirement.trim().length === 0
  ) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: 'missing auditRequirement',
    });
  }
  if (boundary.createdFrom !== 'deterministic_tenant_isolation_seed') {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: 'createdFrom must be deterministic_tenant_isolation_seed',
    });
  }

  // Status-vs-claim sanity. We never let a contract-only boundary
  // claim enforced_runtime by accident, and we never emit a status
  // value outside the allowed set.
  const allowedStatuses: readonly TenantBoundaryStatus[] = [
    'contract_only',
    'partial_runtime',
    'enforced_runtime',
    'deferred',
  ];
  if (!allowedStatuses.includes(boundary.status)) {
    findings.push({
      boundaryId: boundary.id,
      severity: 'error',
      reason: `unknown status: ${String(boundary.status)}`,
    });
  }

  // Kind-specific structural checks.
  if (boundary.kind === 'storage') {
    if (!boundary.store || boundary.store.trim().length === 0) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'storage boundary missing store',
      });
    }
    if (!boundary.tenantKeyColumn || boundary.tenantKeyColumn.trim().length === 0) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'storage boundary missing tenantKeyColumn',
      });
    }
  } else if (boundary.kind === 'vector') {
    if (!boundary.indexFamily || boundary.indexFamily.trim().length === 0) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'vector boundary missing indexFamily',
      });
    }
    if (
      !boundary.mandatoryFilterField ||
      boundary.mandatoryFilterField.trim().length === 0
    ) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'vector boundary missing mandatoryFilterField',
      });
    }
  } else if (boundary.kind === 'graph') {
    if (!boundary.graphFamily || boundary.graphFamily.trim().length === 0) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'graph boundary missing graphFamily',
      });
    }
    if (
      !boundary.tenantPropertyName ||
      boundary.tenantPropertyName.trim().length === 0
    ) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'graph boundary missing tenantPropertyName',
      });
    }
  } else if (boundary.kind === 'model_gateway') {
    if (boundary.tenantKeyRequiredOnInvocation !== true) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'model_gateway boundary must require tenantKey on every invocation',
      });
    }
    if (boundary.rejectEmptyTenantKey !== true) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'model_gateway boundary must reject empty tenantKey',
      });
    }
  } else if (boundary.kind === 'audit') {
    if (
      !Array.isArray(boundary.tenantScopedEventTypes) ||
      boundary.tenantScopedEventTypes.length === 0
    ) {
      findings.push({
        boundaryId: boundary.id,
        severity: 'error',
        reason: 'audit boundary must list at least one tenantScopedEventType',
      });
    }
  }

  return {
    isValid: findings.every((finding) => finding.severity !== 'error'),
    findings,
  };
}
