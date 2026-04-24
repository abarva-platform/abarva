import { notFound } from 'next/navigation';
import { findTenantByRouteSlug } from '@/lib/deliverables/seed-route-resolver';
import { isTowerSubsurfaceSlug } from '@/lib/integrity/route-catalog';
import { SeedTenantTowerSubsurface } from '@/components/deliverables/SeedRouteShell';
import { assertTenantAccess } from '@/lib/auth/tenant-access';

export default async function TenantTowerSubsurfacePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; surface: string }>;
}) {
  const { tenantSlug, surface } = await params;
  await assertTenantAccess(tenantSlug);
  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant || !isTowerSubsurfaceSlug(surface)) notFound();

  return <SeedTenantTowerSubsurface tenant={tenant} surface={surface} />;
}
