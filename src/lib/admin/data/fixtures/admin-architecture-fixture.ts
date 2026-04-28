/**
 * ADMIN-DATA9 — Admin architecture fixture.
 *
 * Deterministic seed describing the AbarVa platform: 7 architecture planes,
 * their constituent components, and the Wave 24 Azure target architecture.
 *
 * Architecture data is concept-level (not tenant-scoped); the tenantSlug
 * parameter is reserved for future per-tenant deployment overlays. The
 * shape here was previously inlined in `src/lib/admin/architecture-page-view.ts`
 * — DATA9 lifts it behind the adapter without changing values.
 */

import type {
  ArchitectureComponentRecord,
  ArchitecturePlaneRecord,
  AzureServiceRecord,
  AzureTargetArchitectureSnapshot,
} from '../admin-architecture-adapter-types';

const ARCHITECTURE_PLANES_FIXTURE: ReadonlyArray<ArchitecturePlaneRecord> = [
  { id: 'app', label: 'App Plane', components: ['Programs', 'Source', 'Intelligence', 'Tower', 'Admin'] },
  { id: 'agent', label: 'Agent Plane', components: ['Nexus', 'Sentinel', 'Atlas', 'Steward'] },
  { id: 'context', label: 'Context Plane', components: ['Work object', 'state', 'evidence', 'missing inputs'] },
  { id: 'evidence', label: 'Evidence Plane', components: ['Datasets', 'artifacts', 'claims', 'confidence'] },
  { id: 'data', label: 'Data Plane', components: ['Postgres', 'Blob', 'vector/search', 'graph'] },
  { id: 'gateway', label: 'Gateway + Tools', components: ['Policy', 'audit', 'cost', 'redaction'] },
  { id: 'deployment', label: 'Deployment', components: ['SaaS', 'dedicated tenant', 'private data plane'] },
];

