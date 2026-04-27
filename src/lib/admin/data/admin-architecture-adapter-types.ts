/**
 * ADMIN-DATA9 — Admin architecture adapter types.
 *
 * Architecture data is largely concept-level (planes, agents, Azure target
 * services) and shared across tenants. Per-tenant deployment state
 * (e.g. "is this plane active for tenant X") is anticipated but not yet
 * persisted, so the adapter accepts a tenantSlug today and ignores it for
 * fixture mode. The shape mirrors what `architecture-page-view` previously
 * inlined as module-level constants.
 */

export type ArchitectureComponentState = 'active' | 'partial' | 'deferred';

export interface ArchitecturePlaneRecord {
  id: string;
  label: string;
  components: ReadonlyArray<string>;
}

export interface ArchitectureComponentRecord {
  id: string;
  planeId: string;
  label: string;
  routePath?: string;
  codePath: string;
  state: ArchitectureComponentState;
  dependencies: ReadonlyArray<string>;
  summary: string;
}

export type AzureServiceCategory =
  | 'compute'
  | 'data'
  | 'storage'
  | 'security'
  | 'observability'
  | 'ai';

export interface AzureServiceRecord {
  id: string;
  label: string;
  category: AzureServiceCategory;
  role: string;
  state: ArchitectureComponentState;
}

export interface AzureFlowEdgeRecord {
  from: string;
  to: string;
  label: string;
}

export interface AzureTargetArchitectureSnapshot {
  services: ReadonlyArray<AzureServiceRecord>;
  edges: ReadonlyArray<AzureFlowEdgeRecord>;
}
