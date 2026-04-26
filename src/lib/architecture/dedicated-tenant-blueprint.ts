// TEN3 - Dedicated Tenant Deployment Blueprint.
//
// Deterministic, file-pure read model that documents the canonical
// deployment shape for an AbarVa Tier 2 (Enterprise SaaS / Dedicated
// Tenant) onboarding: dedicated database / dedicated storage / dedicated
// vector + graph namespaces / per-tenant model gateway policy / per-
// tenant audit boundary / customer SSO / tenant admin / onboarding
// sequence / upgrade strategy / backup-retention / cost-ops posture.
//
// TEN3 is a *shape* contract. It is the read-only complement to TEN1
// (SaaS tenancy architecture) and TEN2 (tenant isolation enforcement).
// It does not provision infrastructure, does not authenticate, does
// not run RLS, does not migrate, and does not call any vendor SDK.
// It exists so reviewers, founders, and future provisioning code can
// agree on the same dedicated-tenant deployment envelope.
//
// Hard rules (also asserted by the test):
//   - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
//   - No imports from `@/lib/auth/**`, `@/lib/source/**`,
//     `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/nexus/**`,
//     `@/lib/agent/**`, or any supabase client.
//   - No vendor model name (`anthropic`, `openai`, etc.) appears.
//   - No false claim that this blueprint is production-ready or
//     production-certified. Every store records its own residual
//     `risk` and a `mitigation` paragraph that names the next required
//     step before any tenant graduates onto it.

import type { TenantIsolationLevel } from '@/lib/architecture/tenant-isolation-boundary';

// ---------------------------------------------------------------------
// Canonical readiness states for the dedicated-tenant blueprint.
// ---------------------------------------------------------------------

export const DEDICATED_TENANT_READINESS_STATES = [
  'contract_only',
  'lab_validated',
  'pilot_ready',
  'enterprise_ready',
  'deferred',
] as const;

export type DedicatedTenantReadinessState =
  typeof DEDICATED_TENANT_READINESS_STATES[number];

// ---------------------------------------------------------------------
// Canonical store kinds inside a dedicated tenant namespace.
// ---------------------------------------------------------------------

export const DEDICATED_TENANT_STORE_KINDS = [
  'database',
  'storage',
  'vector',
  'graph',
  'model_gateway',
  'audit',
] as const;

export type DedicatedTenantStoreKind =
  typeof DEDICATED_TENANT_STORE_KINDS[number];

// ---------------------------------------------------------------------
// Canonical onboarding step kinds.
// ---------------------------------------------------------------------

export const DEDICATED_TENANT_ONBOARDING_STEP_KINDS = [
  'initialize_tenant_record',
  'provision_data_stores',
  'wire_customer_sso',
  'seed_tenant_roles',
  'register_tenant_admin',
  'activate_model_gateway_policy',
  'enable_audit_boundary',
  'set_up_agents',
  'verify_tenant_smoke',
] as const;

export type DedicatedTenantOnboardingStepKind =
  typeof DEDICATED_TENANT_ONBOARDING_STEP_KINDS[number];

// ---------------------------------------------------------------------
// Canonical operational responsibility surfaces.
// ---------------------------------------------------------------------

export const DEDICATED_TENANT_OPERATIONAL_SURFACES = [
  'upgrade_strategy',
  'maintenance_windows',
  'backup_retention',
  'disaster_recovery',
  'secret_rotation',
  'cost_observability',
  'tenant_offboarding',
  'incident_response',
] as const;

export type DedicatedTenantOperationalSurface =
  typeof DEDICATED_TENANT_OPERATIONAL_SURFACES[number];

// ---------------------------------------------------------------------
// Canonical readiness checklist categories.
// ---------------------------------------------------------------------

export const DEDICATED_TENANT_CHECKLIST_CATEGORIES = [
  'data_plane',
  'identity',
  'governance',
  'operations',
  'cost',
] as const;

export type DedicatedTenantChecklistCategory =
  typeof DEDICATED_TENANT_CHECKLIST_CATEGORIES[number];

// ---------------------------------------------------------------------
// Typed deployment shapes.
// ---------------------------------------------------------------------