const ARCHITECTURE_COMPONENTS_FIXTURE: ReadonlyArray<ArchitectureComponentRecord> = [
  // App Plane
  {
    id: 'programs',
    planeId: 'app',
    label: 'Programs',
    routePath: '/tenant/[slug]/programs',
    codePath: 'src/app/(maestro)/tenant/[slug]/programs/page.tsx',
    state: 'active',
    dependencies: ['nexus', 'context', 'evidence'],
    summary: 'Program timeline and phase-gate workspace per tenant.',
  },
  {
    id: 'source',
    planeId: 'app',
    label: 'Source',
    routePath: '/source',
    codePath: 'src/app/(maestro)/source/page.tsx',
    state: 'active',
    dependencies: ['nexus', 'data'],
    summary: 'Dataset / connector / artifact source surface.',
  },
  {
    id: 'intelligence',
    planeId: 'app',
    label: 'Intelligence',
    routePath: '/intelligence',
    codePath: 'src/app/intelligence/page.tsx',
    state: 'active',
    dependencies: ['atlas', 'context', 'evidence'],
    summary: 'Conversational intelligence workspace.',
  },
  {
    id: 'tower',
    planeId: 'app',
    label: 'Tower',
    routePath: '/tower',
    codePath: 'src/app/tower/page.tsx',
    state: 'active',
    dependencies: ['atlas', 'sentinel'],
    summary: 'Control tower — pressure cards and operational signals.',
  },
  {
    id: 'admin',
    planeId: 'app',
    label: 'Admin',
    routePath: '/admin',
    codePath: 'src/app/(maestro)/admin/page.tsx',
    state: 'active',
    dependencies: ['steward'],
    summary: 'Admin canon shell and seven canonical setup pages.',
  },

  // Agent Plane
  {
    id: 'nexus',
    planeId: 'agent',
    label: 'Nexus',
    codePath: 'src/lib/nexus/orchestrator.ts',
    state: 'partial',
    dependencies: ['context-bundle', 'gateway'],
    summary: 'Surface-spanning orchestrator agent (deterministic stub).',
  },
  {
    id: 'sentinel',
    planeId: 'agent',
    label: 'Sentinel',
    codePath: 'src/lib/agent/sentinel.ts',
    state: 'partial',
    dependencies: ['evidence', 'context-bundle'],
    summary: 'Pattern + posture monitor surfacing risks.',
  },
  {
    id: 'atlas',
    planeId: 'agent',
    label: 'Atlas',
    codePath: 'src/lib/agent/atlas.ts',
    state: 'partial',
    dependencies: ['context-bundle', 'evidence'],
    summary: 'Intelligence + tower analyst agent.',
  },
  {
    id: 'steward',
    planeId: 'agent',
    label: 'Steward',
    codePath: 'src/lib/agent/editorial.ts',
    state: 'active',
    dependencies: ['context-bundle', 'posture'],
    summary: 'Setup/Admin editorial agent shipping in AGENT1.',
  },

  // Context Plane
  {
    id: 'work-object',
    planeId: 'context',
    label: 'Work object',
    codePath: 'src/lib/agent/context-bundle.ts',
    state: 'active',
    dependencies: ['programs', 'source'],
    summary: 'Per-turn work-object context (program, dataset, asset).',
  },
  {
    id: 'state',
    planeId: 'context',
    label: 'State',
    codePath: 'src/lib/agent/context-bundle.ts',
    state: 'active',
    dependencies: ['work-object'],
    summary: 'Five canonical context-bundle states.',
  },
  {
    id: 'evidence-context',
    planeId: 'context',
    label: 'Evidence',
    codePath: 'src/lib/agent/context-bundle.ts',
    state: 'partial',
    dependencies: ['evidence'],
    summary: 'Evidence references inside the context bundle.',
  },
  {
    id: 'missing-inputs',
    planeId: 'context',
    label: 'Missing inputs',
    codePath: 'src/lib/agent/context-bundle.ts',
    state: 'active',
    dependencies: ['work-object'],
    summary: 'Declared gaps that drive caveats and choices.',
  },

  // Evidence Plane
  {
    id: 'datasets',
    planeId: 'evidence',
    label: 'Datasets',
    codePath: 'src/lib/admin/dataset-domain-inventory.ts',
    state: 'active',
    dependencies: ['data'],
    summary: 'Dataset inventory and trust-rung manifest.',
  },
  {
    id: 'artifacts',
    planeId: 'evidence',
    label: 'Artifacts',
    codePath: 'src/lib/admin/evidence-manifest-model.ts',
    state: 'partial',
    dependencies: ['datasets'],
    summary: 'Artifact lineage and confidence bands.',
  },
  {
    id: 'claims',
    planeId: 'evidence',
    label: 'Claims',
    codePath: 'src/lib/admin/evidence-manifest-model.ts',
    state: 'partial',
    dependencies: ['artifacts'],
    summary: 'Claim graph linking artifacts to outputs.',
  },
  {
    id: 'confidence',
    planeId: 'evidence',
    label: 'Confidence',
    codePath: 'src/lib/admin/dataset-trust-model.ts',
    state: 'active',
    dependencies: ['claims'],
    summary: 'Five-rung trust model and evidence pills.',
  },

  // Data Plane
  {
    id: 'postgres',
    planeId: 'data',
    label: 'Postgres',
    codePath: 'src/lib/db/client.ts',
    state: 'active',
    dependencies: [],
    summary: 'Primary relational store (Vercel Postgres in prod).',
  },
  {
    id: 'blob',
    planeId: 'data',
    label: 'Blob',
    codePath: 'src/lib/storage/blob.ts',
    state: 'partial',
    dependencies: [],
    summary: 'Object storage for artifacts (Vercel Blob today, Azure Blob target).',
  },
  {
    id: 'vector-search',
    planeId: 'data',
    label: 'Vector / search',
    codePath: 'src/lib/search/index.ts',
    state: 'deferred',
    dependencies: ['postgres'],
    summary: 'Semantic search index — Azure AI Search target (Wave 27).',
  },
  {
    id: 'graph',
    planeId: 'data',
    label: 'Graph',
    codePath: 'src/lib/graph/edges.ts',
    state: 'deferred',
    dependencies: ['postgres'],
    summary: 'Entity edge graph (deferred).',
  },

  // Gateway + Tools
  {
    id: 'policy',
    planeId: 'gateway',
    label: 'Policy',
    codePath: 'src/lib/gateway/policy.ts',
    state: 'partial',
    dependencies: ['steward'],
    summary: 'Per-tenant model + tool allow / redact policy.',
  },
  {
    id: 'audit',
    planeId: 'gateway',
    label: 'Audit',
    codePath: 'src/lib/gateway/audit.ts',
    state: 'partial',
    dependencies: ['policy'],
    summary: 'Append-only audit trail for agent calls.',
  },
  {
    id: 'cost',
    planeId: 'gateway',
    label: 'Cost',
    codePath: 'src/lib/gateway/cost.ts',
    state: 'deferred',
    dependencies: ['audit'],
    summary: 'Per-tenant cost ledger (Wave 27).',
  },
  {
    id: 'redaction',
    planeId: 'gateway',
    label: 'Redaction',
    codePath: 'src/lib/gateway/redaction.ts',
    state: 'partial',
    dependencies: ['policy'],
    summary: 'Inline PII / secret scrubbing on outbound calls.',
  },

  // Deployment
  {
    id: 'saas',
    planeId: 'deployment',
    label: 'SaaS',
    codePath: 'src/lib/deployment/saas.ts',
    state: 'active',
    dependencies: [],
    summary: 'Default Vercel SaaS deployment.',
  },
  {
    id: 'dedicated-tenant',
    planeId: 'deployment',
    label: 'Dedicated tenant',
    codePath: 'src/lib/deployment/dedicated.ts',
    state: 'deferred',
    dependencies: ['saas'],
    summary: 'Single-tenant Vercel deploy (Wave 27).',
  },
  {
    id: 'private-data-plane',
    planeId: 'deployment',
    label: 'Private data plane',
    codePath: 'docs/platform-design/16_PRIVATE_DATA_PLANE.md',
    state: 'deferred',
    dependencies: ['dedicated-tenant'],
    summary: 'Customer-owned Azure subscription target (Wave 27+).',
  },
];

