import type { EvidenceStrength } from '@/components/admin/EvidenceStrengthPill';
import type { ContextLiveStatus } from '@/components/admin/ContextBar';
import { buildAgentContextAsync } from '@/lib/agent/context-bundle';
import {
  computeAllPostures,
  type AgentPosture as AgentFoundationPosture,
} from '@/lib/agent/posture';
import { generateStewardEditorial } from '@/lib/agent/editorial';
import { buildAgentChoices, type AgentChoice } from '@/lib/agent/choices';
import {
  getArchitectureComponents,
  getArchitecturePlanes,
  getAzureTargetArchitecture,
} from '@/lib/admin/data/admin-architecture-adapter';
import {
  adminArchitectureComponentsFixture,
  adminArchitecturePlanesFixture,
  adminAzureTargetArchitectureFixture,
} from '@/lib/admin/data/fixtures/admin-architecture-fixture';
import type {
  ArchitectureComponentRecord,
  ArchitecturePlaneRecord,
  AzureFlowEdgeRecord,
  AzureServiceRecord,
  AzureTargetArchitectureSnapshot,
} from '@/lib/admin/data/admin-architecture-adapter-types';

/**
 * ADMIN-DATA9 — Architecture page-view.
 *
 * Concept-level platform manifest. The plane / component / Azure target
 * data is concept-level (shared across tenants today); ADMIN-DATA9 lifted
 * the deterministic seed behind `admin-architecture-adapter` so a future
 * per-tenant deployment overlay can wire in without reshaping callers.
 *
 * Module-level constants (`ARCHITECTURE_PLANES`, `PLANE_COMPONENTS`,
 * `AZURE_SERVICES`, `AZURE_TARGET_ARCHITECTURE`) are preserved as a stable
 * synchronous read of the fixture for test/import sites that predate the
 * adapter; new callers should prefer the async adapter or
 * `buildArchitecturePageView()`.
 */

const DEFAULT_TENANT_SLUG = 'apex-retail';

export interface ArchitecturePlane {
  id: string;
  label: string;
  components: ReadonlyArray<string>;
}

export type ComponentState = 'active' | 'partial' | 'deferred';

export interface PlaneComponent {
  id: string;
  planeId: string;
  label: string;
  routePath?: string;
  codePath: string;
  state: ComponentState;
  dependencies: ReadonlyArray<string>;
  summary: string;
}

export interface AzureService {
  id: string;
  label: string;
  category: 'compute' | 'data' | 'storage' | 'security' | 'observability' | 'ai';
  role: string;
  state: ComponentState;
}

export interface AzureFlowEdge {
  from: string;
  to: string;
  label: string;
}

// Type-system bridge: the adapter records are structurally identical to the
// historical view-model types; cast through `as` so adapter outputs satisfy
// the exported view-model types without re-declaring the data.
function toPlanes(records: ReadonlyArray<ArchitecturePlaneRecord>): ReadonlyArray<ArchitecturePlane> {
  return records as ReadonlyArray<ArchitecturePlane>;
}

function toComponents(
  records: ReadonlyArray<ArchitectureComponentRecord>,
): ReadonlyArray<PlaneComponent> {
  return records as ReadonlyArray<PlaneComponent>;
}

function toAzureServices(records: ReadonlyArray<AzureServiceRecord>): ReadonlyArray<AzureService> {
  return records as ReadonlyArray<AzureService>;
}

function toAzureEdges(records: ReadonlyArray<AzureFlowEdgeRecord>): ReadonlyArray<AzureFlowEdge> {
  return records as ReadonlyArray<AzureFlowEdge>;
}

function toAzureTarget(snapshot: AzureTargetArchitectureSnapshot): {
  services: ReadonlyArray<AzureService>;
  edges: ReadonlyArray<AzureFlowEdge>;
} {
  return {
    services: toAzureServices(snapshot.services),
    edges: toAzureEdges(snapshot.edges),
  };
}

/**
 * Module-level constants — synchronous projections of the deterministic
 * fixture. Preserved verbatim from pre-DATA9 for historic import sites
 * (ADMIN17 tests, ADMIN4 tests, sibling components).
 */
export const ARCHITECTURE_PLANES: ReadonlyArray<ArchitecturePlane> = toPlanes(
  adminArchitecturePlanesFixture(DEFAULT_TENANT_SLUG),
);

