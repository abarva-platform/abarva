import { notFound } from 'next/navigation';
import { SeedTenantTower } from '@/components/deliverables/SeedRouteShell';
import { ProgramPressureCards } from '@/components/tower/ProgramPressureCards';
import { TowerRouteShell } from '@/components/tower/TowerRouteShell';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantTowerSeedPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) notFound();

  return (
    <TowerRouteShell tenantName={tenant.displayName} activeLens="Portfolio">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ProgramPressureCards tenant={tenant} />
        <SeedTenantTower tenant={tenant} />
      </div>
    </TowerRouteShell>
  );
}