const AZURE_SERVICES_FIXTURE: ReadonlyArray<AzureServiceRecord> = [
  {
    id: 'container-apps',
    label: 'Azure Container Apps',
    category: 'compute',
    role: 'Hosts AbarVa app + agent runtime in customer subscription.',
    state: 'deferred',
  },
  {
    id: 'postgresql',
    label: 'Azure Database for PostgreSQL',
    category: 'data',
    role: 'Primary relational store inside the private data plane.',
    state: 'deferred',
  },
  {
    id: 'blob',
    label: 'Azure Blob Storage',
    category: 'storage',
    role: 'Artifact and dataset object store.',
    state: 'deferred',
  },
  {
    id: 'key-vault',
    label: 'Azure Key Vault',
    category: 'security',
    role: 'Secrets, model keys, and per-tenant credentials.',
    state: 'deferred',
  },
  {
    id: 'app-insights',
    label: 'Azure Application Insights',
    category: 'observability',
    role: 'Telemetry, traces, and audit ingestion.',
    state: 'deferred',
  },
  {
    id: 'ai-search',
    label: 'Azure AI Search',
    category: 'ai',
    role: 'Vector + lexical search over evidence corpus.',
    state: 'deferred',
  },
];

const AZURE_TARGET_ARCHITECTURE_FIXTURE: AzureTargetArchitectureSnapshot = {
  services: AZURE_SERVICES_FIXTURE,
  edges: [
    { from: 'container-apps', to: 'postgresql', label: 'reads/writes' },
    { from: 'container-apps', to: 'blob', label: 'artifacts' },
    { from: 'container-apps', to: 'key-vault', label: 'secrets' },
    { from: 'container-apps', to: 'app-insights', label: 'telemetry' },
    { from: 'container-apps', to: 'ai-search', label: 'queries' },
  ],
};

// tenantSlug is reserved for a future per-tenant overlay (e.g. "is this plane
// deployed for tenant X"). Today the seed is identical for every tenant; we
// touch the argument with a void cast so the API surface signals tenant-scope
// without tripping unused-arg lints.
export function adminArchitecturePlanesFixture(
  tenantSlug: string,
): ReadonlyArray<ArchitecturePlaneRecord> {
  void tenantSlug;
  return ARCHITECTURE_PLANES_FIXTURE;
}

export function adminArchitectureComponentsFixture(
  tenantSlug: string,
): ReadonlyArray<ArchitectureComponentRecord> {
  void tenantSlug;
  return ARCHITECTURE_COMPONENTS_FIXTURE;
}

export function adminAzureTargetArchitectureFixture(
  tenantSlug: string,
): AzureTargetArchitectureSnapshot {
  void tenantSlug;
  return AZURE_TARGET_ARCHITECTURE_FIXTURE;
}