export interface DedicatedTenantDeploymentEnvelope {
  /** Stable id for the envelope (not a tenant id). */
  id: string;
  /** Human-facing label used in admin / readiness surfaces. */
  label: string;
  /** Tier name from TEN1 — always 'enterprise_dedicated' here. */
  tier: 'enterprise_dedicated';
  /** Default isolation level (TEN2 ladder). */
  defaultIsolationLevel: TenantIsolationLevel;
  /** Fallback isolation level if dedicated DB is unavailable. */
  fallbackIsolationLevel: TenantIsolationLevel;
  /** Readiness state of the envelope today. */
  readiness: DedicatedTenantReadinessState;
  /** One-line summary of what the envelope guarantees. */
  summary: string;
  /** Stable provenance tag — never live runtime origin. */
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantDataStore {
  kind: DedicatedTenantStoreKind;
  /** Stable id for the store entry. */
  id: string;
  /** Label used in the readiness surface. */
  label: string;
  /** Where the store lives in the data evidence plane. */
  surface: string;
  /** Default option that AbarVa offers (e.g., dedicated Postgres
   *  Flexible Server). Generic on purpose, never a vendor key. */
  defaultOption: string;
  /** Fallback option when the default is not commercially viable. */
  fallbackOption: string;
  /** TEN2 isolation level achieved by this store. */
  isolationLevel: TenantIsolationLevel;
  /** Readiness today. */
  readiness: DedicatedTenantReadinessState;
  /** Residual risk if this store regresses to a shared boundary. */
  risk: string;
  /** Mitigation that must remain in place to keep the boundary honest. */
  mitigation: string;
  /** Whether this store carries tenant content (vs metadata). */
  carriesTenantContent: boolean;
  /** Stable provenance tag. */
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantIsolationControl {
  /** Stable id for the control (e.g., 'control-vector-namespace'). */
  id: string;
  /** Human-facing label. */
  label: string;
  /** Which canonical store kind this control protects. */
  storeKind: DedicatedTenantStoreKind;
  /** TEN2 isolation level the control enforces. */
  isolationLevel: TenantIsolationLevel;
  /** What the control does in plain language. */
  controlStatement: string;
  /** What must be true for the control to remain honest. */
  enforcementRule: string;
  /** Audit requirement that records every cross-boundary action. */
  auditRequirement: string;
  /** Stable provenance tag. */
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantOnboardingStep {
  /** Canonical kind. */
  kind: DedicatedTenantOnboardingStepKind;
  /** Sequence index (1-based, contiguous, unique). */
  sequence: number;
  /** Stable id (kind-bound). */
  id: string;
  /** Label used in the onboarding runbook. */
  label: string;
  /** What this step accomplishes. */
  description: string;
  /** Roles / parties responsible for this step. */
  responsibleParties: readonly string[];
  /** Pre-conditions that must hold before the step runs. */
  preconditions: readonly string[];
  /** Post-conditions that must hold after the step runs. */
  postconditions: readonly string[];
  /** Stable provenance tag. */
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantOperationalResponsibility {
  /** Canonical surface. */
  surface: DedicatedTenantOperationalSurface;
  /** Stable id. */
  id: string;
  /** Label used in the operational runbook. */
  label: string;
  /** Party that owns this surface for a Tier 2 tenant. */
  ownership:
    | 'abarva_platform'
    | 'shared_abarva_and_tenant'
    | 'tenant';
  /** What the surface promises. */
  responsibilityStatement: string;
  /** Cadence / window for the responsibility. */
  cadence: string;
  /** Audit requirement that must record execution of this surface. */
  auditRequirement: string;
  /** Stable provenance tag. */
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantReadinessChecklistItem {
  category: DedicatedTenantChecklistCategory;
  /** Stable id. */
  id: string;
  /** Label used in the readiness checklist. */
  label: string;
  /** What must be true. */
  requirement: string;
  /** Readiness state of this item today. */
  readiness: DedicatedTenantReadinessState;
  /** Blocker description if readiness < pilot_ready. */
  blocker: string;
  /** Stable provenance tag. */
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantReadinessChecklist {
  items: readonly DedicatedTenantReadinessChecklistItem[];
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

export interface DedicatedTenantDeploymentModel {
  envelope: DedicatedTenantDeploymentEnvelope;
  dataStores: readonly DedicatedTenantDataStore[];
  isolationControls: readonly DedicatedTenantIsolationControl[];
  onboardingSequence: readonly DedicatedTenantOnboardingStep[];
  operationalResponsibilities: readonly DedicatedTenantOperationalResponsibility[];
  readinessChecklist: DedicatedTenantReadinessChecklist;
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed';
}

// ---------------------------------------------------------------------
// Validation finding type.
// ---------------------------------------------------------------------

export type DedicatedTenantBlueprintFindingSeverity =
  | 'info'
  | 'warning'
  | 'error';

export interface DedicatedTenantBlueprintFinding {
  ref: string;
  severity: DedicatedTenantBlueprintFindingSeverity;
  reason: string;
}

// ---------------------------------------------------------------------
// Summary type.
// ---------------------------------------------------------------------

export interface DedicatedTenantReadinessSummary {
  totalDataStores: number;
  storeKindsCovered: readonly DedicatedTenantStoreKind[];
  controlsByStoreKind: Record<DedicatedTenantStoreKind, number>;
  storesByReadiness: Record<DedicatedTenantReadinessState, number>;
  onboardingStepCount: number;
  operationalSurfacesCovered: readonly DedicatedTenantOperationalSurface[];
  checklistItemsByCategory: Record<DedicatedTenantChecklistCategory, number>;
  checklistItemsByReadiness: Record<DedicatedTenantReadinessState, number>;
}

// ---------------------------------------------------------------------
// Seed values.
// ---------------------------------------------------------------------

const SEED_ENVELOPE: DedicatedTenantDeploymentEnvelope = {
  id: 'envelope-enterprise-dedicated',
  label: 'AbarVa Enterprise SaaS / Dedicated Tenant',
  tier: 'enterprise_dedicated',
  defaultIsolationLevel: 'database_isolated',
  fallbackIsolationLevel: 'schema_isolated',
  readiness: 'contract_only',
  summary:
    'Per-tenant database, storage bucket, vector and graph namespaces, model gateway policy, audit stream, and customer SSO inside AbarVa-managed infrastructure. Application runtime remains shared but every read and every gateway call is bound to the tenant key.',
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
};

const SEED_DATA_STORES: readonly DedicatedTenantDataStore[] = [
  {
    kind: 'database',
    id: 'store-database-postgres-flexible',
    label: 'Per-tenant Postgres Flexible Server',
    surface: 'data_evidence_plane.database',
    defaultOption: 'dedicated managed Postgres Flexible Server per tenant',
    fallbackOption: 'dedicated schema inside a managed Postgres pool with row-level security',
    isolationLevel: 'database_isolated',
    readiness: 'contract_only',
    risk: 'A shared Postgres pool that serves more than one tenant would re-introduce the cross-tenant read path that TEN2 closed.',
    mitigation: 'Provisioning binds one logical database per tenant; the schema-per-tenant fallback ships deny-by-default RLS plus a tenant-bound connection helper.',
    carriesTenantContent: true,
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'storage',
    id: 'store-storage-blob-bucket',
    label: 'Per-tenant object storage bucket',
    surface: 'data_evidence_plane.storage',
    defaultOption: 'dedicated cloud blob container per tenant with managed-identity access and public network access disabled',
    fallbackOption: 'dedicated S3-style bucket per tenant with bucket policy bound to the tenant principal',
    isolationLevel: 'database_isolated',
    readiness: 'contract_only',
    risk: 'A shared bucket would let a misconfigured signed URL leak a deliverable artifact to another tenant.',
    mitigation: 'Each tenant gets its own container, accessed only through a tenant-bound storage helper; no public network access; signed URLs are scoped to the tenant.',
    carriesTenantContent: true,
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'vector',
    id: 'store-vector-evidence-namespace',
    label: 'Per-tenant evidence vector namespace',
    surface: 'data_evidence_plane.vector',
    defaultOption: 'dedicated vector namespace per tenant inside the managed pgvector index',
    fallbackOption: 'dedicated index per tenant in an external vector store',
    isolationLevel: 'schema_isolated',
    readiness: 'contract_only',
    risk: 'A shared vector index without a tenant-key filter would return cross-tenant evidence chunks to the agent.',
    mitigation: 'Vector helpers refuse to run without a resolved tenant key and scope every query to the tenant namespace.',
    carriesTenantContent: true,
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'graph',
    id: 'store-graph-knowledge-namespace',
    label: 'Per-tenant knowledge graph namespace',
    surface: 'data_evidence_plane.graph',
    defaultOption: 'dedicated graph namespace per tenant inside the managed pg-graph store',
    fallbackOption: 'dedicated graph database per tenant in an external graph engine',
    isolationLevel: 'schema_isolated',
    readiness: 'contract_only',
    risk: 'A shared graph traversal without a tenant predicate would surface another tenant’s knowledge fabric edges.',
    mitigation: 'Graph helpers require a tenant key on every traversal and reject empty tenant keys.',
    carriesTenantContent: true,
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'model_gateway',
    id: 'store-gateway-policy',
    label: 'Per-tenant model gateway policy',
    surface: 'model_gateway_plane.policy',
    defaultOption: 'shared gateway image with per-tenant routing keys, per-tenant model allowlist, per-tenant rate limit, and per-tenant audit destination',
    fallbackOption: 'shared gateway image with per-tenant routing keys and a row-scoped audit ledger',
    isolationLevel: 'environment_isolated',
    readiness: 'contract_only',
    risk: 'A gateway call without a tenant policy could fan a Tier 2 tenant request to a model lane the tenant has not approved.',
    mitigation: 'Gateway resolves the tenant policy from the registry on every invocation; calls without a tenant policy are rejected; per-tenant allowlist pins the model lane.',
    carriesTenantContent: true,
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'audit',
    id: 'store-audit-stream',
    label: 'Per-tenant audit log boundary',
    surface: 'audit_plane.tenant-stream',
    defaultOption: 'dedicated tenant audit stream with configurable retention and tenant-scoped export',
    fallbackOption: 'shared audit ledger row-scoped on tenant key with enforced per-tenant filter on every read',
    isolationLevel: 'schema_isolated',
    readiness: 'contract_only',
    risk: 'An audit row written without a tenant key, or a shared ledger read without a tenant filter, would leave the tenant without a trustworthy replay trail.',
    mitigation: 'Every audit emitter takes the tenant key as a required argument; readers require a tenant filter; export tooling refuses an empty tenant key.',
    carriesTenantContent: false,
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
];

const SEED_ISOLATION_CONTROLS: readonly DedicatedTenantIsolationControl[] = [
  {
    id: 'control-database-tenant-binding',
    label: 'Database connection is tenant-bound',
    storeKind: 'database',
    isolationLevel: 'database_isolated',
    controlStatement:
      'Every database connection used by tenant runtime code resolves the tenant database from the tenant registry and binds the tenant key onto the session.',
    enforcementRule:
      'Direct shared-pool clients are forbidden; the only allowed entry point is the tenant-bound client factory.',
    auditRequirement:
      'Every persisted state change emits a unified audit event that carries the tenant key.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    id: 'control-storage-bucket-binding',
    label: 'Object storage access is tenant-bound',
    storeKind: 'storage',
    isolationLevel: 'database_isolated',
    controlStatement:
      'Every object read or write resolves the tenant bucket from the tenant registry and uses a managed-identity credential scoped to the tenant principal.',
    enforcementRule:
      'No code path may construct a storage client without a tenant key; signed URLs are tenant-scoped and time-bounded.',
    auditRequirement:
      'Every artifact read or write emits an evidence_used or deliverable_generated audit event with the tenant key.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    id: 'control-vector-namespace-filter',
    label: 'Vector queries carry a tenant namespace filter',
    storeKind: 'vector',
    isolationLevel: 'schema_isolated',
    controlStatement:
      'Every vector retrieval used by an agent or a deliverable carries the tenant namespace filter and refuses to run when the tenant key is empty.',
    enforcementRule:
      'Vector helpers expose only tenant-bound query entry points; cross-tenant retrieval is forbidden.',
    auditRequirement:
      'Every retrieval emits an evidence_used audit event with the tenant key and the namespace identifier.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    id: 'control-graph-tenant-predicate',
    label: 'Graph traversals carry a tenant predicate',
    storeKind: 'graph',
    isolationLevel: 'schema_isolated',
    controlStatement:
      'Every traversal helper takes the tenant key as a required argument and refuses to run with an empty tenant key.',
    enforcementRule:
      'Graph mutations enforce the tenant property on every node and edge; traversals refuse to cross namespaces.',
    auditRequirement:
      'Knowledge fabric writes emit a tool_invocation or governance_decision audit event with the tenant key.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    id: 'control-gateway-policy-binding',
    label: 'Model gateway resolves a per-tenant policy on every call',
    storeKind: 'model_gateway',
    isolationLevel: 'environment_isolated',
    controlStatement:
      'The gateway resolves the tenant policy (allowlist, rate limit, audit destination) from the registry on every invocation and rejects calls without a tenant key.',
    enforcementRule:
      'No agent or runtime path may import a provider SDK directly; the gateway is the single chokepoint.',
    auditRequirement:
      'Every gateway invocation emits a model_gateway_decision audit event with the tenant key and the resolved decision rationale.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    id: 'control-audit-tenant-key-binding',
    label: 'Audit events are tenant-key bound',
    storeKind: 'audit',
    isolationLevel: 'schema_isolated',
    controlStatement:
      'Every unified audit event type carries the tenant key; surfaces that produce tenant-scoped events validate the key before emission.',
    enforcementRule:
      'Audit readers require a tenant filter; export tooling refuses an empty tenant key; cross-tenant audit reads are forbidden.',
    auditRequirement:
      'Audit pipeline writes are themselves audited at the platform-control level with the tenant key recorded.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
];

const SEED_ONBOARDING_SEQUENCE: readonly DedicatedTenantOnboardingStep[] = [
  {
    kind: 'initialize_tenant_record',
    sequence: 1,
    id: 'onboard-1-initialize-tenant-record',
    label: 'Initialize tenant registry record',
    description:
      'Write the canonical tenant registry record (tenantId, tenantSlug, displayName, tier, isolationMode, governance posture, region, lifecycleState=provisioning).',
    responsibleParties: ['abarva_platform_ops'],
    preconditions: [
      'Founder has approved the dedicated-tenant onboarding for this customer.',
      'Tenant slug is reserved and unique.',
    ],
    postconditions: [
      'Tenant registry contains the new tenant in lifecycle state provisioning.',
      'No tenant content has been written yet.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'provision_data_stores',
    sequence: 2,
    id: 'onboard-2-provision-data-stores',
    label: 'Provision dedicated data stores',
    description:
      'Provision the per-tenant database, object storage container, vector namespace, and graph namespace; bind each to the tenant registry record.',
    responsibleParties: ['abarva_platform_ops'],
    preconditions: [
      'Tenant registry record exists in lifecycle state provisioning.',
    ],
    postconditions: [
      'Tenant database, storage bucket, vector namespace, and graph namespace exist.',
      'No application code paths use the new stores until SSO and roles are in place.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'wire_customer_sso',
    sequence: 3,
    id: 'onboard-3-wire-customer-sso',
    label: 'Wire customer SSO / IdP',
    description:
      'Wire the customer identity provider (Google Workspace, Microsoft Entra ID, Okta, custom SAML) into the tenant SSO profile and bind it to the tenant registry record.',
    responsibleParties: ['abarva_platform_ops', 'tenant_admin'],
    preconditions: [
      'Customer has named the IdP and provided the tenant SSO contract.',
      'Tenant registry record exists.',
    ],
    postconditions: [
      'Tenant users can authenticate against their own IdP.',
      'No AbarVa platform admin can sign in as a tenant user.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'seed_tenant_roles',
    sequence: 4,
    id: 'onboard-4-seed-tenant-roles',
    label: 'Seed canonical tenant roles',
    description:
      'Seed the canonical role set (admin, maestro, client viewer, data owner, governance reviewer, executive sponsor) and any contracted custom roles.',
    responsibleParties: ['abarva_platform_ops', 'tenant_admin'],
    preconditions: [
      'Customer SSO is wired.',
      'Tenant admin contact is identified.',
    ],
    postconditions: [
      'Canonical roles exist in the tenant.',
      'Tenant admin has admin role; AbarVa platform admins do not.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'register_tenant_admin',
    sequence: 5,
    id: 'onboard-5-register-tenant-admin',
    label: 'Register tenant administrator',
    description:
      'Register the named customer-side administrator and confirm the separation between AbarVa platform administrators and tenant administrators.',
    responsibleParties: ['tenant_admin'],
    preconditions: [
      'Tenant role set is seeded.',
      'Customer has named the tenant admin in writing.',
    ],
    postconditions: [
      'Tenant admin holds the admin role inside the customer organization.',
      'AbarVa platform admins hold no tenant role inside the customer tenant.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'activate_model_gateway_policy',
    sequence: 6,
    id: 'onboard-6-activate-model-gateway-policy',
    label: 'Activate per-tenant model gateway policy',
    description:
      'Bind the tenant gateway profile (model allowlist, rate limit, audit destination) into the gateway and confirm the policy is loaded on the next invocation.',
    responsibleParties: ['abarva_platform_ops'],
    preconditions: [
      'Tenant data stores are provisioned.',
      'Tenant admin is registered.',
    ],
    postconditions: [
      'Gateway resolves the tenant policy on every invocation for this tenant.',
      'No invocation reaches a model lane outside the tenant allowlist.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'enable_audit_boundary',
    sequence: 7,
    id: 'onboard-7-enable-audit-boundary',
    label: 'Enable per-tenant audit boundary',
    description:
      'Enable the dedicated tenant audit stream (or row-scoped audit with strong filter guarantees) and confirm tenant-scoped retention and export.',
    responsibleParties: ['abarva_platform_ops'],
    preconditions: [
      'Tenant data stores are provisioned.',
      'Tenant gateway policy is active.',
    ],
    postconditions: [
      'Tenant audit events flow to the dedicated stream with tenant key recorded.',
      'Tenant export tooling refuses an empty tenant key.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'set_up_agents',
    sequence: 8,
    id: 'onboard-8-set-up-agents',
    label: 'Set up agentic spine for tenant',
    description:
      'Bind the canonical agentic spine (Nexus, Sentinel, Atlas, Steward) to the tenant namespace; verify that every agent reads only tenant-namespace evidence and writes only tenant-namespace state.',
    responsibleParties: ['abarva_platform_ops'],
    preconditions: [
      'Tenant audit boundary is enabled.',
      'Tenant gateway policy is active.',
    ],
    postconditions: [
      'Each agent runs inside the tenant namespace per request.',
      'No agent reads or writes another tenant namespace.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    kind: 'verify_tenant_smoke',
    sequence: 9,
    id: 'onboard-9-verify-tenant-smoke',
    label: 'Verify tenant smoke and lift to active',
    description:
      'Run the deterministic tenant-smoke harness (canonical surfaces render, agentic spine resolves the tenant key, audit events emit with tenant key, gateway policy is enforced); lift the tenant lifecycle state from provisioning to active.',
    responsibleParties: ['abarva_platform_ops', 'tenant_admin'],
    preconditions: [
      'All earlier onboarding steps have completed.',
    ],
    postconditions: [
      'Tenant lifecycle state is active.',
      'Smoke harness recorded a passing run with named correlation ids.',
    ],
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
];

const SEED_OPERATIONAL_RESPONSIBILITIES: readonly DedicatedTenantOperationalResponsibility[] =
  [
    {
      surface: 'upgrade_strategy',
      id: 'ops-upgrade-strategy',
      label: 'Per-tenant rolling upgrade strategy',
      ownership: 'abarva_platform',
      responsibilityStatement:
        'AbarVa rolls runtime upgrades per tenant in a rolling fashion, never simultaneously across all tenants; tenants in elevated lifecycle states (e.g., a regulated audit window) opt out of a given wave.',
      cadence:
        'rolling, per-tenant; an upgrade wave touches at most one tenant at a time',
      auditRequirement:
        'Every tenant upgrade emits a governance_decision audit event in the tenant audit stream with the upgrade revision and rationale.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'maintenance_windows',
      id: 'ops-maintenance-windows',
      label: 'Per-tenant maintenance windows',
      ownership: 'shared_abarva_and_tenant',
      responsibilityStatement:
        'Each tenant negotiates its own maintenance window; AbarVa never schedules an invasive change outside the contracted window without the tenant admin’s explicit approval.',
      cadence:
        'per-tenant calendar; tenant admin approves any out-of-window change in writing',
      auditRequirement:
        'Out-of-window changes emit a governance_decision audit event with the tenant admin’s named approval reference.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'backup_retention',
      id: 'ops-backup-retention',
      label: 'Per-tenant backup and retention',
      ownership: 'abarva_platform',
      responsibilityStatement:
        'AbarVa runs tenant-scoped backups of the per-tenant database, storage bucket, vector namespace, and graph namespace; retention follows the tenant’s contracted retention.',
      cadence:
        'daily backup of each tenant data store; retention follows the contracted tenant retention; tenant export available on request',
      auditRequirement:
        'Backup runs emit a governance_decision audit event in the tenant audit stream; restore tests emit a tool_invocation audit event.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'disaster_recovery',
      id: 'ops-disaster-recovery',
      label: 'Per-tenant disaster recovery posture',
      ownership: 'abarva_platform',
      responsibilityStatement:
        'AbarVa documents the tenant RPO and RTO targets per data store; multi-region active-active is explicitly deferred per TEN1 §K.',
      cadence:
        'annual DR exercise per tenant or on contract; lessons folded back into the tenant runbook',
      auditRequirement:
        'DR exercises emit a governance_decision audit event with the recorded RPO and RTO observed.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'secret_rotation',
      id: 'ops-secret-rotation',
      label: 'Per-tenant secret rotation',
      ownership: 'abarva_platform',
      responsibilityStatement:
        'AbarVa rotates per-tenant secrets (gateway routing keys, storage credentials, audit destination tokens) on the contracted cadence; tenant admin is notified of any forced rotation.',
      cadence:
        'every 90 days at most; emergency rotation on any signal of compromise',
      auditRequirement:
        'Rotations emit a governance_decision audit event with the secret class rotated and the rationale.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'cost_observability',
      id: 'ops-cost-observability',
      label: 'Per-tenant cost and ops observability',
      ownership: 'abarva_platform',
      responsibilityStatement:
        'AbarVa tracks per-tenant runtime cost (compute, storage, vector / graph capacity, gateway model spend) and surfaces it to the tenant admin without exposing per-tenant content to the AbarVa control plane.',
      cadence:
        'monthly cost rollup per tenant; near-real-time gateway spend per tenant',
      auditRequirement:
        'Cost rollups emit a readiness_update audit event in the tenant audit stream.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'tenant_offboarding',
      id: 'ops-tenant-offboarding',
      label: 'Per-tenant offboarding and decommission',
      ownership: 'shared_abarva_and_tenant',
      responsibilityStatement:
        'On offboarding, AbarVa exports the tenant’s data per the contracted retention, then decommissions the tenant data stores; the tenant registry record moves to retired and is never reused.',
      cadence:
        'on contract end or tenant request; deterministic offboarding runbook',
      auditRequirement:
        'Offboarding emits a governance_decision audit event chain (export, decommission, registry retirement).',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
    {
      surface: 'incident_response',
      id: 'ops-incident-response',
      label: 'Per-tenant incident response',
      ownership: 'shared_abarva_and_tenant',
      responsibilityStatement:
        'AbarVa runs the incident-response runbook with the tenant admin in the loop; tenant content is not shared with parties outside the tenant during incident handling.',
      cadence:
        'on incident; named on-call rotation; tenant admin notified within the contracted window',
      auditRequirement:
        'Incident handling emits a governance_decision audit event chain captured in the tenant audit stream.',
      createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
    },
  ];

const SEED_CHECKLIST_ITEMS: readonly DedicatedTenantReadinessChecklistItem[] = [
  {
    category: 'data_plane',
    id: 'check-dataplane-database',
    label: 'Per-tenant database is provisioned and tenant-bound',
    requirement:
      'Tenant has its own database (or schema fallback) and every tenant runtime read goes through a tenant-bound client.',
    readiness: 'contract_only',
    blocker:
      'Provisioning automation for per-tenant Postgres and the tenant-bound client factory are not yet implemented.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'data_plane',
    id: 'check-dataplane-storage',
    label: 'Per-tenant storage bucket is provisioned and tenant-bound',
    requirement:
      'Tenant has its own object-storage container; signed URLs are tenant-scoped; public network access is disabled.',
    readiness: 'contract_only',
    blocker:
      'Provisioning automation for per-tenant buckets and the tenant-bound storage helper are not yet implemented.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'data_plane',
    id: 'check-dataplane-vector',
    label: 'Per-tenant vector namespace is provisioned',
    requirement:
      'Tenant has its own vector namespace; vector helpers refuse to run without a tenant key.',
    readiness: 'contract_only',
    blocker:
      'Live vector retrieval is not yet wired; namespace provisioning is contract-only.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'data_plane',
    id: 'check-dataplane-graph',
    label: 'Per-tenant graph namespace is provisioned',
    requirement:
      'Tenant has its own graph namespace; traversal helpers require the tenant key.',
    readiness: 'contract_only',
    blocker:
      'Live knowledge fabric graph store is not yet wired; namespace provisioning is contract-only.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'identity',
    id: 'check-identity-customer-sso',
    label: 'Customer SSO is wired for the tenant',
    requirement:
      'Tenant users authenticate via the customer IdP; AbarVa platform admins cannot sign in as tenant users.',
    readiness: 'contract_only',
    blocker:
      'Per-tenant SSO federation provisioning is contract-only; no customer IdP wire-up automation is available yet.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'identity',
    id: 'check-identity-tenant-admin',
    label: 'Named tenant administrator is registered',
    requirement:
      'Customer has named the tenant admin in writing; tenant admin holds the admin role; AbarVa platform admins do not.',
    readiness: 'contract_only',
    blocker:
      'Tenant admin registration runbook is contract-only; founder approval gate must run before any registration.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'governance',
    id: 'check-governance-gateway-policy',
    label: 'Per-tenant model gateway policy is active',
    requirement:
      'Tenant gateway policy (allowlist, rate limit, audit destination) is bound and enforced on every invocation.',
    readiness: 'contract_only',
    blocker:
      'Live gateway is not yet wired; policy resolution is contract-only via MG2 / MG3.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'governance',
    id: 'check-governance-audit-boundary',
    label: 'Per-tenant audit boundary is enabled',
    requirement:
      'Tenant audit events flow to a dedicated stream (or row-scoped audit with strong filter guarantees) with tenant-scoped retention and export.',
    readiness: 'contract_only',
    blocker:
      'Production-grade audit ledger persistence is deferred per TEN1; current state is contract-only via AUD2.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'operations',
    id: 'check-operations-upgrade-window',
    label: 'Per-tenant upgrade and maintenance windows are documented',
    requirement:
      'Tenant has a named maintenance window and an upgrade cadence; out-of-window changes require the tenant admin’s named approval.',
    readiness: 'contract_only',
    blocker:
      'Upgrade orchestration runbook is contract-only; no per-tenant rolling upgrade automation exists yet.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'operations',
    id: 'check-operations-backup-retention',
    label: 'Per-tenant backup and retention runs on cadence',
    requirement:
      'Tenant data stores are backed up daily; retention follows the contracted policy; restore tests run on cadence.',
    readiness: 'contract_only',
    blocker:
      'Per-tenant backup runner is not yet wired; retention is documented but not enforced.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
  {
    category: 'cost',
    id: 'check-cost-rollup',
    label: 'Per-tenant cost rollup is exposed to the tenant admin',
    requirement:
      'Tenant admin sees per-tenant compute, storage, vector / graph capacity, and gateway spend without exposing per-tenant content to the AbarVa control plane.',
    readiness: 'contract_only',
    blocker:
      'Cost observability ingestion is deferred; current state is contract-only.',
    createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
  },
];

const SEED_READINESS_CHECKLIST: DedicatedTenantReadinessChecklist = {
  items: SEED_CHECKLIST_ITEMS,
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
};

const SEED_BLUEPRINT: DedicatedTenantDeploymentModel = {
  envelope: SEED_ENVELOPE,
  dataStores: SEED_DATA_STORES,
  isolationControls: SEED_ISOLATION_CONTROLS,
  onboardingSequence: SEED_ONBOARDING_SEQUENCE,
  operationalResponsibilities: SEED_OPERATIONAL_RESPONSIBILITIES,
  readinessChecklist: SEED_READINESS_CHECKLIST,
  createdFrom: 'deterministic_dedicated_tenant_blueprint_seed',
};

// ---------------------------------------------------------------------
// Helpers - all return readonly views.
// ---------------------------------------------------------------------

export function listDedicatedTenantReadinessStates(): readonly DedicatedTenantReadinessState[] {
  return DEDICATED_TENANT_READINESS_STATES;
}

export function listDedicatedTenantStoreKinds(): readonly DedicatedTenantStoreKind[] {
  return DEDICATED_TENANT_STORE_KINDS;
}

export function listDedicatedTenantOnboardingStepKinds(): readonly DedicatedTenantOnboardingStepKind[] {
  return DEDICATED_TENANT_ONBOARDING_STEP_KINDS;
}

export function listDedicatedTenantOperationalSurfaces(): readonly DedicatedTenantOperationalSurface[] {
  return DEDICATED_TENANT_OPERATIONAL_SURFACES;
}

export function listDedicatedTenantChecklistCategories(): readonly DedicatedTenantChecklistCategory[] {
  return DEDICATED_TENANT_CHECKLIST_CATEGORIES;
}

export function buildDedicatedTenantBlueprint(): DedicatedTenantDeploymentModel {
  return SEED_BLUEPRINT;
}

function emptyControlsByStoreKind(): Record<DedicatedTenantStoreKind, number> {
  const out = {} as Record<DedicatedTenantStoreKind, number>;
  for (const kind of DEDICATED_TENANT_STORE_KINDS) {
    out[kind] = 0;
  }
  return out;
}

function emptyByReadiness(): Record<DedicatedTenantReadinessState, number> {
  const out = {} as Record<DedicatedTenantReadinessState, number>;
  for (const state of DEDICATED_TENANT_READINESS_STATES) {
    out[state] = 0;
  }
  return out;
}

function emptyByChecklistCategory(): Record<
  DedicatedTenantChecklistCategory,
  number
> {
  const out = {} as Record<DedicatedTenantChecklistCategory, number>;
  for (const category of DEDICATED_TENANT_CHECKLIST_CATEGORIES) {
    out[category] = 0;
  }
  return out;
}

export function summarizeDedicatedTenantReadiness(
  blueprint: DedicatedTenantDeploymentModel = SEED_BLUEPRINT,
): DedicatedTenantReadinessSummary {
  const controlsByStoreKind = emptyControlsByStoreKind();
  const storesByReadiness = emptyByReadiness();
  const checklistItemsByCategory = emptyByChecklistCategory();
  const checklistItemsByReadiness = emptyByReadiness();

  for (const control of blueprint.isolationControls) {
    controlsByStoreKind[control.storeKind] += 1;
  }
  for (const store of blueprint.dataStores) {
    storesByReadiness[store.readiness] += 1;
  }
  for (const item of blueprint.readinessChecklist.items) {
    checklistItemsByCategory[item.category] += 1;
    checklistItemsByReadiness[item.readiness] += 1;
  }

  const storeKindsCovered = blueprint.dataStores
    .map((store) => store.kind)
    .filter((kind, index, arr) => arr.indexOf(kind) === index);

  const operationalSurfacesCovered = blueprint.operationalResponsibilities
    .map((entry) => entry.surface)
    .filter((surface, index, arr) => arr.indexOf(surface) === index);

  return {
    totalDataStores: blueprint.dataStores.length,
    storeKindsCovered,
    controlsByStoreKind,
    storesByReadiness,
    onboardingStepCount: blueprint.onboardingSequence.length,
    operationalSurfacesCovered,
    checklistItemsByCategory,
    checklistItemsByReadiness,
  };
}

function pushFinding(
  findings: DedicatedTenantBlueprintFinding[],
  ref: string,
  reason: string,
): void {
  findings.push({ ref, severity: 'error', reason });
}

export function validateDedicatedTenantBlueprint(
  blueprint: DedicatedTenantDeploymentModel = SEED_BLUEPRINT,
): {
  isValid: boolean;
  findings: readonly DedicatedTenantBlueprintFinding[];
} {
  const findings: DedicatedTenantBlueprintFinding[] = [];

  // Envelope.
  if (blueprint.envelope.tier !== 'enterprise_dedicated') {
    pushFinding(
      findings,
      blueprint.envelope.id,
      'envelope tier must be enterprise_dedicated',
    );
  }
  if (
    blueprint.envelope.createdFrom !==
    'deterministic_dedicated_tenant_blueprint_seed'
  ) {
    pushFinding(
      findings,
      blueprint.envelope.id,
      'envelope createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
    );
  }

  // Data stores: every canonical kind must appear at least once.
  const seenKinds = new Set<DedicatedTenantStoreKind>();
  const seenStoreIds = new Set<string>();
  for (const store of blueprint.dataStores) {
    seenKinds.add(store.kind);
    if (seenStoreIds.has(store.id)) {
      pushFinding(findings, store.id, 'duplicate data store id');
    }
    seenStoreIds.add(store.id);
    if (
      !store.id ||
      !store.label ||
      !store.surface ||
      !store.defaultOption ||
      !store.fallbackOption ||
      !store.risk ||
      !store.mitigation
    ) {
      pushFinding(
        findings,
        store.id || '<missing-id>',
        'data store missing required field (id/label/surface/defaultOption/fallbackOption/risk/mitigation)',
      );
    }
    if (
      store.createdFrom !==
      'deterministic_dedicated_tenant_blueprint_seed'
    ) {
      pushFinding(
        findings,
        store.id,
        'data store createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
      );
    }
  }
  for (const kind of DEDICATED_TENANT_STORE_KINDS) {
    if (!seenKinds.has(kind)) {
      pushFinding(
        findings,
        `dataStores.${kind}`,
        `dataStores must include at least one entry of kind ${kind}`,
      );
    }
  }

  // Isolation controls: every control names a known storeKind.
  const seenControlIds = new Set<string>();
  for (const control of blueprint.isolationControls) {
    if (seenControlIds.has(control.id)) {
      pushFinding(findings, control.id, 'duplicate isolation control id');
    }
    seenControlIds.add(control.id);
    if (
      !DEDICATED_TENANT_STORE_KINDS.includes(control.storeKind)
    ) {
      pushFinding(
        findings,
        control.id,
        `unknown storeKind: ${String(control.storeKind)}`,
      );
    }
    if (
      !control.controlStatement ||
      !control.enforcementRule ||
      !control.auditRequirement
    ) {
      pushFinding(
        findings,
        control.id,
        'isolation control missing required field (controlStatement/enforcementRule/auditRequirement)',
      );
    }
    if (
      control.createdFrom !==
      'deterministic_dedicated_tenant_blueprint_seed'
    ) {
      pushFinding(
        findings,
        control.id,
        'isolation control createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
      );
    }
  }

  // Onboarding sequence: contiguous 1..n, unique kinds, unique sequence,
  // unique ids.
  const seenSequence = new Set<number>();
  const seenStepIds = new Set<string>();
  const seenStepKinds = new Set<DedicatedTenantOnboardingStepKind>();
  const sortedSteps = [...blueprint.onboardingSequence].sort(
    (a, b) => a.sequence - b.sequence,
  );
  for (let index = 0; index < sortedSteps.length; index += 1) {
    const step = sortedSteps[index];
    if (step.sequence !== index + 1) {
      pushFinding(
        findings,
        step.id,
        `onboarding sequence must be contiguous 1..n; expected ${index + 1}, got ${step.sequence}`,
      );
    }
    if (seenSequence.has(step.sequence)) {
      pushFinding(findings, step.id, 'duplicate onboarding sequence number');
    }
    seenSequence.add(step.sequence);
    if (seenStepIds.has(step.id)) {
      pushFinding(findings, step.id, 'duplicate onboarding step id');
    }
    seenStepIds.add(step.id);
    if (seenStepKinds.has(step.kind)) {
      pushFinding(findings, step.id, 'duplicate onboarding step kind');
    }
    seenStepKinds.add(step.kind);
    if (
      step.responsibleParties.length === 0 ||
      step.preconditions.length === 0 ||
      step.postconditions.length === 0
    ) {
      pushFinding(
        findings,
        step.id,
        'onboarding step missing responsibleParties / preconditions / postconditions',
      );
    }
    if (
      step.createdFrom !==
      'deterministic_dedicated_tenant_blueprint_seed'
    ) {
      pushFinding(
        findings,
        step.id,
        'onboarding step createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
      );
    }
  }
  for (const kind of DEDICATED_TENANT_ONBOARDING_STEP_KINDS) {
    if (!seenStepKinds.has(kind)) {
      pushFinding(
        findings,
        `onboarding.${kind}`,
        `onboarding sequence must include kind ${kind}`,
      );
    }
  }

  // Operational responsibilities: every canonical surface appears at
  // least once.
  const seenSurfaces = new Set<DedicatedTenantOperationalSurface>();
  for (const entry of blueprint.operationalResponsibilities) {
    if (seenSurfaces.has(entry.surface)) {
      pushFinding(
        findings,
        entry.id,
        `duplicate operational surface ${entry.surface}`,
      );
    }
    seenSurfaces.add(entry.surface);
    if (
      !entry.responsibilityStatement ||
      !entry.cadence ||
      !entry.auditRequirement
    ) {
      pushFinding(
        findings,
        entry.id,
        'operational responsibility missing required field',
      );
    }
    if (
      entry.createdFrom !==
      'deterministic_dedicated_tenant_blueprint_seed'
    ) {
      pushFinding(
        findings,
        entry.id,
        'operational responsibility createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
      );
    }
  }
  for (const surface of DEDICATED_TENANT_OPERATIONAL_SURFACES) {
    if (!seenSurfaces.has(surface)) {
      pushFinding(
        findings,
        `operational.${surface}`,
        `operational responsibilities must include surface ${surface}`,
      );
    }
  }

  // Readiness checklist: every category appears at least once and every
  // item has a blocker if readiness < pilot_ready.
  const seenCategories = new Set<DedicatedTenantChecklistCategory>();
  for (const item of blueprint.readinessChecklist.items) {
    seenCategories.add(item.category);
    const isPreparing =
      item.readiness === 'contract_only' ||
      item.readiness === 'lab_validated' ||
      item.readiness === 'deferred';
    if (isPreparing && (!item.blocker || item.blocker.trim().length === 0)) {
      pushFinding(
        findings,
        item.id,
        'readiness checklist item below pilot_ready must declare a blocker',
      );
    }
    if (
      item.createdFrom !==
      'deterministic_dedicated_tenant_blueprint_seed'
    ) {
      pushFinding(
        findings,
        item.id,
        'checklist item createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
      );
    }
  }
  for (const category of DEDICATED_TENANT_CHECKLIST_CATEGORIES) {
    if (!seenCategories.has(category)) {
      pushFinding(
        findings,
        `checklist.${category}`,
        `readiness checklist must include category ${category}`,
      );
    }
  }

  if (
    blueprint.createdFrom !==
    'deterministic_dedicated_tenant_blueprint_seed'
  ) {
    pushFinding(
      findings,
      'blueprint',
      'blueprint createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
    );
  }
  if (
    blueprint.readinessChecklist.createdFrom !==
    'deterministic_dedicated_tenant_blueprint_seed'
  ) {
    pushFinding(
      findings,
      'blueprint.readinessChecklist',
      'readinessChecklist createdFrom must be deterministic_dedicated_tenant_blueprint_seed',
    );
  }

  return {
    isValid: findings.every((finding) => finding.severity !== 'error'),
    findings,
  };
}
