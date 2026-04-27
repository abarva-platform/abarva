/**
 * ADMIN-DATA9 — Admin architecture adapter.
 *
 * Server-only async reader for the architecture plane manifest, plane
 * components, and the Azure target architecture. Fixture mode is the
 * default and returns the deterministic seed previously inlined in
 * `src/lib/admin/architecture-page-view.ts`.
 *
 * Architecture data is concept-level (planes, agents, target services) so
 * it does not require a DB table — `live` mode short-circuits to the same
 * deterministic seed rather than throwing `AdminDataMigrationPendingError`.
 * The tenantSlug parameter is preserved so a future per-tenant overlay
 * (e.g. "is this plane deployed for tenant X") can be wired without
 * reshaping callers.
 */

import type {
  ArchitectureComponentRecord,
  ArchitecturePlaneRecord,
  AzureTargetArchitectureSnapshot,
} from './admin-architecture-adapter-types';
import {
  adminArchitectureComponentsFixture,
  adminArchitecturePlanesFixture,
  adminAzureTargetArchitectureFixture,
} from './fixtures/admin-architecture-fixture';

export async function getArchitecturePlanes(
  tenantSlug: string,
): Promise<ReadonlyArray<ArchitecturePlaneRecord>> {
  return adminArchitecturePlanesFixture(tenantSlug);
}

export async function getArchitectureComponents(
  tenantSlug: string,
): Promise<ReadonlyArray<ArchitectureComponentRecord>> {
  return adminArchitectureComponentsFixture(tenantSlug);
}

export async function getAzureTargetArchitecture(
  tenantSlug: string,
): Promise<AzureTargetArchitectureSnapshot> {
  return adminAzureTargetArchitectureFixture(tenantSlug);
}

export async function getArchitectureComponentById(
  tenantSlug: string,
  componentId: string,
): Promise<ArchitectureComponentRecord | undefined> {
  const components = await getArchitectureComponents(tenantSlug);
  return components.find((c) => c.id === componentId);
}
