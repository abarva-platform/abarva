// TOWER4 · Tower Lens Tabs wired into tenant Tower page.
//
// Replaces the flat ProgramPressureCards + SeedTenantTower render with a
// four-tab lens surface: Portfolio · Scorecards · Pressure · Executive Brief.
//
// Tab switching is URL-searchParam-driven (?tab=<key>).
// No client state. Server component only.

import { notFound } from 'next/navigation';
import { TowerRouteShell } from '@/components/tower/TowerRouteShell';
import { TowerLensTabs } from '@/components/tower/TowerLensTabs';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';
import { resolveTowerTab } from '@/lib/tower/tower-lens-tabs-view';

export default async function TenantTowerSeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tenantSlug } = await params;
  const { tab } = await searchParams;

  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  const activeTab = resolveTowerTab(tab);
  const baseUrl = `/tenant/${tenantSlug}/tower`;

  return (
    <TowerRouteShell tenantName={tenant.displayName} activeLens={activeTab.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
      <TowerLensTabs
        tenant={tenant}
        activeTab={activeTab}
        baseUrl={baseUrl}
      />
    </TowerRouteShell>
  );
}