export const PLANE_COMPONENTS: ReadonlyArray<PlaneComponent> = toComponents(
  adminArchitectureComponentsFixture(DEFAULT_TENANT_SLUG),
);

export const AZURE_SERVICES: ReadonlyArray<AzureService> = toAzureServices(
  adminAzureTargetArchitectureFixture(DEFAULT_TENANT_SLUG).services,
);

export const AZURE_TARGET_ARCHITECTURE: {
  services: ReadonlyArray<AzureService>;
  edges: ReadonlyArray<AzureFlowEdge>;
} = toAzureTarget(adminAzureTargetArchitectureFixture(DEFAULT_TENANT_SLUG));

export type ArchitectureView = 'core' | 'azure';

export interface ArchitecturePageView {
  eyebrow: string;
  title: string;
  subtitle: string;
  context: {
    tenant: string;
    mode: string;
    agent: string;
    data: string;
    liveStatus: string;
    liveStatusKind: ContextLiveStatus;
  };
  editorial: {
    title: string;
    body: string;
    contextUsed: ReadonlyArray<string>;
    evidenceStrength: EvidenceStrength;
    blocker?: string;
    primaryAction: { label: string; href: string };
  };
  planes: ReadonlyArray<ArchitecturePlane>;
  planeComponents: ReadonlyArray<PlaneComponent>;
  componentDetailMap: Readonly<Record<string, PlaneComponent>>;
  azureServices: ReadonlyArray<AzureService>;
  azureTargetArchitecture: {
    services: ReadonlyArray<AzureService>;
    edges: ReadonlyArray<AzureFlowEdge>;
  };
  primaryAgentLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  deterministicSeed: true;
  agentChoices?: ReadonlyArray<AgentChoice>;
  agentPostures?: ReadonlyArray<AgentFoundationPosture>;
}

export function getComponentsForPlane(planeId: string): ReadonlyArray<PlaneComponent> {
  return PLANE_COMPONENTS.filter((c) => c.planeId === planeId);
}

export function getComponentById(componentId: string): PlaneComponent | undefined {
  return PLANE_COMPONENTS.find((c) => c.id === componentId);
}

function buildComponentDetailMap(
  components: ReadonlyArray<PlaneComponent>,
): Readonly<Record<string, PlaneComponent>> {
  const map: Record<string, PlaneComponent> = {};
  for (const c of components) {
    map[c.id] = c;
  }
  return map;
}

export async function buildArchitecturePageView(
  tenantSlug: string = DEFAULT_TENANT_SLUG,
): Promise<ArchitecturePageView> {
  const ctx = await buildAgentContextAsync(tenantSlug, 'admin', 'architecture');
  const editorial = generateStewardEditorial(ctx);
  const choices = buildAgentChoices(ctx, 3);
  const postures = computeAllPostures(ctx);

  const [planeRecords, componentRecords, azureSnapshot] = await Promise.all([
    getArchitecturePlanes(tenantSlug),
    getArchitectureComponents(tenantSlug),
    getAzureTargetArchitecture(tenantSlug),
  ]);

  const planes = toPlanes(planeRecords);
  const planeComponents = toComponents(componentRecords);
  const azureTargetArchitecture = toAzureTarget(azureSnapshot);

  return {
    eyebrow: 'How AbarVa works end to end',
    title: 'Architecture',
    subtitle:
      'The canvas explains the app, agents, context, evidence, data plane, gateway, tools, governance, and Azure/private data-plane target.',
    context: {
      tenant: ctx.tenant.name,
      mode: 'Setup/Admin',
      agent: 'Steward',
      data: 'Manifest + seeds',
      liveStatus: 'Deferred',
      liveStatusKind: 'deferred',
    },
    editorial: {
      title: editorial.title,
      body: editorial.body,
      contextUsed: editorial.contextUsed,
      evidenceStrength: editorial.evidenceStrength,
      blocker: editorial.blocker ?? undefined,
      primaryAction: editorial.primaryAction,
    },
    planes,
    planeComponents,
    componentDetailMap: buildComponentDetailMap(planeComponents),
    azureServices: azureTargetArchitecture.services,
    azureTargetArchitecture,
    primaryAgentLabel: 'Steward',
    primaryActionLabel: 'Open Azure story',
    primaryActionHref: '/admin/architecture#azure',
    deterministicSeed: true,
    agentChoices: choices,
    agentPostures: postures,
  };
}
